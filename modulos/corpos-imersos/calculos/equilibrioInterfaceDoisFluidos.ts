export interface EquilibrioInterfaceInput {
  bodyRelativeDensity: number; // d_s (ex.: 7,85 para o aço)
  upperFluidRelativeDensity: number; // d_a (ex.: 1,00 para a água)
  lowerFluidRelativeDensity: number; // d_m (ex.: 13,56 para o mercúrio)
  illustrativeWidthCm: number; // Largura ilustrativa da base (cm)
  illustrativeHeightCm: number; // Altura total ilustrativa H = a + b (cm)
  upperFluidDepthCm: number; // Profundidade da camada superior (cm)
  lowerFluidDepthCm: number; // Profundidade da camada inferior (cm)
  tankWidthCm: number;
  tankDepthCm: number;
  gravity: number; // m/s²
}

export interface EquilibrioInterfaceResult {
  bodyRelativeDensity: number;
  upperFluidRelativeDensity: number;
  lowerFluidRelativeDensity: number;
  waterRefDensity: number; // 1000 kg/m³
  waterRefSpecificWeight: number; // 9810 N/m³
  bodyDensity: number; // kg/m³
  upperFluidDensity: number; // kg/m³
  lowerFluidDensity: number; // kg/m³
  bodySpecificWeight: number; // γ_s (N/m³)
  upperFluidSpecificWeight: number; // γ_a (N/m³)
  lowerFluidSpecificWeight: number; // γ_m (N/m³)
  numeratorDiff: number; // d_m - d_s
  denominatorDiff: number; // d_s - d_a
  totalDensitySpan: number; // d_m - d_a
  ratioAtoB: number; // a / b = (d_m - d_s) / (d_s - d_a)
  fractionA: number; // a / (a + b)
  fractionB: number; // b / (a + b)
  illustrativeWidthCm: number;
  illustrativeHeightCm: number;
  baseAreaM2: number;
  totalVolumeM3: number;
  heightA_cm: number; // Distância a em água (cm)
  heightB_cm: number; // Distância b em mercúrio (cm)
  heightA_m: number;
  heightB_m: number;
  volumeA_m3: number;
  volumeB_m3: number;
  buoyancyWaterN: number; // E_água (N)
  buoyancyMercuryN: number; // E_mercúrio (N)
  totalBuoyancyN: number; // E_total = E_água + E_mercúrio (N)
  bodyWeightN: number; // P (N)
  bodyMassKg: number;
  equilibriumErrorN: number; // |P - (E_água + E_mercúrio)|
  d_eq_cm: number; // Profundidade da base do bloco abaixo da superfície livre superior (cm)
  centerOfGravityY_cm: number;
  centerOfBuoyancyY_cm: number;
  centerOfBuoyancyWaterY_cm: number;
  centerOfBuoyancyMercuryY_cm: number;
  tankBaseAreaM2: number;
  deltaH_cm: number;
  isValidInterfaceEquilibrium: boolean;
}

/**
 * Calcula o equilíbrio hidrostático de um bloco prismático uniforme na interface
 * entre dois fluidos imiscíveis (Problema 2.122 – Aço na interface Água-Mercúrio):
 *
 * Equilíbrio vertical (Princípio de Arquimedes):
 *   P = E_água + E_mercúrio
 *   γ_s · A · (a + b) = γ_a · A · a + γ_m · A · b
 *   d_s · (a + b) = d_a · a + d_m · b
 *   (d_s - d_a) · a = (d_m - d_s) · b
 *   a / b = (d_m - d_s) / (d_s - d_a)
 */
