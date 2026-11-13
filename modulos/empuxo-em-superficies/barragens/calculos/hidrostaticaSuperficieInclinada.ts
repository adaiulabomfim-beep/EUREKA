import {
  ResultadoEstabilidadeBarragem,
  ResultadoForcaLiquidaBarragem,
  ResultadoSuperficieRetangular,
} from '../dominio/tipos';

/**
 * PADRONIZAÇÃO DE DEFINIÇÕES (HIDROSTÁTICA DE BARRAGENS):
 *
 * 1. Coordenadas:
 *    - y: Coordenada vertical medida a partir do fundo (y = 0 no fundo, y aumenta para cima).
 *    - x: Coordenada horizontal medida a partir do pé de montante (x = 0 no pé de montante).
 *    - H: Nível d'água medido a partir do fundo (upstreamLevel ou downstreamLevel).
 *    - h: Profundidade vertical abaixo da superfície livre (h = H - y).
 *
 * 2. Geometria da Face:
 *    - theta (θ): Ângulo da face molhada com a HORIZONTAL (θ = 90° => face vertical).
 *    - L_wet: Comprimento da parte molhada da face ao longo da inclinação.
 *
 * 3. Decomposição Vetorial da Força Hidrostática (por metro linear):
 *    - FR = γ · h_cg · A  (módulo da força normal à face inclinada)
 *    - FH = FR · sen(θ) = ½ · γ · h²  (componente horizontal, independente de θ)
 *    - FV = FR · cos(θ) = ½ · γ · h² · cot(θ)  (peso da coluna d'água sobre a face inclinada)
 *
 * 4. Centro de Pressão (CP):
 *    - h_cp: Profundidade vertical do CP a partir da superfície livre.
 *    - s_cp: Distância da superfície livre até o CP, medida ao longo da face.
 *    - y_cp: Altura vertical do CP a partir do fundo (y_cp = H - h_cp).
 */

export type RectSurfaceResult = ResultadoSuperficieRetangular;

export interface PontoPerfil2D {
  x: number;
  y: number;
}

const EPS = 1e-9;

export function calcularPropriedadesPoligono(profile: PontoPerfil2D[]) {
  if (!profile || profile.length < 3) {
    return { area: 0, x_cg: 0, y_cg: 0 };
  }

  let signedArea2 = 0;
  let cxSum = 0;
  let cySum = 0;

  for (let i = 0; i < profile.length; i++) {
    const p = profile[i];
    const q = profile[(i + 1) % profile.length];
    const cross = p.x * q.y - q.x * p.y;
    signedArea2 += cross;
    cxSum += (p.x + q.x) * cross;
    cySum += (p.y + q.y) * cross;
  }

  const area = Math.abs(signedArea2) / 2;
  if (area <= EPS) {
    return { area: 0, x_cg: 0, y_cg: 0 };
  }

  return {
    area,
    x_cg: cxSum / (3 * signedArea2),
    y_cg: cySum / (3 * signedArea2),
  };
}

