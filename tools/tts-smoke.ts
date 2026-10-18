import { directLines } from "../src/timeline/emotion";
import { loadSpec } from "../src/spec/load";
import { synthesize } from "../src/tts/cache";
const s = loadSpec("specs/short_8s.yaml"),
  line = directLines(s.lines, s.seed)[0];
for (let i = 0; i < 2; i++)
  console.log(await synthesize(line, s.characters[0].voice));
