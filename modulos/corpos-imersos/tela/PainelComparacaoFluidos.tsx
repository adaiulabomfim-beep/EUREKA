import React, { useState, useMemo } from 'react';
import {
  Droplets,
  ArrowUp,
  ArrowDown,
  Scale,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Sliders,
  Layers,
  HelpCircle,
  Zap,
  X,
} from 'lucide-react';
import { FLUIDS, MATERIALS } from '../dominio/configuracao';
import { ObjectShape } from '../dominio/tipos';
import { calculateVolume, calculateHeight, calculateVolumeFromBottom } from '../calculos/volume';

interface PainelComparacaoFluidosProps {
  shape: ObjectShape;
  dim1: number;
  dim2: number;
  selectedMaterial: string;
  customObjDensity: number;
  gravity: number;
  extraWeight?: number;
  onApplyFluid?: (fluidName: string, fluidDensity: number) => void;
  onClose?: () => void;
}

export interface FluidComparisonData {
  fluidName: string;
  fluidDensity: number;
  fluidColor: string;
  buoyancyForce: number; // N
  objectWeight: number; // N
  apparentWeight: number; // N
  submergedVolume: number; // m³
  totalVolume: number; // m³
  submergedFraction: number; // 0 to 1
  submergedHeightCm: number; // cm
  totalHeightCm: number; // cm
  status: 'FLUTUANDO' | 'EQUILÍBRIO NEUTRO' | 'AFUNDADO';
  explanation: string;
  whyCalado: string;
}

const FLUID_COLOR_MAP: Record<string, { bg: string; fill: string; light: string; border: string; text: string }> = {
  'Óleo de Soja': {
    bg: 'from-amber-500/20 to-yellow-500/30',
    fill: '#eab308',
    light: '#fef3c7',
    border: '#f59e0b',
    text: 'text-amber-700',
  },
  'Água Doce': {
    bg: 'from-blue-500/20 to-cyan-500/30',
    fill: '#3b82f6',
    light: '#dbeafe',
    border: '#2563eb',
    text: 'text-blue-700',
  },
  'Glicerina': {
    bg: 'from-purple-500/20 to-fuchsia-500/30',
    fill: '#a855f7',
    light: '#f3e8ff',
    border: '#9333ea',
    text: 'text-purple-700',
  },
  'Álcool (Etanol)': {
    bg: 'from-orange-500/20 to-amber-500/30',
    fill: '#fb923c',
    light: '#ffedd5',
    border: '#ea580c',
    text: 'text-orange-700',
  },
  'Gasolina': {
    bg: 'from-lime-500/20 to-green-500/30',
    fill: '#84cc16',
    light: '#ecfccb',
    border: '#65a30d',
    text: 'text-lime-700',
  },
  'Água do Mar': {
    bg: 'from-teal-500/20 to-emerald-500/30',
    fill: '#0d9488',
    light: '#ccfbf1',
    border: '#0f766e',
    text: 'text-teal-700',
  },
  'Mel': {
    bg: 'from-amber-600/20 to-yellow-600/30',
    fill: '#d97706',
    light: '#fef3c7',
    border: '#b45309',
    text: 'text-amber-800',
  },
  'Mercúrio': {
    bg: 'from-slate-500/20 to-zinc-600/30',
    fill: '#64748b',
    light: '#f1f5f9',
    border: '#475569',
    text: 'text-slate-700',
  },
};

function getFluidColorTheme(name: string) {
  return (
    FLUID_COLOR_MAP[name] || {
      bg: 'from-blue-500/20 to-indigo-500/30',
      fill: '#0284c7',
      light: '#e0f2fe',
      border: '#0369a1',
      text: 'text-blue-700',
    }
  );
}