export function obterAnguloJusanteDoPerfil(profile: PontoPerfil2D[]): number {
  if (!profile || profile.length < 4) return 90;
  const crestDown = profile[2];
  const toeDown = profile[3];
  const dx = toeDown.x - crestDown.x;
  const dy = crestDown.y - toeDown.y;
  if (dx <= EPS) return 90;
  if (dy <= EPS) return 90;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

export interface OpcoesCamadaLama {
  mudHeight?: number;
  gammaMud?: number;
  mudDensity?: number;
}

export function extrairOpcoesLama(
  hasMudLayer: boolean | undefined,
  mudHeight: number | undefined,
  mudDensity: number | undefined,
  upstreamLevel: number,
  gravity: number
): OpcoesCamadaLama | undefined {
  if (!hasMudLayer || !mudHeight || mudHeight <= 0 || upstreamLevel <= 0) {
    return undefined;
  }
  const rhoMud = Math.max(0, mudDensity ?? 1500);
  if (rhoMud <= 0) return undefined;
  return {
    mudHeight: Math.min(mudHeight, upstreamLevel),
    gammaMud: rhoMud * gravity,
    mudDensity: rhoMud,
  };
}

export function calculateSurface(
  damHeight: number,
  theta_deg: number,
  waterLevel: number,
  gamma: number,
  mudOpcoes?: OpcoesCamadaLama
): RectSurfaceResult {
  const H = Math.max(0, waterLevel);
  const h_max = Math.min(H, damHeight);

  const empty: RectSurfaceResult = {
    FR: 0,
    FH: 0,
    FV: 0,
    s_cp: 0,
    h_cp: 0,
    s_cg: 0,
    h_cg: 0,
    area: 0,
    wetLength: 0,
    y_cp: 0,
    x_cp_offset: 0,
    p_bot: 0,
  };

  if (h_max <= EPS || gamma <= 0) return empty;

  const clampedTheta = Math.max(1, Math.min(179, theta_deg));
  const theta_rad = (clampedTheta * Math.PI) / 180;
  const sinT = Math.sin(theta_rad);
  const cosT = Math.cos(theta_rad);

  const wetLength = h_max / Math.max(EPS, sinT);
  const area = wetLength * 1; // 1 m de largura unitária

  const mudH = Math.min(h_max, Math.max(0, mudOpcoes?.mudHeight ?? 0));
  const gammaMud = mudOpcoes?.gammaMud ?? 0;

  if (mudH > EPS && gammaMud > 0) {
    // Fluido estratificado: água (y ∈ [mudH, h_max]) + camada de lama (y ∈ [0, mudH])
    const waterHeight = Math.max(0, h_max - mudH);
    const h_top = Math.max(0, H - damHeight);
    const p_top = gamma * h_top;
    const p_interface = p_top + gamma * waterHeight;
    const p_bot = p_interface + gammaMud * mudH;

    // Parcela 1: Água acima da interface (trapézio / triângulo entre y = mudH e y = h_max)
    const L_water = waterHeight / Math.max(EPS, sinT);
    const F_water_rect = p_top * L_water;
    const F_water_tri = 0.5 * gamma * waterHeight * L_water;
    const F_water = F_water_rect + F_water_tri;
    const y_cp_water =
      F_water > EPS
        ? (F_water_rect * (mudH + waterHeight / 2) + F_water_tri * (mudH + waterHeight / 3)) / F_water
        : mudH;

    // Parcela 2: Lama no fundo (retângulo de p_interface + triângulo de γ_lama · mudH)
    const L_mud = mudH / Math.max(EPS, sinT);
    const F_mud_rect = p_interface * L_mud;
    const F_mud_tri = 0.5 * gammaMud * mudH * L_mud;
    const F_mud = F_mud_rect + F_mud_tri;
    const y_cp_mud =
      F_mud > EPS
        ? (F_mud_rect * (mudH / 2) + F_mud_tri * (mudH / 3)) / F_mud
        : mudH / 2;

    const FR = F_water + F_mud;
    const FH = FR * sinT;
    const FV = FR * cosT;
    const y_cp = FR > EPS ? (F_water * y_cp_water + F_mud * y_cp_mud) / FR : 0;
    const h_cp = Math.max(0, H - y_cp);
    const s_cp = h_cp / Math.max(EPS, sinT);
    const h_cg = h_top + h_max / 2;
    const s_cg = h_cg / Math.max(EPS, sinT);
    const x_cp_offset = Math.abs(clampedTheta - 90) < 1e-6 ? 0 : y_cp * (cosT / Math.max(EPS, sinT));

    return {
      FR,
      FH,
      FV,
      s_cp,
      h_cp,
      s_cg,
      h_cg,
      area,
      wetLength,
      y_cp,
      x_cp_offset,
      p_bot,
      mudLayer: {
        mudHeight: mudH,
        mudDensity: mudOpcoes?.mudDensity ?? Math.round((gammaMud / Math.max(EPS, gamma)) * 1000),
        waterHeight,
        p_interface,
        F_water,
        y_cp_water,
        F_mud_rect,
        F_mud_tri,
        F_mud,
        y_cp_mud,
      },
    };
  }

  // Profundidade do topo da face molhada (0 quando H <= damHeight)
  const h_top = Math.max(0, H - damHeight);
  const h_cg = h_top + h_max / 2;
  const s_cg = h_cg / Math.max(EPS, sinT);

  const FR = gamma * h_cg * area;
  const FH = FR * sinT;
  const FV = FR * cosT;

  const IG = (1 * Math.pow(wetLength, 3)) / 12;
  const h_cp = h_cg + (IG * Math.pow(sinT, 2)) / (area * h_cg);

  const s_cp = h_cp / Math.max(EPS, sinT);
  const y_cp = Math.max(0, H - h_cp);
  const x_cp_offset = Math.abs(clampedTheta - 90) < 1e-6 ? 0 : y_cp * (cosT / Math.max(EPS, sinT));

  return {
    FR,
    FH,
    FV,
    s_cp,
    h_cp,
    s_cg,
    h_cg,
    area,
    wetLength,
    y_cp,
    x_cp_offset,
    p_bot: gamma * H,
  };
}

export function calculateNetForce(
  damHeight: number,
  theta_deg: number,
  upstreamLevel: number,
  downstreamLevel: number,
  gamma: number,
  downstreamTheta_deg?: number,
  mudOpcoes?: OpcoesCamadaLama
): ResultadoForcaLiquidaBarragem {
  const thetaUp = Math.max(1, Math.min(179, theta_deg));
  const thetaDown = Math.max(
    1,
    Math.min(179, downstreamTheta_deg !== undefined ? downstreamTheta_deg : thetaUp)
  );

  const up = calculateSurface(damHeight, thetaUp, upstreamLevel, gamma, mudOpcoes);
  const down = calculateSurface(damHeight, thetaDown, downstreamLevel, gamma);

  // Decomposição vetorial:
  // Montante empurra para +x (FH) e -y (FV)
  // Jusante empurra para -x (-FH) e -y (FV)
  const FH_net = up.FH - down.FH;
  const FV_net = up.FV + down.FV;

  // Resultante vetorial líquida: |(FH_net, -FV_net)| com sinal do sentido horizontal líquido
  const FR_mag = Math.hypot(FH_net, FV_net);
  const FR_net = FR_mag <= EPS ? 0 : (FH_net >= 0 ? 1 : -1) * FR_mag;

  // Momento horizontal líquido em torno da base (y = 0)
  const moment_total = up.FH * up.y_cp - down.FH * down.y_cp;

  let y_cp_net = 0;
  let s_cp_net = 0;
  const sinT = Math.sin((thetaUp * Math.PI) / 180);

  if (Math.abs(FH_net) > 1e-3) {
    y_cp_net = Math.max(0, Math.min(damHeight, moment_total / FH_net));
    s_cp_net = Math.max(0, (Math.min(upstreamLevel, damHeight) - y_cp_net) / Math.max(EPS, sinT));
  } else if (up.FH > 1e-3) {
    y_cp_net = up.y_cp;
    s_cp_net = up.s_cp;
  }

  const p_max_up = up.p_bot;
  const p_max_down = down.p_bot;

  return {
    FR_net,
    FH_net,
    FV_net,
    y_cp_net,
    s_cp_net,
    moment_total,
    p_max_up,
    p_max_down,
    thetaUp,
    thetaDown,
    up,
    down,
  };
}

export interface OpcoesEstabilidade {
  gammaMaterial?: number;
  mu?: number;
  volumeFactor?: number;
  customArea?: number;
  customXcg?: number;
  customYcg?: number;
  isArchDam?: boolean;
  archRadius?: number;
  damCrestWidth?: number;
}

export function calcularEstabilidadeBarragem(
  damHeight: number,
  profile: PontoPerfil2D[],
  forceData: ResultadoForcaLiquidaBarragem,
  opcoes: OpcoesEstabilidade = {}
): ResultadoEstabilidadeBarragem {
  const {
    gammaMaterial = 24000,
    mu = 0.7,
    volumeFactor = 1.0,
    customArea,
    customXcg,
    customYcg,
    isArchDam = false,
    archRadius = 30,
  } = opcoes;

  const xToeUp = profile.length > 0 ? profile[0].x : 0;
  const xToeDown = profile.length >= 4 ? profile[3].x : xToeUp;
  const actualBaseWidth = Math.max(EPS, xToeDown - xToeUp);

  const geomProps = calcularPropriedadesPoligono(profile);
  const area = customArea !== undefined ? customArea : geomProps.area * volumeFactor;
  const x_cg = customXcg !== undefined ? customXcg : geomProps.x_cg;
  const y_cg = customYcg !== undefined ? customYcg : geomProps.y_cg;

  const weight = area * gammaMaterial;

  const { up, down, FH_net, FV_net, p_max_up } = forceData;
  const pushingToDownstream = FH_net >= 0;

  // Ponto de tombamento: pé de jusante (quando empurrada para jusante) ou pé de montante
  const xPivot = pushingToDownstream ? xToeDown : xToeUp;
  const lever_arm_weight = Math.abs(xPivot - x_cg);

  // Posição x dos pontos de aplicação de FV_up e FV_down
  const x_cp_up = xToeUp + up.x_cp_offset;
  const x_cp_down = xToeDown - down.x_cp_offset;

  const moment_weight = weight * lever_arm_weight;
  const moment_resisting_water_v =
    up.FV * Math.abs(xPivot - x_cp_up) + down.FV * Math.abs(xPivot - x_cp_down);

  const moment_resisting = moment_weight + moment_resisting_water_v;
  const moment_overturning = pushingToDownstream
    ? Math.max(0, up.FH * up.y_cp - down.FH * down.y_cp)
    : Math.max(0, down.FH * down.y_cp - up.FH * up.y_cp);

  const total_vertical_force = weight + FV_net;
  const absFH = Math.abs(FH_net);

  const fs_tomb =
    moment_overturning > 1e-6 ? moment_resisting / moment_overturning : 99.99;
  const fs_desl =
    absFH > 1e-6 ? (mu * total_vertical_force) / absFH : 99.99;

  // Posição da resultante vertical na base a partir do ponto de tombamento:
  // x_R = (M_est - M_tomb) / ΣV ; excentricidade em relação ao centro da base = B/2 - x_R
  const x_R =
    total_vertical_force > EPS
      ? (moment_resisting - moment_overturning) / total_vertical_force
      : actualBaseWidth / 2;
  const e = actualBaseWidth / 2 - x_R;

  const archThrust = isArchDam ? p_max_up * archRadius : undefined;
  const archStressBase =
    isArchDam && actualBaseWidth > EPS ? (p_max_up * archRadius) / actualBaseWidth : undefined;

  return {
    area,
    weight,
    x_cg,
    y_cg,
    lever_arm_weight,
    gammaMaterial,
    mu,
    actualBaseWidth,
    moment_resisting,
    moment_overturning,
    moment_resisting_water_v,
    total_vertical_force,
    fs_tomb,
    fs_desl,
    e,
    stabilityApplicable: !isArchDam,
    isArchDam,
    archThrust,
    archStressBase,
    volumeFactor,
    upliftAssumption: 'Subpressão desconsiderada (U = 0, base impermeável)',
  };
}

/**
 * Wrapper mantido por compatibilidade com chamadas legadas.
 */
export function calcularEstabilidadePadrao(
  damHeight: number,
  damBaseWidth: number,
  damCrestWidth: number,
  FR_net: number,
  y_cp_net: number,
  gammaMaterial: number = 24000,
  mu: number = 0.7,
  volumeFactor: number = 1.0
): ResultadoEstabilidadeBarragem {
  const B = Math.max(damBaseWidth, damCrestWidth);
  const profile: PontoPerfil2D[] = [
    { x: 0, y: 0 },
    { x: 0, y: damHeight },
    { x: damCrestWidth, y: damHeight },
    { x: B, y: 0 },
  ];
  const emptySurf: RectSurfaceResult = {
    FR: 0,
    FH: 0,
    FV: 0,
    s_cp: 0,
    h_cp: 0,
    s_cg: 0,
    h_cg: 0,
    area: 0,
    wetLength: 0,
    y_cp: 0,
    x_cp_offset: 0,
    p_bot: 0,
  };
  const syntheticForce: ResultadoForcaLiquidaBarragem = {
    FR_net,
    FH_net: FR_net,
    FV_net: 0,
    y_cp_net,
    s_cp_net: 0,
    moment_total: FR_net * y_cp_net,
    p_max_up: 0,
    p_max_down: 0,
    thetaUp: 90,
    thetaDown: 90,
    up: { ...emptySurf, FR: Math.max(0, FR_net), FH: Math.max(0, FR_net), y_cp: y_cp_net },
    down: { ...emptySurf, FR: Math.max(0, -FR_net), FH: Math.max(0, -FR_net), y_cp: y_cp_net },
  };
  return calcularEstabilidadeBarragem(damHeight, profile, syntheticForce, {
    gammaMaterial,
    mu,
    volumeFactor,
  });
}
