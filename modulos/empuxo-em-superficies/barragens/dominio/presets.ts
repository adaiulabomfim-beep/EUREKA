import { ConfiguracaoSimulacaoBarragem } from '../dominio/tipos';
import { TipoBarragem } from '../dominio/tipos';

export const PRESETS: Record<string, ConfiguracaoSimulacaoBarragem> = {
  default: {
    damType: TipoBarragem.GRAVIDADE,
    damHeight: 15,
    damBaseWidth: 12,
    damCrestWidth: 4,
    inclinationAngle: 90,
    upstreamLevel: 12,
    downstreamLevel: 0,
    density: 1000,
    gravity: 9.81,
  },
  exercise30: {
    damType: TipoBarragem.TERRA_ENROCAMENTO,
    damHeight: 10,
    damBaseWidth: 20,
    damCrestWidth: 4,
    inclinationAngle: 30,
    upstreamLevel: 8,
    downstreamLevel: 0,
    density: 1000,
    gravity: 9.81,
  }
};
