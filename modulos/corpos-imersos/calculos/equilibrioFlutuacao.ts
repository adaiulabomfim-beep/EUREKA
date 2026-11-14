export interface EquilibrioFlutuacaoInput {
  diameterCm: number;
  totalHeightCm: number;
  submergedHeightCm: number;
  fluidDensity: number; // kg/m³
  gravity: number; // m/s²
  tankWidthCm: number;
  tankDepthCm: number;
}

export interface EquilibrioFlutuacaoResult {
  diameterCm: number;
  diameterM: number;
  radiusCm: number;
  radiusM: number;
  totalHeightCm: number;
  totalHeightM: number;
  submergedHeightCm: number;
  submergedHeightM: number;
  emergedHeightCm: number;
  emergedHeightM: number;
  baseAreaM2: number;
  baseAreaCm2: number;
  totalVolumeM3: number;
  totalVolumeCm3: number;
  submergedVolumeM3: number;
  submergedVolumeCm3: number;
  emergedVolumeM3: number;
  emergedVolumeCm3: number;
  submergedFraction: number;
  submergedPercentage: number;
  fluidDensity: number;
  fluidSpecificWeight: number;
  buoyancyForceN: number;
  canWeightN: number;
  canMassKg: number;
  equivalentDensity: number;
  equivalentSpecificWeight: number;
  centerOfGravityY_cm: number;
  centerOfBuoyancyY_cm: number;
  tankBaseAreaM2: number;
  deltaH_cm: number;
  isValidInput: boolean;
}

/**
 * Calcula o equilíbrio hidrostático de um cilindro vertical flutuante (Problema 2.104):
 * - A = π · D² / 4
 * - V_total = A · H
 * - V_sub = A · h_sub
 * - V_em = V_total - V_sub = A · h_em
 * - E = γ_fluido · V_sub (Princípio de Arquimedes)
 * - P = E (Equilíbrio de flutuação: ΣF_y = 0)
 */
export function calcularEquilibrioFlutuacao(
  input: EquilibrioFlutuacaoInput
): EquilibrioFlutuacaoResult {
  const {
    diameterCm,
    totalHeightCm,
    submergedHeightCm,
    fluidDensity,
    gravity,
    tankWidthCm,
    tankDepthCm,
  } = input;

  const safeDiameterCm = Math.max(0.1, diameterCm);
  const safeTotalHeightCm = Math.max(0.1, totalHeightCm);
  const safeSubmergedHeightCm = Math.max(
    0,
    Math.min(safeTotalHeightCm, submergedHeightCm)
  );
  const emergedHeightCm = Math.max(0, safeTotalHeightCm - safeSubmergedHeightCm);

  const diameterM = safeDiameterCm / 100;
  const radiusCm = safeDiameterCm / 2;
  const radiusM = diameterM / 2;
  const totalHeightM = safeTotalHeightCm / 100;
  const submergedHeightM = safeSubmergedHeightCm / 100;
  const emergedHeightM = emergedHeightCm / 100;

  // Área da seção transversal circular: A = π · D² / 4
  const baseAreaM2 = (Math.PI * Math.pow(diameterM, 2)) / 4;
  const baseAreaCm2 = (Math.PI * Math.pow(safeDiameterCm, 2)) / 4;

  // Volumes: V_total, V_sub e V_em
  const totalVolumeM3 = baseAreaM2 * totalHeightM;
  const totalVolumeCm3 = baseAreaCm2 * safeTotalHeightCm;

  const submergedVolumeM3 = baseAreaM2 * submergedHeightM;
  const submergedVolumeCm3 = baseAreaCm2 * safeSubmergedHeightCm;

  const emergedVolumeM3 = Math.max(0, totalVolumeM3 - submergedVolumeM3);
  const emergedVolumeCm3 = Math.max(0, totalVolumeCm3 - submergedVolumeCm3);

  // Fração submersa
  const submergedFraction =
    safeTotalHeightCm > 0 ? safeSubmergedHeightCm / safeTotalHeightCm : 0;
  const submergedPercentage = submergedFraction * 100;

  // Peso específico do fluido: γ = ρ · g
  const fluidSpecificWeight = fluidDensity * gravity;

  // Princípio de Arquimedes: E = γ_fluido · V_sub
  const buoyancyForceN = fluidSpecificWeight * submergedVolumeM3;

  // Condição de equilíbrio de flutuação: ΣF_y = 0 => P = E
  const canWeightN = buoyancyForceN;
  const canMassKg = gravity > 0 ? canWeightN / gravity : 0;

  // Massa específica e peso específico equivalentes da lata
  const equivalentDensity = totalVolumeM3 > 0 ? canMassKg / totalVolumeM3 : 0;
  const equivalentSpecificWeight =
    totalVolumeM3 > 0 ? canWeightN / totalVolumeM3 : 0;

  // Centros geométricos (medidos a partir da base inferior da lata)
  const centerOfGravityY_cm = safeTotalHeightCm / 2;
  const centerOfBuoyancyY_cm = safeSubmergedHeightCm / 2;

  const tankBaseAreaM2 = (tankWidthCm / 100) * (tankDepthCm / 100);
  // Na Figura P2.104 o nível de água já representa a posição final de equilíbrio (h_sub = 8 cm, h_em = 3 cm)
  const deltaH_cm = 0;

  const isValidInput =
    diameterCm > 0 &&
    totalHeightCm > 0 &&
    submergedHeightCm > 0 &&
    submergedHeightCm <= totalHeightCm &&
    fluidDensity > 0 &&
    gravity > 0;

  return {
    diameterCm: safeDiameterCm,
    diameterM,
    radiusCm,
    radiusM,
    totalHeightCm: safeTotalHeightCm,
    totalHeightM,
    submergedHeightCm: safeSubmergedHeightCm,
    submergedHeightM,
    emergedHeightCm,
    emergedHeightM,
    baseAreaM2,
    baseAreaCm2,
    totalVolumeM3,
    totalVolumeCm3,
    submergedVolumeM3,
    submergedVolumeCm3,
    emergedVolumeM3,
    emergedVolumeCm3,
    submergedFraction,
    submergedPercentage,
    fluidDensity,
    fluidSpecificWeight,
    buoyancyForceN,
    canWeightN,
    canMassKg,
    equivalentDensity,
    equivalentSpecificWeight,
    centerOfGravityY_cm,
    centerOfBuoyancyY_cm,
    tankBaseAreaM2,
    deltaH_cm,
    isValidInput,
  };
}
