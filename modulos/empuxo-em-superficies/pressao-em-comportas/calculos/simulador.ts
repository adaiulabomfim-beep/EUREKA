import { ConfiguracaoSimulacaoComporta } from '../dominio/configuracao';
import { ResultadoSimulacaoComporta } from '../dominio/resultado';
import { calculateNetForce } from './hidrostatica';
import { calcularMomentos } from './momentos';

export function simularComportas(config: ConfiguracaoSimulacaoComporta): ResultadoSimulacaoComporta {
  const { fluido, comporta } = config;
  
  const y_top = fluido.nivelMontante - comporta.profundidadeTopo;
  const h_top_up = comporta.profundidadeTopo;
  const h_top_down = fluido.nivelJusante - y_top;
  
  const forceData = calculateNetForce(
    comporta.altura,
    comporta.largura,
    comporta.angulo || 90,
    h_top_up,
    h_top_down,
    fluido.densidade * fluido.gravidade,
    comporta.forma
  );
  
  const resultados: ResultadoSimulacaoComporta = {
    forceData: {
      ...forceData
    },
    equilibrium: {
      M_hinge: 0,
      F_tie: 0
    }
  };

  const equilibrium = calcularMomentos(config, resultados);
  
  return {
    ...resultados,
    equilibrium
  };
}
