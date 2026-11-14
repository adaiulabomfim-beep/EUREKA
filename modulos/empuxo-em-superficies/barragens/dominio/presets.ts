import { SistemaUnidadesBarragem, TipoBarragem } from './tipos';

export interface DamPreset {
  id?: string;
  title: string;
  subtitle: string;
  enunciado: string;
  damType: TipoBarragem;
  damHeight: number;
  damBaseWidth: number;
  damCrestWidth: number;
  inclinationAngle: number;
  downstreamAngle?: number;
  buttressAngle?: number;
  archRadius?: number;
  upstreamLevel: number;
  hasDownstream: boolean;
  downstreamLevel: number;
  hasMudLayer?: boolean;
  mudHeight?: number;
  mudDensity?: number;
  damWidth?: number;
  concreteSpecificGravity?: number;
  fluidKey?: 'agua' | 'agua20C';
  hasPercolation?: boolean;
  upliftFactorUp?: number;
  upliftFactorDown?: number;
  showTriangularMode?: boolean;
  unitSystem?: SistemaUnidadesBarragem;
}

export const DAM_PRESETS: { [key: string]: DamPreset } = {
  sim1: {
    id: 'sim1',
    title: 'Simulação 1: Barragem de Gravidade (Perfil Clássico)',
    subtitle: 'H = 20,00 m | B = 16,00 m | bc = 4,00 m | h_mont = 18,00 m',
    enunciado:
      'Uma barragem de gravidade em concreto (γ_mat = 24.000 N/m³, μ = 0,70) possui altura total H = 20,00 m, largura da base B = 16,00 m, largura da crista b_c = 4,00 m e paramento de montante vertical (θ = 90°). O reservatório de montante encontra-se na cota h_mont = 18,00 m de água doce (ρ = 1.000 kg/m³, g = 9,81 m/s²), sem lâmina de jusante (h_jus = 0,00 m). Determine, por metro linear de barragem, a força hidrostática resultante (F_R,líq), a altura do centro de pressão a partir da base (y_CP,base), o peso próprio da estrutura (W) e os fatores de segurança ao tombamento (FS_tomb, adotando braço de referência x_CG = B/2) e ao deslizamento (FS_desl).',
    damType: TipoBarragem.GRAVIDADE,
    damHeight: 20,
    damBaseWidth: 16,
    damCrestWidth: 4,
    inclinationAngle: 90,
    upstreamLevel: 18,
    hasDownstream: false,
    downstreamLevel: 0,
    hasMudLayer: false,
    unitSystem: 'SI',
  },
  sim2: {
    id: 'sim2',
    title: 'Simulação 2: Barragem de Gravidade com Lâmina de Jusante',
    subtitle: 'H = 15,00 m | B = 12,00 m | h_mont = 12,00 m | h_jus = 5,00 m',
    enunciado:
      'Uma barragem de gravidade em concreto (γ_mat = 24.000 N/m³, μ = 0,70) possui altura H = 15,00 m, base B = 12,00 m, crista b_c = 4,00 m e paramento vertical (θ = 90°). O nível d\'água de montante é h_mont = 12,00 m e o nível de jusante é h_jus = 5,00 m. Determine a força hidrostática resultante líquida (F_R,líq), a altura do centro de pressão líquido na base (y_CP,base,líq), o peso próprio (W) e os fatores de segurança (adotando x_CG = B/2).',
    damType: TipoBarragem.GRAVIDADE,
    damHeight: 15,
    damBaseWidth: 12,
    damCrestWidth: 4,
    inclinationAngle: 90,
    upstreamLevel: 12,
    hasDownstream: true,
    downstreamLevel: 5,
    hasMudLayer: false,
    unitSystem: 'SI',
  },
  sim3: {
    id: 'sim3',
    title: 'Simulação 3: Barragem de Terra / Enrocamento (Talude Inclinado)',
    subtitle: 'H = 15,00 m | θ = 26,5° | h_mont = 12,00 m | h_jus = 3,00 m',
    enunciado:
      'Uma barragem de terra/enrocamento de altura H = 15,00 m apresenta talude de montante com inclinação θ = 26,5° em relação à horizontal. O nível d\'água a montante é h_mont = 12,00 m e a jusante é h_jus = 3,00 m. Determine a área molhada de montante (A_mont), as forças hidrostáticas de montante, jusante e líquida (F_R,líq), e a cota vertical do centro de pressão líquido a partir da base (y_CP,base,líq).',
    damType: TipoBarragem.TERRA_ENROCAMENTO,
    damHeight: 15,
    damBaseWidth: 66.19,
    damCrestWidth: 6,
    inclinationAngle: 26.5,
    downstreamAngle: 26.5,
    upstreamLevel: 12,
    hasDownstream: true,
    downstreamLevel: 3,
    hasMudLayer: false,
    unitSystem: 'SI',
  },
  sim4: {
    id: 'sim4',
    title: 'Simulação 4: Barragem de Contraforte com Face Inclinada',
    subtitle: 'H = 25,00 m | θ = 70° | h_mont = 22,00 m | h_jus = 0,00 m',
    enunciado:
      'Uma barragem de contraforte possui altura total H = 25,00 m e paramento de montante inclinado a θ = 70° com a horizontal. O nível d\'água de montante é h_mont = 22,00 m, sem lâmina de jusante (h_jus = 0,00 m). Determine a área molhada por metro de largura (A_mont), a força hidrostática resultante (F_R,líq) e a altura vertical do centro de pressão a partir da base (y_CP,base).',
    damType: TipoBarragem.CONTRAFORTE,
    damHeight: 25,
    damBaseWidth: 22,
    damCrestWidth: 2,
    inclinationAngle: 70,
    buttressAngle: 60,
    upstreamLevel: 22,
    hasDownstream: false,
    downstreamLevel: 0,
    hasMudLayer: false,
    unitSystem: 'SI',
  },
  sim5: {
    id: 'sim5',
    title: 'Simulação 5: Barragem em Arco (Vale Estreito)',
    subtitle: 'H = 30,00 m | R = 50,00 m | h_mont = 28,00 m | h_jus = 0,00 m',
    enunciado:
      'Uma barragem em arco implantada em vale estreito possui altura H = 30,00 m, paramento vertical (θ = 90°) e nível de montante h_mont = 28,00 m (h_jus = 0,00 m). Determine a pressão hidrostática máxima na base (p_máx), a força hidrostática resultante por metro linear (F_R,líq) e a altura vertical do centro de pressão a partir da base (y_CP,base).',
    damType: TipoBarragem.ARCO,
    damHeight: 30,
    damBaseWidth: 6,
    damCrestWidth: 3,
    inclinationAngle: 90,
    archRadius: 50,
    upstreamLevel: 28,
    hasDownstream: false,
    downstreamLevel: 0,
    hasMudLayer: false,
    unitSystem: 'SI',
  },
  sim6: {
    id: 'sim6',
    title: 'Problema 2.66 – Força Hidrostática e Estabilidade de Barragem de Gravidade',
    subtitle: 'H = 80,00 m | BC = 60,00 m | b = 30,00 m | d_conc = 2,4 | Água 20 °C',
    enunciado:
      'A barragem ABC na Figura P2.66 tem 30 m de largura e é feita em concreto (d = 2,4). Calcule a força hidrostática sobre a superfície AB e seu momento em C. Considerando que não haja percolação de água por baixo da barragem, essa força poderia tombar a barragem? Qual é o seu momento se houver percolação por baixo da barragem?',
    damType: TipoBarragem.GRAVIDADE,
    damHeight: 80,
    damBaseWidth: 60,
    damCrestWidth: 0,
    damWidth: 30,
    concreteSpecificGravity: 2.4,
    fluidKey: 'agua20C',
    inclinationAngle: 53.13010235,
    upstreamLevel: 80,
    hasDownstream: false,
    downstreamLevel: 0,
    hasMudLayer: false,
    hasPercolation: false,
    upliftFactorUp: 1.0,
    upliftFactorDown: 0.0,
    showTriangularMode: true,
    unitSystem: 'SI',
  },
};
