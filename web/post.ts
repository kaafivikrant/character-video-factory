export const post = { vignette: true, bloom: false };
export function vignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  if (!post.vignette) return;
  const g = ctx.createRadialGradient(
    w * 0.5,
    h * 0.45,
    w * 0.3,
    w * 0.5,
    h * 0.5,
    h * 0.8,
  );
  g.addColorStop(0, "#00000000");
  g.addColorStop(1, "#071b3150");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
