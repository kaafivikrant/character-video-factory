import { existsSync, mkdirSync } from "node:fs";
import { hash, run, duration } from "../util";
export function tempoFilters(ratio: number) {
  if (!Number.isFinite(ratio) || ratio <= 0)
    throw new Error("Tempo ratio must be positive");
  const parts: number[] = [];
  while (ratio > 2) {
    parts.push(2);
    ratio /= 2;
  }
  while (ratio < 0.5) {
    parts.push(0.5);
    ratio /= 0.5;
  }
  parts.push(ratio);
  return parts.map((x) => `atempo=${x.toFixed(10)}`).join(",");
}
export async function fitAudio(audio: any, seconds: number) {
  const factor = audio.duration / seconds;
  const key = hash({
    v: 1,
    source: audio.path,
    duration: audio.duration,
    seconds,
  });
  mkdirSync(".cache/timed-tts", { recursive: true });
  const path = `.cache/timed-tts/${key}.wav`;
  if (!existsSync(path))
    await run("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-i",
      audio.path,
      "-af",
      `${tempoFilters(factor)},apad,atrim=duration=${seconds}`,
      "-ar",
      "48000",
      "-ac",
      "1",
      "-c:a",
      "pcm_s16le",
      path,
    ]);
  const measured = await duration(path);
  if (!Number.isFinite(measured) || Math.abs(measured - seconds) > 0.01)
    throw new Error("Timed speech fitting failed");
  return {
    ...audio,
    path,
    duration: measured,
    originalDuration: audio.duration,
    tempoFactor: factor,
    timingWarning:
      factor > 1.8 || factor < 0.65
        ? "Large tempo adjustment: audition this line"
        : undefined,
  };
}
