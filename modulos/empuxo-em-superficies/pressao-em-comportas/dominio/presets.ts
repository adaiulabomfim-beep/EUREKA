import { TipoBarragem, FormaComporta, PosicaoDobradica } from './tipos';
import { ConfiguracaoSimulacaoComporta } from './configuracao';

export const PRESETS: { [key: string]: ConfiguracaoSimulacaoComporta } = {
  exercise30: {
    barragem: {
      tipo: TipoBarragem.GRAVIDADE,
      altura: 15,
      larguraBase: 12,
      larguraCrista: 4,
      anguloInclinacao: 90,
    },
    fluido: {
      nivelMontante: 12,
      nivelJusante: 0,
      densidade: 1000,
      gravidade: 9.81,
    },
    comporta: {
      ativa: true,
      forma: FormaComporta.RETANGULAR,
      largura: 2,
      altura: 3,
      profundidadeCrista: 4,
      inclinacao: 90,
      posicaoDobradica: PosicaoDobradica.TOP,
      temTirante: true,
      posicaoTiranteRelativa: 1,
      anguloTirante: 0,
      pesoProprio: 500,
      pesoProprioAtivo: false,
    }
  }
};

