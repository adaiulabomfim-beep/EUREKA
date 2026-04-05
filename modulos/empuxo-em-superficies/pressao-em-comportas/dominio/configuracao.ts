import { FormaComporta, PosicaoDobradica } from './tipos';

export interface ConfiguracaoSimulacaoComporta {
  fluido: {
    nivelMontante: number;
    nivelJusante: number;
    densidade: number;
    gravidade: number;
  };
  comporta: {
    ativa: boolean;
    forma: FormaComporta;
    largura: number;
    altura: number;
    profundidadeTopo: number;
    angulo?: number;
    posicaoDobradica: PosicaoDobradica;
    temTirante: boolean;
    posicaoTiranteRelativa: number;
    anguloTirante: number;
    pesoProprio: number;
    pesoProprioAtivo: boolean;
  };
}
