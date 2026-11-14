import React from 'react';
import { Box, Settings2, Droplets, Layers, AlertTriangle, FlaskConical } from 'lucide-react';
import { MATERIALS, FLUIDS } from '../dominio/configuracao';
import { ObjectShape } from '../dominio/tipos';
import { NumberInput } from './components/NumberInput';

export const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-blue-50 dark:border-slate-800/80">
        <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">{icon}</div>
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">{title}</h3>
    </div>
);

interface PainelControlesProps {
  selectedMaterial: string;
  customObjDensity: number;
  shape: ObjectShape;
  dim1: number;
  dim2?: number;
  selectedFluid: string;
  customFluidDensity: number;
  depthA: number;
  enableTwoFluids: boolean;
  selectedFluidB: string;
  customFluidDensityB: number;
  depthB: number;
  tankWidth: number;
  tankDepth: number;
  physics: any; // Ideally, define a proper type
  onMaterialChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onCustomObjDensityChange: (val: number) => void;
  onShapeChange: (shape: ObjectShape) => void;
  onDim1Change: (val: number) => void;
  onDim2Change?: (val: number) => void;
  onFluidChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onCustomFluidDensityChange: (val: number) => void;
  onDepthAChange: (val: number) => void;
  onEnableTwoFluidsChange: (val: boolean) => void;
  onFluidBChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onCustomFluidDensityBChange: (val: number) => void;
  onDepthBChange: (val: number) => void;
  onTankWidthChange: (val: number) => void;
  onTankDepthChange: (val: number) => void;
  extraWeight: number;
  onExtraWeightChange: (val: number) => void;
  showFluidComparison?: boolean;
  onToggleFluidComparison?: () => void;
  inverseSpecificWeightMode?: boolean;
  realWeightN?: number;
  apparentWeightN?: number;
  fluidSpecificWeight?: number;
  gravity?: number;
  onRealWeightChange?: (val: number) => void;
  onApparentWeightChange?: (val: number) => void;
  onFluidSpecificWeightChange?: (val: number) => void;
}

