import React from 'react';
import { BookOpen, Construction, Layers, Waves, RotateCcw, Scale, X } from 'lucide-react';
import { SistemaUnidadesBarragem, TipoBarragem } from '../dominio/tipos';
import { DAM_PRESETS, DamPreset } from '../dominio/presets';
import { NumberInput } from './components/NumberInput';
import { ScrollablePanel } from '../../../../interface/ScrollablePanel';

export const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}> = ({ icon, title, action }) => (
  <div className="flex items-center justify-between gap-2 mb-5 pb-3 border-b border-blue-50 dark:border-slate-800/80">
    <div className="flex items-center gap-2">
      <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">{icon}</div>
      <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">{title}</h3>
    </div>
    {action}
  </div>
);

interface PainelControlesProps {
  damType: TipoBarragem;
  setDamType: (type: TipoBarragem) => void;
  inclinationAngle: number;
  setInclinationAngle: (val: number) => void;
  buttressAngle?: number;
  setButtressAngle?: (val: number) => void;
  downstreamAngle?: number;
  setDownstreamAngle?: (val: number) => void;
  archRadius?: number;
  setArchRadius?: (val: number) => void;
  damHeight: number;
  setDamHeight: (val: number) => void;
  damBaseWidth: number;
  setDamBaseWidth: (val: number) => void;
  damCrestWidth: number;
  setDamCrestWidth: (val: number) => void;
  damWidth?: number;
  setDamWidth?: (val: number) => void;
  concreteSpecificGravity?: number;
  setConcreteSpecificGravity?: (val: number) => void;
  fluidKey?: 'agua' | 'agua20C';
  setFluidKey?: (val: 'agua' | 'agua20C') => void;
  upstreamLevel: number;
  setUpstreamLevel: (val: number) => void;
  hasDownstream: boolean;
  setHasDownstream: (val: boolean) => void;
  downstreamLevel: number;
  setDownstreamLevel: (val: number) => void;
  hasMudLayer: boolean;
  setHasMudLayer: (val: boolean) => void;
  mudHeight: number;
  setMudHeight: (val: number) => void;
  mudDensity: number;
  setMudDensity: (val: number) => void;
  hasPercolation?: boolean;
  setHasPercolation?: (val: boolean) => void;
  upliftFactorUp?: number;
  setUpliftFactorUp?: (val: number) => void;
  upliftFactorDown?: number;
  setUpliftFactorDown?: (val: number) => void;
  showTriangularMode?: boolean;
  unitSystem: SistemaUnidadesBarragem;
  setUnitSystem: (val: SistemaUnidadesBarragem) => void;
  maxWaterLevel: number;
  presets: { [key: string]: DamPreset };
  activePresetKey: string | null;
  loadPreset: (key: string) => void;
  onResetDefaults?: () => void;
}

