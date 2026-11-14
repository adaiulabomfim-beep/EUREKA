import React from 'react';
import { ConfiguracaoSimulacaoComporta } from '../dominio/configuracao';
import {
  FormaComporta,
  PosicaoDobradica,
  FLUIDOS_PREDEFINIDOS,
  SistemaUnidades,
  ModoPosicionamentoComporta,
} from '../dominio/tipos';
import { NumberInput } from './components/NumberInput';
import { getGateYBarTotal } from '../calculos/hidrostatica';
import { BookOpen, Square, Circle, Waves, Anchor, Link, Droplets, Scale, RotateCcw, X } from 'lucide-react';
import { ScrollablePanel } from '../../../../interface/ScrollablePanel';

interface PainelControlesProps {
  config: ConfiguracaoSimulacaoComporta;
  setConfig: React.Dispatch<React.SetStateAction<ConfiguracaoSimulacaoComporta>>;
  hasDownstream: boolean;
  setHasDownstream: (val: boolean) => void;
  maxGateHeight: number;
  maxWaterLevel: number;
  gateOpeningPercent: number;
  setGateOpeningPercent: (percent: number) => void;
  loadPreset: (key: string) => void;
  presets: { [key: string]: ConfiguracaoSimulacaoComporta & { title: string, subtitle: string, enunciado?: string } };
  activePresetKey?: string | null;
  onResetDefaults?: () => void;
  handleHeightChange: (val: number) => void;
  handleShapeChange: (newShape: FormaComporta) => void;
  liveH_eq?: number;
  wallDims: { height: number; thickness: number; width: number; };
  setWallDims: React.Dispatch<React.SetStateAction<{ height: number; thickness: number; width: number; }>>;
}

export const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-blue-50 dark:border-slate-800/80">
        <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">{icon}</div>
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">{title}</h3>
    </div>
);

