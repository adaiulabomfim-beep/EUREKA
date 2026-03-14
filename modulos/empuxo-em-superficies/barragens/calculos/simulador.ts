import { ConfiguracaoSimulacaoBarragem, ResultadoSimulacaoBarragem } from '../dominio/tipos';
import { registroTiposBarragem } from '../dominio/registroTipos';

export const simularBarragem = (config: ConfiguracaoSimulacaoBarragem): ResultadoSimulacaoBarragem => {
  const registryEntry = registroTiposBarragem[config.damType];
  if (registryEntry && registryEntry.simulate) {
    return registryEntry.simulate(config);
  }
  
  console.warn(`No simulate function found for dam type: ${config.damType}`);
  return {
    damType: config.damType,
    normalizedInputs: config,
    forceData: { FR_net: 0, y_cp_net: 0, s_cp_net: 0, up: { FR: 0, y_cp: 0, p_bot: 0 }, down: { FR: 0, y_cp: 0, p_bot: 0 } },
    stabilityData: null,
    geometryModel: {},
    annotationModel: {},
    warnings: ['Simulation not implemented for this dam type.']
  };
};
