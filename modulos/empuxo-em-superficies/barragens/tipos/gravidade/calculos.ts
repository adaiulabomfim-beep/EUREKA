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
    damWidth,
    concreteSpecificGravity,
    inclinationAngle,
    upstreamLevel,
    downstreamLevel,
    hasMudLayer,
    mudHeight,
    mudDensity,
    hasPercolation,
    upliftFactorUp,
    upliftFactorDown,
    showTriangularMode,
    density,
    gravity,
  } = config;

  const gamma = config.fluidKey === 'agua20C' ? 9790 : density * gravity;
  const exactTriAngle = damBaseWidth > 0 ? (Math.atan2(damHeight, damBaseWidth) * 180) / Math.PI : inclinationAngle;
  const effectiveInclinationAngle =
    damCrestWidth === 0 && damBaseWidth > 0 && Math.abs(inclinationAngle - exactTriAngle) < 0.05
      ? exactTriAngle
      : inclinationAngle;

  const { profile, actualBaseWidth } = construirGeometria(
    damHeight,
    damBaseWidth,
    damCrestWidth,
    effectiveInclinationAngle
  );

  const thetaDown = obterAnguloJusanteDoPerfil(profile);
  const mudOpcoes = extrairOpcoesLama(hasMudLayer, mudHeight, mudDensity, upstreamLevel, gravity);
  const forceData = calcularHidrostatica(
    damHeight,
    effectiveInclinationAngle,
    upstreamLevel,
    downstreamLevel,
    gamma,
    thetaDown,
    mudOpcoes
  );

  // Quando showTriangularMode ou d_conc for informado, usa γ_conc = d_conc * γ_água (ex.: 2,40 * 9.790 = 23.496 N/m³)
  const dConc = concreteSpecificGravity ?? 2.4;
  const gammaConcrete = showTriangularMode
    ? dConc * gamma
    : concreteSpecificGravity !== undefined
    ? dConc * gamma
    : 24000;

  const stabilityData = calcularEstabilidadeBarragem(damHeight, profile, forceData, {
    gammaMaterial: gammaConcrete,
    concreteSpecificGravity: dConc,
    damWidth: damWidth ?? 1.0,
    gammaFluid: gamma,
    hasPercolation: Boolean(hasPercolation),
    upliftFactorUp: upliftFactorUp ?? 1.0,
    upliftFactorDown: upliftFactorDown ?? 0.0,
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
