import { ObjectShape } from '../dominio/tipos';
import { calculateVolume, calculateBaseArea, calculateHeight, calculateVolumeFromBottom, calculateCenterOfBuoyancy } from './volume';
import { calculateMass, calculateWeight } from './massa';
import { calculateBuoyancyForce, calculateApparentWeight } from './empuxo';
import { calculateDeltaH, calculateTankBaseArea } from './deslocamento';
import { calcularEquilibrio } from './equilibrio';

export const simularCorposImersos = (props: any) => {
  const {
    shape, dim1, dim2, objectDensity,
    rhoA, rhoB,
    depthA, depthB, enableTwoFluids, gravity,
    tankWidth, tankDepth,
    visualScaleFactor, visualHeight, fluidSurfaceY,
    h_in_A, h_in_B,
    h_in_A_2 = 0, h_in_B_2 = 0,
    extraWeight = 0,
    twoBlocks = false,
    density2 = 0,
    dim1_2 = 0,
    dim2_2 = 0,
    cordLength = 0,
    shape2 = ObjectShape.CUBE
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

  const { d_eq, status, actualCordLength } = calcularEquilibrio(
    shape, H_cm, objectDensity, rhoA, rhoB, depthA, depthB, enableTwoFluids,
    extraWeight, twoBlocks, density2, H2_cm, cordLength, gravity, volume, volume2
  );

  const vol_sub_B = calculateVolumeFromBottom(shape, toM(dim1), toM(h_in_B), toM(dim2));
  const vol_total_sub = calculateVolumeFromBottom(shape, toM(dim1), toM(h_in_A + h_in_B), toM(dim2));
  const vol_sub_A = Math.max(0, vol_total_sub - vol_sub_B);

  // Volumes submersos para o bloco 2
  const vol_sub_B_2 = twoBlocks ? calculateVolumeFromBottom(shape2, toM(dim1_2), toM(h_in_B_2), toM(dim2_2)) : 0;
  const vol_total_sub_2 = twoBlocks ? calculateVolumeFromBottom(shape2, toM(dim1_2), toM(h_in_A_2 + h_in_B_2), toM(dim2_2)) : 0;
  const vol_sub_A_2 = twoBlocks ? Math.max(0, vol_total_sub_2 - vol_sub_B_2) : 0;

  const vol_deslocado = vol_total_sub + vol_total_sub_2;
  const tankBaseArea = calculateTankBaseArea(tankWidth / 100, tankDepth / 100);
  const deltaH_m = calculateDeltaH(vol_deslocado, tankBaseArea);
  const deltaH_cm = deltaH_m * 100;

  const E_A = calculateBuoyancyForce(rhoA, vol_sub_A, gravity);
  const E_B = enableTwoFluids ? calculateBuoyancyForce(rhoB, vol_sub_B, gravity) : 0;
  
  const E_A_2 = twoBlocks ? calculateBuoyancyForce(rhoA, vol_sub_A_2, gravity) : 0;
  const E_B_2 = (twoBlocks && enableTwoFluids) ? calculateBuoyancyForce(rhoB, vol_sub_B_2, gravity) : 0;
  const E_2 = E_A_2 + E_B_2;

  const buoyancyForce = E_A + E_B + E_2;
  const apparentWeight = (objectWeight + objectWeight2 + extraWeight) - buoyancyForce;

  // Calculate center of buoyancy (in cm)
  const centerOfBuoyancyY = calculateCenterOfBuoyancy(shape, toM(dim1), toM(h_in_A + h_in_B), toM(dim2)) * 100;

  const equivalentDensity = (objectMass + objectMass2 + (extraWeight / gravity)) / (volume + (twoBlocks ? volume2 : 0));

  return {
    volume,
    baseArea,
    H_cm,
    objectWeight: objectWeight + objectWeight2 + extraWeight,
    objectMass: objectMass + objectMass2 + (extraWeight / gravity),
    equivalentDensity,
    status,
    h_sub_actual: h_in_A + h_in_B + (twoBlocks ? h_in_A_2 + h_in_B_2 : 0),
    h_in_A,
    h_in_B,
    vol_sub_A,
    vol_sub_B,
    vol_deslocado,
    deltaH_cm,
    tankBaseArea,
    E_A,
    E_B,
    buoyancyForce,
    apparentWeight,
    d_eq,
    centerOfBuoyancyY,
    H2_cm,
    volume2,
    objectWeight2,
    extraWeight,
    actualCordLength
  };
};
