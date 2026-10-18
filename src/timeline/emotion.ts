import type { Line } from "../spec/schema";
import { random } from "../util";
export const emotionTable = {
  neutral: {
    tags: [],
    speed: 1,
    face: { relaxed: 0.1 },
    gesture: "idle_sway",
    camera: "mid",
  },
  deadpan: {
    tags: ["flat voice"],
    speed: 0.97,
    face: { relaxed: 0.2 },
    gesture: "hold_phone",
    camera: "mid",
  },
  sad: {
    tags: ["sad", "low voice"],
    speed: 0.92,
    face: { sad: 0.8 },
    gesture: "head_down",
    camera: "close",
  },
  wistful: {
    tags: ["wistful", "soft voice"],
    speed: 0.9,
    face: { sad: 0.4, relaxed: 0.4 },
    gesture: "look_away",
    camera: "close",
  },
  happy: {
    tags: ["cheerful"],
    speed: 1.05,
    face: { happy: 0.8 },
    gesture: "open_arms",
    camera: "mid",
  },
  excited: {
    tags: ["excited", "pitch up"],
    speed: 1.12,
    face: { happy: 1, surprised: 0.3 },
    gesture: "big_gesture",
    camera: "full",
  },
  angry: {
    tags: ["angry", "emphasis"],
    speed: 1.08,
    face: { angry: 0.9 },
    gesture: "point",
    camera: "close",
  },
  surprised: {
    tags: ["surprised"],
    speed: 1.05,
    face: { surprised: 0.9 },
    gesture: "step_back",
    camera: "close",
  },
  embarrassed: {
    tags: ["embarrassed", "pitch up"],
    speed: 1,
    face: { happy: 0.3, sad: 0.2 },
    gesture: "hand_to_neck",
    camera: "close",
  },
  defensive: {
    tags: ["defensive", "emphasis"],
    speed: 1.08,
    face: { angry: 0.4, surprised: 0.3 },
    gesture: "palm_out",
    camera: "mid",
  },
  determined: {
    tags: ["firm"],
    speed: 0.95,
    face: { angry: 0.3, relaxed: 0.2 },
    gesture: "hand_to_chest",
    camera: "mid",
  },
  whisper: {
    tags: ["whispers"],
    speed: 0.9,
    face: { relaxed: 0.3 },
    gesture: "lean_in",
    camera: "close",
  },
};
const pitchTags = {
  flat: "flat voice",
  up: "pitch up",
  down: "low voice",
  rise_end: "rising intonation",
  fall_end: "falling intonation",
  lively: "animated voice",
};
export const stripTags = (s: string) =>
  s
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
export function directLines(lines: Line[], seed: number) {
  const previous: string[] = [];
  return lines.map((line, i) => {
    const em = emotionTable[line.emotion];
    let pitch =
      line.pitch ||
      (/[?]$|^huh\b/i.test(line.text)
        ? "rise_end"
        : i === lines.length - 1
          ? "fall_end"
          : i % 2
            ? "lively"
            : "flat");
    if (
      previous.slice(-2).length === 2 &&
      previous.slice(-2).every((p) => p === pitch)
    )
      pitch = pitch === "flat" ? "lively" : "flat";
    previous.push(pitch);
    const tags = [...new Set([...em.tags, pitchTags[pitch], ...line.tags])];
    const words = stripTags(line.text).split(" ");
    const availableSpots = Math.max(1, Math.floor(words.length / 3));
    const slots = tags.slice();
    // Keep all short-line direction by combining free-form descriptions.
    while (slots.length > availableSpots * 2) {
      slots[slots.length - 2] += ", " + slots.pop();
    }
    let text = "",
      cursor = 0;
    for (let j = 0; j < slots.length; j += 2) {
      text +=
        slots
          .slice(j, j + 2)
          .map((t) => `[${t}]`)
          .join(" ") +
        " " +
        words.slice(cursor, cursor + 3).join(" ") +
        " ";
      cursor += 3;
    }
    text += words.slice(cursor).join(" ");
    return {
      ...line,
      pitch,
      taggedText: text.trim(),
      normalize: !tags.some((t) => /sigh|pause|laugh|breath/i.test(t)),
      speed:
        line.speed ??
        Math.max(
          0.5,
          Math.min(
            2,
            (1 + (em.speed - 1) * line.intensity) *
              (1 + (random(seed, i) - 0.5) * 0.12),
          ),
        ),
      gesture: line.gesture || em.gesture,
      face: em.face,
      pause_after: line.pause_after ?? 0.1 + random(seed, i + 100) * 0.1,
    };
  });
}
