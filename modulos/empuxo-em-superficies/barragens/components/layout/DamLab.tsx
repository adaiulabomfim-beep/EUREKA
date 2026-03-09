import React, { useState, useEffect } from 'react';
import { Layers, Construction, Calculator, FileText, RotateCw, MoveVertical, Maximize, AlertCircle, ArrowDown } from 'lucide-react';
import { DamType } from '../../core/types/DamType';
import { DamSimulationConfig } from '../../core/interfaces/DamSimulationConfig';
import { useDamSimulation } from '../../hooks/useDamSimulation';
import { DamRenderer } from '../scene/DamRenderer';
import { ResultsPanel, ResultsCard } from '../../../../../components/ResultsPanel';
import { DAM_PRESETS } from '../../core/shared/presets';
import { damTypeRegistry } from '../../registry/damTypeRegistry';

interface DamLabProps {
    onContextUpdate?: (ctx: string) => void;
}

const NumberInput: React.FC<{
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: string;
  disabled?: boolean;
}> = ({ value, onChange, min, max, step = "0.1", disabled }) => {
  const [localValue, setLocalValue] = useState<string>(value.toString());

  useEffect(() => {
    const parsed = parseFloat(localValue);
    if (!isNaN(parsed) && parsed === value) return;
    if (localValue === '' && value === 0) return;
    setLocalValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalValue(newVal);
    if (newVal === '') { onChange(0); return; }
    const parsed = parseFloat(newVal);
    if (!isNaN(parsed)) onChange(parsed);
  };

  const handleBlur = () => {
      let parsed = parseFloat(localValue);
      if (isNaN(parsed)) parsed = 0;
      let clamped = parsed;
      if (min !== undefined && clamped < min) clamped = min;
      if (max !== undefined && clamped > max) clamped = max;
      if (clamped !== parsed || localValue === '') {
          setLocalValue(clamped.toString());
          onChange(clamped);
      }
  };

  return (
    <input
      type="number"
      step={step}
      min={min}
      max={max}
      className="w-full h-9 px-3 border border-blue-100 rounded-lg text-sm bg-white/70 text-slate-800 font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
    />
  );
};

const CalculationLine: React.FC<{
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

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-blue-50">
        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">{icon}</div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h3>
    </div>
);

export const DamLab: React.FC<DamLabProps> = ({ onContextUpdate }) => {
  // STATE
  const [damType, setDamType] = useState<DamType>(DamType.GRAVITY);
  const [damHeight, setDamHeight] = useState<number>(15);
  const [damCrestWidth, setDamCrestWidth] = useState<number>(4);
  const [damBaseWidth, setDamBaseWidth] = useState<number>(12); 
  const [inclinationAngle, setInclinationAngle] = useState<number>(90);
  
  const [upstreamLevel, setUpstreamLevel] = useState<number>(12);
  const [hasDownstream, setHasDownstream] = useState<boolean>(false);
  const [downstreamLevel, setDownstreamLevel] = useState<number>(5); 
  
  const [density] = useState<number>(1000); 
  const [gravity] = useState<number>(9.81);

  // UI STATE
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [analyzedResults, setAnalyzedResults] = useState<ReturnType<typeof useDamSimulation> | null>(null);

  // LOGIC
  useEffect(() => {
    const defaults = damTypeRegistry[damType].getDefaults(damHeight);
    setInclinationAngle(defaults.inclinationAngle);
    setDamBaseWidth(defaults.damBaseWidth);
    setDamCrestWidth(defaults.damCrestWidth);
  }, [damType]); 

  const maxWaterLevel = damHeight + 5; 

  const effectiveDownstreamLevel = hasDownstream ? downstreamLevel : 0;
  
  const config: DamSimulationConfig = {
      damType, damHeight, damBaseWidth, damCrestWidth, inclinationAngle,
      upstreamLevel, downstreamLevel: effectiveDownstreamLevel, density, gravity
  };
  
  const liveResults = useDamSimulation(config);

  useEffect(() => { setAnalyzedResults(null); }, [liveResults]);
  const handleCalculate = () => { setAnalyzedResults(liveResults); };

  useEffect(() => {
      if (onContextUpdate) {
          onContextUpdate(`LABORATÓRIO DE HIDROSTÁTICA: Barragem: ${damType}, H=${damHeight}m, Largura Base=${damBaseWidth}m, Largura Crista=${damCrestWidth}m, θ=${inclinationAngle}°, Nível Montante=${upstreamLevel}m, Nível Jusante=${effectiveDownstreamLevel}m`);
      }
  }, [analyzedResults, onContextUpdate, damType, damHeight, damBaseWidth, damCrestWidth, inclinationAngle, upstreamLevel, effectiveDownstreamLevel]);

  const labelClass = "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5";
  const selectClass = "w-full h-9 px-3 border border-blue-100 rounded-lg text-sm bg-blue-50/30 text-slate-800 font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm cursor-pointer hover:bg-white";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[800px]">
        
        {/* --- LEFT SIDEBAR: CONTROLS --- */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
             
             {/* Dam Properties */}
             <div className="bg-white/75 backdrop-blur-md border border-blue-100/70 p-5 rounded-2xl shadow-xl shadow-blue-200/20">
                 <SectionHeader icon={<Construction className="w-4 h-4" />} title="Estrutura da Barragem" />
                 <div className="space-y-4">
                     <div>
                         <label className={labelClass}>Tipo de Barragem</label>
                         <select className={selectClass} value={damType} onChange={(e) => setDamType(e.target.value as DamType)}>
                             <option value={DamType.GRAVITY}>Gravidade</option>
                             <option value={DamType.EMBANKMENT}>Terra / Enrocamento</option>
                             <option value={DamType.ARCH}>Arco</option>
                             <option value={DamType.BUTTRESS}>Contraforte</option>
                         </select>
                     </div>
                     <div>
                        <label className={labelClass}>Inclinação da Face (θ)</label>
                        <NumberInput value={inclinationAngle} min={1} max={160} onChange={setInclinationAngle} />
                     </div>
                     <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100/50 space-y-3">
                        <div>
                            <label className={labelClass}>Altura Total (m)</label>
                            <NumberInput value={damHeight} min={1} max={200} onChange={setDamHeight} />
                        </div>
                        <div>
                            <label className={labelClass}>Largura da Base (m)</label>
                            <NumberInput value={damBaseWidth} min={1} max={200} onChange={setDamBaseWidth} />
                        </div>
                        <div>
                            <label className={labelClass}>Largura da Crista (m)</label>
                            <NumberInput value={damCrestWidth} min={0} max={100} onChange={setDamCrestWidth} />
                        </div>
                     </div>
                 </div>
             </div>

             {/* Water Levels */}
             <div className="bg-white/75 backdrop-blur-md border border-blue-100/70 p-5 rounded-2xl shadow-xl shadow-blue-200/20 flex-1">
                 <SectionHeader icon={<Layers className="w-4 h-4" />} title="Níveis D'água" />
                 <div className="space-y-4">
                     <div>
                        <label className={labelClass}>Montante (m)</label>
                        <NumberInput min={0} max={maxWaterLevel} value={upstreamLevel} onChange={setUpstreamLevel} />
                     </div>
                     
                     <div className="pt-3 border-t border-blue-50">
                        <div className="flex items-center justify-between cursor-pointer mb-3 hover:opacity-80" onClick={() => setHasDownstream(!hasDownstream)}>
                            <label className={`${labelClass} cursor-pointer mb-0`}>Jusante (Saída)</label>
                            <input type="checkbox" checked={hasDownstream} onChange={(e) => setHasDownstream(e.target.checked)} className="accent-blue-600 w-4 h-4 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                        </div>
                        
                        {hasDownstream && (
                            <div className="animate-in slide-in-from-top-1 fade-in">
                                <label className={labelClass}>Nível Jusante (m)</label>
                                <NumberInput min={0} max={maxWaterLevel} value={downstreamLevel} onChange={setDownstreamLevel} />
                            </div>
                        )}
                     </div>
                 </div>
             </div>
        </div>

        {/* --- CENTER: SCENE --- */}
        <div className="lg:col-span-6 flex flex-col h-full bg-slate-50 rounded-3xl border border-blue-100/50 overflow-hidden relative shadow-2xl shadow-blue-200/20">
             <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 z-10"></div>
            <DamRenderer
                key={damType}
                damType={damType} damHeight={damHeight} damBaseWidth={damBaseWidth} damCrestWidth={damCrestWidth}
                inclinationAngle={inclinationAngle} upstreamLevel={upstreamLevel} downstreamLevel={effectiveDownstreamLevel}
                force={analyzedResults ? analyzedResults.forceData.FR_net : 0} 
                s_cp={analyzedResults ? analyzedResults.forceData.s_cp_net : 0}
                y_cp={analyzedResults ? analyzedResults.forceData.y_cp_net : 0}
                up={analyzedResults ? analyzedResults.forceData.up : undefined}
                down={analyzedResults ? analyzedResults.forceData.down : undefined}
                isAnalyzed={!!analyzedResults}
                onCalculate={handleCalculate}
                onReset={() => setAnalyzedResults(null)}
            />
             <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-200/50 to-transparent pointer-events-none"></div>
        </div>

        {/* --- RIGHT SIDEBAR: RESULTS --- */}
        <div className="lg:col-span-3 flex flex-col gap-4 h-full">
          <ResultsPanel
            footerButton={{
              label: showDetails ? 'Ocultar Memória' : 'Memória de Cálculo',
              onClick: () => setShowDetails(!showDetails),
              icon: Calculator,
              disabled: !analyzedResults,
            }}
          >
            {analyzedResults ? (
              <>
                {/* Hydrostatic Force Card */}
                <ResultsCard
                  title="Força Hidrostática Resultante"
                  value={(Math.abs(analyzedResults.forceData.FR_net) / 1000).toFixed(2)}
                  unit="kN/m"
                  theme="blue"
                  icon={ArrowDown}
                />

                {/* Center of Pressure Depth */}
                <ResultsCard
                  title="Centro de Pressão (CP)"
                  value={analyzedResults.forceData.s_cp_net.toFixed(2)}
                  unit="m"
                  theme="cyan"
                  icon={MoveVertical}
                  secondaryValue="Posição ao longo da face (da superfície)"
                />

                {/* Geometry Properties */}
                <ResultsCard
                  title="Área Molhada (Montante)"
                  value={analyzedResults.forceData.up.area.toFixed(2)}
                  unit="m²/m"
                  theme="slate"
                  icon={Maximize}
                />
                
                <ResultsCard
                  title="Área Molhada (Jusante)"
                  value={analyzedResults.forceData.down.area.toFixed(2)}
                  unit="m²/m"
                  theme="slate"
                  icon={Maximize}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 p-4 py-20">
                <div className="bg-blue-50 p-4 rounded-full mb-3">
                  <AlertCircle className="w-8 h-8 text-blue-400" />
                </div>
                <h4 className="text-sm font-black text-slate-600 tracking-tight">Aguardando análise</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px] font-medium">
                  Configure os parâmetros e clique em "Analisar" na área central.
                </p>
              </div>
            )}
          </ResultsPanel>
        </div>
      </div>

      {/* Floating Details Panel */}
      {showDetails && analyzedResults && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-blue-900/20 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white/95 backdrop-blur-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl shadow-2xl border border-blue-100 animate-in slide-in-from-bottom-10 zoom-in-95 duration-300">
               <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-blue-50 p-6 flex items-center justify-between z-10">
                   <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 tracking-tight">
                       <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200"><FileText className="w-5 h-5" /></div> 
                       Memorial de Cálculo
                   </h3>
                   <button onClick={() => setShowDetails(false)} className="text-[10px] font-black text-slate-400 hover:text-blue-600 px-4 py-2 hover:bg-blue-50 rounded-xl transition-all uppercase tracking-widest">Fechar</button>
               </div>
               
               <div className="p-8 space-y-10">
                   <section>
                       <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2"><div className="w-6 h-px bg-blue-100"></div> Geometria da Área Molhada (Montante) <div className="flex-1 h-px bg-blue-50"></div></h4>
                       <div className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100/50">
                           <CalculationLine label="Inclinação da Face (θ)" symbol="θ" result={inclinationAngle.toString()} unit="°" />
                           <CalculationLine label="Comprimento Molhado (L)" symbol={<>L<sub>wet</sub></>} result={analyzedResults.forceData.up.wetLength.toFixed(3)} unit="m" />
                           <CalculationLine label="Área Molhada (A)" symbol="A" result={analyzedResults.forceData.up.area.toFixed(3)} unit="m²/m" />
                       </div>
                   </section>

                   <section>
                       <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2"><div className="w-6 h-px bg-blue-200"></div> Pressão e Força (Montante) <div className="flex-1 h-px bg-blue-50"></div></h4>
                       <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50">
                           <CalculationLine label="Profundidade do Centróide" symbol={<>h<sub>cg</sub></>} result={analyzedResults.forceData.up.h_cg.toFixed(3)} unit="m" />
                           <CalculationLine 
                                label="Força Resultante" symbol={<>F<sub>R</sub></>} 
                                formula={<>γ · h<sub>cg</sub> · A</>} 
                                substitution={`${(9.81).toFixed(2)} · ${analyzedResults.forceData.up.h_cg.toFixed(2)} · ${analyzedResults.forceData.up.area.toFixed(2)}`} 
                                result={(analyzedResults.forceData.up.FR/1000).toFixed(3)} unit="kN/m" isSubHeader
                           />
                       </div>
                   </section>

                   <section>
                       <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-2"><div className="w-6 h-px bg-cyan-200"></div> Ponto de Aplicação (Centro de Pressão) <div className="flex-1 h-px bg-blue-50"></div></h4>
                       <div className="bg-cyan-50/30 p-6 rounded-2xl border border-cyan-100/50">
                           <CalculationLine label="Posição do Centróide (ao longo da face)" symbol={<>s<sub>cg</sub></>} result={analyzedResults.forceData.up.s_cg.toFixed(3)} unit="m" />
                           <CalculationLine 
                                label="Posição do CP (ao longo da face)" symbol={<>s<sub>cp</sub></>}
                                result={analyzedResults.forceData.up.s_cp.toFixed(3)} unit="m" 
                           />
                           
                           <div className="mt-4 pt-4 border-t border-cyan-100">
                               <CalculationLine 
                                    label="Profundidade Vertical do CP" symbol={<>h<sub>cp</sub></>} 
                                    formula={<>h<sub>cg</sub> + I<sub>G</sub>·sin²(θ)/(A·h<sub>cg</sub>)</>}
                                    result={analyzedResults.forceData.up.h_cp.toFixed(3)} unit="m" isSubHeader
                               />
                           </div>
                       </div>
                   </section>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};
