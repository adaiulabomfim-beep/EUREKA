// modules/empuxo-em-superficies/pressao-em-comportas/physics/hydrostatics.ts
import { TipoBarragem, FormaComporta } from '../dominio/tipos';

/** Utilitário: evita divisões por zero e NaN */
function safeDiv(n: number, d: number, fallback = 0) {
  return Math.abs(d) > 1e-9 ? n / d : fallback;
}

/**
 * Resultado de um lado (montante ou jusante) sobre uma superfície plana
 * medindo y ao longo da superfície, a partir do topo dessa superfície.
 */
export type PlaneSideResult = {
  // molhamento ao longo da superfície
  yWet: number;          // comprimento molhado ao longo da superfície (m)
  A_wet: number;         // área molhada (m²)
  ybar: number;          // posição do CG molhado ao longo da superfície (m)
  hbar: number;          // profundidade vertical do CG molhado (m)

  // pressão característica (gauge)
  p_top: number;         // pressão no topo da área molhada (Pa)
  p_bot: number;         // pressão na base da área molhada (Pa)

  // força e centro de pressão
  F: number;             // resultante (N)
  y_cp: number;          // CP ao longo da superfície (m, a partir do topo)
  h_cp: number;          // profundidade vertical do CP (m)

  // momento em relação ao topo da superfície (útil p/ composição)
  M_top: number;         // momento da força em relação ao topo (N·m)
};

/**
 * Assume distribuição hidrostática linear: p = γ h.
 * A superfície faz ângulo θ com a horizontal (ou use sinθ diretamente).
 *
 * Convenção: y (ao longo da superfície) cresce "para baixo".
 * h(y) = h0 + y * sinθ
 *
 * h0 = profundidade vertical do topo da superfície em relação ao nível livre daquele lado.
 * - Se o topo estiver acima do nível livre -> h0 < 0 e parte pode ficar seca.
 */
export function hydroPlaneSide(
  gamma: number,
  sinTheta: number,
  A_wet: number,         // Área molhada específica da geometria
  ybar: number,          // CG molhado específico da geometria
  Ixx: number,           // Inércia específica da geometria
  yFull: number,         // "altura" total ao longo da superfície (m)
  h0: number             // profundidade do topo (m) em relação ao nível livre (gauge)
): PlaneSideResult {
  // 1) profundidade vertical no CG e pressões
  const hbar = h0 + ybar * sinTheta;
  const p_cg = gamma * Math.max(0, hbar);

  // Pressão no topo e na base do trecho molhado
  const h_top = h0; // h(y=0)
  const h_bot = h0 + yFull * sinTheta; // h(y=yFull)
  const p_top = gamma * Math.max(0, h_top);
  const p_bot = gamma * Math.max(0, h_bot);

  // 4) Força resultante (forma “de aula”)
  // F = γ * hbar * A
  const F = p_cg * A_wet;

  // 5) Centro de pressão ao longo da superfície
  // y_cp = ybar + Ixx/(A*ybar_eff)
  const ybar_eff = Math.max(1e-9, ybar);

  const y_cp = ybar + safeDiv(Ixx, A_wet * ybar_eff, 0);

  const h_cp = h0 + y_cp * sinTheta;

  // momento em relação ao topo (para composição): M = F * y_cp
  const M_top = F * y_cp;

  return { yWet: yFull, A_wet, ybar, hbar, p_top, p_bot, F, y_cp, h_cp, M_top };
}

/**
 * Composição montante/jusante:
 * Resultado líquido = montante - jusante
 * CP líquido por momentos: y_cp = M_net / F_net
 */
export function hydroPlaneNet(
  upstream: PlaneSideResult,
  downstream: PlaneSideResult
) {
  const F_net = upstream.F - downstream.F;
  const M_net = upstream.M_top - downstream.M_top;

  const y_cp_net = safeDiv(M_net, F_net, 0);
  return { F_net, M_net, y_cp_net };
}

export function calculateNetForce(
  gateHeight: number,
  gateWidth: number,
  gateInclination: number,
  h_top_up: number,
  h_top_down: number,
  gamma: number,
  gateShape: FormaComporta
): { FR_net: number; s_cp_net: number; up: any; down: any } {
  const sinTheta = Math.sin((gateInclination * Math.PI) / 180);

  // Geometria básica (assumindo retangular para simplificar, ajustar conforme gateShape)
  const A = gateHeight * gateWidth;
  const ybar = gateHeight / 2;
  const Ixx = (gateWidth * Math.pow(gateHeight, 3)) / 12;

  const up = hydroPlaneSide(gamma, sinTheta, A, ybar, Ixx, gateHeight, h_top_up);
  const down = hydroPlaneSide(gamma, sinTheta, A, ybar, Ixx, gateHeight, h_top_down);

  const net = hydroPlaneNet(up, down);

  return { 
    FR_net: net.F_net, 
    s_cp_net: net.y_cp_net,
    up: {
      area: up.A_wet,
      wetLength: up.yWet,
      h_cg: up.hbar,
      FR: up.F,
      s_cg: up.ybar,
      s_cp: up.y_cp,
      h_cp: up.h_cp
    },
    down: {
      area: down.A_wet,
      wetLength: down.yWet,
      h_cg: down.hbar,
      FR: down.F,
      s_cg: down.ybar,
      s_cp: down.y_cp,
      h_cp: down.h_cp
    }
  };
}

/* ========= O que você já tinha (barragem/estabilidade) ========= */

export function calculateGlobalDamForces(
  gamma: number,
  upstreamLevel: number,
  damSin: number,
  damAngleRad: number
) {
  const F_upstream_magnitude = 0.5 * gamma * Math.pow(upstreamLevel, 2) / damSin;
  const F_up_x = F_upstream_magnitude * damSin;
  const F_up_y = F_upstream_magnitude * Math.cos(damAngleRad);
  return { F_upstream_magnitude, F_up_x, F_up_y };
}

export function calculateDamStability(
  damType: TipoBarragem,
  damCrestWidth: number,
  damBaseWidth: number,
  damHeight: number,
  gravity: number,
  upstreamLevel: number,
  F_up_x: number
) {
  const vol_dam_per_m = ((damCrestWidth + damBaseWidth) / 2) * damHeight;
  const matDensity = damType === TipoBarragem.TERRA_ENROCAMENTO ? 1900 : 2400;
  const Weight = vol_dam_per_m * matDensity * gravity;
  const arm_upstream_horizontal = upstreamLevel / 3;
  const M_resisting = Weight * (damBaseWidth * 0.6);
  const M_overturning = F_up_x * arm_upstream_horizontal;
  const FS = M_overturning > 1 ? M_resisting / M_overturning : 999;
  return { Weight, M_resisting, M_overturning, FS };
}