export const PainelControles: React.FC<PainelControlesProps> = ({
  damType,
  setDamType,
  inclinationAngle,
  setInclinationAngle,
  buttressAngle,
  setButtressAngle,
  downstreamAngle,
  setDownstreamAngle,
  archRadius,
  setArchRadius,
  damHeight,
  setDamHeight,
  damBaseWidth,
  setDamBaseWidth,
  damCrestWidth,
  setDamCrestWidth,
  damWidth = 1,
  setDamWidth,
  concreteSpecificGravity = 2.4,
  setConcreteSpecificGravity,
  fluidKey = 'agua',
  setFluidKey,
  upstreamLevel,
  setUpstreamLevel,
  hasDownstream,
  setHasDownstream,
  downstreamLevel,
  setDownstreamLevel,
  hasMudLayer,
  setHasMudLayer,
  mudHeight,
  setMudHeight,
  mudDensity,
  setMudDensity,
  hasPercolation = false,
  setHasPercolation,
  upliftFactorUp = 1.0,
  setUpliftFactorUp,
  upliftFactorDown = 0.0,
  setUpliftFactorDown,
  showTriangularMode = false,
  unitSystem,
  setUnitSystem,
  maxWaterLevel,
  presets,
  activePresetKey,
  loadPreset,
  onResetDefaults,
}) => {
  const labelClass = "block text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1.5";
  const selectClass =
    "w-full h-9 px-3 border border-slate-200 dark:border-slate-700/80 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/60";

  const activePreset = activePresetKey ? presets[activePresetKey] : undefined;

  return (
    <ScrollablePanel
      id="tour-controles"
      dataTour="painel-controles"
      className="lg:col-span-3 h-[600px] lg:h-full lg:max-h-full min-h-0 overflow-hidden"
      contentClassName="flex flex-col gap-4 pr-3.5 pb-4"
    >
      {/* SIMULAÇÕES PRONTAS */}
      {Object.keys(presets).length > 0 && (
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-4 shadow-md text-white shrink-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 text-xs font-black tracking-wider uppercase opacity-95">
              <BookOpen className="w-4 h-4" />
              Simulações Prontas
            </div>
            {onResetDefaults && (
              <button
                type="button"
                onClick={onResetDefaults}
                title="Restaurar estado inicial"
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/20 hover:bg-white/30 border border-white/30 text-[10px] font-bold uppercase tracking-wider text-white transition-colors cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3 h-3" />
                Resetar
              </button>
            )}
          </div>
          <select
            className="w-full bg-white/20 hover:bg-white/30 transition-colors rounded-xl p-2.5 text-left border border-white/30 text-white outline-none cursor-pointer text-xs font-medium"
            value={activePresetKey ?? ''}
            onChange={(e) => {
              if (e.target.value) loadPreset(e.target.value);
            }}
          >
            <option value="" disabled className="text-slate-800">
              Selecione uma simulação...
            </option>
            {Object.entries(presets).map(([key, preset]) => (
              <option key={key} value={key} className="text-slate-800">
                {preset.title}
              </option>
            ))}
          </select>
          {activePreset && (
            <div className="mt-2.5 p-3 bg-white/10 rounded-xl border border-white/20 text-xs leading-relaxed text-blue-50 relative">
              <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-white/15">
                <span className="font-bold text-white text-[10px] uppercase tracking-wider">
                  {activePreset.subtitle}
                </span>
                {onResetDefaults && (
                  <button
                    type="button"
                    onClick={onResetDefaults}
                    title="Fechar simulação e voltar ao estado inicial"
                    className="p-0.5 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[11px] leading-relaxed text-blue-50/95 font-medium">
                {activePreset.enunciado}
              </p>
            </div>
          )}
        </div>
      )}

      {/* SISTEMA DE UNIDADES */}
      <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-xl shadow-blue-200/20 dark:shadow-none transition-colors duration-200 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Sistema de Unidades
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setUnitSystem('SI')}
            className={`py-2 px-2.5 rounded-xl border text-[10px] font-bold tracking-wider transition-all flex flex-col items-center justify-center cursor-pointer ${
              unitSystem === 'SI'
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>SI</span>
            <span className="text-[9px] font-normal opacity-80">kN/m · kPa</span>
          </button>
          <button
            type="button"
            onClick={() => setUnitSystem('TECNICO_KGF')}
            className={`py-2 px-2.5 rounded-xl border text-[10px] font-bold tracking-wider transition-all flex flex-col items-center justify-center cursor-pointer ${
              unitSystem === 'TECNICO_KGF'
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Técnico</span>
            <span className="text-[9px] font-normal opacity-80">kgf/m · kgf/m²</span>
          </button>
        </div>
      </div>

      {/* Dam Properties */}
      <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xl shadow-blue-200/20 dark:shadow-none transition-colors duration-200 shrink-0">
        <SectionHeader
          icon={<Construction className="w-4 h-4" />}
          title="Estrutura da Barragem"
          action={
            Object.keys(presets).length === 0 && onResetDefaults && (
              <button
                type="button"
                onClick={onResetDefaults}
                title="Restaurar estado inicial"
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-colors cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3 h-3" />
                Resetar
              </button>
            )
          }
        />
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Tipo de Barragem</label>
            <select
              className={selectClass}
              value={damType}
              onChange={(e) => setDamType(e.target.value as TipoBarragem)}
            >
              <option value={TipoBarragem.GRAVIDADE}>Gravidade</option>
              <option value={TipoBarragem.TERRA_ENROCAMENTO}>Terra / Enrocamento</option>
              <option value={TipoBarragem.ARCO}>Arco</option>
              <option value={TipoBarragem.CONTRAFORTE}>Contraforte</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>
              {damType === TipoBarragem.TERRA_ENROCAMENTO ? 'Inclinação Montante (θ)' : 'Inclinação da Face AB (θ)'}
            </label>
            <NumberInput
              value={Number(inclinationAngle.toFixed(2))}
              min={15}
              max={90}
              step="any"
              onChange={(val) => {
                setInclinationAngle(val);
                if (showTriangularMode && damCrestWidth === 0 && val > 15 && val < 90) {
                  const newBase = parseFloat((damHeight / Math.tan((val * Math.PI) / 180)).toFixed(2));
                  setDamBaseWidth(newBase);
                }
              }}
            />
          </div>
          {damType === TipoBarragem.TERRA_ENROCAMENTO && downstreamAngle !== undefined && setDownstreamAngle && (
            <div>
              <label className={labelClass}>Inclinação Jusante (θ)</label>
              <NumberInput value={downstreamAngle} min={15} max={90} onChange={setDownstreamAngle} />
            </div>
          )}
          {damType === TipoBarragem.CONTRAFORTE && setButtressAngle && buttressAngle !== undefined && (
            <div>
              <label className={labelClass}>Inclinação dos Contrafortes (°)</label>
              <NumberInput value={buttressAngle} min={15} max={90} onChange={setButtressAngle} />
            </div>
          )}
          {damType === TipoBarragem.ARCO && setArchRadius && archRadius !== undefined && (
            <div>
              <label className={labelClass}>Raio de Curvatura (m)</label>
              <NumberInput value={archRadius} min={15} max={500} onChange={setArchRadius} />
            </div>
          )}
          <div className="bg-slate-50/60 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            <div>
              <label className={labelClass}>Altura Total AC (m)</label>
              <NumberInput
                value={damHeight}
                min={1}
                max={200}
                onChange={(val) => {
                  setDamHeight(val);
                  if (showTriangularMode && damCrestWidth === 0 && damBaseWidth > 0) {
                    const ang = (Math.atan2(val, damBaseWidth) * 180) / Math.PI;
                    setInclinationAngle(ang);
                  }
                }}
              />
            </div>
            {damType !== TipoBarragem.CONTRAFORTE && damType !== TipoBarragem.TERRA_ENROCAMENTO && (
              <div>
                <label className={labelClass}>
                  {damType === TipoBarragem.ARCO ? 'Espessura na Base (m)' : 'Largura da Base BC (m)'}
                </label>
                <NumberInput
                  value={damBaseWidth}
                  min={1}
                  max={200}
                  step="any"
                  onChange={(val) => {
                    setDamBaseWidth(val);
                    if (showTriangularMode && damCrestWidth === 0 && val > 0) {
                      const ang = (Math.atan2(damHeight, val) * 180) / Math.PI;
                      setInclinationAngle(ang);
                    }
                  }}
                />
              </div>
            )}
            <div>
              <label className={labelClass}>Largura da Crista (m)</label>
              <NumberInput value={damCrestWidth} min={0} max={100} onChange={setDamCrestWidth} />
            </div>
            {damType === TipoBarragem.GRAVIDADE && setDamWidth && (
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <label className={labelClass}>Largura Long. b (m)</label>
                  <NumberInput value={damWidth} min={1} max={500} step="any" onChange={setDamWidth} />
                </div>
                {setConcreteSpecificGravity && (
                  <div>
                    <label className={labelClass}>Dens. Relativa Concreto (d)</label>
                    <NumberInput
                      value={concreteSpecificGravity}
                      min={1.8}
                      max={3.2}
                      step={0.1}
                      onChange={setConcreteSpecificGravity}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Water Levels & Percolation */}
      <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xl shadow-blue-200/20 dark:shadow-none transition-colors duration-200 shrink-0">
        <SectionHeader icon={<Layers className="w-4 h-4" />} title="Fluido, Níveis e Percolação" />
        <div className="space-y-4">
          {setFluidKey && (
            <div>
              <label className={labelClass}>Propriedade do Fluido</label>
              <select
                className={selectClass}
                value={fluidKey}
                onChange={(e) => setFluidKey(e.target.value as 'agua' | 'agua20C')}
              >
                <option value="agua">Água Doce Padrão (ρ = 1.000 kg/m³ · γ = 9.810 N/m³)</option>
                <option value="agua20C">Água a 20 °C (γ = 9.790 N/m³)</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2.5 mb-2 p-2.5 bg-slate-50/70 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <input
              type="checkbox"
              checked={hasDownstream}
              onChange={(e) => setHasDownstream(e.target.checked)}
              id="jusante-toggle"
              className="accent-blue-600 w-4 h-4 cursor-pointer rounded"
            />
            <label
              htmlFor="jusante-toggle"
              className="text-[10px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer select-none uppercase tracking-widest flex-1"
            >
              Jusante (Saída)
            </label>
            {hasDownstream && <Waves className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />}
          </div>

          <div className="space-y-3 relative">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Profundidade Montante (m)
              </label>
              <NumberInput
                min={0}
                max={maxWaterLevel}
                value={upstreamLevel}
                onChange={(val) => {
                  setUpstreamLevel(val);
                  if (downstreamLevel > val) setDownstreamLevel(val);
                  if (mudHeight > val) setMudHeight(val);
                }}
              />
            </div>
          </div>

          {hasDownstream && (
            <div className="space-y-3 relative pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Jusante (m)
                </label>
                <NumberInput
                  min={0}
                  max={upstreamLevel}
                  value={Math.min(downstreamLevel, upstreamLevel)}
                  onChange={(val) => setDownstreamLevel(Math.min(val, upstreamLevel))}
                />
              </div>
            </div>
          )}

          {/* Percolação / Subpressão sob a fundação BC */}
          {damType === TipoBarragem.GRAVIDADE && setHasPercolation && (
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between gap-2 p-2.5 bg-purple-50/70 dark:bg-purple-950/30 rounded-xl border border-purple-200/70 dark:border-purple-800/50 transition-colors">
                <div className="flex items-center gap-2.5 flex-1">
                  <input
                    type="checkbox"
                    checked={hasPercolation}
                    onChange={(e) => setHasPercolation(e.target.checked)}
                    id="percolacao-toggle"
                    className="accent-purple-700 w-4 h-4 cursor-pointer rounded"
                  />
                  <label
                    htmlFor="percolacao-toggle"
                    className="text-[10px] font-bold text-purple-900 dark:text-purple-200 cursor-pointer select-none uppercase tracking-widest flex-1"
                  >
                    Percolação sob a Base (Subpressão U)
                  </label>
                </div>
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                    hasPercolation
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {hasPercolation ? 'Ativa' : 'Sem Percolação'}
                </span>
              </div>

              {hasPercolation && setUpliftFactorUp && setUpliftFactorDown && (
                <div className="bg-purple-50/40 dark:bg-purple-950/20 p-3 rounded-xl border border-purple-200/50 dark:border-purple-900/40 space-y-2.5">
                  <div className="text-[10px] text-purple-900 dark:text-purple-200 font-semibold leading-snug">
                    Hipótese adotada de cálculo: distribuição linear de subpressão entre B (montante) e C (jusante).
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[9px] font-bold text-purple-900/80 dark:text-purple-300 uppercase tracking-wider block mb-1">
                        Fator em B (k_B)
                      </label>
                      <NumberInput
                        min={0}
                        max={1}
                        step={0.05}
                        value={upliftFactorUp}
                        onChange={setUpliftFactorUp}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-purple-900/80 dark:text-purple-300 uppercase tracking-wider block mb-1">
                        Fator em C (k_C)
                      </label>
                      <NumberInput
                        min={0}
                        max={1}
                        step={0.05}
                        value={upliftFactorDown}
                        onChange={setUpliftFactorDown}
                      />
                    </div>
                  </div>
                  <div className="text-[9.5px] text-purple-800/90 dark:text-purple-300/90">
                    Para distribuição triangular clássica: k_B = 1,00 (carga total em B) e k_C = 0,00 (pressão nula em C).
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Camada de Lama no Fundo */}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2.5 p-2.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/70 dark:border-amber-800/50 transition-colors">
              <input
                type="checkbox"
                checked={hasMudLayer}
                onChange={(e) => setHasMudLayer(e.target.checked)}
                id="lama-toggle"
                className="accent-amber-700 w-4 h-4 cursor-pointer rounded"
              />
              <label
                htmlFor="lama-toggle"
                className="text-[10px] font-bold text-amber-900 dark:text-amber-200 cursor-pointer select-none uppercase tracking-widest flex-1"
              >
                Camada de Lama (Fundo)
              </label>
            </div>

            {hasMudLayer && (
              <div className="grid grid-cols-2 gap-2.5 bg-amber-50/40 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/40">
                <div>
                  <label className="text-[9px] font-bold text-amber-900/80 dark:text-amber-300 uppercase tracking-wider block mb-1">
                    Altura Lama (m)
                  </label>
                  <NumberInput
                    min={0}
                    max={upstreamLevel}
                    value={Math.min(mudHeight, upstreamLevel)}
                    onChange={(val) => setMudHeight(Math.min(val, upstreamLevel))}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-amber-900/80 dark:text-amber-300 uppercase tracking-wider block mb-1">
                    ρ Lama (kg/m³)
                  </label>
                  <NumberInput
                    min={1000}
                    max={3000}
                    step={50}
                    value={mudDensity}
                    onChange={setMudDensity}
                  />
                </div>
                <div className="col-span-2 text-[10px] text-amber-800 dark:text-amber-300/90 font-medium">
                  Densidade relativa: d = {(mudDensity / 1000).toFixed(2)} ({Math.max(0, upstreamLevel - Math.min(mudHeight, upstreamLevel)).toFixed(1)} m H₂O + {Math.min(mudHeight, upstreamLevel).toFixed(1)} m lama)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ScrollablePanel>
  );
};
