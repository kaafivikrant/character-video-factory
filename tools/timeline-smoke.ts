import { loadSpec } from "../src/spec/load";
import { buildTimeline } from "../src/timeline/build";
import { ass } from "../src/captions/ass";
import { json } from "../src/util";
import { writeFileSync } from "node:fs";
const s = loadSpec("specs/short_8s.yaml");
const t = buildTimeline(
  s,
  s.lines.map(() => ({ duration: 2, TEST_ONLY: true })),
);
json(".cache/test-timeline.json", t);
writeFileSync(".cache/test-captions.ass", ass(t));
console.log("TEST ONLY: timeline and ASS generated with fixture durations");
