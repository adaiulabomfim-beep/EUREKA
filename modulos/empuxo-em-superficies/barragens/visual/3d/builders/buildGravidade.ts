// ─────────────────────────────────────────────────────────
// buildGravidade.ts — Builder 3D para barragem de gravidade
// ─────────────────────────────────────────────────────────

import type { Vec2, Material3D, SceneMesh3D } from '../core/tipos3D';
import { extrudeLinear, criarCaixaAguaLinear, criarTerraBase } from '../core/buildersBase';

/** Materiais padrão */
const materialConcreto: Material3D = {
  fill: '#9ca3af',
  opacity: 1,
  hatchPattern: 'url(#concretePattern)',
  kind: 'DAM',
  priority: 2,
};

const materialTerra: Material3D = {
  fill: '#a16207',
  opacity: 1,
  hatchPattern: 'url(#earthPattern)',
  kind: 'EARTH',
  priority: 0,
};

const materialAguaUp: Material3D = {
  fill: 'url(#fluidDepthA)',
  opacity: 0.55,
  kind: 'WATER_UP',
  priority: 1,
};

const materialAguaDown: Material3D = {
  fill: 'url(#fluidDepthB)',
  opacity: 0.55,
  kind: 'WATER_DOWN',
  priority: 1,
};

export interface GravidadeParams {
  profile: Vec2[];
  channelWidth: number;
  damHeight: number;
  upstreamLevel: number;
  downstreamLevel: number;
  getDamXAtY: (y: number, side: 'UPSTREAM' | 'DOWNSTREAM') => number;
  toWorldX: (x: number) => number;
}

/**
 * Constrói a cena 3D completa de uma barragem de gravidade.
 *
 * NOTA: contornos externos desabilitados temporariamente.
 * A malha entrega apenas faces — sem Edge3D.
 */
export const buildGravidade3D = (params: GravidadeParams): SceneMesh3D => {
  const {
    profile, channelWidth, damHeight,
    upstreamLevel, downstreamLevel,
    getDamXAtY, toWorldX,
  } = params;

  const solids = [];

  // --- Terra / Fundação ---
  const maxH = Math.max(damHeight, upstreamLevel, downstreamLevel);
  const farLeft = getDamXAtY(0, 'UPSTREAM') - damHeight * 1.5;
  const farRight = getDamXAtY(0, 'DOWNSTREAM') + damHeight * 1.5;

  solids.push(criarTerraBase(
    maxH, farLeft, farRight,
    channelWidth * 1.5,
    materialTerra,
    toWorldX,
  ));

  // --- Barragem (extrusão linear) ---
  solids.push(extrudeLinear(
    profile,
    channelWidth,
    materialConcreto,
    'dam-body',
    0,
    toWorldX,
  ));

  // --- Água a montante ---
  if (upstreamLevel > 0) {
    solids.push(criarCaixaAguaLinear(
      upstreamLevel,
      channelWidth,
      farLeft,
      'UPSTREAM',
      getDamXAtY,
      materialAguaUp,
      0,
      toWorldX,
    ));
  }

  // --- Água a jusante ---
  if (downstreamLevel > 0) {
    solids.push(criarCaixaAguaLinear(
      downstreamLevel,
      channelWidth,
      farRight,
      'DOWNSTREAM',
      getDamXAtY,
      materialAguaDown,
      0,
      toWorldX,
    ));
  }

  // SEM contornos por enquanto — foco na malha limpa
  return { solids, edges: [] };
};
