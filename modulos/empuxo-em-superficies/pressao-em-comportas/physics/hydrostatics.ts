// modules/pressao-em-comportas/physics/hydrostatics.ts
import { DamType } from '../types';

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
  A_full: number,
  ybar_full: number,
  Ixx_full_about_centroid: number,
  yFull: number,          // "altura" total ao longo da superfície (m)
  h0: number              // profundidade do topo (m) em relação ao nível livre (gauge)
): PlaneSideResult {
  // 1) definir faixa molhada: onde h(y) > 0
  // h(y)=h0 + y*sinθ > 0  =>  y > -h0/sinθ
  const yStartWet = Math.max(0, safeDiv(-h0, sinTheta, 0));
  const yEndWet = yFull;

  const yWet = Math.max(0, yEndWet - yStartWet);

  if (yWet <= 0 || A_full <= 0) {
    return {
      yWet: 0,
      A_wet: 0,
      ybar: 0,
      hbar: 0,
      p_top: 0,
      p_bot: 0,
      F: 0,
      y_cp: 0,
      h_cp: 0,
      M_top: 0
    };
  }

  /**
   * 2) Recorte didático (e simples) para sua primeira versão:
   * Para o modo "retângulo", esse recorte é exato se você calcular A_full, ybar_full e Ixx_full
   * para o retângulo e depois substituir por A_wet = b*yWet, ybar = yStartWet + yWet/2, Ixx = b*yWet^3/12.
   *
   * Como seu projeto tem múltiplas formas, a forma correta é:
   * - ter funções em shapes.ts/wetting.ts que devolvam A_wet, ybar_wet e Ixx_wet para o trecho molhado.
   *
   * Aqui, para não quebrar tudo agora, vou fazer um fallback linear:
   * - escala de área proporcional ao comprimento molhado
   * - centroid desloca para o meio do trecho molhado
   * - Ixx proporcional ao cubo do comprimento (apenas aproximação)
   *
   * Isso já permite jusante + diagrama. Depois a gente troca pelo recorte exato por forma.
   */
  const wetRatio = yWet / yFull;
  const A_wet = A_full * wetRatio;

  // CG aproximado: no meio do trecho molhado
  const ybar = yStartWet + yWet / 2;

  // Ixx aproximado: escala ~ (yWet/yFull)^3
  const Ixx = Ixx_full_about_centroid * Math.pow(wetRatio, 3);

  // 3) profundidade vertical no CG e pressões
  const hbar = h0 + ybar * sinTheta;
  const p_cg = gamma * Math.max(0, hbar);

  // Pressão no topo e na base do trecho molhado
  const h_top = h0 + yStartWet * sinTheta;
  const h_bot = h0 + yEndWet * sinTheta;
  const p_top = gamma * Math.max(0, h_top);
  const p_bot = gamma * Math.max(0, h_bot);

  // 4) Força resultante (forma “de aula”)
  // F = γ * hbar * A
  const F = p_cg * A_wet;

  // 5) Centro de pressão ao longo da superfície
  // y_cp = ybar + Ixx/(A*ybar_eff)
  // Aqui ybar_eff deve ser medido a partir da linha onde p=0.
  // Se h0>=0, p=0 no topo (y=0). Se h0<0, p=0 ocorre em y = -h0/sinθ (= yStartWet).
  // Então usamos y' = ybar - y0
  const y0 = yStartWet;
  const ybar_eff = Math.max(1e-9, ybar - y0);

  const y_cp_local = ybar_eff + safeDiv(Ixx, A_wet * ybar_eff, 0);
  const y_cp = y0 + y_cp_local;

  const h_cp = h0 + y_cp * sinTheta;

  // momento em relação ao topo (para composição): M = F * y_cp
  const M_top = F * y_cp;

  return { yWet, A_wet, ybar, hbar, p_top, p_bot, F, y_cp, h_cp, M_top };
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
  damType: DamType,
  damCrestWidth: number,
  damBaseWidth: number,
  damHeight: number,
  gravity: number,
  upstreamLevel: number,
  F_up_x: number
) {
  const vol_dam_per_m = ((damCrestWidth + damBaseWidth) / 2) * damHeight;
  const matDensity = damType === DamType.EMBANKMENT ? 1900 : 2400;
  const Weight = vol_dam_per_m * matDensity * gravity;
  const arm_upstream_horizontal = upstreamLevel / 3;
  const M_resisting = Weight * (damBaseWidth * 0.6);
  const M_overturning = F_up_x * arm_upstream_horizontal;
  const FS = M_overturning > 1 ? M_resisting / M_overturning : 999;
  return { Weight, M_resisting, M_overturning, FS };
}