export const PainelControles: React.FC<PainelControlesProps> = (props) => {
  const { config, setConfig } = props;
  const labelClass = "block text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1.5";
  const selectClass = "w-full h-9 px-3 border border-slate-200 dark:border-slate-700/80 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/60 mb-2";

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
          densidade: fluido.densidade,
          pesoEspecifico: chave === 'aguaDoMar' ? 10054 : chave === 'agua980' ? 9800 : undefined,
        }
      };
    });
  };

  const SHAPE_LABELS: Record<string, string> = {
    RETANGULAR: 'Retangular',
    CIRCULAR: 'Circular',
    SEMI_CIRCULAR: 'Semi-Circular',
  };

  const upstreamLevel = config.fluidoMontante.nivel;
  const downstreamLevel = config.fluidoJusante.ativo ? config.fluidoJusante.nivel : 0;
  const gateHeight = config.comporta.altura;
  const gateDepthFromCrest = config.comporta.profundidadeTopo;
  
  const gateTopY = upstreamLevel - gateDepthFromCrest;
  const gateBottomY = Math.max(0, gateTopY - gateHeight);
  
  return (
    <ScrollablePanel
      id="tour-controles"
      dataTour="painel-controles"
      className="lg:col-span-3 h-[600px] lg:h-full lg:max-h-full min-h-0 overflow-hidden"
      contentClassName="flex flex-col gap-4 pr-3.5 pb-4"
    >
      
      {/* SIMULAÇÕES PRONTAS */}
      <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl p-4 shadow-md text-white shrink-0">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-sm font-bold tracking-wider opacity-90">
            <BookOpen className="w-4 h-4" />
            SIMULAÇÕES PRONTAS
          </div>
          <button
            type="button"
            onClick={props.onResetDefaults}
            title="Restaurar estado inicial"
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/20 hover:bg-white/30 border border-white/30 text-[10px] font-bold uppercase tracking-wider text-white transition-colors cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3 h-3" />
            Resetar
          </button>
        </div>
        <select
          className="w-full bg-white/20 hover:bg-white/30 transition-colors rounded-lg p-3 text-left flex items-center gap-3 border border-white/30 text-white outline-none cursor-pointer text-xs"
          onChange={(e) => {
            if (e.target.value) {
              props.loadPreset(e.target.value);
            }
          }}
          value={props.activePresetKey ?? ''}
        >
          <option value="" disabled className="text-gray-800">Selecione uma simulação...</option>
          {Object.entries(props.presets).map(([key, preset]) => (
            <option key={key} value={key} className="text-gray-800">
              {preset.title}
            </option>
          ))}
        </select>
        {props.activePresetKey && props.presets[props.activePresetKey] && (
          <div className="mt-2.5 p-3 bg-white/10 rounded-xl border border-white/20 text-xs leading-relaxed text-blue-50">
            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-white/15">
              <span className="font-bold text-white text-[10px] uppercase tracking-wider">
                {props.presets[props.activePresetKey].subtitle}
              </span>
              <button
                type="button"
                onClick={props.onResetDefaults}
                title="Fechar simulação e voltar ao estado inicial"
                className="p-0.5 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-blue-50/95 font-medium">
              {props.presets[props.activePresetKey].enunciado}
            </p>
          </div>
        )}
      </div>

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
            onClick={() => setConfig(prev => ({ ...prev, sistemaUnidades: SistemaUnidades.SI }))}
            className={`py-2 px-2.5 rounded-xl border text-[10px] font-bold tracking-wider transition-all flex flex-col items-center justify-center ${
              (config.sistemaUnidades || SistemaUnidades.SI) === SistemaUnidades.SI
                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-500/60'
            }`}
          >
            <span>SI (Padrão)</span>
            <span className="text-[8px] opacity-80 mt-0.5">kN, kPa (γ=9810)</span>
          </button>
          <button
            type="button"
            onClick={() => setConfig(prev => ({ ...prev, sistemaUnidades: SistemaUnidades.TECNICO_KGF }))}
            className={`py-2 px-2.5 rounded-xl border text-[10px] font-bold tracking-wider transition-all flex flex-col items-center justify-center ${
              config.sistemaUnidades === SistemaUnidades.TECNICO_KGF
                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-500/60'
            }`}
          >
            <span>Técnico (kgf)</span>
            <span className="text-[8px] opacity-80 mt-0.5">kgf, kgf/m² (γ=1000)</span>
          </button>
        </div>
      </div>

      {/* Comporta */}
      <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xl shadow-blue-200/20 dark:shadow-none transition-colors duration-200 shrink-0">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-50 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg"><Square className="w-4 h-4" /></div>
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Geometria da Comporta</h3>
              </div>
          </div>

          {/* Condição de Operação / Grau de Abertura */}
          <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between mb-1.5">
                  <label className={labelClass + " !mb-0"}>Operação da Comporta</label>
                  <span className="text-[10px] font-bold font-mono text-blue-600 dark:text-blue-400">
                      {props.gateOpeningPercent === 0
                        ? 'Fechada (0%)'
                        : props.gateOpeningPercent >= 100
                        ? 'Aberta (100%)'
                        : `Parcial (${props.gateOpeningPercent}%)`}
                  </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => props.setGateOpeningPercent(0)}
                    className={`py-1.5 px-2 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all ${
                      props.gateOpeningPercent === 0
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-300 hover:border-blue-300'
                    }`}
                  >
                    Fechada
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = props.gateOpeningPercent > 0 && props.gateOpeningPercent < 100 ? props.gateOpeningPercent : 50;
                      props.setGateOpeningPercent(next);
                    }}
                    className={`py-1.5 px-2 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all ${
                      props.gateOpeningPercent > 0 && props.gateOpeningPercent < 100
                        ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-300 hover:border-amber-300'
                    }`}
                  >
                    Parcial
                  </button>
                  <button
                    type="button"
                    onClick={() => props.setGateOpeningPercent(100)}
                    className={`py-1.5 px-2 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all ${
                      props.gateOpeningPercent >= 100
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-300 hover:border-emerald-300'
                    }`}
                  >
                    Aberta
                  </button>
              </div>

              {props.gateOpeningPercent > 0 && props.gateOpeningPercent < 100 && (
                <div className="mt-3 p-2.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 rounded-xl">
                  <div className="flex items-center justify-between text-[10px] font-bold text-amber-800 dark:text-amber-300 mb-1.5">
                    <span>Grau de Abertura</span>
                    <span className="font-mono">
                      {props.gateOpeningPercent}% ({((props.gateOpeningPercent / 100) * config.comporta.altura * Math.sin(((config.comporta.angulo || 90) * Math.PI) / 180)).toFixed(2)} m vert.)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={95}
                    step={5}
                    value={props.gateOpeningPercent}
                    onChange={(e) => props.setGateOpeningPercent(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              )}

              {props.gateOpeningPercent >= 100 && (
                <div className="mt-2.5 px-2.5 py-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 text-[10px] font-medium text-emerald-800 dark:text-emerald-300">
                  {config.comporta.forma === FormaComporta.CIRCULAR
                    ? `Orifício circular desobstruído (Ø = ${config.comporta.altura.toFixed(2)} m).`
                    : config.comporta.forma === FormaComporta.SEMI_CIRCULAR
                    ? `Orifício semicircular desobstruído (R = ${config.comporta.altura.toFixed(2)} m).`
                    : `Orifício retangular desobstruído (${config.comporta.altura.toFixed(2)} m × ${config.comporta.largura.toFixed(2)} m).`}{' '}
                  Clique em <strong>Fechada</strong> ou <strong>Parcial</strong> para rebaixar a comporta.
                </div>
              )}
          </div>

          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                      <label className={labelClass}>Formato</label>
                      <div className="grid grid-cols-3 gap-2">
                          <button 
                            onClick={() => props.handleShapeChange(FormaComporta.RETANGULAR)}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all ${config.comporta.forma === FormaComporta.RETANGULAR ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-500/60'}`}
                          >
                              <Square className="w-4 h-4 mb-1" />
                              Retâng.
                          </button>
                          <button 
                            onClick={() => props.handleShapeChange(FormaComporta.CIRCULAR)}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all ${config.comporta.forma === FormaComporta.CIRCULAR ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-500/60'}`}
                          >
                              <Circle className="w-4 h-4 mb-1" />
                              Circular
                          </button>
                          <button 
                            onClick={() => props.handleShapeChange(FormaComporta.SEMI_CIRCULAR)}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all ${config.comporta.forma === FormaComporta.SEMI_CIRCULAR ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-500/60'}`}
                          >
                              <div className="w-4 h-2 border-t-2 border-l-2 border-r-2 border-current rounded-t-full mb-1 mt-2"></div>
                              Semi-Circ.
                          </button>
                      </div>
                  </div>
                  
                  {config.comporta.forma === FormaComporta.RETANGULAR && (
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className={labelClass}>
                                {config.comporta.articulacaoParedeVerticalA ? 'Comprimento L (m)' : 'Altura/Comp. (m)'}
                              </label>
                              <NumberInput value={config.comporta.altura} onChange={props.handleHeightChange} min={0.1} max={props.maxGateHeight} step="any" />
                          </div>
                          <div>
                              <label className={labelClass}>
                                {config.comporta.articulacaoParedeVerticalA ? 'Largura w (m)' : 'Largura (m)'}
                              </label>
                              <NumberInput value={config.comporta.largura} onChange={(val) => setConfig(prev => ({...prev, comporta: {...prev.comporta, largura: val}}))} min={0.1} max={100} step="any" />
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

                  {/* Modo de Posicionamento da Comporta */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <label className={labelClass}>Modo de Posicionamento</label>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                          <button
                            type="button"
                            onClick={() => {
                              setConfig(prev => {
                                const sinTheta = Math.sin(((prev.comporta.angulo || 90) * Math.PI) / 180);
                                const ybarTotal = getGateYBarTotal(prev.comporta.forma, prev.comporta.altura);
                                const currentY_CG = prev.comporta.y_cg_direto ?? (prev.comporta.profundidadeTopo / Math.max(0.01, sinTheta) + ybarTotal);
                                const h_topo = Math.max(0, currentY_CG * sinTheta - ybarTotal * sinTheta);
                                return {
                                  ...prev,
                                  comporta: {
                                    ...prev.comporta,
                                    modoPosicionamento: ModoPosicionamentoComporta.PADRAO_H_TOPO,
                                    profundidadeTopo: parseFloat(h_topo.toFixed(3))
                                  }
                                };
                              });
                            }}
                            className={`py-1.5 px-2 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all ${
                              (config.comporta.modoPosicionamento || ModoPosicionamentoComporta.PADRAO_H_TOPO) === ModoPosicionamentoComporta.PADRAO_H_TOPO
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-500/60'
                            }`}
                          >
                            Padrão (h₁)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConfig(prev => {
                                const sinTheta = Math.sin(((prev.comporta.angulo || 90) * Math.PI) / 180);
                                const ybarTotal = getGateYBarTotal(prev.comporta.forma, prev.comporta.altura);
                                const calculatedY_CG = prev.comporta.profundidadeTopo / Math.max(0.01, sinTheta) + ybarTotal;
                                return {
                                  ...prev,
                                  comporta: {
                                    ...prev.comporta,
                                    modoPosicionamento: ModoPosicionamentoComporta.Y_CG_DIRETO,
                                    y_cg_direto: prev.comporta.y_cg_direto ?? parseFloat(calculatedY_CG.toFixed(3))
                                  }
                                };
                              });
                            }}
                            className={`py-1.5 px-2 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all ${
                              config.comporta.modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-500/60'
                            }`}
                          >
                            Modo y<sub>CG</sub> Direto
                          </button>
                      </div>

                      {config.comporta.modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO ? (
                          <div>
                              <div className="flex items-center justify-between mb-1">
                                  <label className={labelClass + " !mb-0"}>Distância Inclinada ao Centróide (y<sub>CG</sub>)</label>
                                  <span className="text-[9px] text-blue-600 font-bold">metros</span>
                              </div>
                              <NumberInput
                                value={config.comporta.y_cg_direto ?? parseFloat(((config.comporta.profundidadeTopo / Math.sin(((config.comporta.angulo || 90) * Math.PI) / 180)) + getGateYBarTotal(config.comporta.forma, config.comporta.altura)).toFixed(2))}
                                onChange={(val: number) => {
                                  setConfig(prev => {
                                    const sinTheta = Math.sin(((prev.comporta.angulo || 90) * Math.PI) / 180);
                                    const ybarTotal = getGateYBarTotal(prev.comporta.forma, prev.comporta.altura);
                                    const h_CG = val * sinTheta;
                                    const h_topo = h_CG - ybarTotal * sinTheta;
                                    return {
                                      ...prev,
                                      comporta: {
                                        ...prev.comporta,
                                        modoPosicionamento: ModoPosicionamentoComporta.Y_CG_DIRETO,
                                        y_cg_direto: val,
                                        profundidadeTopo: parseFloat(h_topo.toFixed(3))
                                      }
                                    };
                                  });
                                }}
                                min={0.1}
                                max={100}
                                step={0.05}
                              />
                              <div className="text-[10px] text-slate-500 mt-1 flex justify-between font-mono">
                                <span>h<sub>topo</sub> (vertical): {config.comporta.profundidadeTopo.toFixed(2)}m</span>
                                <span>h<sub>CG</sub> (vertical): {((config.comporta.y_cg_direto ?? 1.5) * Math.sin(((config.comporta.angulo || 90) * Math.PI) / 180)).toFixed(2)}m</span>
                              </div>
                          </div>
                      ) : (
                          <div>
                              <label className={labelClass}>
                                {config.comporta.articulacaoParedeVerticalA
                                  ? 'Profundidade da Articulação A (D)'
                                  : 'Profundidade do Topo (h₁)'}
                              </label>
                              <NumberInput
                                value={config.comporta.profundidadeTopo}
                                onChange={(val: number) => setConfig(prev => {
                                  const sinTheta = Math.sin(((prev.comporta.angulo || 90) * Math.PI) / 180);
                                  const ybarTotal = getGateYBarTotal(prev.comporta.forma, prev.comporta.altura);
                                  const calculatedY_CG = val / Math.max(0.01, sinTheta) + ybarTotal;
                                  const nextNivel = prev.comporta.articulacaoParedeVerticalA
                                    ? parseFloat((val + prev.comporta.altura * sinTheta).toFixed(3))
                                    : prev.fluidoMontante.nivel;
                                  return {
                                    ...prev,
                                    fluidoMontante: {
                                      ...prev.fluidoMontante,
                                      nivel: nextNivel,
                                    },
                                    comporta: {
                                      ...prev.comporta,
                                      profundidadeTopo: val,
                                      y_cg_direto: parseFloat(calculatedY_CG.toFixed(3))
                                    }
                                  };
                                })}
                                min={0}
                                max={config.comporta.articulacaoParedeVerticalA ? 20 : config.fluidoMontante.nivel}
                                step="any"
                              />
                          </div>
                      )}
                  </div>

                  <div>
                      <label className={labelClass}>Ângulo de Inclinação (θ)</label>
                      <NumberInput value={config.comporta.angulo || 90} onChange={(val: number) => setConfig(prev => {
                        const sinTheta = Math.sin((val * Math.PI) / 180);
                        const ybarTotal = getGateYBarTotal(prev.comporta.forma, prev.comporta.altura);
                        let h_topo = prev.comporta.profundidadeTopo;
                        if (prev.comporta.apoioFundoLiso) {
                          h_topo = Math.max(0, prev.fluidoMontante.nivel - prev.comporta.altura * sinTheta);
                        } else if (prev.comporta.modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO && prev.comporta.y_cg_direto) {
                          h_topo = prev.comporta.y_cg_direto * sinTheta - ybarTotal * sinTheta;
                        }
                        const nextNivel = prev.comporta.articulacaoParedeVerticalA
                          ? parseFloat((h_topo + prev.comporta.altura * sinTheta).toFixed(3))
                          : prev.fluidoMontante.nivel;
                        return {
                          ...prev,
                          fluidoMontante: {
                            ...prev.fluidoMontante,
                            nivel: nextNivel,
                          },
                          comporta: {
                            ...prev.comporta,
                            angulo: val,
                            profundidadeTopo: prev.comporta.apoioFundoLiso ? h_topo : parseFloat(h_topo.toFixed(3))
                          }
                        };
                      })} min={1} max={90} step="any" />
                  </div>

                  <div className="pt-4 border-t border-blue-50 dark:border-slate-800/80">
                      <div className="flex items-center gap-2 mb-4">
                          <div className="p-1 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded"><Anchor className="w-3 h-3" /></div>
                          <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Apoios e Equilíbrio</h4>
                      </div>
                      
                      <div className="space-y-4">
                          <div>
                              <label className={labelClass}>Posição da Dobradiça / Eixo de Rotação</label>
                              <select 
                                  value={config.comporta.posicaoDobradica} 
                                  onChange={(e) => {
                                    const pos = e.target.value as PosicaoDobradica;
                                    setConfig(prev => ({
                                      ...prev,
                                      comporta: {
                                        ...prev.comporta,
                                        posicaoDobradica: pos,
                                        eixoRotacaoCentral: pos === PosicaoDobradica.CENTER,
                                      },
                                    }));
                                  }}
                                  className={selectClass}
                              >
                                  <option value={PosicaoDobradica.NONE}>Sem Dobradiça (Fixa)</option>
                                  <option value={PosicaoDobradica.TOP}>No Topo da Comporta</option>
                                  <option value={PosicaoDobradica.BOTTOM}>Na Base da Comporta</option>
                                  <option value={PosicaoDobradica.CENTER}>No Eixo Central (Diâmetro Horizontal / CG)</option>
                              </select>

                              {config.comporta.posicaoDobradica === PosicaoDobradica.CENTER && (
                                <div className="mt-2 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/50 space-y-2">
                                  <div className="text-[10px] text-blue-900 dark:text-blue-200 leading-relaxed">
                                    Eixo físico horizontal passando pelo <strong>centro da comporta (CG)</strong> ao longo de seu diâmetro horizontal.
                                  </div>
                                  <div>
                                    <label className={labelClass}>Profundidade Vertical do Eixo h<sub>c</sub> (m)</label>
                                    <NumberInput
                                      value={parseFloat(
                                        (
                                          config.comporta.modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO &&
                                          config.comporta.y_cg_direto !== undefined
                                            ? config.comporta.y_cg_direto *
                                              Math.sin(((config.comporta.angulo || 90) * Math.PI) / 180)
                                            : config.comporta.profundidadeTopo +
                                              getGateYBarTotal(config.comporta.forma, config.comporta.altura) *
                                                Math.sin(((config.comporta.angulo || 90) * Math.PI) / 180)
                                        ).toFixed(2)
                                      )}
                                      min={0.5}
                                      max={22}
                                      step={0.1}
                                      onChange={(hcVal: number) => {
                                        setConfig(prev => {
                                          const sinT = Math.sin(((prev.comporta.angulo || 90) * Math.PI) / 180);
                                          const ybar = getGateYBarTotal(prev.comporta.forma, prev.comporta.altura);
                                          const hTopo = Math.max(0, hcVal - ybar * sinT);
                                          const yCg = hcVal / Math.max(0.01, sinT);
                                          const minWater = hcVal + ybar * sinT + 1.5;
                                          return {
                                            ...prev,
                                            fluidoMontante: {
                                              ...prev.fluidoMontante,
                                              nivel: Math.max(prev.fluidoMontante.nivel, parseFloat(minWater.toFixed(2))),
                                            },
                                            comporta: {
                                              ...prev.comporta,
                                              modoPosicionamento: ModoPosicionamentoComporta.Y_CG_DIRETO,
                                              y_cg_direto: parseFloat(yCg.toFixed(4)),
                                              profundidadeEixo: hcVal,
                                              profundidadeTopo: parseFloat(hTopo.toFixed(4)),
                                            },
                                          };
                                        });
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                          </div>

                          <div className="pt-2 border-t border-blue-50/50 dark:border-slate-800/60">
                               <div className="flex items-center justify-between mb-3">
                                   <label className={labelClass + " !mb-0 flex items-center gap-1"}><Link className="w-3 h-3" /> Tirante / Escora</label>
                                   <input type="checkbox" checked={config.comporta.temTirante} onChange={(e) => setConfig(prev => ({...prev, comporta: {...prev.comporta, temTirante: e.target.checked, apoioParedeLisa: e.target.checked ? false : prev.comporta.apoioParedeLisa}}))} className="accent-blue-600 w-4 h-4 cursor-pointer" />
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

                           <div className="pt-2 border-t border-blue-50/50 dark:border-slate-800/60">
                               <div className="flex items-center justify-between mb-2">
                                   <label className={labelClass + " !mb-0"}>Apoio em Parede Lisa (Topo A)</label>
                                   <input
                                     type="checkbox"
                                     checked={Boolean(config.comporta.apoioParedeLisa)}
                                     onChange={(e) => {
                                       const checked = e.target.checked;
                                       setConfig(prev => ({
                                         ...prev,
                                         comporta: {
                                           ...prev.comporta,
                                           apoioParedeLisa: checked,
                                           apoioFundoLiso: checked ? false : prev.comporta.apoioFundoLiso,
                                           temTirante: checked ? false : prev.comporta.temTirante,
                                           posicaoDobradica:
                                             checked && prev.comporta.posicaoDobradica === PosicaoDobradica.NONE
                                               ? PosicaoDobradica.BOTTOM
                                               : prev.comporta.posicaoDobradica,
                                         },
                                       }));
                                     }}
                                     className="accent-blue-600 w-4 h-4 cursor-pointer"
                                   />
                               </div>
                               {config.comporta.apoioParedeLisa && (
                                 <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 text-[10px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                                   Contato em parede vertical lisa no ponto <strong>A</strong> (reação horizontal <strong>P</strong>, sem atrito) e articulação fixa em <strong>B</strong> (<strong>B<sub>x</sub></strong>, <strong>B<sub>y</sub></strong>).
                                 </div>
                               )}
                           </div>

                           <div className="pt-2 border-t border-blue-50/50 dark:border-slate-800/60">
                               <div className="flex items-center justify-between mb-2">
                                   <label className={labelClass + " !mb-0"}>Apoio em Fundo Liso (Base B)</label>
                                   <input
                                     type="checkbox"
                                     checked={Boolean(config.comporta.apoioFundoLiso)}
                                     onChange={(e) => {
                                       const checked = e.target.checked;
                                       setConfig(prev => {
                                         const sinT = Math.sin(((prev.comporta.angulo || 90) * Math.PI) / 180);
                                         const hTopoFloor = Math.max(0, prev.fluidoMontante.nivel - prev.comporta.altura * sinT);
                                         return {
                                           ...prev,
                                           comporta: {
                                             ...prev.comporta,
                                             apoioFundoLiso: checked,
                                             apoioParedeLisa: checked ? false : prev.comporta.apoioParedeLisa,
                                             temTirante: checked ? false : prev.comporta.temTirante,
                                             resolverProfundidadeRbZero: checked ? true : prev.comporta.resolverProfundidadeRbZero,
                                             posicaoDobradica: checked ? PosicaoDobradica.TOP : prev.comporta.posicaoDobradica,
                                             profundidadeTopo: checked ? hTopoFloor : prev.comporta.profundidadeTopo,
                                           },
                                         };
                                       });
                                     }}
                                     className="accent-blue-600 w-4 h-4 cursor-pointer"
                                   />
                               </div>
                               {config.comporta.apoioFundoLiso && (
                                 <div className="space-y-2 p-2.5 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/70 dark:border-cyan-800/50 text-[10px] text-cyan-900 dark:text-cyan-200 leading-relaxed">
                                   <div>
                                     Articulação no topo <strong>A</strong> (<strong>A<sub>x</sub></strong>, <strong>A<sub>y</sub></strong>) e contato sem atrito sobre fundo horizontal liso em <strong>B</strong> (reação normal vertical <strong>R<sub>B</sub></strong>).
                                   </div>
                                   <label className="flex items-center justify-between gap-2 pt-1.5 border-t border-cyan-200/60 dark:border-cyan-800/50 cursor-pointer font-bold">
                                     <span>Calcular h para R<sub>B</sub> = 0</span>
                                     <input
                                       type="checkbox"
                                       checked={Boolean(config.comporta.resolverProfundidadeRbZero)}
                                       onChange={(e) => setConfig(prev => ({
                                         ...prev,
                                         comporta: {
                                           ...prev.comporta,
                                           resolverProfundidadeRbZero: e.target.checked,
                                         },
                                         fluidoJusante: {
                                           ...prev.fluidoJusante,
                                           ativo: e.target.checked ? true : prev.fluidoJusante.ativo,
                                           nivel:
                                             !e.target.checked && props.liveH_eq !== undefined
                                               ? Number(props.liveH_eq.toFixed(3))
                                               : prev.fluidoJusante.nivel,
                                         },
                                       }))}
                                       className="accent-cyan-600 w-4 h-4 cursor-pointer"
                                     />
                                   </label>
                                 </div>
                               )}
                           </div>

                           <div className="pt-2 border-t border-blue-50/50 dark:border-slate-800/60">
                               <div className="flex items-center justify-between mb-3">
                                   <label className={labelClass + " !mb-0"}>Considerar Peso Próprio</label>
                                   <input type="checkbox" checked={config.comporta.pesoProprioAtivo} onChange={(e) => setConfig(prev => ({...prev, comporta: {...prev.comporta, pesoProprioAtivo: e.target.checked}}))} className="accent-blue-600 w-4 h-4 cursor-pointer" />
                               </div>
                               
                               {config.comporta.pesoProprioAtivo && (
                                   <div className="animate-in fade-in slide-in-from-top-2">
                                       <label className={labelClass}>Massa da Comporta (kg)</label>
                                       <NumberInput value={config.comporta.pesoProprio} min={0} max={10000} step={10} onChange={(val) => setConfig(prev => ({...prev, comporta: {...prev.comporta, pesoProprio: val}}))} />
                                   </div>
                               )}
                           </div>
                       </div>
                   </div>
               </div>
       </div>

      {/* Níveis e Fluidos */}
      <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xl shadow-blue-200/20 dark:shadow-none transition-colors duration-200 shrink-0">
          <SectionHeader icon={<Waves className="w-4 h-4" />} title="Líquidos e Níveis" />
          
          <div className="space-y-4">
              <div className="flex items-center gap-2.5 mb-2 p-2.5 bg-slate-50/70 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <input
                      type="checkbox"
                      checked={config.fluidoJusante.ativo}
                      onChange={(e) => props.setHasDownstream(e.target.checked)}
                      id="jusante-toggle"
                      className="accent-blue-600 w-4 h-4 cursor-pointer rounded"
                  />
                  <label
                      htmlFor="jusante-toggle"
                      className="text-[10px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer select-none uppercase tracking-widest flex-1"
                  >
                      Jusante (Saída)
                  </label>
                  {config.fluidoJusante.ativo && <Waves className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />}
              </div>

              <div className="space-y-3 relative">
                  <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Montante (M)</label>
                      <select 
                          value={config.fluidoMontante.chave}
                          onChange={(e) => handleFluidChange(true, e.target.value)}
                          className={selectClass}
                      >
                          {Object.entries(FLUIDOS_PREDEFINIDOS).map(([key, f]) => (
                              <option key={key} value={key}>{f.nome}</option>
                          ))}
                      </select>

                      <div className="flex gap-3 mt-2">
                          <div className="flex-1">
                              <label className="text-[10px] font-medium text-slate-400 mb-1 block">Densidade (kg/m³)</label>
                              <NumberInput value={config.fluidoMontante.densidade} min={1} max={20000} step="any" onChange={(val) => setConfig(prev => ({
                                  ...prev, 
                                  fluidoMontante: {...prev.fluidoMontante, densidade: val, chave: 'personalizado', pesoEspecifico: undefined}
                              }))} />
                          </div>
                          <div className="w-24">
                              <label className="text-[10px] font-medium text-slate-400 mb-1 block">Nível (m)</label>
                              <NumberInput value={config.fluidoMontante.nivel} min={0} max={props.maxWaterLevel} step="any" onChange={(val) => setConfig(prev => {
                                const sinT = Math.sin(((prev.comporta.angulo || 90) * Math.PI) / 180);
                                const nextProfTopo = prev.comporta.apoioFundoLiso
                                  ? Math.max(0, val - prev.comporta.altura * sinT)
                                  : Math.min(prev.comporta.profundidadeTopo, val);
                                return {
                                  ...prev, 
                                  fluidoMontante: {...prev.fluidoMontante, nivel: val},
                                  fluidoJusante: {
                                    ...prev.fluidoJusante,
                                    nivel: prev.comporta.apoioFundoLiso
                                      ? prev.fluidoJusante.nivel
                                      : Math.min(prev.fluidoJusante.nivel, val),
                                  },
                                  comporta: {...prev.comporta, profundidadeTopo: nextProfTopo}
                                };
                              })} />
                          </div>
                      </div>
                  </div>
              </div>

              {config.fluidoJusante.ativo && (
                  <div className="space-y-3 relative pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex flex-col gap-1.5">
                          <label className={labelClass}>Jusante (Saída)</label>
                          <select 
                              value={config.fluidoJusante.chave}
                              onChange={(e) => handleFluidChange(false, e.target.value)}
                              className={selectClass}
                          >
                              {Object.entries(FLUIDOS_PREDEFINIDOS).map(([key, f]) => (
                                  <option key={key} value={key}>{f.nome}</option>
                              ))}
                          </select>

                          <div className="flex gap-3 mt-2">
                              <div className="flex-1">
                                  <label className="text-[10px] font-medium text-slate-400 mb-1 block">Densidade (kg/m³)</label>
                                  <NumberInput value={config.fluidoJusante.densidade} min={1} max={20000} step="any" onChange={(val) => setConfig(prev => ({...prev, fluidoJusante: {...prev.fluidoJusante, densidade: val, chave: 'personalizado', pesoEspecifico: undefined}}))} />
                              </div>
                              <div className="w-24">
                                  <label className="text-[10px] font-medium text-slate-400 mb-1 block">
                                    {config.comporta.apoioFundoLiso && config.comporta.resolverProfundidadeRbZero
                                      ? 'h (R_B = 0)'
                                      : 'Nível (m)'}
                                  </label>
                                  {config.comporta.apoioFundoLiso && config.comporta.resolverProfundidadeRbZero ? (
                                    <div className="h-9 px-2.5 rounded-lg border border-cyan-200 dark:border-cyan-800/70 bg-cyan-50/70 dark:bg-cyan-950/40 flex items-center justify-between text-xs font-bold font-mono text-cyan-800 dark:text-cyan-200">
                                      <span>{(props.liveH_eq ?? config.fluidoJusante.nivel).toFixed(3)}</span>
                                      <span className="text-[10px] opacity-75">m</span>
                                    </div>
                                  ) : (
                                    <NumberInput
                                      value={
                                        config.comporta.apoioFundoLiso
                                          ? config.fluidoJusante.nivel
                                          : Math.min(config.fluidoJusante.nivel, config.fluidoMontante.nivel)
                                      }
                                      min={0}
                                      max={config.comporta.apoioFundoLiso ? props.maxWaterLevel : config.fluidoMontante.nivel}
                                      step="any"
                                      onChange={(val) => setConfig(prev => ({
                                        ...prev,
                                        fluidoJusante: {
                                          ...prev.fluidoJusante,
                                          nivel: prev.comporta.apoioFundoLiso
                                            ? Math.max(0, val)
                                            : Math.min(val, prev.fluidoMontante.nivel)
                                        }
                                      }))}
                                    />
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>
    </ScrollablePanel>
  );
};
