const stamp = (t: number) => {
  const n = Math.round(t * 100);
  return `${Math.floor(n / 360000)}:${String(Math.floor(n / 6000) % 60).padStart(2, "0")}:${String(Math.floor(n / 100) % 60).padStart(2, "0")}.${String(n % 100).padStart(2, "0")}`;
};
export function ass(t: any) {
  const [w, h] = t.size;
  const style = t.spec.captions.style;
  return (
    `[Script Info]\nScriptType: v4.00+\nPlayResX: ${w}\nPlayResY: ${h}\nWrapStyle: 2\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial Black,${Math.round(h * (t.spec.captions.size ?? .052))},${style === "yellow_pop" ? "&H0000E8FF" : "&H00FFFFFF"},&H000000FF,&H00101010,&H90000000,-1,0,0,0,100,100,0,0,${style === "boxed" ? 3 : 1},3,2,2,${Math.round(w * 0.08)},${Math.round(w * 0.08)},${Math.round(h * (1 - (t.spec.captions.position ?? .72) - .03))},1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n` +
    t.captions
      .map(
        (c: any) =>
          `Dialogue: 0,${stamp(c.start)},${stamp(c.end)},Default,,0,0,0,,${style === "yellow_pop" ? "{\\fscx90\\fscy90\\t(0,90,\\fscx100\\fscy100)}" : ""}${c.text.replace(/[{}\\]/g, "").replace(/\n/g, "\\N")}`,
      )
      .join("\n") +
    "\n"
  );
}
