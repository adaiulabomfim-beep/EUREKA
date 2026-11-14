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
  floatingEquilibriumMode?: boolean;
  cylinderDiameterCm?: number;
  cylinderHeightCm?: number;
  submergedHeightCm?: number;
  onCylinderDiameterChange?: (val: number) => void;
  onCylinderHeightChange?: (val: number) => void;
  onSubmergedHeightChange?: (val: number) => void;
  interfaceEquilibriumMode?: boolean;
  isSimulating?: boolean;
  bodyRelativeDensity?: number;
  upperFluidRelativeDensity?: number;
  lowerFluidRelativeDensity?: number;
  illustrativeWidthCm?: number;
  illustrativeHeightCm?: number;
  onBodyRelativeDensityChange?: (val: number) => void;
  onUpperFluidRelativeDensityChange?: (val: number) => void;
  onLowerFluidRelativeDensityChange?: (val: number) => void;
  onIllustrativeWidthChange?: (val: number) => void;
  onIllustrativeHeightChange?: (val: number) => void;
  anchoredBuoyMode?: boolean;
  buoyDiameterM?: number;
  buoyWeightKN?: number;
  onBuoyDiameterChange?: (val: number) => void;
  onBuoyWeightChange?: (val: number) => void;
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
  floatingEquilibriumMode = false,
  cylinderDiameterCm = 9,
  cylinderHeightCm = 11,
  submergedHeightCm = 8,
  onCylinderDiameterChange,
  onCylinderHeightChange,
  onSubmergedHeightChange,
  interfaceEquilibriumMode = false,
  isSimulating = false,
  bodyRelativeDensity = 7.85,
  upperFluidRelativeDensity = 1.0,
  lowerFluidRelativeDensity = 13.56,
  illustrativeWidthCm = 80,
  illustrativeHeightCm = 90,
  onBodyRelativeDensityChange,
  onUpperFluidRelativeDensityChange,
  onLowerFluidRelativeDensityChange,
  onIllustrativeWidthChange,
  onIllustrativeHeightChange,
  anchoredBuoyMode = false,
  buoyDiameterM = 1.5,
  buoyWeightKN = 8.5,
  onBuoyDiameterChange,
  onBuoyWeightChange,
}) => {
  const inputGroupClass = 'space-y-1.5';
  const labelClass = "block text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1.5";
  const inputClass =
    "w-full h-9 px-3 border border-slate-200 dark:border-slate-700/80 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-sm placeholder:text-slate-400";
  const selectClass =
    "w-full h-9 px-3 border border-slate-200 dark:border-slate-700/80 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/60";

  const effectiveObjWidthCm = anchoredBuoyMode
    ? buoyDiameterM * 100
    : interfaceEquilibriumMode
    ? illustrativeWidthCm
    : floatingEquilibriumMode
    ? cylinderDiameterCm
    : inverseSpecificWeightMode
    ? (physics?.illustrativeSideCm ?? 26.3)
    : (shape === ObjectShape.CUBE ? dim1 : dim1 * 2);
  const isObjectTooWide = effectiveObjWidthCm > tankWidth;
  const emergedHeightCm = Math.max(0, cylinderHeightCm - submergedHeightCm);

  return (
    <div className="flex flex-col gap-4 shrink-0">
      {/* Object Properties */}
      <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xl shadow-blue-200/20 dark:shadow-none transition-colors duration-200">
        <SectionHeader icon={<Box className="w-4 h-4" />} title="Propriedades do Objeto" />
        {anchoredBuoyMode ? (
          <div className="space-y-4">
            <div className="p-2.5 rounded-xl bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200/70 dark:border-cyan-800/60 text-[10px] text-cyan-900 dark:text-cyan-200 leading-relaxed">
              <span className="font-bold block mb-0.5">Boia Esférica Submersa Ancorada por Cabo</span>
              Configure o diâmetro <span className="font-bold">D</span> e o peso próprio <span className="font-bold">W</span> da boia. Clique em <span className="font-bold">ANALISAR</span> para determinar o empuxo e a força de tração <span className="font-bold">T</span> no cabo.
            </div>

            <div className={inputGroupClass}>
              <label className={labelClass}>Objeto / Condição</label>
              <div className="h-9 px-3 flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200">
                <span>Boia Esférica</span>
                <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400">Totalmente Submersa (Cabo)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className={inputGroupClass}>
                <label className={labelClass}>Diâmetro D (m)</label>
                <NumberInput
                  value={buoyDiameterM}
                  min={0.1}
                  step="0.05"
                  onChange={(v) => onBuoyDiameterChange?.(v)}
                />
              </div>
              <div className={inputGroupClass}>
                <label className={labelClass}>Raio R = D/2 (m)</label>
                <div className="h-9 px-3 flex items-center rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {(buoyDiameterM / 2).toFixed(2).replace('.', ',')} m
                </div>
              </div>
            </div>

            <div className={inputGroupClass}>
              <label className={labelClass}>Peso Próprio da Boia — W (kN)</label>
              <NumberInput
                value={buoyWeightKN}
                min={0.05}
                step="0.1"
                onChange={(v) => onBuoyWeightChange?.(v)}
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-400">
                W = <span className="font-semibold text-slate-600 dark:text-slate-300">{(buoyWeightKN * 1000).toFixed(0)} N</span> | Ancoragem: cabo vertical preso ao fundo
              </p>
            </div>

            {isSimulating && (
              <div className="bg-slate-50/60 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 text-[10px]">
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>Volume total V = πD³/6:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {(physics.volume ?? 0).toFixed(4).replace('.', ',')} m³
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>Empuxo E = γ·V:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {((physics.buoyancyForce ?? 0) / 1000).toFixed(2).replace('.', ',')} kN
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>Tração no cabo T = E − W:</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    {((physics.cordTension ?? 0) / 1000).toFixed(2).replace('.', ',')} kN
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : interfaceEquilibriumMode ? (
          <div className="space-y-4">
            <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 text-[10px] text-indigo-900 dark:text-indigo-200 leading-relaxed">
              <span className="font-bold block mb-0.5">Bloco na Interface Água-Mercúrio</span>
              Configure as densidades relativas do bloco e dos dois fluidos imiscíveis. Clique em <span className="font-bold">ANALISAR</span> para calcular o equilíbrio e a razão <span className="font-bold">a/b</span>.
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

            <div className={inputGroupClass}>
              <label className={labelClass}>Densidade Relativa do Bloco — d_s</label>
              <NumberInput
                value={bodyRelativeDensity}
                min={0.1}
                step="0.05"
                onChange={(v) => onBodyRelativeDensityChange?.(v)}
              />
              {isSimulating && (
                <p className="text-[10px] text-slate-400 dark:text-slate-400">
                  ρ_s = <span className="font-semibold text-slate-600 dark:text-slate-300">{(bodyRelativeDensity * 1000).toFixed(0)} kg/m³</span> | γ_s = <span className="font-semibold text-slate-600 dark:text-slate-300">{(bodyRelativeDensity * 1000 * gravity).toFixed(1).replace('.', ',')} N/m³</span>
                </p>
              )}
            </div>

            {!(bodyRelativeDensity > upperFluidRelativeDensity && bodyRelativeDensity < lowerFluidRelativeDensity) && (
              <div className="flex items-start gap-2 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span className="font-medium leading-tight">
                  Para equilíbrio na interface, a densidade relativa do bloco deve estar entre a do fluido superior e a do fluido inferior (d_a &lt; d_s &lt; d_m).
                </span>
              </div>
            )}

            <div className="bg-slate-50/60 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                Geometria Ilustrativa do Bloco
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className={inputGroupClass}>
                  <label className={labelClass}>Largura L (cm)</label>
                  <NumberInput
                    value={illustrativeWidthCm}
                    min={10}
                    step="5"
                    onChange={(v) => onIllustrativeWidthChange?.(v)}
                  />
                </div>
                <div className={inputGroupClass}>
                  <label className={labelClass}>Altura H (cm)</label>
                  <NumberInput
                    value={illustrativeHeightCm}
                    min={10}
                    step="5"
                    onChange={(v) => onIllustrativeHeightChange?.(v)}
                  />
                </div>
              </div>

              {isSimulating && (
                <div className="flex flex-col gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px]">
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                    <span>Altura a (na Água):</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">
                      {(physics.heightA_cm ?? 0).toFixed(2).replace('.', ',')} cm ({((physics.fractionA ?? 0) * 100).toFixed(1).replace('.', ',')}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                    <span>Altura b (no Mercúrio):</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {(physics.heightB_cm ?? 0).toFixed(2).replace('.', ',')} cm ({((physics.fractionB ?? 0) * 100).toFixed(1).replace('.', ',')}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                    <span>Razão a/b (invariante):</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {(physics.ratioAtoB ?? 0).toFixed(3).replace('.', ',')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : floatingEquilibriumMode ? (
          <div className="space-y-4">
            <div className="p-2.5 rounded-xl bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200/70 dark:border-cyan-800/60 text-[10px] text-cyan-900 dark:text-cyan-200 leading-relaxed">
              <span className="font-bold block mb-0.5">Equilíbrio de Lata Cilíndrica Flutuante (P = E)</span>
              Determina o peso próprio <span className="font-semibold">P</span> da lata a partir da geometria submersa e do Princípio de Arquimedes.
            </div>

            <div className={inputGroupClass}>
              <label className={labelClass}>Objeto / Geometria</label>
              <div className="h-9 px-3 flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200">
                <span>Lata Cilíndrica Vertical</span>
                <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400">Flutuando</span>
              </div>
            </div>

            <div className="bg-slate-50/60 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className={inputGroupClass}>
                  <label className={labelClass}>Diâmetro D (cm)</label>
                  <NumberInput
                    value={cylinderDiameterCm}
                    min={0.5}
                    step="0.5"
                    onChange={(v) => onCylinderDiameterChange?.(v)}
                  />
                </div>
                <div className={inputGroupClass}>
                  <label className={labelClass}>Altura Total H (cm)</label>
                  <NumberInput
                    value={cylinderHeightCm}
                    min={1}
                    step="0.5"
                    onChange={(v) => onCylinderHeightChange?.(v)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className={inputGroupClass}>
                  <label className={labelClass}>Altura Submersa h_sub (cm)</label>
                  <NumberInput
                    value={submergedHeightCm}
                    min={0.1}
                    max={cylinderHeightCm}
                    step="0.5"
                    onChange={(v) => onSubmergedHeightChange?.(Math.min(cylinderHeightCm, Math.max(0.1, v)))}
                  />
                </div>
                <div className={inputGroupClass}>
                  <label className={labelClass}>Altura Emersa h_em (cm)</label>
                  <div className="h-9 px-3 flex items-center rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-100/80 dark:bg-slate-800/90 text-sm font-bold text-slate-700 dark:text-slate-200">
                    {emergedHeightCm.toFixed(1).replace('.', ',')} cm
                  </div>
                </div>
              </div>

              {submergedHeightCm > cylinderHeightCm && (
                <div className="flex items-start gap-2 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span className="font-medium leading-tight">A altura submersa não pode exceder a altura total da lata.</span>
                </div>
              )}

              <div className="flex flex-col gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px]">
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>Área da Seção (A):</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {physics.baseArea.toFixed(6).replace('.', ',')} m² ({(physics.baseArea * 10000).toFixed(2).replace('.', ',')} cm²)
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>Volume Total (V_total):</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {physics.volume.toFixed(6).replace('.', ',')} m³ ({(physics.volume * 1000000).toFixed(2).replace('.', ',')} cm³)
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>Volume Submerso (V_sub):</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">
                    {physics.vol_deslocado.toFixed(6).replace('.', ',')} m³ ({(physics.vol_deslocado * 1000000).toFixed(2).replace('.', ',')} cm³)
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : inverseSpecificWeightMode ? (
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
              <option value={ObjectShape.CYLINDER}>Cilindro</option>
            </select>
          </div>

          <div className="bg-slate-50/60 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className={shape === ObjectShape.CYLINDER ? inputGroupClass : `col-span-2 ${inputGroupClass}`}>
                <label className={labelClass}>{shape === ObjectShape.CUBE ? 'Aresta (cm)' : 'Raio (cm)'}</label>
                <NumberInput value={dim1} min={1} onChange={onDim1Change} />
              </div>
              {shape === ObjectShape.CYLINDER && (
                <div className={inputGroupClass}>
                  <label className={labelClass}>Altura (cm)</label>
                  <NumberInput value={dim2} min={1} onChange={(v) => onDim2Change?.(v)} />
                </div>
              )}
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
        {!inverseSpecificWeightMode && !floatingEquilibriumMode && !interfaceEquilibriumMode && !anchoredBuoyMode && (
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

          {interfaceEquilibriumMode && (
            <div className="flex items-center gap-2 p-2.5 bg-cyan-50/70 dark:bg-cyan-950/40 rounded-xl border border-cyan-200/60 dark:border-cyan-800/60 text-[10px] font-bold text-cyan-900 dark:text-cyan-200">
              <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span>Dois Fluidos Imiscíveis (Interface Água-Mercúrio)</span>
            </div>
          )}

          <div className="space-y-3 relative">
            <div className={inputGroupClass}>
              <label className={labelClass}>{(enableTwoFluids || interfaceEquilibriumMode) && !inverseSpecificWeightMode && !anchoredBuoyMode ? 'Fluido Superior (A)' : 'Líquido Principal'}</label>
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

              {interfaceEquilibriumMode ? (
                <div className="space-y-2 mt-2">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-medium text-slate-400 dark:text-slate-400 mb-1 block">Dens. Relativa d_a</label>
                      <NumberInput
                        value={upperFluidRelativeDensity}
                        min={0.05}
                        step="0.05"
                        onChange={(v) => onUpperFluidRelativeDensityChange?.(v)}
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-[10px] font-medium text-slate-400 dark:text-slate-400 mb-1 block">Camada (cm)</label>
                      <NumberInput value={depthA} min={20} max={1000} step="5" onChange={onDepthAChange} />
                    </div>
                  </div>
                  {isSimulating && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-400">
                      ρ_a = <span className="font-semibold text-slate-600 dark:text-slate-300">{(upperFluidRelativeDensity * 1000).toFixed(0)} kg/m³</span> | γ_a = <span className="font-semibold text-slate-600 dark:text-slate-300">{(upperFluidRelativeDensity * 1000 * gravity).toFixed(1).replace('.', ',')} N/m³</span>
                    </p>
                  )}
                </div>
              ) : inverseSpecificWeightMode ? (
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
              <div className="space-y-2 mt-2">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-medium text-slate-400 dark:text-slate-400 mb-1 block">Densidade (kg/m³)</label>
                    <NumberInput value={customFluidDensity} onChange={onCustomFluidDensityChange} />
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] font-medium text-slate-400 dark:text-slate-400 mb-1 block">Profund. (cm)</label>
                    <NumberInput value={depthA} min={1} max={1000} step="1" onChange={onDepthAChange} />
                  </div>
                </div>
                {(floatingEquilibriumMode || (anchoredBuoyMode && isSimulating)) && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-400">
                    Peso específico γ: <span className="font-semibold text-slate-600 dark:text-slate-300">{((customFluidDensity * gravity) / 1000).toFixed(2).replace('.', ',')} kN/m³ ({(customFluidDensity * gravity).toFixed(1).replace('.', ',')} N/m³)</span>
                  </p>
                )}
              </div>
              )}

              {/* Toggle Comparador de Fluidos */}
              {!inverseSpecificWeightMode && !floatingEquilibriumMode && !interfaceEquilibriumMode && !anchoredBuoyMode && (
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

          {(enableTwoFluids || interfaceEquilibriumMode) && !inverseSpecificWeightMode && !floatingEquilibriumMode && (
            <div className="space-y-3 relative pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
              <div className={inputGroupClass}>
                <label className={labelClass}>{interfaceEquilibriumMode ? 'Fluido Inferior (B)' : 'Líquido Inferior (B)'}</label>
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

                {interfaceEquilibriumMode ? (
                  <div className="space-y-2 mt-2">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] font-medium text-slate-400 dark:text-slate-400 mb-1 block">Dens. Relativa d_m</label>
                        <NumberInput
                          value={lowerFluidRelativeDensity}
                          min={0.1}
                          step="0.05"
                          onChange={(v) => onLowerFluidRelativeDensityChange?.(v)}
                        />
                      </div>
                      <div className="w-24">
                        <label className="text-[10px] font-medium text-slate-400 dark:text-slate-400 mb-1 block">Camada (cm)</label>
                        <NumberInput value={depthB} min={20} max={1000} step="5" onChange={onDepthBChange} />
                      </div>
                    </div>
                    {isSimulating && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-400">
                        ρ_m = <span className="font-semibold text-slate-600 dark:text-slate-300">{(lowerFluidRelativeDensity * 1000).toFixed(0)} kg/m³</span> | γ_m = <span className="font-semibold text-slate-600 dark:text-slate-300">{(lowerFluidRelativeDensity * 1000 * gravity).toFixed(1).replace('.', ',')} N/m³</span>
                      </p>
                    )}
                  </div>
                ) : (
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
                )}
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
            <NumberInput value={tankWidth} min={10} max={2000} onChange={onTankWidthChange} />
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
