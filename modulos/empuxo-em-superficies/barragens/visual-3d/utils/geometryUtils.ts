export function interpolateX(y: number, p1: { x: number, y: number }, p2: { x: number, y: number }): number {
  if (Math.abs(p2.y - p1.y) < 1e-6) return p1.x;
  const t = (y - p1.y) / (p2.y - p1.y);
  return p1.x + t * (p2.x - p1.x);
}
