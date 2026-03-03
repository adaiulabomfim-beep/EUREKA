import React, { useState, useEffect } from 'react';
import {
  Box,
  Info,
  Calculator,
  Ruler,
  Layers,
  Droplets,
  FileText,
  ArrowDown,
  ArrowUp,
  EyeOff,
  Settings2,
  BookOpen,
  AlertTriangle,
} from 'lucide-react';
import { MATERIALS, FLUIDS, ObjectShape } from '../../types';
import { useBuoyancySimulation } from '../../hooks/useBuoyancySimulation';
import { TankScene } from '../scene/TankScene';

interface BodyFallLabProps {
  onContextUpdate?: (ctx: string) => void;
}

// Styled Component for Calculation Line
const CalculationLine: React.FC<{
  label: string | React.ReactNode;
  symbol: string | React.ReactNode;
  formula?: string | React.ReactNode;
  substitution?: string | React.ReactNode;
  result: string;
  unit: string;
  isSubHeader?: boolean;
}> = ({ label, symbol, formula, substitution, result, unit, isSubHeader }) => (
  <div
    className={`flex flex-col sm:flex-row sm:items-baseline justify-between py-2 border-b border-slate-100 last:border-0 ${
      isSubHeader ? 'bg-slate-50/80 -mx-4 px-4 font-semibold text-slate-800 mt-2 py-2.5' : ''
    }`}
  >
    <div className="text-[10px] text-slate-500 font-medium">{label}</div>
    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-700 mt-1 sm:mt-0">
      <span className="font-bold text-blue-700">{symbol}</span>
      {formula && <span className="text-slate-400 hidden lg:inline">= {formula}</span>}
      {substitution && <span className="text-slate-500">= {substitution}</span>}
      <span
        className={`font-bold px-1.5 py-0.5 rounded ml-auto ${
          isSubHeader ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-900'
        }`}
      >
        = {result}{' '}
        <span className="text-[9px] font-sans text-slate-500 ml-0.5">{unit}</span>
      </span>
    </div>
  </div>
);

// Styled Section Header
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
    <div className="text-blue-700">{icon}</div>
    <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">{title}</h3>
  </div>
);

