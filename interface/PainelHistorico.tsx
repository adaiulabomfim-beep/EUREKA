import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  Trash2,
  BookmarkPlus,
  GitCompare,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  ChevronRight,
  SplitSquareVertical,
} from 'lucide-react';
import { CenarioHistorico } from './historicoTipos';
import {
  obterHistorico,
  removerItemHistorico,
  limparHistorico,
  capturarCenarioAtual,
  EVENTO_HISTORICO_ATUALIZADO,
} from './historicoGerenciador';

interface PainelHistoricoProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PainelHistorico: React.FC<PainelHistoricoProps> = ({ isOpen, onClose }) => {
  const [historico, setHistorico] = useState<CenarioHistorico[]>([]);
  const [selecionadosParaComparar, setSelecionadosParaComparar] = useState<string[]>([]);
  const [modoComparacao, setModoComparacao] = useState<boolean>(false);
  const [mensagemFeedback, setMensagemFeedback] = useState<string | null>(null);

  // Carrega e assina atualizações do histórico
  useEffect(() => {
    setHistorico(obterHistorico());

    const handleAtualizacao = (e: CustomEvent<CenarioHistorico[]>) => {
      setHistorico(e.detail || obterHistorico());
    };

    window.addEventListener(EVENTO_HISTORICO_ATUALIZADO as any, handleAtualizacao);
    return () => {
      window.removeEventListener(EVENTO_HISTORICO_ATUALIZADO as any, handleAtualizacao);
    };
  }, []);

  const handleSalvarCenarioAtual = () => {
    const salvo = capturarCenarioAtual();
    if (salvo) {
      setMensagemFeedback('Cenário capturado com sucesso!');
      setTimeout(() => setMensagemFeedback(null), 2500);
    } else {
      setMensagemFeedback('Ative uma simulação antes de salvar.');
      setTimeout(() => setMensagemFeedback(null), 2500);
    }
  };

