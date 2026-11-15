import { ConfiguracaoSimulacaoComporta } from '../dominio/configuracao';
import { ResultadoSimulacaoComporta } from '../dominio/resultado';
import { PosicaoDobradica } from '../dominio/tipos';
import { calculateNetForce, getGateYBarTotal } from './hidrostatica';

/**
 * Resolve dinamicamente a profundidade h (medida a partir do fundo liso em B)
 * do fluido de jusante para a qual a reação normal vertical em B se anula (R_B = 0),
 * impondo ΣM_A = 0 sobre a articulação A.
 */
export function resolverProfundidadeEquilibrioRbZero(
  config: ConfiguracaoSimulacaoComporta,
  h_top_up: number,
  gammaUp: number,
  gammaDown: number,
  directY_CG_up?: number
): number {
  const { comporta, fluidoMontante } = config;
  const angulo = comporta.angulo || 90;
  const rad = (angulo * Math.PI) / 180;
  const sinTheta = Math.sin(rad);
  const cosTheta = Math.cos(rad);
  const H = Math.max(0.01, comporta.altura);
  const W_width = Math.max(0.01, comporta.largura);

  if (gammaDown <= 1e-6 || !config.fluidoJusante.ativo) {
    return 0;
  }

  // Momento atuante de montante em relação à articulação A (sentido anti-horário +)
  const upOnly = calculateNetForce(
    H,
    W_width,
    angulo,
    h_top_up,
    -1e6,
    gammaUp,
    gammaDown,
    comporta.forma,
    directY_CG_up,
    false
  );
  const M_up_A = upOnly.up.FR * upOnly.up.s_cp;

  // Momento do peso próprio em relação à articulação A (sentido anti-horário +)
  let M_W_A = 0;
  if (comporta.pesoProprioAtivo && comporta.pesoProprio > 0) {
    const g = fluidoMontante.gravidade || 9.81;
    const W_peso = comporta.pesoProprio * g;
    const y_cg_gate = getGateYBarTotal(comporta.forma, H);
    const d_W_A =
      comporta.bracoPesoHorizontal !== undefined && comporta.bracoPesoHorizontal > 0
        ? comporta.bracoPesoHorizontal
        : y_cg_gate * cosTheta;
    M_W_A = W_peso * d_W_A;
  }

  const M_target = M_up_A + M_W_A;
  if (M_target <= 0) {
    return 0;
  }

  const evalMomentDownA = (h_above_B: number) => {
    const h_top_down = h_above_B - H * sinTheta;
    const trial = calculateNetForce(
      H,
      W_width,
      angulo,
      h_top_up,
      h_top_down,
      gammaUp,
      gammaDown,
      comporta.forma,
      directY_CG_up,
      true
    );
    return trial.down.FR * trial.down.s_cp;
  };

  let lo = 0;
  let hi = Math.max(2.0, H * sinTheta + 2.0);
  while (evalMomentDownA(hi) < M_target && hi < 5000) {
    hi *= 2;
  }

  for (let i = 0; i < 80; i++) {
    const mid = 0.5 * (lo + hi);
    if (evalMomentDownA(mid) >= M_target) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return 0.5 * (lo + hi);
}

export function calcularMomentos(config: ConfiguracaoSimulacaoComporta, resultados: ResultadoSimulacaoComporta) {
  const { comporta, fluidoMontante } = config;
  const { forceData } = resultados;
  
  let M_hinge = 0;
  let F_tie = 0;
  let P_apoio = 0;
  let R_B = 0;
  let W_peso = 0;
  let M_up_A = 0;
  let M_down_A = 0;
  let M_W_A = 0;
  let d_cp_up_A = 0;
  let d_cp_down_A = 0;
  let d_W_A = 0;
  let Rx_hinge = 0;
  let Ry_hinge = 0;
  let R_hinge = 0;
  let d_cp_hinge = 0;

  const rad = ((comporta.angulo || 90) * Math.PI) / 180;
  const sinTheta = Math.sin(rad);
  const cosTheta = Math.cos(rad);
  const deltaX_BA = comporta.altura * cosTheta;
  const deltaY_BA = comporta.altura * sinTheta;
  const apoioParedeAtivo = Boolean(
    comporta.apoioParedeLisa && comporta.posicaoDobradica !== PosicaoDobradica.NONE
  );
  const apoioFundoAtivo = Boolean(
    comporta.apoioFundoLiso && comporta.posicaoDobradica === PosicaoDobradica.TOP
  );

  if (apoioFundoAtivo) {
    const g = fluidoMontante.gravidade || 9.81;
    if (comporta.pesoProprioAtivo && comporta.pesoProprio > 0) {
      W_peso = comporta.pesoProprio * g;
      const y_cg_gate = getGateYBarTotal(comporta.forma, comporta.altura);
      d_W_A =
        comporta.bracoPesoHorizontal !== undefined && comporta.bracoPesoHorizontal > 0
          ? comporta.bracoPesoHorizontal
          : y_cg_gate * cosTheta;
      M_W_A = W_peso * d_W_A;
    }

    d_cp_up_A = forceData.up.FR > 1e-9 ? forceData.up.s_cp : 0;
    d_cp_down_A = forceData.down.FR > 1e-9 ? forceData.down.s_cp : 0;
    d_cp_hinge = d_cp_up_A;
    M_up_A = forceData.up.FR * d_cp_up_A;
    M_down_A = forceData.down.FR * d_cp_down_A;

    // ΣM_A (anti-horário +): M_up_A + M_W_A - M_down_A - R_B * Δx_BA = 0
    const M_residual_A = M_up_A + M_W_A - M_down_A;
    R_B = deltaX_BA > 1e-6 ? M_residual_A / deltaX_BA : 0;
    if (Math.abs(R_B) < 1e-6) {
      R_B = 0;
    }
    M_hinge = M_residual_A;

    // Equilíbrio global de forças (+X direita, +Y cima):
    // ΣFx = 0 => Ax + F_up*sinθ - F_down*sinθ = 0 => Ax = (F_down - F_up)*sinθ
    // ΣFy = 0 => Ay - F_up*cosθ + F_down*cosθ - W + R_B = 0 => Ay = W + (F_up - F_down)*cosθ - R_B
    Rx_hinge = (forceData.down.FR - forceData.up.FR) * sinTheta;
    Ry_hinge = W_peso + (forceData.up.FR - forceData.down.FR) * cosTheta - R_B;
    R_hinge = Math.hypot(Rx_hinge, Ry_hinge);
  } else if (comporta.posicaoDobradica !== PosicaoDobradica.NONE) {
    const y_cg_gate = getGateYBarTotal(comporta.forma, comporta.altura);
    // Distance from hinge/axis to CP
    let d_cp = 0;
    if (comporta.posicaoDobradica === PosicaoDobradica.TOP) {
      d_cp = forceData.s_cp_net;
    } else if (comporta.posicaoDobradica === PosicaoDobradica.BOTTOM) {
      d_cp = comporta.altura - forceData.s_cp_net;
    } else if (comporta.posicaoDobradica === PosicaoDobradica.CENTER) {
      d_cp = Math.abs(forceData.s_cp_net - y_cg_gate);
    }
    d_cp_hinge = d_cp;

    // Moment due to hydrostatic force (positive = tending to open gate towards downstream/bottom-right)
    // Note: About TOP hinge, FR_net (>0) rotates counter-clockwise (+);
    // About BOTTOM hinge, FR_net (>0) rotates clockwise (+);
    // About CENTER horizontal axis, CP is below CG by eccentricity e = d_cp, producing a counter-clockwise hydrostatic moment.
    M_hinge = forceData.FR_net * d_cp;

    // Add moment due to gate weight if enabled
    // pesoProprio is entered in kg -> convert to Newtons (W = m * g)
    let W = 0;
    if (comporta.pesoProprioAtivo && comporta.pesoProprio > 0) {
      const g = fluidoMontante.gravidade || 9.81;
      W = comporta.pesoProprio * g;
      W_peso = W;

      // Distance from hinge to gate CG along the incline
      let d_cg = 0;
      if (comporta.posicaoDobradica === PosicaoDobradica.TOP) {
        d_cg = y_cg_gate;
      } else if (comporta.posicaoDobradica === PosicaoDobradica.BOTTOM) {
        d_cg = comporta.altura - y_cg_gate;
      } else if (comporta.posicaoDobradica === PosicaoDobradica.CENTER) {
        d_cg = 0;
      }
      
      // Component of weight perpendicular to the gate
      const signW = comporta.posicaoDobradica === PosicaoDobradica.TOP ? -1 : 1;

      if (comporta.posicaoDobradica !== PosicaoDobradica.CENTER) {
        if (comporta.bracoPesoHorizontal !== undefined && comporta.bracoPesoHorizontal > 0) {
          // Braço horizontal informado diretamente no enunciado: M = W · d_P
          M_hinge += signW * W * comporta.bracoPesoHorizontal;
        } else {
          const W_perp = W * cosTheta;
          M_hinge += signW * W_perp * d_cg;
        }
      }
    }

    // Componentes da força hidrostática resultante no plano cartesiano (+X direita, +Y cima)
    const FR_x = forceData.FR_net * sinTheta;
    const FR_y = -forceData.FR_net * cosTheta;

    if (apoioParedeAtivo && deltaY_BA > 1e-6) {
      // Parede vertical lisa à direita no ponto A: reação exclusivamente horizontal para a esquerda (-X)
      // ΣM_B = 0 ⇒ P · Δy_BA = M_hinge ⇒ P = M_hinge / (L · sen θ)
      P_apoio = M_hinge / deltaY_BA;
      // Equilíbrio de forças na comporta: ΣFx = FR_x - P + Bx = 0; ΣFy = FR_y - W + By = 0
      Rx_hinge = P_apoio - FR_x;
      Ry_hinge = -FR_y + W;
      R_hinge = Math.hypot(Rx_hinge, Ry_hinge);
    } else if (comporta.temTirante) {
      // Calculate tie rod force if present
      let d_tie = 0;
      if (comporta.posicaoDobradica === PosicaoDobradica.TOP) {
        d_tie = comporta.altura * comporta.posicaoTiranteRelativa;
      } else if (comporta.posicaoDobradica === PosicaoDobradica.BOTTOM) {
        d_tie = comporta.altura * (1 - comporta.posicaoTiranteRelativa);
      } else if (comporta.posicaoDobradica === PosicaoDobradica.CENTER) {
        d_tie = Math.abs(comporta.altura * comporta.posicaoTiranteRelativa - y_cg_gate);
      }

      const tieRad = (comporta.anguloTirante * Math.PI) / 180;
      const alpha = Math.abs(rad - tieRad);
      const sinAlpha = Math.abs(Math.sin(alpha));
      
      // F_tie * sin(alpha) * d_tie = M_hinge
      if (d_tie > 1e-6 && sinAlpha > 1e-6) {
        F_tie = M_hinge / (d_tie * sinAlpha);
      }

      // Estimativa das reações na articulação considerando força restauradora do tirante
      Rx_hinge = -FR_x + F_tie * Math.cos(tieRad);
      Ry_hinge = -FR_y + W - F_tie * Math.sin(tieRad);
      R_hinge = Math.hypot(Rx_hinge, Ry_hinge);
    } else {
      Rx_hinge = -FR_x;
      Ry_hinge = -FR_y + W;
      R_hinge = Math.hypot(Rx_hinge, Ry_hinge);
    }
  }

  const y_cg_gate_ref = getGateYBarTotal(comporta.forma, comporta.altura);
  const eixoCentralAtivo = Boolean(
    comporta.posicaoDobradica === PosicaoDobradica.CENTER || comporta.eixoRotacaoCentral
  );
  const excentricidadeEixo = eixoCentralAtivo
    ? Math.abs(forceData.s_cp_net - y_cg_gate_ref)
    : 0;
  const M_hidrostatico_eixo = eixoCentralAtivo
    ? forceData.FR_net * excentricidadeEixo
    : 0;
  const M_abertura_eixo = M_hidrostatico_eixo;
  const sentidoMomentoHidrostatico =
    'Anti-horário (CP abaixo do eixo central, tendendo a girar a metade inferior para jusante)';
  const sentidoMomentoAbertura =
    'Horário (contrário ao momento hidrostático resistente)';

  return {
    M_hinge,
    F_tie,
    apoioParedeAtivo,
    apoioFundoAtivo,
    resolverProfundidadeRbZero: Boolean(apoioFundoAtivo && comporta.resolverProfundidadeRbZero),
    P_apoio,
    R_B,
    W_peso,
    M_up_A,
    M_down_A,
    M_W_A,
    d_cp_up_A,
    d_cp_down_A,
    d_W_A,
    Rx_hinge,
    Ry_hinge,
    R_hinge,
    d_cp_hinge,
    deltaX_BA,
    deltaY_BA,
    eixoCentralAtivo,
    articulacaoParedeVerticalA: Boolean(comporta.articulacaoParedeVerticalA),
    excentricidadeEixo,
    M_hidrostatico_eixo,
    M_abertura_eixo,
    sentidoMomentoHidrostatico,
    sentidoMomentoAbertura,
  };
}
