import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { hash, duration, json, readJSON } from "../util";
import { stripTags } from "../timeline/emotion";
import { fish } from "./fish";
import { mock } from "./mock";
import { normalizeAudio } from "./normalize";
export async function synthesize(line: any, voice: string) {
  const requested = process.env.TTS_PROVIDER || "auto";
  if (!["auto", "fish", "mock"].includes(requested))
    throw new Error("TTS_PROVIDER must be auto, fish or mock");
  if (requested === "auto" && process.env.FISH_API_KEY && !voice)
    throw new Error(
      "FISH_API_KEY is set but this character has no voice reference ID. Put the Fish voice ID in FISH_VOICE_HERO; FISH_MODEL selects s2-pro or s2.1-pro.",
    );
  let provider =
    requested === "mock" ||
    (requested === "auto" && (!process.env.FISH_API_KEY || !voice))
      ? "mock"
      : "fish";
  mkdirSync(".cache/tts", { recursive: true });
  const temperature = 0.55;
  const topP = 0.7;
  async function attempt(p: string) {
    const wordCount = stripTags(line.text).split(/\s+/).filter(Boolean).length;
    const maxSpeechSeconds = Math.max(10, wordCount * 1.4 + 3);
    const checkDuration = (seconds: number) => {
      if (p === "fish" && seconds > maxSpeechSeconds)
        throw new Error(
          `Fish returned ${seconds.toFixed(1)} s for a ${wordCount}-word line (limit ${maxSpeechSeconds.toFixed(1)} s). Check that prompt directions were not included in spoken text.`,
        );
    };
    const key = hash({
      v: 4,
      provider: p,
      model:
        p === "fish" ? process.env.FISH_MODEL || "s2-pro" : "macos-say-default",
      voice: p === "fish" ? voice : "system",
      text: line.taggedText,
      prosody: {
        speed: line.speed,
        normalize: line.normalize,
        temperature,
        topP,
      },
    });
    const path = `.cache/tts/${key}.wav`,
      meta = path + ".json";
    if (existsSync(path) && existsSync(meta)) {
      const cached = readJSON(meta);
      if (Number.isFinite(cached.duration) && cached.duration > 0.05) {
        checkDuration(cached.duration);
        return { ...cached, cacheHit: true };
      }
      rmSync(path, { force: true });
      rmSync(meta, { force: true });
    }
    const raw = `.cache/tts/${key}.raw.wav`;
    try {
      await (p === "fish"
        ? fish(
            line.taggedText,
            voice,
            line.speed,
            line.normalize,
            raw,
            temperature,
            topP,
          )
        : mock(line.text, line.speed, raw));
      await normalizeAudio(raw, path + ".tmp.wav");
      const measured = await duration(path + ".tmp.wav");
      if (!Number.isFinite(measured) || measured < 0.05)
        throw new Error("TTS produced no usable speech");
      checkDuration(measured);
      renameSync(path + ".tmp.wav", path);
      const result = {
        path,
        duration: measured,
        provider: p,
        MOCK: p === "mock",
        cacheHit: false,
      };
      json(meta, result);
      return result;
    } finally {
      for (const f of [raw, raw + ".aiff", path + ".tmp.wav"])
        rmSync(f, { force: true });
    }
  }
  try {
    return await attempt(provider);
  } catch (e) {
    if (requested === "auto" && provider === "fish") {
      const result = await attempt("mock");
      return { ...result, fallback: "Fish failed; used mock" };
    }
    throw e;
  }
}
