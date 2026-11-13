import { ConfiguracaoSimulacaoBarragem, ResultadoSimulacaoBarragem, ResultadoSuperficieRetangular } from '../dominio/tipos';
import { registroTiposBarragem } from '../dominio/registroTipos';

const emptySurface: ResultadoSuperficieRetangular = {
  FR: 0,
  FH: 0,
  FV: 0,
  s_cp: 0,
  h_cp: 0,
  s_cg: 0,
  h_cg: 0,
  area: 0,
  wetLength: 0,
  y_cp: 0,
  x_cp_offset: 0,
  p_bot: 0,
};

export const simularBarragem = (config: ConfiguracaoSimulacaoBarragem): ResultadoSimulacaoBarragem => {
  const registryEntry = registroTiposBarragem[config.damType];
  if (registryEntry && registryEntry.simulate) {
    return registryEntry.simulate(config);
  }

  console.warn(`No simulate function found for dam type: ${config.damType}`);
  return {
    damType: config.damType,
    normalizedInputs: config,
    forceData: {
      FR_net: 0,
      FH_net: 0,
      FV_net: 0,
      y_cp_net: 0,
      s_cp_net: 0,
      moment_total: 0,
      p_max_up: 0,
      p_max_down: 0,
      thetaUp: config.inclinationAngle,
      thetaDown: config.downstreamAngle ?? config.inclinationAngle,
      up: emptySurface,
      down: emptySurface,
    },
    stabilityData: null,
    geometryModel: {},
    annotationModel: {},
    warnings: ['Simulation not implemented for this dam type.'],
  };
};
