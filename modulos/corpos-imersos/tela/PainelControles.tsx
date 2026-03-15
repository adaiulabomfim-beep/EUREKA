import React from 'react';
import { Box, Settings2, Droplets, Layers, AlertTriangle } from 'lucide-react';
import { MATERIALS, FLUIDS } from '../dominio/configuracao';
import { ObjectShape } from '../dominio/tipos';
import { NumberInput } from './components/NumberInput';

interface PainelControlesProps {
  selectedMaterial: string;
  customObjDensity: number;
  shape: ObjectShape;
  dim1: number;
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
  onFluidChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onCustomFluidDensityChange: (val: number) => void;
  onDepthAChange: (val: number) => void;
  onEnableTwoFluidsChange: (val: boolean) => void;
  onFluidBChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onCustomFluidDensityBChange: (val: number) => void;
  onDepthBChange: (val: number) => void;
  onTankWidthChange: (val: number) => void;
  onTankDepthChange: (val: number) => void;
}

export const PainelControles: React.FC<PainelControlesProps> = ({
  selectedMaterial,
  customObjDensity,
  shape,
  dim1,
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
  onFluidChange,
  onCustomFluidDensityChange,
  onDepthAChange,
  onEnableTwoFluidsChange,
  onFluidBChange,
  onCustomFluidDensityBChange,
  onDepthBChange,
  onTankWidthChange,
  onTankDepthChange,
}) => {
  const inputGroupClass = 'space-y-1.5';
  const labelClass = 'block text-[10px] font-semibold text-slate-400 uppercase tracking-wider';
  const inputClass =
    'w-full h-9 px-3 border border-slate-200/60 rounded-lg text-xs bg-white text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all shadow-sm placeholder:text-slate-300';
  const selectClass =
    'w-full h-9 px-3 border border-slate-200/60 rounded-lg text-xs bg-slate-50/30 text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all shadow-sm cursor-pointer hover:bg-white';

  const isObjectTooWide = (shape === ObjectShape.CUBE ? dim1 : dim1 * 2) > tankWidth;

  return (
    <div className="flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
      {/* Object Properties */}
      <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-slate-200/50">
        <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-slate-100/60">
            <div className="text-blue-500"><Box className="w-4 h-4" /></div>
            <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Propriedades do Objeto</h3>
        </div>
        <div className="space-y-4">
          <div className={inputGroupClass}>
            <label className={labelClass}>Geometria</label>
            <select className={selectClass} value={shape} onChange={(e) => onShapeChange(e.target.value as ObjectShape)}>
              <option value={ObjectShape.CUBE}>Cubo</option>
              <option value={ObjectShape.SPHERE}>Esfera</option>
            </select>
          </div>

          <div className="bg-slate-50/40 p-3 rounded-xl border border-slate-100/60 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className={`col-span-2 ${inputGroupClass}`}>
                <label className={labelClass}>{shape === ObjectShape.CUBE ? 'Aresta (cm)' : 'Raio (cm)'}</label>
                <NumberInput value={dim1} min={1} onChange={onDim1Change} />
              </div>
            </div>

            {isObjectTooWide && (
              <div className="flex items-start gap-2 text-[10px] text-amber-600 bg-amber-50/30 p-2.5 rounded-lg border border-amber-200/30">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span className="font-medium leading-tight">Atenção: Objeto excede a largura do tanque.</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1">
              <span className="text-[10px] font-medium text-slate-400">
                Área Base: <span className="text-slate-600 font-bold">{physics.baseArea.toFixed(3)} m²</span>
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                Volume: <span className="text-blue-500 font-bold">{physics.volume.toFixed(3)} m³</span>
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
        </div>
      </div>

      {/* Tank Properties */}
      <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-slate-200/50">
        <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-slate-100/60">
            <div className="text-blue-500"><Settings2 className="w-4 h-4" /></div>
            <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Tanque</h3>
        </div>
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

      {/* Fluids */}
      <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-slate-200/50">
        <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-slate-100/60">
            <div className="text-blue-500"><Droplets className="w-4 h-4" /></div>
            <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Fluidos</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 mb-2 p-2.5 bg-slate-50/70 rounded-xl border border-slate-200/60 hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={enableTwoFluids}
              onChange={(e) => onEnableTwoFluidsChange(e.target.checked)}
              id="two-fluids"
              className="accent-blue-600 w-4 h-4 cursor-pointer rounded"
            />
            <label
              htmlFor="two-fluids"
              className="text-[10px] font-bold text-slate-700 cursor-pointer select-none uppercase tracking-widest flex-1"
            >
              Modo Dois Líquidos
            </label>
            {enableTwoFluids && <Layers className="w-4 h-4 text-cyan-500" />}
          </div>

          <div className="space-y-3 relative">
            <div className={inputGroupClass}>
              <label className={labelClass}>{enableTwoFluids ? 'Líquido Superior (A)' : 'Líquido Principal'}</label>
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

              <div className="flex gap-3 mt-2">
                <div className="flex-1">
                  <label className="text-[10px] font-medium text-slate-400 mb-1 block">Densidade (kg/m³)</label>
                  <NumberInput value={customFluidDensity} onChange={onCustomFluidDensityChange} />
                </div>
                <div className="w-24">
                  <label className="text-[10px] font-medium text-slate-400 mb-1 block">Profund. (cm)</label>
                  <NumberInput value={depthA} min={1} max={1000} step="1" onChange={onDepthAChange} />
                </div>
              </div>
            </div>
          </div>

          {enableTwoFluids && (
            <div className="space-y-3 relative pt-4 mt-4 border-t border-slate-100">
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
                    <label className="text-[10px] font-medium text-slate-400 mb-1 block">Densidade (kg/m³)</label>
                    <NumberInput value={customFluidDensityB} onChange={onCustomFluidDensityBChange} />
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] font-medium text-slate-400 mb-1 block">Profund. (cm)</label>
                    <NumberInput value={depthB} min={1} max={1000} step="1" onChange={onDepthBChange} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
