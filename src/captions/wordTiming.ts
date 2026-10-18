import { stripTags } from "../timeline/emotion";
export function chunks(text: string, max = 5) {
  const words = stripTags(text).split(/\s+/),
    out: string[] = [];
  let current: string[] = [];
  for (const word of words) {
    const candidate = [...current, word].join(" ");
    if (current.length && (current.length >= max || candidate.length > 43)) {
      out.push(current.join(" "));
      current = [];
    }
    current.push(word);
  }
  if (current.length) out.push(current.join(" "));
  return out.map((c) => {
    if (c.length <= 22) return c;
    const w = c.split(" ");
    let best = 1;
    for (let i = 1; i < w.length; i++)
      if (
        Math.abs(w.slice(0, i).join(" ").length - w.slice(i).join(" ").length) <
        Math.abs(
          w.slice(0, best).join(" ").length - w.slice(best).join(" ").length,
        )
      )
        best = i;
    return w.slice(0, best).join(" ") + "\n" + w.slice(best).join(" ");
  });
}
export function timeChunks(
  text: string,
  start: number,
  end: number,
  fps: number,
  max = 5,
) {
  const parts = chunks(text, max),
    total = parts.reduce((s, p) => s + p.replace(/\s/g, "").length, 0);
  let cursor = start;
  return parts.map((text, i) => {
    const a = cursor;
    cursor =
      i === parts.length - 1
        ? end
        : cursor + ((end - start) * text.replace(/\s/g, "").length) / total;
    return {
      text,
      start: Math.ceil((a - 1e-8) * fps) / fps,
      end: Math.ceil((cursor - 1e-8) * fps) / fps,
    };
  });
}
