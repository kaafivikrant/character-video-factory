import { z } from "zod";
export const emotions = [
  "neutral",
  "deadpan",
  "sad",
  "wistful",
  "happy",
  "excited",
  "angry",
  "surprised",
  "embarrassed",
  "defensive",
  "determined",
  "whisper",
] as const;
export const gestures = [
  "idle_sway",
  "slow_breath",
  "hold_phone",
  "open_arms",
  "shrug",
  "point",
  "palm_out",
  "hand_to_neck",
  "hand_to_chest",
  "head_down",
  "look_away",
  "step_back",
  "lean_in",
  "big_gesture",
] as const;
const safePath = z
  .string()
  .refine(
    (s) => !s.startsWith("/") && !s.split(/[\\/]/).includes(".."),
    "must be a project-relative path without ..",
  );
export const specSchema = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9_-]+$/, "use letters, numbers, _ or -"),
    format: z.enum(["vertical", "landscape", "classic"]).default("vertical"),
    fps: z.number().int().min(12).max(60).default(30),
    seed: z.number().int().default(7),
    scene: z
      .string()
      .refine(
        (s) =>
          ["misty_lake_bridge", "street_night"].includes(s) ||
          /^hdri:[\w-]+$/.test(s),
        "unknown scene",
      )
      .default("misty_lake_bridge"),
    music: safePath.nullable().default(null),
    characters: z
      .array(
        z
          .object({
            id: z.string().min(1),
            model: safePath.default("assets/characters/hero.vrm"),
            voice: z.string().default(""),
            position: z
              .tuple([z.number(), z.number(), z.number()])
              .default([0, 0, 0]),
            facing: z.string().default("camera"),
            hoodie: z
              .string()
              .regex(/^#[a-fA-F0-9]{6}$/)
              .default("#c66b48"),
            pants: z
              .string()
              .regex(/^#[a-fA-F0-9]{6}$/)
              .default("#273b46"),
          })
          .strict(),
      )
      .min(1)
      .max(8),
    lines: z
      .array(
        z
          .object({
            speaker: z.string(),
            text: z.string().trim().min(1).max(1000),
            emotion: z.enum(emotions).default("neutral"),
            intensity: z.number().min(0).max(1).default(0.5),
            pitch: z
              .enum(["flat", "up", "down", "rise_end", "fall_end", "lively"])
              .optional(),
            speed: z.number().min(0.5).max(2).optional(),
            shot: z.enum(["full", "mid", "close", "auto"]).default("auto"),
            gesture: z.enum(gestures).optional(),
            pause_after: z.number().min(0).max(0.6).optional(),
            start: z.number().nonnegative().optional(),
            end: z.number().positive().optional(),
            tags: z
              .array(
                z
                  .string()
                  .min(1)
                  .max(60)
                  .regex(/^[^\[\]\r\n]+$/),
              )
              .max(2)
              .default([]),
          })
          .strict(),
      )
      .min(1)
      .max(200),
    outro: z
      .object({
        type: z.enum(["card", "none"]).default("card"),
        text: z.string().default("your-site.com"),
        duration: z.number().min(0).max(10).default(2),
        background: z
          .string()
          .regex(/^#[a-fA-F0-9]{6}$/)
          .default("#f4f4f4"),
      })
      .strict()
      .default({}),
    captions: z
      .object({
        style: z
          .enum(["bold_white", "yellow_pop", "boxed"])
          .default("bold_white"),
        max_words_per_chunk: z.number().int().min(2).max(5).default(5),
      })
      .strict()
      .default({}),
  })
  .strict()
  .superRefine((s, ctx) => {
    const timed = s.lines.some(
      (l) => l.start !== undefined || l.end !== undefined,
    );
    if (timed)
      s.lines.forEach((l, i) => {
        if (l.start === undefined || l.end === undefined || l.end <= l.start)
          ctx.addIssue({
            code: "custom",
            path: ["lines", i, "end"],
            message: "Timed scripts require start < end on every line",
          });
        if (i && l.start < s.lines[i - 1].end)
          ctx.addIssue({
            code: "custom",
            path: ["lines", i, "start"],
            message: "Timed speech slots must not overlap",
          });
      });
    const ids = s.characters.map((c) => c.id);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({
        code: "custom",
        path: ["characters"],
        message: "character ids must be unique",
      });
    s.lines.forEach((l, i) => {
      if (!ids.includes(l.speaker))
        ctx.addIssue({
          code: "custom",
          path: ["lines", i, "speaker"],
          message: "speaker must name a character",
        });
    });
    s.characters.forEach((c, i) => {
      if (c.facing !== "camera" && !ids.includes(c.facing))
        ctx.addIssue({
          code: "custom",
          path: ["characters", i, "facing"],
          message: "must be camera or a character id",
        });
    });
  });
export type Spec = z.infer<typeof specSchema>;
export type Line = Spec["lines"][number];
export const sizes = {
  vertical: [1080, 1920],
  landscape: [1280, 720],
  classic: [964, 720],
} as const;
