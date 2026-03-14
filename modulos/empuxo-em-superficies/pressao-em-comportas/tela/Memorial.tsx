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
       <div className="bg-white/95 backdrop-blur-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl shadow-2xl border border-blue-100 animate-in slide-in-from-bottom-10 zoom-in-95 duration-300">
           <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-blue-50 p-6 flex items-center justify-between z-10">
               <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 tracking-tight">
                   <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200"><FileText className="w-5 h-5" /></div> 
                   Memorial de Cálculo
               </h3>
               <button onClick={onClose} className="text-[10px] font-black text-slate-400 hover:text-blue-600 px-4 py-2 hover:bg-blue-50 rounded-xl transition-all uppercase tracking-widest">Fechar</button>
           </div>
           
           <div className="p-8 space-y-10">
               <section>
                   <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2"><div className="w-6 h-px bg-blue-100"></div> Geometria da Área Molhada (Montante) <div className="flex-1 h-px bg-blue-50"></div></h4>
                   <div className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100/50">
                       <CalculationLine label="Ângulo da Comporta (θ)" symbol="θ" result={gateInclination.toString()} unit="°" />
                       <CalculationLine label="Formato" symbol="Shape" result={gateShape} unit="" />
                       <CalculationLine label="Comprimento Molhado (L)" symbol={<>L<sub>wet</sub></>} result={analyzedResults.forceData.up.wetLength.toFixed(3)} unit="m" />
                       <CalculationLine label="Área (A)" symbol="A" result={analyzedResults.forceData.up.area.toFixed(3)} unit="m²" />
                   </div>
               </section>

               <section>
                   <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2"><div className="w-6 h-px bg-blue-200"></div> Pressão e Força (Montante) <div className="flex-1 h-px bg-blue-50"></div></h4>
                   <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50">
                       <CalculationLine label="Profundidade do Centróide" symbol={<>h<sub>cg</sub></>} result={analyzedResults.forceData.up.h_cg.toFixed(3)} unit="m" />
                       <CalculationLine 
                            label="Força Resultante" symbol={<>F<sub>R</sub></>} 
                            formula={<>P<sub>cg</sub> · A</>} 
                            substitution={`${((analyzedResults.forceData.up.h_cg * 9810)/1000).toFixed(2)} · ${analyzedResults.forceData.up.area.toFixed(2)}`} 
                            result={(analyzedResults.forceData.up.FR/1000).toFixed(3)} unit="kN" isSubHeader
                       />
                   </div>
               </section>

               <section>
                   <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-2"><div className="w-6 h-px bg-cyan-200"></div> Ponto de Aplicação (Centro de Pressão) <div className="flex-1 h-px bg-blue-50"></div></h4>
                   <div className="bg-cyan-50/30 p-6 rounded-2xl border border-cyan-100/50">
                       <CalculationLine label="Posição do Centróide (inclinado)" symbol={<>s<sub>cg</sub></>} result={analyzedResults.forceData.up.s_cg.toFixed(3)} unit="m" />
                       <CalculationLine 
                            label="Posição do CP (inclinado)" symbol={<>s<sub>cp</sub></>}
                            result={analyzedResults.forceData.up.s_cp.toFixed(3)} unit="m" 
                       />
                       
                       <div className="mt-4 pt-4 border-t border-cyan-100">
                           <CalculationLine 
                                label="Profundidade Vertical do CP" symbol={<>h<sub>cp</sub></>} 
                                formula={<>s<sub>cp</sub> · sin(θ)</>}
                                result={analyzedResults.forceData.up.h_cp.toFixed(3)} unit="m" isSubHeader
                           />
                       </div>
                   </div>
               </section>

               {analyzedResults.forceData.down.FR > 0 && (
                 <section>
                     <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2"><div className="w-6 h-px bg-indigo-200"></div> Jusante e Força Líquida <div className="flex-1 h-px bg-blue-50"></div></h4>
                     <div className="bg-indigo-50/30 p-6 rounded-2xl border border-indigo-100/50">
                         <CalculationLine label="Força (Jusante)" symbol={<>F<sub>R,jus</sub></>} result={(analyzedResults.forceData.down.FR/1000).toFixed(3)} unit="kN" />
                         <CalculationLine label="Posição CP (Jusante)" symbol={<>s<sub>cp,jus</sub></>} result={analyzedResults.forceData.down.s_cp.toFixed(3)} unit="m" />
                         
                         <div className="mt-4 pt-4 border-t border-indigo-100">
                             <CalculationLine 
                                  label="Força Resultante Líquida" symbol={<>F<sub>R,net</sub></>} 
                                  formula={<>F<sub>R,mon</sub> - F<sub>R,jus</sub></>}
                                  result={(analyzedResults.forceData.FR_net/1000).toFixed(3)} unit="kN" isSubHeader
                             />
                             <CalculationLine 
                                  label="Posição CP Líquido" symbol={<>s<sub>cp,net</sub></>} 
                                  result={analyzedResults.forceData.s_cp_net.toFixed(3)} unit="m" isSubHeader
                             />
                         </div>
                     </div>
                 </section>
               )}

               {(analyzedResults.equilibrium.M_hinge > 0 || analyzedResults.equilibrium.F_tie > 0) && (
                 <section>
                     <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-6 flex items-center gap-2"><div className="w-6 h-px bg-purple-200"></div> Equilíbrio <div className="flex-1 h-px bg-blue-50"></div></h4>
                     <div className="bg-purple-50/30 p-6 rounded-2xl border border-purple-100/50">
                         {analyzedResults.equilibrium.M_hinge > 0 && (
                           <CalculationLine 
                                label="Momento no Apoio" symbol={<>M<sub>hinge</sub></>} 
                                result={(analyzedResults.equilibrium.M_hinge/1000).toFixed(3)} unit="kN·m" 
                           />
                         )}
                         {analyzedResults.equilibrium.F_tie > 0 && (
                           <CalculationLine 
                                label="Força no Tirante" symbol={<>F<sub>tie</sub></>} 
                                result={(analyzedResults.equilibrium.F_tie/1000).toFixed(3)} unit="kN" 
                           />
                         )}
                     </div>
                 </section>
               )}
           </div>
       </div>
    </div>
  );
};
