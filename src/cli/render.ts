import {
  mkdirSync,
  writeFileSync,
  existsSync,
  readFileSync,
  appendFileSync,
  readdirSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSpec } from "../spec/load";
import { directLines } from "../timeline/emotion";
import { synthesize } from "../tts/cache";
import { fitAudio, fitAudioGroup } from "../tts/fit";
import { buildTimeline } from "../timeline/build";
import { ass } from "../captions/ass";
import { lipSync } from "../lipsync/rhubarb";
import { capture } from "../render/capture";
import { mux } from "../render/encode";
import { qa } from "../qa/checks";
import { json, hash, local, run } from "../util";
export async function render(
  path: string,
  { dry = false, resume = false } = {},
) {
  const started = performance.now();
  let dir = "";
  let stage = "spec";
  const timing: any = {};
  let stageStart = started;
  const mark = (next: string) => {
    timing[stage] = (performance.now() - stageStart) / 1000;
    stage = next;
    stageStart = performance.now();
    if (dir)
      appendFileSync(`${dir}/log.txt`, `${new Date().toISOString()} ${next}\n`);
    console.log(`[${next}] ${path}`);
  };
  try {
    const spec = loadSpec(local(path));
    const missingVoices = spec.characters.filter((character) => !character.voice);
    if (
      missingVoices.length &&
      process.env.FISH_API_KEY &&
      (process.env.TTS_PROVIDER || "auto") !== "mock"
    ) {
      throw new Error(
        `Fish voice reference ID missing for character${missingVoices.length > 1 ? "s" : ""}: ${missingVoices.map((character) => character.id).join(", ")}. Check the environment variable used by each character's voice field in ${path}.`,
      );
    }
    const root = local(`out/${spec.id}`);
    mkdirSync(root, { recursive: true });
    const specHash = hash({
      spec,
      version: 1,
      model: process.env.FISH_MODEL || "s2-pro",
      provider: process.env.TTS_PROVIDER || "auto",
    });
    if (resume) {
      const completed = readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name.startsWith("run-"))
        .map((entry) => join(root, entry.name))
        .sort()
        .reverse();
      for (const candidate of completed) {
        if (!existsSync(`${candidate}/report.json`)) continue;
        const old = JSON.parse(
          readFileSync(`${candidate}/report.json`, "utf8"),
        );
        if (
          old.specHash === specHash &&
          old.passed &&
          existsSync(`${candidate}/video.mp4`)
        ) {
          console.log(`Resume: completed video at ${candidate}`);
          return { ...old, outputDir: candidate };
        }
      }
    }
    const stamp = new Date()
      .toISOString()
      .replaceAll(":", "-")
      .replace(".", "-");
    const prefix = `run-${stamp}`;
    dir = join(root, prefix);
    for (let suffix = 1; existsSync(dir); suffix++)
      dir = join(root, `${prefix}-${suffix}`);
    mkdirSync(dir);
    appendFileSync(
      `${dir}/log.txt`,
      `${new Date().toISOString()} start ${path}\n`,
    );
    console.log(`Output: ${dir}`);
    json(`${dir}/report.json`, {
      id: spec.id,
      outputDir: dir,
      specHash,
      status: "running",
      passed: false,
    });
    mark("tts");
    const directed = directLines(spec.lines, spec.seed, spec.voice_prompt),
      generated = [];
    for (const l of directed) {
      generated.push(
        await synthesize(
          l,
          spec.characters.find((c) => c.id === l.speaker)!.voice,
        ),
      );
    }
    let audio = generated;
    if (directed.some((l) => l.start !== undefined))
      audio = await Promise.all(
        generated.map((item, i) =>
          fitAudio(item, directed[i].end! - directed[i].start!),
        ),
      );
    else if (spec.target_duration !== undefined) {
      const interlinePauses = directed
        .slice(0, -1)
        .reduce((sum, line) => sum + line.pause_after, 0);
      const outroDuration =
        spec.outro.type === "card" ? spec.outro.duration : 0;
      const speechBudget =
        spec.target_duration - 0.15 - interlinePauses - 0.15 - outroDuration;
      audio = await fitAudioGroup(generated, speechBudget);
    }
    // Persist provider selection before later stages can fail. This prevents a
    // mock-backed render from looking like a successful real Fish render.
    json(`${dir}/report.json`, {
      id: spec.id,
      outputDir: dir,
      specHash,
      status: "running",
      passed: false,
      MOCK: audio.some((a) => a.MOCK),
      providers: audio.map((a) => a.provider),
      ttsFallbacks: audio
        .map((a, i) => (a.fallback ? `line ${i + 1}: ${a.fallback}` : null))
        .filter(Boolean),
    });
    mark("timeline");
    const timeline: any = buildTimeline(spec, audio);
    timeline.models = Object.fromEntries(
      spec.characters.map((c) => [c.id, existsSync(local(c.model))]),
    );
    mark("lipsync");
    timeline.lipsync = [];
    for (const l of timeline.lines)
      timeline.lipsync.push(await lipSync(l, spec.seed, spec.fps));
    json(`${dir}/timeline.json`, timeline);
    json(`${dir}/lipsync.json`, timeline.lipsync);
    writeFileSync(`${dir}/captions.ass`, ass(timeline));
    mark("build");
    await run(
      "node",
      ["node_modules/vite/bin/vite.js", "build", "web", "--outDir", "../dist"],
      { timeout: 120000 },
    );
    mark("capture");
    const rendered = await capture(timeline, dir, dry);
    if (dry) {
      const report = {
        id: spec.id,
        outputDir: dir,
        specHash,
        status: "dry-run",
        passed: false,
        dry: true,
        MOCK: audio.some((a) => a.MOCK),
        timing,
        rendered,
      };
      json(`${dir}/report.json`, report);
      return report;
    }
    mark("mux");
    await mux(timeline, dir, rendered.encoder);
    mark("qa");
    json(`${dir}/report.json`, {
      id: spec.id,
      outputDir: dir,
      specHash,
      status: "rendered",
      passed: false,
      MOCK: audio.some((a) => a.MOCK),
      providers: audio.map((a) => a.provider),
      fallbacks: [
        ...rendered.fallbacks,
        ...timeline.lipsync
          .filter((l) => l.provider === "energy")
          .map((l) => `line ${l.line}: energy lip sync`),
      ],
      timing,
    });
    const report = await qa(dir);
    mark("done");
    report.timing = timing;
    report.outputDir = dir;
    report.totalSeconds = (performance.now() - started) / 1000;
    report.status = report.passed ? "complete" : "qa-failed";
    json(`${dir}/report.json`, report);
    if (!report.passed) throw new Error("QA failed; see report.json");
    return report;
  } catch (e) {
    if (dir) {
      const previous = existsSync(`${dir}/report.json`)
        ? JSON.parse(readFileSync(`${dir}/report.json`, "utf8"))
        : {};
      json(`${dir}/report.json`, {
        ...previous,
        outputDir: dir,
        passed: false,
        status: "failed",
        failedStage: stage,
        error: e.message,
        timing,
        totalSeconds: (performance.now() - started) / 1000,
      });
      appendFileSync(`${dir}/log.txt`, `${stage}: ${e.message}\n`);
      if (e && typeof e === "object") (e as any).outputDir = dir;
    }
    throw e;
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const path = process.argv.slice(2).find((a) => !a.startsWith("--"));
  if (!path) {
    console.error("Usage: pnpm render specs/file.yaml [--dry] [--resume]");
    process.exitCode = 1;
  } else
    render(path, {
      dry: process.argv.includes("--dry"),
      resume: process.argv.includes("--resume"),
    }).catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    });
}
