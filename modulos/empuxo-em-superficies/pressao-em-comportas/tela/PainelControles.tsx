import React from 'react';
import { ConfiguracaoSimulacaoComporta } from '../dominio/configuracao';
import { TipoBarragem, FormaComporta, PosicaoDobradica } from '../dominio/tipos';
import { NumberInput } from './components/NumberInput';
import { BookOpen, Construction, Square, Circle, RefreshCw, Waves, Anchor, Link } from 'lucide-react';

interface PainelControlesProps {
  config: ConfiguracaoSimulacaoComporta;
  setConfig: React.Dispatch<React.SetStateAction<ConfiguracaoSimulacaoComporta>>;
  syncGateAngle: boolean;
  setSyncGateAngle: (val: boolean) => void;
  hasDownstream: boolean;
  setHasDownstream: (val: boolean) => void;
  maxGateHeight: number;
  maxWaterLevel: number;
  toggleGate: (active: boolean) => void;
  loadExercise6: () => void;
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
  const selectClass = "w-full h-9 px-3 border border-blue-100 rounded-lg text-sm bg-blue-50/30 text-slate-800 font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm cursor-pointer hover:bg-white";

  return (
    <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
      
      {/* Aula Prática */}
      <div className="bg-white/75 backdrop-blur-md border border-blue-100/70 p-5 rounded-2xl shadow-xl shadow-blue-200/20">
          <SectionHeader icon={<BookOpen className="w-4 h-4" />} title="Aula Prática" />
          <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 bg-white">
                  <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-md">#06</div>
                  <div>
                      <div className="text-sm font-bold text-slate-800">Exercício 30º</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comporta Articulada</div>
                  </div>
              </div>
              <button onClick={props.loadExercise6} className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 p-2.5 rounded-xl text-xs font-bold transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Resetar Cenário
              </button>
          </div>
      </div>

      {/* Estrutura */}
      <div className="bg-white/75 backdrop-blur-md border border-blue-100/70 p-5 rounded-2xl shadow-xl shadow-blue-200/20">
          <SectionHeader icon={<Construction className="w-4 h-4" />} title="Estrutura" />
          <div className="space-y-4">
              <div>
                <label className={labelClass}>Inclinação da Parede (θ)</label>
                <NumberInput value={config.barragem.anguloInclinacao} min={1} max={160} onChange={(val) => setConfig(prev => ({...prev, barragem: {...prev.barragem, anguloInclinacao: val}}))} />
              </div>
              <div>
                  <label className={labelClass}>Altura Total (m)</label>
                  <NumberInput value={config.barragem.altura} min={1} max={200} onChange={(val) => setConfig(prev => ({...prev, barragem: {...prev.barragem, altura: val}}))} />
              </div>
          </div>
      </div>

      {/* Níveis de Água */}
      <div className="bg-white/75 backdrop-blur-md border border-blue-100/70 p-5 rounded-2xl shadow-xl shadow-blue-200/20">
          <SectionHeader icon={<Waves className="w-4 h-4" />} title="Níveis de Água" />
          <div className="space-y-4">
              <div>
                  <label className={labelClass}>Nível Montante (m)</label>
                  <NumberInput value={config.fluido.nivelMontante} min={0} max={props.maxWaterLevel} step={0.5} onChange={(val) => setConfig(prev => ({...prev, fluido: {...prev.fluido, nivelMontante: val}}))} />
              </div>
              
              <div className="pt-2 border-t border-blue-50">
                  <div className="flex items-center justify-between mb-3">
                      <label className={labelClass + " !mb-0"}>Água a Jusante</label>
                      <input type="checkbox" checked={props.hasDownstream} onChange={(e) => props.setHasDownstream(e.target.checked)} className="accent-blue-600 w-4 h-4 cursor-pointer" />
                  </div>
                  {props.hasDownstream && (
                      <div className="animate-in fade-in slide-in-from-top-2">
                          <NumberInput value={config.fluido.nivelJusante} min={0} max={config.barragem.altura} step={0.5} onChange={(val) => setConfig(prev => ({...prev, fluido: {...prev.fluido, nivelJusante: val}}))} />
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
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comporta</h3>
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
                  
                  <div className="grid grid-cols-2 gap-3">
                      <div>
                          <label className={labelClass}>Altura/Comp. (m)</label>
                          <NumberInput value={config.comporta.altura} onChange={props.handleHeightChange} min={0.1} max={props.maxGateHeight} step={0.1} />
                      </div>
                      <div>
                          <label className={labelClass}>Largura (m)</label>
                          <NumberInput value={config.comporta.largura} onChange={(val) => setConfig(prev => ({...prev, comporta: {...prev.comporta, largura: val}}))} min={0.1} max={100} step={0.1} disabled={config.comporta.forma !== FormaComporta.RETANGULAR} />
                      </div>
                  </div>

                  <div>
                      <label className={labelClass}>Profundidade do Topo (da Crista)</label>
                      <NumberInput value={config.comporta.profundidadeCrista} onChange={(val: number) => setConfig(prev => ({...prev, comporta: {...prev.comporta, profundidadeCrista: val}}))} min={0} max={config.barragem.altura} step={0.1} />
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
