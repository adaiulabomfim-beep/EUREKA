// ─────────────────────────────────────────────────────────
// buildersBase.ts — Builders geométricos reutilizáveis
// ─────────────────────────────────────────────────────────

import type { Vec2, Vec3, Face3D, Material3D, Solid3D, CurveDirector } from './tipos3D';
import {
  v3, add, sub, scale, cross, normalize, negate, length,
  computeNormal, makeFace, makeFaceWithNormal,
  signedArea2D, ensureCW,
  buildLocalFrame, transformProfile,
} from './meshUtils';

// ═══════════════════════════════════════════════════════════
// Extrusão Linear
// ═══════════════════════════════════════════════════════════

/**
 * Extrusão linear de um perfil 2D ao longo do eixo Z.
 *
 * O perfil vive no plano XY. A extrusão produz um sólido com:
 * - face frontal  (z = zCenter + depth/2)
 * - face traseira (z = zCenter - depth/2)
 * - uma face lateral por aresta do perfil
 *
 * @param profile   Perfil 2D (plano XY), com x = posição horizontal, y = altura.
 * @param depth     Profundidade total da extrusão (dimensão Z).
 * @param material  Material visual para todas as faces.
 * @param tag       Tag semântica do sólido resultante.
 * @param zCenter   Centro Z da extrusão (default 0).
 * @param toWorldX  Transformação opcional do X do perfil para coordenada mundo.
 */
export const extrudeLinear = (
  profile: Vec2[],
  depth: number,
  material: Material3D,
  tag: string,
  zCenter: number = 0,
  toWorldX: (x: number) => number = (x) => x,
): Solid3D => {
  const faces: Face3D[] = [];
  const zF = zCenter + depth / 2;
  const zB = zCenter - depth / 2;

  // Garantir orientação CW para consistência de normais
  const profileCW = ensureCW(profile);

  // Mapear perfil 2D para 3D na face frontal e traseira
  const frontPts = profileCW.map(p => v3(toWorldX(p.x), p.y, zF));
  const backPts = profileCW.map(p => v3(toWorldX(p.x), p.y, zB));

  // --- Face frontal (normal +Z) ---
  // Reverter para CCW visto de +Z (regra da mão direita → normal +Z)
  faces.push(makeFaceWithNormal(
    [...frontPts].reverse(),
    v3(0, 0, 1),
    material,
    false,
  ));

  // --- Face traseira (normal -Z) ---
  // CW visto de -Z = CCW visto do exterior → normal -Z
  faces.push(makeFaceWithNormal(
    backPts,
    v3(0, 0, -1),
    material,
    false,
  ));

  // --- Faces laterais ---
  for (let i = 0; i < profileCW.length; i++) {
    const j = (i + 1) % profileCW.length;

    // Quad: backPts[i] → backPts[j] → frontPts[j] → frontPts[i]
    // Em CW no perfil, isso dá normal apontando para fora
    const quad: Vec3[] = [
      backPts[i],
      backPts[j],
      frontPts[j],
      frontPts[i],
    ];

    faces.push(makeFace(quad, material, false));
  }

  return { faces, tag };
};

// ═══════════════════════════════════════════════════════════
// Sweep Curvo
// ═══════════════════════════════════════════════════════════

/**
 * Sweep curvo: varre um perfil 2D ao longo de uma curva diretora.
 *
 * Produz `segments` sólidos convexos (um por setor). Faces compartilhadas
 * entre setores adjacentes são marcadas `isInternal = true`.
 *
 * O perfil 2D assume:
 * - x = espessura (montante → jusante), fica na direção da binormal
 * - y = altura, fica na direção do up
 *
 * @param profile     Perfil 2D da seção transversal.
 * @param curva       Curva diretora parametrizada t ∈ [0, 1].
 * @param segments    Número de segmentos (setores) ao longo da curva.
 * @param material    Material visual.
 * @param tag         Tag semântica (todos os setores compartilham a mesma tag).
 * @param profileCenterX  Centro X do perfil para centralizar a seção.
 */
