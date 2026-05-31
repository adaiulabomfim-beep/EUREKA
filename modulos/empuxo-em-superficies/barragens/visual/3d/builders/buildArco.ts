// ─────────────────────────────────────────────────────────
// buildArco.ts — Builder 3D para barragem em arco
// ─────────────────────────────────────────────────────────
//
// Sweep curvo verdadeiro: o perfil 2D da seção transversal é varrido
// ao longo de uma curva diretora circular (arco) no plano XZ.
//
// Cada setor entre dois ângulos consecutivos produz um sólido convexo.
// As juntas entre setores são marcadas isInternal=true → sem stroke,
// sem contornos visíveis. A curvatura nasce da geometria diretamente.
//
// A água a montante também acompanha a curvatura do arco,
// usando setores compatíveis com os da barragem.
// ─────────────────────────────────────────────────────────

import type { Vec2, Vec3, Material3D, SceneMesh3D, CurveDirector, CurvePoint } from '../core/tipos3D';
import { v3 } from '../core/meshUtils';
import { sweepCurvo, criarCaixaAguaCurva, criarTerraBase } from '../core/buildersBase';
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

export interface ArcoParams {
  /** Perfil 2D da seção transversal da barragem. */
  profile: Vec2[];
  /** Raio do arco. */
  archRadius: number;
  /** Largura do canal (abertura total do arco). */
  channelWidth: number;
  /** Altura da barragem. */
  damHeight: number;
  /** Largura da base da barragem. */
  damBaseWidth: number;
  /** Nível d'água a montante. */
  upstreamLevel: number;
  /** Nível d'água a jusante. */
  downstreamLevel: number;
  /** Função que retorna o X da face da barragem em função de Y (em coords do perfil). */
  getDamXAtY: (y: number, side: 'UPSTREAM' | 'DOWNSTREAM') => number;
  /** Transformação X do perfil → coordenada mundo. */
  toWorldX: (x: number) => number;
  /** Número de segmentos do arco (default 16). */
  segments?: number;
}

/**
 * Cria a curva diretora do arco: um arco de círculo no plano XZ.
 *
 * O arco é centrado na origem (0, 0, centerZ) com raio R.
 * A abertura angular é determinada pelo channelWidth e pelo archRadius.
 *
 * A curva é parametrizada de modo que:
 * - t=0 → extremidade esquerda (z negativo)
 * - t=1 → extremidade direita (z positivo)
 *
 * A tangente em cada ponto é tangente ao arco, apontando na
 * direção de avanço (de t=0 para t=1).
 *
 * O perfil será orientado de modo que:
 * - eixo X do perfil → direção radial (binormal = para dentro/fora)
 * - eixo Y do perfil → vertical (up = Y)
 */
const criarCurvaDiretoraArco = (
  archRadius: number,
  channelWidth: number,
  toWorldX: (x: number) => number,
  profileCenterX: number,
): CurveDirector => {
  // Meia abertura angular do arco
  const halfSpan = channelWidth / 2;
  const halfAngle = Math.asin(Math.min(1, halfSpan / archRadius));

  // Centro do arco: está a montante da barragem (no eixo X)
  // O arco "curva para montante" → centro em X positivo (jusante do perfil)
  // Para um arco simétrico, centerX = profileCenterX + archRadius
  const centerX = toWorldX(profileCenterX) + archRadius;
  const centerZ = 0;

  return (t: number): CurvePoint => {
    // Ângulo: vai de -halfAngle a +halfAngle
    // Começando de -halfAngle (z negativo) até +halfAngle (z positivo)
    const angle = -halfAngle + t * (2 * halfAngle);

    // Posição no arco (plano XZ, Y=0)
    // x = centerX - R*cos(angle)  → face de montante curva para trás
    // z = centerZ + R*sin(angle)
    const px = centerX - archRadius * Math.cos(angle);
    const pz = centerZ + archRadius * Math.sin(angle);

    // Tangente ao arco (derivada da posição em relação ao ângulo, normalizada)
    // dx/dangle = R*sin(angle)
    // dz/dangle = R*cos(angle)
    const tx = Math.sin(angle);
    const tz = Math.cos(angle);

    // A tangente aponta na direção de avanço (crescimento de t/angle)
    const tLen = Math.sqrt(tx * tx + tz * tz) || 1;

    return {
      position: v3(px, 0, pz),
      tangent: v3(tx / tLen, 0, tz / tLen),
    };
  };
};

/**
 * Constrói a cena 3D completa de uma barragem em arco.
 */
export const buildArco3D = (params: ArcoParams): SceneMesh3D => {
  const {
    profile, archRadius, channelWidth, damHeight, damBaseWidth,
    upstreamLevel, downstreamLevel,
    getDamXAtY, toWorldX,
    segments = 16,
  } = params;

  const solids = [];

  // Centro X do perfil (para centralizar a seção na curva)
  const profileCenterX = damBaseWidth / 2;

  // --- Curva diretora ---
  const curva = criarCurvaDiretoraArco(archRadius, channelWidth, toWorldX, profileCenterX);

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

  // --- Barragem (sweep curvo) ---
  const arcSolids = sweepCurvo(
    profile,
    curva,
    segments,
    materialConcreto,
    'dam-body',
    profileCenterX,
  );
  solids.push(...arcSolids);

  // --- Água a montante (curva, acompanhando o arco) ---
  if (upstreamLevel > 0) {
    const waterSolids = criarCaixaAguaCurva(
      upstreamLevel,
      curva,
      segments,
      getDamXAtY(0, 'UPSTREAM') - damHeight * 1.25,
      'UPSTREAM',
      getDamXAtY,
      materialAguaUp,
      profileCenterX,
      toWorldX,
    );
    solids.push(...waterSolids);
  }

  // --- Água a jusante (curva) ---
  if (downstreamLevel > 0) {
    const waterSolids = criarCaixaAguaCurva(
      downstreamLevel,
      curva,
      segments,
      getDamXAtY(0, 'DOWNSTREAM') + damHeight * 1.25,
      'DOWNSTREAM',
      getDamXAtY,
      materialAguaDown,
      profileCenterX,
      toWorldX,
    );
    solids.push(...waterSolids);
  }

  // --- Contornos externos ---
  const meshWithoutEdges: SceneMesh3D = { solids, edges: [] };
  const edges = extrairContornos(meshWithoutEdges);

  return { solids, edges };
};
