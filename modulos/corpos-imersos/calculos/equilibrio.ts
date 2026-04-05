import { ObjectShape } from '../dominio/tipos';

export const calcularEquilibrio = (
  shape: ObjectShape,
  H_cm: number,
  objectDensity: number,
  rhoA: number,
  rhoB: number,
  depthA: number,
  depthB: number,
  enableTwoFluids: boolean,
  extraWeight: number = 0,
  twoBlocks: boolean = false,
  density2: number = 0,
  H2_cm: number = 0,
  cordLength: number = 0,
  gravity: number = 9.81,
  volume1: number = 0,
  volume2: number = 0
): { d_eq: number; status: string; actualCordLength: number } => {
  const fluidTotalDepth = enableTwoFluids ? depthA + depthB : depthA;
  let d_eq = 0; // Profundidade da base do bloco inferior (bloco 2 se existir, senão bloco 1)
  let status = "FLUTUANDO";
  let actualCordLength = 0;

  // Peso total do sistema (N)
  const W1 = objectDensity * volume1 * gravity;
  const W2 = twoBlocks ? density2 * volume2 * gravity : 0;
  const W_total = W1 + W2 + extraWeight;

  // Empuxo máximo (totalmente submerso)
  const E_max2_A = twoBlocks ? rhoA * volume2 * gravity : 0;
  const E_max1_A = rhoA * volume1 * gravity;
  const E_total_max_A = E_max1_A + E_max2_A;

  const E_max2_B = twoBlocks ? rhoB * volume2 * gravity : 0;
  const E_max1_B = rhoB * volume1 * gravity;
  const E_total_max_B = E_max1_B + E_max2_B;

  if (!enableTwoFluids) {
    actualCordLength = (twoBlocks && W2 > E_max2_A) ? cordLength : 0;

    if (Math.abs(W_total - E_total_max_A) < 0.1) {
      status = "SUSPENSO (EQUILÍBRIO NEUTRO)";
      d_eq = fluidTotalDepth / 2 + (twoBlocks ? H2_cm : H_cm / 2);
    } else if (W_total < E_total_max_A) {
      status = "FLUTUANDO";
      if (twoBlocks) {
        if (W_total <= E_max2_A) {
          // Apenas o bloco 2 está parcialmente submerso
          const v_sub2 = W_total / (rhoA * gravity);
          d_eq = (v_sub2 / volume2) * H2_cm;
        } else {
          // Bloco 2 totalmente submerso, bloco 1 parcialmente
          const v_sub1 = (W_total - E_max2_A) / (rhoA * gravity);
          d_eq = H2_cm + actualCordLength + (v_sub1 / volume1) * H_cm;
        }
      } else {
        const v_sub = W_total / (rhoA * gravity);
        d_eq = (v_sub / volume1) * H_cm;
      }
    } else {
      status = "AFUNDADO";
      d_eq = fluidTotalDepth;
    }
  } else {
    if (!twoBlocks && extraWeight === 0) {
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
    } else {
      if (W_total <= E_total_max_A) {
        actualCordLength = (twoBlocks && W2 > E_max2_A) ? cordLength : 0;
        status = "FLUTUANDO EM A";
        if (twoBlocks) {
          if (W_total <= E_max2_A) {
            const v_sub2 = W_total / (rhoA * gravity);
            d_eq = (v_sub2 / volume2) * H2_cm;
          } else {
            const v_sub1 = (W_total - E_max2_A) / (rhoA * gravity);
            d_eq = H2_cm + actualCordLength + (v_sub1 / volume1) * H_cm;
          }
        } else {
          const v_sub = W_total / (rhoA * gravity);
          d_eq = (v_sub / volume1) * H_cm;
        }
      } else if (W_total < E_total_max_B) {
        status = "FLUTUANDO NA INTERFACE/B";
        if (twoBlocks) {
          const E_2_in_B = E_max2_B;
          actualCordLength = (twoBlocks && W2 > E_max2_B) ? cordLength : 0;
          if (W_total <= E_2_in_B + E_max1_A) {
            const E_needed_from_2 = W_total; 
            if (E_needed_from_2 <= E_max2_B) {
              const h_in_B = (W_total / gravity - rhoA * volume2) / ((rhoB - rhoA) * (volume2 / H2_cm));
              d_eq = depthA + Math.max(0, h_in_B);
            } else {
              const E_needed_from_1 = W_total - E_max2_B;
              const h_in_B_1 = (E_needed_from_1 / gravity - rhoA * volume1) / ((rhoB - rhoA) * (volume1 / H_cm));
              d_eq = depthA + Math.max(0, h_in_B_1) + actualCordLength + H2_cm;
            }
          } else {
            const v_sub1_B = (W_total - E_max2_B) / (rhoB * gravity);
            d_eq = depthA + depthB; 
          }
        } else {
          let h_in_B_calc = (H_cm * (objectDensity - rhoA)) / (rhoB - rhoA);
          if (h_in_B_calc > H_cm) h_in_B_calc = H_cm;
          if (h_in_B_calc < 0) h_in_B_calc = 0;
          d_eq = depthA + h_in_B_calc;
        }
      } else {
        actualCordLength = (twoBlocks && W2 > E_max2_B) ? cordLength : 0;
        status = "AFUNDADO";
        d_eq = fluidTotalDepth;
      }
    }
  }

  return { d_eq, status, actualCordLength };
};
