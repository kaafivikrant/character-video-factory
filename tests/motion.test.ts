import { test } from "node:test";
import assert from "node:assert/strict";
import { loadSpec } from "../src/spec/load";
import { buildTimeline } from "../src/timeline/build";
import { sampleMotion, solveLeg } from "../src/timeline/motion";

test("conversation timeline compiles seeded walk and seated-to-standing actions", () => {
  const spec = loadSpec("specs/dating_chat_v2.yaml");
  const timeline = buildTimeline(spec, spec.lines.map(() => ({ duration: 1.5 })));
  assert.equal(timeline.actions.length, 3);
  const arjunWalk = timeline.actions[0];
  const inMotion = sampleMotion(spec.characters[0], timeline.actions, arjunWalk.start + arjunWalk.duration / 2);
  assert.ok(inMotion.gait);
  assert.ok(inMotion.position[0] < spec.characters[0].position[0]);
  const kabirStand = timeline.actions[2];
  const standing = sampleMotion(spec.characters[1], timeline.actions, kabirStand.end);
  assert.equal(standing.seated, 0);
  assert.equal(standing.gait, null);
});

test("two-bone leg IK stays finite for a reachable and edge-range target", () => {
  for (const [thigh, shin, down, forward] of [[0.42, 0.4, 0.8, 0], [0.42, 0.4, 0.5, 0.25]]) {
    const rotation = solveLeg(thigh, shin, down, forward);
    assert.equal(rotation.length, 3);
    assert.ok(rotation.every(Number.isFinite));
  }
});
