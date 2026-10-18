import * as THREE from "three";
import { MannequinAdapter } from "./character/mannequin";
import { AtlasAdapter } from "./character/atlas";
import { VRMAdapter } from "./character/vrmAdapter";
import { mistyLake } from "./scenes/misty_lake_bridge";
import { streetNight } from "./scenes/street_night";
import { hdri } from "./scenes/hdri";
import { vignette } from "./post";
import { gesturePose, ease } from "../src/timeline/gestures";
const rng = (seed: number, i: number) => {
  const x = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
let timeline: any,
  scene: any,
  camera: any,
  renderer: any,
  environment: any,
  characters: any[] = [],
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D;
let fallbacks: string[] = [];
let mouthState: Record<string, any> = {};
async function load(t: any) {
  timeline = t;
  fallbacks = [];
  characters = [];
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(27, t.size[0] / t.size[1], 0.05, 150);
  renderer?.dispose();
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(1);
  renderer.setSize(...t.size);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  canvas = document.createElement("canvas");
  [canvas.width, canvas.height] = t.size;
  document.body.replaceChildren(canvas);
  ctx = canvas.getContext("2d")!;
  scene.add(new THREE.HemisphereLight("#d9e8ea", "#53606a", 2.5));
  const sun = new THREE.DirectionalLight("#fff0d5", 3);
  sun.position.set(-3, 7, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5 });
  sun.shadow.bias = -0.001;
  scene.add(sun);
  const rim = new THREE.DirectionalLight("#efb17c", 2.2);
  rim.position.set(2, 3, -4);
  scene.add(rim);
  if (t.spec.scene.startsWith("hdri:")) {
    try {
      environment = await hdri(scene, t.spec.scene.slice(5));
    } catch {
      fallbacks.push("HDRI missing; procedural lake");
      environment = mistyLake(scene, t.seed);
    }
  } else
    environment =
      t.spec.scene === "street_night"
        ? streetNight(scene, t.seed)
        : mistyLake(scene, t.seed);
  for (const config of t.spec.characters) {
    let adapter: any;
    try {
      if (config.model === "builtin:atlas") adapter = new AtlasAdapter(config);
      else {
        if (!t.models?.[config.id]) throw new Error("model missing");
        adapter = new VRMAdapter(config);
      }
      await adapter.load();
    } catch {
      adapter = new MannequinAdapter(config);
      await adapter.load();
      fallbacks.push(`${config.id}: mannequin`);
    }
    scene.add(adapter.root);
    characters.push({ id: config.id, config, adapter });
  }
  const gl = renderer.getContext(),
    ext = gl.getExtension("WEBGL_debug_renderer_info");
  return {
    renderer: ext
      ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER),
    fallbacks,
  };
}
function renderFrame(
  i: number,
  backgroundOnly = false,
  hideCaptions = false,
  exportJpeg = true,
) {
  mouthState = {};
  const t = i / timeline.fps,
    [w, h] = timeline.size;
  const line = timeline.lines.find((l: any) => t >= l.start && t < l.end);
  const activeIndex =
    line?.index ??
    Math.max(
      0,
      timeline.lines.findLastIndex((l: any) => l.start <= t),
    );
  const shot = timeline.shots[activeIndex];
  let shotStart = activeIndex;
  while (shotStart > 0 && !timeline.shots[shotStart].cut) shotStart--;
  const subject =
      characters.find((c) => c.id === shot.speaker) || characters[0],
    p = subject.config.position;
  const target = new THREE.Vector3(
    p[0],
    p[1] + (shot.shot === "full" ? 0.9 : shot.shot === "close" ? 1.55 : 1.18),
    p[2],
  );
  const aspect = w / h;
  const distance =
    (shot.shot === "full" ? 5.4 : shot.shot === "close" ? 3.0 : 2.6) *
    (aspect < 0.8 ? 1.12 : 1);
  const push =
    1 -
    Math.min(0.03, Math.max(0, t - timeline.shots[shotStart].start) * 0.003);
  camera.position.set(
    target.x + Math.sin(t * 0.31 + timeline.seed) * 0.008,
    target.y + 0.07,
    target.z + distance * push,
  );
  camera.lookAt(target);
  camera.rotation.z = Math.sin(t * 0.39 + timeline.seed) * 0.0018;
  for (const c of characters) {
    const a = c.adapter;
    a.root.visible = !backgroundOnly;
    const isSpeaker = line?.speaker === c.id;
    const phase = timeline.seed + c.config.position[0] * 7;
    const pose: any = {
      spine: [
        Math.sin(t * 1.3 + phase) * 0.01,
        0,
        Math.sin(t * 0.7 + phase) * 0.015,
      ],
      head: [
        Math.sin(t * 0.9 + phase) * 0.012,
        Math.sin(t * 0.37 + phase) * 0.025,
        0,
      ],
    };
    if (isSpeaker)
      Object.assign(
        pose,
        gesturePose(
          line.gesture,
          t - line.start,
          line.end - line.start,
          line.intensity,
        ),
      );
    else pose.head[0] += Math.sin(t * 2 + phase) * 0.025;
    a.setPose(pose);
    a.root.position.y =
      c.config.position[1] + Math.sin(t * 1.7 + phase) * 0.006;
    const faceNames = [
      "happy",
      "sad",
      "angry",
      "relaxed",
      "surprised",
      "blink",
    ];
    for (const n of faceNames) a.setExpression(n, 0);
    const current = timeline.lines[activeIndex],
      previous = timeline.lines[activeIndex - 1];
    const blend = ease((t - current.start) / 0.24);
    for (const n of faceNames) {
      const from =
          previous?.speaker === c.id
            ? (previous.face?.[n] || 0) * previous.intensity
            : 0,
        to =
          current.speaker === c.id
            ? (current.face?.[n] || 0) * current.intensity
            : 0;
      a.setExpression(n, from * (1 - blend) + to * blend);
    }
    let blink = 0,
      next = 2.5 + rng(timeline.seed, phase) * 3;
    for (let b = 0; next < t + 0.15; b++) {
      if (Math.abs(t - next) < 0.1)
        blink = Math.max(blink, 1 - Math.abs(t - next) / 0.1);
      next += 2.5 + rng(timeline.seed, b + phase + 1) * 3;
    }
    a.setExpression("blink", blink);
    const track = isSpeaker
      ? timeline.lipsync?.find((l: any) => l.line === line.index)
      : null;
    const weights = track?.track[
      Math.floor((t - line.start) * timeline.fps)
    ] || {
      aa: 0,
      ih: 0,
      oh: 0,
      ou: 0,
      ee: 0,
    };
    mouthState[c.id] = weights;
    a.setViseme(weights);
    if (a.phone) a.phone.visible = isSpeaker && line.gesture === "hold_phone";
    const gaze =
      isSpeaker || !line
        ? camera.position
        : characters
            .find((o) => o.id === line.speaker)
            ?.adapter.root.position.clone()
            .add(new THREE.Vector3(0, 1.6, 0));
    a.lookAt(gaze || camera.position);
    a.update(0);
  }
  environment.update(t);
  renderer.render(scene, camera);
  ctx.drawImage(renderer.domElement, 0, 0);
  vignette(ctx, w, h);
  if (t >= timeline.outroStart && timeline.spec.outro.type === "card") {
    ctx.fillStyle = timeline.spec.outro.background;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#18353d";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${h * 0.055}px sans-serif`;
    ctx.fillText(timeline.spec.outro.text, w / 2, h / 2, w * 0.84);
  } else if (!backgroundOnly && !hideCaptions) {
    const cap = timeline.captions.find((c: any) => t >= c.start && t < c.end);
    if (cap) {
      const pop =
        timeline.spec.captions.style === "yellow_pop"
          ? 0.9 + 0.1 * ease((t - cap.start) / 0.09)
          : 1;
      ctx.save();
      ctx.translate(w / 2, h * 0.72);
      ctx.scale(pop, pop);
      ctx.font = `900 ${Math.round(h * 0.052)}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(3, h * 0.003);
      ctx.strokeStyle = "#111c21";
      ctx.fillStyle =
        timeline.spec.captions.style === "yellow_pop" ? "#ffe651" : "white";
      const rows = cap.text.split("\n");
      rows.forEach((s: string, j: number) => {
        const y = (j - (rows.length - 1) / 2) * h * 0.061;
        if (timeline.spec.captions.style === "boxed") {
          const m = ctx.measureText(s);
          ctx.save();
          ctx.fillStyle = "#12232bdd";
          ctx.fillRect(
            -Math.min(m.width, w * 0.84) / 2 - 14,
            y - h * 0.03,
            Math.min(m.width, w * 0.84) + 28,
            h * 0.061,
          );
          ctx.restore();
        }
        ctx.strokeText(s, 0, y, w * 0.84);
        ctx.fillText(s, 0, y, w * 0.84);
      });
      ctx.restore();
    }
  }
  return exportJpeg ? canvas.toDataURL("image/jpeg", 0.92).split(",")[1] : "";
}
async function exportMP4(frames = timeline.frames) {
  if (!(window as any).VideoEncoder) throw new Error("WebCodecs unavailable");
  const { Output, Mp4OutputFormat, BufferTarget, CanvasSource } =
    await import("mediabunny");
  const target = new BufferTarget();
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: "in-memory" }),
    target,
  });
  const source = new CanvasSource(canvas, {
    codec: "avc",
    bitrate: 8000000,
    hardwareAcceleration: "prefer-hardware",
    keyFrameInterval: 2,
  });
  output.addVideoTrack(source, { frameRate: timeline.fps });
  try {
    await output.start();
    for (let i = 0; i < frames; i++) {
      renderFrame(i, false, false, false);
      await source.add(i / timeline.fps, 1 / timeline.fps);
    }
    await output.finalize();
    const bytes = new Uint8Array(target.buffer!);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 32768)
      binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
    return btoa(binary);
  } catch (e) {
    await output.cancel();
    throw e;
  }
}
(window as any).__stage = {
  load,
  renderFrame,
  exportMP4,
  get mouthState() {
    return mouthState;
  },
  get canvas() {
    return canvas;
  },
};
