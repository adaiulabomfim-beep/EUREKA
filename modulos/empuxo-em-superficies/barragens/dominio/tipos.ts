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

export interface DetalheSubpressaoBarragem {
  ativa: boolean;
  fatorMontante: number;           // Fração da pressão hidrostática de montante em B (1.0 = carga total)
  fatorJusante: number;            // Fração da pressão hidrostática de jusante em C (0.0 = atm)
  p_B: number;                     // Pa (Pressão de subpressão no pé de montante B)
  p_C: number;                     // Pa (Pressão de subpressão no pé de jusante C)
  U_por_metro: number;             // N/m (Força de subpressão resultante por metro linear)
  U_total: number;                 // N (Força de subpressão total na largura b)
  x_U: number;                     // m (Posição do centroide do diagrama a partir de B, ex.: B/3 = 20 m)
  braco_U_C: number;               // m (Distância de U até o vértice C: B - x_U = 40 m)
  M_U_ref_por_metro: number;       // N·m/m (Momento de subpressão com braço B/3 = x_U da referência clássica)
  M_U_ref_total: number;           // N·m (Momento total de subpressão com braço x_U = 20 m: ~14,10 × 10⁶ kN·m)
  M_U_C_por_metro: number;         // N·m/m (Momento tombante de U em relação a C com braço B - x_U = 40 m)
  M_U_C_total: number;             // N·m (Momento tombante total de U em relação a C com braço B - x_U)
}

export interface AnaliseMomentoPontoCBarragem {
  larguraLongitudinal: number;     // m (Largura b da barragem, ex.: 30 m)
  L_AB: number;                    // m (Comprimento total da face inclinada AB)
  areaMolhadaTotal: number;        // m² (Área molhada total na largura b: L_molhado * b)
  p_cg: number;                    // Pa (Pressão no centroide da face molhada AB)
  x_cp_B: number;                  // m (Coordenada horizontal do CP a partir de B)
  y_cp_B: number;                  // m (Coordenada vertical do CP a partir da base BC)
  projecao_AD: number;             // m (Projeção de AC sobre AB a partir de A: H·sen(θ) = 64 m)
  projecao_BD: number;             // m (Projeção de BC sobre AB a partir de B: B·cos(θ) = 36 m)
  braco_FR_C: number;              // m (Distância perpendicular de C até a linha de ação de FR: |s_CP - AD| = 2,67 m)
  F_R_total: number;               // N (Força hidrostática resultante total na face AB: FR * b)
  F_H_total: number;               // N (Componente horizontal total: FH * b)
  F_V_total: number;               // N (Componente vertical descendente total: FV * b)
  M_FH_C_por_metro: number;        // N·m/m (Momento tombante horário de FH em C: +FH * y_cp)
  M_FV_C_por_metro: number;        // N·m/m (Momento estabilizante anti-horário de FV em C: -FV * (B - x_cp))
  M_hidro_C_por_metro: number;     // N·m/m (Momento líquido da força hidrostática em C: M_FH_C - |M_FV_C|)
  M_hidro_C_total: number;         // N·m (Momento líquido total da força hidrostática em C na largura b)
  sentidoMomentoHidro: 'HORARIO_TOMBANTE' | 'ANTI_HORARIO_ESTABILIZANTE' | 'NULO';
  hidroIsoladaTomba: boolean;      // true somente se M_hidro_C > M_W_C (ou se M_hidro_C > 0 quando avaliado isoladamente)
  W_total: number;                 // N (Peso próprio total na largura b: W * b)
  M_W_C_por_metro: number;         // N·m/m (Momento estabilizante do peso próprio em C por metro)
  M_W_C_total: number;             // N·m (Momento estabilizante total do peso próprio em C na largura b)
  // Condição A: Sem percolação (U = 0)
  M_liq_sem_percolacao_por_metro: number; // N·m/m (Momento estabilizante líquido sem percolação: M_W_C + |M_FV_C| - M_FH_C)
  M_liq_sem_percolacao_total: number;     // N·m (Momento líquido total em C sem percolação)
  fs_tomb_sem_percolacao: number;
  estavel_sem_percolacao: boolean;
  // Condição B: Com percolação (Subpressão U ativa)
  subpressao: DetalheSubpressaoBarragem;
  M_tomb_com_percolacao_por_metro: number; // N·m/m (M_FH_C + M_U_C)
  M_tomb_com_percolacao_total: number;     // N·m
  M_est_com_percolacao_por_metro: number;  // N·m/m (M_W_C + |M_FV_C|)
  M_est_com_percolacao_total: number;      // N·m
  M_liq_com_percolacao_por_metro: number;  // N·m/m (M_est - M_tomb)
  M_liq_com_percolacao_total: number;      // N·m
  fs_tomb_com_percolacao: number;
  estavel_com_percolacao: boolean;
}

