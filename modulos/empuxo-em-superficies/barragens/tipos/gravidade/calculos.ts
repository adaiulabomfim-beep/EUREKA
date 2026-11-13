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
    mu: 0.7,
  });

  const warnings: string[] = [];
  if (actualBaseWidth > damBaseWidth + 1e-3) {
    warnings.push(
      `Base ajustada automaticamente para ${actualBaseWidth.toFixed(2)} m para acomodar a inclinação de montante e a crista.`
    );
  }

  return {
    damType: TipoBarragem.GRAVIDADE,
    normalizedInputs: {
      ...config,
      damBaseWidth: actualBaseWidth,
      downstreamAngle: thetaDown,
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
    },
    annotationModel: {},
    warnings,
  };
};
