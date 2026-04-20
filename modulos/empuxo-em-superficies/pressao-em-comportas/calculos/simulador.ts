import { ConfiguracaoSimulacaoComporta } from '../dominio/configuracao';
import { ResultadoSimulacaoComporta } from '../dominio/resultado';
import { calculateNetForce } from './hidrostatica';
import { calcularMomentos } from './momentos';

export function simularComportas(config: ConfiguracaoSimulacaoComporta): ResultadoSimulacaoComporta {
  const { fluidoMontante, fluidoJusante, comporta } = config;
  
  const y_top = fluidoMontante.nivel - comporta.profundidadeTopo;
  const h_top_up = comporta.profundidadeTopo;
  
  // Jusante: se inativo, nível = 0 → h_top_down será negativo → sem força
  const nivelJusante = fluidoJusante.ativo ? fluidoJusante.nivel : 0;
  const h_top_down = nivelJusante - y_top;
  
  // Gammas independentes por lado
  const gammaUp = fluidoMontante.densidade * fluidoMontante.gravidade;
  const gammaDown = fluidoJusante.densidade * fluidoJusante.gravidade;
  
  const forceData = calculateNetForce(
    comporta.altura,
    comporta.largura,
    comporta.angulo || 90,
    h_top_up,
    h_top_down,
    gammaUp,
    gammaDown,
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
