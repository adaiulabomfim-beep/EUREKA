import { TipoBarragem } from './tipos';

export interface DamPreset {
  title: string;
  subtitle: string;
  damType: TipoBarragem;
  damHeight: number;
  damBaseWidth: number;
  damCrestWidth: number;
  inclinationAngle: number;
  buttressAngle?: number;
  archRadius?: number;
  upstreamLevel: number;
  hasDownstream: boolean;
  downstreamLevel: number;
}

export const DAM_PRESETS: { [key: string]: DamPreset } = {
  gravidadePadrao: {
    title: "Barragem de Gravidade",
    subtitle: "Perfil Clássico",
    damType: TipoBarragem.GRAVIDADE,
    damHeight: 20,
    damBaseWidth: 16,
    damCrestWidth: 4,
    inclinationAngle: 90,
    upstreamLevel: 18,
    hasDownstream: false,
    downstreamLevel: 0,
  },
  enrocamentoInclinada: {
    title: "Terra / Enrocamento",
    subtitle: "Talude 1:2",
    damType: TipoBarragem.TERRA_ENROCAMENTO,
    damHeight: 15,
    damBaseWidth: 45,
    damCrestWidth: 6,
    inclinationAngle: 26.5,
    upstreamLevel: 12,
    hasDownstream: true,
    downstreamLevel: 3,
  },
  contraforteExercicio: {
    title: "Contraforte",
    subtitle: "Exercício de Estabilidade",
    damType: TipoBarragem.CONTRAFORTE,
    damHeight: 25,
    damBaseWidth: 22,
    damCrestWidth: 2,
    inclinationAngle: 70,
    buttressAngle: 60,
    upstreamLevel: 22,
    hasDownstream: false,
    downstreamLevel: 0,
  },
  arcoSimetrico: {
    title: "Barragem em Arco",
    subtitle: "Vale Estreito",
    damType: TipoBarragem.ARCO,
    damHeight: 30,
    damBaseWidth: 6,
    damCrestWidth: 3,
    inclinationAngle: 90,
    archRadius: 50,
    upstreamLevel: 28,
    hasDownstream: false,
    downstreamLevel: 0,
  }
};
