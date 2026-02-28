import React, { useState, useEffect } from 'react';
import { Layers, Square, Info, BookOpen, Construction, Calculator, FileText, RotateCw, MoveVertical, Maximize, AlertCircle, Circle, CircleDashed } from 'lucide-react';
import { DamType, GateShape, HingePosition, SimulationConfig } from '../../types';
import { useGatePressureSimulation } from '../../hooks/useGatePressureSimulation';
import { GatePressureScene } from '../scene/GatePressureScene';
import { PRESETS } from '../../presets';

interface GatePressureLabProps {
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

export const GatePressureLab: React.FC<GatePressureLabProps> = ({ onContextUpdate }) => {
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

  // GATE CONFIG
  const [hasGate, setHasGate] = useState<boolean>(true);
  const [gateShape, setGateShape] = useState<GateShape>(GateShape.RECTANGULAR);
  const [gateWidth, setGateWidth] = useState<number>(2); 
  const [gateHeight, setGateHeight] = useState<number>(3); 
  const [gateDepthFromCrest, setGateDepthFromCrest] = useState<number>(4);
  const [gateInclination, setGateInclination] = useState<number>(90);
  const [syncGateAngle, setSyncGateAngle] = useState<boolean>(true);
  
  const [hingePosition, setHingePosition] = useState<HingePosition>(HingePosition.NONE);
  const [hasTieRod, setHasTieRod] = useState<boolean>(false);
  const [tieRodPosRel, setTieRodPosRel] = useState<number>(1);
  const [tieRodAngle, setTieRodAngle] = useState<number>(0);
  
  const [gateWeight, setGateWeight] = useState<number>(500);
  const [gateWeightEnabled, setGateWeightEnabled] = useState<boolean>(false);

  // UI STATE
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [analyzedResults, setAnalyzedResults] = useState<ReturnType<typeof useGatePressureSimulation> | null>(null);

  // LOGIC
  useEffect(() => {
    switch (damType) {
        case DamType.GRAVITY: setInclinationAngle(90); setDamBaseWidth(damHeight * 0.8); setDamCrestWidth(4); break;
        case DamType.EMBANKMENT: setInclinationAngle(45); setDamBaseWidth(damHeight * 3); setDamCrestWidth(6); break;
        case DamType.ARCH: setInclinationAngle(90); setDamBaseWidth(5); setDamCrestWidth(3); break;
        case DamType.BUTTRESS: setInclinationAngle(70); setDamBaseWidth(damHeight * 0.9); setDamCrestWidth(2); break;
    }
  }, [damType]); 
  
  // Force sync when inclination changes if toggle is on
  useEffect(() => { 
      if (syncGateAngle) {
          setGateInclination(inclinationAngle); 
      }
  }, [inclinationAngle, syncGateAngle]);

  const maxGateHeight = Math.max(0.1, damHeight - gateDepthFromCrest);
  const maxWaterLevel = damHeight + 5; 

  // Handler for toggling gate
  const toggleGate = (active: boolean) => {
      setHasGate(active);
      if (active) {
          // Quando ativa a comporta:
          // 1. Sincroniza o ângulo com a barragem automaticamente
          setSyncGateAngle(true);
          setGateInclination(inclinationAngle);
          
          // 2. Ativa automaticamente a Jusante (saída da água)
          setHasDownstream(true);
          if (downstreamLevel === 0) {
              setDownstreamLevel(3); // Valor padrão visível
          }
      }
  };

  const loadExercise6 = () => {
      const preset = PRESETS.exercise30;
      setDamType(preset.damType); setDamHeight(preset.damHeight); setUpstreamLevel(preset.upstreamLevel); 
      setInclinationAngle(preset.inclinationAngle); setDamCrestWidth(preset.damCrestWidth);
      setHasGate(preset.hasGate); setGateShape(preset.gateShape);
      setGateWidth(preset.gateWidth); setGateHeight(preset.gateLength); setGateDepthFromCrest(preset.gateDepthFromCrest);
      setSyncGateAngle(true); setGateInclination(preset.gateInclination);
      setHasDownstream(preset.downstreamLevel > 0); setDownstreamLevel(preset.downstreamLevel);
      setHingePosition(preset.hingePosition);
      setHasTieRod(preset.hasTieRod);
      setTieRodPosRel(preset.tieRodPosRel);
      setTieRodAngle(preset.tieRodAngle);
      setGateWeight(preset.gateWeight);
      setGateWeightEnabled(preset.gateWeightEnabled);
  };

  const effectiveDownstreamLevel = hasDownstream ? downstreamLevel : 0;
  
  const config: SimulationConfig = {
      damType, damHeight, damBaseWidth, damCrestWidth, inclinationAngle,
      upstreamLevel, downstreamLevel: effectiveDownstreamLevel, density, gravity,
      hasGate, gateShape, gateWidth, gateLength: gateHeight, gateDepthFromCrest, gateInclination,
      hingePosition, hasTieRod, tieRodPosRel, tieRodAngle,
      gateWeight, gateWeightEnabled
  };
  
  const liveResults = useGatePressureSimulation(config);

  useEffect(() => { setAnalyzedResults(null); }, [liveResults]);
  const handleCalculate = () => { setAnalyzedResults(liveResults); };

  useEffect(() => {
      if (onContextUpdate && analyzedResults) {
          onContextUpdate(`LABORATÓRIO DE HIDROSTÁTICA: Comporta: ${gateShape}, H=${gateHeight}m, Larg=${gateWidth}m, θ=${gateInclination}°, Força Hidrostática Resultante: ${(analyzedResults.forceData.FR_net/1000).toFixed(2)} kN, CP ao longo da comporta: ${(analyzedResults.forceData.s_cp_net).toFixed(2)}m`);
      }
  }, [analyzedResults, onContextUpdate, gateHeight, gateWidth, gateInclination, gateShape]);

  // Handle Dimensions based on shape
  const handleHeightChange = (val: number) => {
      setGateHeight(val);
      if (gateShape === GateShape.CIRCULAR) { setGateWidth(val); }
      if (gateShape === GateShape.SEMI_CIRCULAR) { setGateWidth(val * 2); }
  };

  const handleShapeChange = (newShape: GateShape) => {
      setGateShape(newShape);
      if (newShape === GateShape.CIRCULAR) { setGateWidth(gateHeight); }
      if (newShape === GateShape.SEMI_CIRCULAR) { setGateWidth(gateHeight * 2); }
  };

  const labelClass = "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5";
  const selectClass = "w-full h-9 px-3 border border-blue-100 rounded-lg text-sm bg-blue-50/30 text-slate-800 font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm cursor-pointer hover:bg-white";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[800px]">
        
        {/* --- LEFT SIDEBAR: CONTROLS --- */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
             
             {/* Exercise Card */}
             <div className="bg-white/75 backdrop-blur-md border border-blue-100/70 p-5 rounded-2xl shadow-xl shadow-blue-200/20">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Aula Prática</h3>
                </div>
                <div className="space-y-2">
                    <button onClick={loadExercise6} className="w-full group bg-white/50 hover:bg-blue-50 border border-blue-100 hover:border-blue-200 text-slate-600 p-3 rounded-xl shadow-sm hover:shadow-md transition-all text-left flex items-center gap-3 active:scale-95">
                        <div className="bg-blue-600 text-white p-2 rounded-lg font-mono text-xs font-bold group-hover:scale-110 transition-transform shadow-lg shadow-blue-200">#06</div>
                        <div>
                            <div className="text-sm font-black text-slate-800 group-hover:text-blue-700 tracking-tight">Exercício 30°</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Comporta Articulada</div>
                        </div>
                    </button>
                    <button onClick={() => {
                        const preset = PRESETS.default;
                        setDamType(preset.damType); setDamHeight(preset.damHeight); setUpstreamLevel(preset.upstreamLevel); 
                        setInclinationAngle(preset.inclinationAngle); setDamCrestWidth(preset.damCrestWidth);
                        setHasGate(preset.hasGate); setGateShape(preset.gateShape);
                        setGateWidth(preset.gateWidth); setGateHeight(preset.gateLength); setGateDepthFromCrest(preset.gateDepthFromCrest);
                        setSyncGateAngle(true); setGateInclination(preset.gateInclination);
                        setHasDownstream(preset.downstreamLevel > 0); setDownstreamLevel(preset.downstreamLevel);
                        setHingePosition(preset.hingePosition);
                        setHasTieRod(preset.hasTieRod);
                        setTieRodPosRel(preset.tieRodPosRel);
                        setTieRodAngle(preset.tieRodAngle);
                        setGateWeight(preset.gateWeight);
                        setGateWeightEnabled(preset.gateWeightEnabled);
                    }} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
                        <RotateCw className="w-3 h-3" /> Resetar Cenário
                    </button>
                </div>
             </div>

             {/* Dam Properties */}
             <div className="bg-white/75 backdrop-blur-md border border-blue-100/70 p-5 rounded-2xl shadow-xl shadow-blue-200/20">
                 <SectionHeader icon={<Construction className="w-4 h-4" />} title="Estrutura" />
                 <div className="space-y-4">
                     <div>
                        <label className={labelClass}>Inclinação da Parede (θ)</label>
                        <NumberInput value={inclinationAngle} min={1} max={160} onChange={setInclinationAngle} />
                     </div>
                     <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100/50 space-y-3">
                        <div>
                            <label className={labelClass}>Altura Total (m)</label>
                            <NumberInput value={damHeight} min={1} max={200} onChange={setDamHeight} />
                        </div>
                     </div>
                 </div>
             </div>

             {/* Gate Properties */}
             <div className="bg-white/75 backdrop-blur-md border border-blue-100/70 p-5 rounded-2xl shadow-xl shadow-blue-200/20">
                 <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-50 cursor-pointer hover:bg-blue-50/50 -mx-5 px-5 pt-2 transition-colors" onClick={() => toggleGate(!hasGate)}>
                     <div className="flex items-center gap-2 text-blue-700">
                         <div className="p-1 bg-blue-100 rounded-lg"><Square className="w-3.5 h-3.5" /></div>
                         <h3 className="text-[10px] font-black uppercase tracking-widest">Comporta</h3>
                     </div>
                     <input type="checkbox" checked={hasGate} onChange={(e) => toggleGate(e.target.checked)} className="accent-blue-600 w-4 h-4 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                 </div>
                 
                 {hasGate && (
                     <div className="space-y-5 animate-in slide-in-from-top-2 fade-in">
                         <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100/50 space-y-3">
                             <div>
                                <label className={labelClass}>Formato</label>
                                <div className="flex gap-2">
                                    <button onClick={() => handleShapeChange(GateShape.RECTANGULAR)} className={`flex-1 p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${gateShape === GateShape.RECTANGULAR ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-blue-100 text-slate-400 hover:bg-blue-50'}`}><Square className="w-4 h-4" /><span className="text-[9px] font-black uppercase tracking-wider">Retâng.</span></button>
                                    <button onClick={() => handleShapeChange(GateShape.CIRCULAR)} className={`flex-1 p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${gateShape === GateShape.CIRCULAR ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-blue-100 text-slate-400 hover:bg-blue-50'}`}><Circle className="w-4 h-4" /><span className="text-[9px] font-black uppercase tracking-wider">Circular</span></button>
                                    <button onClick={() => handleShapeChange(GateShape.SEMI_CIRCULAR)} className={`flex-1 p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${gateShape === GateShape.SEMI_CIRCULAR ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-blue-100 text-slate-400 hover:bg-blue-50'}`}><CircleDashed className="w-4 h-4 rotate-180" /><span className="text-[9px] font-black uppercase tracking-wider">Semi-Circ.</span></button>
                                </div>
                             </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>
                                        {gateShape === GateShape.CIRCULAR ? 'Diâmetro (m)' : gateShape === GateShape.SEMI_CIRCULAR ? 'Raio (m)' : 'Altura/Comp. (m)'}
                                    </label>
                                    <NumberInput value={gateHeight} onChange={handleHeightChange} min={0.1} max={maxGateHeight} />
                                </div>
                                <div>
                                    <label className={labelClass}>Largura (m)</label>
                                    <NumberInput value={gateWidth} min={0.1} max={100} onChange={setGateWidth} disabled={gateShape !== GateShape.RECTANGULAR} />
                                </div>
                            </div>
                            
                            <div>
                                <label className={labelClass}>Profundidade do Topo (da crista)</label>
                                <NumberInput value={gateDepthFromCrest} min={0} max={damHeight} onChange={setGateDepthFromCrest} />
                            </div>
                         </div>
                         
                         <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/60 space-y-4">
                            <h4 className="text-[9px] font-black text-blue-800/70 uppercase tracking-widest flex items-center gap-1 mb-2"><RotateCw className="w-3 h-3" /> Inclinação da Comporta</h4>
                            
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Acompanhar Barragem?</label>
                                    <button onClick={() => setSyncGateAngle(!syncGateAngle)} className={`text-[9px] px-2 py-1 rounded-lg border font-black transition-all uppercase tracking-wider ${syncGateAngle ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-400 border-blue-100'}`}>{syncGateAngle ? 'Sim' : 'Manual'}</button>
                                </div>
                                <NumberInput value={gateInclination} min={1} max={160} onChange={setGateInclination} disabled={syncGateAngle} />
                            </div>
                         </div>

                         <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/60 space-y-4">
                            <h4 className="text-[9px] font-black text-blue-800/70 uppercase tracking-widest flex items-center gap-1 mb-2"><RotateCw className="w-3 h-3" /> Apoio e Tirante</h4>
                            
                            <div>
                                <label className={labelClass}>Posição da Dobradiça (Hinge)</label>
                                <select className={selectClass} value={hingePosition} onChange={(e) => setHingePosition(e.target.value as HingePosition)}>
                                    <option value={HingePosition.NONE}>Sem Dobradiça</option>
                                    <option value={HingePosition.TOP}>Topo da Comporta</option>
                                    <option value={HingePosition.BOTTOM}>Base da Comporta</option>
                                </select>
                            </div>
                            
                            <div className="pt-2 border-t border-blue-100/50">
                                <div className="flex items-center justify-between cursor-pointer mb-2" onClick={() => setHasTieRod(!hasTieRod)}>
                                    <label className={`${labelClass} cursor-pointer mb-0`}>Força Externa (Tirante)</label>
                                    <input type="checkbox" checked={hasTieRod} onChange={(e) => setHasTieRod(e.target.checked)} className="accent-blue-600 w-4 h-4 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                                </div>
                                {hasTieRod && (
                                    <div className="grid grid-cols-2 gap-3 mt-3 animate-in fade-in">
                                        <div>
                                            <label className={labelClass}>Posição Relativa (0 a 1)</label>
                                            <NumberInput value={tieRodPosRel} min={0} max={1} step="0.1" onChange={setTieRodPosRel} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Ângulo da Força (°)</label>
                                            <NumberInput value={tieRodAngle} min={0} max={360} onChange={setTieRodAngle} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 border-t border-blue-100/50">
                                <div className="flex items-center justify-between cursor-pointer mb-2" onClick={() => setGateWeightEnabled(!gateWeightEnabled)}>
                                    <label className={`${labelClass} cursor-pointer mb-0`}>Peso Próprio da Comporta</label>
                                    <input type="checkbox" checked={gateWeightEnabled} onChange={(e) => setGateWeightEnabled(e.target.checked)} className="accent-blue-600 w-4 h-4 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                                </div>
                                {gateWeightEnabled && (
                                    <div className="mt-3 animate-in fade-in">
                                        <label className={labelClass}>Peso (N)</label>
                                        <NumberInput value={gateWeight} min={0} max={100000} onChange={setGateWeight} />
                                    </div>
                                )}
                            </div>
                         </div>
                     </div>
                 )}
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
            <GatePressureScene
                damType={damType} damHeight={damHeight} damBaseWidth={damBaseWidth} damCrestWidth={damCrestWidth}
                inclinationAngle={inclinationAngle} upstreamLevel={upstreamLevel} downstreamLevel={effectiveDownstreamLevel}
                hasGate={hasGate} gateShape={gateShape}
                gateWidth={gateWidth} gateHeight={gateHeight} gateDepthFromCrest={gateDepthFromCrest}
                gateInclination={gateInclination}
                force={analyzedResults ? analyzedResults.forceData.FR_net : 0} 
                s_cp={analyzedResults ? analyzedResults.forceData.s_cp_net : 0}
                hingePosition={hingePosition}
                hasTieRod={hasTieRod}
                tieRodPosRel={tieRodPosRel}
                tieRodAngle={tieRodAngle}
                gateWeight={gateWeight}
                gateWeightEnabled={gateWeightEnabled}
                onCalculate={handleCalculate}
            />
             <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-200/50 to-transparent pointer-events-none"></div>
        </div>

        {/* --- RIGHT SIDEBAR: RESULTS --- */}
        <div className="lg:col-span-3 flex flex-col gap-4 h-full">
             <div className="bg-white/75 backdrop-blur-md border border-blue-100/70 p-5 rounded-2xl shadow-xl shadow-blue-200/20 flex flex-col h-full">
                 <div className="flex items-center justify-between mb-6 pb-2 border-b border-blue-50">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Info className="w-4 h-4 text-blue-500" /> Resultados</h3>
                 </div>
                 
                 {analyzedResults ? (
                    <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1 animate-in fade-in slide-in-from-bottom-2">
                         {/* Hydrostatic Force Card */}
                         <div className="group bg-white/50 p-4 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:bg-blue-600 transition-colors"></div>
                             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Força Hidrostática Resultante</div>
                             <div className="text-2xl font-mono font-black text-slate-800 flex items-center gap-2">
                                 {(Math.abs(analyzedResults.forceData.FR_net) / 1000).toFixed(2)} <span className="text-sm font-sans font-black text-slate-400 self-end mb-1">kN</span>
                             </div>
                         </div>

                         {/* Center of Pressure Depth (NEW) */}
                         <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100/50">
                             <div className="flex justify-between items-center mb-3"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Centro de Pressão (CP)</span><MoveVertical className="w-3 h-3 text-blue-400" /></div>
                             <div className="bg-white/70 p-2.5 rounded-lg border border-blue-100 flex justify-between items-center">
                                 <div className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Posição ao longo da comporta</div>
                                 <div className="font-mono font-black text-blue-700 text-sm mt-0.5">{analyzedResults.forceData.s_cp_net.toFixed(2)} m</div>
                             </div>
                             <div className="text-[9px] text-slate-400 mt-2 text-right font-bold uppercase">Medido a partir do topo</div>
                         </div>

                         {/* Equilibrium (NEW) */}
                         {(hingePosition !== HingePosition.NONE || hasTieRod) && (
                             <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100/50">
                                 <div className="flex justify-between items-center mb-3"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Equilíbrio Estático</span><RotateCw className="w-3 h-3 text-blue-400" /></div>
                                 <div className="grid grid-cols-1 gap-3">
                                     {hingePosition !== HingePosition.NONE && (
                                         <div className="bg-white/70 p-2.5 rounded-lg border border-blue-100 flex justify-between items-center">
                                             <div className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Momento no Apoio</div>
                                             <div className="font-mono font-black text-slate-700 text-sm mt-0.5">{(Math.abs(analyzedResults.equilibrium.M_hinge) / 1000).toFixed(2)} kN·m</div>
                                         </div>
                                     )}
                                     {hasTieRod && (
                                         <div className="bg-white/70 p-2.5 rounded-lg border border-blue-100 flex justify-between items-center">
                                             <div className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Força no Tirante</div>
                                             <div className="font-mono font-black text-blue-700 text-sm mt-0.5">{(Math.abs(analyzedResults.equilibrium.F_tie) / 1000).toFixed(2)} kN</div>
                                         </div>
                                     )}
                                 </div>
                             </div>
                         )}

                         {/* Geometry Properties (NEW) */}
                         <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100/50">
                             <div className="flex justify-between items-center mb-3"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Propriedades Geométricas</span><Maximize className="w-3 h-3 text-blue-400" /></div>
                             <div className="grid grid-cols-2 gap-3">
                                 <div className="bg-white/70 p-2.5 rounded-lg border border-blue-100"><div className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Área Molhada (M)</div><div className="font-mono font-black text-slate-700 text-sm mt-0.5">{analyzedResults.forceData.up.area.toFixed(2)} m²</div></div>
                                 <div className="bg-white/70 p-2.5 rounded-lg border border-blue-100"><div className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Área Molhada (J)</div><div className="font-mono font-black text-slate-700 text-sm mt-0.5">{analyzedResults.forceData.down.area.toFixed(2)} m²</div></div>
                             </div>
                         </div>
                    </div>
                 ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 p-4">
                        <div className="bg-blue-50 p-4 rounded-full mb-3"><AlertCircle className="w-8 h-8 text-blue-400" /></div>
                        <h4 className="text-sm font-black text-slate-600 tracking-tight">Aguardando análise</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-[200px] font-medium">Configure os parâmetros e clique em "Analisar" na área central.</p>
                    </div>
                 )}

                 {analyzedResults && (
                     <div className="mt-4 pt-4 border-t border-blue-50">
                        <button onClick={() => setShowDetails(!showDetails)} className="w-full py-3.5 rounded-xl font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white active:scale-95 uppercase tracking-widest"><Calculator className="w-4 h-4" /> {showDetails ? 'Ocultar Memória' : 'Memória de Cálculo'}</button>
                     </div>
                 )}
             </div>
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
               </div>
           </div>
        </div>
      )}
    </div>
  );
};
