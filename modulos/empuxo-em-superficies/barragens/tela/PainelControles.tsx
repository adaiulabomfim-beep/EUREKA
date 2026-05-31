import React from 'react';
import { Construction, Layers, BookOpen, Waves } from 'lucide-react';
import { TipoBarragem } from '../dominio/tipos';
import { NumberInput } from './components/NumberInput';
import { DamPreset } from '../dominio/presets';

export const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-blue-50">
        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">{icon}</div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h3>
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
  upstreamLevel: number;
  setUpstreamLevel: (val: number) => void;
  hasDownstream: boolean;
  setHasDownstream: (val: boolean) => void;
  downstreamLevel: number;
  setDownstreamLevel: (val: number) => void;
  maxWaterLevel: number;
  loadPreset: (key: string) => void;
  presets: { [key: string]: DamPreset };
}

export const PainelControles: React.FC<PainelControlesProps> = ({
  damType, setDamType,
  inclinationAngle, setInclinationAngle,
  buttressAngle, setButtressAngle,
  downstreamAngle, setDownstreamAngle,
  archRadius, setArchRadius,
  damHeight, setDamHeight,
  damBaseWidth, setDamBaseWidth,
  damCrestWidth, setDamCrestWidth,
  upstreamLevel, setUpstreamLevel,
  hasDownstream, setHasDownstream,
  downstreamLevel, setDownstreamLevel,
  maxWaterLevel,
  loadPreset,
  presets
}) => {
  const labelClass = "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5";
  const selectClass = "w-full h-9 px-3 border border-blue-100 rounded-lg text-sm bg-blue-50/30 text-slate-800 font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm cursor-pointer hover:bg-white";

  return (
    <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
      
      {/* SIMULAÇÕES PRONTAS */}
      <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl p-4 shadow-md text-white">
        <div className="flex items-center gap-2 mb-3 text-sm font-bold tracking-wider opacity-90">
          <BookOpen className="w-4 h-4" />
          SIMULAÇÕES PRONTAS
        </div>
        <select
          className="w-full bg-white/20 hover:bg-white/30 transition-colors rounded-lg p-3 text-left flex items-center gap-3 border border-white/30 text-white outline-none cursor-pointer text-xs"
          onChange={(e) => {
            if (e.target.value) {
              loadPreset(e.target.value);
            }
          }}
          defaultValue=""
        >
          <option value="" disabled className="text-gray-800">Selecione uma simulação...</option>
          {Object.entries(presets).map(([key, preset]) => (
            <option key={key} value={key} className="text-gray-800">
              {preset.title} ({preset.subtitle})
            </option>
          ))}
        </select>
      </div>

      {/* Dam Properties */}
      <div className="bg-white/75 backdrop-blur-md border border-blue-100/70 p-5 rounded-2xl shadow-xl shadow-blue-200/20">
          <SectionHeader icon={<Construction className="w-4 h-4" />} title="Estrutura da Barragem" />
          <div className="space-y-4">
              <div>
                  <label className={labelClass}>Tipo de Barragem</label>
                  <select className={selectClass} value={damType} onChange={(e) => setDamType(e.target.value as TipoBarragem)}>
                      <option value={TipoBarragem.GRAVIDADE}>Gravidade</option>
                      <option value={TipoBarragem.TERRA_ENROCAMENTO}>Terra / Enrocamento</option>
                      <option value={TipoBarragem.ARCO}>Arco</option>
                      <option value={TipoBarragem.CONTRAFORTE}>Contraforte</option>
                  </select>
              </div>
              <div>
                <label className={labelClass}>
                  {damType === TipoBarragem.TERRA_ENROCAMENTO ? 'Inclinação Montante (θ)' : 'Inclinação da Face (θ)'}
                </label>
                <NumberInput value={inclinationAngle} min={1} max={160} onChange={setInclinationAngle} />
              </div>
              {damType === TipoBarragem.TERRA_ENROCAMENTO && downstreamAngle !== undefined && setDownstreamAngle && (
                <div>
                  <label className={labelClass}>Inclinação Jusante (θ)</label>
                  <NumberInput value={downstreamAngle} min={1} max={160} onChange={setDownstreamAngle} />
                </div>
              )}
              {damType === TipoBarragem.CONTRAFORTE && setButtressAngle && buttressAngle !== undefined && (
                <div>
                  <label className={labelClass}>Inclinação dos Contrafortes (°)</label>
                  <NumberInput value={buttressAngle} min={1} max={160} onChange={setButtressAngle} />
                </div>
              )}
              {damType === TipoBarragem.ARCO && setArchRadius && archRadius !== undefined && (
                <div>
                  <label className={labelClass}>Raio de Curvatura (m)</label>
                  <NumberInput value={archRadius} min={10} max={500} onChange={setArchRadius} />
                </div>
              )}
              <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100/50 space-y-3">
                <div>
                    <label className={labelClass}>Altura Total (m)</label>
                    <NumberInput value={damHeight} min={1} max={200} onChange={setDamHeight} />
                </div>
                {damType !== TipoBarragem.CONTRAFORTE && damType !== TipoBarragem.TERRA_ENROCAMENTO && (
                  <div>
                      <label className={labelClass}>
                        {damType === TipoBarragem.ARCO ? 'Espessura na Base (m)' : 'Largura da Base (m)'}
                      </label>
                      <NumberInput value={damBaseWidth} min={1} max={200} onChange={setDamBaseWidth} />
                  </div>
                )}
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
              <div className="flex items-center gap-2.5 mb-2 p-2.5 bg-slate-50/70 rounded-xl border border-slate-200/60 hover:bg-slate-50 transition-colors">
                  <input
                      type="checkbox"
                      checked={hasDownstream}
                      onChange={(e) => setHasDownstream(e.target.checked)}
                      id="jusante-toggle"
                      className="accent-blue-600 w-4 h-4 cursor-pointer rounded"
                  />
                  <label
                      htmlFor="jusante-toggle"
                      className="text-[10px] font-bold text-slate-700 cursor-pointer select-none uppercase tracking-widest flex-1"
                  >
                      Jusante (Saída)
                  </label>
                  {hasDownstream && <Waves className="w-4 h-4 text-cyan-500" />}
              </div>

              <div className="space-y-3 relative">
                  <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Montante (m)</label>
                      <NumberInput min={0} max={maxWaterLevel} value={upstreamLevel} onChange={setUpstreamLevel} />
                  </div>
              </div>

              {hasDownstream && (
                  <div className="space-y-3 relative pt-4 mt-4 border-t border-slate-100">
                      <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jusante (m)</label>
                          <NumberInput min={0} max={maxWaterLevel} value={downstreamLevel} onChange={setDownstreamLevel} />
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