export const BodyFallLab: React.FC<BodyFallLabProps> = ({ onContextUpdate }) => {
  // --- STATE: INPUTS ---
  const [selectedMaterial, setSelectedMaterial] = useState<string>('Concreto');
  const [customObjDensity, setCustomObjDensity] = useState<number>(2400);
  const [shape, setShape] = useState<ObjectShape>(ObjectShape.CUBE);
  const [dim1, setDim1] = useState<number>(100);
  const [dim2, setDim2] = useState<number>(100);

  const [selectedFluid, setSelectedFluid] = useState<string>(FLUIDS[4].name);
  const [customFluidDensity, setCustomFluidDensity] = useState<number>(FLUIDS[4].density);
  const [depthA, setDepthA] = useState<number>(300);

  const [enableTwoFluids, setEnableTwoFluids] = useState<boolean>(false);
  const [selectedFluidB, setSelectedFluidB] = useState<string>(FLUIDS[6].name);
  const [customFluidDensityB, setCustomFluidDensityB] = useState<number>(FLUIDS[6].density);
  const [depthB, setDepthB] = useState<number>(100);

  const [gravity] = useState<number>(9.81);
  const [tankWidth, setTankWidth] = useState<number>(600);
  const [tankDepth, setTankDepth] = useState<number>(100);
  const [tankHeight, setTankHeight] = useState<number>(500);

  // --- STATE: UI & CONTROL ---
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [is3D, setIs3D] = useState<boolean>(false);
  const [showFBD, setShowFBD] = useState<boolean>(true);
  const [showCalculations, setShowCalculations] = useState<boolean>(false);
  const [showCenterOfBuoyancy, setShowCenterOfBuoyancy] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // --- LAYOUT CALCULATIONS ---
  const svgHeight = 600;
  const svgWidth = 700;
  const tankBottomY = 580;
  const tankTopMargin = 160;
  const availablePixelHeight = tankBottomY - tankTopMargin;
  const availablePixelWidth = svgWidth - 120;

  const fluidTotalDepth = enableTwoFluids ? depthA + depthB : depthA;
  const autoTankHeight = Math.max(tankHeight, Math.ceil(fluidTotalDepth + 10));
  const scaleHeight = availablePixelHeight / autoTankHeight;
  const scaleWidth = availablePixelWidth / tankWidth;
  const visualScaleFactor = Math.min(scaleHeight, scaleWidth);

  const currentTankW = tankWidth * visualScaleFactor;
  const currentTankH = autoTankHeight * visualScaleFactor;
  const tankOffsetX = (svgWidth - currentTankW) / 2 + 30;
  const originalFluidSurfaceY = tankBottomY - fluidTotalDepth * visualScaleFactor;

  let visualWidth = 0;
  let visualHeight = 0;
  if (shape === ObjectShape.CUBE) {
    visualWidth = dim1 * visualScaleFactor;
    visualHeight = dim1 * visualScaleFactor;
  } else if (shape === ObjectShape.SPHERE) {
    visualWidth = dim1 * 2 * visualScaleFactor;
    visualHeight = dim1 * 2 * visualScaleFactor;
  } else {
    visualWidth = dim1 * 2 * visualScaleFactor;
    visualHeight = dim2 * visualScaleFactor;
  }

  // --- SIMULATION HOOK ---
  const physics = useBuoyancySimulation({
    shape,
    dim1,
    dim2,
    objectDensity: customObjDensity,
    selectedFluid,
    customFluidDensity,
    selectedFluidB,
    customFluidDensityB,
    depthA,
    depthB,
    enableTwoFluids,
    gravity,
    isSimulating,
    tankHeight: autoTankHeight,
    tankBottomY,
    visualScaleFactor,
    visualHeight,
    fluidSurfaceY: originalFluidSurfaceY,
    tankWidth,
    tankDepth,
  });

  const fluidSurfaceY = originalFluidSurfaceY - physics.deltaH_cm * visualScaleFactor;

  // --- HANDLERS ---
  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const matName = e.target.value;
    setSelectedMaterial(matName);
    if (matName !== 'Custom') {
      const mat = MATERIALS.find((m) => m.name === matName);
      if (mat) setCustomObjDensity(mat.density);
    }
  };

  const loadExercise5 = () => {
    setIsSimulating(false);
    setSelectedMaterial('Custom');
    setCustomObjDensity(650);
    setShape(ObjectShape.CUBE);
    setDim1(20);
    setSelectedFluid('Água Doce');
    setCustomFluidDensity(1000);
    setEnableTwoFluids(false);
    setDepthA(50);
    setTankWidth(100);
    setTankHeight(80);
    setToastMsg('Exercício 5 Carregado!');
    setTimeout(() => setToastMsg(null), 1500);
  };

  useEffect(() => {
    if (onContextUpdate) {
      onContextUpdate(
        `CONTEXTO DO LABORATÓRIO DE EMPUXO: Objeto: ${shape} (${selectedMaterial}), Peso: ${physics.objectWeight.toFixed(
          2
        )} N, Empuxo: ${physics.buoyancyForce.toFixed(2)} N, Estado: ${physics.status}, Submerso: ${physics.h_sub_actual.toFixed(
          2
        )} cm`
      );
    }
  }, [
    onContextUpdate,
    physics.objectWeight,
    physics.buoyancyForce,
    physics.status,
    physics.h_sub_actual,
    shape,
    selectedMaterial,
  ]);

  useEffect(() => {
    setIsSimulating(false);
  }, [
    selectedMaterial,
    customObjDensity,
    shape,
    dim1,
    dim2,
    selectedFluid,
    depthA,
    selectedFluidB,
    depthB,
    enableTwoFluids,
    tankWidth,
    tankHeight,
  ]);

  const objectWidthCm = shape === ObjectShape.CUBE ? dim1 : dim1 * 2;
  const isObjectTooWide = objectWidthCm > tankWidth;

  const forceText = isSimulating
    ? physics.apparentWeight >= 10000
      ? `${(physics.apparentWeight / 1000).toFixed(1)} kN`
      : `${physics.apparentWeight.toFixed(1)} N`
    : '?';

  const getGeomFormula = () => {
    const d1_m = dim1 / 100;
    const d2_m = dim2 / 100;
    if (shape === ObjectShape.CUBE) return { name: 'Volume Cubo', formula: <>L³</>, substitution: `${d1_m.toFixed(2)}³` };
    if (shape === ObjectShape.SPHERE)
      return { name: 'Volume Esfera', formula: <>4/3 · π · R³</>, substitution: `4/3 · π · ${d1_m.toFixed(2)}³` };
    return { name: 'Volume Cilindro', formula: <>π · R² · h</>, substitution: `π · ${d1_m.toFixed(2)}² · ${d2_m.toFixed(2)}` };
  };
  const geom = getGeomFormula();

  // Styles (paleta EUREKA)
  const inputGroupClass = 'space-y-1';
  const labelClass = 'block text-[9px] font-bold text-slate-500 uppercase tracking-wider';
  const inputClass =
    'w-full h-8 px-2 border border-slate-200 rounded text-xs bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-300';
  const selectClass =
    'w-full h-8 px-2 border border-slate-200 rounded text-xs bg-slate-50/50 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm cursor-pointer hover:bg-white';

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[750px]">
        {/* --- LEFT SIDEBAR: CONTROLS --- */}
        <div className="lg:col-span-3 flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
          {/* Exercise Card (brand: azul/ciano) */}
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 p-3 rounded-2xl shadow-lg shadow-blue-500/15 text-white border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 opacity-90">
                <BookOpen className="w-3 h-3" /> Exercício do Slide
              </h3>
            </div>
            <button
              onClick={loadExercise5}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 p-2 rounded-xl transition-all text-left flex items-center gap-2 active:scale-95"
            >
              <div className="bg-white text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">Ex.5</div>
              <div>
                <div className="text-xs font-bold text-white">Bloco de Madeira</div>
                <div className="text-[9px] text-white/80">Slide 30 (γ = 650)</div>
              </div>
            </button>
          </div>

          {/* Object Properties */}
          <div className="bg-white/75 backdrop-blur-md p-4 rounded-2xl shadow-xl shadow-blue-200/25 border border-blue-100/70">
            <SectionHeader icon={<Box className="w-3.5 h-3.5" />} title="Propriedades do Objeto" />
            <div className="space-y-3">
              <div className={inputGroupClass}>
                <label className={labelClass}>Geometria</label>
                <select className={selectClass} value={shape} onChange={(e) => setShape(e.target.value as ObjectShape)}>
                  <option value={ObjectShape.CUBE}>Cubo</option>
                  <option value={ObjectShape.SPHERE}>Esfera</option>
                </select>
              </div>

              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {shape === ObjectShape.CUBE && (
                    <div className={`col-span-2 ${inputGroupClass}`}>
                      <label className={labelClass}>Aresta (cm)</label>
                      <input type="number" step="1" min="1" value={dim1} onChange={(e) => setDim1(Number(e.target.value))} className={inputClass} />
                    </div>
                  )}
                  {shape === ObjectShape.SPHERE && (
                    <div className={`col-span-2 ${inputGroupClass}`}>
                      <label className={labelClass}>Raio (cm)</label>
                      <input type="number" step="1" min="1" value={dim1} onChange={(e) => setDim1(Number(e.target.value))} className={inputClass} />
                    </div>
                  )}
                </div>

                {isObjectTooWide && (
                  <div className="flex items-start gap-1.5 text-[9px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-100">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>Atenção: Objeto excede a largura do tanque.</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-[9px] font-medium text-slate-400">
                    Área Base: <span className="text-slate-700 font-bold">{physics.baseArea.toFixed(3)} m²</span>
                  </span>
                  <span className="text-[9px] font-medium text-slate-400">
                    Volume: <span className="text-blue-700 font-bold">{physics.volume.toFixed(3)} m³</span>
                  </span>
                </div>
              </div>

              <div className={inputGroupClass}>
                <label className={labelClass}>Material</label>
                <select className={selectClass} value={selectedMaterial} onChange={handleMaterialChange}>
                  {MATERIALS.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                  <option value="Custom">Personalizado...</option>
                </select>
              </div>

              <div className={inputGroupClass}>
                <label className={labelClass}>Densidade (kg/m³)</label>
                <input
                  type="number"
                  value={customObjDensity}
                  onChange={(e) => {
                    setCustomObjDensity(Number(e.target.value));
                    setSelectedMaterial('Custom');
                  }}
                  className={inputClass}
                />
                <div className="text-[9px] text-slate-400 mt-0.5">
                  Peso Específico (γ) ≈ {(customObjDensity * gravity).toFixed(0)} N/m³
                </div>
              </div>
            </div>
          </div>

          {/* Tank Properties */}
          <div className="bg-white/75 backdrop-blur-md p-4 rounded-2xl shadow-xl shadow-blue-200/25 border border-blue-100/70">
            <SectionHeader icon={<Settings2 className="w-3.5 h-3.5" />} title="Tanque" />
            <div className="grid grid-cols-2 gap-3">
              <div className={inputGroupClass}>
                <label className={labelClass}>Largura (cm)</label>
                <input type="number" min="50" max="2000" value={tankWidth} onChange={(e) => setTankWidth(Number(e.target.value))} className={inputClass} />
              </div>
              <div className={inputGroupClass}>
                <label className={labelClass}>Profund. (cm)</label>
                <input type="number" min="10" max="1000" value={tankDepth} onChange={(e) => setTankDepth(Number(e.target.value))} className={inputClass} />
              </div>
              <div className="col-span-2 text-[9px] text-slate-400">
                Área da Base: <span className="font-bold text-slate-700">{physics.tankBaseArea.toFixed(3)} m²</span>
              </div>
            </div>
          </div>

          {/* Fluids */}
          <div className="bg-white/75 backdrop-blur-md p-4 rounded-2xl shadow-xl shadow-blue-200/25 border border-blue-100/70">
            <SectionHeader icon={<Droplets className="w-3.5 h-3.5" />} title="Fluidos" />
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1.5 p-2 bg-slate-50/70 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={enableTwoFluids}
                  onChange={(e) => setEnableTwoFluids(e.target.checked)}
                  id="two-fluids"
                  className="accent-blue-600 w-3.5 h-3.5 cursor-pointer"
                />
                <label
                  htmlFor="two-fluids"
                  className="text-[10px] font-bold text-slate-700 cursor-pointer select-none uppercase tracking-wide flex-1"
                >
                  Modo Dois Líquidos
                </label>
                {enableTwoFluids && <Layers className="w-3 h-3 text-cyan-500" />}
              </div>

              {/* Fluid A */}
              <div className="space-y-2 relative">
                <div className={inputGroupClass}>
                  <label className={labelClass}>{enableTwoFluids ? 'Líquido Superior (A)' : 'Líquido Principal'}</label>
                  <select
                    className={selectClass}
                    value={selectedFluid}
                    onChange={(e) => {
                      setSelectedFluid(e.target.value);
                      if (e.target.value !== 'Custom') setCustomFluidDensity(FLUIDS.find((f) => f.name === e.target.value)?.density || 0);
                    }}
                  >
                    {FLUIDS.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                    <option value="Custom">Personalizado...</option>
                  </select>

                  <div className="flex gap-2 mt-1.5">
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-400">Densidade (kg/m³)</label>
                      <input type="number" value={customFluidDensity} onChange={(e) => setCustomFluidDensity(Number(e.target.value))} className={inputClass} />
                    </div>
                    <div className="w-20">
                      <label className="text-[9px] text-slate-400">Profundidade (cm)</label>
                      <input type="number" min="1" max="1000" step="1" value={depthA} onChange={(e) => setDepthA(Number(e.target.value))} className={inputClass} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fluid B */}
              {enableTwoFluids && (
                <div className="space-y-2 relative pt-2 border-t border-slate-100">
                  <div className={inputGroupClass}>
                    <label className={labelClass}>Líquido Inferior (B)</label>
                    <select
                      className={selectClass}
                      value={selectedFluidB}
                      onChange={(e) => {
                        setSelectedFluidB(e.target.value);
                        if (e.target.value !== 'Custom') setCustomFluidDensityB(FLUIDS.find((f) => f.name === e.target.value)?.density || 0);
                      }}
                    >
                      {FLUIDS.map((f) => (
                        <option key={f.name} value={f.name}>
                          {f.name}
                        </option>
                      ))}
                      <option value="Custom">Personalizado...</option>
                    </select>

                    <div className="flex gap-2 mt-1.5">
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-400">Densidade (kg/m³)</label>
                        <input type="number" value={customFluidDensityB} onChange={(e) => setCustomFluidDensityB(Number(e.target.value))} className={inputClass} />
                      </div>
                      <div className="w-20">
                        <label className="text-[9px] text-slate-400">Profundidade (cm)</label>
                        <input type="number" min="1" max="1000" step="1" value={depthB} onChange={(e) => setDepthB(Number(e.target.value))} className={inputClass} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- CENTER: SCENE --- */}
        <div className="lg:col-span-6 flex flex-col h-full rounded-3xl border border-blue-100/70 overflow-hidden relative shadow-2xl shadow-blue-200/25 bg-gradient-to-b from-slate-50 via-slate-100 to-blue-50">
          <TankScene
            svgWidth={svgWidth}
            svgHeight={svgHeight}
            tankWidth={tankWidth}
            tankHeight={autoTankHeight}
            tankBottomY={tankBottomY}
            tankOffsetX={tankOffsetX}
            currentTankW={currentTankW}
            currentTankH={currentTankH}
            shape={shape}
            visualWidth={visualWidth}
            visualHeight={visualHeight}
            selectedMaterial={selectedMaterial}
            blockY={physics.blockY}
            fluidSurfaceY={fluidSurfaceY}
            originalFluidSurfaceY={originalFluidSurfaceY}
            depthA={depthA}
            depthB={depthB}
            hA_px={depthA * visualScaleFactor}
            effectiveHB_px={enableTwoFluids ? depthB * visualScaleFactor : 0}
            h_sub_actual={physics.h_sub_actual}
            deltaH_cm={physics.deltaH_cm}
            objectWeight={physics.objectWeight}
            buoyancyForce={physics.buoyancyForce}
            showFBD={showFBD}
            centerOfBuoyancyY_visual={(physics.blockY + visualHeight) - (physics.h_sub_actual * visualScaleFactor) / 2}
            selectedFluid={selectedFluid}
            selectedFluidB={selectedFluidB}
            enableTwoFluids={enableTwoFluids}
            isSimulating={isSimulating}
            onToggleSimulate={() => setIsSimulating(!isSimulating)}
            onToggleFBD={() => setShowFBD(!showFBD)}
            is3D={is3D}
            onToggle3D={() => setIs3D(!is3D)}
            showCenterOfBuoyancy={showCenterOfBuoyancy}
            onToggleCenterOfBuoyancy={() => setShowCenterOfBuoyancy(!showCenterOfBuoyancy)}
            toastMsg={toastMsg}
          />
        </div>

        {/* --- RIGHT SIDEBAR: RESULTS --- */}
        <div className="lg:col-span-3 flex flex-col gap-3 h-full">
          <div className="bg-white/75 backdrop-blur-md p-4 rounded-2xl shadow-xl shadow-blue-200/25 border border-blue-100/70 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-blue-700" /> Painel de Resultados
              </h3>
            </div>

            <div className="space-y-3 flex-1">
              {/* Peso Real */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Peso Real (P)</span>
                  <ArrowDown className="w-3.5 h-3.5 text-red-500" />
                </div>
                <div className="text-xl font-mono font-bold text-slate-800 tracking-tight">
                  {physics.objectWeight >= 10000 ? `${(physics.objectWeight / 1000).toFixed(1)} kN` : `${physics.objectWeight.toFixed(1)} N`}
                </div>
              </div>

              {/* Empuxo */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Empuxo Total (E)</span>
                  {isSimulating ? <ArrowUp className="w-3.5 h-3.5 text-emerald-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-300" />}
                </div>
                <div className="text-xl font-mono font-bold text-slate-400 tracking-tight">
                  {isSimulating ? (
                    <span className="text-slate-800">
                      {physics.buoyancyForce >= 10000 ? `${(physics.buoyancyForce / 1000).toFixed(1)} kN` : `${physics.buoyancyForce.toFixed(1)} N`}
                    </span>
                  ) : (
                    '???'
                  )}
                </div>
              </div>

              {/* Peso Aparente */}
              <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  DINAMÔMETRO
                </div>
                <div className="text-[9px] font-bold text-blue-700 uppercase tracking-widest mb-1 mt-1">
                  Peso Aparente (P<sub>ap</sub>)
                </div>
                <div className="text-2xl font-mono font-bold tracking-tight text-slate-800 mb-1">{forceText}</div>
              </div>

              {/* Status */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-2.5 rounded-xl border border-blue-100 text-center">
                <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5 text-slate-500">Estado do Objeto</div>
                <div className="text-xs font-bold uppercase text-blue-800">{isSimulating ? physics.status : 'PRONTO'}</div>
              </div>

              {/* Submerged Height */}
              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-bold text-blue-600 uppercase tracking-wide">
                    Altura Submersa (h<sub>sub</sub>)
                  </div>
                  <div className="text-base font-mono font-bold text-slate-800">
                    {isSimulating ? physics.h_sub_actual.toFixed(2) : '?'} <span className="text-[10px]">cm</span>
                  </div>
                </div>
                <Ruler className="w-3.5 h-3.5 text-blue-400" />
              </div>

              {/* Volume Deslocado */}
              <div className="bg-cyan-50/60 p-3 rounded-xl border border-cyan-100">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[9px] font-bold text-cyan-700 uppercase tracking-widest">
                    Volume Deslocado (V<sub>desl</sub>)
                  </span>
                  <div className="bg-cyan-700 text-white text-[8px] font-bold px-1 rounded">
                    V<sub>desl</sub> = V<sub>sub</sub>
                  </div>
                </div>
                <div className="text-base font-mono font-bold text-slate-800">
                  {isSimulating ? physics.vol_deslocado.toFixed(4) : '?'} <span className="text-[10px]">m³</span>
                </div>
                <div className="text-[9px] text-cyan-800 mt-1 font-medium">
                  Elevação do Nível (Δh): <span className="font-bold">{isSimulating ? physics.deltaH_cm.toFixed(2) : '?'} cm</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowCalculations(!showCalculations)}
                disabled={!isSimulating}
                className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 ${
                  isSimulating
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" /> {showCalculations ? 'Ocultar Memorial' : 'Memorial de Cálculo'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Calculation Panel */}
      {showCalculations && isSimulating && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 zoom-in-95 duration-300">
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 p-6 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-700" />
                Memorial de Cálculo
              </h3>
              <button
                onClick={() => setShowCalculations(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-4 py-2 hover:bg-slate-100 rounded-xl transition-colors uppercase"
              >
                Fechar
              </button>
            </div>

            <div className="p-8 space-y-10">
              {/* SEÇÃO 1: Dados */}
              <section>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-slate-300"></div> Geometria & Massa <div className="flex-1 h-px bg-slate-200"></div>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <div>
                    <CalculationLine label="Volume Total (V)" symbol="V" formula={geom.formula} substitution={geom.substitution} result={physics.volume.toFixed(4)} unit="m³" />
                    <CalculationLine label="Massa (m)" symbol="m" formula="ρ · V" substitution={`${customObjDensity} · ${physics.volume.toFixed(4)}`} result={physics.objectMass.toFixed(2)} unit="kg" />
                  </div>
                  <div>
                    <CalculationLine label="Peso (P)" symbol="P" formula="m · g" substitution={`${physics.objectMass.toFixed(2)} · ${gravity}`} result={physics.objectWeight.toFixed(2)} unit="N" isSubHeader />
                  </div>
                </div>
              </section>

              {/* SEÇÃO 2: Empuxo & Deslocamento */}
              <section>
                <h4 className="text-xs font-black text-cyan-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-cyan-300"></div> Hidrostática & Deslocamento <div className="flex-1 h-px bg-slate-200"></div>
                </h4>
                <div className="bg-cyan-50/35 p-6 rounded-2xl border border-cyan-100/70">
                  <CalculationLine
                    label="Volume Deslocado Total"
                    symbol={
                      <>
                        V<sub>desl</sub>
                      </>
                    }
                    formula={
                      <>
                        V<sub>sub,A</sub> + V<sub>sub,B</sub>
                      </>
                    }
                    result={physics.vol_deslocado.toFixed(6)}
                    unit="m³"
                  />
                  <CalculationLine
                    label="Área da Base do Tanque"
                    symbol={
                      <>
                        A<sub>tanque</sub>
                      </>
                    }
                    formula="L · P"
                    substitution={`${(tankWidth / 100).toFixed(2)} · ${(tankDepth / 100).toFixed(2)}`}
                    result={physics.tankBaseArea.toFixed(3)}
                    unit="m²"
                  />
                  <CalculationLine
                    label="Elevação do Nível (Δh)"
                    symbol="Δh"
                    formula={
                      <>
                        V<sub>desl</sub> / A<sub>tanque</sub>
                      </>
                    }
                    substitution={`${physics.vol_deslocado.toFixed(6)} / ${physics.tankBaseArea.toFixed(3)}`}
                    result={(physics.deltaH_cm / 100).toFixed(4)}
                    unit="m"
                    isSubHeader
                  />

                  <h5 className="text-xs font-bold text-cyan-900 uppercase mt-8 mb-3">Cálculo das Forças</h5>
                  <CalculationLine
                    label="Altura Submersa Total"
                    symbol={
                      <>
                        h<sub>sub</sub>
                      </>
                    }
                    result={physics.h_sub_actual.toFixed(2)}
                    unit="cm"
                  />

                  <h5 className="text-xs font-bold text-cyan-900 uppercase mt-6 mb-3">Fluido A (Superior)</h5>
                  <CalculationLine
                    label="Volume Submerso em A"
                    symbol={
                      <>
                        V<sub>sub,A</sub>
                      </>
                    }
                    result={physics.vol_sub_A.toFixed(6)}
                    unit="m³"
                  />
                  <CalculationLine
                    label="Força de Empuxo em A"
                    symbol={
                      <>
                        E<sub>A</sub>
                      </>
                    }
                    formula={
                      <>
                        ρ<sub>A</sub> · g · V<sub>sub,A</sub>
                      </>
                    }
                    result={physics.E_A.toFixed(2)}
                    unit="N"
                    isSubHeader={!enableTwoFluids}
                  />

                  {enableTwoFluids && (
                    <>
                      <h5 className="text-xs font-bold text-cyan-900 uppercase mt-6 mb-3">Fluido B (Inferior)</h5>
                      <CalculationLine
                        label="Volume Submerso em B"
                        symbol={
                          <>
                            V<sub>sub,B</sub>
                          </>
                        }
                        result={physics.vol_sub_B.toFixed(6)}
                        unit="m³"
                      />
                      <CalculationLine
                        label="Força de Empuxo em B"
                        symbol={
                          <>
                            E<sub>B</sub>
                          </>
                        }
                        formula={
                          <>
                            ρ<sub>B</sub> · g · V<sub>sub,B</sub>
                          </>
                        }
                        result={physics.E_B.toFixed(2)}
                        unit="N"
                      />
                      <div className="mt-4">
                        <CalculationLine
                          label="Empuxo Total Resultante"
                          symbol={
                            <>
                              E<sub>total</sub>
                            </>
                          }
                          formula={
                            <>
                              E<sub>A</sub> + E<sub>B</sub>
                            </>
                          }
                          result={physics.buoyancyForce.toFixed(2)}
                          unit="N"
                          isSubHeader
                        />
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* SEÇÃO 3: Conclusão */}
              <section>
                <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-blue-300"></div> Análise Final <div className="flex-1 h-px bg-slate-200"></div>
                </h4>
                <div className="bg-blue-50/60 p-6 rounded-2xl border border-blue-100">
                  <CalculationLine
                    label="Peso Aparente (Dinamômetro)"
                    symbol={
                      <>
                        P<sub>ap</sub>
                      </>
                    }
                    formula="|P - E|"
                    substitution={`|${physics.objectWeight.toFixed(2)} - ${physics.buoyancyForce.toFixed(2)}|`}
                    result={physics.apparentWeight.toFixed(2)}
                    unit="N"
                    isSubHeader
                  />
                  <div className="mt-4 text-center">
                    <div className="inline-block px-4 py-2 bg-white rounded-xl border border-blue-100 shadow-sm text-sm font-bold text-blue-950">
                      {physics.status === 'AFUNDADO'
                        ? 'P > E (Afunda)'
                        : physics.status.includes('FLUTUANDO') ||
                          physics.status.includes('INTERFACE') ||
                          physics.status.includes('EQUILÍBRIO')
                        ? 'P = E (Equilíbrio)'
                        : 'P = E (Equilíbrio)'}
                    </div>
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