  const handleToggleSelecao = (id: string) => {
    setSelecionadosParaComparar((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleCompararSelecionados = () => {
    if (selecionadosParaComparar.length >= 2) {
      setModoComparacao(true);
    } else if (historico.length >= 2) {
      // Se não selecionou explicitamente, compara os dois primeiros por padrão
      setSelecionadosParaComparar([historico[0].id, historico[1].id]);
      setModoComparacao(true);
    } else {
      setMensagemFeedback('É necessário ao menos 2 cenários para comparar.');
      setTimeout(() => setMensagemFeedback(null), 2500);
    }
  };

  const cenariosComparados = historico.filter((c) =>
    selecionadosParaComparar.includes(c.id)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
      />

      {/* Drawer Painel Lateral Retrátil */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col z-10 border-l border-blue-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 animate-in slide-in-from-right duration-300 transition-colors">
        {/* Cabeçalho */}
        <div className="p-5 border-b border-blue-50 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-slate-100">
                  Histórico de Cenários
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>Últimas 5 simulações</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {historico.length} de 5 salvas
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              title="Fechar painel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de Ações Rápidas */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSalvarCenarioAtual}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                Salvar Atual
              </button>

              {historico.length >= 2 && (
                <button
                  onClick={() => {
                    if (modoComparacao) {
                      setModoComparacao(false);
                    } else {
                      handleCompararSelecionados();
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    modoComparacao
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  {modoComparacao ? 'Voltar à Lista' : 'Comparar'}
                </button>
              )}
            </div>

            {historico.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Deseja limpar todo o histórico de simulações?')) {
                    limparHistorico();
                    setSelecionadosParaComparar([]);
                    setModoComparacao(false);
                  }
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-2 py-1 rounded"
                title="Limpar todas as simulações"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar
              </button>
            )}
          </div>

          {/* Feedback temporário */}
          {mensagemFeedback && (
            <div className="mt-2.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-semibold rounded-lg animate-in fade-in flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>{mensagemFeedback}</span>
            </div>
          )}
        </div>

        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {historico.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-500 mb-4 shadow-sm">
                <History className="w-8 h-8 stroke-1" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                Nenhuma simulação no histórico
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-6">
                Execute ensaios nos laboratórios ou clique em{' '}
                <strong className="text-blue-600 dark:text-blue-400 font-semibold">"Salvar Atual"</strong> para
                armazenar e comparar até 5 cenários simultaneamente.
              </p>
              <button
                onClick={handleSalvarCenarioAtual}
                className="px-4 py-2 bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/70 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-all"
              >
                Capturar Simulação Atual Agora
              </button>
            </div>
          ) : modoComparacao ? (
            /* ================= MODO DE COMPARAÇÃO ================= */
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <SplitSquareVertical className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Comparação de Cenários ({cenariosComparados.length})
                  </h3>
                </div>
                <button
                  onClick={() => setModoComparacao(false)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold"
                >
                  ← Ver Todos
                </button>
              </div>

              {/* Seletor rápido de quem comparar */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Selecione os cenários para o comparativo:
                </p>
                <div className="flex flex-wrap gap-2">
                  {historico.map((c) => {
                    const ativo = selecionadosParaComparar.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleToggleSelecao(c.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                          ativo
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        {c.titulo} ({c.dataHora})
                      </button>
                    );
                  })}
                </div>
              </div>

              {cenariosComparados.length < 2 ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl">
                  Selecione ao menos 2 cenários acima para visualizar a tabela comparativa.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Grid Comparativo dos Cenários */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cenariosComparados.map((cenario, idx) => (
                      <div
                        key={cenario.id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                            <span className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                              Cenário {idx + 1} ({cenario.moduloNome})
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {cenario.dataHora}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                            {cenario.titulo}
                          </h4>

                          {/* Métricas Principais */}
                          <div className="space-y-2 mb-4 bg-slate-50/70 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">Empuxo (E / FR):</span>
                              <span className="font-black text-blue-700 dark:text-blue-400">
                                {cenario.resultados.empuxoFormatado}
                              </span>
                            </div>

                            {cenario.resultados.pesoFormatado && (
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Peso:</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                  {cenario.resultados.pesoFormatado}
                                </span>
                              </div>
                            )}

                            {cenario.resultados.centroPressao && (
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Centro de Pressão:</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {cenario.resultados.centroPressao}
                                </span>
                              </div>
                            )}

                            {cenario.resultados.volumeDeslocado && (
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Vol. Deslocado:</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {cenario.resultados.volumeDeslocado}
                                </span>
                              </div>
                            )}

                            {cenario.resultados.segurancaOuStatus && (
                              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60 dark:border-slate-800">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Status / FS:</span>
                                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                  {cenario.resultados.segurancaOuStatus}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Parâmetros Geométricos */}
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                              Parâmetros de Entrada
                            </span>
                            <div className="space-y-1 text-xs">
                              {Object.entries(cenario.parametros).map(([chave, valor]) => (
                                <div key={chave} className="flex justify-between text-slate-600 dark:text-slate-400">
                                  <span className="truncate pr-2">{chave}:</span>
                                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200 shrink-0">{valor}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resumo Diferencial entre os 2 primeiros selecionados */}
                  {cenariosComparados.length >= 2 && (
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-800/80 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 dark:text-blue-200">
                          Análise Comparativa Direta (Cenário 1 vs Cenário 2)
                        </h4>
                      </div>

                      {(() => {
                        const c1 = cenariosComparados[0];
                        const c2 = cenariosComparados[1];
                        const deltaE = c1.resultados.empuxo - c2.resultados.empuxo;
                        const maiorEmpuxo = deltaE > 0 ? 'Cenário 1' : deltaE < 0 ? 'Cenário 2' : 'Equivalentes';
                        const pct = c2.resultados.empuxo !== 0
                          ? ((Math.abs(deltaE) / Math.abs(c2.resultados.empuxo)) * 100).toFixed(1)
                          : '0';

                        return (
                          <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed">
                            <p>
                              • <strong>Variação de Força Hidrostática / Empuxo (ΔE):</strong>{' '}
                              <span className="font-bold text-blue-800 dark:text-blue-300">
                                {Math.abs(deltaE) >= 1000 ? `${(Math.abs(deltaE) / 1000).toFixed(2)} kN` : `${Math.abs(deltaE).toFixed(1)} N`}
                              </span>{' '}
                              ({pct}% de diferença).
                            </p>
                            <p>
                              • <strong>Maior Solicitação de Empuxo:</strong>{' '}
                              <span className="font-bold text-indigo-700 dark:text-indigo-400">{maiorEmpuxo}</span>.
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                              Dica: compare como a variação de densidade do fluido ou a elevação do nível de montante altera a magnitude da força resultante e a cota do centro de empuxo.
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ================= MODO DE LISTA ================= */
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 mb-1">
                <span>Marque cenários para comparar:</span>
                {selecionadosParaComparar.length >= 2 && (
                  <button
                    onClick={() => setModoComparacao(true)}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                  >
                    Comparar {selecionadosParaComparar.length} cenários <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {historico.map((cenario, index) => {
                const isSelected = selecionadosParaComparar.includes(cenario.id);
                return (
                  <div
                    key={cenario.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? 'bg-blue-50/40 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-sm'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700/80 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-sm'
                    }`}
                  >
                    {/* Linha superior: Checkbox, Módulo e Data/Hora */}
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelecao(cenario.id)}
                          className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          #{index + 1} · {cenario.titulo}
                        </span>
                      </label>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                          {cenario.dataHora}
                        </span>
                        <button
                          onClick={() => removerItemHistorico(cenario.id)}
                          className="text-slate-300 dark:text-slate-500 hover:text-red-500 p-1 rounded transition-colors"
                          title="Excluir este cenário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Módulo e Resultados em Destaque */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 bg-slate-50/80 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 mb-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Empuxo / Força
                        </span>
                        <span className="font-extrabold text-blue-700 dark:text-blue-400">
                          {cenario.resultados.empuxoFormatado}
                        </span>
                      </div>

                      {cenario.resultados.pesoFormatado && (
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                            Peso
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {cenario.resultados.pesoFormatado}
                          </span>
                        </div>
                      )}

                      {cenario.resultados.centroPressao && (
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                            Centro Pressão
                          </span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
                            {cenario.resultados.centroPressao}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Parâmetros Chave */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {cenario.moduloNome}
                      </span>
                      {Object.entries(cenario.parametros).slice(0, 3).map(([k, v]) => (
                        <span key={k}>
                          <span className="text-slate-400 dark:text-slate-500">{k}:</span> {v}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé informativo */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between shrink-0">
          <span>Armazenamento local persistente</span>
          {historico.length >= 2 && !modoComparacao && (
            <button
              onClick={handleCompararSelecionados}
              className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
            >
              Comparar Cenários <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
