import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadSpec } from "../src/spec/load";
import { buildTimeline } from "../src/timeline/build";
import { hash } from "../src/util";

// Creates a silent animation-review timeline when TTS services are unavailable.
// Durations are a visual pacing estimate only; never presented as dialogue audio.
const spec = loadSpec("specs/dating_chat_v2.yaml");
const audio = spec.lines.map((line) => ({
  duration: Math.max(0.8, line.text.trim().split(/\s+/).length * 0.4),
  path: `review-silent-${hash(line.text)}.wav`,
  provider: "visual-review-estimate",
}));
const timeline: any = buildTimeline(spec, audio);
timeline.models = Object.fromEntries(spec.characters.map((c) => [c.id, true]));
timeline.lipsync = timeline.lines.map((line: any) => ({
  line: line.index,
  speaker: line.speaker,
  provider: "visual-review-pattern",
  track: Array.from({ length: Math.ceil((line.end - line.start) * timeline.fps) }, (_, i) => {
    const phase = (i + line.index * 3) % 8;
    const opening = [0.22, 0.68, 0.42, 0.86, 0.5, 0.18, 0.72, 0.36][phase];
    return { aa: opening * 0.65, ih: opening * 0.25, oh: opening * 0.1, ou: 0, ee: 0 };
  }),
}));
const dir = resolve("out/dating_chat_v2/motion-review");
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/timeline.json`, JSON.stringify(timeline, null, 2));
writeFileSync(`${dir}/report.json`, JSON.stringify({
  id: spec.id,
  status: "visual-review-only",
  passed: false,
  MOCK: true,
  note: "Silent visual review cut. Timings and mouth patterns are visual estimates. Dialogue audio and full media QA are still pending.",
  duration: timeline.total,
  resolution: timeline.size,
  fps: timeline.fps,
  frames: timeline.frames,
  videoPath: "motion-review.mp4",
  audio: false,
  qa: "not-run: silent review export",
}, null, 2));
console.log(`Review timeline: ${dir}/timeline.json (${timeline.total.toFixed(1)}s, ${timeline.frames} frames)`);
