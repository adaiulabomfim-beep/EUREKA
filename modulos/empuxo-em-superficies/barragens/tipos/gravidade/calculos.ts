import { ConfiguracaoSimulacaoBarragem } from '../../dominio/tipos';
import { ResultadoSimulacaoBarragem } from '../../dominio/tipos';
import { TipoBarragem } from '../../dominio/tipos';
import { construirGeometria } from './geometria';
import { calculateNetForce, calculateSurface } from '../../calculos/hidrostaticaSuperficieInclinada';

export const calcularHidrostatica = (
  damHeight: number,
  inclinationAngle: number,
  upstreamLevel: number,
  downstreamLevel: number,
  gamma: number
) => {
  const netForce = calculateNetForce(damHeight, inclinationAngle, upstreamLevel, downstreamLevel, gamma);
  const up = calculateSurface(damHeight, inclinationAngle, upstreamLevel, gamma);
  
  const p_max_up = gamma * Math.min(upstreamLevel, damHeight);
  const p_max_down = gamma * Math.min(downstreamLevel, damHeight);

  return {
    ...netForce,
    p_max_up,
    p_max_down,
  };
};

export const calcularEstabilidade = (
  damHeight: number,
  damBaseWidth: number,
  damCrestWidth: number,
  upstreamLevel: number,
  downstreamLevel: number,
  FR_net: number,
  y_cp_net: number,
  gammaConcrete: number = 24000
) => {
  const area = ((damBaseWidth + damCrestWidth) / 2) * damHeight;
  const weight = area * gammaConcrete;
  const y_cg = (damHeight / 3) * ((damBaseWidth + 2 * damCrestWidth) / (damBaseWidth + damCrestWidth));
  const x_cg = 0;
  const arm_weight = (damBaseWidth / 2) - x_cg;
  const moment_resisting = weight * arm_weight;
  const moment_overturning = FR_net * y_cp_net;
  const fs_tomb = moment_resisting / Math.max(1e-9, moment_overturning);
  const mu = 0.7;
  const fs_desl = (mu * weight) / Math.max(1e-9, FR_net);
  const e = (moment_overturning - moment_resisting) / weight;
  
  return {
    area,
    weight,
    x_cg,
    y_cg,
    moment_resisting,
    moment_overturning,
    fs_tomb,
    fs_desl,
    e
  };
};

export const simular = (config: ConfiguracaoSimulacaoBarragem): ResultadoSimulacaoBarragem => {
  const {
    damHeight,
    damBaseWidth,
    damCrestWidth,
    inclinationAngle,
    upstreamLevel,
    downstreamLevel,
    density,
    gravity
  } = config;

  const gamma = density * gravity;

  const profile = construirGeometria(damHeight, damBaseWidth, damCrestWidth, inclinationAngle).profile;

  const forceData = calcularHidrostatica(
    damHeight,
    inclinationAngle,
    upstreamLevel,
    downstreamLevel,
    gamma
  );

  const stabilityData = calcularEstabilidade(
    damHeight,
    damBaseWidth,
    damCrestWidth,
    upstreamLevel,
    downstreamLevel,
    forceData.FR_net,
    forceData.y_cp_net
  );

  return {
    damType: TipoBarragem.GRAVIDADE,
    normalizedInputs: { ...config },
    forceData,
    stabilityData,
    geometryModel: {
      profile,
      damHeight,
      damBaseWidth,
      damCrestWidth,
      inclinationAngle
    },
    annotationModel: {},
    warnings: []
  };
};
