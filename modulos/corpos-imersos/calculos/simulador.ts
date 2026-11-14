import { ObjectShape } from '../dominio/tipos';
import { calculateVolume, calculateBaseArea, calculateHeight, calculateVolumeFromBottom, calculateCenterOfBuoyancy } from './volume';
import { calculateMass, calculateWeight } from './massa';
import { calculateBuoyancyForce, calculateApparentWeight } from './empuxo';
import { calculateDeltaH, calculateTankBaseArea } from './deslocamento';
import { calcularEquilibrio, calcularSubmersao, criarCorpo, Camadas } from './equilibrio';
import { calcularPesoEspecificoCorpoImerso } from './pesoEspecificoImerso';
import { calcularEquilibrioFlutuacao } from './equilibrioFlutuacao';
import { calcularEquilibrioInterfaceDoisFluidos } from './equilibrioInterfaceDoisFluidos';
import { calcularBoiaSubmersaAncorada } from './boiaSubmersaAncorada';

export const simularCorposImersos = (props: any) => {
  if (props?.anchoredBuoyMode) {
    const {
      buoyDiameterM = 1.5,
      buoyWeightKN = 8.5,
      rhoA = 1025,
      gravity = 9.81,
      tankWidth = 320,
      tankDepth = 320,
      depthA = 280,
    } = props;

    const ab = calcularBoiaSubmersaAncorada({
      diameterM: buoyDiameterM,
      weightKN: buoyWeightKN,
      fluidDensity: rhoA,
      gravity,
      tankWidthCm: tankWidth,
      tankDepthCm: tankDepth,
      fluidDepthCm: depthA,
    });

    const status = !ab.isValidInput
      ? 'DADOS INVÁLIDOS'
      : ab.isCableInTension
      ? 'SUBMERSA E ANCORADA EM EQUILÍBRIO (E = W + T)'
      : 'SEM TRAÇÃO NO CABO (W ≥ E)';

    return {
      anchoredBuoyMode: true,
      anchoredBuoyValid: ab.isValidInput,
      isCableInTension: ab.isCableInTension,
      buoyDiameterM: ab.diameterM,
      buoyDiameterCm: ab.diameterCm,
      buoyRadiusM: ab.radiusM,
      buoyRadiusCm: ab.radiusCm,
      buoyWeightKN: ab.weightKN,
      buoyWeightN: ab.weightN,
      volume: ab.volumeM3,
      vol_sub_A: ab.volumeSubmergedM3,
      vol_sub_B: 0,
      vol_deslocado: ab.volumeSubmergedM3,
      baseArea: ab.crossSectionAreaM2,
      H_cm: ab.diameterCm,
      objectDensity: ab.equivalentDensity,
      objectSpecificWeight: ab.equivalentSpecificWeightN,
      objectSpecificWeightKN: ab.equivalentSpecificWeightKN,
      fluidSpecificWeight: ab.fluidSpecificWeightN,
      fluidSpecificWeightKN: ab.fluidSpecificWeightKN,
      objectWeight: ab.weightN,
      objectWeight1: ab.weightN,
      objectMass: ab.massKg,
      objectMass1: ab.massKg,
      objectMass2: 0,
      equivalentDensity: ab.equivalentDensity,
      status,
      isShallowTank: false,
      h_sub_actual: ab.diameterCm,
      h_in_A: ab.diameterCm,
      h_in_B: 0,
      deltaH_cm: ab.deltaH_cm,
      deltaH_B_cm: 0,
      tankBaseArea: ab.tankBaseAreaM2,
      E_A: ab.buoyancyForceN,
      E_B: 0,
      E_1: ab.buoyancyForceN,
      E_2: 0,
      buoyancyForce: ab.buoyancyForceN,
      buoyancyForceKN: ab.buoyancyForceKN,
      cordTension: ab.cableTensionN,
      cableTensionN: ab.cableTensionN,
      cableTensionKN: ab.cableTensionKN,
      apparentWeight: 0,
      d_eq: ab.d_eq_cm,
      centerOfBuoyancyY: ab.centerOfBuoyancyY_cm,
      centerOfGravityY: ab.centerOfGravityY_cm,
      cableLengthCm: ab.cableLengthCm,
      equilibriumCheckN: ab.equilibriumCheckN,
      equilibriumCheckKN: ab.equilibriumCheckKN,
      H2_cm: 0,
      volume2: 0,
      objectWeight2: 0,
      extraWeight: 0,
      actualCordLength: 0,
      twoBlocks: false,
      rhoA: ab.fluidDensity,
      rhoB: 0,
      eqVolDeslocado: ab.volumeSubmergedM3,
      eqHSubActual: ab.diameterCm,
      eqBuoyancyForce: ab.buoyancyForceN,
      submergedVolume: ab.volumeSubmergedM3,
      specificWeightKNm3: ab.fluidSpecificWeightKN,
      specificWeightNm3: ab.fluidSpecificWeightN,
      buoyancyKN: ab.buoyancyForceKN,
      buoyancy: ab.buoyancyForceN,
      standardTemperatureC: 15,
      radiusM: ab.radiusM,
      diameterM: ab.diameterM,
    };
  }

  if (props?.interfaceEquilibriumMode) {
    const {
      bodyRelativeDensity = 7.85,
      upperFluidRelativeDensity = 1.0,
      lowerFluidRelativeDensity = 13.56,
      illustrativeWidthCm = 80,
      illustrativeHeightCm = 90,
      depthA = 110,
      depthB = 90,
      tankWidth = 260,
      tankDepth = 260,
      gravity = 9.81,
    } = props;

    const eqInt = calcularEquilibrioInterfaceDoisFluidos({
      bodyRelativeDensity,
      upperFluidRelativeDensity,
      lowerFluidRelativeDensity,
      illustrativeWidthCm,
      illustrativeHeightCm,
      upperFluidDepthCm: depthA,
      lowerFluidDepthCm: depthB,
      tankWidthCm: tankWidth,
      tankDepthCm: tankDepth,
      gravity,
    });

    const status = !eqInt.isValidInterfaceEquilibrium
      ? 'FORA DA CONDIÇÃO DE INTERFACE (d_a < d_s < d_m)'
      : 'FLUTUANDO NA INTERFACE ÁGUA-MERCÚRIO (P = E_a + E_m)';

    return {
      interfaceEquilibriumMode: true,
      interfaceValid: eqInt.isValidInterfaceEquilibrium,
      bodyRelativeDensity: eqInt.bodyRelativeDensity,
      upperFluidRelativeDensity: eqInt.upperFluidRelativeDensity,
      lowerFluidRelativeDensity: eqInt.lowerFluidRelativeDensity,
      waterRefSpecificWeight: eqInt.waterRefSpecificWeight,
      bodySpecificWeight: eqInt.bodySpecificWeight,
      upperFluidSpecificWeight: eqInt.upperFluidSpecificWeight,
      lowerFluidSpecificWeight: eqInt.lowerFluidSpecificWeight,
      numeratorDiff: eqInt.numeratorDiff,
      denominatorDiff: eqInt.denominatorDiff,
      totalDensitySpan: eqInt.totalDensitySpan,
      ratioAtoB: eqInt.ratioAtoB,
      fractionA: eqInt.fractionA,
      fractionB: eqInt.fractionB,
      illustrativeWidthCm: eqInt.illustrativeWidthCm,
      illustrativeHeightCm: eqInt.illustrativeHeightCm,
      heightA_cm: eqInt.heightA_cm,
      heightB_cm: eqInt.heightB_cm,
      heightA_m: eqInt.heightA_m,
      heightB_m: eqInt.heightB_m,
      volume: eqInt.totalVolumeM3,
      baseArea: eqInt.baseAreaM2,
      H_cm: eqInt.illustrativeHeightCm,
      objectDensity: eqInt.bodyDensity,
      objectSpecificWeight: eqInt.bodySpecificWeight,
      fluidSpecificWeight: eqInt.upperFluidSpecificWeight,
      objectWeight: eqInt.bodyWeightN,
      objectWeight1: eqInt.bodyWeightN,
      objectMass: eqInt.bodyMassKg,
      objectMass1: eqInt.bodyMassKg,
      objectMass2: 0,
      equivalentDensity: eqInt.bodyDensity,
      status,
      isShallowTank: false,
      h_sub_actual: eqInt.illustrativeHeightCm,
      h_in_A: eqInt.heightA_cm,
      h_in_B: eqInt.heightB_cm,
      vol_sub_A: eqInt.volumeA_m3,
      vol_sub_B: eqInt.volumeB_m3,
      vol_deslocado: eqInt.totalVolumeM3,
      deltaH_cm: eqInt.deltaH_cm,
      deltaH_B_cm: 0,
      tankBaseArea: eqInt.tankBaseAreaM2,
      E_A: eqInt.buoyancyWaterN,
      E_B: eqInt.buoyancyMercuryN,
      E_1: eqInt.totalBuoyancyN,
      E_2: 0,
      cordTension: 0,
      buoyancyForce: eqInt.totalBuoyancyN,
      apparentWeight: 0,
      d_eq: eqInt.d_eq_cm,
      centerOfBuoyancyY: eqInt.centerOfBuoyancyY_cm,
      centerOfGravityY: eqInt.centerOfGravityY_cm,
      centerOfBuoyancyWaterY: eqInt.centerOfBuoyancyWaterY_cm,
      centerOfBuoyancyMercuryY: eqInt.centerOfBuoyancyMercuryY_cm,
      equilibriumErrorN: eqInt.equilibriumErrorN,
      H2_cm: 0,
      volume2: 0,
      objectWeight2: 0,
      extraWeight: 0,
      actualCordLength: 0,
      twoBlocks: false,
      rhoA: eqInt.upperFluidDensity,
      rhoB: eqInt.lowerFluidDensity,
      eqVolDeslocado: eqInt.totalVolumeM3,
      eqHSubActual: eqInt.illustrativeHeightCm,
      eqBuoyancyForce: eqInt.totalBuoyancyN,
    };
  }

  if (props?.floatingEquilibriumMode) {
    const {
      cylinderDiameterCm = 9,
      cylinderHeightCm = 11,
      submergedHeightCm = 8,
      rhoA = 1000,
      gravity = 9.81,
      tankWidth = 28,
      tankDepth = 28,
    } = props;

    const fl = calcularEquilibrioFlutuacao({
      diameterCm: cylinderDiameterCm,
      totalHeightCm: cylinderHeightCm,
      submergedHeightCm,
      fluidDensity: rhoA,
      gravity,
      tankWidthCm: tankWidth,
      tankDepthCm: tankDepth,
    });

    const status = !fl.isValidInput
      ? 'DADOS INVÁLIDOS'
      : fl.submergedHeightCm >= fl.totalHeightCm
      ? 'TOTALMENTE SUBMERSO (P = E)'
      : 'FLUTUANDO EM EQUILÍBRIO (P = E)';

    return {
      floatingEquilibriumMode: true,
      floatingValid: fl.isValidInput,
      diameterCm: fl.diameterCm,
      radiusCm: fl.radiusCm,
      totalHeightCm: fl.totalHeightCm,
      submergedHeightCm: fl.submergedHeightCm,
      emergedHeightCm: fl.emergedHeightCm,
      baseArea: fl.baseAreaM2,
      baseAreaCm2: fl.baseAreaCm2,
      volume: fl.totalVolumeM3,
      totalVolumeCm3: fl.totalVolumeCm3,
      vol_sub_A: fl.submergedVolumeM3,
      vol_sub_B: 0,
      vol_deslocado: fl.submergedVolumeM3,
      submergedVolumeCm3: fl.submergedVolumeCm3,
      vol_emerso: fl.emergedVolumeM3,
      emergedVolumeCm3: fl.emergedVolumeCm3,
      submergedFraction: fl.submergedFraction,
      submergedPercentage: fl.submergedPercentage,
      H_cm: fl.totalHeightCm,
      objectDensity: fl.equivalentDensity,
      objectSpecificWeight: fl.equivalentSpecificWeight,
      fluidSpecificWeight: fl.fluidSpecificWeight,
      objectWeight: fl.canWeightN,
      objectWeight1: fl.canWeightN,
      objectMass: fl.canMassKg,
      objectMass1: fl.canMassKg,
      objectMass2: 0,
      equivalentDensity: fl.equivalentDensity,
      status,
      isShallowTank: false,
      h_sub_actual: fl.submergedHeightCm,
      h_in_A: fl.submergedHeightCm,
      h_in_B: 0,
      deltaH_cm: fl.deltaH_cm,
      deltaH_B_cm: 0,
      tankBaseArea: fl.tankBaseAreaM2,
      E_A: fl.buoyancyForceN,
      E_B: 0,
      E_1: fl.buoyancyForceN,
      E_2: 0,
      cordTension: 0,
      buoyancyForce: fl.buoyancyForceN,
      apparentWeight: 0,
      d_eq: fl.submergedHeightCm,
      centerOfBuoyancyY: fl.centerOfBuoyancyY_cm,
      centerOfGravityY: fl.centerOfGravityY_cm,
      H2_cm: 0,
      volume2: 0,
      objectWeight2: 0,
      extraWeight: 0,
      actualCordLength: 0,
      twoBlocks: false,
      rhoA: fl.fluidDensity,
      rhoB: 0,
      eqVolDeslocado: fl.submergedVolumeM3,
      eqHSubActual: fl.submergedHeightCm,
      eqBuoyancyForce: fl.buoyancyForceN,
    };
  }

  if (props?.inverseSpecificWeightMode) {
    const {
      realWeightN = 445,
      apparentWeightN = 267,
      fluidSpecificWeight = 9802,
      gravity = 9.81,
      tankWidth = 90,
      tankDepth = 90,
      depthA = 80,
      h_in_A = 0,
    } = props;

    const inv = calcularPesoEspecificoCorpoImerso({
      realWeightN,
      apparentWeightN,
      fluidSpecificWeight,
      gravity,
      tankWidthCm: tankWidth,
      tankDepthCm: tankDepth,
    });

    const sideM = inv.illustrativeCubeSideCm / 100;
    const immersedH_cm = Math.min(inv.illustrativeCubeSideCm, Math.max(0, h_in_A));
    const status = !inv.isValidInput
      ? 'DADOS INVÁLIDOS (P ≤ Pap)'
      : inv.apparentWeightN > 0
      ? 'TOTALMENTE IMERSO (SUSPENSO)'
      : 'EQUILÍBRIO HIDROSTÁTICO (P = E)';

    return {
      inverseSpecificWeightMode: true,
      inverseValid: inv.isValidInput,
      volume: inv.displacedVolumeM3,
      baseArea: sideM * sideM,
      H_cm: inv.illustrativeCubeSideCm,
      illustrativeSideCm: inv.illustrativeCubeSideCm,
      objectDensity: inv.bodyDensity,
      objectSpecificWeight: inv.bodySpecificWeight,
      fluidSpecificWeight: inv.fluidSpecificWeight,
      objectWeight: inv.realWeightN,
      objectWeight1: inv.realWeightN,
      objectMass: inv.bodyMassKg,
      objectMass1: inv.bodyMassKg,
      objectMass2: 0,
      equivalentDensity: inv.bodyDensity,
      status,
      isShallowTank: false,
      h_sub_actual: immersedH_cm > 0 ? immersedH_cm : inv.illustrativeCubeSideCm,
      h_in_A: immersedH_cm > 0 ? immersedH_cm : inv.illustrativeCubeSideCm,
      h_in_B: 0,
      vol_sub_A: inv.displacedVolumeM3,
      vol_sub_B: 0,
      vol_deslocado: inv.displacedVolumeM3,
      deltaH_cm: inv.deltaH_cm,
      deltaH_B_cm: 0,
      tankBaseArea: inv.tankBaseAreaM2,
      E_A: inv.buoyancyForceN,
      E_B: 0,
      E_1: inv.buoyancyForceN,
      E_2: 0,
      cordTension: inv.apparentWeightN,
      buoyancyForce: inv.buoyancyForceN,
      apparentWeight: inv.apparentWeightN,
      d_eq: Math.min(depthA - 8, Math.max(inv.illustrativeCubeSideCm + 12, depthA * 0.55 + inv.illustrativeCubeSideCm * 0.5)),
      centerOfBuoyancyY: inv.illustrativeCubeSideCm / 2,
      H2_cm: 0,
      volume2: 0,
      objectWeight2: 0,
      extraWeight: 0,
      actualCordLength: 0,
      twoBlocks: false,
      rhoA: inv.fluidDensity,
      rhoB: 0,
      eqVolDeslocado: inv.displacedVolumeM3,
      eqHSubActual: inv.illustrativeCubeSideCm,
      eqBuoyancyForce: inv.buoyancyForceN,
    };
  }

  const {
    shape, dim1, dim2, objectDensity,
    rhoA, rhoB,
    depthA, depthB, enableTwoFluids, gravity,
    tankWidth, tankDepth,
    h_in_A, h_in_B,
    h_in_A_2 = 0, h_in_B_2 = 0,
    extraWeight = 0,
    twoBlocks = false,
    density2 = 0,
    dim1_2 = 0,
    dim2_2 = 0,
    cordLength = 0,
    shape2 = ObjectShape.CUBE,
    rigidRod = false
  } = props;

  const toM = (cm: number) => cm / 100;

  const volume = calculateVolume(shape, toM(dim1), toM(dim2));
  const baseArea = calculateBaseArea(shape, toM(dim1));
  const H_cm = calculateHeight(shape, toM(dim1), toM(dim2)) * 100;
  const objectMass = calculateMass(volume, objectDensity);
  const objectWeight = calculateWeight(objectMass, gravity);

  const volume2 = twoBlocks ? calculateVolume(shape2, toM(dim1_2), toM(dim2_2)) : 0;
  const H2_cm = twoBlocks ? calculateHeight(shape2, toM(dim1_2), toM(dim2_2)) * 100 : 0;
  const objectMass2 = twoBlocks ? calculateMass(volume2, density2) : 0;
  const objectWeight2 = twoBlocks ? calculateWeight(objectMass2, gravity) : 0;

  const tankBaseArea = calculateTankBaseArea(tankWidth / 100, tankDepth / 100);

  const corpo1 = criarCorpo(shape, toM(dim1), toM(dim2));
  const corpo2 = twoBlocks ? criarCorpo(shape2, toM(dim1_2), toM(dim2_2)) : null;
  const camadas: Camadas = {
    rhoA,
    rhoB,
    depthA_m: toM(depthA),
    depthB_m: toM(depthB),
    enableTwoFluids,
    tankArea_m2: tankBaseArea,
    gravity,
  };

  const { d_eq, status, actualCordLength, z1_eq, z2_eq } = calcularEquilibrio(
    corpo1,
    objectWeight + extraWeight,
    corpo2,
    objectWeight2,
    toM(cordLength),
    camadas,
    rigidRod
  );

  // Estado em equilíbrio estático (usado pelo histórico ao iniciar a simulação)
  const eqSub = calcularSubmersao(
    corpo2 ? [corpo2, corpo1] : [corpo1],
    corpo2 ? [z2_eq, z1_eq] : [z1_eq],
    camadas
  );
  const eqVolDeslocado = eqSub.corpos.reduce((acc, c) => acc + c.vol_A + c.vol_B, 0);
  const eqHSubActual = eqSub.corpos.reduce((acc, c) => acc + (c.h_in_A + c.h_in_B) * 100, 0);
  const eqBuoyancyForce = eqSub.E_total;

  const vol_sub_B = calculateVolumeFromBottom(shape, toM(dim1), toM(h_in_B), toM(dim2));
  const vol_total_sub = calculateVolumeFromBottom(shape, toM(dim1), toM(h_in_A + h_in_B), toM(dim2));
  const vol_sub_A = Math.max(0, vol_total_sub - vol_sub_B);

  // Volumes submersos para o bloco 2
  const vol_sub_B_2 = twoBlocks ? calculateVolumeFromBottom(shape2, toM(dim1_2), toM(h_in_B_2), toM(dim2_2)) : 0;
  const vol_total_sub_2 = twoBlocks ? calculateVolumeFromBottom(shape2, toM(dim1_2), toM(h_in_A_2 + h_in_B_2), toM(dim2_2)) : 0;
  const vol_sub_A_2 = twoBlocks ? Math.max(0, vol_total_sub_2 - vol_sub_B_2) : 0;

  const vol_deslocado = vol_total_sub + vol_total_sub_2;
  const deltaH_m = calculateDeltaH(vol_deslocado, tankBaseArea);
  const deltaH_cm = deltaH_m * 100;

  const E_A = calculateBuoyancyForce(rhoA, vol_sub_A, gravity);
  const E_B = enableTwoFluids ? calculateBuoyancyForce(rhoB, vol_sub_B, gravity) : 0;

  const E_A_2 = twoBlocks ? calculateBuoyancyForce(rhoA, vol_sub_A_2, gravity) : 0;
  const E_B_2 = (twoBlocks && enableTwoFluids) ? calculateBuoyancyForce(rhoB, vol_sub_B_2, gravity) : 0;
  const E_2 = E_A_2 + E_B_2;

  const buoyancyForce = E_A + E_B + E_2;
  const totalWeight = objectWeight + objectWeight2 + extraWeight;
  // Peso aparente medido por dinamômetro nunca é negativo (fios não trabalham à compressão)
  const apparentWeight = calculateApparentWeight(totalWeight, buoyancyForce);

  // Calculate center of buoyancy (in cm, relative to the bottom of Block 1 upward)
  const cb1_cm = calculateCenterOfBuoyancy(shape, toM(dim1), toM(h_in_A + h_in_B), toM(dim2)) * 100;
  const cb2_from_bot2_cm = twoBlocks
    ? calculateCenterOfBuoyancy(shape2, toM(dim1_2), toM(h_in_A_2 + h_in_B_2), toM(dim2_2)) * 100
    : 0;
  const cb2_cm = -(actualCordLength + H2_cm) + cb2_from_bot2_cm;
  const centerOfBuoyancyY =
    twoBlocks && vol_deslocado > 0
      ? (vol_total_sub * cb1_cm + vol_total_sub_2 * cb2_cm) / vol_deslocado
      : cb1_cm;

  const totalMass = objectMass + objectMass2 + (gravity > 0 ? extraWeight / gravity : 0);
  const totalVolume = volume + (twoBlocks ? volume2 : 0);
  const equivalentDensity = totalVolume > 0 ? totalMass / totalVolume : objectDensity;

  const maxFluidDensity = enableTwoFluids ? Math.max(rhoA, rhoB) : rhoA;
  const isShallowTank = status === 'AFUNDADO' && equivalentDensity < maxFluidDensity;

  const deltaH_B_m = enableTwoFluids ? calculateDeltaH(vol_sub_B + vol_sub_B_2, tankBaseArea) : 0;
  const deltaH_B_cm = deltaH_B_m * 100;

  let cordTension = 0;
  if (twoBlocks && actualCordLength > 0) {
    if (z2_eq > 1e-5) {
      cordTension = Math.max(0, objectWeight2 - E_2);
    } else {
      cordTension = Math.max(0, (E_A + E_B) - (objectWeight + extraWeight));
    }
  }

  return {
    volume,
    baseArea,
    H_cm,
    objectDensity,
    objectWeight: totalWeight,
    objectWeight1: objectWeight,
    objectMass: totalMass,
    objectMass1: objectMass,
    objectMass2,
    equivalentDensity,
    status,
    isShallowTank,
    h_sub_actual: h_in_A + h_in_B + (twoBlocks ? h_in_A_2 + h_in_B_2 : 0),
    h_in_A: h_in_A + (twoBlocks ? h_in_A_2 : 0),
    h_in_B: h_in_B + (twoBlocks ? h_in_B_2 : 0),
    vol_sub_A: vol_sub_A + vol_sub_A_2,
    vol_sub_B: vol_sub_B + vol_sub_B_2,
    vol_deslocado,
    deltaH_cm,
    deltaH_B_cm,
    tankBaseArea,
    E_A: E_A + E_A_2,
    E_B: E_B + E_B_2,
    E_1: E_A + E_B,
    E_2,
    cordTension,
    buoyancyForce,
    apparentWeight,
    d_eq,
    centerOfBuoyancyY,
    H2_cm,
    volume2,
    objectWeight2,
    extraWeight,
    actualCordLength,
    twoBlocks,
    rhoA,
    rhoB,
    eqVolDeslocado,
    eqHSubActual,
    eqBuoyancyForce,
  };
};
