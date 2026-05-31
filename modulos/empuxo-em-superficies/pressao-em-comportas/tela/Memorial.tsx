import React from 'react';
import { FileText } from 'lucide-react';
import { FormaComporta } from '../dominio/tipos';

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
  analyzedResults: any;
  onClose: () => void;
  gateInclination: number;
  gateShape: FormaComporta;
}

export const Memorial: React.FC<MemorialProps> = ({
  analyzedResults, onClose, gateInclination, gateShape
}) => {
  if (!analyzedResults) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-blue-900/20 backdrop-blur-md animate-in fade-in duration-300">
       <div className="bg-white/95 backdrop-blur-xl w-[95vw] lg:w-[75vw] h-[95vh] lg:h-[75vh] overflow-y-auto rounded-3xl shadow-2xl border border-blue-100 animate-in slide-in-from-bottom-10 zoom-in-95 duration-300 relative">
           <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-blue-50 p-6 flex items-center justify-between z-10">
               <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 tracking-tight">
                   <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200"><FileText className="w-5 h-5" /></div> 
                   Memorial de Cálculo
               </h3>
               <button onClick={onClose} className="text-[10px] font-black text-slate-400 hover:text-blue-600 px-4 py-2 hover:bg-blue-50 rounded-xl transition-all uppercase tracking-widest">Fechar</button>
           </div>
           
           <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-white">
               <div className="space-y-10">
                   <section>
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><div className="w-6 h-px bg-slate-200"></div> Geometria da Área Molhada (Montante) <div className="flex-1 h-px bg-slate-100"></div></h4>
                       <div className="flex flex-col gap-0 bg-white shadow-sm p-6 rounded-2xl border border-slate-100">
                           <CalculationLine theme="slate" label="Ângulo da Comporta (θ)" symbol="θ" result={gateInclination.toString()} unit="°" />
                           <CalculationLine theme="slate" label="Formato" symbol="Shape" result={gateShape} unit="" />
                           <CalculationLine theme="slate" label="Comprimento Molhado (L)" symbol={<>L<sub>wet</sub></>} result={analyzedResults.forceData.up.wetLength.toFixed(3)} unit="m" />
                           <CalculationLine theme="slate" label="Área (A)" symbol="A" result={analyzedResults.forceData.up.area.toFixed(3)} unit="m²" />
                       </div>
                   </section>

                   <section>
                       <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-6 flex items-center gap-2"><div className="w-6 h-px bg-blue-200"></div> Pressão e Força (Montante) <div className="flex-1 h-px bg-slate-100"></div></h4>
                       <div className="flex flex-col gap-0 bg-white shadow-sm p-6 rounded-2xl border border-slate-100">
                           <CalculationLine theme="blue" label="Profundidade do Centróide" symbol={<>h<sub>cg</sub></>} result={analyzedResults.forceData.up.h_cg.toFixed(3)} unit="m" />
                           <CalculationLine theme="blue"
                                label="Força Resultante" symbol={<>F<sub>R</sub></>} 
                                formula={<>P<sub>cg</sub> · A</>} 
                                substitution={`${((analyzedResults.forceData.up.h_cg * 9810)/1000).toFixed(2)} · ${analyzedResults.forceData.up.area.toFixed(2)}`} 
                                result={(analyzedResults.forceData.up.FR/1000).toFixed(3)} unit="kN" isSubHeader
                           />
                       </div>
                   </section>

                   <section>
                       <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-6 flex items-center gap-2"><div className="w-6 h-px bg-cyan-200"></div> Ponto de Aplicação (Centro de Pressão) <div className="flex-1 h-px bg-slate-100"></div></h4>
                       <div className="flex flex-col gap-0 bg-white shadow-sm p-6 rounded-2xl border border-slate-100">
                           <CalculationLine theme="cyan" label="Posição do Centróide (inclinado)" symbol={<>s<sub>cg</sub></>} result={analyzedResults.forceData.up.s_cg.toFixed(3)} unit="m" />
                           <CalculationLine theme="cyan"
                                label="Posição do CP (inclinado)" symbol={<>s<sub>cp</sub></>}
                                result={analyzedResults.forceData.up.s_cp.toFixed(3)} unit="m" 
                           />
                           <CalculationLine theme="cyan"
                                label="Profundidade Vertical do CP" symbol={<>h<sub>cp</sub></>} 
                                formula={<>s<sub>cp</sub> · sin(θ)</>}
                                substitution={`${analyzedResults.forceData.up.s_cp.toFixed(3)} · sin(${gateInclination}°)`}
                                result={analyzedResults.forceData.up.h_cp.toFixed(3)} unit="m" isSubHeader
                           />
                       </div>
                   </section>

                   {analyzedResults.forceData.down.FR > 0 && (
                     <section>
                         <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-6 flex items-center gap-2"><div className="w-6 h-px bg-indigo-200"></div> Jusante e Força Líquida <div className="flex-1 h-px bg-slate-100"></div></h4>
                         <div className="flex flex-col gap-0 bg-white shadow-sm p-6 rounded-2xl border border-slate-100">
                             <CalculationLine theme="indigo" label="Força (Jusante)" symbol={<>F<sub>R,jus</sub></>} result={(analyzedResults.forceData.down.FR/1000).toFixed(3)} unit="kN" />
                             <CalculationLine theme="indigo" label="Posição CP (Jusante)" symbol={<>s<sub>cp,jus</sub></>} result={analyzedResults.forceData.down.s_cp.toFixed(3)} unit="m" />
                             <CalculationLine theme="indigo"
                                  label="Força Resultante Líquida" symbol={<>F<sub>R,net</sub></>} 
                                  formula={<>F<sub>R,mon</sub> - F<sub>R,jus</sub></>}
                                  substitution={`${(analyzedResults.forceData.up.FR/1000).toFixed(3)} - ${(analyzedResults.forceData.down.FR/1000).toFixed(3)}`}
                                  result={(analyzedResults.forceData.FR_net/1000).toFixed(3)} unit="kN" isSubHeader
                             />
                             <CalculationLine theme="indigo"
                                  label="Posição CP Líquido" symbol={<>s<sub>cp,net</sub></>} 
                                  result={analyzedResults.forceData.s_cp_net.toFixed(3)} unit="m" isSubHeader
                             />
                         </div>
                     </section>
                   )}

                   {(analyzedResults.equilibrium.M_hinge > 0 || analyzedResults.equilibrium.F_tie > 0) && (
                     <section>
                         <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-6 flex items-center gap-2"><div className="w-6 h-px bg-purple-200"></div> Equilíbrio <div className="flex-1 h-px bg-slate-100"></div></h4>
                         <div className="flex flex-col gap-0 bg-white shadow-sm p-6 rounded-2xl border border-slate-100">
                             {analyzedResults.equilibrium.M_hinge > 0 && (
                               <CalculationLine theme="purple"
                                    label="Momento no Apoio" symbol={<>M<sub>hinge</sub></>} 
                                    result={(analyzedResults.equilibrium.M_hinge/1000).toFixed(3)} unit="kN·m" 
                               />
                             )}
                             {analyzedResults.equilibrium.F_tie > 0 && (
                               <CalculationLine theme="purple"
                                    label="Força no Tirante" symbol={<>F<sub>tie</sub></>} 
                                    result={(analyzedResults.equilibrium.F_tie/1000).toFixed(3)} unit="kN" 
                                    isSubHeader
                               />
                             )}
                         </div>
                     </section>
                   )}
               </div>
           </div>
       </div>
    </div>
  );
};
