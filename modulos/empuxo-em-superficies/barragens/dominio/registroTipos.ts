import { TipoBarragem } from './tipos';
import { ConfiguracaoSimulacaoBarragem, ResultadoSimulacaoBarragem } from './tipos';

import { Vista2D as Vista2DGravidade } from '../tipos/gravidade/Vista2D';
import { Vista3D as Vista3DGravidade } from '../tipos/gravidade/Vista3D';
import { simular as simularGravidade } from '../tipos/gravidade/calculos';

import { Vista2D as Vista2DTerraEnrocamento } from '../tipos/terra-enrocamento/Vista2D';
import { Vista3D as Vista3DTerraEnrocamento } from '../tipos/terra-enrocamento/Vista3D';
import { simular as simularTerraEnrocamento } from '../tipos/terra-enrocamento/calculos';

import { Vista2D as Vista2DArco } from '../tipos/arco/Vista2D';
import { Vista3D as Vista3DArco } from '../tipos/arco/Vista3D';
import { simular as simularArco } from '../tipos/arco/calculos';

import { Vista2D as Vista2DContraforte } from '../tipos/contraforte/Vista2D';
import { Vista3D as Vista3DContraforte } from '../tipos/contraforte/Vista3D';
import { simular as simularContraforte } from '../tipos/contraforte/calculos';

export interface RegistroTipoBarragem {
  label: string;
  simulate: (config: ConfiguracaoSimulacaoBarragem) => ResultadoSimulacaoBarragem;
  component2D: React.FC<any>;
  component3D: React.FC<any>;
  getDefaults: (h: number) => {
    inclinationAngle: number;
    buttressAngle?: number;
    damBaseWidth: number;
    damCrestWidth: number;
  };
}

const round = (v: number) => Math.round(v * 10) / 10;

export const registroTiposBarragem: Record<TipoBarragem, RegistroTipoBarragem> = {
  [TipoBarragem.GRAVIDADE]: {
    label: 'Gravidade',
    simulate: simularGravidade,
    component2D: Vista2DGravidade,
    component3D: Vista3DGravidade,
    getDefaults: (h: number) => ({
      inclinationAngle: 90,
      damBaseWidth: round(h * 0.8),
      damCrestWidth: round(h * 0.2),
    }),
  },

  [TipoBarragem.TERRA_ENROCAMENTO]: {
    label: 'Terra / Enrocamento',
    simulate: simularTerraEnrocamento,
    component2D: Vista2DTerraEnrocamento,
    component3D: Vista3DTerraEnrocamento,
    getDefaults: (h: number) => ({
      inclinationAngle: 25,
      damBaseWidth: round(h * 3),
      damCrestWidth: round(h * 0.4),
    }),
  },

  [TipoBarragem.ARCO]: {
    label: 'Arco',
    simulate: simularArco,
    component2D: Vista2DArco,
    component3D: Vista3DArco,
    getDefaults: (h: number) => ({
      inclinationAngle: 90,
      damBaseWidth: round(h * 0.25),
      damCrestWidth: round(h * 0.1),
    }),
  },

  [TipoBarragem.CONTRAFORTE]: {
    label: 'Contraforte',
    simulate: simularContraforte,
    component2D: Vista2DContraforte,
    component3D: Vista3DContraforte,
    getDefaults: (h: number) => ({
      inclinationAngle: 55,
      buttressAngle: 60,
      damBaseWidth: round(h * 0.8),
      damCrestWidth: round(h * 0.1),
    }),
  },
};
