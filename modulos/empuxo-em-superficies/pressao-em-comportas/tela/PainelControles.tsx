import React from 'react';
import { ConfiguracaoSimulacaoComporta } from '../dominio/configuracao';
import { FormaComporta, PosicaoDobradica, FLUIDOS_PREDEFINIDOS } from '../dominio/tipos';
import { NumberInput } from './components/NumberInput';
import { BookOpen, Square, Circle, Waves, Anchor, Link, Droplets } from 'lucide-react';

interface PainelControlesProps {
  config: ConfiguracaoSimulacaoComporta;
  setConfig: React.Dispatch<React.SetStateAction<ConfiguracaoSimulacaoComporta>>;
  hasDownstream: boolean;
  setHasDownstream: (val: boolean) => void;
  maxGateHeight: number;
  maxWaterLevel: number;
  toggleGate: (active: boolean) => void;
  loadPreset: (key: string) => void;
  presets: { [key: string]: ConfiguracaoSimulacaoComporta & { title: string, subtitle: string } };
  handleHeightChange: (val: number) => void;
  handleShapeChange: (newShape: FormaComporta) => void;
}

export const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-blue-50">
        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">{icon}</div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h3>
    </div>
);

export const PainelControles: React.FC<PainelControlesProps> = (props) => {
  const { config, setConfig } = props;
  const labelClass = "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5";
  const selectClass = "w-full h-9 px-3 border border-blue-100 rounded-lg text-sm bg-blue-50/30 text-slate-800 font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm cursor-pointer hover:bg-white mb-2";

  const handleFluidChange = (isUpstream: boolean, chave: string) => {
    const fluido = FLUIDOS_PREDEFINIDOS[chave];
    if (!fluido) return;

    setConfig(prev => {
      const target = isUpstream ? 'fluidoMontante' : 'fluidoJusante';
      return {
        ...prev,
        [target]: {
          ...prev[target],
          chave,
          densidade: fluido.densidade
        }
      };
    });
  };

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
              props.loadPreset(e.target.value);
            }
          }}
          defaultValue=""
          key={JSON.stringify(config.comporta)} // Force re-render on preset load
        >
          <option value="" disabled className="text-gray-800">Selecione uma simulação...</option>
          {Object.entries(props.presets).map(([key, preset]) => (
            <option key={key} value={key} className="text-gray-800">
              {preset.title} ({preset.subtitle})
            </option>
          ))}
        </select>
      </div>

      {/* Níveis e Fluidos */}
      <div className="bg-white/75 backdrop-blur-md border border-blue-100/70 p-5 rounded-2xl shadow-xl shadow-blue-200/20">
          <SectionHeader icon={<Waves className="w-4 h-4" />} title="Líquidos e Níveis" />
          
          <div className="space-y-6">
              {/* MONTANTE */}
              <div>
                  <div className="flex items-center gap-1.5 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Montante</h4>
                  </div>
                  
                  <label className={labelClass}>Tipo de Fluido</label>
                  <select 
                    value={config.fluidoMontante.chave}
                    onChange={(e) => handleFluidChange(true, e.target.value)}
                    className={selectClass}
                  >
                    {Object.entries(FLUIDOS_PREDEFINIDOS).map(([key, f]) => (
                      <option key={key} value={key}>{f.nome}</option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-3">
                      <div>
                          <label className={labelClass}>Nível (m)</label>
                          <NumberInput value={config.fluidoMontante.nivel} min={0} max={props.maxWaterLevel} step={0.5} onChange={(val) => setConfig(prev => ({
                              ...prev, 
                              fluidoMontante: {...prev.fluidoMontante, nivel: val},
                              comporta: {...prev.comporta, profundidadeTopo: Math.min(prev.comporta.profundidadeTopo, val)}
                          }))} />
                      </div>
                      <div>
                          <label className={labelClass}>ρ (kg/m³)</label>
                          <NumberInput value={config.fluidoMontante.densidade} min={1} max={20000} step={10} onChange={(val) => setConfig(prev => ({
                              ...prev, 
                              fluidoMontante: {...prev.fluidoMontante, densidade: val, chave: 'personalizado'}
                          }))} />
                      </div>
                  </div>
              </div>
              
              {/* JUSANTE */}
              <div className="pt-4 border-t border-blue-50">
                  <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Jusante</h4>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Ativar</span>
                          <input type="checkbox" checked={config.fluidoJusante.ativo} onChange={(e) => props.setHasDownstream(e.target.checked)} className="accent-blue-600 w-4 h-4 cursor-pointer" />
                      </div>
                  </div>

                  {config.fluidoJusante.ativo && (
                      <div className="animate-in fade-in slide-in-from-top-2 space-y-3">
                          <div>
                              <label className={labelClass}>Tipo de Fluido</label>
                              <select 
                                value={config.fluidoJusante.chave}
                                onChange={(e) => handleFluidChange(false, e.target.value)}
                                className={selectClass}
                              >
                                {Object.entries(FLUIDOS_PREDEFINIDOS).map(([key, f]) => (
                                  <option key={key} value={key}>{f.nome}</option>
                                ))}
                              </select>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                              <div>
                                  <label className={labelClass}>Nível (m)</label>
                                  <NumberInput value={config.fluidoJusante.nivel} min={0} max={props.maxWaterLevel} step={0.5} onChange={(val) => setConfig(prev => ({...prev, fluidoJusante: {...prev.fluidoJusante, nivel: val}}))} />
                              </div>
                              <div>
                                  <label className={labelClass}>ρ (kg/m³)</label>
                                  <NumberInput value={config.fluidoJusante.densidade} min={1} max={20000} step={10} onChange={(val) => setConfig(prev => ({...prev, fluidoJusante: {...prev.fluidoJusante, densidade: val, chave: 'personalizado'}}))} />
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* Comporta */}
      <div className="bg-white/75 backdrop-blur-md border border-blue-100/70 p-5 rounded-2xl shadow-xl shadow-blue-200/20 flex-1">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-blue-50">
              <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Square className="w-4 h-4" /></div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Geometria da Comporta</h3>
              </div>
              <input type="checkbox" checked={config.comporta.ativa} onChange={(e) => props.toggleGate(e.target.checked)} className="accent-blue-600 w-4 h-4 cursor-pointer" />
          </div>
          
          {config.comporta.ativa && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                      <label className={labelClass}>Formato</label>
                      <div className="grid grid-cols-3 gap-2">
                          <button 
                            onClick={() => props.handleShapeChange(FormaComporta.RETANGULAR)}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all ${config.comporta.forma === FormaComporta.RETANGULAR ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}`}
                          >
                              <Square className="w-4 h-4 mb-1" />
                              Retâng.
                          </button>
                          <button 
                            onClick={() => props.handleShapeChange(FormaComporta.CIRCULAR)}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all ${config.comporta.forma === FormaComporta.CIRCULAR ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}`}
                          >
                              <Circle className="w-4 h-4 mb-1" />
                              Circular
                          </button>
                          <button 
                            onClick={() => props.handleShapeChange(FormaComporta.SEMI_CIRCULAR)}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all ${config.comporta.forma === FormaComporta.SEMI_CIRCULAR ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}`}
                          >
                              <div className="w-4 h-2 border-t-2 border-l-2 border-r-2 border-current rounded-t-full mb-1 mt-2"></div>
                              Semi-Circ.
                          </button>
                      </div>
                  </div>
                  
                  {config.comporta.forma === FormaComporta.RETANGULAR && (
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className={labelClass}>Altura/Comp. (m)</label>
                              <NumberInput value={config.comporta.altura} onChange={props.handleHeightChange} min={0.1} max={props.maxGateHeight} step={0.1} />
                          </div>
                          <div>
                              <label className={labelClass}>Largura (m)</label>
                              <NumberInput value={config.comporta.largura} onChange={(val) => setConfig(prev => ({...prev, comporta: {...prev.comporta, largura: val}}))} min={0.1} max={100} step={0.1} />
                          </div>
                      </div>
                  )}

                  {config.comporta.forma === FormaComporta.CIRCULAR && (
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className={labelClass}>Diâmetro (m)</label>
                              <NumberInput value={config.comporta.altura} onChange={props.handleHeightChange} min={0.1} max={props.maxGateHeight} step={0.1} />
                          </div>
                          <div>
                              <label className={labelClass}>Raio (m)</label>
                              <NumberInput value={parseFloat((config.comporta.altura / 2).toFixed(2))} onChange={(val) => props.handleHeightChange(val * 2)} min={0.05} max={props.maxGateHeight / 2} step={0.1} />
                          </div>
                      </div>
                  )}

                  {config.comporta.forma === FormaComporta.SEMI_CIRCULAR && (
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className={labelClass}>Diâmetro da Base (m)</label>
                              <NumberInput value={parseFloat((config.comporta.altura * 2).toFixed(2))} onChange={(val) => props.handleHeightChange(val / 2)} min={0.2} max={props.maxGateHeight * 2} step={0.1} />
                          </div>
                          <div>
                              <label className={labelClass}>Raio (m)</label>
                              <NumberInput value={config.comporta.altura} onChange={props.handleHeightChange} min={0.1} max={props.maxGateHeight} step={0.1} />
                          </div>
                      </div>
                  )}

                  <div>
                      <label className={labelClass}>Profundidade do Topo (h1)</label>
                      <NumberInput value={config.comporta.profundidadeTopo} onChange={(val: number) => setConfig(prev => ({...prev, comporta: {...prev.comporta, profundidadeTopo: val}}))} min={0} max={config.fluidoMontante.nivel} step={0.1} />
                  </div>

                  <div>
                      <label className={labelClass}>Ângulo de Inclinação (θ)</label>
                      <NumberInput value={config.comporta.angulo || 90} onChange={(val: number) => setConfig(prev => ({...prev, comporta: {...prev.comporta, angulo: val}}))} min={1} max={90} step={1} />
                  </div>

                  <div className="pt-4 border-t border-blue-50">
                      <div className="flex items-center gap-2 mb-4">
                          <div className="p-1 bg-blue-50 text-blue-600 rounded"><Anchor className="w-3 h-3" /></div>
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Apoios e Equilíbrio</h4>
                      </div>
                      
                      <div className="space-y-4">
                          <div>
                              <label className={labelClass}>Posição da Dobradiça</label>
                              <select 
                                  value={config.comporta.posicaoDobradica} 
                                  onChange={(e) => setConfig(prev => ({...prev, comporta: {...prev.comporta, posicaoDobradica: e.target.value as PosicaoDobradica}}))}
                                  className={selectClass}
                              >
                                  <option value={PosicaoDobradica.NONE}>Sem Dobradiça (Fixa)</option>
                                  <option value={PosicaoDobradica.TOP}>No Topo da Comporta</option>
                                  <option value={PosicaoDobradica.BOTTOM}>Na Base da Comporta</option>
                              </select>
                          </div>

                          <div className="pt-2 border-t border-blue-50/50">
                               <div className="flex items-center justify-between mb-3">
                                   <label className={labelClass + " !mb-0 flex items-center gap-1"}><Link className="w-3 h-3" /> Tirante / Escora</label>
                                   <input type="checkbox" checked={config.comporta.temTirante} onChange={(e) => setConfig(prev => ({...prev, comporta: {...prev.comporta, temTirante: e.target.checked}}))} className="accent-blue-600 w-4 h-4 cursor-pointer" />
                               </div>
                               
                               {config.comporta.temTirante && (
                                   <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                                       <div>
                                           <label className={labelClass}>Posição (0=Topo, 1=Base)</label>
                                           <NumberInput value={config.comporta.posicaoTiranteRelativa} min={0} max={1} step={0.1} onChange={(val) => setConfig(prev => ({...prev, comporta: {...prev.comporta, posicaoTiranteRelativa: val}}))} />
                                       </div>
                                       <div>
                                           <label className={labelClass}>Ângulo (graus)</label>
                                           <NumberInput value={config.comporta.anguloTirante} min={-90} max={90} step={5} onChange={(val) => setConfig(prev => ({...prev, comporta: {...prev.comporta, anguloTirante: val}}))} />
                                       </div>
                                   </div>
                               )}
                           </div>

                           <div className="pt-2 border-t border-blue-50/50">
                               <div className="flex items-center justify-between mb-3">
                                   <label className={labelClass + " !mb-0"}>Considerar Peso Próprio</label>
                                   <input type="checkbox" checked={config.comporta.pesoProprioAtivo} onChange={(e) => setConfig(prev => ({...prev, comporta: {...prev.comporta, pesoProprioAtivo: e.target.checked}}))} className="accent-blue-600 w-4 h-4 cursor-pointer" />
                               </div>
                               
                               {config.comporta.pesoProprioAtivo && (
                                   <div className="animate-in fade-in slide-in-from-top-2">
                                       <label className={labelClass}>Peso da Comporta (kg)</label>
                                       <NumberInput value={config.comporta.pesoProprio} min={0} max={10000} step={10} onChange={(val) => setConfig(prev => ({...prev, comporta: {...prev.comporta, pesoProprio: val}}))} />
                                   </div>
                               )}
                           </div>
                       </div>
                   </div>
               </div>
           )}
       </div>
    </div>
  );
};
