import { ObjectShape } from '../dominio/tipos';
import { calculateVolume, calculateBaseArea, calculateHeight, calculateVolumeFromBottom } from './volume';
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
    h_in_A, h_in_B
  } = props;

  const toM = (cm: number) => cm / 100;

  const volume = calculateVolume(shape, toM(dim1), toM(dim2));
  const baseArea = calculateBaseArea(shape, toM(dim1));
  const H_cm = calculateHeight(shape, toM(dim1)) * 100;
  const objectMass = calculateMass(volume, objectDensity);
  const objectWeight = calculateWeight(objectMass, gravity);

  const { d_eq, status } = calcularEquilibrio(shape, H_cm, objectDensity, rhoA, rhoB, depthA, depthB, enableTwoFluids);

  const vol_sub_B = calculateVolumeFromBottom(shape, toM(dim1), toM(h_in_B));
  const vol_total_sub = calculateVolumeFromBottom(shape, toM(dim1), toM(h_in_A + h_in_B));
  const vol_sub_A = Math.max(0, vol_total_sub - vol_sub_B);

  const vol_deslocado = vol_total_sub;
  const tankBaseArea = calculateTankBaseArea(tankWidth / 100, tankDepth / 100);
  const deltaH_m = calculateDeltaH(vol_deslocado, tankBaseArea);
  const deltaH_cm = deltaH_m * 100;

  const E_A = calculateBuoyancyForce(rhoA, vol_sub_A, gravity);
  const E_B = enableTwoFluids ? calculateBuoyancyForce(rhoB, vol_sub_B, gravity) : 0;
  const buoyancyForce = E_A + E_B;
  const apparentWeight = calculateApparentWeight(objectWeight, buoyancyForce);

  return {
    volume,
    baseArea,
    H_cm,
    objectWeight,
    objectMass,
    status,
    h_sub_actual: h_in_A + h_in_B,
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
    d_eq
  };
};