export const PainelControles: React.FC<PainelControlesProps> = ({
  selectedMaterial,
  customObjDensity,
  shape,
  dim1,
  dim2 = 100,
  selectedFluid,
  customFluidDensity,
  depthA,
  enableTwoFluids,
  selectedFluidB,
  customFluidDensityB,
  depthB,
  tankWidth,
  tankDepth,
  physics,
  onMaterialChange,
  onCustomObjDensityChange,
  onShapeChange,
  onDim1Change,
  onDim2Change,
  onFluidChange,
  onCustomFluidDensityChange,
  onDepthAChange,
  onEnableTwoFluidsChange,
  onFluidBChange,
  onCustomFluidDensityBChange,
  onDepthBChange,
  onTankWidthChange,
  onTankDepthChange,
  extraWeight,
  onExtraWeightChange,
  showFluidComparison = false,
  onToggleFluidComparison,
  inverseSpecificWeightMode = false,
  realWeightN = 445,
  apparentWeightN = 267,
  fluidSpecificWeight = 9802,
  gravity = 9.81,
  onRealWeightChange,
  onApparentWeightChange,
  onFluidSpecificWeightChange,
}) => {
  const inputGroupClass = 'space-y-1.5';
  const labelClass = "block text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1.5";
  const inputClass =
    "w-full h-9 px-3 border border-slate-200 dark:border-slate-700/80 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-sm placeholder:text-slate-400";
  const selectClass =
    "w-full h-9 px-3 border border-slate-200 dark:border-slate-700/80 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/60";

  const effectiveObjWidthCm = inverseSpecificWeightMode
    ? (physics?.illustrativeSideCm ?? 26.3)
    : (shape === ObjectShape.CUBE ? dim1 : dim1 * 2);
  const isObjectTooWide = effectiveObjWidthCm > tankWidth;

  return (
    <div className="flex flex-col gap-4 shrink-0">
      {/* Object Properties */}
      <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xl shadow-blue-200/20 dark:shadow-none transition-colors duration-200">
        <SectionHeader icon={<Box className="w-4 h-4" />} title="Propriedades do Objeto" />
        {inverseSpecificWeightMode ? (
          <div className="space-y-4">
            <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 text-[10px] text-blue-800 dark:text-blue-200 leading-relaxed">
              <span className="font-bold block mb-0.5">Ensaio de Imersão Total (Bloco Suspenso)</span>
              O bloco exibido na cena possui geometria apenas ilustrativa, pois o enunciado não informa suas dimensões.
            </div>

            <div className={inputGroupClass}>
              <label className={labelClass}>Objeto / Material</label>
              <select className={selectClass} value={selectedMaterial} onChange={onMaterialChange}>
                {MATERIALS.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
                <option value="Custom">Personalizado...</option>
              </select>
            </div>

            <div className="bg-slate-50/60 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className={inputGroupClass}>
                <label className={labelClass}>Peso Real no Ar — P (N)</label>
                <NumberInput
                  value={realWeightN}
                  min={0.1}
                  step="1"
                  onChange={(v) => onRealWeightChange?.(v)}
                />
              </div>
              <div className={inputGroupClass}>
                <label className={labelClass}>Peso Aparente na Água — Pₐₚ (N)</label>
                <NumberInput
                  value={apparentWeightN}
                  min={0}
                  step="1"
                  onChange={(v) => onApparentWeightChange?.(v)}
                />
              </div>
              {realWeightN <= apparentWeightN && (
                <div className="flex items-start gap-2 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span className="font-medium leading-tight">O peso real no ar deve ser maior que o peso aparente imerso.</span>
                </div>
              )}
            </div>
          </div>
        ) : (
        <div className="space-y-4">
          <div className={inputGroupClass}>
            <label className={labelClass}>Geometria</label>
            <select className={selectClass} value={shape} onChange={(e) => onShapeChange(e.target.value as ObjectShape)}>
              <option value={ObjectShape.CUBE}>Cubo</option>
              <option value={ObjectShape.SPHERE}>Esfera</option>
            </select>
          </div>

          <div className="bg-slate-50/60 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className={`col-span-2 ${inputGroupClass}`}>
                <label className={labelClass}>{shape === ObjectShape.CUBE ? 'Aresta (cm)' : 'Raio (cm)'}</label>
                <NumberInput value={dim1} min={1} onChange={onDim1Change} />
              </div>
            </div>

            {isObjectTooWide && (
              <div className="flex items-start gap-2 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span className="font-medium leading-tight">Atenção: Objeto excede a largura do tanque.</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1">
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-400">
                Área Base: <span className="text-slate-600 dark:text-slate-200 font-bold">{physics.baseArea.toFixed(3)} m²</span>
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-400">
                Volume: <span className="text-blue-500 dark:text-blue-400 font-bold">{physics.volume.toFixed(3)} m³</span>
              </span>
            </div>
          </div>

          <div className={inputGroupClass}>
            <label className={labelClass}>Material</label>
            <select className={selectClass} value={selectedMaterial} onChange={onMaterialChange}>
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
            <NumberInput value={customObjDensity} onChange={onCustomObjDensityChange} />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className={inputGroupClass}>
              <label className={labelClass}>Peso Extra (N)</label>
              <NumberInput value={extraWeight} min={0} onChange={onExtraWeightChange} />
              <p className="text-[9px] text-slate-400 dark:text-slate-400 italic">Simula uma carga aplicada sobre o corpo.</p>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Fluids */}
      <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xl shadow-blue-200/20 dark:shadow-none transition-colors duration-200">
        <SectionHeader icon={<Droplets className="w-4 h-4" />} title="Fluidos" />
        <div className="space-y-4">
          {!inverseSpecificWeightMode && (
          <div className="flex items-center gap-2.5 mb-2 p-2.5 bg-slate-50/70 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/90 transition-colors">
            <input
              type="checkbox"
              checked={enableTwoFluids}
              onChange={(e) => onEnableTwoFluidsChange(e.target.checked)}
              id="two-fluids"
              className="accent-blue-600 w-4 h-4 cursor-pointer rounded"
            />
            <label
              htmlFor="two-fluids"
              className="text-[10px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer select-none uppercase tracking-widest flex-1"
            >
              Modo Dois Líquidos
            </label>
            {enableTwoFluids && <Layers className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />}
          </div>
          )}

          <div className="space-y-3 relative">
            <div className={inputGroupClass}>
              <label className={labelClass}>{enableTwoFluids && !inverseSpecificWeightMode ? 'Líquido Superior (A)' : 'Líquido Principal'}</label>
              <select
                className={selectClass}
                value={selectedFluid}
                onChange={onFluidChange}
              >
                {FLUIDS.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
                <option value="Custom">Personalizado...</option>
              </select>

              {inverseSpecificWeightMode ? (
                <div className="space-y-2 mt-2">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-medium text-slate-400 dark:text-slate-400 mb-1 block">Peso Específico γf (N/m³)</label>
                      <NumberInput
                        value={fluidSpecificWeight}
                        min={1}
                        step="1"
                        onChange={(v) => onFluidSpecificWeightChange?.(v)}
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-[10px] font-medium text-slate-400 dark:text-slate-400 mb-1 block">Profund. (cm)</label>
                      <NumberInput value={depthA} min={10} max={1000} step="1" onChange={onDepthAChange} />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-400">
                    Densidade equiv.: <span className="font-semibold text-slate-600 dark:text-slate-300">{(fluidSpecificWeight / gravity).toFixed(1).replace('.', ',')} kg/m³</span> (g = {gravity.toFixed(2).replace('.', ',')} m/s²)
                  </p>
                </div>
              ) : (
              <div className="flex gap-3 mt-2">
                <div className="flex-1">
                  <label className="text-[10px] font-medium text-slate-400 dark:text-slate-400 mb-1 block">Densidade (kg/m³)</label>
                  <NumberInput value={customFluidDensity} onChange={onCustomFluidDensityChange} />
                </div>
                <div className="w-24">
                  <label className="text-[10px] font-medium text-slate-400 dark:text-slate-400 mb-1 block">Profund. (cm)</label>
                  <NumberInput value={depthA} min={1} max={1000} step="1" onChange={onDepthAChange} />
                </div>
              </div>
              )}

              {/* Toggle Comparador de Fluidos */}
              {!inverseSpecificWeightMode && (
              <div className={`mt-3 p-2.5 rounded-xl border transition-all ${
                showFluidComparison 
                  ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/70 shadow-sm' 
                  : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                      showFluidComparison ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      <FlaskConical className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <span className="truncate">Comparador</span>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                          showFluidComparison 
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' 
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}>
                          {showFluidComparison ? 'Ativado' : 'Off'}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 dark:text-slate-400 truncate">Óleo, Água e Glicerina</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onToggleFluidComparison}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      showFluidComparison ? 'bg-blue-600 dark:bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    title={showFluidComparison ? 'Desativar comparador de fluidos' : 'Ativar comparador de fluidos'}
                    aria-label={showFluidComparison ? 'Desativar comparador de fluidos' : 'Ativar comparador de fluidos'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        showFluidComparison ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
              )}
            </div>
          </div>

          {enableTwoFluids && !inverseSpecificWeightMode && (
            <div className="space-y-3 relative pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
              <div className={inputGroupClass}>
                <label className={labelClass}>Líquido Inferior (B)</label>
                <select
                  className={selectClass}
                  value={selectedFluidB}
                  onChange={onFluidBChange}
                >
                  {FLUIDS.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                  <option value="Custom">Personalizado...</option>
                </select>

                <div className="flex gap-3 mt-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-medium text-slate-400 dark:text-slate-400 mb-1 block">Densidade (kg/m³)</label>
                    <NumberInput value={customFluidDensityB} onChange={onCustomFluidDensityBChange} />
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] font-medium text-slate-400 dark:text-slate-400 mb-1 block">Profund. (cm)</label>
                    <NumberInput value={depthB} min={1} max={1000} step="1" onChange={onDepthBChange} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tank Properties */}
      <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xl shadow-blue-200/20 dark:shadow-none transition-colors duration-200">
        <SectionHeader icon={<Settings2 className="w-4 h-4" />} title="Tanque" />
        <div className="grid grid-cols-2 gap-3">
          <div className={inputGroupClass}>
            <label className={labelClass}>Largura (cm)</label>
            <NumberInput value={tankWidth} min={50} max={2000} onChange={onTankWidthChange} />
          </div>
          <div className={inputGroupClass}>
            <label className={labelClass}>Profund. (cm)</label>
            <NumberInput value={tankDepth} min={10} max={1000} onChange={onTankDepthChange} />
          </div>
        </div>
      </div>
    </div>
  );
};
