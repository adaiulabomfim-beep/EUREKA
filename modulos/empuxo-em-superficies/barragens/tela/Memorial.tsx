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
    theme?: 'slate' | 'blue' | 'cyan' | 'emerald' | 'amber' | 'red' | 'purple' | 'indigo';
}> = ({ label, symbol, formula, substitution, result, unit, isSubHeader, theme = 'blue' }) => {
    const parseSub = (text: string | React.ReactNode) => {
        if (typeof text !== 'string') return text;
        const parts = text.split(/_([a-zA-Z0-9]+(?:_[a-zA-Z0-9]+)*)/g);
        if (parts.length === 1) return text;
        return <>{parts.map((part, i) => i % 2 === 1 ? <sub key={i} className="text-[0.8em] leading-[0] font-semibold">{part}</sub> : part)}</>;
    };

    const t = {
        slate: { text: 'text-slate-600', bg: 'bg-slate-100 text-slate-800', border: 'border-slate-100', subBg: 'bg-slate-600 text-white', unitText: 'text-slate-500', unitSub: 'text-slate-200', subHeaderWrap: 'bg-slate-50/80' },
        blue: { text: 'text-blue-600', bg: 'bg-blue-50 text-blue-900', border: 'border-blue-50', subBg: 'bg-blue-600 text-white', unitText: 'text-blue-500', unitSub: 'text-blue-200', subHeaderWrap: 'bg-blue-50/50' },
        cyan: { text: 'text-cyan-600', bg: 'bg-cyan-50 text-cyan-900', border: 'border-cyan-50', subBg: 'bg-cyan-600 text-white', unitText: 'text-cyan-500', unitSub: 'text-cyan-200', subHeaderWrap: 'bg-cyan-50/50' },
        emerald: { text: 'text-emerald-600', bg: 'bg-emerald-50 text-emerald-900', border: 'border-emerald-50', subBg: 'bg-emerald-600 text-white', unitText: 'text-emerald-500', unitSub: 'text-emerald-200', subHeaderWrap: 'bg-emerald-50/50' },
        amber: { text: 'text-amber-600', bg: 'bg-amber-50 text-amber-900', border: 'border-amber-50', subBg: 'bg-amber-500 text-white', unitText: 'text-amber-500', unitSub: 'text-amber-100', subHeaderWrap: 'bg-amber-50/50' },
        red: { text: 'text-red-600', bg: 'bg-red-50 text-red-900', border: 'border-red-50', subBg: 'bg-red-600 text-white', unitText: 'text-red-500', unitSub: 'text-red-200', subHeaderWrap: 'bg-red-50/50' },
        purple: { text: 'text-purple-600', bg: 'bg-purple-50 text-purple-900', border: 'border-purple-50', subBg: 'bg-purple-600 text-white', unitText: 'text-purple-500', unitSub: 'text-purple-200', subHeaderWrap: 'bg-purple-50/50' },
        indigo: { text: 'text-indigo-600', bg: 'bg-indigo-50 text-indigo-900', border: 'border-indigo-50', subBg: 'bg-indigo-600 text-white', unitText: 'text-indigo-500', unitSub: 'text-indigo-200', subHeaderWrap: 'bg-indigo-50/50' },
    }[theme];

    return (
        <div className={`flex flex-col sm:flex-row sm:items-baseline justify-between py-3 border-b ${t.border} last:border-0 ${isSubHeader ? `${t.subHeaderWrap} -mx-6 px-6 font-bold text-slate-800 mt-4 mb-2 py-4 shadow-sm rounded-xl` : ''}`}>
            <div className={`font-bold uppercase tracking-widest ${isSubHeader ? 'text-sm text-slate-700' : 'text-xs text-slate-500'}`}>{label}</div>
            <div className="flex flex-wrap items-center gap-2.5 text-[13px] sm:text-sm font-mono text-slate-700 mt-2 sm:mt-0">
                <span className={`font-bold ${t.text}`}>{parseSub(symbol)}</span>
                {formula && <span className="text-slate-400 hidden lg:inline">= {parseSub(formula)}</span>}
                {substitution && <span className="text-slate-500">= {parseSub(substitution)}</span>}
                <span className={`font-bold px-3 py-1.5 rounded-lg ml-auto ${isSubHeader ? t.subBg : t.bg}`}>
                    = {result} {unit && <span className={`text-[11px] font-sans ml-1 font-semibold ${isSubHeader ? t.unitSub : t.unitText}`}>{unit}</span>}
                </span>
            </div>
        </div>
    );
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white/95 backdrop-blur-xl shadow-2xl w-[95vw] lg:w-[75vw] h-[95vh] lg:h-[75vh] rounded-3xl flex flex-col overflow-hidden border border-slate-100 relative">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-blue-50 p-6 flex items-center justify-between z-10">
               <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 tracking-tight">
                   <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200"><FileText className="w-5 h-5" /></div> 
                   Memorial de Cálculo
               </h3>
               <button onClick={() => setShowDetails(false)} className="text-[10px] font-black text-slate-400 hover:text-blue-600 px-4 py-2 hover:bg-blue-50 rounded-xl transition-all uppercase tracking-widest">Fechar</button>
            </div>

            <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-white">
                <section>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <div className="w-6 h-px bg-slate-200"></div> Geometria & Massa <div className="flex-1 h-px bg-slate-100"></div>
                    </h4>
                    <div className="flex flex-col gap-0 bg-white shadow-sm p-6 rounded-2xl border border-slate-100">
                         <CalculationLine theme="slate" label="Peso Específico da Água" symbol="γ" formula="ρ · g" substitution={`${density} · ${gravity}`} result={(density * gravity).toFixed(0)} unit="N/m³" />
                         {analyzedResults.stabilityData && (
                             <CalculationLine theme="slate" label="Peso Próprio da Barragem" symbol="W" formula="V_barragem · γ_concreto" substitution={`${(analyzedResults.stabilityData.weight / (density * 2.4)).toFixed(2)} · ${density * 2.4}`} result={(analyzedResults.stabilityData.weight / 1000).toFixed(2)} unit="kN/m" />
                         )}
                    </div>
                </section>

                <section>
                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <div className="w-6 h-px bg-blue-200"></div> Forças Hidrostáticas <div className="flex-1 h-px bg-slate-100"></div>
                    </h4>
                    <div className="flex flex-col gap-0 bg-white shadow-sm p-6 rounded-2xl border border-slate-100">
                        <CalculationLine theme="blue" isSubHeader label="Montante" symbol="Upstream" result="" unit="" />
                        <CalculationLine theme="blue" label="Área Molhada (Montante)" symbol="A_up" formula="h_up / sen(θ)" substitution={`${analyzedResults.normalizedInputs.upstreamLevel.toFixed(2)} / sen(${analyzedResults.normalizedInputs.inclinationAngle}°)`} result={analyzedResults.forceData.up?.area?.toFixed(2) || '0.00'} unit="m²/m" />
                        <CalculationLine theme="blue" label="Prof. Centro de Gravidade" symbol="h_cg_up" formula="h_up / 2" substitution={`${analyzedResults.normalizedInputs.upstreamLevel.toFixed(2)} / 2`} result={(analyzedResults.normalizedInputs.upstreamLevel / 2).toFixed(2)} unit="m" />
                        <CalculationLine theme="blue" label="Força Resultante (Montante)" symbol="FR_up" formula="γ · h_cg_up · A_up" substitution={`${(density * gravity).toFixed(0)} · ${(analyzedResults.normalizedInputs.upstreamLevel / 2).toFixed(2)} · ${analyzedResults.forceData.up?.area?.toFixed(2) || '0.00'}`} result={(analyzedResults.forceData.up?.FR / 1000).toFixed(2) || '0.00'} unit="kN/m" />
                        <CalculationLine theme="blue" label="Centro de Pressão (Montante)" symbol="y_cp_up" formula="h_up / 3" substitution={`${analyzedResults.normalizedInputs.upstreamLevel.toFixed(2)} / 3`} result={analyzedResults.forceData.up?.y_cp?.toFixed(2) || '0.00'} unit="m" />

                        {analyzedResults.normalizedInputs.downstreamLevel > 0 && analyzedResults.forceData.down && (
                            <>
                                <div className="mt-4 pt-2"></div>
                                <CalculationLine theme="indigo" isSubHeader label="Jusante" symbol="Downstream" result="" unit="" />
                                <CalculationLine theme="indigo" label="Área Molhada (Jusante)" symbol="A_down" formula="h_down / sen(θ)" substitution={`${analyzedResults.normalizedInputs.downstreamLevel.toFixed(2)} / sen(${analyzedResults.normalizedInputs.inclinationAngle}°)`} result={analyzedResults.forceData.down?.area?.toFixed(2) || '0.00'} unit="m²/m" />
                                <CalculationLine theme="indigo" label="Prof. Centro de Gravidade" symbol="h_cg_down" formula="h_down / 2" substitution={`${analyzedResults.normalizedInputs.downstreamLevel.toFixed(2)} / 2`} result={(analyzedResults.normalizedInputs.downstreamLevel / 2).toFixed(2)} unit="m" />
                                <CalculationLine theme="indigo" label="Força Resultante (Jusante)" symbol="FR_down" formula="γ · h_cg_down · A_down" substitution={`${(density * gravity).toFixed(0)} · ${(analyzedResults.normalizedInputs.downstreamLevel / 2).toFixed(2)} · ${analyzedResults.forceData.down?.area?.toFixed(2) || '0.00'}`} result={(analyzedResults.forceData.down?.FR / 1000).toFixed(2) || '0.00'} unit="kN/m" />
                                <CalculationLine theme="indigo" label="Centro de Pressão (Jusante)" symbol="y_cp_down" formula="h_down / 3" substitution={`${analyzedResults.normalizedInputs.downstreamLevel.toFixed(2)} / 3`} result={analyzedResults.forceData.down?.y_cp?.toFixed(2) || '0.00'} unit="m" />
                            </>
                        )}
                    </div>
                </section>

                <section>
                    <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <div className="w-6 h-px bg-cyan-200"></div> Força Líquida Resultante <div className="flex-1 h-px bg-slate-100"></div>
                    </h4>
                    <div className="bg-cyan-50/30 p-6 rounded-2xl border border-cyan-100/50 space-y-2">
                        <CalculationLine theme="cyan" label="Força Resultante Líquida" symbol="FR_net" formula="FR_up - FR_down" substitution={`${(analyzedResults.forceData.up.FR / 1000).toFixed(2)} - ${(analyzedResults.forceData.down?.FR ? (analyzedResults.forceData.down.FR / 1000).toFixed(2) : '0.00')}`} result={(analyzedResults.forceData.FR_net / 1000).toFixed(2)} unit="kN/m" isSubHeader />
                        <CalculationLine theme="cyan" label="Centro de Pressão Líquido" symbol="y_cp_net" formula="ΣM / FR_net" substitution={`${(analyzedResults.forceData.moment_total / 1000).toFixed(2)} / ${(analyzedResults.forceData.FR_net / 1000).toFixed(2)}`} result={analyzedResults.forceData.y_cp_net.toFixed(2)} unit="m" />
                    </div>
                </section>

                {analyzedResults.stabilityData && (
                    <section>
                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <div className="w-6 h-px bg-emerald-200"></div> Análise de Estabilidade <div className="flex-1 h-px bg-slate-100"></div>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-0 bg-white shadow-sm p-6 rounded-2xl border border-emerald-100/50">
                                <CalculationLine theme="emerald" isSubHeader label="Tombamento" symbol="Overturning" result="" unit="" />
                                <CalculationLine theme="emerald" label="Braço de Alavanca (Peso)" symbol="x_cg" result={analyzedResults.stabilityData.x_cg.toFixed(2)} unit="m" />
                                <CalculationLine theme="emerald" label="Momento Estabilizante" symbol="M_est" formula="W · x_cg" substitution={`${(analyzedResults.stabilityData.weight / 1000).toFixed(2)} · ${analyzedResults.stabilityData.x_cg.toFixed(2)}`} result={(analyzedResults.stabilityData.moment_resisting / 1000).toFixed(2)} unit="kN·m/m" />
                                <CalculationLine theme="emerald" label="Momento Tombador" symbol="M_tomb" formula="FR_net · y_cp_net" substitution={`${(analyzedResults.forceData.FR_net / 1000).toFixed(2)} · ${analyzedResults.forceData.y_cp_net.toFixed(2)}`} result={(analyzedResults.stabilityData.moment_overturning / 1000).toFixed(2)} unit="kN·m/m" />
                                <CalculationLine theme="emerald" label="Fator de Segurança (Tomb.)" symbol="FS_tomb" formula="M_est / M_tomb" substitution={`${(analyzedResults.stabilityData.moment_resisting / 1000).toFixed(2)} / ${(analyzedResults.stabilityData.moment_overturning / 1000).toFixed(2)}`} result={analyzedResults.stabilityData.fs_tomb.toFixed(2)} unit="" isSubHeader />
                            </div>

                            <div className="flex flex-col gap-0 bg-white shadow-sm p-6 rounded-2xl border border-emerald-100/50">
                                <CalculationLine theme="emerald" isSubHeader label="Deslizamento" symbol="Sliding" result="" unit="" />
                                <CalculationLine theme="emerald" label="Coeficiente de Atrito" symbol="μ" result="0.65" unit="" />
                                <CalculationLine theme="emerald" label="Força Resistente" symbol="F_res" formula="μ · W" substitution={`0.65 · ${(analyzedResults.stabilityData.weight / 1000).toFixed(2)}`} result={((analyzedResults.stabilityData.weight * 0.65) / 1000).toFixed(2)} unit="kN/m" />
                                <CalculationLine theme="emerald" label="Fator de Segurança (Desl.)" symbol="FS_desl" formula="F_res / FR_net" substitution={`${((analyzedResults.stabilityData.weight * 0.65) / 1000).toFixed(2)} / ${(analyzedResults.forceData.FR_net / 1000).toFixed(2)}`} result={analyzedResults.stabilityData.fs_desl.toFixed(2)} unit="" isSubHeader />
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    </div>
  );
};
