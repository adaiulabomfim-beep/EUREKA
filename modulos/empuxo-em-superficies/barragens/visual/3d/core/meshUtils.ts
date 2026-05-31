// ─────────────────────────────────────────────────────────
// meshUtils.ts — Operações vetoriais e utilitários de malha
// ─────────────────────────────────────────────────────────

import type { Vec3, Vec2, Face3D, Material3D } from './tipos3D';

// ═══════════════════════════════════════════════════════════
// Construtores
// ═══════════════════════════════════════════════════════════

/** Cria um Vec3. */
export const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

/** Vec3 zero. */
export const ZERO3: Vec3 = { x: 0, y: 0, z: 0 };

/** Vetor unitário Y (usado como "up" padrão). */
export const UP: Vec3 = { x: 0, y: 1, z: 0 };

// ═══════════════════════════════════════════════════════════
// Operações vetoriais
// ═══════════════════════════════════════════════════════════

export const add = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});

export const sub = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});

export const scale = (v: Vec3, s: number): Vec3 => ({
  x: v.x * s,
  y: v.y * s,
  z: v.z * s,
});

export const dot = (a: Vec3, b: Vec3): number =>
  a.x * b.x + a.y * b.y + a.z * b.z;

export const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

export const length = (v: Vec3): number =>
  Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);

export const normalize = (v: Vec3): Vec3 => {
  const len = length(v);
  if (len < 1e-12) return { x: 0, y: 0, z: 1 };
  return scale(v, 1 / len);
};

/** Interpolação linear entre dois pontos. */
export const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  z: a.z + (b.z - a.z) * t,
});

/** Negar vetor. */
export const negate = (v: Vec3): Vec3 => ({ x: -v.x, y: -v.y, z: -v.z });

// ═══════════════════════════════════════════════════════════
// Geometria
// ═══════════════════════════════════════════════════════════

/** Calcula a normal de uma face a partir de 3 pontos (regra da mão direita, CCW). */
export const computeNormal = (a: Vec3, b: Vec3, c: Vec3): Vec3 => {
  const ab = sub(b, a);
  const ac = sub(c, a);
  return normalize(cross(ab, ac));
};

/** Calcula o centroide (baricentro) de um conjunto de pontos. */
export const centroid = (pts: Vec3[]): Vec3 => {
  if (pts.length === 0) return ZERO3;
  const sum = pts.reduce((acc, p) => add(acc, p), ZERO3);
  return scale(sum, 1 / pts.length);
};

/**
 * Constrói um quadro local (frame) a partir de tangente e up.
 * Retorna { tangent, normal (binormal lateral), up } ortogonais.
 * 
 * - tangent: direção de avanço da curva (eixo Z local do sweep)
 * - up: direção vertical do perfil (eixo Y local)
 * - binormal: direção lateral do perfil (eixo X local)
 */
export const buildLocalFrame = (
  tangent: Vec3,
  worldUp: Vec3 = UP
): { tangent: Vec3; up: Vec3; binormal: Vec3 } => {
  const t = normalize(tangent);
  // binormal = cross(tangent, worldUp) → direção lateral
  let binormal = normalize(cross(t, worldUp));
  // Se tangent é paralelo a worldUp, usar fallback
  if (length(cross(t, worldUp)) < 1e-6) {
    binormal = normalize(cross(t, v3(1, 0, 0)));
  }
  // up = cross(binormal, tangent) → direção vertical local
  const up = normalize(cross(binormal, t));
  return { tangent: t, up, binormal };
};

/**
 * Transforma um perfil 2D para 3D usando um quadro local.
 * 
 * O perfil 2D assume:
 * - x_perfil → direção da binormal (espessura/largura)
 * - y_perfil → direção do up (altura)
 * 
 * @param profile Perfil 2D em coordenadas locais
 * @param origin Posição 3D do centro da seção
 * @param frame Quadro local (binormal, up)
 * @param centerX Offset X para centralizar o perfil (subtrai antes de transformar)
 */
export const transformProfile = (
  profile: Vec2[],
  origin: Vec3,
  frame: { binormal: Vec3; up: Vec3 },
  centerX: number = 0,
): Vec3[] => {
  return profile.map(p => {
    const localX = p.x - centerX;
    const localY = p.y;
    return add(
      origin,
      add(
        scale(frame.binormal, localX),
        scale(frame.up, localY),
      ),
    );
  });
};

// ═══════════════════════════════════════════════════════════
// Helpers para construção de faces
// ═══════════════════════════════════════════════════════════

/**
 * Cria uma Face3D a partir de vértices com cálculo automático da normal.
 * Assume vértices em ordem CCW vistos do exterior.
 */
export const makeFace = (
  vertices: Vec3[],
  material: Material3D,
  isInternal: boolean = false,
): Face3D => {
  const normal = vertices.length >= 3
    ? computeNormal(vertices[0], vertices[1], vertices[2])
    : v3(0, 0, 1);
  return { vertices, normal, material, isInternal };
};

/**
 * Cria uma Face3D com normal explícita (não calculada dos vértices).
 */
export const makeFaceWithNormal = (
  vertices: Vec3[],
  normal: Vec3,
  material: Material3D,
  isInternal: boolean = false,
): Face3D => {
  return { vertices, normal: normalize(normal), material, isInternal };
};

/**
 * Calcula a área sinalada de um polígono 2D (positiva = CCW, negativa = CW).
 */
export const signedArea2D = (pts: Vec2[]): number => {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    area += (p2.x - p1.x) * (p2.y + p1.y);
  }
  return area;
};

/**
 * Garante que um perfil 2D esteja em ordem CW (signed area > 0 no nosso sistema).
 * Isso é necessário para que as normais das faces laterais apontem para fora
 * quando o prisma é construído.
 */
export const ensureCW = (pts: Vec2[]): Vec2[] => {
  return signedArea2D(pts) > 0 ? pts : [...pts].reverse();
};

/**
 * Garante que um perfil 2D esteja em ordem CCW.
 */
export const ensureCCW = (pts: Vec2[]): Vec2[] => {
  return signedArea2D(pts) < 0 ? pts : [...pts].reverse();
};
