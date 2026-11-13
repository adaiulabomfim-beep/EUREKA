import { ConfiguracaoSimulacaoBarragem, ResultadoSimulacaoBarragem, TipoBarragem } from '../../dominio/tipos';
import { construirGeometria } from './geometria';
import {
  calculateNetForce,
  calcularEstabilidadeBarragem,
  extrairOpcoesLama,
  obterAnguloJusanteDoPerfil,
  OpcoesCamadaLama,
} from '../../calculos/hidrostaticaSuperficieInclinada';

export const calcularHidrostatica = (
  damHeight: number,
  inclinationAngle: number,
  upstreamLevel: number,
  downstreamLevel: number,
  gamma: number,
  downstreamAngle?: number,
  mudOpcoes?: OpcoesCamadaLama
) => {
  return calculateNetForce(damHeight, inclinationAngle, upstreamLevel, downstreamLevel, gamma, downstreamAngle, mudOpcoes);
};

export const simular = (config: ConfiguracaoSimulacaoBarragem): ResultadoSimulacaoBarragem => {
  const {
    damHeight,
    damBaseWidth,
    damCrestWidth,
    inclinationAngle,
    archRadius = 30,
    upstreamLevel,
    downstreamLevel,
    hasMudLayer,
    mudHeight,
    mudDensity,
    density,
    gravity,
  } = config;

  const gamma = density * gravity;
  const { profile, actualBaseWidth } = construirGeometria(
    damHeight,
    damBaseWidth,
    damCrestWidth,
    inclinationAngle
  );

  const thetaDown = obterAnguloJusanteDoPerfil(profile);
  const mudOpcoes = extrairOpcoesLama(hasMudLayer, mudHeight, mudDensity, upstreamLevel, gravity);
  const forceData = calcularHidrostatica(
    damHeight,
    inclinationAngle,
    upstreamLevel,
    downstreamLevel,
    gamma,
    thetaDown,
    mudOpcoes
  );

  const stabilityData = calcularEstabilidadeBarragem(damHeight, profile, forceData, {
    gammaMaterial: 24000,
    mu: 0.75,
    isArchDam: true,
    archRadius,
  });

  return {
    damType: TipoBarragem.ARCO,
    normalizedInputs: {
      ...config,
      damBaseWidth: actualBaseWidth,
      downstreamAngle: thetaDown,
      archRadius,
    },
    forceData,
    stabilityData,
    geometryModel: {
      profile,
      damHeight,
      damBaseWidth: actualBaseWidth,
      damCrestWidth,
      inclinationAngle,
      downstreamAngle: thetaDown,
      archRadius,
    },
    annotationModel: {},
    warnings: [
      'Barragem em arco transfere os esforços hidrostáticos por compressão às ombreiras do vale (efeito de arco). A verificação de tombamento/deslizamento como bloco rígido 2D de gravidade não se aplica.',
    ],
  };
};
