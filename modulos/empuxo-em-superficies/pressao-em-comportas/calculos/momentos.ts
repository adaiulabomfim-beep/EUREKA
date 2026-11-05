import { ConfiguracaoSimulacaoComporta } from '../dominio/configuracao';
import { ResultadoSimulacaoComporta } from '../dominio/resultado';
import { PosicaoDobradica } from '../dominio/tipos';
import { getGateYBarTotal } from './hidrostatica';

export function calcularMomentos(config: ConfiguracaoSimulacaoComporta, resultados: ResultadoSimulacaoComporta) {
  const { comporta, fluidoMontante } = config;
  const { forceData } = resultados;
  
  let M_hinge = 0;
  let F_tie = 0;

  if (comporta.posicaoDobradica !== PosicaoDobradica.NONE) {
    // Distance from hinge to CP
    let d_cp = 0;
    if (comporta.posicaoDobradica === PosicaoDobradica.TOP) {
      d_cp = forceData.s_cp_net;
    } else if (comporta.posicaoDobradica === PosicaoDobradica.BOTTOM) {
      d_cp = comporta.altura - forceData.s_cp_net;
    }

    // Moment due to hydrostatic force (positive = tending to open gate towards downstream/bottom-right)
    // Note: About TOP hinge, FR_net (>0) rotates counter-clockwise (+);
    // About BOTTOM hinge, FR_net (>0) rotates clockwise (+).
    M_hinge = forceData.FR_net * d_cp;

    // Add moment due to gate weight if enabled
    // pesoProprio is entered in kg -> convert to Newtons (W = m * g)
    if (comporta.pesoProprioAtivo && comporta.pesoProprio > 0) {
      const g = fluidoMontante.gravidade || 9.81;
      const W = comporta.pesoProprio * g;
      const y_cg_gate = getGateYBarTotal(comporta.forma, comporta.altura);

      // Distance from hinge to gate CG along the incline
      let d_cg = 0;
      if (comporta.posicaoDobradica === PosicaoDobradica.TOP) {
        d_cg = y_cg_gate;
      } else if (comporta.posicaoDobradica === PosicaoDobradica.BOTTOM) {
        d_cg = comporta.altura - y_cg_gate;
      }
      
      // Component of weight perpendicular to the gate
      // For a gate where water is above/left and normal points down-right, W_perp acts in the same normal direction (+cos(theta))
      // When hinged at TOP, gravity pulls the gate down (tending to close against a bottom seat or add to normal rotation);
      // In textbook convention where TOP-hinged gate opens outwards to the right (water on left pushing right),
      // gravity pulls vertically down, producing a restoring (closing, -) moment about TOP hinge and an opening (+) moment about BOTTOM hinge!
      const rad = ((comporta.angulo || 90) * Math.PI) / 180;
      const W_perp = W * Math.cos(rad);
      const signW = comporta.posicaoDobradica === PosicaoDobradica.TOP ? -1 : 1;
      
      M_hinge += signW * W_perp * d_cg;
    }

    // Calculate tie rod force if present
    if (comporta.temTirante) {
      // Distance from hinge to tie rod attachment point
      let d_tie = 0;
      if (comporta.posicaoDobradica === PosicaoDobradica.TOP) {
        d_tie = comporta.altura * comporta.posicaoTiranteRelativa;
      } else if (comporta.posicaoDobradica === PosicaoDobradica.BOTTOM) {
        d_tie = comporta.altura * (1 - comporta.posicaoTiranteRelativa);
      }

      // Component of tie rod force perpendicular to the gate
      // Assuming tieRodAngle is relative to the horizontal
      const gateRad = ((comporta.angulo || 90) * Math.PI) / 180;
      const tieRad = (comporta.anguloTirante * Math.PI) / 180;
      
      // Angle between tie rod and gate
      const alpha = Math.abs(gateRad - tieRad);
      const sinAlpha = Math.abs(Math.sin(alpha));
      
      // F_tie * sin(alpha) * d_tie = M_hinge
      if (d_tie > 1e-6 && sinAlpha > 1e-6) {
        F_tie = M_hinge / (d_tie * sinAlpha);
      }
    }
  }

  return {
    M_hinge,
    F_tie
  };
}
