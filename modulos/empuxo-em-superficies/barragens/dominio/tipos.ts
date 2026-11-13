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
  archRadius?: number;
}

export type SistemaUnidadesBarragem = 'SI' | 'TECNICO_KGF';

export interface DetalheCamadaLama {
  mudHeight: number;      // m (Altura efetiva da camada de lama no fundo)
  mudDensity: number;     // kg/m³ (Densidade da lama, ex: 1500 para d = 1.5)
  waterHeight: number;    // m (Altura da coluna de água acima da lama)
  p_interface: number;    // Pa (Pressão na interface água/lama)
  F_water: number;        // N/m (Empuxo P' da água acima da lama)
  y_cp_water: number;     // m (Altura do CP da água a partir do fundo)
  F_mud_rect: number;     // N/m (Parcela retangular na lama devido à água acima)
  F_mud_tri: number;      // N/m (Parcela triangular devido ao peso próprio da lama)
  F_mud: number;          // N/m (Empuxo P'' total na camada de lama)
  y_cp_mud: number;       // m (Altura do CP da parcela na lama a partir do fundo)
}

export type ResultadoSuperficieRetangular = {
  FR: number;          // N/m (Magnitude da força resultante perpendicular à face)
  FH: number;          // N/m (Componente horizontal da força)
  FV: number;          // N/m (Componente vertical descendente sobre a face inclinada)
  s_cp: number;        // m (Distância da superfície livre até o CP ao longo da face)
  h_cp: number;        // m (Profundidade vertical do CP a partir da superfície livre)
  s_cg: number;        // m (Distância da superfície livre até o CG ao longo da face)
  h_cg: number;        // m (Profundidade vertical do CG a partir da superfície livre)
  area: number;        // m²/m (Área molhada por metro de largura)
  wetLength: number;   // m (Comprimento molhado ao longo da face)
  y_cp: number;        // m (Altura vertical do CP a partir do fundo)
  x_cp_offset: number; // m (Deslocamento horizontal do CP em relação ao pé da face)
  p_bot: number;       // Pa (Pressão na base da barragem)
  mudLayer?: DetalheCamadaLama;
};

export interface ResultadoForcaLiquidaBarragem {
  FR_net: number;       // N/m (Módulo da resultante vetorial líquida, com sinal de FH_net)
  FH_net: number;       // N/m (Força horizontal líquida Montante -> Jusante)
  FV_net: number;       // N/m (Soma das componentes verticais descendentes da água)
  y_cp_net: number;     // m (Altura vertical equivalente de FH_net a partir do fundo)
  s_cp_net: number;     // m (Distância equivalente ao longo da face de montante)
  moment_total: number; // N·m/m (Momento tombador líquido de FH em torno da base)
  p_max_up: number;     // Pa (Pressão máxima a montante)
  p_max_down: number;   // Pa (Pressão máxima a jusante)
  thetaUp: number;      // graus (Ângulo da face de montante)
  thetaDown: number;    // graus (Ângulo da face de jusante derivado da geometria)
  up: ResultadoSuperficieRetangular;
  down: ResultadoSuperficieRetangular;
}

export interface ResultadoEstabilidadeBarragem {
  area: number;                     // m²/m (Área efetiva da seção transversal)
  weight: number;                   // N/m (Peso próprio da barragem por metro linear)
  x_cg: number;                     // m (Posição horizontal do CG a partir do pé de montante)
  y_cg: number;                     // m (Posição vertical do CG a partir da base)
  lever_arm_weight: number;         // m (Braço do peso em relação ao ponto de tombamento)
  gammaMaterial: number;            // N/m³ (Peso específico do material da barragem)
  mu: number;                       // Coeficiente de atrito na fundação
  actualBaseWidth: number;          // m (Largura real da base usada na geometria e cálculo)
  moment_resisting: number;         // N·m/m (Momento estabilizante: W·braço + FV·braços)
  moment_overturning: number;       // N·m/m (Momento tombador líquido)
  moment_resisting_water_v: number; // N·m/m (Contribuição estabilizante de FV)
  total_vertical_force: number;     // N/m (ΣV = W + FV_net)
  fs_tomb: number;                  // Fator de segurança ao tombamento
  fs_desl: number;                  // Fator de segurança ao deslizamento
  e: number;                        // m (Excentricidade da resultante na base em relação ao centro)
  stabilityApplicable: boolean;     // false para barragem em arco (efeito de arco)
  isArchDam?: boolean;
  archThrust?: number;              // N/m (Esforço circunferencial no arco: p_max * R)
  archStressBase?: number;          // Pa (Tensão média de compressão na base do arco)
  volumeFactor?: number;
  upliftAssumption: string;
}

export interface RenderizadorBarragensProps {
  damType: TipoBarragem;
  damHeight: number;
  damBaseWidth: number;
  damCrestWidth: number;
  inclinationAngle: number;
  downstreamAngle?: number;
  buttressAngle?: number;
  archRadius?: number;
  upstreamLevel: number;
  downstreamLevel?: number;
  hasMudLayer?: boolean;
  mudHeight?: number;
  mudDensity?: number;
  unitSystem?: SistemaUnidadesBarragem;
  gravity?: number;
  force: number;
  forceH?: number;
  forceV?: number;
  s_cp: number;
  y_cp: number;
  up?: ResultadoSuperficieRetangular;
  down?: ResultadoSuperficieRetangular;
  stability?: ResultadoEstabilidadeBarragem | null;
  isAnalyzed: boolean;
  onCalculate: () => void;
  onReset: () => void;
}

export interface VistaBarragemProps {
  damHeight: number;
  damBaseWidth: number;
  damCrestWidth: number;
  inclinationAngle: number;
  downstreamAngle?: number;
  buttressAngle?: number;
  archRadius?: number;
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
  downstreamAngle?: number;
  buttressAngle?: number;
  archRadius?: number;
  upstreamLevel: number;
  downstreamLevel: number;
  hasMudLayer?: boolean;
  mudHeight?: number;
  mudDensity?: number;
  density: number;
  gravity: number;
  unitSystem?: SistemaUnidadesBarragem;
}

export interface ResultadoSimulacaoBarragem {
  damType: TipoBarragem;
  normalizedInputs: ConfiguracaoSimulacaoBarragem;
  forceData: ResultadoForcaLiquidaBarragem;
  stabilityData: ResultadoEstabilidadeBarragem | null;
  geometryModel: any;
  annotationModel: any;
  warnings: string[];
}
