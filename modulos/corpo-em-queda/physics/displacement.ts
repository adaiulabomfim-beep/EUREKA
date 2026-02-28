export function calculateDeltaH(displacedVolume_m3: number, tankBaseArea_m2: number): number {
  if (tankBaseArea_m2 <= 0) return 0;
  return displacedVolume_m3 / tankBaseArea_m2;
}

export function calculateTankBaseArea(width_m: number, depth_m: number): number {
  return width_m * depth_m;
}
