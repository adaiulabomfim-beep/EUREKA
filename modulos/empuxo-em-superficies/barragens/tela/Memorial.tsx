import React from 'react';
import { FileText } from 'lucide-react';
import { ResultadoSimulacaoBarragem } from '../dominio/tipos';

export const CalculationLine: React.FC<{
    label: string | React.ReactNode;
    symbol: string | React.ReactNode;
    formula?: string | React.ReactNode;
    substitution?: string | React.ReactNode;
    result: string;
    unit: string;
    isSubHeader?: boolean;
}> = ({ label, symbol, formula, substitution, result, unit, isSubHeader }) => (
    <div className={`flex flex-col sm:flex-row sm:items-baseline justify-between py-2.5 border-b border-blue-50 last:border-0 ${isSubHeader ? 'bg-blue-50/50 -mx-4 px-4 font-bold text-slate-800 mt-2 py-3' : ''}`}>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-700 mt-1 sm:mt-0">
            <span className="font-bold text-blue-600">{symbol}</span>
            {formula && <span className="text-slate-400 hidden lg:inline">= {formula}</span>}
            {substitution && <span className="text-slate-500">= {substitution}</span>}
            <span className={`font-bold px-2 py-0.5 rounded-md ml-auto ${isSubHeader ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-900'}`}>
                = {result} <span className={`text-[10px] font-sans ml-0.5 ${isSubHeader ? 'text-blue-100' : 'text-blue-400'}`}>{unit}</span>
            </span>
        </div>
    </div>
);

interface MemorialProps {
  showDetails: boolean;
  setShowDetails: (val: boolean) => void;
  analyzedResults: ResultadoSimulacaoBarragem | null;
  density: number;
  gravity: number;
}

