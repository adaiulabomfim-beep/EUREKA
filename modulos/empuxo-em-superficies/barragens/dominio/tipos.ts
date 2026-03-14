export enum TipoBarragem {
  GRAVIDADE = 'GRAVIDADE',
  TERRA_ENROCAMENTO = 'TERRA_ENROCAMENTO',
  ARCO = 'ARCO',
  CONTRAFORTE = 'CONTRAFORTE'
}

export interface PredefinicaoBarragem {
  inclinationAngle: number;
  damBaseWidth: number;
  damCrestWidth: number;
}

export type ResultadoSuperficieRetangular = {
  FR: number;         // N (Magnitude da força resultante)
  s_cp: number;       // m (Distância da superfície livre até o CP ao longo da face)
  h_cp: number;       // m (Profundidade vertical do CP a partir da superfície livre)
  s_cg: number;       // m (Distância da superfície livre até o CG ao longo da face)
  h_cg: number;       // m (Profundidade vertical do CG a partir da superfície livre)
  area: number;       // m² (Área molhada por metro de largura)
  wetLength: number;  // m (Comprimento molhado ao longo da face)
  y_cp: number;       // m (Altura vertical do CP a partir do fundo)
  p_bot: number;       // Pa (Pressão na base da barragem)
};

export interface RenderizadorBarragensProps {
  damType: TipoBarragem;
  damHeight: number;
  damBaseWidth: number;
  damCrestWidth: number;
  inclinationAngle: number;
  upstreamLevel: number;
  downstreamLevel?: number;
  force: number;
  s_cp: number;
  y_cp: number;
  up?: ResultadoSuperficieRetangular;
  down?: ResultadoSuperficieRetangular;
  isAnalyzed: boolean;
  onCalculate: () => void;
  onReset: () => void;
}

export interface VistaBarragemProps {
  damHeight: number;
  damBaseWidth: number;
  damCrestWidth: number;
  inclinationAngle: number;
  upstreamLevel: number;
  downstreamLevel: number;
  forceData?: any;
  project?: (p: { x: number; y: number; z: number }) => { x: number; y: number; zDepth: number };
  face: (pts3: any[], fill: string, opacity: number, stroke?: string, strokeWidth?: number, normal?: any, kind?: "DAM" | "WATER", hatchPattern?: string, priority?: number) => any;
  prism: (profile: any[], zWidth: number, fill: string, opacity: number, stroke?: string, strokeWidth?: number, kind?: "DAM" | "WATER", xOffsetFn?: (z: number) => number, zOffset?: number, hatchPattern?: string, toWorldX?: (x: number) => number, priority?: number) => any[];
  waterBox3D: (waterLevelY: number, depth: number, farX: number, damFaceSide: "UPSTREAM" | "DOWNSTREAM", getDamXAtY: (y: number, side: "UPSTREAM" | "DOWNSTREAM") => number, toWorldX: (x: number) => number, offsetFn?: (z: number) => number, fillId?: "A" | "B") => any[];
  toWorldX: (x: number) => number;
  CHANNEL_WIDTH: number;
  archOffsetFn?: (z: number) => number;
}

export interface ConfiguracaoSimulacaoBarragem {
  damType: TipoBarragem;
  damHeight: number;
  damBaseWidth: number;
  damCrestWidth: number;
  inclinationAngle: number;
  upstreamLevel: number;
  downstreamLevel: number;
  density: number;
  gravity: number;
}

export interface ResultadoSimulacaoBarragem {
  damType: TipoBarragem;
  normalizedInputs: any;
  forceData: any;
  stabilityData: any | null;
  geometryModel: any;
  annotationModel: any;
  warnings: string[];
}