export const sweepCurvo = (
  profile: Vec2[],
  curva: CurveDirector,
  segments: number,
  material: Material3D,
  tag: string,
  profileCenterX: number = 0,
): Solid3D[] => {
  const solids: Solid3D[] = [];
  const profileCW = ensureCW(profile);

  // Pré-computar todas as seções transformadas
  const sections: Vec3[][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const cp = curva(t);
    const frame = buildLocalFrame(cp.tangent);
    const section = transformProfile(profileCW, cp.position, frame, profileCenterX);
    sections.push(section);
  }

  // Gerar um sólido por setor
  for (let seg = 0; seg < segments; seg++) {
    const secA = sections[seg];
    const secB = sections[seg + 1];
    const faces: Face3D[] = [];
    const n = profileCW.length;

    // --- Face de seção A (início do setor) ---
    // Se é o primeiro setor, é face externa. Senão, é junta interna.
    const isStartInternal = seg > 0;
    // Normal aponta "para trás" ao longo da curva
    const cpA = curva(seg / segments);
    faces.push(makeFaceWithNormal(
      secA,  // CCW visto de trás → normal contra a tangente
      negate(cpA.tangent),
      material,
      isStartInternal,
    ));

    // --- Face de seção B (fim do setor) ---
    const isEndInternal = seg < segments - 1;
    const cpB = curva((seg + 1) / segments);
    faces.push(makeFaceWithNormal(
      [...secB].reverse(),  // reverter para CCW visto de frente
      cpB.tangent,
      material,
      isEndInternal,
    ));

    // --- Faces laterais (uma por aresta do perfil) ---
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;

      // Quad entre seção A e seção B
      const quad: Vec3[] = [
        secA[i],
        secA[j],
        secB[j],
        secB[i],
      ];

      faces.push(makeFace(quad, material, false));
    }

    solids.push({ faces, tag });
  }

  return solids;
};

// ═══════════════════════════════════════════════════════════
// Prisma Trapezoidal (helper para contrafortes)
// ═══════════════════════════════════════════════════════════

/**
 * Cria um prisma a partir de um perfil triangular ou trapezoidal.
 * É um atalho para `extrudeLinear` com perfis simples.
 */
export const criarPrismaTrapezoidal = (
  profile: Vec2[],
  depth: number,
  material: Material3D,
  tag: string,
  zCenter: number = 0,
  toWorldX: (x: number) => number = (x) => x,
): Solid3D => {
  return extrudeLinear(profile, depth, material, tag, zCenter, toWorldX);
};

// ═══════════════════════════════════════════════════════════
// Água — Linear (para gravidade, terra, contraforte)
// ═══════════════════════════════════════════════════════════

/**
 * Cria o volume de água como extrusão linear de um polígono trapezoidal.
 *
 * @param waterLevel   Nível da água (altura Y).
 * @param depth        Profundidade Z do canal.
 * @param farX         Posição X da margem oposta à barragem.
 * @param side         Lado da barragem (montante/jusante).
 * @param getDamXAtY   Função que retorna o X da face da barragem a uma altura Y.
 * @param material     Material visual da água.
 * @param zCenter      Centro Z da extrusão.
 * @param toWorldX     Transformação X → mundo.
 */
export const criarCaixaAguaLinear = (
  waterLevel: number,
  depth: number,
  farX: number,
  side: 'UPSTREAM' | 'DOWNSTREAM',
  getDamXAtY: (y: number, side: 'UPSTREAM' | 'DOWNSTREAM') => number,
  material: Material3D,
  zCenter: number = 0,
  toWorldX: (x: number) => number = (x) => x,
): Solid3D => {
  const xDamBottom = getDamXAtY(0, side);
  const xDamTop = getDamXAtY(waterLevel, side);

  let profile: Vec2[];
  if (side === 'UPSTREAM') {
    profile = [
      { x: farX, y: 0 },
      { x: farX, y: waterLevel },
      { x: xDamTop, y: waterLevel },
      { x: xDamBottom, y: 0 },
    ];
  } else {
    profile = [
      { x: xDamBottom, y: 0 },
      { x: xDamTop, y: waterLevel },
      { x: farX, y: waterLevel },
      { x: farX, y: 0 },
    ];
  }

  return extrudeLinear(
    profile,
    depth,
    material,
    side === 'UPSTREAM' ? 'water-up' : 'water-down',
    zCenter,
    toWorldX,
  );
};

// ═══════════════════════════════════════════════════════════
// Água — Curva (para barragem em arco)
// ═══════════════════════════════════════════════════════════