export function calcularEquilibrioInterfaceDoisFluidos(
  input: EquilibrioInterfaceInput
): EquilibrioInterfaceResult {
  const {
    bodyRelativeDensity,
    upperFluidRelativeDensity,
    lowerFluidRelativeDensity,
    illustrativeWidthCm,
    illustrativeHeightCm,
    upperFluidDepthCm,
    tankWidthCm,
    tankDepthCm,
    gravity,
  } = input;

  const waterRefDensity = 1000; // kg/m³
  const waterRefSpecificWeight = waterRefDensity * gravity; // N/m³

  const d_s = Math.max(0.01, bodyRelativeDensity);
  const d_a = Math.max(0.01, upperFluidRelativeDensity);
  const d_m = Math.max(d_a + 0.01, lowerFluidRelativeDensity);

  const bodyDensity = d_s * waterRefDensity;
  const upperFluidDensity = d_a * waterRefDensity;
  const lowerFluidDensity = d_m * waterRefDensity;

  const bodySpecificWeight = bodyDensity * gravity;
  const upperFluidSpecificWeight = upperFluidDensity * gravity;
  const lowerFluidSpecificWeight = lowerFluidDensity * gravity;

  // Condição física para equilíbrio na interface: d_a < d_s < d_m
  const isValidInterfaceEquilibrium = d_s > d_a && d_s < d_m;

  const numeratorDiff = d_m - d_s;
  const denominatorDiff = d_s - d_a;
  const totalDensitySpan = d_m - d_a;

  const ratioAtoB =
    isValidInterfaceEquilibrium && denominatorDiff > 1e-9
      ? numeratorDiff / denominatorDiff
      : 0;

  const fractionA =
    isValidInterfaceEquilibrium && totalDensitySpan > 1e-9
      ? numeratorDiff / totalDensitySpan
      : d_s <= d_a
      ? 1
      : 0;

  const fractionB =
    isValidInterfaceEquilibrium && totalDensitySpan > 1e-9
      ? denominatorDiff / totalDensitySpan
      : d_s >= d_m
      ? 1
      : 0;

  const safeWidthCm = Math.max(5, illustrativeWidthCm);
  const safeHeightCm = Math.max(5, illustrativeHeightCm);

  const widthM = safeWidthCm / 100;
  const heightM = safeHeightCm / 100;
  const baseAreaM2 = widthM * widthM;
  const totalVolumeM3 = baseAreaM2 * heightM;

  // Alturas a (na água) e b (no mercúrio) para a altura ilustrativa H = a + b
  const heightA_cm = safeHeightCm * fractionA;
  const heightB_cm = safeHeightCm * fractionB;
  const heightA_m = heightA_cm / 100;
  const heightB_m = heightB_cm / 100;

  const volumeA_m3 = baseAreaM2 * heightA_m;
  const volumeB_m3 = baseAreaM2 * heightB_m;

  // Empuxos exercidos por cada fluido e Peso total do bloco
  const buoyancyWaterN = upperFluidSpecificWeight * volumeA_m3;
  const buoyancyMercuryN = lowerFluidSpecificWeight * volumeB_m3;
  const totalBuoyancyN = buoyancyWaterN + buoyancyMercuryN;

  const bodyMassKg = bodyDensity * totalVolumeM3;
  const bodyWeightN = bodySpecificWeight * totalVolumeM3;
  const equilibriumErrorN = Math.abs(bodyWeightN - totalBuoyancyN);

  // Na interface: a superfície de separação água-mercúrio está na profundidade upperFluidDepthCm.
  // A parte b fica abaixo da interface (no mercúrio) e a parte a fica acima da interface (na água).
  const d_eq_cm = upperFluidDepthCm + heightB_cm;

  // Centros geométricos medidos a partir da base inferior do bloco:
  // - Região b (mercúrio): de y = 0 até y = b => centro em b / 2
  // - Região a (água): de y = b até y = b + a => centro em b + a / 2
  const centerOfGravityY_cm = safeHeightCm / 2;
  const centerOfBuoyancyMercuryY_cm = heightB_cm / 2;
  const centerOfBuoyancyWaterY_cm = heightB_cm + heightA_cm / 2;
  const centerOfBuoyancyY_cm =
    totalBuoyancyN > 0
      ? (buoyancyMercuryN * centerOfBuoyancyMercuryY_cm +
          buoyancyWaterN * centerOfBuoyancyWaterY_cm) /
        totalBuoyancyN
      : safeHeightCm / 2;

  const tankBaseAreaM2 = (tankWidthCm / 100) * (tankDepthCm / 100);
  // Na Figura P2.122 as camadas já representam a configuração em equilíbrio
  const deltaH_cm = 0;

  return {
    bodyRelativeDensity: d_s,
    upperFluidRelativeDensity: d_a,
    lowerFluidRelativeDensity: d_m,
    waterRefDensity,
    waterRefSpecificWeight,
    bodyDensity,
    upperFluidDensity,
    lowerFluidDensity,
    bodySpecificWeight,
    upperFluidSpecificWeight,
    lowerFluidSpecificWeight,
    numeratorDiff,
    denominatorDiff,
    totalDensitySpan,
    ratioAtoB,
    fractionA,
    fractionB,
    illustrativeWidthCm: safeWidthCm,
    illustrativeHeightCm: safeHeightCm,
    baseAreaM2,
    totalVolumeM3,
    heightA_cm,
    heightB_cm,
    heightA_m,
    heightB_m,
    volumeA_m3,
    volumeB_m3,
    buoyancyWaterN,
    buoyancyMercuryN,
    totalBuoyancyN,
    bodyWeightN,
    bodyMassKg,
    equilibriumErrorN,
    d_eq_cm,
    centerOfGravityY_cm,
    centerOfBuoyancyY_cm,
    centerOfBuoyancyWaterY_cm,
    centerOfBuoyancyMercuryY_cm,
    tankBaseAreaM2,
    deltaH_cm,
    isValidInterfaceEquilibrium,
  };
}