export const Memorial: React.FC<MemorialProps> = ({
  showDetails, setShowDetails, analyzedResults, density, gravity
}) => {
  if (!showDetails || !analyzedResults) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><FileText className="w-5 h-5" /></div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Memória de Cálculo</h2>
                        <p className="text-xs text-slate-500 font-medium">Análise Hidrostática e Estabilidade</p>
                    </div>
                </div>
                <button onClick={() => setShowDetails(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Hydrostatics Column */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                                <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center text-xs">1</span>
                                Forças Hidrostáticas
                            </h3>
                            <div className="space-y-1">
                                <CalculationLine label="Peso Específico da Água" symbol="γ" formula="ρ · g" substitution={`${density} · ${gravity}`} result={(density * gravity).toFixed(0)} unit="N/m³" />
                                
                                <CalculationLine isSubHeader label="Montante" symbol="Upstream" result="" unit="" />
                                <CalculationLine label="Área Molhada (Montante)" symbol="A_up" formula="h_up / sen(θ)" substitution={`${analyzedResults.normalizedInputs.upstreamLevel.toFixed(2)} / sen(${analyzedResults.normalizedInputs.inclinationAngle}°)`} result={analyzedResults.forceData.up?.area?.toFixed(2) || '0.00'} unit="m²/m" />
                                <CalculationLine label="Prof. Centro de Gravidade" symbol="h_cg_up" formula="h_up / 2" substitution={`${analyzedResults.normalizedInputs.upstreamLevel.toFixed(2)} / 2`} result={(analyzedResults.normalizedInputs.upstreamLevel / 2).toFixed(2)} unit="m" />
                                <CalculationLine label="Força Resultante (Montante)" symbol="FR_up" formula="γ · h_cg_up · A_up" substitution={`${(density * gravity).toFixed(0)} · ${(analyzedResults.normalizedInputs.upstreamLevel / 2).toFixed(2)} · ${analyzedResults.forceData.up?.area?.toFixed(2) || '0.00'}`} result={(analyzedResults.forceData.up?.FR / 1000).toFixed(2) || '0.00'} unit="kN/m" />
                                <CalculationLine label="Centro de Pressão (Montante)" symbol="y_cp_up" formula="h_up / 3" substitution={`${analyzedResults.normalizedInputs.upstreamLevel.toFixed(2)} / 3`} result={analyzedResults.forceData.up?.y_cp?.toFixed(2) || '0.00'} unit="m" />

                                {analyzedResults.normalizedInputs.downstreamLevel > 0 && analyzedResults.forceData.down && (
                                    <>
                                        <CalculationLine isSubHeader label="Jusante" symbol="Downstream" result="" unit="" />
                                        <CalculationLine label="Área Molhada (Jusante)" symbol="A_down" formula="h_down / sen(θ)" substitution={`${analyzedResults.normalizedInputs.downstreamLevel.toFixed(2)} / sen(${analyzedResults.normalizedInputs.inclinationAngle}°)`} result={analyzedResults.forceData.down?.area?.toFixed(2) || '0.00'} unit="m²/m" />
                                        <CalculationLine label="Prof. Centro de Gravidade" symbol="h_cg_down" formula="h_down / 2" substitution={`${analyzedResults.normalizedInputs.downstreamLevel.toFixed(2)} / 2`} result={(analyzedResults.normalizedInputs.downstreamLevel / 2).toFixed(2)} unit="m" />
                                        <CalculationLine label="Força Resultante (Jusante)" symbol="FR_down" formula="γ · h_cg_down · A_down" substitution={`${(density * gravity).toFixed(0)} · ${(analyzedResults.normalizedInputs.downstreamLevel / 2).toFixed(2)} · ${analyzedResults.forceData.down?.area?.toFixed(2) || '0.00'}`} result={(analyzedResults.forceData.down?.FR / 1000).toFixed(2) || '0.00'} unit="kN/m" />
                                        <CalculationLine label="Centro de Pressão (Jusante)" symbol="y_cp_down" formula="h_down / 3" substitution={`${analyzedResults.normalizedInputs.downstreamLevel.toFixed(2)} / 3`} result={analyzedResults.forceData.down?.y_cp?.toFixed(2) || '0.00'} unit="m" />
                                    </>
                                )}

                                <CalculationLine isSubHeader label="Força Líquida" symbol="Net" result="" unit="" />
                                <CalculationLine label="Força Resultante Líquida" symbol="FR_net" formula="FR_up - FR_down" substitution={`${(analyzedResults.forceData.up.FR / 1000).toFixed(2)} - ${(analyzedResults.forceData.down.FR / 1000).toFixed(2)}`} result={(analyzedResults.forceData.FR_net / 1000).toFixed(2)} unit="kN/m" />
                                <CalculationLine label="Centro de Pressão Líquido" symbol="y_cp_net" formula="ΣM / FR_net" substitution={`...`} result={analyzedResults.forceData.y_cp_net.toFixed(2)} unit="m" />
                            </div>
                        </div>
                    </div>

                    {/* Stability Column */}
                    <div className="space-y-6">
                        {analyzedResults.stabilityData && (
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                                    <span className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">2</span>
                                    Estabilidade
                                </h3>
                                <div className="space-y-1">
                                    <CalculationLine label="Peso Próprio da Barragem" symbol="W" formula="V_barragem · γ_concreto" substitution={`...`} result={(analyzedResults.stabilityData.weight / 1000).toFixed(2)} unit="kN/m" />
                                    <CalculationLine label="Braço de Alavanca (Peso)" symbol="x_cg" result={analyzedResults.stabilityData.x_cg.toFixed(2)} unit="m" />
                                    <CalculationLine label="Momento Estabilizante" symbol="M_est" formula="W · x_cg" substitution={`${(analyzedResults.stabilityData.weight / 1000).toFixed(2)} · ${analyzedResults.stabilityData.x_cg.toFixed(2)}`} result={(analyzedResults.stabilityData.m_est / 1000).toFixed(2)} unit="kN·m/m" />
                                    
                                    <CalculationLine isSubHeader label="Tombamento" symbol="Overturning" result="" unit="" />
                                    <CalculationLine label="Momento Tombador" symbol="M_tomb" formula="FR_net · y_cp_net" substitution={`${(analyzedResults.forceData.FR_net / 1000).toFixed(2)} · ${analyzedResults.forceData.y_cp_net.toFixed(2)}`} result={(analyzedResults.stabilityData.m_tomb / 1000).toFixed(2)} unit="kN·m/m" />
                                    <CalculationLine label="Fator de Segurança (Tomb.)" symbol="FS_tomb" formula="M_est / M_tomb" substitution={`${(analyzedResults.stabilityData.m_est / 1000).toFixed(2)} / ${(analyzedResults.stabilityData.m_tomb / 1000).toFixed(2)}`} result={analyzedResults.stabilityData.fs_tomb.toFixed(2)} unit="" />

                                    <CalculationLine isSubHeader label="Deslizamento" symbol="Sliding" result="" unit="" />
                                    <CalculationLine label="Coeficiente de Atrito" symbol="μ" result="0.65" unit="" />
                                    <CalculationLine label="Força Resistente" symbol="F_res" formula="μ · W" substitution={`0.65 · ${(analyzedResults.stabilityData.weight / 1000).toFixed(2)}`} result={((analyzedResults.stabilityData.weight * 0.65) / 1000).toFixed(2)} unit="kN/m" />
                                    <CalculationLine label="Fator de Segurança (Desl.)" symbol="FS_desl" formula="F_res / FR_net" substitution={`${((analyzedResults.stabilityData.weight * 0.65) / 1000).toFixed(2)} / ${(analyzedResults.forceData.FR_net / 1000).toFixed(2)}`} result={analyzedResults.stabilityData.fs_desl.toFixed(2)} unit="" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex justify-end">
                <button onClick={() => setShowDetails(false)} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl shadow-md transition-all">
                    Fechar Memória
                </button>
            </div>
        </div>
    </div>
  );
};
