import { GateShape } from '../types';

export type RectSurfaceResult = {
  FR: number;         // N
  s_cp: number;       // m (ao longo da comporta, a partir do topo geométrico)
  h_cp: number;       // m (profundidade vertical do CP a partir do nível livre)
  s_cg: number;       // m (centróide da área molhada ao longo da comporta, a partir do topo geométrico)
  h_cg: number;       // m (profundidade do centróide da área molhada)
  area: number;       // m²
  wetLength: number;  // m (comprimento molhado ao longo da comporta)

  // 🔥 extras didáticos/visuais
  s_wet_start: number; // m (onde começa o trecho molhado, a partir do topo)
  s_wet_end: number;   // m (onde termina o trecho molhado, a partir do topo)
  p_top: number;       // Pa (pressão no topo do trecho molhado)
  p_bot: number;       // Pa (pressão na base do trecho molhado)
  h_top_wet: number;   // m (profundidade vertical no topo do trecho molhado)
  h_bot_wet: number;   // m (profundidade vertical na base do trecho molhado)
};

const EPS = 1e-9;

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Calcula a força hidrostática em uma superfície plana.
 * Implementação baseada nas fórmulas:
 * F = rho * g * h_bar * A
 * h_cp = h_bar + (I_G * sin^2(theta)) / (A * h_bar)
 */
export function calculateSurface(
  L: number,          // Comprimento total da comporta (m)
  B: number,          // Largura da comporta (m)
  theta_deg: number,  // Ângulo com a horizontal (90 = vertical)
  h_top: number,      // Profundidade vertical do topo da comporta (m)
  gamma: number,      // Peso específico (rho * g)
  shape: GateShape    // Formato da comporta
): RectSurfaceResult {
  const Lc = Math.max(0, L);
  const Bc = Math.max(0, B);

  const empty: RectSurfaceResult = {
    FR: 0, s_cp: 0, h_cp: 0, s_cg: 0, h_cg: 0, area: 0, wetLength: 0,
    s_wet_start: 0, s_wet_end: 0,
    p_top: 0, p_bot: 0,
    h_top_wet: 0, h_bot_wet: 0,
  };

  if (Lc < EPS || Bc < EPS || gamma <= 0) return empty;

  const theta_rad = (theta_deg * Math.PI) / 180;
  const sinT = Math.sin(theta_rad);
  const sin2T = sinT * sinT;

  // 1. Determinar o trecho molhado (s1 até s2 ao longo da comporta)
  let s1 = 0;
  let s2 = Lc;

  if (Math.abs(sinT) < 1e-6) {
    if (h_top <= 0) return empty;
    s1 = 0;
    s2 = Lc;
  } else if (sinT > 0) {
    if (h_top < 0) {
      s1 = -h_top / sinT;
    }
    if (s1 >= Lc) return empty;
  } else {
    if (h_top <= 0) return empty;
    s2 = Math.min(Lc, -h_top / sinT);
  }

  s1 = clamp(s1, 0, Lc);
  s2 = clamp(s2, 0, Lc);
  const wetLength = s2 - s1;

  if (wetLength <= EPS) return empty;

  // 2. Propriedades da área molhada
  let area = 0;
  let s_cg_wet = 0;
  let IG = 0;

  if (shape === GateShape.RECTANGULAR) {
    area = Bc * wetLength;
    s_cg_wet = s1 + wetLength / 2;
    IG = (Bc * Math.pow(wetLength, 3)) / 12;
  } else if (shape === GateShape.CIRCULAR) {
    // TODO: Implementar cálculo exato para círculo parcialmente submerso.
    // Atualmente, aproxima usando a área total se estiver molhado.
    const R = Lc / 2;
    area = Math.PI * R * R;
    s_cg_wet = Lc / 2; // Centro do círculo
    IG = (Math.PI * Math.pow(R, 4)) / 4;
  } else if (shape === GateShape.SEMI_CIRCULAR) {
    // TODO: Implementar cálculo exato para semicírculo parcialmente submerso.
    // Atualmente, aproxima usando a área total se estiver molhado.
    // Assumindo que a base reta está na parte inferior (s = Lc).
    // O raio é Lc.
    const R = Lc;
    area = (Math.PI * R * R) / 2;
    // Distância do centroide à base reta é 4R/(3π).
    // Como o topo é s=0 e a base é s=R, o CG a partir do topo é R - 4R/(3π).
    s_cg_wet = R - (4 * R) / (3 * Math.PI);
    // IG em relação ao eixo centroidal paralelo à base reta:
    // I_base = πR^4/8. I_G = I_base - A * d^2
    const d = (4 * R) / (3 * Math.PI);
    IG = (Math.PI * Math.pow(R, 4)) / 8 - area * d * d;
  }

  const h_cg = h_top + s_cg_wet * sinT;

  if (h_cg <= EPS) return empty;

  // 3. Força Resultante: F = gamma * h_cg * A
  const FR = gamma * h_cg * area;

  // 4. Centro de Pressão (h_cp)
  const h_cp = h_cg + (IG * sin2T) / (area * h_cg);

  let s_cp = s_cg_wet;
  if (Math.abs(sinT) > 1e-6) {
    s_cp = (h_cp - h_top) / sinT;
  }
  s_cp = clamp(s_cp, 0, Lc); // s_cp pode estar fora de [s1, s2] se parcialmente submerso e aproximado

  return {
    FR,
    s_cp,
    h_cp,
    s_cg: s_cg_wet,
    h_cg,
    area,
    wetLength,
    s_wet_start: s1,
    s_wet_end: s2,
    h_top_wet: Math.max(0, h_top + s1 * sinT),
    h_bot_wet: Math.max(0, h_top + s2 * sinT),
    p_top: gamma * Math.max(0, h_top + s1 * sinT),
    p_bot: gamma * Math.max(0, h_top + s2 * sinT),
  };
}

export function calculateNetForce(
  L: number,
  B: number,
  theta_deg: number,
  h_top_up: number,
  h_top_down: number,
  gamma: number,
  shape: GateShape
) {
  const up = calculateSurface(L, B, theta_deg, h_top_up, gamma, shape);
  const down = calculateSurface(L, B, theta_deg, h_top_down, gamma, shape);

  const FR_net = up.FR - down.FR;

  let s_cp_net = 0;

  if (Math.abs(FR_net) > 1e-6) {
    const M_up = up.FR * up.s_cp;
    const M_down = down.FR * down.s_cp;
    s_cp_net = clamp((M_up - M_down) / FR_net, 0, Math.max(0, L));
  } else {
    if (up.FR > down.FR && up.FR > 1e-6) s_cp_net = up.s_cp;
    else if (down.FR > 1e-6) s_cp_net = down.s_cp;
    else s_cp_net = L / 2;
  }

  return { FR_net, s_cp_net, up, down };
}
