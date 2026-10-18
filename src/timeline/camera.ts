import { emotionTable } from "./emotion";
export function shots(lines: any[]) {
  let last = -Infinity,
    current = "mid",
    speaker = lines[0].speaker,
    lastFull = -3;
  return lines.map((line, i) => {
    let wanted = line.shot;
    if (wanted === "auto")
      wanted =
        i === 0
          ? "mid"
          : i - lastFull >= 3
            ? "full"
            : line.intensity >= 0.7 || line.emotion !== lines[i - 1]?.emotion
              ? "close"
              : emotionTable[line.emotion].camera;
    const cut =
      i === 0 ||
      (line.start - last >= 1.4 &&
        (wanted !== current ||
          line.speaker !== speaker ||
          line.emotion !== lines[i - 1]?.emotion));
    if (cut) {
      current = wanted;
      speaker = line.speaker;
      last = line.start;
      if (current === "full") lastFull = i;
    }
    return { start: line.start, shot: current, cut, speaker };
  });
}
