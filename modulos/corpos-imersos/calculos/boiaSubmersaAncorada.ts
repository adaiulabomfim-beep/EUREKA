export interface BoiaSubmersaAncoradaInput {
  diameterM: number; // m (ex.: 1,50 m)
  weightKN: number; // kN (ex.: 8,50 kN)
  fluidDensity: number; // kg/m³
  fluidSpecificWeightKN?: number; // kN/m³ (ex.: 10,1 kN/m³ para Água do Mar na Simulação 1)
  gravity: number; // m/s² (ex.: 9,81 m/s²)
  tankWidthCm: number;
  tankDepthCm: number;
  fluidDepthCm: number;
}

export interface BoiaSubmersaAncoradaResult {
  diameterM: number;
  diameterCm: number;
  radiusM: number;
  radiusCm: number;
  weightKN: number;
  weightN: number;
  massKg: number;
  volumeM3: number;
  volumeSubmergedM3: number;
  crossSectionAreaM2: number;
  fluidDensity: number;
  fluidSpecificWeightN: number;
  fluidSpecificWeightKN: number;
  buoyancyForceN: number;
  buoyancyForceKN: number;
  cableTensionN: number;
  cableTensionKN: number;
  isCableInTension: boolean;
  equivalentDensity: number;
  equivalentSpecificWeightN: number;
  equivalentSpecificWeightKN: number;
  centerOfGravityY_cm: number;
  centerOfBuoyancyY_cm: number;
  cableLengthCm: number;
  d_eq_cm: number;
  tankBaseAreaM2: number;
  deltaH_cm: number;
  equilibriumCheckN: number;
  equilibriumCheckKN: number;
  isValidInput: boolean;
}

/**
 * Calcula o equilíbrio hidrostático de uma boia esférica totalmente submersa
 * ancorada ao fundo por um cabo vertical (Exemplo 2.10):
 * - Etapa 1: Volume da esfera V = π · D³ / 6
 * - Etapa 2: Empuxo E = γ_mar · V (corpo totalmente submerso: V_sub = V)
 * - Etapa 3: Equilíbrio vertical ΣF_y = 0 => E - W - T = 0 => T = E - W
 */
export function calcularBoiaSubmersaAncorada(
  input: BoiaSubmersaAncoradaInput
): BoiaSubmersaAncoradaResult {
  const {
    diameterM,
    weightKN,
    fluidDensity,
    fluidSpecificWeightKN: inputSpecificWeightKN,
    gravity,
    tankWidthCm,
    tankDepthCm,
    fluidDepthCm,
  } = input;

  const safeDiameterM = Math.max(0.05, diameterM);
  const safeWeightKN = Math.max(0.01, weightKN);
  const safeGravity = Math.max(0.1, gravity);

  const hasExplicitSpecificWeight =
    typeof inputSpecificWeightKN === 'number' && Number.isFinite(inputSpecificWeightKN) && inputSpecificWeightKN > 0;
  const fluidSpecificWeightKN = hasExplicitSpecificWeight
    ? inputSpecificWeightKN
    : (Math.max(1, fluidDensity) * safeGravity) / 1000;
  const fluidSpecificWeightN = fluidSpecificWeightKN * 1000;
  const safeFluidDensity = hasExplicitSpecificWeight
    ? fluidSpecificWeightN / safeGravity
    : Math.max(1, fluidDensity);

  const diameterCm = safeDiameterM * 100;
  const radiusM = safeDiameterM / 2;
  const radiusCm = diameterCm / 2;

  const weightN = safeWeightKN * 1000;
  const massKg = weightN / safeGravity;

  // Etapa 1: Volume da boia esférica V = π · D³ / 6
  const volumeM3 = (Math.PI * Math.pow(safeDiameterM, 3)) / 6;
  const volumeSubmergedM3 = volumeM3; // Totalmente submersa
  const crossSectionAreaM2 = (Math.PI * Math.pow(safeDiameterM, 2)) / 4;

  // Etapa 2: Peso específico do fluido e Empuxo E = γ_mar · V
  const buoyancyForceN = fluidSpecificWeightN * volumeSubmergedM3;
  const buoyancyForceKN = buoyancyForceN / 1000;

  // Etapa 3: Equilíbrio vertical ΣF_y = 0 => E - W - T = 0 => T = E - W
  const isCableInTension = buoyancyForceN > weightN;
  const cableTensionN = Math.max(0, buoyancyForceN - weightN);
  const cableTensionKN = cableTensionN / 1000;

  // Propriedades equivalentes da boia
  const equivalentDensity = volumeM3 > 0 ? massKg / volumeM3 : 0;
  const equivalentSpecificWeightN = volumeM3 > 0 ? weightN / volumeM3 : 0;
  const equivalentSpecificWeightKN = equivalentSpecificWeightN / 1000;

  // Centros geométricos (medidos a partir do ponto inferior da esfera)
  const centerOfGravityY_cm = radiusCm;
  const centerOfBuoyancyY_cm = radiusCm;

  // Posicionamento totalmente submerso com cabo de ancoragem até o fundo
  const safeFluidDepthCm = Math.max(diameterCm + 60, fluidDepthCm);
  const cableLengthCm = Math.max(35, (safeFluidDepthCm - diameterCm) * 0.52);
  // d_eq_cm: distância da superfície livre até a base inferior da esfera
  const d_eq_cm = Math.max(diameterCm + 20, safeFluidDepthCm - cableLengthCm);

  const tankBaseAreaM2 = (tankWidthCm / 100) * (tankDepthCm / 100);
  // Na condição do Exemplo 2.10, o nível do mar já está estabelecido acima da boia
  const deltaH_cm = 0;

  const equilibriumCheckN = buoyancyForceN - weightN - cableTensionN;
  const equilibriumCheckKN = equilibriumCheckN / 1000;

  const isValidInput =
    diameterM > 0 &&
    weightKN > 0 &&
    (hasExplicitSpecificWeight ? inputSpecificWeightKN > 0 : fluidDensity > 0) &&
    gravity > 0;

  return {
    diameterM: safeDiameterM,
    diameterCm,
    radiusM,
    radiusCm,
    weightKN: safeWeightKN,
    weightN,
    massKg,
    volumeM3,
    volumeSubmergedM3,
    crossSectionAreaM2,
    fluidDensity: safeFluidDensity,
    fluidSpecificWeightN,
    fluidSpecificWeightKN,
    buoyancyForceN,
    buoyancyForceKN,
    cableTensionN,
    cableTensionKN,
    isCableInTension,
    equivalentDensity,
    equivalentSpecificWeightN,
    equivalentSpecificWeightKN,
    centerOfGravityY_cm,
    centerOfBuoyancyY_cm,
    cableLengthCm,
    d_eq_cm,
    tankBaseAreaM2,
    deltaH_cm,
    equilibriumCheckN,
    equilibriumCheckKN,
    isValidInput,
  };
}
