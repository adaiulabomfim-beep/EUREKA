import { CenarioHistorico } from './historicoTipos';

export const HISTORICO_STORAGE_KEY = 'eureka_historico_cenarios_v1';
export const EVENTO_HISTORICO_ATUALIZADO = 'eureka_evento_historico_atualizado';
const MAX_CENARIOS = 5;

export function obterHistorico(): CenarioHistorico[] {
  try {
    const raw = localStorage.getItem(HISTORICO_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, MAX_CENARIOS);
    }
    return [];
  } catch (err) {
    console.error('Erro ao ler histórico de simulações:', err);
    return [];
  }
}

export function salvarNoHistorico(cenario: Omit<CenarioHistorico, 'id' | 'timestamp' | 'dataHora'>): CenarioHistorico[] {
  try {
    const listaAtual = obterHistorico();
    const agora = new Date();
    const dataHora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const novoCenario: CenarioHistorico = {
      ...cenario,
      id: `cenario_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      dataHora,
    };

    // Previne duplicações instantâneas consecutivas idênticas em menos de 1 segundo
    if (listaAtual.length > 0 && Math.abs(listaAtual[0].timestamp - novoCenario.timestamp) < 1200) {
      if (listaAtual[0].titulo === novoCenario.titulo && listaAtual[0].resultados.empuxo === novoCenario.resultados.empuxo) {
        return listaAtual;
      }
    }

    const novaLista = [novoCenario, ...listaAtual].slice(0, MAX_CENARIOS);
    localStorage.setItem(HISTORICO_STORAGE_KEY, JSON.stringify(novaLista));

    window.dispatchEvent(new CustomEvent(EVENTO_HISTORICO_ATUALIZADO, { detail: novaLista }));
    return novaLista;
  } catch (err) {
    console.error('Erro ao salvar no histórico:', err);
    return obterHistorico();
  }
}

export function removerItemHistorico(id: string): CenarioHistorico[] {
  try {
    const listaAtual = obterHistorico();
    const filtrada = listaAtual.filter(item => item.id !== id);
    localStorage.setItem(HISTORICO_STORAGE_KEY, JSON.stringify(filtrada));
    window.dispatchEvent(new CustomEvent(EVENTO_HISTORICO_ATUALIZADO, { detail: filtrada }));
    return filtrada;
  } catch (err) {
    console.error('Erro ao remover do histórico:', err);
    return obterHistorico();
  }
}

export function limparHistorico(): void {
  try {
    localStorage.removeItem(HISTORICO_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(EVENTO_HISTORICO_ATUALIZADO, { detail: [] }));
  } catch (err) {
    console.error('Erro ao limpar histórico:', err);
  }
}

/**
 * Captura o estado atual da simulação ativa no DOM através de #areaSimulacao
 */
export function capturarCenarioAtual(): CenarioHistorico | null {
  try {
    const container = document.getElementById('areaSimulacao');
    if (!container || !container.dataset.simulacao) {
      return null;
    }

    const data = JSON.parse(container.dataset.simulacao);
    const tipo = data.tipo || 'simulacao';

    let moduloNome = 'Simulação Hidrostática';
    let titulo = 'Cenário';
    const parametros: Record<string, string | number> = {};
    const resultados: CenarioHistorico['resultados'] = {
      empuxo: data.empuxo || 0,
      empuxoFormatado: '0 N',
    };

    if (tipo === 'corpos-imersos') {
      moduloNome = 'Corpos Imersos';
      titulo = `Corpo ${data.geometria || 'Geométrico'}`;
      if (data.dimensoes) {
        Object.entries(data.dimensoes).forEach(([k, v]) => {
          parametros[k] = v as string | number;
        });
      }
      if (data.densidadeObjeto) parametros['Densidade Objeto'] = `${data.densidadeObjeto} kg/m³`;
      if (data.densidadeFluido) parametros['Densidade Fluido'] = `${data.densidadeFluido} kg/m³`;

      const E = data.empuxo || 0;
      const P = data.peso || 0;
      resultados.empuxo = E;
      resultados.empuxoFormatado = E >= 10000 ? `${(E / 1000).toFixed(2)} kN` : `${E.toFixed(1)} N`;
      resultados.peso = P;
      resultados.pesoFormatado = P >= 10000 ? `${(P / 1000).toFixed(2)} kN` : `${P.toFixed(1)} N`;
      resultados.volumeDeslocado = data.volumeDeslocado ? `${(data.volumeDeslocado * 1e3).toFixed(2)} L (${(data.volumeDeslocado).toFixed(4)} m³)` : undefined;
      resultados.alturaSubmersa = data.alturaSubmersa ? `${(data.alturaSubmersa * 100).toFixed(1)} cm` : undefined;
      resultados.segurancaOuStatus = E > P ? 'Flutua (E > P)' : E < P ? 'Afunda (E < P)' : 'Equilíbrio Neutro (E = P)';
    } else if (tipo === 'barragens') {
      moduloNome = 'Barragens';
      titulo = data.geometria || 'Barragem Hidráulica';
      if (data.dimensoes) {
        Object.entries(data.dimensoes).forEach(([k, v]) => {
          parametros[k] = v as string | number;
        });
      }
      if (data.alturaSubmersa) parametros['Nível Montante'] = `${data.alturaSubmersa} m`;

      const E = data.empuxo || 0;
      resultados.empuxo = E;
      resultados.empuxoFormatado = `${(Math.abs(E) / 1000).toFixed(2)} kN/m`;
      if (data.peso) {
        resultados.peso = data.peso;
        resultados.pesoFormatado = `${(data.peso / 1000).toFixed(2)} kN/m`;
      }
      if (data.analyzedResults?.forceData?.y_cp_net !== undefined) {
        resultados.centroPressao = `${data.analyzedResults.forceData.y_cp_net.toFixed(2)} m (do fundo)`;
      }
      if (data.analyzedResults?.stabilityData?.safetyFactorOverturning) {
        resultados.segurancaOuStatus = `FS Tombamento: ${data.analyzedResults.stabilityData.safetyFactorOverturning.toFixed(2)}`;
      }
    } else if (tipo === 'comportas') {
      moduloNome = 'Comportas';
      titulo = data.geometria || 'Comporta Hidráulica';
      if (data.dimensoes) {
        Object.entries(data.dimensoes).forEach(([k, v]) => {
          parametros[k] = v as string | number;
        });
      }
      if (data.alturaSubmersa) parametros['Nível Montante'] = `${data.alturaSubmersa} m`;

      const E = data.empuxo || 0;
      resultados.empuxo = E;
      resultados.empuxoFormatado = `${(Math.abs(E) / 1000).toFixed(2)} kN`;
      if (data.peso) {
        resultados.peso = data.peso;
        resultados.pesoFormatado = `${(data.peso / 1000).toFixed(2)} kN`;
      }
      if (data.analyzedResults?.forceData?.s_cp_net !== undefined) {
        resultados.centroPressao = `s_cp = ${data.analyzedResults.forceData.s_cp_net.toFixed(2)} m`;
      }
      resultados.segurancaOuStatus = data.isAnalyzed ? 'Análise Concluída' : 'Em Ajuste';
    }

    const salvo = salvarNoHistorico({
      modulo: tipo,
      moduloNome,
      titulo,
      parametros,
      resultados,
    });

    return salvo[0] || null;
  } catch (err) {
    console.error('Erro ao capturar cenário atual:', err);
    return null;
  }
}
