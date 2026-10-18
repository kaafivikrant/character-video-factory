import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { specSchema } from "./schema";
export function loadSpec(path: string) {
  let raw;
  try {
    raw = parse(readFileSync(path, "utf8"));
    if (Array.isArray(raw?.characters))
      for (const c of raw.characters)
        if (typeof c.voice === "string")
          c.voice = c.voice.replace(
            /\$\{([A-Z0-9_]+)\}/g,
            (_, key) => process.env[key] || "",
          );
  } catch (e) {
    throw new Error(`Cannot parse ${path}: ${e.message}`);
  }
  const result = specSchema.safeParse(raw);
  if (!result.success)
    throw new Error(
      "Invalid spec:\n" +
        result.error.issues
          .map((i) => `  ${i.path.join(".") || "spec"}: ${i.message}`)
          .join("\n"),
    );
  return result.data;
}
