import { SistemaUnidades, ModoPosicionamentoComporta } from './tipos';

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
  };
}
