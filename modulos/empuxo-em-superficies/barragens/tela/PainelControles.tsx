import React from 'react';
import { Construction, Layers } from 'lucide-react';
import { TipoBarragem } from '../dominio/tipos';
import { NumberInput } from './components/NumberInput';

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
}

export const PainelControles: React.FC<PainelControlesProps> = ({
  damType, setDamType,
  inclinationAngle, setInclinationAngle,
  damHeight, setDamHeight,
  damBaseWidth, setDamBaseWidth,
  damCrestWidth, setDamCrestWidth,
  upstreamLevel, setUpstreamLevel,
  hasDownstream, setHasDownstream,
  downstreamLevel, setDownstreamLevel,
  maxWaterLevel
}) => {
  const labelClass = "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5";
  const selectClass = "w-full h-9 px-3 border border-blue-100 rounded-lg text-sm bg-blue-50/30 text-slate-800 font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm cursor-pointer hover:bg-white";

  return (
    <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
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
  );
};
