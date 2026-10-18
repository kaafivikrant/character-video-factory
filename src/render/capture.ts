import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { launch } from "./launch";
import { videoEncoder, chooseEncoder } from "./encode";
import { json, run } from "../util";
const digest = (b: Buffer) => createHash("sha256").update(b).digest("hex");
export async function capture(t: any, dir: string, dry = false) {
  mkdirSync(dir, { recursive: true });
  const started = performance.now();
  const stage = await launch(t);
  let encoder: any;
  try {
    const enc = await chooseEncoder();
    const sampleIndices = [0, 0.2, 0.4, 0.6, 0.8].map((f) =>
      Math.floor(f * Math.max(1, t.frames - 1)),
    );
    const samples: any[] = [];
    const render = async (i: number, bg = false, hideCaptions = false) =>
      Buffer.from(
        await stage.page.evaluate(
          ([i, bg, hide]) => (window as any).__stage.renderFrame(i, bg, hide),
          [i, bg, hideCaptions],
        ),
        "base64",
      );
    for (const i of sampleIndices) {
      const first = await render(i),
        second = await render(i);
      samples.push({
        frame: i,
        hash: digest(first),
        repeatHash: digest(second),
      });
    }
    const bg = await render(Math.ceil(t.lines[0].start * t.fps), true);
    const fg = await render(Math.ceil(t.lines[0].start * t.fps), false, true);
    writeFileSync(`${dir}/background.jpg`, bg);
    writeFileSync(`${dir}/foreground.jpg`, fg);
    const mouthChecks = [];
    for (
      let frame = 0;
      frame < t.frames;
      frame += Math.max(1, Math.floor(t.fps / 4))
    ) {
      const time = frame / t.fps;
      const speaker = t.lines.find(
        (l) => time >= l.start && time < l.end,
      )?.speaker;
      const state = await stage.page.evaluate((i) => {
        const stage = (window as any).__stage;
        stage.renderFrame(i);
        return stage.mouthState;
      }, frame);
      mouthChecks.push({
        frame,
        closed: Object.entries(state).every(
          ([id, weights]) =>
            id === speaker || Object.values(weights).every((v) => v === 0),
        ),
      });
    }
    await stage.page.exposeBinding("deliverFrame", async (_, data: string) => {
      await encoder.write(Buffer.from(data, "base64"));
    });
    async function pipeFrames(path: string, count: number) {
      encoder = videoEncoder(path, t.fps, enc);
      for (let i = 0; i < count; i++) {
        await stage.page.evaluate(async (i) => {
          await (window as any).deliverFrame(
            (window as any).__stage.renderFrame(i),
          );
        }, i);
        if (i % 150 === 0) console.log(`frames ${i}/${count}`);
      }
      await encoder.finish();
      encoder = undefined;
    }
    const benchFrames = Math.min(30, t.frames);
    let jpegSeconds: number | null = null,
      webCodecs: any = { supported: false };
    let selected = "jpeg-image2pipe";
    if (!dry) {
      const benchStart = performance.now();
      await pipeFrames(`${dir}/benchmark-jpeg.mp4`, benchFrames);
      jpegSeconds = (performance.now() - benchStart) / 1000;
      try {
        const start = performance.now();
        const bytes = await stage.page.evaluate(
          (n) => (window as any).__stage.exportMP4(n),
          benchFrames,
        );
        writeFileSync(
          `${dir}/benchmark-webcodecs.mp4`,
          Buffer.from(bytes, "base64"),
        );
        const info = JSON.parse(
          (
            await run("ffprobe", [
              "-v",
              "error",
              "-show_streams",
              "-of",
              "json",
              `${dir}/benchmark-webcodecs.mp4`,
            ])
          ).stdout,
        ).streams[0];
        if (info.codec_name !== "h264" || info.pix_fmt !== "yuv420p")
          throw new Error("WebCodecs codec/pixel format mismatch");
        webCodecs = {
          supported: true,
          seconds: (performance.now() - start) / 1000,
        };
        if (webCodecs.seconds < jpegSeconds) selected = "webcodecs-mp4";
      } catch (e) {
        webCodecs = { supported: false, error: e.message };
      }
      if (selected === "webcodecs-mp4") {
        try {
          const bytes = await stage.page.evaluate(() =>
            (window as any).__stage.exportMP4(),
          );
          writeFileSync(`${dir}/silent.mp4`, Buffer.from(bytes, "base64"));
        } catch (e) {
          selected = "jpeg-image2pipe";
          webCodecs.fullRenderFailure = e.message;
          await pipeFrames(`${dir}/silent.mp4`, t.frames);
        }
      } else await pipeFrames(`${dir}/silent.mp4`, t.frames);
    }
    const result = {
      encoder: enc,
      renderer: stage.info.renderer,
      gpuVerified: !/swiftshader|llvmpipe|software/i.test(stage.info.renderer),
      fallbacks: stage.info.fallbacks,
      determinism: samples,
      mouthChecks,
      seconds: (performance.now() - started) / 1000,
      frames: dry ? 0 : t.frames,
      benchmark: {
        jpeg30FramesSeconds: jpegSeconds,
        webCodecs,
        selected,
        frames: benchFrames,
      },
      errors: stage.errors,
      dry,
    };
    json(`${dir}/render.json`, result);
    return result;
  } finally {
    encoder?.kill();
    await stage.close();
  }
}