/**
 * Cria o volume de água que acompanha a curvatura de uma barragem em arco.
 *
 * Para cada setor da curva, gera um prisma trapezoidal de água entre a margem
 * (farX) e a face da barragem naquele setor.
 *
 * @param waterLevel   Nível da água.
 * @param curva        Mesma curva diretora do arco.
 * @param segments     Mesmo número de segmentos do arco.
 * @param farX         Posição X da margem (em coordenadas do perfil, não mundo).
 * @param side         Lado (UPSTREAM ou DOWNSTREAM).
 * @param getDamXAtY   Função que retorna X da face da barragem em função de Y.
 * @param material     Material visual da água.
 * @param profileCenterX  Centro X do perfil da barragem (para calcular offset).
 * @param toWorldX     Transformação X → mundo.
 */
export const criarCaixaAguaCurva = (
  waterLevel: number,
  curva: CurveDirector,
  segments: number,
  farX: number,
  side: 'UPSTREAM' | 'DOWNSTREAM',
  getDamXAtY: (y: number, side: 'UPSTREAM' | 'DOWNSTREAM') => number,
  material: Material3D,
  profileCenterX: number,
  toWorldX: (x: number) => number = (x) => x,
): Solid3D[] => {
  const solids: Solid3D[] = [];
  const tag = side === 'UPSTREAM' ? 'water-up' : 'water-down';

  const xDamBottom = getDamXAtY(0, side);
  const xDamTop = getDamXAtY(waterLevel, side);

  // Perfil 2D da água (trapezoidal no plano da seção)
  let waterProfile: Vec2[];
  if (side === 'UPSTREAM') {
    waterProfile = [
      { x: farX, y: 0 },
      { x: farX, y: waterLevel },
      { x: xDamTop, y: waterLevel },
      { x: xDamBottom, y: 0 },
    ];
  } else {
    waterProfile = [
      { x: xDamBottom, y: 0 },
      { x: xDamTop, y: waterLevel },
      { x: farX, y: waterLevel },
      { x: farX, y: 0 },
    ];
  }

  const waterCW = ensureCW(waterProfile);

  // Pré-computar seções de água transformadas ao longo da curva
  const sections: Vec3[][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const cp = curva(t);
    const frame = buildLocalFrame(cp.tangent);
    const section = transformProfile(waterCW, cp.position, frame, profileCenterX);
    sections.push(section);
  }

  // Gerar um sólido por setor (mesma lógica do sweep mas para água)
  for (let seg = 0; seg < segments; seg++) {
    const secA = sections[seg];
    const secB = sections[seg + 1];
    const faces: Face3D[] = [];
    const n = waterCW.length;

    // Faces de seção (internas exceto nas extremidades)
    const isStartInternal = seg > 0;
    const isEndInternal = seg < segments - 1;

    const cpA = curva(seg / segments);
    const cpB = curva((seg + 1) / segments);

    faces.push(makeFaceWithNormal(
      secA,
      negate(cpA.tangent),
      material,
      isStartInternal,
    ));

    faces.push(makeFaceWithNormal(
      [...secB].reverse(),
      cpB.tangent,
      material,
      isEndInternal,
    ));

    // Faces laterais
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const quad: Vec3[] = [secA[i], secA[j], secB[j], secB[i]];
      faces.push(makeFace(quad, material, false));
    }

    solids.push({ faces, tag });
  }

  return solids;
};

// ═══════════════════════════════════════════════════════════
// Terra / Fundação
// ═══════════════════════════════════════════════════════════

/**
 * Cria o bloco de fundação (terra) como extrusão linear.
 *
 * @param maxH       Altura máxima da cena (para calcular profundidade da terra).
 * @param farLeft    Posição X esquerda do bloco.
 * @param farRight   Posição X direita do bloco.
 * @param depth      Profundidade Z do bloco.
 * @param material   Material visual.
 * @param toWorldX   Transformação X → mundo.
 */
export const criarTerraBase = (
  maxH: number,
  farLeft: number,
  farRight: number,
  depth: number,
  material: Material3D,
  toWorldX: (x: number) => number = (x) => x,
): Solid3D => {
  const earthDepth = maxH * 0.2;
  const profile: Vec2[] = [
    { x: farLeft, y: 0 },
    { x: farRight, y: 0 },
    { x: farRight, y: -earthDepth },
    { x: farLeft, y: -earthDepth },
  ];

  return extrudeLinear(profile, depth, material, 'earth', 0, toWorldX);
};
