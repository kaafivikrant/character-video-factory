export const ease = (x: number) => {
  x = Math.max(0, Math.min(1, x));
  return x * x * (3 - 2 * x);
};
export function gesturePose(
  name: string,
  t: number,
  duration: number,
  intensity: number,
) {
  const envelope = ease(t / 0.3) * ease((duration - t) / 0.3),
    a = (0.35 + 0.65 * intensity) * envelope;
  const poses: any = {
    idle_sway: {},
    slow_breath: { spine: [0.04, 0, 0] },
    hold_phone: {
      rightUpperArm: [-1.15, 0, -0.18],
      rightLowerArm: [-0.85, 0, 0],
    },
    open_arms: { leftUpperArm: [0, 0, 0.75], rightUpperArm: [0, 0, -0.75] },
    shrug: { leftUpperArm: [-0.4, 0, 0.55], rightUpperArm: [-0.4, 0, -0.55] },
    point: { rightUpperArm: [-1.4, 0, -0.12] },
    palm_out: { rightUpperArm: [-0.85, 0, -0.2], rightLowerArm: [-0.9, 0, 0] },
    hand_to_neck: {
      rightUpperArm: [-0.6, 0, -0.6],
      rightLowerArm: [-1.9, 0, 0],
    },
    hand_to_chest: {
      rightUpperArm: [-0.65, 0, -0.6],
      rightLowerArm: [-1.35, 0, 0],
    },
    head_down: { head: [0.25, 0, 0] },
    look_away: { head: [0.08, 0.35, 0] },
    step_back: { spine: [-0.1, 0, 0] },
    lean_in: { spine: [0.15, 0, 0] },
    big_gesture: {
      leftUpperArm: [-0.5, 0, 1.2],
      rightUpperArm: [-0.5, 0, -1.1],
    },
  };
  return Object.fromEntries(
    Object.entries(poses[name] || {}).map(([k, v]: any) => [
      k,
      v.map((x: number) => x * a),
    ]),
  );
}
