import { test } from "node:test";
import assert from "node:assert/strict";
import { loadSpec } from "../src/spec/load";
import { directLines, stripTags } from "../src/timeline/emotion";
import { chunks } from "../src/captions/wordTiming";
import { buildTimeline } from "../src/timeline/build";
test("tags stay at two stacked, text preserved and pitches vary", () => {
  const s = loadSpec("specs/sample_hook.yaml"),
    d = directLines(s.lines, 7);
  for (let i = 0; i < d.length; i++) {
    assert.equal(stripTags(d[i].taggedText), stripTags(d[i].text));
    assert.ok(!/\[[^\]]+\]\s*\[[^\]]+\]\s*\[/.test(d[i].taggedText));
    if (i >= 2)
      assert.ok(
        !(d[i].pitch === d[i - 1].pitch && d[i].pitch === d[i - 2].pitch),
      );
  }
  assert.deepEqual(d, directLines(s.lines, 7));
});
test("Khan TTS keeps instructions out of spoken payload and uses short tags", () => {
  const s = loadSpec("specs/khan_30s.yaml");
  const lines = directLines(s.lines, s.seed, s.voice_prompt);
  for (let i = 0; i < lines.length; i++) {
    assert.equal(stripTags(lines[i].taggedText), s.lines[i].text);
    assert.match(lines[i].taggedText, /^\[[^\]]+\] /);
    assert.ok((lines[i].taggedText.match(/\[/g) || []).length <= 2);
    assert.ok(!lines[i].taggedText.includes(s.voice_prompt!));
    assert.ok(!lines[i].taggedText.includes(s.lines[i].tts_direction!));
    assert.equal(lines[i].speed, 1);
    assert.equal(lines[i].normalize, true);
  }
});
test("caption chunks preserve words and have at most two rows", () => {
  const s = "I only use it to study the matchmaking algorithms";
  const c = chunks(s, 5);
  assert.equal(c.join(" ").replace(/\s+/g, " "), s);
  assert.ok(
    c.every((x) => x.split("\n").length <= 2 && x.split(/\s/).length <= 5),
  );
});
test("timeline uses measured durations and previous pause", () => {
  const s = loadSpec("specs/short_8s.yaml");
  s.lines[0].pause_after = 0.2;
  const t = buildTimeline(s, [{ duration: 2 }, { duration: 1 }]);
  assert.equal(t.lines[0].start, 0.15);
  assert.equal(t.lines[1].start, 2.35);
  assert.equal(t.total, 4.5);
  assert.ok(Math.abs(t.captions[0].start - 0.15) <= 1 / 30);
  assert.throws(() => buildTimeline(s, [{ duration: NaN }, { duration: 1 }]));
});
test("short utterances keep custom and pitch directions without three stacked tags", () => {
  const s = loadSpec("specs/sample_hook.yaml");
  const l = {
    ...s.lines[0],
    text: "huh",
    emotion: "sad" as const,
    tags: ["sigh", "hesitant"],
  };
  const d = directLines([l], 7)[0];
  assert.ok(d.taggedText.includes("sigh"));
  assert.equal(d.normalize, false);
  assert.ok(!/\[[^\]]+\]\s*\[[^\]]+\]\s*\[/.test(d.taggedText));
});
