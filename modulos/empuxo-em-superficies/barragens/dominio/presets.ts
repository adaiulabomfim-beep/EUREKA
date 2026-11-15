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
    title: 'Simulação 1 – Força Hidrostática e Estabilidade de Barragem de Gravidade (White – Problema 2.66)',
    subtitle: 'H = 80,00 m | BC = 60,00 m | AB = 100,00 m (53,13°) | b = 30,00 m | d = 2,40 | Água 20 °C (γ = 9.790 N/m³)',
    enunciado:
      'A barragem ABC na Figura P2.66 tem 30 m de largura e é feita em concreto (d = 2,4). Calcule a força hidrostática sobre a superfície AB e seu momento em C. Considerando que não haja percolação de água por baixo da barragem, essa força poderia tombar a barragem? Qual é o seu momento se houver percolação por baixo da barragem?',
    damType: TipoBarragem.GRAVIDADE,
    damHeight: 80,
    damBaseWidth: 60,
    damCrestWidth: 0,
    damWidth: 30,
    concreteSpecificGravity: 2.4,
    fluidKey: 'agua20C',
    inclinationAngle: 53.13010235415598,
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
  sim2: {
    id: 'sim2',
    title: 'Simulação 2 – Força Hidrostática em Barragem de Terra e Enrocamento (IFBA – Questão 18)',
    subtitle: 'H = 9,00 m | θ = 40° (50° com a vertical) | w = 1,00 m | Água',
    enunciado:
      'Uma barragem de terra e enrocamento é projetada para uma lâmina d\'água máxima de 9 m. Considerando a seção transversal mostrada na figura, pede-se determinar: a) O esforço exercido pela água armazenada por unidade de largura na barragem. b) A distância seguindo a inclinação de montante (yp) e a profundidade (hp) do ponto de aplicação do esforço calculado no item anterior.',
    damType: TipoBarragem.TERRA_ENROCAMENTO,
    damHeight: 9,
    damBaseWidth: 30,
    damCrestWidth: 3,
    inclinationAngle: 40,
    downstreamAngle: 30,
    upstreamLevel: 9,
    hasDownstream: false,
    downstreamLevel: 0,
    hasMudLayer: false,
    damWidth: 1.0,
    unitSystem: 'SI',
  },
  sim3: {
    id: 'sim3',
    title: 'Simulação 3 – Empuxo em Barragem com Camada de Lama (ESALQ)',
    subtitle: 'H = 9,00 m (6m Água + 3m Lama d = 1,5) | Paramento Vertical | w = 1,00 m',
    enunciado:
      'Calcular o empuxo sobre o paramento vertical de uma barragem. Sendo 9 m a altura total da água, porém havendo no fundo uma camada de lama, com densidade de 1,5 e 3 m de altura, como mostra a figura.',
    damType: TipoBarragem.GRAVIDADE,
    damHeight: 9,
    damBaseWidth: 8,
    damCrestWidth: 2,
    inclinationAngle: 90,
    upstreamLevel: 9,
    hasDownstream: false,
    downstreamLevel: 0,
    hasMudLayer: true,
    mudHeight: 3,
    mudDensity: 1500,
    damWidth: 1.0,
    unitSystem: 'TECNICO_KGF',
  },
  sim4: {
    id: 'sim4',
    title: 'Simulação 4 – Empuxo de Montante e Jusante em Barragem Trapezoidal (ESALQ)',
    subtitle: 'H_mont = 2,00 m (θ = 60° ou 30° com vertical) | H_jus = 5,00 m (vertical) | w = 1,00 m',
    enunciado:
      'Dada uma barragem de perfil trapezoidal esquematizada abaixo, calcular: a) O empuxo de montante em kgf/m linear; b) O empuxo de jusante em kgf/m linear.',
    damType: TipoBarragem.GRAVIDADE,
    damHeight: 6,
    damBaseWidth: 6,
    damCrestWidth: 2,
    inclinationAngle: 60,
    upstreamLevel: 2,
    hasDownstream: true,
    downstreamLevel: 5,
    hasMudLayer: false,
    damWidth: 1.0,
    unitSystem: 'TECNICO_KGF',
  },
  sim5: {
    id: 'sim5',
    title: 'Simulação 5 – Barragem em Arco (Vale Estreito)',
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
};
