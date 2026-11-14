import { FormaComporta, PosicaoDobradica, ModoPosicionamentoComporta, SistemaUnidades } from './tipos';

export interface ConfiguracaoFluido {
  chave: string;           // key em FLUIDOS_PREDEFINIDOS ('agua', 'glicerina', etc.)
  nivel: number;           // nível de água (m)
  densidade: number;       // kg/m³ (pode ser editado manualmente)
  gravidade: number;
  pesoEspecifico?: number; // N/m³ explícito quando informado diretamente (ex.: 10054 N/m³)
}

export interface ConfiguracaoSimulacaoComporta {
  sistemaUnidades?: SistemaUnidades;
  fluidoMontante: ConfiguracaoFluido;
  fluidoJusante: ConfiguracaoFluido & { ativo: boolean };
  comporta: {
    ativa: boolean;
    aberturaPercent?: number; // 0 = Fechada, 1..99 = Parcialmente aberta, 100 = Aberta
    forma: FormaComporta;
    largura: number;
    altura: number;
    profundidadeTopo: number; // h1: profundidade vertical do topo (m)
    modoPosicionamento?: ModoPosicionamentoComporta;
    y_cg_direto?: number;     // Y_CG direto da NA ao longo da superfície (m)
    angulo?: number;
    posicaoDobradica: PosicaoDobradica;
    temTirante: boolean;
    /** Apoio em parede vertical lisa no topo (A) com reação exclusivamente horizontal. */
    apoioParedeLisa?: boolean;
    /** Apoio sobre fundo horizontal liso na base (B) com reação exclusivamente vertical (R_B) e articulação em A. */
    apoioFundoLiso?: boolean;
    /** Quando ativo com apoioFundoLiso, calcula automaticamente a profundidade h de jusante para a qual R_B = 0. */
    resolverProfundidadeRbZero?: boolean;
    posicaoTiranteRelativa: number;
    anguloTirante: number;
    pesoProprio: number;
    pesoProprioAtivo: boolean;
    /** Braço horizontal (m) do peso próprio até a articulação. Se definido, M_peso = W · braço. */
    bracoPesoHorizontal?: number;
  };
}

/** Helper para criar config de fluido padrão (Água) */
export const criarFluidoPadrao = (nivel: number = 12): ConfiguracaoFluido => ({
  chave: 'agua',
  nivel,
  densidade: 1000,
  gravidade: 9.81,
});
