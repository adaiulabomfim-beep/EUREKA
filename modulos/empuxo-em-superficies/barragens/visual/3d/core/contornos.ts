// ─────────────────────────────────────────────────────────
// contornos.ts — Extração de contornos externos (silhueta)
// ─────────────────────────────────────────────────────────
//
// Estratégia:
// 1. Faces com isInternal=true NUNCA geram contorno.
// 2. Arestas compartilhadas entre dois sólidos da MESMA tag são suprimidas.
// 3. Arestas de fronteira (pertencentes a 1 face visível) são contorno.
// 4. Arestas compartilhadas entre 2 faces externas cujo ângulo diedro
//    excede um limiar (ex: 25°) são contorno.
// ─────────────────────────────────────────────────────────

import type { Vec3, Face3D, Solid3D, Edge3D, SceneMesh3D } from './tipos3D';
import { dot, normalize, sub, length } from './meshUtils';

/** Chave canônica para uma aresta (arredondada para evitar flutuação). */
const edgeKey = (a: Vec3, b: Vec3): string => {
  const round = (n: number) => Math.round(n * 1000) / 1000;
  const ax = round(a.x), ay = round(a.y), az = round(a.z);
  const bx = round(b.x), by = round(b.y), bz = round(b.z);

  // Ordenar lexicograficamente para garantir que (a→b) e (b→a) gerem a mesma chave
  if (ax < bx || (ax === bx && ay < by) || (ax === bx && ay === by && az < bz)) {
    return `${ax},${ay},${az}|${bx},${by},${bz}`;
  }
  return `${bx},${by},${bz}|${ax},${ay},${az}`;
};

interface EdgeInfo {
  a: Vec3;
  b: Vec3;
  faces: { normal: Vec3; isInternal: boolean; tag: string }[];
}

/**
 * Extrai contornos externos de uma cena 3D.
 *
 * @param mesh        Malha da cena (solids sem edges ainda).
 * @param stroke      Cor do contorno.
 * @param strokeWidth Largura do contorno.
 * @param dihedralThresholdDeg  Ângulo mínimo (graus) entre normais para gerar contorno.
 *                              Valores baixos = mais contornos; altos = menos contornos.
 * @returns Lista de arestas de contorno.
 */
export const extrairContornos = (
  mesh: SceneMesh3D,
  stroke: string = '#4b5563',
  strokeWidth: number = 1.2,
  dihedralThresholdDeg: number = 25,
): Edge3D[] => {
  const edgeMap = new Map<string, EdgeInfo>();

  // Coletar todas as arestas e suas faces adjacentes
  for (const solid of mesh.solids) {
    for (const face of solid.faces) {
      const verts = face.vertices;
      for (let i = 0; i < verts.length; i++) {
        const a = verts[i];
        const b = verts[(i + 1) % verts.length];
        const key = edgeKey(a, b);

        if (!edgeMap.has(key)) {
          edgeMap.set(key, { a, b, faces: [] });
        }

        edgeMap.get(key)!.faces.push({
          normal: face.normal,
          isInternal: face.isInternal,
          tag: solid.tag,
        });
      }
    }
  }

  const cosThreshold = Math.cos((dihedralThresholdDeg * Math.PI) / 180);
  const edges: Edge3D[] = [];

  for (const [, info] of edgeMap) {
    const { a, b, faces: adjFaces } = info;

    // Filtrar faces internas — se QUALQUER face adjacente é interna, suprimir
    const hasAnyInternal = adjFaces.some(f => f.isInternal);
    if (hasAnyInternal) continue;

    // Se todos os lados são da mesma tag → suprimir (juntas entre setores)
    const tags = new Set(adjFaces.map(f => f.tag));
    if (tags.size === 1 && adjFaces.length === 2) {
      // Mesma tag, duas faces → verificar ângulo diedro
      const d = dot(adjFaces[0].normal, adjFaces[1].normal);
      // Se as normais são muito parecidas → é uma superfície suave → suprimir
      if (d > cosThreshold) continue;
    }

    // Aresta de fronteira (1 face) → sempre contorno
    if (adjFaces.length === 1) {
      edges.push({ a, b, stroke, strokeWidth });
      continue;
    }

    // Duas faces de tags diferentes → contorno (transição entre objetos)
    if (tags.size > 1) {
      edges.push({ a, b, stroke, strokeWidth });
      continue;
    }

    // Duas faces, mesma tag, ângulo significativo → contorno (aresta viva)
    if (adjFaces.length === 2) {
      const d = dot(adjFaces[0].normal, adjFaces[1].normal);
      if (d < cosThreshold) {
        edges.push({ a, b, stroke, strokeWidth });
      }
    }
  }

  return edges;
};
