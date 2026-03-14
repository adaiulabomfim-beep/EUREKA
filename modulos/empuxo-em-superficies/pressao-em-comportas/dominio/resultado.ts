export interface ResultadoSimulacaoComporta {
  forceData: {
    FR_net: number;
    s_cp_net: number;
    up: { area: number; wetLength: number; h_cg: number; FR: number; s_cg: number; s_cp: number; h_cp: number };
    down: { area: number; wetLength: number; h_cg: number; FR: number; s_cg: number; s_cp: number; h_cp: number };
  };
  equilibrium: {
    M_hinge: number;
    F_tie: number;
  };
}
