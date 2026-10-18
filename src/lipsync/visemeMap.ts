export type Weights = {
  aa: number;
  ih: number;
  ee: number;
  oh: number;
  ou: number;
};
export const closed = (): Weights => ({ aa: 0, ih: 0, ee: 0, oh: 0, ou: 0 });
export function viseme(shape: string, intensity = 0.5): Weights {
  const map = {
    A: {},
    B: { ih: 0.5, ee: 0.2 },
    C: { ee: 0.6, aa: 0.3 },
    D: { aa: 1 },
    E: { oh: 0.8 },
    F: { ou: 0.9 },
    G: { ih: 0.3 },
    H: { ee: 0.3, aa: 0.2 },
    X: {},
  };
  const w: Weights = { ...closed(), ...map[shape] };
  for (const k in w) w[k] *= 0.65 + 0.35 * intensity;
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  if (sum > 1) for (const k in w) w[k] /= sum;
  return w;
}
export function smoothTrack(
  cues: any[],
  duration: number,
  fps: number,
  intensity: number,
) {
  const result: Weights[] = [],
    w = closed(),
    v = closed(),
    dt = 1 / (fps * 8);
  for (let frame = 0; frame < Math.ceil(duration * fps); frame++) {
    for (let sub = 0; sub < 8; sub++) {
      const t = (frame + sub / 8) / fps,
        idx = cues.findIndex((c) => c.start <= t && c.end > t),
        cue = cues[idx];
      let target = cue ? cue.weights || viseme(cue.value, intensity) : closed();
      if (cue && idx + 1 < cues.length && cue.end - t < 0.05) {
        const next =
            cues[idx + 1].weights || viseme(cues[idx + 1].value, intensity),
          blend = 0.4 * (1 - (cue.end - t) / 0.05);
        target = { ...target };
        for (const k in target)
          target[k] = target[k] * (1 - blend) + next[k] * blend;
      }
      for (const k in w) {
        const omega = 2 / (target[k] > w[k] ? 0.035 : 0.06);
        v[k] += (omega * omega * (target[k] - w[k]) - 2 * omega * v[k]) * dt;
        w[k] = Math.max(0, Math.min(1, w[k] + v[k] * dt));
      }
    }
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    result.push(
      Object.fromEntries(
        Object.entries(w).map(([k, x]) => [k, sum > 1 ? x / sum : x]),
      ) as Weights,
    );
  }
  return result;
}
