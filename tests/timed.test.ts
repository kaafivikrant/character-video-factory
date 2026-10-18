import { test } from "node:test";
import assert from "node:assert/strict";
import { loadSpec } from "../src/spec/load";
import { buildTimeline } from "../src/timeline/build";
import { specSchema } from "../src/spec/schema";
import { tempoFilters, fitAudio } from "../src/tts/fit";
import { run, duration } from "../src/util";
import { mkdirSync } from "node:fs";
import { AtlasAdapter } from "../web/character/atlas";
test("caption script produces exactly 900 frames with 28–30s outro", () => {
  const spec = loadSpec("specs/khan_30s.yaml");
  const t = buildTimeline(
    spec,
    spec.lines.map((l) => ({ duration: l.end - l.start })),
  );
  assert.equal(t.total, 30);
  assert.equal(t.frames, 900);
  assert.equal(t.outroStart, 28);
  assert.equal(t.captions[0].start, 0);
  assert.equal(t.lines.length, 15);
  assert.equal(t.spec.outro.text, "www.childrenofkhan.com");
  assert.deepEqual(
    t.lines.map((l) => [l.start, l.end]),
    [
      [0, 1],
      [1, 4],
      [4, 6],
      [6, 7],
      [7, 9],
      [9, 11],
      [11, 13],
      [13, 15],
      [15, 16],
      [16, 17],
      [17, 18],
      [18, 20],
      [20, 22],
      [22, 24],
      [24, 28],
    ],
  );
});
test("timed schema rejects overlapping or incomplete schedules", () => {
  const s = loadSpec("specs/khan_30s.yaml");
  s.lines[1].start = 0.5;
  assert.equal(specSchema.safeParse(s).success, false);
  delete s.lines[0].end;
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
  assert.ok(meshes > 100);
  a.setViseme({ aa: 1 });
  assert.ok(a.mouth.scale.y > 1);
  a.setViseme({});
  assert.equal(a.mouth.scale.y, 1);
  a.setExpression("blink", 1);
  a.update(0);
  assert.ok(a.eyes.every((e) => e.scale.y < 0.1));
});
