// ─────────────────────────────────────────────────────────
// toWorldFaces.ts — Conversão SceneMesh3D → WorldFace[]
// ─────────────────────────────────────────────────────────
//
// Faz a ponte entre o novo sistema de malha (Face3D/Solid3D)
// e o motor SVG existente (WorldFace em motorCena3D.ts).
// ─────────────────────────────────────────────────────────

import type { SceneMesh3D, Face3D, Solid3D, Edge3D } from './tipos3D';
import type { WorldFace } from '../../motorCena3D';

/**
 * Converte uma SceneMesh3D completa para o array de WorldFace[]
 * esperado pelo `useSceneEngine` do motor SVG.
 *
 * - Faces com `isInternal=true` recebem stroke='none' e strokeWidth=0
 *   para eliminar juntas visíveis no SVG.
 * - Edges de contorno viram WorldFace com 2 pontos (linhas).
 * - O material de cada Face3D mapeia diretamente para os campos de WorldFace.
 */
export const toWorldFaces = (mesh: SceneMesh3D): WorldFace[] => {
  const result: WorldFace[] = [];

  // --- Converter faces dos sólidos ---
  for (const solid of mesh.solids) {
    for (const face of solid.faces) {
      const wf: WorldFace = {
        pts3: face.vertices,
        fill: face.material.fill,
        opacity: face.material.opacity,
        normal: face.normal,
        kind: face.material.kind,
        priority: face.material.priority,
        hatchPattern: face.material.hatchPattern,
        // Faces internas: sem stroke para esconder juntas
        stroke: face.isInternal ? 'none' : undefined,
        strokeWidth: face.isInternal ? 0 : undefined,
      };
      result.push(wf);
    }
  }

  // --- Converter edges de contorno ---
  for (const edge of mesh.edges) {
    const wf: WorldFace = {
      pts3: [edge.a, edge.b],
      fill: 'none',
      opacity: 1,
      stroke: edge.stroke,
      strokeWidth: edge.strokeWidth,
      kind: 'DAM',
      priority: 10,  // contornos sempre desenhados por cima
    };
    result.push(wf);
  }

  return result;
};
