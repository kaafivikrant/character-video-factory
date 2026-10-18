import { readFileSync } from "node:fs";
import { random } from "../util";
import { closed } from "./visemeMap";
export function pcm16(path: string) {
  const b = readFileSync(path);
  if (b.toString("ascii", 0, 4) !== "RIFF") throw new Error("Expected PCM WAV");
  let sampleRate = 48000;
  for (let p = 12; p + 8 <= b.length; ) {
    const size = b.readUInt32LE(p + 4),
      type = b.toString("ascii", p, p + 4);
    if (type === "fmt ") {
      if (
        b.readUInt16LE(p + 8) !== 1 ||
        b.readUInt16LE(p + 10) !== 1 ||
        b.readUInt16LE(p + 22) !== 16
      )
        throw new Error("Expected mono 16-bit PCM");
      sampleRate = b.readUInt32LE(p + 12);
    }
    if (type === "data") {
      const raw = b.subarray(p + 8, Math.min(b.length, p + 8 + size)),
        samples = new Float32Array(Math.floor(raw.length / 2));
      for (let i = 0; i < samples.length; i++)
        samples[i] = raw.readInt16LE(i * 2) / 32768;
      return { sampleRate, samples };
    }
    p += 8 + size + (size % 2);
  }
  throw new Error("WAV missing data");
}
export function energy(path: string, seed: number, intensity: number) {
  const { samples, sampleRate } = pcm16(path),
    n = Math.round(sampleRate * 0.02),
    levels: number[] = [];
  for (let i = 0; i < samples.length; i += n) {
    let sum = 0;
    for (let j = i; j < Math.min(samples.length, i + n); j++)
      sum += samples[j] ** 2;
    levels.push(Math.sqrt(sum / Math.min(n, samples.length - i)));
  }
  const sorted = [...levels].sort((a, b) => a - b),
    peak = Math.max(0.02, sorted[Math.floor(sorted.length * 0.9)] || 0.02);
  return levels.map((level, i) => {
    const open =
      Math.min(1, Math.max(0, (level - 0.006) / peak)) *
      (0.65 + 0.35 * intensity);
    const alt = random(seed, Math.floor(i / 5)) > 0.5 ? "oh" : "ih";
    return {
      start: i * 0.02,
      end: Math.min(samples.length / sampleRate, (i + 1) * 0.02),
      weights: { ...closed(), aa: open * 0.78, [alt]: open * 0.22 },
    };
  });
}
