import { FormaComporta, PosicaoDobradica } from './tipos';

export interface ConfiguracaoFluido {
  chave: string;           // key em FLUIDOS_PREDEFINIDOS ('agua', 'glicerina', etc.)
  nivel: number;           // nível de água (m)
  densidade: number;       // kg/m³ (pode ser editado manualmente)
  gravidade: number;
}

export interface ConfiguracaoSimulacaoComporta {
  fluidoMontante: ConfiguracaoFluido;
  fluidoJusante: ConfiguracaoFluido & { ativo: boolean };
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

/** Helper para criar config de fluido padrão (Água) */
export const criarFluidoPadrao = (nivel: number = 12): ConfiguracaoFluido => ({
  chave: 'agua',
  nivel,
  densidade: 1000,
  gravidade: 9.81,
});
