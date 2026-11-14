export interface EntradaPesoEspecificoImerso {
  realWeightN: number;
  apparentWeightN: number;
  fluidSpecificWeight: number; // N/m³ (γf)
  gravity: number; // m/s²
  tankWidthCm: number;
  tankDepthCm: number;
}

export interface ResultadoPesoEspecificoImerso {
  realWeightN: number; // P (N)
  apparentWeightN: number; // Pap (N)
  buoyancyForceN: number; // E = P - Pap (N)
  displacedVolumeM3: number; // V = E / γf (m³)
  bodySpecificWeight: number; // γc = P / V (N/m³)
  bodyDensity: number; // ρc = γc / g (kg/m³)
  fluidSpecificWeight: number; // γf (N/m³)
  fluidDensity: number; // ρf = γf / g (kg/m³)
  bodyMassKg: number; // m = P / g (kg)
  illustrativeCubeSideCm: number; // aresta cúbica ilustrativa equivalente a V
  deltaH_cm: number;
  tankBaseAreaM2: number;
  isValidInput: boolean;
}

export function calcularPesoEspecificoCorpoImerso(
  entrada: EntradaPesoEspecificoImerso
): ResultadoPesoEspecificoImerso {
  const realWeightN = Math.max(0, entrada.realWeightN || 0);
  const apparentWeightN = Math.max(0, entrada.apparentWeightN || 0);
  const fluidSpecificWeight = Math.max(0, entrada.fluidSpecificWeight || 0);
  const gravity = Math.max(0.01, entrada.gravity || 9.81);

  const isValidInput =
    realWeightN > 0 &&
    apparentWeightN >= 0 &&
    realWeightN > apparentWeightN &&
    fluidSpecificWeight > 0;

  const buoyancyForceN = isValidInput ? realWeightN - apparentWeightN : 0;
  const displacedVolumeM3 =
    isValidInput && fluidSpecificWeight > 0 ? buoyancyForceN / fluidSpecificWeight : 0;
  const bodySpecificWeight =
    displacedVolumeM3 > 0 ? realWeightN / displacedVolumeM3 : 0;
  const bodyDensity = gravity > 0 ? bodySpecificWeight / gravity : 0;
  const fluidDensity = gravity > 0 ? fluidSpecificWeight / gravity : 0;
  const bodyMassKg = gravity > 0 ? realWeightN / gravity : 0;

  const illustrativeCubeSideM =
    displacedVolumeM3 > 0 ? Math.cbrt(displacedVolumeM3) : 0.25;
  const illustrativeCubeSideCm = illustrativeCubeSideM * 100;

  const tankBaseAreaM2 =
    Math.max(0.01, (entrada.tankWidthCm || 100) / 100) *
    Math.max(0.01, (entrada.tankDepthCm || 100) / 100);
  const deltaH_cm =
    tankBaseAreaM2 > 0 ? (displacedVolumeM3 / tankBaseAreaM2) * 100 : 0;

  return {
    realWeightN,
    apparentWeightN,
    buoyancyForceN,
    displacedVolumeM3,
    bodySpecificWeight,
    bodyDensity,
    fluidSpecificWeight,
    fluidDensity,
    bodyMassKg,
    illustrativeCubeSideCm,
    deltaH_cm,
    tankBaseAreaM2,
    isValidInput,
  };
}
