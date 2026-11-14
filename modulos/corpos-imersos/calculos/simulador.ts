import { ObjectShape } from '../dominio/tipos';
import { calculateVolume, calculateBaseArea, calculateHeight, calculateVolumeFromBottom, calculateCenterOfBuoyancy } from './volume';
import { calculateMass, calculateWeight } from './massa';
import { calculateBuoyancyForce, calculateApparentWeight } from './empuxo';
import { calculateDeltaH, calculateTankBaseArea } from './deslocamento';
import { calcularEquilibrio, calcularSubmersao, criarCorpo, Camadas } from './equilibrio';
import { calcularPesoEspecificoCorpoImerso } from './pesoEspecificoImerso';

export const simularCorposImersos = (props: any) => {
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
