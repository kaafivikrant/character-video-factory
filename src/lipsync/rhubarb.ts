import { existsSync, writeFileSync } from "node:fs";
import { run, hash, json, readJSON } from "../util";
import { energy } from "./energy";
import { smoothTrack } from "./visemeMap";
export async function lipSync(line: any, seed: number, fps: number) {
  const path = `.cache/lipsync/${hash({ v: 2, audio: line.audio.path, text: line.text, seed, fps, intensity: line.intensity, rhubarb: existsSync("tools/rhubarb/rhubarb") })}.json`;
  if (existsSync(path)) return readJSON(path);
  let cues,
    provider = "rhubarb";
  try {
    if (!existsSync("tools/rhubarb/rhubarb")) throw new Error("not installed");
    writeFileSync(line.audio.path + ".txt", line.text);
    const result = await run("tools/rhubarb/rhubarb", [
      "-f",
      "json",
      "--extendedShapes",
      "GHX",
      "-d",
      line.audio.path + ".txt",
      line.audio.path,
    ]);
    cues = JSON.parse(result.stdout).mouthCues;
  } catch {
    provider = "energy";
    cues = energy(line.audio.path, seed, line.intensity);
  }
  const track = smoothTrack(cues, line.audio.duration, fps, line.intensity);
  const result = {
    line: line.index,
    speaker: line.speaker,
    start: line.start,
    end: line.end,
    provider,
    cues,
    track,
  };
  json(path, result);
  return result;
}
