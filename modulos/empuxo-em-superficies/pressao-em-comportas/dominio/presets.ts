import { FormaComporta, PosicaoDobradica } from './tipos';
import { ConfiguracaoSimulacaoComporta } from './configuracao';

export const PRESETS: { [key: string]: ConfiguracaoSimulacaoComporta & { title: string, subtitle: string } } = {
  exercise30: {
    title: "Exercício 30º",
    subtitle: "Comporta Articulada",
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
      profundidadeTopo: 4,
      angulo: 90,
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
      profundidadeTopo: 15,
      angulo: 45,
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
      profundidadeTopo: 10,
      angulo: 60,
      posicaoDobradica: PosicaoDobradica.BOTTOM,
      temTirante: true,
      posicaoTiranteRelativa: 0,
      anguloTirante: 30,
      pesoProprio: 2000,
      pesoProprioAtivo: true,
    }
  },
  exercicio17: {
    title: "Exercício 17",
    subtitle: "Comporta Retangular Articulada",
    fluido: {
      nivelMontante: 8,
      nivelJusante: 0,
      densidade: 1000,
      gravidade: 9.81,
    },
    comporta: {
      ativa: true,
      forma: FormaComporta.RETANGULAR,
      largura: 3,
      altura: 4,
      profundidadeTopo: 4,
      angulo: 90,
      posicaoDobradica: PosicaoDobradica.TOP,
      temTirante: false,
      posicaoTiranteRelativa: 1,
      anguloTirante: 0,
      pesoProprio: 1000,
      pesoProprioAtivo: true,
    }
  },
  exercicio22: {
    title: "Exercício 22",
    subtitle: "Comporta Circular de Fundo",
    fluido: {
      nivelMontante: 15,
      nivelJusante: 2,
      densidade: 1000,
      gravidade: 9.81,
    },
    comporta: {
      ativa: true,
      forma: FormaComporta.CIRCULAR,
      largura: 2,
      altura: 2,
      profundidadeTopo: 13,
      angulo: 90,
      posicaoDobradica: PosicaoDobradica.NONE,
      temTirante: false,
      posicaoTiranteRelativa: 1,
      anguloTirante: 0,
      pesoProprio: 0,
      pesoProprioAtivo: false,
    }
  }
};

