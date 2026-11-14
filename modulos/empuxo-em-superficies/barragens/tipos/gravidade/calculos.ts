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

  // Para sim1/sim2 legadas (sem showTriangularMode nem d explícito), mantém γ_mat = 24000 N/m³;
  // Quando showTriangularMode ou d_conc for informado, usa γ_conc = d_conc * ρ_ref * g (ou d_conc * γ_água)
  const dConc = concreteSpecificGravity ?? 2.4;
  const gammaConcrete = showTriangularMode
    ? dConc * 1000 * gravity
    : concreteSpecificGravity !== undefined
    ? dConc * 1000 * gravity
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
