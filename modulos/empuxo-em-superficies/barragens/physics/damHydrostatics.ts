/**
 * PADRONIZAÇÃO DE DEFINIÇÕES (HIDROSTÁTICA DE BARRAGENS):
 * 
 * 1. Coordenadas:
 *    - y: Coordenada vertical medida a partir do fundo (y=0 no fundo, y aumenta para cima).
 *    - H: Nível d'água medido a partir do fundo (upstreamLevel ou downstreamLevel).
 *    - h: Profundidade vertical abaixo da superfície livre (h = H - y).
 * 
 * 2. Geometria da Face:
 *    - theta (θ): Ângulo da face molhada com a HORIZONTAL (0° = horizontal, 90° = vertical).
 *    - L_total: Comprimento total da face da barragem.
 *    - L_wet: Comprimento da parte molhada da face (ao longo da inclinação).
 * 
 * 3. Força Hidrostática (por metro de largura):
 *    - FR = γ * A * h_c
 *    - γ: Peso específico do fluido (ρ * g).
 *    - A: Área molhada (L_wet * 1m).
 *    - h_c: Profundidade vertical do centróide da área molhada.
 * 
 * 4. Centro de Pressão (CP):
 *    - h_cp: Profundidade vertical do centro de pressão.
 *    - s_cp: Distância da superfície livre até o CP, medida AO LONGO da face.
 *    - y_cp: Altura vertical do CP a partir do fundo (y_cp = H - h_cp).
 */

export type RectSurfaceResult = {
  FR: number;         // N (Magnitude da força resultante)
  s_cp: number;       // m (Distância da superfície livre até o CP ao longo da face)
  h_cp: number;       // m (Profundidade vertical do CP a partir da superfície livre)
  s_cg: number;       // m (Distância da superfície livre até o CG ao longo da face)
  h_cg: number;       // m (Profundidade vertical do CG a partir da superfície livre)
  area: number;       // m² (Área molhada por metro de largura)
  wetLength: number;  // m (Comprimento molhado ao longo da face)

  y_cp: number;       // m (Altura vertical do CP a partir do fundo)
  p_bot: number;       // Pa (Pressão na base da barragem)
};

const EPS = 1e-9;

export function calculateSurface(
  damHeight: number,   // Altura total da barragem (m)
  theta_deg: number,   // Ângulo com a horizontal (graus)
  waterLevel: number,  // Nível d'água a partir do fundo (m)
  gamma: number        // Peso específico (N/m³)
): RectSurfaceResult {
  const H = Math.max(0, waterLevel);
  const h_max = Math.min(H, damHeight); // Altura vertical molhada

  const empty: RectSurfaceResult = {
    FR: 0, s_cp: 0, h_cp: 0, s_cg: 0, h_cg: 0, area: 0, wetLength: 0,
    y_cp: 0, p_bot: 0
  };

  if (h_max <= EPS || gamma <= 0) return empty;

  const theta_rad = (theta_deg * Math.PI) / 180;
  const sinT = Math.sin(theta_rad);
  
  // Comprimento molhado ao longo da face
  const wetLength = h_max / Math.max(EPS, sinT);
  const area = wetLength * 1; // 1 metro de largura

  // Profundidade do centróide (h_c)
  // Para uma face plana retangular, o centróide está no meio da altura vertical molhada
  const h_cg = h_max / 2;
  const s_cg = h_cg / Math.max(EPS, sinT);

  // Força Resultante (FR = gamma * h_c * A)
  const FR = gamma * h_cg * area;

  // Centro de Pressão (h_cp)
  // I_G = (b * L^3) / 12
  const IG = (1 * Math.pow(wetLength, 3)) / 12;
  const h_cp = h_cg + (IG * Math.pow(sinT, 2)) / (area * h_cg);
  
  const s_cp = h_cp / Math.max(EPS, sinT);
  const y_cp = H - h_cp;

  return {
    FR,
    s_cp,
    h_cp,
    s_cg,
    h_cg,
    area,
    wetLength,
    y_cp,
    p_bot: gamma * H
  };
}

export function calculateNetForce(
  damHeight: number,
  theta_deg: number,
  upstreamLevel: number,
  downstreamLevel: number,
  gamma: number
) {
  const up = calculateSurface(damHeight, theta_deg, upstreamLevel, gamma);
  const down = calculateSurface(damHeight, theta_deg, downstreamLevel, gamma);

  // FR_net no sentido Montante -> Jusante (assumindo +x para a direita)
  // up.FR atua para a direita (+x), down.FR atua para a esquerda (-x)
  const FR_net = up.FR - down.FR;

  // CP resultante (ponderado pelas forças)
  let y_cp_net = 0;
  let s_cp_net = 0;
  const sinT = Math.sin((theta_deg * Math.PI) / 180);

  if (Math.abs(FR_net) > 1e-6) {
    y_cp_net = (up.FR * up.y_cp - down.FR * down.y_cp) / FR_net;
    // s_cp_net = (H_up - y_cp_net) / sinT
    s_cp_net = (upstreamLevel - y_cp_net) / Math.max(1e-9, sinT);
  } else if (up.FR > 1e-6) {
    y_cp_net = up.y_cp;
    s_cp_net = up.s_cp;
  }

  return { FR_net, y_cp_net, s_cp_net, up, down };
}
