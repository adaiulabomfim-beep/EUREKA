import { ObjectShape } from '../dominio/tipos';
import { calculateVolume, calculateBaseArea, calculateHeight, calculateVolumeFromBottom, calculateCenterOfBuoyancy } from './volume';
import { calculateMass, calculateWeight } from './massa';
import { calculateBuoyancyForce, calculateApparentWeight } from './empuxo';
import { calculateDeltaH, calculateTankBaseArea } from './deslocamento';
import { calcularEquilibrio, calcularSubmersao, criarCorpo, Camadas } from './equilibrio';

export const simularCorposImersos = (props: any) => {
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

  return {
    volume,
    baseArea,
    H_cm,
    objectDensity,
    objectWeight: totalWeight,
    objectMass: totalMass,
    equivalentDensity,
    status,
    h_sub_actual: h_in_A + h_in_B + (twoBlocks ? h_in_A_2 + h_in_B_2 : 0),
    h_in_A,
    h_in_B,
    vol_sub_A: vol_sub_A + vol_sub_A_2,
    vol_sub_B: vol_sub_B + vol_sub_B_2,
    vol_deslocado,
    deltaH_cm,
    tankBaseArea,
    E_A: E_A + E_A_2,
    E_B: E_B + E_B_2,
    buoyancyForce,
    apparentWeight,
    d_eq,
    centerOfBuoyancyY,
    H2_cm,
    volume2,
    objectWeight2,
    extraWeight,
    actualCordLength,
    eqVolDeslocado,
    eqHSubActual,
    eqBuoyancyForce,
  };
};
