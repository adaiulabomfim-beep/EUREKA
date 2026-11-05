import { ConfiguracaoSimulacaoComporta } from '../dominio/configuracao';
import { ResultadoSimulacaoComporta } from '../dominio/resultado';
import { ModoPosicionamentoComporta } from '../dominio/tipos';
import { calculateNetForce, getGateYBarTotal } from './hidrostatica';
import { calcularMomentos } from './momentos';

export function simularComportas(config: ConfiguracaoSimulacaoComporta): ResultadoSimulacaoComporta {
  const { fluidoMontante, fluidoJusante, comporta } = config;
  const angulo = comporta.angulo || 90;
  const sinTheta = Math.sin((angulo * Math.PI) / 180);
  const ybarTotal = getGateYBarTotal(comporta.forma, comporta.altura);
  
  // 1. Determina h_topo e Y_CG conforme o Modo de Posicionamento:
  // Modo Padrão: usuário informa h_topo (profundidade vertical do topo)
  // Modo Y_CG: usuário informa Y_CG direto (distância ao longo da superfície)
  // Conversão interna:
  // h_CG  = Y_CG × sin(θ)
  // h_topo = h_CG − ybar_total × sin(θ)
  let h_top_up = comporta.profundidadeTopo;
  let directY_CG_up: number | undefined = undefined;

  if (comporta.modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO && comporta.y_cg_direto !== undefined) {
    directY_CG_up = comporta.y_cg_direto;
    const h_CG = directY_CG_up * sinTheta;
    h_top_up = h_CG - ybarTotal * sinTheta;
  }
  
  const y_top = fluidoMontante.nivel - h_top_up;
  
  // Jusante: se inativo, desconsidera explicitamente
  const hasDownstream = Boolean(fluidoJusante.ativo && fluidoJusante.nivel > 0);
  const nivelJusante = hasDownstream ? fluidoJusante.nivel : 0;
  const h_top_down = hasDownstream ? (nivelJusante - y_top) : -1e6;
  
  // Gammas independentes por lado
  const gammaUp = fluidoMontante.densidade * fluidoMontante.gravidade;
  const gammaDown = fluidoJusante.densidade * fluidoJusante.gravidade;
  
  const forceData = calculateNetForce(
    comporta.altura,
    comporta.largura,
    angulo,
    h_top_up,
    h_top_down,
    gammaUp,
    gammaDown,
    comporta.forma,
    directY_CG_up,
    hasDownstream
  );
  
  const resultados: ResultadoSimulacaoComporta = {
    sistemaUnidades: config.sistemaUnidades,
    modoPosicionamento: comporta.modoPosicionamento,
    gammaUp,
    gammaDown,
    densityUp: fluidoMontante.densidade,
    densityDown: fluidoJusante.densidade,
    h_top_up,
    Y_CG_up: forceData.up.Y_CG || directY_CG_up || 0,
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
