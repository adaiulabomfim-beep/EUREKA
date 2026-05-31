// ─────────────────────────────────────────────────────────
// tipos3D.ts — Tipos fundamentais do sistema de malha 3D
// ─────────────────────────────────────────────────────────

/** Vetor/ponto 3D imutável. */
export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Ponto 2D usado para perfis de seção. */
export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

/** Material visual de uma face. */
export interface Material3D {
  /** Cor de preenchimento ou referência a pattern (ex: 'url(#concretePattern)'). */
  fill: string;
  /** Opacidade do preenchimento [0..1]. */
  opacity: number;
  /** Pattern de hachura sobreposto (ex: 'url(#earthPattern)'). */
  hatchPattern?: string;
  /** Classificação semântica para ordenação no Painter's Algorithm. */
  kind: 'DAM' | 'WATER_UP' | 'WATER_DOWN' | 'EARTH';
  /** Prioridade de desenho (valores maiores = desenhado por cima). */
  priority: number;
}

/** Face individual de um sólido. */
export interface Face3D {
  /** Vértices em ordem CCW quando vistos do lado externo. */
  vertices: Vec3[];
  /** Normal unitária apontando para fora do sólido. */
  normal: Vec3;
  /** Material visual desta face. */
  material: Material3D;
  /**
   * Se `true`, esta face é uma junta interna entre segmentos adjacentes
   * (ex: setores do arco). Ela NÃO receberá stroke e NÃO será considerada
   * para contornos visíveis.
   */
  isInternal: boolean;
}

/** Aresta de contorno externo (silhueta). */
export interface Edge3D {
  /** Ponto inicial da aresta. */
  a: Vec3;
  /** Ponto final da aresta. */
  b: Vec3;
  /** Cor do traço. */
  stroke: string;
  /** Largura do traço. */
  strokeWidth: number;
}

/**
 * Sólido convexo composto por faces.
 * Cada sólido recebe uma `tag` semântica que identifica seu papel na cena.
 * Contornos entre sólidos de mesma `tag` podem ser suprimidos.
 */
export interface Solid3D {
  /** Faces do sólido. */
  faces: Face3D[];
  /** Tag semântica — ex: 'dam-body', 'buttress-0', 'water-up', 'earth'. */
  tag: string;
}

/** Malha completa de uma cena 3D (conjunto de sólidos + contornos). */
export interface SceneMesh3D {
  /** Todos os sólidos da cena. */
  solids: Solid3D[];
  /** Contornos externos extraídos. */
  edges: Edge3D[];
}

/**
 * Ponto na curva diretora do sweep curvo.
 * Define posição e tangente para construção do quadro local.
 */
export interface CurvePoint {
  /** Posição 3D do ponto na curva. */
  position: Vec3;
  /** Tangente unitária na direção de avanço da curva. */
  tangent: Vec3;
}

/**
 * Definição de uma curva diretora parametrizada em t ∈ [0, 1].
 */
export type CurveDirector = (t: number) => CurvePoint;
