// modules/empuxo-em-superficies/pressao-em-comportas/physics/hydrostatics.ts
import { FormaComporta } from '../dominio/tipos';

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
  Y_CG: number;          // distância da linha d'água ao CG ao longo do plano inclinado (m)
  Y_CP: number;          // distância da linha d'água ao CP ao longo do plano inclinado (m)
  delta_y: number;       // excentricidade do centro de pressão (m)

  // pressão característica (gauge)
  p_top: number;         // pressão no topo da área molhada (Pa)
  p_bot: number;         // pressão na base da área molhada (Pa)
  p_cg: number;          // pressão no centróide da área molhada (Pa)

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
  ybar: number,          // CG molhado específico da geometria (medido do topo da comporta)
  Ixx: number,           // Inércia específica da geometria
  yFull: number,         // "altura" total ao longo da superfície (m)
  h0: number,            // profundidade do topo (m) em relação ao nível livre (gauge)
  yWetLength?: number,   // comprimento efetivamente molhado (m)
  Y_CG_surface?: number  // distância da superfície livre até o CG molhado ao longo do plano (m)
): PlaneSideResult {
  const sinSafe = Math.max(0.001, Math.abs(sinTheta));
  const yWet = yWetLength !== undefined ? yWetLength : yFull;

  // Se nada estiver molhado (comporta inteiramente fora d'água)
  if (A_wet <= 0 || yWet <= 0) {
    return {
      yWet: 0,
      A_wet: 0,
      ybar: 0,
      hbar: 0,
      Y_CG: 0,
      Y_CP: 0,
      delta_y: 0,
      p_top: 0,
      p_bot: 0,
      p_cg: 0,
      F: 0,
      y_cp: 0,
      h_cp: 0,
      M_top: 0,
    };
  }

  // Profundidade vertical no CG e pressões
  const hbar = Y_CG_surface !== undefined ? Y_CG_surface * sinTheta : Math.max(0, h0 + ybar * sinTheta);
  const p_cg = gamma * Math.max(0, hbar);

  // Pressão no topo e na base do trecho molhado
  const h_top = Math.max(0, h0);
  const h_bot = Math.max(0, h0 + yFull * sinTheta);
  const p_top = gamma * h_top;
  const p_bot = gamma * h_bot;

  // Força resultante: F = p_cg * A_wet = γ * hbar * A_wet
  const F = p_cg * A_wet;

  // Distância do nível livre da água ao centróide ao longo do plano inclinado:
  const Y_CG = Y_CG_surface !== undefined ? Math.max(1e-6, Y_CG_surface) : Math.max(1e-6, hbar / sinSafe);
  const delta_y = safeDiv(Ixx, A_wet * Y_CG, 0);
  const y_cp = ybar + delta_y;
  const Y_CP = Y_CG + delta_y;
  const h_cp = Y_CP * sinTheta;

  // momento em relação ao topo: M = F * y_cp
  const M_top = F * y_cp;

  return { yWet, A_wet, ybar, hbar, Y_CG, Y_CP, delta_y, p_top, p_bot, p_cg, F, y_cp, h_cp, M_top };
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

/**
 * Helper para calcular propriedades geométricas e molhamento parcial
 */
function getGeometryAndWet(
  gateHeight: number,
  gateWidth: number,
  gateShape: FormaComporta,
  h0: number,
  sinTheta: number,
  directY_CG?: number
) {
  let A_total = 0;
  let ybar_total = 0;
  let Ixx_total = 0;

  if (gateShape === FormaComporta.RETANGULAR) {
    A_total = gateHeight * gateWidth;
    ybar_total = gateHeight / 2;
    Ixx_total = (gateWidth * Math.pow(gateHeight, 3)) / 12;
  } else if (gateShape === FormaComporta.CIRCULAR) {
    const r = gateHeight / 2;
    A_total = Math.PI * Math.pow(r, 2);
    ybar_total = r;
    Ixx_total = (Math.PI * Math.pow(r, 4)) / 4;
  } else if (gateShape === FormaComporta.SEMI_CIRCULAR) {
    const r = gateHeight;
    A_total = (Math.PI * Math.pow(r, 2)) / 2;
    ybar_total = (4 * r) / (3 * Math.PI);
    Ixx_total = Math.pow(r, 4) * (Math.PI / 8 - 8 / (9 * Math.PI));
  }

  // Se directY_CG foi fornecido e a comporta está submersa
  if (directY_CG !== undefined && directY_CG > 0) {
    return {
      A_wet: A_total,
      ybar: ybar_total,
      Ixx: Ixx_total,
      yWetLength: gateHeight,
      Y_CG_surface: directY_CG,
    };
  }

  const sinSafe = Math.max(0.001, Math.abs(sinTheta));
  const h_bot = h0 + gateHeight * sinTheta;

  // 1) Inteiramente fora d'água
  if (h_bot <= 0) {
    return {
      A_wet: 0,
      ybar: 0,
      Ixx: 0,
      yWetLength: 0,
      Y_CG_surface: 0,
    };
  }

  // 2) Parcialmente submersa (topo da comporta fora da linha d'água: h0 < 0)
  if (h0 < 0) {
    const y_dry = -h0 / sinSafe;
    const y_wet = Math.max(0, gateHeight - y_dry);
    const frac = Math.min(1, Math.max(0, y_wet / gateHeight));

    if (gateShape === FormaComporta.RETANGULAR) {
      const A_wet = y_wet * gateWidth;
      const ybar = y_dry + y_wet / 2;
      const Ixx = (gateWidth * Math.pow(y_wet, 3)) / 12;
      const Y_CG_surface = y_wet / 2;
      return { A_wet, ybar, Ixx, yWetLength: y_wet, Y_CG_surface };
    } else {
      // Circular / Semicircular parcial
      const A_wet = A_total * frac;
      const ybar = y_dry + y_wet / 2;
      const Ixx = Ixx_total * Math.pow(frac, 3);
      const Y_CG_surface = y_wet / 2;
      return { A_wet, ybar, Ixx, yWetLength: y_wet, Y_CG_surface };
    }
  }

  // 3) Totalmente submersa (h0 >= 0)
  const Y_CG_surface = h0 / sinSafe + ybar_total;
  return {
    A_wet: A_total,
    ybar: ybar_total,
    Ixx: Ixx_total,
    yWetLength: gateHeight,
    Y_CG_surface,
  };
}

/**
 * Calcula força resultante líquida sobre uma comporta plana.
 * Aceita gammas DIFERENTES para montante e jusante (dois fluidos) e Y_CG direto.
 */
export function calculateNetForce(
  gateHeight: number,
  gateWidth: number,
  gateInclination: number,
  h_top_up: number,
  h_top_down: number,
  gammaUp: number,
  gammaDown: number,
  gateShape: FormaComporta,
  directY_CG_up?: number
): { FR_net: number; s_cp_net: number; up: any; down: any } {
  const sinTheta = Math.sin((gateInclination * Math.PI) / 180);

  const geomUp = getGeometryAndWet(gateHeight, gateWidth, gateShape, h_top_up, sinTheta, directY_CG_up);
  const geomDown = getGeometryAndWet(gateHeight, gateWidth, gateShape, h_top_down, sinTheta);

  // Cada lado usa seu próprio gamma e suas propriedades de molhamento
  const up = hydroPlaneSide(
    gammaUp,
    sinTheta,
    geomUp.A_wet,
    geomUp.ybar,
    geomUp.Ixx,
    gateHeight,
    h_top_up,
    geomUp.yWetLength,
    geomUp.Y_CG_surface
  );

  const down = hydroPlaneSide(
    gammaDown,
    sinTheta,
    geomDown.A_wet,
    geomDown.ybar,
    geomDown.Ixx,
    gateHeight,
    h_top_down,
    geomDown.yWetLength,
    geomDown.Y_CG_surface
  );

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
      h_cp: up.h_cp,
      Y_CG: up.Y_CG,
      Y_CP: up.Y_CP,
      delta_y: up.delta_y,
      Ixx: geomUp.Ixx,
      p_top: up.p_top,
      p_bot: up.p_bot,
      p_cg: up.p_cg
    },
    down: {
      area: down.A_wet,
      wetLength: down.yWet,
      h_cg: down.hbar,
      FR: down.F,
      s_cg: down.ybar,
      s_cp: down.y_cp,
      h_cp: down.h_cp,
      Y_CG: down.Y_CG,
      Y_CP: down.Y_CP,
      delta_y: down.delta_y,
      Ixx: geomDown.Ixx,
      p_top: down.p_top,
      p_bot: down.p_bot,
      p_cg: down.p_cg
    }
  };
}