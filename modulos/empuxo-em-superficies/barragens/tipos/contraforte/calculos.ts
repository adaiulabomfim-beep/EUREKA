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
    buttressAngle = 45,
    upstreamLevel,
    downstreamLevel,
    density,
    gravity
  } = config;

  const gamma = density * gravity;

  const { wallProfile, buttressProfile2D, buttressProfile3D, actualBaseWidth } = construirGeometria(damHeight, damBaseWidth, damCrestWidth, inclinationAngle, buttressAngle);

  const forceData = calcularHidrostatica(
    damHeight,
    inclinationAngle,
    upstreamLevel,
    downstreamLevel,
    gamma
  );

  return {
    damType: TipoBarragem.CONTRAFORTE,
    normalizedInputs: { ...config },
    forceData,
    stabilityData: null,
    geometryModel: {
      profile: [...wallProfile, ...buttressProfile2D],
      wallProfile,
      buttressProfile: buttressProfile3D,
      buttressProfile2D,
      actualBaseWidth,
      damHeight,
      damBaseWidth,
      damCrestWidth,
      inclinationAngle,
      buttressAngle
    },
    annotationModel: {},
    warnings: []
  };
};
