import { mkdirSync } from "node:fs";
import { run, duration, json } from "../src/util";
import { normalizeAudio } from "../src/tts/normalize";
import { energy } from "../src/lipsync/energy";
import { chooseEncoder, mux } from "../src/render/encode";
import { loadSpec } from "../src/spec/load";
import { buildTimeline } from "../src/timeline/build";
const dir = ".cache/media-test";
mkdirSync(dir, { recursive: true });
await run("ffmpeg", [
  "-v",
  "error",
  "-y",
  "-f",
  "lavfi",
  "-i",
  "aevalsrc=0.14*sin(2*PI*180*t)*(0.5+0.5*sin(2*PI*3*t)):s=48000:d=2",
  "-c:a",
  "pcm_s16le",
  dir + "/raw.wav",
]);
await normalizeAudio(dir + "/raw.wav", dir + "/line.wav");
const d = await duration(dir + "/line.wav");
if (!Number.isFinite(d) || d < 1.8)
  throw new Error("normalization duration failed");
const e = energy(dir + "/line.wav", 7, 0.5);
if (
  Math.max(...e.map((x) => x.weights.aa)) -
    Math.min(...e.map((x) => x.weights.aa)) <
  0.1
)
  throw new Error("RMS motion failed");
const s = loadSpec("specs/short_8s.yaml"),
  t = buildTimeline(s, [
    { path: dir + "/line.wav", duration: d },
    { path: dir + "/line.wav", duration: d },
  ]);
const encoder = await chooseEncoder();
await run("ffmpeg", [
  "-v",
  "error",
  "-y",
  "-f",
  "lavfi",
  "-i",
  `color=c=gray:s=64x64:r=30:d=${t.total}`,
  "-c:v",
  encoder,
  "-pix_fmt",
  "yuv420p",
  dir + "/silent.mp4",
]);
await mux(t, dir, encoder);
const p = JSON.parse(
  (
    await run("ffprobe", [
      "-v",
      "error",
      "-show_streams",
      "-show_format",
      "-of",
      "json",
      dir + "/video.mp4",
    ])
  ).stdout,
);
if (
  !p.streams.some((x) => x.codec_name === "h264") ||
  !p.streams.some((x) => x.codec_name === "aac")
)
  throw new Error("codec mismatch");
const loud = await run("ffmpeg", [
  "-hide_banner",
  "-i",
  dir + "/video.mp4",
  "-af",
  "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
  "-f",
  "null",
  "-",
]);
const measurement = JSON.parse(
  loud.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)![0],
);
if (Number(measurement.input_i) < -15 || Number(measurement.input_i) > -13)
  throw new Error("loudness out of range");
const report = {
  TEST_ONLY: true,
  source: "generated modulated tone, not speech",
  encoder,
  duration: d,
  energyWindows: e.length,
  codecs: p.streams.map((x) => x.codec_name),
  loudness: measurement.input_i,
};
json(dir + "/result.json", report);
console.log(report);
