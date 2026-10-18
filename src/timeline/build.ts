import type { Spec } from "../spec/schema";
import { sizes } from "../spec/schema";
import { directLines } from "./emotion";
import { timeChunks } from "../captions/wordTiming";
import { shots } from "./camera";
export function buildTimeline(spec: Spec, audio: any[]) {
  if (audio.length !== spec.lines.length)
    throw new Error("Audio count must match line count");
  let cursor = 0.15;
  const lines = directLines(spec.lines, spec.seed).map((l, i) => {
    if (!Number.isFinite(audio[i].duration) || audio[i].duration <= 0)
      throw new Error(`Invalid audio duration at line ${i}`);
    const start = l.start ?? cursor,
      end = l.end ?? start + audio[i].duration;
    if (
      l.end !== undefined &&
      Math.abs(audio[i].duration - (end - start)) > 1 / spec.fps
    )
      throw new Error(`Audio must be fitted to timed slot at line ${i}`);
    cursor = end + l.pause_after;
    return { ...l, index: i, start, end, audio: audio[i] };
  });
  const voiceEnd = lines.at(-1)!.end;
  const outroStart = voiceEnd + (spec.lines[0].start !== undefined ? 0 : 0.15);
  const total =
    outroStart + (spec.outro.type === "card" ? spec.outro.duration : 0);
  return {
    version: 1,
    spec,
    size: sizes[spec.format],
    fps: spec.fps,
    seed: spec.seed,
    lines,
    shots: shots(lines),
    captions: lines.flatMap((l) =>
      timeChunks(
        l.text,
        l.start,
        l.end,
        spec.fps,
        spec.captions.max_words_per_chunk,
      ).map((c) => ({ ...c, line: l.index })),
    ),
    voiceEnd,
    outroStart,
    total,
    frames: Math.ceil(total * spec.fps),
  };
}
