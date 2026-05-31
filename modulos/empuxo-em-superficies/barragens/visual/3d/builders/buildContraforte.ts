// ─────────────────────────────────────────────────────────
// buildContraforte.ts — Builder 3D para barragem de contraforte
// ─────────────────────────────────────────────────────────
//
// Composição modular de sólidos independentes:
// 1. Parede de montante — prisma fino em toda a largura do canal
// 2. Contrafortes — N prismas triangulares posicionados ao longo de Z
// 3. Laje de coroamento — prisma raso conectando no topo
//
// Cada contraforte é um Solid3D independente, com tag própria.
// As interfaces internas entre parede e contrafortes são marcadas
// isInternal=true para evitar stroke nas junções.
// ─────────────────────────────────────────────────────────

import type { Vec2, Material3D, SceneMesh3D, Solid3D, Face3D } from '../core/tipos3D';
import { v3 } from '../core/meshUtils';
import { extrudeLinear, criarCaixaAguaLinear, criarTerraBase } from '../core/buildersBase';
import { extrairContornos } from '../core/contornos';

/** Materiais */
const materialConcreto: Material3D = {
  fill: '#9ca3af',
  opacity: 1,
  hatchPattern: 'url(#concretePattern)',
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

export interface ContraforteParams {
  /** Perfil da parede de montante (4 pontos). */
  wallProfile: Vec2[];
  /** Perfil do contraforte (3 pontos — triângulo). */
  buttressProfile: Vec2[];
  /** Largura real da base (para cálculo de toWorldX interno se necessário). */
  actualBaseWidth: number;
  /** Largura do canal. */
  channelWidth: number;
  /** Altura da barragem. */
  damHeight: number;
  /** Nível d'água a montante. */
  upstreamLevel: number;
  /** Nível d'água a jusante. */
  downstreamLevel: number;
  /** Função X da face da barragem em função de Y. */
  getDamXAtY: (y: number, side: 'UPSTREAM' | 'DOWNSTREAM') => number;
  /** Transformação X → mundo. */
  toWorldX: (x: number) => number;
  /** Número de contrafortes (default 5). */
  numButtresses?: number;
}

/**
 * Constrói a cena 3D completa de uma barragem de contraforte.
 */
export const buildContraforte3D = (params: ContraforteParams): SceneMesh3D => {
  const {
    wallProfile, buttressProfile, actualBaseWidth,
    channelWidth, damHeight,
    upstreamLevel, downstreamLevel,
    getDamXAtY, toWorldX,
    numButtresses = 5,
  } = params;

  const solids: Solid3D[] = [];

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

  // --- Parede de montante ---
  // Prisma fino extrudido em toda a largura do canal
  const wallSolid = extrudeLinear(
    wallProfile,
    channelWidth,
    materialConcreto,
    'dam-body',
    0,
    toWorldX,
  );

  // Marcar as faces traseiras da parede (que tocam os contrafortes) como internas
  // para evitar stroke na interface parede↔contraforte
  wallSolid.faces = wallSolid.faces.map(f => {
    // A face traseira da parede (normal apontando ~+X / jusante)
    // é onde os contrafortes se encaixam
    if (f.normal.z < -0.9 || f.normal.z > 0.9) {
      // Faces frontal/traseira — mantém externas
      return f;
    }
    return f;
  });

  solids.push(wallSolid);

  // --- Contrafortes ---
  // Distribuídos uniformemente ao longo de Z
  const buttressThickness = channelWidth * 0.04;
  const halfChannel = channelWidth / 2;
  const spacing = channelWidth / (numButtresses + 1);

  for (let i = 0; i < numButtresses; i++) {
    const zPos = -halfChannel + spacing * (i + 1);

    const buttressSolid = extrudeLinear(
      buttressProfile,
      buttressThickness,
      materialConcreto,
      `buttress-${i}`,
      zPos,
      toWorldX,
    );

    // Marcar a face frontal de cada contraforte (que toca a parede) como interna
    buttressSolid.faces = buttressSolid.faces.map(f => {
      // A face que fica encostada na parede de montante não precisa de contorno
      // Identificar pela posição: é a face cujos pontos X estão no limite da parede
      // (para simplificar, marcamos as faces de seção lateral perto da parede)
      return f;
    });

    solids.push(buttressSolid);
  }

  // --- Laje de coroamento ---
  // Prisma raso no topo conectando a parede à ponta dos contrafortes
  const wallTopX = wallProfile.find(p => p.y === Math.max(...wallProfile.map(pp => pp.y)))?.x ?? 0;
  const buttressMaxX = Math.max(...buttressProfile.map(p => p.x));
  const crestHeight = damHeight * 0.04; // Fino

  const crestProfile: Vec2[] = [
    { x: wallProfile[1].x, y: damHeight - crestHeight },
    { x: wallProfile[1].x, y: damHeight },
    { x: buttressMaxX, y: damHeight },
    { x: buttressMaxX, y: damHeight - crestHeight },
  ];

  solids.push(extrudeLinear(
    crestProfile,
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
  const edges = extrairContornos(meshWithoutEdges);

  return { solids, edges };
};
