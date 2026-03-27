import { TipoBarragem, FormaComporta, PosicaoDobradica } from './tipos';

export interface ConfiguracaoSimulacaoComporta {
  barragem: {
    tipo: TipoBarragem;
    altura: number;
    larguraBase: number;
    larguraCrista: number;
    anguloInclinacao: number;
    buttressAngle?: number;
  };
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
    profundidadeCrista: number;
    inclinacao: number;
    posicaoDobradica: PosicaoDobradica;
    temTirante: boolean;
    posicaoTiranteRelativa: number;
    anguloTirante: number;
    pesoProprio: number;
    pesoProprioAtivo: boolean;
  };
}
