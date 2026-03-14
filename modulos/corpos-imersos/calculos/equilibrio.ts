import { ObjectShape } from '../dominio/tipos';

export const calcularEquilibrio = (
  shape: ObjectShape,
  H_cm: number,
  objectDensity: number,
  rhoA: number,
  rhoB: number,
  depthA: number,
  depthB: number,
  enableTwoFluids: boolean
) => {
  const fluidTotalDepth = enableTwoFluids ? depthA + depthB : depthA;
  let d_eq = 0;
  let status = "FLUTUANDO";

  if (!enableTwoFluids) {
    if (Math.abs(objectDensity - rhoA) < 1) {
      status = "SUSPENSO (EQUILÍBRIO NEUTRO)";
      d_eq = fluidTotalDepth / 2 + H_cm / 2;
    } else if (objectDensity < rhoA) {
      status = "FLUTUANDO";
      d_eq = H_cm * (objectDensity / rhoA);
    } else {
      status = "AFUNDADO";
      d_eq = fluidTotalDepth;
    }
  } else {
    if (objectDensity <= rhoA) {
      status = "FLUTUANDO EM A";
      const d_req_A = H_cm * (objectDensity / rhoA);
      if (d_req_A <= depthA) {
        d_eq = d_req_A;
      } else {
        d_eq = depthA;
      }
    } else if (objectDensity < rhoB) {
      status = "SUSPENSO NA INTERFACE";
      let h_in_B_calc = (H_cm * (objectDensity - rhoA)) / (rhoB - rhoA);
      if (h_in_B_calc > H_cm) h_in_B_calc = H_cm;
      if (h_in_B_calc < 0) h_in_B_calc = 0;
      d_eq = depthA + h_in_B_calc;
    } else {
      status = "AFUNDADO";
      d_eq = fluidTotalDepth;
    }
  }

  return { d_eq, status };
};
