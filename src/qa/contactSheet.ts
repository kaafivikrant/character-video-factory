import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { run } from "../util";
import { launch } from "../render/launch";
export async function contactSheet(dir: string, t: any) {
  mkdirSync(`${dir}/stills`, { recursive: true });
  await run("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-i",
    `${dir}/video.mp4`,
    "-vf",
    `fps=1/2,scale=216:-1,tile=5x${Math.ceil(t.total / 10)}`,
    "-frames:v",
    "1",
    `${dir}/contact.png`,
  ]);
  const times = [
    0.2,
    Math.min(t.voiceEnd / 2, t.total - 0.1),
    Math.max(0.2, t.voiceEnd - 0.3),
  ];
  for (let i = 0; i < times.length; i++)
    await run("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-ss",
      String(times[i]),
      "-i",
      `${dir}/video.mp4`,
      "-frames:v",
      "1",
      `${dir}/stills/${i + 1}.png`,
    ]);
  const stamps = Array.from(
    { length: Math.ceil(t.total / 2) },
    (_, i) => i * 2,
  );
  const stage = await launch(t);
  try {
    const data = readFileSync(`${dir}/contact.png`).toString("base64");
    const labeled = await stage.page.evaluate(
      async ({ data, stamps, aspect }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(image, 0, 0);
        ctx.font = "bold 16px sans-serif";
        for (let i = 0; i < stamps.length; i++) {
          const x = (i % 5) * 216,
            y = Math.floor(i / 5) * Math.round(216 / aspect);
          ctx.fillStyle = "#10232ddd";
          ctx.fillRect(x, y, 75, 26);
          ctx.fillStyle = "white";
          ctx.fillText(`${stamps[i].toFixed(1)} s`, x + 8, y + 18);
        }
        return canvas.toDataURL("image/png").split(",")[1];
      },
      { data, stamps, aspect: t.size[0] / t.size[1] },
    );
    writeFileSync(`${dir}/contact.png`, Buffer.from(labeled, "base64"));
  } finally {
    await stage.close();
  }
  writeFileSync(
    `${dir}/contact-timestamps.json`,
    JSON.stringify({ columns: 5, rowMajorSeconds: stamps }, null, 2),
  );
}
