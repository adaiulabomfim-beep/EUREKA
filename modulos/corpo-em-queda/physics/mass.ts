export function calculateMass(volume_m3: number, density_kg_m3: number): number {
  return volume_m3 * density_kg_m3;
}

export function calculateWeight(mass_kg: number, gravity: number): number {
  return mass_kg * gravity;
}
