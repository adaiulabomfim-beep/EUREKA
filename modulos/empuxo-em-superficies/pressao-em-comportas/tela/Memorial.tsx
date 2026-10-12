import React, { useState } from 'react';
import { FileText, Calculator, Layers, HelpCircle } from 'lucide-react';
import { FormaComporta, SistemaUnidades, ModoPosicionamentoComporta } from '../dominio/tipos';
import { ConfiguracaoSimulacaoComporta } from '../dominio/configuracao';

export const CalculationLine: React.FC<{
  label: string | React.ReactNode;
  symbol: string | React.ReactNode;
  formula?: string | React.ReactNode;
  substitution?: string | React.ReactNode;
  result: string;
  unit: string;
  isSubHeader?: boolean;
  theme?: 'slate' | 'blue' | 'cyan' | 'emerald' | 'amber' | 'red' | 'purple' | 'indigo';
}> = ({ label, symbol, formula, substitution, result, unit, isSubHeader, theme = 'blue' }) => {
  const parseSub = (text: string | React.ReactNode) => {
    if (typeof text !== 'string') return text;
    const parts = text.split(/_([a-zA-Z0-9]+(?:_[a-zA-Z0-9]+)*)/g);
    if (parts.length === 1) return text;
    return (
      <>
        {parts.map((part, i) =>
          i % 2 === 1 ? (
            <sub key={i} className="text-[0.8em] leading-[0] font-semibold">
              {part}
            </sub>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const t = {
    slate: { text: 'text-slate-600', bg: 'bg-slate-100 text-slate-800', border: 'border-slate-100', subBg: 'bg-slate-700 text-white', unitText: 'text-slate-500', unitSub: 'text-slate-200', subHeaderWrap: 'bg-slate-50/80' },
    blue: { text: 'text-blue-600', bg: 'bg-blue-50 text-blue-900', border: 'border-blue-50', subBg: 'bg-blue-600 text-white', unitText: 'text-blue-500', unitSub: 'text-blue-200', subHeaderWrap: 'bg-blue-50/50' },
    cyan: { text: 'text-cyan-600', bg: 'bg-cyan-50 text-cyan-900', border: 'border-cyan-50', subBg: 'bg-cyan-600 text-white', unitText: 'text-cyan-500', unitSub: 'text-cyan-200', subHeaderWrap: 'bg-cyan-50/50' },
    emerald: { text: 'text-emerald-600', bg: 'bg-emerald-50 text-emerald-900', border: 'border-emerald-50', subBg: 'bg-emerald-600 text-white', unitText: 'text-emerald-500', unitSub: 'text-emerald-200', subHeaderWrap: 'bg-emerald-50/50' },
    amber: { text: 'text-amber-600', bg: 'bg-amber-50 text-amber-900', border: 'border-amber-50', subBg: 'bg-amber-500 text-white', unitText: 'text-amber-500', unitSub: 'text-amber-100', subHeaderWrap: 'bg-amber-50/50' },
    red: { text: 'text-red-600', bg: 'bg-red-50 text-red-900', border: 'border-red-50', subBg: 'bg-red-600 text-white', unitText: 'text-red-500', unitSub: 'text-red-200', subHeaderWrap: 'bg-red-50/50' },
    purple: { text: 'text-purple-600', bg: 'bg-purple-50 text-purple-900', border: 'border-purple-50', subBg: 'bg-purple-600 text-white', unitText: 'text-purple-500', unitSub: 'text-purple-200', subHeaderWrap: 'bg-purple-50/50' },
    indigo: { text: 'text-indigo-600', bg: 'bg-indigo-50 text-indigo-900', border: 'border-indigo-50', subBg: 'bg-indigo-600 text-white', unitText: 'text-indigo-500', unitSub: 'text-indigo-200', subHeaderWrap: 'bg-indigo-50/50' },
  }[theme];

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-baseline justify-between py-3 border-b ${t.border} last:border-0 ${
        isSubHeader ? `${t.subHeaderWrap} -mx-6 px-6 font-bold text-slate-800 mt-4 mb-2 py-4 shadow-sm rounded-xl` : ''
      }`}
    >
      <div className={`font-bold uppercase tracking-widest ${isSubHeader ? 'text-sm text-slate-700' : 'text-xs text-slate-500'}`}>
        {label}
      </div>
      <div className="flex flex-wrap items-center gap-2.5 text-[13px] sm:text-sm font-mono text-slate-700 mt-2 sm:mt-0">
        <span className={`font-bold ${t.text}`}>{parseSub(symbol)}</span>
        {formula && <span className="text-slate-400 hidden lg:inline">= {parseSub(formula)}</span>}
        {substitution && <span className="text-slate-500">= {parseSub(substitution)}</span>}
        <span className={`font-bold px-3 py-1.5 rounded-lg ml-auto ${isSubHeader ? t.subBg : t.bg}`}>
          = {result} {unit && <span className={`text-[11px] font-sans ml-1 font-semibold ${isSubHeader ? t.unitSub : t.unitText}`}>{unit}</span>}
        </span>
      </div>
    </div>
  );
};

interface MemorialProps {
  analyzedResults: any;
  onClose: () => void;
  gateInclination: number;
  gateShape: FormaComporta;
  config?: ConfiguracaoSimulacaoComporta;
}

export const Memorial: React.FC<MemorialProps> = ({
  analyzedResults,
  onClose,
  gateInclination,
  gateShape,
  config,
}) => {
  if (!analyzedResults) return null;

  // Sistema de unidades local ou do config
  const initialUnit = config?.sistemaUnidades ?? analyzedResults?.sistemaUnidades ?? SistemaUnidades.SI;
  const [unitSystem, setUnitSystem] = useState<SistemaUnidades>(initialUnit);
  const isKgf = unitSystem === SistemaUnidades.TECNICO_KGF;

  const g = config?.fluidoMontante?.gravidade ?? 9.81;
  const rho = config?.fluidoMontante?.densidade ?? analyzedResults?.densityUp ?? 1000;
  const gamma_N = analyzedResults?.gammaUp ?? rho * g;
  const gamma_kgf = rho; // kgf/m³

  // Grandeza selecionada
  const gamma_val = isKgf ? gamma_kgf : gamma_N;
  const gamma_unit = isKgf ? 'kgf/m³' : 'N/m³';
  const p_unit = isKgf ? 'kgf/m²' : 'kPa';
  const force_unit = isKgf ? 'kgf' : 'kN';

  const thetaRad = (gateInclination * Math.PI) / 180;
  const sinTheta = Math.sin(thetaRad);

  const H = config?.comporta?.altura ?? 1.0;
  const W = config?.comporta?.largura ?? 1.0;
  const isCircular = gateShape === FormaComporta.CIRCULAR;
  const isRect = gateShape === FormaComporta.RETANGULAR;
  const isSemi = gateShape === FormaComporta.SEMI_CIRCULAR;

  const area = analyzedResults.forceData.up.area;
  const Ixx = analyzedResults.forceData.up.Ixx ?? (isCircular ? (Math.PI * Math.pow(H / 2, 4)) / 4 : (W * Math.pow(H, 3)) / 12);
  const h_cg = analyzedResults.forceData.up.h_cg;
  const Y_CG = analyzedResults.forceData.up.Y_CG ?? (h_cg / Math.max(0.001, sinTheta));
  const delta_y = analyzedResults.forceData.up.delta_y ?? (Ixx / (area * Y_CG));
  const Y_CP = analyzedResults.forceData.up.Y_CP ?? (Y_CG + delta_y);
  const h_cp = analyzedResults.forceData.up.h_cp;

  // Pressão no centróide
  const p_cg_Pa = gamma_N * h_cg;
  const p_cg_disp = isKgf ? (p_cg_Pa / g).toFixed(1) : (p_cg_Pa / 1000).toFixed(2);

  // Força resultante
  const FR_N = Math.abs(analyzedResults.forceData.FR_net);
  const FR_disp = isKgf ? Math.round(FR_N / g).toLocaleString('pt-BR') : (FR_N / 1000).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-xl w-[95vw] lg:w-[80vw] h-[95vh] lg:h-[82vh] overflow-y-auto rounded-3xl shadow-2xl border border-blue-100 animate-in slide-in-from-bottom-10 zoom-in-95 duration-300 relative flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-blue-100 p-5 px-8 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight">
                Memorial de Cálculo Hidrostático
              </h3>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                Passo a passo com equações e deduções didáticas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Unit Toggle in Memorial */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setUnitSystem(SistemaUnidades.SI)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  !isKgf ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                SI (kN, kPa)
              </button>
              <button
                type="button"
                onClick={() => setUnitSystem(SistemaUnidades.TECNICO_KGF)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  isKgf ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Técnico (kgf)
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-[11px] font-black text-slate-400 hover:text-blue-600 px-4 py-2 hover:bg-blue-50 rounded-xl transition-all uppercase tracking-widest border border-slate-200/60"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
          {/* 1. DADOS DE ENTRADA */}
          <section>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-6 h-px bg-slate-300"></div> 1. Dados de Entrada do Problema <div className="flex-1 h-px bg-slate-100"></div>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 text-xs text-slate-700">
              <div>
                <span className="text-slate-400 block font-medium">Formato da Comporta:</span>
                <span className="font-bold text-slate-800 text-sm">
                  {isCircular ? 'Circular' : isRect ? 'Retangular' : 'Semicircular'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Dimensões:</span>
                <span className="font-bold text-slate-800 font-mono text-sm">
                  {isCircular ? `Diâmetro Ø = ${H.toFixed(2)} m` : `H = ${H.toFixed(2)} m, B = ${W.toFixed(2)} m`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Ângulo de Inclinação:</span>
                <span className="font-bold text-slate-800 font-mono text-sm">θ = {gateInclination}°</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Fluido & Peso Específico (γ):</span>
                <span className="font-bold text-slate-800 font-mono text-sm">
                  γ = {isKgf ? `${gamma_kgf} kgf/m³` : `${gamma_N.toFixed(0)} N/m³ (${(gamma_N / 1000).toFixed(2)} kN/m³)`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Modo de Posicionamento:</span>
                <span className="font-bold text-slate-800 text-sm">
                  {config?.comporta?.modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO
                    ? `Modo Y_CG Direto (${Y_CG.toFixed(2)} m)`
                    : `Modo Padrão h₁ (${config?.comporta?.profundidadeTopo.toFixed(2)} m)`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Sistema de Unidades:</span>
                <span className="font-bold text-blue-600 font-mono text-sm">
                  {isKgf ? 'Técnico (kgf, kgf/m²)' : 'SI (kN, kPa)'}
                </span>
              </div>
            </div>
          </section>

          {/* 2. GEOMETRIA DA SEÇÃO TRANSVERSAL */}
          <section>
            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-6 h-px bg-slate-300"></div> 2. Propriedades Geométricas da Área Molhada <div className="flex-1 h-px bg-slate-100"></div>
            </h4>
            <div className="flex flex-col gap-0 bg-white shadow-sm p-6 rounded-2xl border border-slate-100">
              <CalculationLine
                theme="slate"
                label="Área da Comporta (A)"
                symbol="A"
                formula={isCircular ? 'π · D² / 4' : isRect ? 'b · h' : 'π · R² / 2'}
                substitution={
                  isCircular
                    ? `π · (${H.toFixed(2)})² / 4`
                    : isRect
                    ? `${W.toFixed(2)} · ${H.toFixed(2)}`
                    : `π · (${(H / 2).toFixed(2)})² / 2`
                }
                result={area.toFixed(4)}
                unit="m²"
              />
              <CalculationLine
                theme="slate"
                label="Momento de Inércia Centroidal (I_xx)"
                symbol={<>I<sub>xx</sub></>}
                formula={isCircular ? 'π · D⁴ / 64' : isRect ? 'b · h³ / 12' : 'R⁴ · (π/8 - 8/9π)'}
                substitution={
                  isCircular
                    ? `π · (${H.toFixed(2)})⁴ / 64`
                    : isRect
                    ? `${W.toFixed(2)} · (${H.toFixed(2)})³ / 12`
                    : `(${H.toFixed(2)})⁴ · (π/8 - 8/9π)`
                }
                result={Ixx.toFixed(5)}
                unit="m⁴"
              />
            </div>
          </section>

          {/* 3. CENTRÓIDE E PRESSÃO NO CENTRÓIDE */}
          <section>
            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-6 h-px bg-blue-300"></div> 3. Centróide e Pressão Hidrostática <div className="flex-1 h-px bg-slate-100"></div>
            </h4>
            <div className="flex flex-col gap-0 bg-white shadow-sm p-6 rounded-2xl border border-slate-100">
              <CalculationLine
                theme="blue"
                label="Distância Inclinada da NA ao Centróide (Y_CG)"
                symbol={<>Y<sub>CG</sub></>}
                formula={
                  config?.comporta?.modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO
                    ? 'Informado diretamente'
                    : 'h_topo / sin(θ) + H/2'
                }
                substitution={
                  config?.comporta?.modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO
                    ? undefined
                    : `${(config?.comporta?.profundidadeTopo ?? 0).toFixed(2)} / sin(${gateInclination}°) + ${(H / 2).toFixed(2)}`
                }
                result={Y_CG.toFixed(3)}
                unit="m"
              />
              <CalculationLine
                theme="blue"
                label="Profundidade Vertical do Centróide (h_CG)"
                symbol={<>h<sub>CG</sub></>}
                formula={<>Y<sub>CG</sub> · sin(θ)</>}
                substitution={`${Y_CG.toFixed(3)} · sin(${gateInclination}°)`}
                result={h_cg.toFixed(3)}
                unit="m"
              />
              <CalculationLine
                theme="blue"
                label="Pressão no Centróide (p_CG)"
                symbol={<>p<sub>CG</sub></>}
                formula={<>γ · h<sub>CG</sub></>}
                substitution={`${gamma_val.toFixed(0)} · ${h_cg.toFixed(3)}`}
                result={p_cg_disp}
                unit={p_unit}
                isSubHeader
              />
            </div>
          </section>

          {/* 4. FORÇA RESULTANTE (EMPUXO) */}
          <section>
            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-6 h-px bg-indigo-300"></div> 4. Força Hidrostática Resultante (Empuxo F_R) <div className="flex-1 h-px bg-slate-100"></div>
            </h4>
            <div className="flex flex-col gap-0 bg-white shadow-sm p-6 rounded-2xl border border-slate-100">
              <CalculationLine
                theme="indigo"
                label="Força Resultante (F_R / E)"
                symbol={<>F<sub>R</sub></>}
                formula={<>p<sub>CG</sub> · A = γ · h<sub>CG</sub> · A</>}
                substitution={
                  isKgf
                    ? `${p_cg_disp} · ${area.toFixed(4)}`
                    : `${p_cg_disp} kPa · ${area.toFixed(4)} m²`
                }
                result={FR_disp}
                unit={force_unit}
                isSubHeader
              />
            </div>
          </section>

          {/* 5. CENTRO DE PRESSÃO (CP) */}
          <section>
            <h4 className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-6 h-px bg-cyan-300"></div> 5. Ponto de Aplicação e Centro de Pressão (CP) <div className="flex-1 h-px bg-slate-100"></div>
            </h4>
            <div className="flex flex-col gap-0 bg-white shadow-sm p-6 rounded-2xl border border-slate-100">
              <CalculationLine
                theme="cyan"
                label="Excentricidade do CP ao longo do plano (Δy)"
                symbol={<>Δy</>}
                formula={<>I<sub>xx</sub> / (A · Y<sub>CG</sub>)</>}
                substitution={`${Ixx.toFixed(5)} / (${area.toFixed(4)} · ${Y_CG.toFixed(3)})`}
                result={(delta_y * 100).toFixed(2)}
                unit="cm"
              />
              <CalculationLine
                theme="cyan"
                label="Distância Inclinada da NA ao CP (Y_CP)"
                symbol={<>Y<sub>CP</sub></>}
                formula={<>Y<sub>CG</sub> + Δy = Y<sub>CG</sub> + I<sub>xx</sub> / (A · Y<sub>CG</sub>)</>}
                substitution={`${Y_CG.toFixed(3)} + ${delta_y.toFixed(4)}`}
                result={Y_CP.toFixed(3)}
                unit="m"
                isSubHeader
              />
              <CalculationLine
                theme="cyan"
                label="Profundidade Vertical do CP (h_CP)"
                symbol={<>h<sub>CP</sub></>}
                formula={<>Y<sub>CP</sub> · sin(θ)</>}
                substitution={`${Y_CP.toFixed(3)} · sin(${gateInclination}°)`}
                result={h_cp.toFixed(3)}
                unit="m"
                isSubHeader
              />
            </div>
          </section>

          {/* 6. EQUILÍBRIO (SE HOUVER DOBRADIÇA OU TIRANTE) */}
          {(analyzedResults.equilibrium.M_hinge > 0 || analyzedResults.equilibrium.F_tie > 0) && (
            <section>
              <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-6 h-px bg-purple-200"></div> 6. Equilíbrio Estático de Momentos <div className="flex-1 h-px bg-slate-100"></div>
              </h4>
              <div className="flex flex-col gap-0 bg-white shadow-sm p-6 rounded-2xl border border-slate-100">
                {analyzedResults.equilibrium.M_hinge > 0 && (
                  <CalculationLine
                    theme="purple"
                    label="Momento no Apoio da Dobradiça"
                    symbol={<>M<sub>hinge</sub></>}
                    result={(analyzedResults.equilibrium.M_hinge / (isKgf ? g : 1000)).toFixed(2)}
                    unit={isKgf ? 'kgf·m' : 'kN·m'}
                  />
                )}
                {analyzedResults.equilibrium.F_tie > 0 && (
                  <CalculationLine
                    theme="purple"
                    label="Força Necessária no Tirante"
                    symbol={<>F<sub>tie</sub></>}
                    result={(analyzedResults.equilibrium.F_tie / (isKgf ? g : 1000)).toFixed(2)}
                    unit={isKgf ? 'kgf' : 'kN'}
                    isSubHeader
                  />
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
