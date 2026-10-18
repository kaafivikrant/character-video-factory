import { run } from "../util";
import { stripTags } from "../timeline/emotion";
export async function mock(text: string, speed: number, path: string) {
  await run("say", [
    "-r",
    String(Math.round(185 * speed)),
    "-o",
    path + ".aiff",
    "--",
    stripTags(text),
  ]);
  await run("afconvert", [
    "-f",
    "WAVE",
    "-d",
    "LEI16@48000",
    "-c",
    "1",
    path + ".aiff",
    path,
  ]);
}