function calculateImmersion(
  fluidName: string,
  fluidDensity: number,
  shape: ObjectShape,
  dim1: number,
  dim2: number,
  customObjDensity: number,
  gravity: number,
  extraWeight: number
): FluidComparisonData {
  const toM = (cm: number) => cm / 100;
  const totalVolume = calculateVolume(shape, toM(dim1), toM(dim2));
  const totalHeightCm = calculateHeight(shape, toM(dim1), toM(dim2)) * 100;

  const objectMass = totalVolume * customObjDensity;
  const objectWeight = objectMass * gravity + extraWeight;
  const effectiveDensity = totalVolume > 0 && gravity > 0 ? (objectWeight / gravity) / totalVolume : customObjDensity;
  const densityLabel = extraWeight > 0 ? `densidade efetiva (${effectiveDensity.toFixed(0)} kg/m³)` : `densidade do objeto (${customObjDensity} kg/m³)`;

  const maxBuoyancy = fluidDensity * totalVolume * gravity;
  const theme = getFluidColorTheme(fluidName);

  let status: 'FLUTUANDO' | 'EQUILÍBRIO NEUTRO' | 'AFUNDADO';
  let buoyancyForce: number;
  let submergedVolume: number;
  let apparentWeight: number;
  let submergedFraction: number;
  let submergedHeightCm: number;
  let explanation: string;
  let whyCalado: string;

  if (Math.abs(objectWeight - maxBuoyancy) <= maxBuoyancy * 0.0005) {
    status = 'EQUILÍBRIO NEUTRO';
    buoyancyForce = objectWeight;
    submergedVolume = totalVolume;
    apparentWeight = 0;
    submergedFraction = 1.0;
    submergedHeightCm = totalHeightCm;
    explanation = `A ${densityLabel} é praticamente idêntica à do fluido (${fluidDensity} kg/m³). O corpo fica suspenso em qualquer profundidade com empuxo igual ao peso.`;
    whyCalado = `Totalmente submerso (100%), sem tocar o fundo e sem emergir.`;
  } else if (objectWeight < maxBuoyancy) {
    status = 'FLUTUANDO';
    buoyancyForce = objectWeight;
    submergedVolume = buoyancyForce / (fluidDensity * gravity);
    apparentWeight = 0;
    submergedFraction = Math.max(0.01, Math.min(0.999, submergedVolume / totalVolume));

    if (shape === ObjectShape.CUBE || shape === ObjectShape.CYLINDER) {
      submergedHeightCm = totalHeightCm * submergedFraction;
    } else {
      const R = toM(dim1);
      let low = 0;
      let high = 2 * R;
      for (let i = 0; i < 40; i++) {
        const mid = (low + high) / 2;
        const v = calculateVolumeFromBottom(ObjectShape.SPHERE, R, mid);
        if (v < submergedVolume) {
          low = mid;
        } else {
          high = mid;
        }
      }
      submergedHeightCm = ((low + high) / 2) * 100;
    }

    explanation = `Como a ${densityLabel} é menor que a do fluido (${fluidDensity} kg/m³), o corpo flutua em equilíbrio: Empuxo = Peso (${(buoyancyForce / 1000).toFixed(2)} kN / ${buoyancyForce.toFixed(1)} N).`;
    whyCalado = `O objeto precisa submergir apenas ${(submergedFraction * 100).toFixed(1)}% do seu volume (${submergedHeightCm.toFixed(1)} cm de calado) para deslocar líquido com peso igual ao seu.`;
  } else {
    status = 'AFUNDADO';
    buoyancyForce = maxBuoyancy;
    submergedVolume = totalVolume;
    apparentWeight = Math.max(0, objectWeight - buoyancyForce);
    submergedFraction = 1.0;
    submergedHeightCm = totalHeightCm;
    explanation = `Como a ${densityLabel} é maior que a do fluido (${fluidDensity} kg/m³), o peso (${(objectWeight / 1000).toFixed(2)} kN / ${objectWeight.toFixed(1)} N) supera o empuxo máximo (${(buoyancyForce / 1000).toFixed(2)} kN / ${buoyancyForce.toFixed(1)} N).`;
    whyCalado = `O corpo afunda até o fundo do recipiente. O peso aparente no fundo é de ${(apparentWeight / 1000).toFixed(2)} kN (${apparentWeight.toFixed(1)} N).`;
  }

  return {
    fluidName,
    fluidDensity,
    fluidColor: theme.fill,
    buoyancyForce,
    objectWeight,
    apparentWeight,
    submergedVolume,
    totalVolume,
    submergedFraction,
    submergedHeightCm,
    totalHeightCm,
    status,
    explanation,
    whyCalado,
  };
}

