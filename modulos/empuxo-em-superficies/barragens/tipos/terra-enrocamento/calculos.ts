import { ConfiguracaoSimulacaoBarragem } from '../../dominio/tipos';
import { ResultadoSimulacaoBarragem } from '../../dominio/tipos';
import { TipoBarragem } from '../../dominio/tipos';
import { construirGeometria } from './geometria';
import { calculateNetForce } from '../../calculos/hidrostaticaSuperficieInclinada';

export const calcularHidrostatica = (
  damHeight: number,
  inclinationAngle: number,
  upstreamLevel: number,
  downstreamLevel: number,
  gamma: number
) => {
  return calculateNetForce(damHeight, inclinationAngle, upstreamLevel, downstreamLevel, gamma);
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

  const profile = construirGeometria(damHeight, damBaseWidth, damCrestWidth, inclinationAngle);

  const forceData = calcularHidrostatica(
    damHeight,
    inclinationAngle,
    upstreamLevel,
    downstreamLevel,
    gamma
  );

  return {
    damType: TipoBarragem.TERRA_ENROCAMENTO,
    normalizedInputs: { ...config },
    forceData,
    stabilityData: null,
    geometryModel: {
      profile: profile.profile,
      damHeight,
      damBaseWidth,
      damCrestWidth,
      inclinationAngle
    },
    annotationModel: {},
    warnings: []
  };
};
