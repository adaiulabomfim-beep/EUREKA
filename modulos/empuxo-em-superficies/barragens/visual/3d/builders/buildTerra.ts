// ─────────────────────────────────────────────────────────
// buildTerra.ts — Builder 3D para barragem de terra/enrocamento
// ─────────────────────────────────────────────────────────
//
// Extrusão linear do perfil trapezoidal com material de terra.
// Estruturalmente idêntico à gravidade, diferindo apenas nos materiais.
// ─────────────────────────────────────────────────────────

import type { Vec2, Material3D, SceneMesh3D } from '../core/tipos3D';
import { extrudeLinear, criarCaixaAguaLinear, criarTerraBase } from '../core/buildersBase';
import { extrairContornos } from '../core/contornos';

/** Materiais para terra/enrocamento */
const materialTerraBarragem: Material3D = {
  fill: '#A67B5B',
  opacity: 1,
  hatchPattern: 'url(#earthPattern)',
  kind: 'DAM',
  priority: 2,
};

const materialFundacao: Material3D = {
  fill: '#a16207',
  opacity: 1,
  hatchPattern: 'url(#earthPattern)',
  kind: 'DAM',
  priority: 0,
};

const materialAguaUp: Material3D = {
  fill: 'url(#fluidDepthA)',
  opacity: 1,
  kind: 'WATER_UP',
  priority: 1,
};

const materialAguaDown: Material3D = {
  fill: 'url(#fluidDepthB)',
  opacity: 1,
  kind: 'WATER_DOWN',
  priority: 1,
};

export interface TerraParams {
  profile: Vec2[];
  channelWidth: number;
  damHeight: number;
  upstreamLevel: number;
  downstreamLevel: number;
  getDamXAtY: (y: number, side: 'UPSTREAM' | 'DOWNSTREAM') => number;
  toWorldX: (x: number) => number;
}

/**
 * Constrói a cena 3D completa de uma barragem de terra/enrocamento.
 */
export const buildTerra3D = (params: TerraParams): SceneMesh3D => {
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
    materialFundacao,
    toWorldX,
  ));

  // --- Barragem (extrusão linear com material de terra) ---
  solids.push(extrudeLinear(
    profile,
    channelWidth,
    materialTerraBarragem,
    'dam-body',
    0,
    toWorldX,
  ));

  // --- Água a montante ---
  if (upstreamLevel > 0) {
    solids.push(criarCaixaAguaLinear(
      upstreamLevel,
      channelWidth,
      getDamXAtY(0, 'UPSTREAM') - damHeight * 1.5,
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
      getDamXAtY(0, 'DOWNSTREAM') + damHeight * 1.5,
      'DOWNSTREAM',
      getDamXAtY,
      materialAguaDown,
      0,
      toWorldX,
    ));
  }

  // --- Contornos ---
  const meshWithoutEdges: SceneMesh3D = { solids, edges: [] };
  const edges = extrairContornos(meshWithoutEdges, '#6F4F28');

  return { solids, edges };
};
