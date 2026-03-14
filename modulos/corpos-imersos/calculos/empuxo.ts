export function calculateBuoyancyForce(fluidDensity_kg_m3: number, displacedVolume_m3: number, gravity: number): number {
  return fluidDensity_kg_m3 * gravity * displacedVolume_m3;
}

export function calculateApparentWeight(weight_N: number, buoyancy_N: number): number {
  return Math.max(0, weight_N - buoyancy_N);
}
