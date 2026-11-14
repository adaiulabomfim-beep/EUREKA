import { SistemaUnidades, ModoPosicionamentoComporta, EstadoOperacionalComporta } from './tipos';

export interface HydroSideData {
  area: number;
  wetLength: number;
  h_cg: number;
  FR: number;
  s_cg: number;
  s_cp: number;
  h_cp: number;
  Y_CG?: number;
  Y_CP?: number;
  delta_y?: number;
  Ixx?: number;
  p_top?: number;
  p_bot?: number;
  p_cg?: number;
}

export interface CondicaoOperacionalResultado {
  estado: EstadoOperacionalComporta;
  estadoLabel: string;
  grauAberturaPercent: number;
  alturaAberturaInclinada: number;
  alturaLivreVertical: number;
  areaAberturaLivre: number;
  areaBloqueada: number;
  passagemAgua: boolean;
  condicaoPassagem: string;
  sentidoEscoamento: string;
  interpretacaoAutomatica: string;
}

export interface ComportamentoHidraulicoResultado {
  alturaAbertura: number;
  alturaAberturaInclinada: number;
  areaLivrePassagem: number;
  diferencaNivel: number;
  nivelMontante: number;
  nivelJusanteEfetivo: number;
  jusanteAtiva: boolean;
  regimeQualitativo: string;
  descricaoHidraulica: string;
  calculaVazao: boolean;
}

export interface ResultadoSimulacaoComporta {
  sistemaUnidades?: SistemaUnidades;
  modoPosicionamento?: ModoPosicionamentoComporta;
  gammaUp?: number;
  gammaDown?: number;
  densityUp?: number;
  densityDown?: number;
  h_top_up?: number;
  Y_CG_up?: number;
  forceData: {
    FR_net: number;
    s_cp_net: number;
    up: HydroSideData;
    down: HydroSideData;
  };
  equilibrium: {
    M_hinge: number;
    F_tie: number;
    apoioParedeAtivo?: boolean;
    apoioFundoAtivo?: boolean;
    resolverProfundidadeRbZero?: boolean;
    P_apoio?: number;
    R_B?: number;
    W_peso?: number;
    h_jusante_eq?: number;
    M_up_A?: number;
    M_down_A?: number;
    M_W_A?: number;
    d_cp_up_A?: number;
    d_cp_down_A?: number;
    d_W_A?: number;
    Rx_hinge?: number;
    Ry_hinge?: number;
    R_hinge?: number;
    deltaX_BA?: number;
    deltaY_BA?: number;
    eixoCentralAtivo?: boolean;
    articulacaoParedeVerticalA?: boolean;
    excentricidadeEixo?: number;
    M_hidrostatico_eixo?: number;
    M_abertura_eixo?: number;
    sentidoMomentoHidrostatico?: string;
    sentidoMomentoAbertura?: string;
  };
  operacao?: CondicaoOperacionalResultado;
  hidraulica?: ComportamentoHidraulicoResultado;
}
