import { HingePosition } from '../types';

export function calculateEquilibrium(
  FR_net: number,
  s_cp_net: number,
  L: number,
  hingePosition: HingePosition,
  hasTieRod: boolean,
  tieRodPosRel: number,
  tieRodAngle_deg: number,
  gateInclination_deg: number,
  gateWeight: number,
  gateWeightEnabled: boolean
) {
  let s_hinge = 0;
  if (hingePosition === HingePosition.BOTTOM) s_hinge = L;
  else if (hingePosition === HingePosition.NONE) return { M_hinge: 0, F_tie: 0, M_hydro: 0, M_weight: 0 };
  
  // Moment of hydrostatic force about hinge
  const M_hydro = FR_net * (s_cp_net - s_hinge);
  
  // Moment of gate weight about hinge
  let M_weight = 0;
  if (gateWeightEnabled) {
    const s_cg_gate = L / 2;
    const arm_weight_origin = s_cg_gate - s_hinge;
    const theta_rad = (gateInclination_deg * Math.PI) / 180;
    
    // Weight is vertical (0, -1)
    // Moment = r x F
    // r = (arm * cos(theta), arm * sin(theta)) relative to hinge?
    // Let's use scalar: M = F * arm_perpendicular
    // arm_perp = arm * cos(theta)
    M_weight = gateWeight * (arm_weight_origin * Math.cos(theta_rad));
  }

  const M_total = M_hydro + M_weight;
  
  let F_tie = 0;
  if (hasTieRod) {
    const s_tie = tieRodPosRel * L;
    const arm_tie_origin = s_tie - s_hinge;
    
    const theta_rad = (gateInclination_deg * Math.PI) / 180;
    const tie_rad = (tieRodAngle_deg * Math.PI) / 180;
    
    // Tie rod direction
    const tx = Math.cos(tie_rad);
    const ty = Math.sin(tie_rad);
    
    // Normal pointing downstream (direction of FR)
    const n_down_x = Math.sin(theta_rad);
    const n_down_y = -Math.cos(theta_rad);
    
    const dot_TN = tx * n_down_x + ty * n_down_y;
    
    if (Math.abs(dot_TN * arm_tie_origin) > 1e-6) {
      F_tie = -M_total / (dot_TN * arm_tie_origin);
    }
  }
  
  return { M_hinge: M_total, F_tie, M_hydro, M_weight };
}
