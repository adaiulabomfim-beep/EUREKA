import { TipoBarragem, FormaComporta, PosicaoDobradica } from './tipos';
import { ConfiguracaoSimulacaoComporta } from './configuracao';

export const PRESETS: { [key: string]: ConfiguracaoSimulacaoComporta & { title: string, subtitle: string } } = {
  exercise30: {
    title: "Exercício 30º",
    subtitle: "Comporta Articulada",
    barragem: {
      tipo: TipoBarragem.GRAVIDADE,
      altura: 15,
      larguraBase: 6,
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
  },
  comportaCircular: {
    title: "Comporta Circular",
    subtitle: "Fundo de Reservatório",
    barragem: {
      tipo: TipoBarragem.TERRA_ENROCAMENTO,
      altura: 20,
      larguraBase: 60,
      larguraCrista: 6,
      anguloInclinacao: 45,
    },
    fluido: {
      nivelMontante: 18,
      nivelJusante: 0,
      densidade: 1000,
      gravidade: 9.81,
    },
    comporta: {
      ativa: true,
      forma: FormaComporta.CIRCULAR,
      largura: 2,
      altura: 2,
      profundidadeCrista: 15,
      inclinacao: 45,
      posicaoDobradica: PosicaoDobradica.NONE,
      temTirante: false,
      posicaoTiranteRelativa: 1,
      anguloTirante: 0,
      pesoProprio: 0,
      pesoProprioAtivo: false,
    }
  },
  comportaInclinada: {
    title: "Comporta Inclinada",
    subtitle: "Barragem de Contraforte",
    barragem: {
      tipo: TipoBarragem.CONTRAFORTE,
      altura: 25,
      larguraBase: 20,
      larguraCrista: 3,
      anguloInclinacao: 60,
      buttressAngle: 60,
    },
    fluido: {
      nivelMontante: 22,
      nivelJusante: 5,
      densidade: 1000,
      gravidade: 9.81,
    },
    comporta: {
      ativa: true,
      forma: FormaComporta.RETANGULAR,
      largura: 4,
      altura: 5,
      profundidadeCrista: 10,
      inclinacao: 60,
      posicaoDobradica: PosicaoDobradica.BOTTOM,
      temTirante: true,
      posicaoTiranteRelativa: 0,
      anguloTirante: 30,
      pesoProprio: 2000,
      pesoProprioAtivo: true,
    }
  }
};