export const PainelComparacaoFluidos: React.FC<PainelComparacaoFluidosProps> = ({
  shape,
  dim1,
  dim2,
  selectedMaterial,
  customObjDensity,
  gravity,
  extraWeight = 0,
  onApplyFluid,
  onClose,
}) => {
  const [fluidA, setFluidA] = useState<string>('Óleo de Soja');
  const [fluidB, setFluidB] = useState<string>('Água Doce');
  const [fluidC, setFluidC] = useState<string>('Glicerina');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'visual' | 'grafico' | 'tabela'>('visual');
  const [highlightedFluid, setHighlightedFluid] = useState<string>('Água Doce');

  // Find density for fluids
  const getDensity = (name: string): number => {
    return FLUIDS.find((f) => f.name === name)?.density || 1000;
  };

  const dataA = useMemo(
    () => calculateImmersion(fluidA, getDensity(fluidA), shape, dim1, dim2, customObjDensity, gravity, extraWeight),
    [fluidA, shape, dim1, dim2, customObjDensity, gravity, extraWeight]
  );

  const dataB = useMemo(
    () => calculateImmersion(fluidB, getDensity(fluidB), shape, dim1, dim2, customObjDensity, gravity, extraWeight),
    [fluidB, shape, dim1, dim2, customObjDensity, gravity, extraWeight]
  );

  const dataC = useMemo(
    () => calculateImmersion(fluidC, getDensity(fluidC), shape, dim1, dim2, customObjDensity, gravity, extraWeight),
    [fluidC, shape, dim1, dim2, customObjDensity, gravity, extraWeight]
  );

  const comparisonSlots = [
    { key: 'A', data: dataA, setter: setFluidA, current: fluidA },
    { key: 'B', data: dataB, setter: setFluidB, current: fluidB },
    { key: 'C', data: dataC, setter: setFluidC, current: fluidC },
  ];

  const objColor = MATERIALS.find((m) => m.name === selectedMaterial)?.color || '#64748b';

  const maxBuoyancyVal = Math.max(dataA.buoyancyForce, dataB.buoyancyForce, dataC.buoyancyForce, dataA.objectWeight, 1);

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-blue-100 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-300">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
            <FlaskConical className="w-6 h-6 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-cyan-100 border border-white/20">
                Princípio de Arquimedes
              </span>
              <span className="text-xs text-blue-200">• Comparativo Multi-Fluidos</span>
            </div>
            <h3 className="text-lg md:text-xl font-black tracking-tight mt-0.5">
              Comparação Visual de Empuxo entre Fluidos
            </h3>
            <p className="text-xs text-blue-100/90 font-medium">
              Observe como a densidade do fluido (Óleo, Água, Glicerina) altera o empuxo, calado e flutuabilidade do mesmo objeto.
            </p>
          </div>
        </div>

        {/* Global Fluid Selector Dropdown & Collapse Toggle */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
            <Droplets className="w-4 h-4 text-cyan-200 shrink-0" />
            <span className="text-[10px] uppercase font-bold text-blue-100 hidden sm:inline">Fluido Alvo:</span>
            <select
              value={highlightedFluid}
              onChange={(e) => {
                const val = e.target.value;
                setHighlightedFluid(val);
                // Also optionally sync slot B or apply
                setFluidB(val);
              }}
              className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer pr-2"
            >
              {FLUIDS.map((f) => (
                <option key={f.name} value={f.name} className="text-slate-800 font-medium">
                  {f.name} ({f.density} kg/m³)
                </option>
              ))}
            </select>
          </div>

          {onApplyFluid && (
            <button
              onClick={() => onApplyFluid(highlightedFluid, getDensity(highlightedFluid))}
              className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              title="Carregar este fluido no simulador principal acima"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Aplicar na Simulação</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white border border-white/10"
            title={isExpanded ? 'Recolher conteúdo' : 'Expandir conteúdo'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-white transition-all border border-rose-300/30 flex items-center gap-1.5 text-xs font-bold shadow-sm"
              title="Desativar e ocultar comparador de fluidos"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Desativar</span>
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 md:p-6 space-y-6">
          {/* Object summary bar & presets */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Objeto de Teste:</span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 shadow-sm flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 shrink-0"
                    style={{ backgroundColor: objColor }}
                  />
                  {selectedMaterial} ({shape})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Densidade:</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-100 dark:border-blue-800/60">
                  {customObjDensity} kg/m³
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Peso Real (P):</span>
                <span className="px-2 py-0.5 rounded bg-red-50 dark:bg-rose-950/60 text-red-700 dark:text-rose-300 font-bold border border-red-100 dark:border-rose-800/60">
                  {(dataA.objectWeight / 1000).toFixed(2)} kN ({dataA.objectWeight.toFixed(1)} N)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Volume Total:</span>
                <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold border border-amber-100 dark:border-amber-800/60">
                  {(dataA.totalVolume * 1000).toFixed(2)} L
                </span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Predefinições:</span>
              <button
                onClick={() => {
                  setFluidA('Óleo de Soja');
                  setFluidB('Água Doce');
                  setFluidC('Glicerina');
                }}
                className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
              >
                Óleo • Água • Glicerina
              </button>
              <button
                onClick={() => {
                  setFluidA('Gasolina');
                  setFluidB('Água Doce');
                  setFluidC('Mel');
                }}
                className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Gasolina • Água • Mel
              </button>
              <button
                onClick={() => {
                  setFluidA('Álcool (Etanol)');
                  setFluidB('Água do Mar');
                  setFluidC('Mercúrio');
                }}
                className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Etanol • Mar • Mercúrio
              </button>
            </div>
          </div>

          {/* Navigation view tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('visual')}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                  activeTab === 'visual'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Recipientes Visuais
              </button>
              <button
                onClick={() => setActiveTab('grafico')}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                  activeTab === 'grafico'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Gráficos de Forças
              </button>
              <button
                onClick={() => setActiveTab('tabela')}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                  activeTab === 'tabela'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                Tabela Comparativa
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-medium hidden sm:flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
              <span>Selecione fluidos diferentes nos menus suspensos de cada coluna</span>
            </div>
          </div>

          {/* TAB 1: VISUAL BEAKERS COMPARISON */}
          {activeTab === 'visual' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {comparisonSlots.map(({ key, data, setter, current }) => {
                const theme = getFluidColorTheme(data.fluidName);
                const isFloating = data.status === 'FLUTUANDO';
                const isSunk = data.status === 'AFUNDADO';
                const isNeutral = data.status === 'EQUILÍBRIO NEUTRO';

                // SVG dimensions & scaling
                const svgW = 220;
                const svgH = 260;
                const beakerLeft = 35;
                const beakerRight = 185;
                const beakerWidth = beakerRight - beakerLeft;
                const beakerTop = 40;
                const beakerBottom = 230;
                const beakerHeight = beakerBottom - beakerTop;

                // Fluid level in beaker
                const fluidSurfaceY = beakerBottom - beakerHeight * 0.72; // ~72% full
                const fluidHeight = beakerBottom - fluidSurfaceY;

                // Object visual sizing
                const visualObjH = Math.min(65, Math.max(38, beakerHeight * 0.32));
                const visualObjW = shape === ObjectShape.SPHERE ? visualObjH : visualObjH * 0.95;
                const objLeft = beakerLeft + (beakerWidth - visualObjW) / 2;

                // Object equilibrium Y position
                let objTopY: number;
                if (isSunk) {
                  objTopY = beakerBottom - visualObjH;
                } else if (isNeutral) {
                  objTopY = fluidSurfaceY + (fluidHeight - visualObjH) / 2;
                } else {
                  // Floating: waterline cuts according to submergedFraction
                  const subVisualH = visualObjH * data.submergedFraction;
                  objTopY = fluidSurfaceY - (visualObjH - subVisualH);
                }

                const objCenterY = objTopY + visualObjH / 2;
                const objCenterX = objLeft + visualObjW / 2;

                // Force vector arrow lengths
                const maxArrowLen = 50;
                const arrowWeightLen = Math.min(maxArrowLen, Math.max(22, (data.objectWeight / maxBuoyancyVal) * maxArrowLen));
                const arrowBuoyancyLen = Math.min(maxArrowLen, Math.max(22, (data.buoyancyForce / maxBuoyancyVal) * maxArrowLen));

                return (
                  <div
                    key={key}
                    className="flex flex-col bg-white dark:bg-slate-800/80 rounded-2xl border-2 border-slate-100 dark:border-slate-700/80 hover:border-blue-200 dark:hover:border-blue-700 transition-all shadow-lg hover:shadow-xl overflow-hidden"
                  >
                    {/* Fluid Dropdown Selector Header */}
                    <div className={`p-3.5 bg-gradient-to-r ${theme.bg} border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between`}>
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white shadow-sm shrink-0"
                          style={{ backgroundColor: theme.fill }}
                        />
                        <div className="flex-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 block">
                            Fluido ({key})
                          </label>
                          <select
                            value={current}
                            onChange={(e) => setter(e.target.value)}
                            className="w-full bg-white/90 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-black text-xs py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm outline-none cursor-pointer transition-colors"
                          >
                            {FLUIDS.map((f) => (
                              <option key={f.name} value={f.name}>
                                {f.name} ({f.density} kg/m³)
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-300 block">Densidade</span>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100">{data.fluidDensity} kg/m³</span>
                      </div>
                    </div>

                    {/* Interactive SVG Beaker */}
                    <div className="relative bg-gradient-to-b from-slate-50/60 to-white dark:from-slate-900/60 dark:to-slate-900 flex items-center justify-center p-3">
                      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[240px] h-auto drop-shadow-sm select-none">
                        <defs>
                          <linearGradient id={`grad-fluid-${key}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={theme.fill} stopOpacity="0.65" />
                            <stop offset="100%" stopColor={theme.fill} stopOpacity="0.88" />
                          </linearGradient>

                          <linearGradient id={`glass-reflection-${key}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
                            <stop offset="25%" stopColor="#ffffff" stopOpacity="0.1" />
                            <stop offset="85%" stopColor="#ffffff" stopOpacity="0.0" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
                          </linearGradient>

                          {/* Arrow markers */}
                          <marker id={`arrow-down-${key}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                            <polygon points="0,0 6,3 0,6" fill="#ef4444" />
                          </marker>
                          <marker id={`arrow-up-${key}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                            <polygon points="0,0 6,3 0,6" fill="#10b981" />
                          </marker>
                        </defs>

                        {/* Beaker Glass Background */}
                        <path
                          d={`M ${beakerLeft} ${beakerTop} L ${beakerLeft} ${beakerBottom - 10} Q ${beakerLeft} ${beakerBottom} ${beakerLeft + 10} ${beakerBottom} L ${beakerRight - 10} ${beakerBottom} Q ${beakerRight} ${beakerBottom} ${beakerRight} ${beakerBottom - 10} L ${beakerRight} ${beakerTop}`}
                          fill="#f8fafc"
                          stroke="#cbd5e1"
                          strokeWidth="2.5"
                        />

                        {/* Fluid Fill */}
                        <path
                          d={`M ${beakerLeft + 1} ${fluidSurfaceY} L ${beakerLeft + 1} ${beakerBottom - 10} Q ${beakerLeft + 1} ${beakerBottom - 1} ${beakerLeft + 10} ${beakerBottom - 1} L ${beakerRight - 10} ${beakerBottom - 1} Q ${beakerRight - 1} ${beakerBottom - 1} ${beakerRight - 1} ${beakerBottom - 10} L ${beakerRight - 1} ${fluidSurfaceY} Z`}
                          fill={`url(#grad-fluid-${key})`}
                        />

                        {/* Fluid Meniscus Surface Wave */}
                        <path
                          d={`M ${beakerLeft} ${fluidSurfaceY} Q ${objCenterX} ${fluidSurfaceY - 3} ${beakerRight} ${fluidSurfaceY}`}
                          fill="none"
                          stroke={theme.border}
                          strokeWidth="2"
                        />

                        {/* Volume Graduation Ticks on Beaker Glass */}
                        {[0.2, 0.4, 0.6, 0.8].map((pct, idx) => {
                          const tickY = beakerBottom - beakerHeight * pct;
                          return (
                            <g key={idx}>
                              <line
                                x1={beakerLeft + 2}
                                y1={tickY}
                                x2={beakerLeft + 10}
                                y2={tickY}
                                stroke="#94a3b8"
                                strokeWidth="1.5"
                              />
                              <text
                                x={beakerLeft + 12}
                                y={tickY + 3}
                                fontSize="7"
                                fill="#94a3b8"
                                fontWeight="bold"
                              >
                                {(pct * 1000).toFixed(0)} ml
                              </text>
                            </g>
                          );
                        })}

                        {/* Immersed Object Rendering */}
                        <g>
                          {shape === ObjectShape.CUBE ? (
                            <rect
                              x={objLeft}
                              y={objTopY}
                              width={visualObjW}
                              height={visualObjH}
                              rx="5"
                              fill={objColor}
                              stroke="#334155"
                              strokeWidth="2"
                              className="transition-all duration-300"
                            />
                          ) : shape === ObjectShape.SPHERE ? (
                            <circle
                              cx={objCenterX}
                              cy={objCenterY}
                              r={visualObjW / 2}
                              fill={objColor}
                              stroke="#334155"
                              strokeWidth="2"
                              className="transition-all duration-300"
                            />
                          ) : (
                            <rect
                              x={objLeft}
                              y={objTopY}
                              width={visualObjW}
                              height={visualObjH}
                              rx="8"
                              fill={objColor}
                              stroke="#334155"
                              strokeWidth="2"
                              className="transition-all duration-300"
                            />
                          )}

                          {/* Submerged Tint / Shadow Overlay on the Submerged Section */}
                          {objTopY < fluidSurfaceY && objTopY + visualObjH > fluidSurfaceY && (
                            <clipPath id={`sub-clip-${key}`}>
                              <rect
                                x={beakerLeft}
                                y={fluidSurfaceY}
                                width={beakerWidth}
                                height={beakerBottom - fluidSurfaceY}
                              />
                            </clipPath>
                          )}

                          {/* Waterline dotted reference if floating */}
                          {isFloating && (
                            <line
                              x1={objLeft - 8}
                              y1={fluidSurfaceY}
                              x2={objLeft + visualObjW + 8}
                              y2={fluidSurfaceY}
                              stroke="#1e293b"
                              strokeWidth="1"
                              strokeDasharray="2 2"
                              opacity="0.6"
                            />
                          )}

                          {/* Vector Force Arrows right on object */}
                          {/* 1. Weight Arrow (Red, Downward) */}
                          <g>
                            <line
                              x1={objCenterX - 10}
                              y1={objCenterY}
                              x2={objCenterX - 10}
                              y2={objCenterY + arrowWeightLen}
                              stroke="#ef4444"
                              strokeWidth="2.5"
                              markerEnd={`url(#arrow-down-${key})`}
                            />
                            <text
                              x={objCenterX - 14}
                              y={objCenterY + arrowWeightLen + 2}
                              fontSize="8"
                              fontWeight="bold"
                              fill="#ef4444"
                              textAnchor="end"
                            >
                              P
                            </text>
                          </g>

                          {/* 2. Buoyancy Arrow (Green, Upward) */}
                          <g>
                            <line
                              x1={objCenterX + 10}
                              y1={objCenterY}
                              x2={objCenterX + 10}
                              y2={objCenterY - arrowBuoyancyLen}
                              stroke="#10b981"
                              strokeWidth="2.5"
                              markerEnd={`url(#arrow-up-${key})`}
                            />
                            <text
                              x={objCenterX + 14}
                              y={objCenterY - arrowBuoyancyLen - 1}
                              fontSize="8"
                              fontWeight="bold"
                              fill="#10b981"
                              textAnchor="start"
                            >
                              E
                            </text>
                          </g>
                        </g>

                        {/* Glass Reflection Highlight */}
                        <path
                          d={`M ${beakerLeft + 2} ${beakerTop} L ${beakerLeft + 2} ${beakerBottom - 10} Q ${beakerLeft + 2} ${beakerBottom - 2} ${beakerLeft + 10} ${beakerBottom - 2} L ${beakerRight - 10} ${beakerBottom - 2} Q ${beakerRight - 2} ${beakerBottom - 2} ${beakerRight - 2} ${beakerBottom - 10} L ${beakerRight - 2} ${beakerTop} Z`}
                          fill={`url(#glass-reflection-${key})`}
                          pointerEvents="none"
                        />

                        {/* Beaker Rim Lip */}
                        <ellipse
                          cx={(beakerLeft + beakerRight) / 2}
                          cy={beakerTop}
                          rx={beakerWidth / 2}
                          ry="5"
                          fill="none"
                          stroke="#94a3b8"
                          strokeWidth="2"
                        />
                      </svg>

                      {/* State Floating Badge overlay */}
                      <div className="absolute top-2 right-2">
                        <span
                          className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-sm border ${
                            isFloating
                              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : isNeutral
                              ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {data.status}
                        </span>
                      </div>
                    </div>

                    {/* Submersion Progress Gauge */}
                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/70 border-t border-b border-slate-100 dark:border-slate-700/70">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        <span>Fração Submersa:</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-100">
                          {(data.submergedFraction * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFloating ? 'bg-emerald-500' : isNeutral ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, data.submergedFraction * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Quantitative Results Card */}
                    <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                            Empuxo (E)
                          </span>
                          <span className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                            {(data.buoyancyForce / 1000).toFixed(2)} kN
                          </span>
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block">
                            {data.buoyancyForce.toFixed(1)} N
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/60">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
                            Peso Aparente
                          </span>
                          <span className="text-sm font-black text-blue-900 dark:text-blue-200">
                            {(data.apparentWeight / 1000).toFixed(2)} kN
                          </span>
                          <span className="text-[9px] text-blue-600 dark:text-blue-400 block">
                            {data.apparentWeight.toFixed(1)} N
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                            Calado (h sub)
                          </span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {data.submergedHeightCm.toFixed(1)} cm
                          </span>
                          <span className="text-[9px] text-slate-400 block">
                            de {data.totalHeightCm.toFixed(1)} cm
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                            Vol. Deslocado
                          </span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {(data.submergedVolume * 1000).toFixed(2)} L
                          </span>
                          <span className="text-[9px] text-slate-400 block">
                            {((data.submergedVolume / data.totalVolume) * 100).toFixed(0)}% do volume
                          </span>
                        </div>
                      </div>

                      {/* Scientific explanation */}
                      <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                        <span className="font-bold text-slate-800 dark:text-slate-100 block mb-0.5">Explicação Física:</span>
                        {data.explanation}
                      </div>

                      {/* Action button to test this fluid in the main simulation */}
                      {onApplyFluid && (
                        <button
                          onClick={() => onApplyFluid(data.fluidName, data.fluidDensity)}
                          className="w-full mt-2 py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-700/80 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-600"
                        >
                          <Zap className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                          Simular no Tanque 3D Principal
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: FORCES BAR CHART */}
          {activeTab === 'grafico' && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-700/70">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Comparação do Empuxo (E) vs Peso do Objeto (P = {(dataA.objectWeight / 1000).toFixed(2)} kN / {dataA.objectWeight.toFixed(1)} N)
                </h4>

                <div className="space-y-4">
                  {comparisonSlots.map(({ key, data }) => {
                    const theme = getFluidColorTheme(data.fluidName);
                    const pctOfWeight = (data.buoyancyForce / data.objectWeight) * 100;
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: theme.fill }}
                            />
                            <span>
                              {data.fluidName} (ρ = {data.fluidDensity} kg/m³)
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-slate-900 dark:text-slate-100">
                              E = {(data.buoyancyForce / 1000).toFixed(2)} kN ({data.buoyancyForce.toFixed(1)} N)
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                data.status === 'FLUTUANDO'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                                  : data.status === 'EQUILÍBRIO NEUTRO'
                                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                                  : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300'
                              }`}
                            >
                              {data.status}
                            </span>
                          </div>
                        </div>

                        <div className="relative h-6 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden flex items-center">
                          {/* Reference Weight line at 100% */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                            style={{ left: `${Math.min(95, 100 * (data.objectWeight / maxBuoyancyVal))}%` }}
                            title="Linha do Peso Real"
                          />
                          <div
                            className="h-full rounded-lg transition-all duration-500 flex items-center pl-2 text-[10px] font-black text-white"
                            style={{
                              width: `${Math.min(100, (data.buoyancyForce / maxBuoyancyVal) * 100)}%`,
                              backgroundColor: theme.fill,
                            }}
                          >
                            {pctOfWeight >= 30 && `${(data.buoyancyForce / 1000).toFixed(2)} kN (${data.buoyancyForce.toFixed(1)} N)`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-red-500 inline-block" />
                    <span>Linha Vermelha: Peso Real do Objeto (P = {(dataA.objectWeight / 1000).toFixed(2)} kN / {dataA.objectWeight.toFixed(1)} N)</span>
                  </div>
                  <span>Nota: Quando flutuando, E se iguala rigorosamente a P.</span>
                </div>
              </div>

              {/* Density Spectrum Bar */}
              <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-700/70">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2">
                  Espectro de Densidade dos Fluidos Selecionados
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Se ρ(fluido) &gt; ρ(objeto) = {customObjDensity} kg/m³, o corpo flutua. Quanto mais denso o líquido, menor o calado submerso necessário.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {comparisonSlots.map(({ key, data }) => (
                    <div
                      key={key}
                      className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100">{data.fluidName}</span>
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{data.fluidDensity} kg/m³</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                          {data.whyCalado}
                        </p>
                      </div>
                      <div className="mt-3 text-[10px] font-bold text-slate-400">
                        Razão ρ_obj / ρ_fluido = {(customObjDensity / data.fluidDensity).toFixed(3)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMPARATIVE SUMMARY TABLE */}
          {activeTab === 'tabela' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3">Propriedade</th>
                    {comparisonSlots.map(({ key, data }) => (
                      <th key={key} className="p-3">
                        {data.fluidName} ({key})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">Densidade do Fluido (ρ)</td>
                    {comparisonSlots.map(({ key, data }) => (
                      <td key={key} className="p-3 font-bold">
                        {data.fluidDensity} kg/m³
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">Estado de Flutuabilidade</td>
                    {comparisonSlots.map(({ key, data }) => (
                      <td key={key} className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            data.status === 'FLUTUANDO'
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                              : data.status === 'EQUILÍBRIO NEUTRO'
                              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                              : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {data.status}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">Empuxo Resultante (E)</td>
                    {comparisonSlots.map(({ key, data }) => (
                      <td key={key} className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                        {(data.buoyancyForce / 1000).toFixed(2)} kN ({data.buoyancyForce.toFixed(1)} N)
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">Peso Aparente (Pap = P - E)</td>
                    {comparisonSlots.map(({ key, data }) => (
                      <td key={key} className="p-3 font-bold text-blue-600 dark:text-blue-400">
                        {(data.apparentWeight / 1000).toFixed(2)} kN ({data.apparentWeight.toFixed(1)} N)
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">Fração Submersa</td>
                    {comparisonSlots.map(({ key, data }) => (
                      <td key={key} className="p-3">
                        {(data.submergedFraction * 100).toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">Calado Submerso (h_sub)</td>
                    {comparisonSlots.map(({ key, data }) => (
                      <td key={key} className="p-3">
                        {data.submergedHeightCm.toFixed(1)} cm / {data.totalHeightCm.toFixed(1)} cm
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">Volume Deslocado (V_sub)</td>
                    {comparisonSlots.map(({ key, data }) => (
                      <td key={key} className="p-3">
                        {(data.submergedVolume * 1000).toFixed(3)} L
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Educational Insights Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-100 dark:border-blue-900/60 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <span className="font-bold text-blue-900 dark:text-blue-200 block mb-0.5">
                Conclusão Pedagógica de Arquimedes:
              </span>
              O empuxo depende exclusivamente do <strong>peso do fluido deslocado</strong> (E = &rho;<sub>fluido</sub> &middot; V<sub>sub</sub> &middot; g).
              Em fluidos mais densos como a <strong>Glicerina (1260 kg/m³)</strong>, o objeto requer um volume menor de imersão (menor calado) para flutuar que na <strong>Água Doce (1000 kg/m³)</strong> ou no <strong>Óleo (920 kg/m³)</strong>.
              Caso a densidade do corpo seja superior à do fluido, o empuxo máximo é insuficiente e o corpo atinge o fundo do tanque.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