export interface ResultadoEstabilidadeBarragem {
  area: number;                     // m²/m (Área efetiva da seção transversal)
  weight: number;                   // N/m (Peso próprio da barragem por metro linear)
  x_cg: number;                     // m (Posição horizontal do CG a partir do pé de montante)
  y_cg: number;                     // m (Posição vertical do CG a partir da base)
  lever_arm_weight: number;         // m (Braço do peso em relação ao ponto de tombamento)
  gammaMaterial: number;            // N/m³ (Peso específico do material da barragem)
  concreteSpecificGravity?: number; // Densidade relativa do concreto (d = 2,4)
  damWidth?: number;                // m (Largura longitudinal b da barragem)
  mu: number;                       // Coeficiente de atrito na fundação
  actualBaseWidth: number;          // m (Largura real da base usada na geometria e cálculo)
  moment_resisting: number;         // N·m/m (Momento estabilizante: W·braço + FV·braços)
  moment_overturning: number;       // N·m/m (Momento tombador líquido na condição ativa)
  moment_resisting_water_v: number; // N·m/m (Contribuição estabilizante de FV)
  total_vertical_force: number;     // N/m (ΣV = W + FV_net - U)
  fs_tomb: number;                  // Fator de segurança ao tombamento (condição ativa)
  fs_desl: number;                  // Fator de segurança ao deslizamento (condição ativa)
  e: number;                        // m (Excentricidade da resultante na base em relação ao centro)
  stabilityApplicable: boolean;     // false para barragem em arco (efeito de arco)
  isArchDam?: boolean;
  archThrust?: number;              // N/m (Esforço circunferencial no arco: p_max * R)
  archStressBase?: number;          // Pa (Tensão média de compressão na base do arco)
  volumeFactor?: number;
  upliftAssumption: string;
  analisePontoC?: AnaliseMomentoPontoCBarragem;
}

export interface RenderizadorBarragensProps {
  damType: TipoBarragem;
  damHeight: number;
  damBaseWidth: number;
  damCrestWidth: number;
  damWidth?: number;
  inclinationAngle: number;
  downstreamAngle?: number;
  buttressAngle?: number;
  archRadius?: number;
  upstreamLevel: number;
  downstreamLevel?: number;
  hasMudLayer?: boolean;
  mudHeight?: number;
  mudDensity?: number;
  hasPercolation?: boolean;
  upliftFactorUp?: number;
  upliftFactorDown?: number;
  showTriangularMode?: boolean;
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
  damWidth?: number;                // m (Largura longitudinal b; padrão 1 m ou 30 m no Problema 2.66)
  concreteSpecificGravity?: number; // Densidade relativa do concreto (d = 2,4)
  fluidKey?: 'agua' | 'agua20C';
  inclinationAngle: number;
  downstreamAngle?: number;
  buttressAngle?: number;
  archRadius?: number;
  upstreamLevel: number;
  downstreamLevel: number;
  hasMudLayer?: boolean;
  mudHeight?: number;
  mudDensity?: number;
  hasPercolation?: boolean;         // Ativa subpressão sob a base BC
  upliftFactorUp?: number;          // Coeficiente de carga em B (padrão 1.0 = triangular plena)
  upliftFactorDown?: number;        // Coeficiente de carga em C (padrão 0.0 = nula em C)
  showTriangularMode?: boolean;     // Ativa visualização didática ABC + largura total b
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
