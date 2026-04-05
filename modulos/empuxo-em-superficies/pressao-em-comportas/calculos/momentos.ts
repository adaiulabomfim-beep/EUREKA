import { ConfiguracaoSimulacaoComporta } from '../dominio/configuracao';
import { ResultadoSimulacaoComporta } from '../dominio/resultado';
import { PosicaoDobradica } from '../dominio/tipos';

export function calcularMomentos(config: ConfiguracaoSimulacaoComporta, resultados: ResultadoSimulacaoComporta) {
  const { comporta } = config;
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

    // Moment due to hydrostatic force
    M_hinge = forceData.FR_net * d_cp;

    // Add moment due to gate weight if enabled
    if (comporta.pesoProprioAtivo) {
      const W = comporta.pesoProprio;
      // Distance from hinge to CG (assuming uniform gate)
      let d_cg = 0;
      if (comporta.posicaoDobradica === PosicaoDobradica.TOP) {
        d_cg = comporta.altura / 2;
      } else if (comporta.posicaoDobradica === PosicaoDobradica.BOTTOM) {
        d_cg = comporta.altura / 2;
      }
      
      // Component of weight perpendicular to the gate
      const rad = ((comporta.angulo || 90) * Math.PI) / 180;
      const W_perp = W * Math.cos(rad);
      
      M_hinge += W_perp * d_cg;
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
      
      // F_tie * sin(alpha) * d_tie = M_hinge
      if (d_tie > 0 && Math.sin(alpha) !== 0) {
        F_tie = M_hinge / (d_tie * Math.sin(alpha));
      }
    }
  }

  return {
    M_hinge,
    F_tie
  };
}
