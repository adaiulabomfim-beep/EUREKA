import { ConfiguracaoSimulacaoBarragem, ResultadoSimulacaoBarragem, TipoBarragem } from '../../dominio/tipos';
import { construirGeometria } from './geometria';
import {
  calculateNetForce,
  calcularEstabilidadeBarragem,
  calcularPropriedadesPoligono,
  extrairOpcoesLama,
  obterAnguloJusanteDoPerfil,
  OpcoesCamadaLama,
} from '../../calculos/hidrostaticaSuperficieInclinada';

const BUTTRESS_FILL_RATIO = 0.2; // 5 contrafortes com 4% da largura do canal cada (modelo 3D)

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
    buttressAngle = 45,
    upstreamLevel,
    downstreamLevel,
    hasMudLayer,
    mudHeight,
    mudDensity,
    density,
    gravity,
  } = config;

  const gamma = density * gravity;
  const { wallProfile, buttressProfile2D, buttressProfile3D, actualBaseWidth } = construirGeometria(
    damHeight,
    damBaseWidth,
    damCrestWidth,
    inclinationAngle,
    buttressAngle
  );

  // Na barragem de contrafortes, o nível de jusante atua contra a face vertical da parede (90°)
  const thetaDown = obterAnguloJusanteDoPerfil(wallProfile);
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

  // Peso próprio real por metro de vão = área da laje/parede (100%) + contrafortes (20% do vão)
  const wallProps = calcularPropriedadesPoligono(wallProfile);
  const buttressProps = calcularPropriedadesPoligono(buttressProfile2D);
  const compositeArea = wallProps.area + BUTTRESS_FILL_RATIO * buttressProps.area;
  const compositeXcg =
    compositeArea > 1e-9
      ? (wallProps.area * wallProps.x_cg +
          BUTTRESS_FILL_RATIO * buttressProps.area * buttressProps.x_cg) /
        compositeArea
      : actualBaseWidth / 2;
  const compositeYcg =
    compositeArea > 1e-9
      ? (wallProps.area * wallProps.y_cg +
          BUTTRESS_FILL_RATIO * buttressProps.area * buttressProps.y_cg) /
        compositeArea
      : damHeight / 3;

  const envelopeProfile = [
    wallProfile[0],
    wallProfile[1],
    wallProfile[2],
    buttressProfile2D[2],
  ];

  const stabilityData = calcularEstabilidadeBarragem(damHeight, envelopeProfile, forceData, {
    gammaMaterial: 24000,
    mu: 0.7,
    customArea: compositeArea,
    customXcg: compositeXcg,
    customYcg: compositeYcg,
    volumeFactor: BUTTRESS_FILL_RATIO,
  });

  return {
    damType: TipoBarragem.CONTRAFORTE,
    normalizedInputs: {
      ...config,
      damBaseWidth: actualBaseWidth || damBaseWidth,
      downstreamAngle: thetaDown,
    },
    forceData,
    stabilityData,
    geometryModel: {
      profile: [...wallProfile, ...buttressProfile2D],
      wallProfile,
      buttressProfile: buttressProfile3D,
      buttressProfile2D,
      actualBaseWidth,
      damHeight,
      damBaseWidth: actualBaseWidth,
      damCrestWidth,
      inclinationAngle,
      downstreamAngle: thetaDown,
      buttressAngle,
    },
    annotationModel: {},
    warnings: [],
  };
};
