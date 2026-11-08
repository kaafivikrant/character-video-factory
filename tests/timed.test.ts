import { test } from "node:test";
import assert from "node:assert/strict";
import { loadSpec } from "../src/spec/load";
import { buildTimeline } from "../src/timeline/build";
import { specSchema } from "../src/spec/schema";
import { tempoFilters, fitAudio, fitAudioGroup } from "../src/tts/fit";
import { run, duration } from "../src/util";
import { mkdirSync } from "node:fs";
import { AtlasAdapter } from "../web/character/atlas";
test("30-second script distributes speech naturally and reserves the outro", () => {
  const spec = loadSpec("specs/khan_30s.yaml");
  const t = buildTimeline(
    spec,
    spec.lines.map(() => ({ duration: 1.8 })),
  );
  assert.ok(Math.abs(t.total - 30) < 1e-8);
  assert.equal(t.frames, 900);
  assert.ok(Math.abs(t.outroStart - 28) < 1e-8);
  assert.ok(Math.abs(t.captions[0].start - t.lines[0].start) <= 1 / spec.fps);
  assert.equal(t.lines.length, 15);
  assert.equal(t.spec.outro.text, "www.childrenofkhan.com");
  assert.ok(t.lines.every((l, i) => i === 0 || l.start >= t.lines[i - 1].end));
  assert.ok(t.lines.slice(1).some((line, i) => line.start > t.lines[i].end));
});
test("timed schema rejects incomplete schedules and target-duration conflicts", () => {
  const s = loadSpec("specs/khan_30s.yaml");
  s.lines.forEach((line, i) => {
    line.start = i * 2;
    line.end = i * 2 + 1;
  });
  assert.equal(specSchema.safeParse(s).success, false);
  delete s.target_duration;
  delete s.lines[0].end;
  assert.equal(specSchema.safeParse(s).success, false);
  s.lines[0].end = 1;
  s.lines[2].start = 1.5;
  s.lines[2].end = 2.5;
  assert.equal(specSchema.safeParse(s).success, false);
});
test("tempo chain handles ratios outside one filter range", () => {
  assert.equal(tempoFilters(4), "atempo=2.0000000000,atempo=2.0000000000");
  assert.equal(tempoFilters(0.25), "atempo=0.5000000000,atempo=0.5000000000");
});
test("audio slot fitting produces exact measured slot without truncation-only fitting", async () => {
  mkdirSync(".cache/test-fit", { recursive: true });
  await run("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=200:duration=2",
    "-ar",
    "48000",
    "-ac",
    "1",
    ".cache/test-fit/tone.wav",
  ]);
  const fitted = await fitAudio(
    { path: ".cache/test-fit/tone.wav", duration: 2, MOCK: true },
    1,
  );
  assert.ok(Math.abs((await duration(fitted.path)) - 1) < 0.001);
  assert.equal(fitted.tempoFactor, 2);
});
test("group fitting uses one common tempo ratio across lines", async () => {
  await run("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=250:duration=4",
    "-ar",
    "48000",
    "-ac",
    "1",
    ".cache/test-fit/tone-long.wav",
  ]);
  const fitted = await fitAudioGroup(
    [
      { path: ".cache/test-fit/tone.wav", duration: 2, MOCK: true },
      { path: ".cache/test-fit/tone-long.wav", duration: 4, MOCK: true },
    ],
    3,
  );
  assert.ok(Math.abs(fitted[0].tempoFactor - fitted[1].tempoFactor) < 0.001);
  assert.ok(
    Math.abs(
      (await duration(fitted[0].path)) + (await duration(fitted[1].path)) - 3,
    ) < 0.01,
  );
});
test("Atlas rig has detailed geometry and valid animated mouth", () => {
  const s = loadSpec("specs/khan_30s.yaml");
  const a = new AtlasAdapter(s.characters[0]);
  let meshes = 0;
  a.root.traverse((o: any) => {
    if (o.isMesh) {
      meshes++;
      assert.ok(o.geometry.attributes.position.count > 0);
    }
  });
  assert.ok(meshes > 90);
  const closedMouthHeight = a.mouth.scale.y;
  a.setViseme({ aa: 1 });
  assert.ok(a.mouth.scale.y > closedMouthHeight);
  a.setViseme({});
  assert.equal(a.mouth.scale.y, closedMouthHeight);
  a.setExpression("blink", 1);
  a.update(0);
  assert.ok(a.eyes.every((e) => e.scale.y < 0.1));
});
