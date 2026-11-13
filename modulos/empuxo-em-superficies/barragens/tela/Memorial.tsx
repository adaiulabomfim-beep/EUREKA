import React from 'react';
import { FileText, BookOpen, Info } from 'lucide-react';
import { ResultadoSimulacaoBarragem, SistemaUnidadesBarragem } from '../dominio/tipos';

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
    slate: {
      text: 'text-slate-600 dark:text-slate-300',
      bg: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100',
      border: 'border-slate-100 dark:border-slate-800',
      subBg: 'bg-slate-700 dark:bg-slate-700 text-white',
      unitText: 'text-slate-500 dark:text-slate-400',
      unitSub: 'text-slate-200',
      subHeaderWrap: 'bg-slate-50/80 dark:bg-slate-800/60',
    },
    blue: {
      text: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200',
      border: 'border-blue-50 dark:border-slate-800',
      subBg: 'bg-blue-600 dark:bg-blue-600 text-white',
      unitText: 'text-blue-500 dark:text-blue-400',
      unitSub: 'text-blue-200',
      subHeaderWrap: 'bg-blue-50/50 dark:bg-blue-950/40',
    },
    cyan: {
      text: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-200',
      border: 'border-cyan-50 dark:border-slate-800',
      subBg: 'bg-cyan-600 dark:bg-cyan-600 text-white',
      unitText: 'text-cyan-500 dark:text-cyan-400',
      unitSub: 'text-cyan-200',
      subHeaderWrap: 'bg-cyan-50/50 dark:bg-cyan-950/40',
    },
    emerald: {
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200',
      border: 'border-emerald-50 dark:border-slate-800',
      subBg: 'bg-emerald-600 dark:bg-emerald-600 text-white',
      unitText: 'text-emerald-500 dark:text-emerald-400',
      unitSub: 'text-emerald-200',
      subHeaderWrap: 'bg-emerald-50/50 dark:bg-emerald-950/40',
    },
    amber: {
      text: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200',
      border: 'border-amber-50 dark:border-slate-800',
      subBg: 'bg-amber-500 dark:bg-amber-600 text-white',
      unitText: 'text-amber-500 dark:text-amber-400',
      unitSub: 'text-amber-100',
      subHeaderWrap: 'bg-amber-50/50 dark:bg-amber-950/40',
    },
    red: {
      text: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-200',
      border: 'border-red-50 dark:border-slate-800',
      subBg: 'bg-red-600 dark:bg-red-600 text-white',
      unitText: 'text-red-500 dark:text-red-400',
      unitSub: 'text-red-200',
      subHeaderWrap: 'bg-red-50/50 dark:bg-red-950/40',
    },
    purple: {
      text: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200',
      border: 'border-purple-50 dark:border-slate-800',
      subBg: 'bg-purple-600 dark:bg-purple-600 text-white',
      unitText: 'text-purple-500 dark:text-purple-400',
      unitSub: 'text-purple-200',
      subHeaderWrap: 'bg-purple-50/50 dark:bg-purple-950/40',
    },
    indigo: {
      text: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200',
      border: 'border-indigo-50 dark:border-slate-800',
      subBg: 'bg-indigo-600 dark:bg-indigo-600 text-white',
      unitText: 'text-indigo-500 dark:text-indigo-400',
      unitSub: 'text-indigo-200',
      subHeaderWrap: 'bg-indigo-50/50 dark:bg-indigo-950/40',
    },
  }[theme];

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-baseline justify-between py-3 border-b ${t.border} last:border-0 ${
        isSubHeader
          ? `${t.subHeaderWrap} -mx-6 px-6 font-bold text-slate-800 dark:text-slate-100 mt-4 mb-2 py-4 shadow-sm rounded-xl`
          : ''
      }`}
    >
      <div
        className={`font-bold uppercase tracking-widest ${
          isSubHeader ? 'text-sm text-slate-700 dark:text-slate-200' : 'text-xs text-slate-500 dark:text-slate-400'
        }`}
      >
        {label}
      </div>
      <div className="flex flex-wrap items-center gap-2.5 text-[13px] sm:text-sm font-mono text-slate-700 dark:text-slate-300 mt-2 sm:mt-0">
        <span className={`font-bold ${t.text}`}>{parseSub(symbol)}</span>
        {formula && <span className="text-slate-400 dark:text-slate-500 hidden lg:inline">= {parseSub(formula)}</span>}
        {substitution && <span className="text-slate-500 dark:text-slate-400">= {parseSub(substitution)}</span>}
        <span className={`font-bold px-3 py-1.5 rounded-lg ml-auto ${isSubHeader ? t.subBg : t.bg}`}>
          = {result}{' '}
          {unit && (
            <span className={`text-[11px] font-sans ml-1 font-semibold ${isSubHeader ? t.unitSub : t.unitText}`}>
              {unit}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

interface MemorialProps {
  showDetails: boolean;
  setShowDetails: (val: boolean) => void;
  analyzedResults: ResultadoSimulacaoBarragem | null;
  density: number;
  gravity: number;
  unitSystem?: SistemaUnidadesBarragem;
  enunciado?: string;
}

export const Memorial: React.FC<MemorialProps> = ({
  showDetails,
  setShowDetails,
  analyzedResults,
  density,
  gravity,
  unitSystem = 'SI',
  enunciado,
}) => {
  if (!showDetails || !analyzedResults) return null;

  const isKgf = unitSystem === 'TECNICO_KGF';
  const fmtF = (valN: number) => (isKgf ? (valN / gravity).toFixed(1) : (valN / 1000).toFixed(2));
  const unitF = isKgf ? 'kgf/m' : 'kN/m';
  const fmtP = (valPa: number) => (isKgf ? (valPa / gravity).toFixed(0) : (valPa / 1000).toFixed(2));
  const unitP = isKgf ? 'kgf/m²' : 'kPa';
  const gammaUnitVal = isKgf ? density.toFixed(0) : (density * gravity).toFixed(0);
  const gammaUnit = isKgf ? 'kgf/m³' : 'N/m³';

  const st = analyzedResults.stabilityData;
  const fd = analyzedResults.forceData;
  const mu = st?.mu ?? 0.7;
  const gammaMat = st?.gammaMaterial ?? 24000;
  const thetaUp = fd.thetaUp ?? analyzedResults.normalizedInputs.inclinationAngle;
  const thetaDown = fd.thetaDown ?? analyzedResults.normalizedInputs.downstreamAngle ?? thetaUp;

  const hUp = analyzedResults.normalizedInputs.upstreamLevel;
  const hDown = analyzedResults.normalizedInputs.downstreamLevel;

  const frUp = fd.up?.FR ?? 0;
  const fhUp = fd.up?.FH ?? 0;
  const fvUp = fd.up?.FV ?? 0;
  const frDown = fd.down?.FR ?? 0;
  const fhDown = fd.down?.FH ?? 0;
  const fvDown = fd.down?.FV ?? 0;
  const mud = fd.up?.mudLayer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl w-[95vw] lg:w-[75vw] h-[95vh] lg:h-[75vh] rounded-3xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 relative">
        <div className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-blue-50 dark:border-slate-800 p-6 flex items-center justify-between z-10">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tight">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
              <FileText className="w-5 h-5" />
            </div>
            Memorial de Cálculo
          </h3>
          <button
            onClick={() => setShowDetails(false)}
            className="text-[10px] font-black text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all uppercase tracking-widest"
          >
            Fechar
          </button>
        </div>

        <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-950/60">
          {enunciado && (
            <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-2xl p-5 flex items-start gap-3.5">
              <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">
                  Enunciado do Problema
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {enunciado}
                </p>
              </div>
            </div>
          )}

          {/* Hipóteses Adotadas */}
          <div className="bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                Hipóteses do Modelo
              </p>
              <p>
                Análise por metro linear de barragem (1 m), γ_água = {(density * gravity).toFixed(0)} N/m³, γ_mat ={' '}
                {(gammaMat / 1000).toFixed(1)} kN/m³, atrito μ = {mu.toFixed(2)},{' '}
                {st?.upliftAssumption ?? 'subpressão desconsiderada (U = 0)'}.
                {analyzedResults.damType === 'CONTRAFORTE' && ' Contrafortes considerados com 20% da largura do vão (5×4%).'}
              </p>
            </div>
          </div>

          <section>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-6 h-px bg-slate-200 dark:bg-slate-700"></div> Geometria & Massa{' '}
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
            </h4>
            <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              <CalculationLine
                theme="slate"
                label="Peso Específico da Água"
                symbol="γ"
                formula="ρ · g"
                substitution={`${density} · ${gravity}`}
                result={(density * gravity).toFixed(0)}
                unit="N/m³"
              />
              {st && (
                <>
                  <CalculationLine
                    theme="slate"
                    label="Área Efetiva da Seção"
                    symbol="A_seção"
                    result={st.area.toFixed(2)}
                    unit="m²/m"
                  />
                  <CalculationLine
                    theme="slate"
                    label="Peso Próprio da Barragem"
                    symbol="W"
                    formula="A_seção · γ_mat"
                    substitution={`${st.area.toFixed(2)} · ${(gammaMat / 1000).toFixed(1)}`}
                    result={(st.weight / 1000).toFixed(2)}
                    unit="kN/m"
                  />
                </>
              )}
            </div>
          </section>

          <section>
            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-6 h-px bg-blue-200 dark:bg-blue-900"></div> Forças Hidrostáticas{' '}
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
            </h4>
            <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              <CalculationLine theme="blue" isSubHeader label={`Montante (θ = ${thetaUp.toFixed(1)}°)`} symbol="Upstream" result="" unit="" />
              {mud ? (
                <>
                  <CalculationLine
                    theme="blue"
                    label="Camada de Água (Topo)"
                    symbol="h_água"
                    formula="H_up - h_lama"
                    substitution={`${hUp.toFixed(2)} - ${mud.mudHeight.toFixed(2)}`}
                    result={mud.waterHeight.toFixed(2)}
                    unit="m"
                  />
                  <CalculationLine
                    theme="blue"
                    label="Empuxo na Camada de Água (P')"
                    symbol="P'"
                    formula="½ · γ_água · h_água² / sen(θ)"
                    substitution={`0.5 · ${gammaUnitVal} · ${mud.waterHeight.toFixed(2)}² / sen(${thetaUp.toFixed(1)}°)`}
                    result={fmtF(mud.F_water)}
                    unit={unitF}
                  />
                  <CalculationLine
                    theme="blue"
                    label="Centro de Pressão de P' (C' do fundo)"
                    symbol="y_C'"
                    formula="h_lama + h_água / 3"
                    substitution={`${mud.mudHeight.toFixed(2)} + ${(mud.waterHeight / 3).toFixed(2)}`}
                    result={mud.y_cp_water.toFixed(2)}
                    unit="m"
                  />
                  <CalculationLine
                    theme="amber"
                    label={`Pressão na Interface (y = ${mud.mudHeight.toFixed(2)} m)`}
                    symbol="p_int"
                    formula="γ_água · h_água"
                    substitution={`${gammaUnitVal} · ${mud.waterHeight.toFixed(2)}`}
                    result={fmtP(mud.p_interface)}
                    unit={unitP}
                  />
                  <CalculationLine
                    theme="amber"
                    label="Parcela Retangular na Lama"
                    symbol="P''_ret"
                    formula="p_int · (h_lama / sen(θ))"
                    result={fmtF(mud.F_mud_rect)}
                    unit={unitF}
                  />
                  <CalculationLine
                    theme="amber"
                    label={`Parcela Triangular na Lama (ρ = ${mud.mudDensity} kg/m³)`}
                    symbol="P''_tri"
                    formula="½ · γ_lama · h_lama² / sen(θ)"
                    result={fmtF(mud.F_mud_tri)}
                    unit={unitF}
                  />
                  <CalculationLine
                    theme="amber"
                    label="Empuxo na Camada de Lama (P'')"
                    symbol="P''"
                    formula="P''_ret + P''_tri"
                    substitution={`${fmtF(mud.F_mud_rect)} + ${fmtF(mud.F_mud_tri)}`}
                    result={fmtF(mud.F_mud)}
                    unit={unitF}
                  />
                  <CalculationLine
                    theme="amber"
                    label="Centro de Pressão de P'' (C'' do fundo)"
                    symbol="y_C''"
                    result={mud.y_cp_mud.toFixed(2)}
                    unit="m"
                  />
                  <CalculationLine
                    theme="blue"
                    label="Empuxo Total a Montante (P = P' + P'')"
                    symbol="FR_up"
                    formula="P' + P''"
                    substitution={`${fmtF(mud.F_water)} + ${fmtF(mud.F_mud)}`}
                    result={fmtF(frUp)}
                    unit={unitF}
                  />
                  <CalculationLine
                    theme="blue"
                    label="Centro de Pressão Total (do fundo)"
                    symbol="y_cp_up"
                    formula="(P'·y_C' + P''·y_C'') / FR_up"
                    result={(fd.up?.y_cp ?? 0).toFixed(2)}
                    unit="m"
                  />
                </>
              ) : (
                <>
                  <CalculationLine
                    theme="blue"
                    label="Área Molhada (Montante)"
                    symbol="A_up"
                    formula="h_up / sen(θ)"
                    substitution={`${hUp.toFixed(2)} / sen(${thetaUp.toFixed(1)}°)`}
                    result={(fd.up?.area ?? 0).toFixed(2)}
                    unit="m²/m"
                  />
                  <CalculationLine
                    theme="blue"
                    label="Prof. Centro de Gravidade"
                    symbol="h_cg_up"
                    formula="h_up / 2"
                    substitution={`${hUp.toFixed(2)} / 2`}
                    result={(fd.up?.h_cg ?? 0).toFixed(2)}
                    unit="m"
                  />
                  <CalculationLine
                    theme="blue"
                    label="Força Normal à Face (Montante)"
                    symbol="FR_up"
                    formula="γ · h_cg_up · A_up"
                    substitution={`${gammaUnitVal} · ${(fd.up?.h_cg ?? 0).toFixed(2)} · ${(fd.up?.area ?? 0).toFixed(2)}`}
                    result={fmtF(frUp)}
                    unit={unitF}
                  />
                  <CalculationLine
                    theme="blue"
                    label="Componente Horizontal (Montante)"
                    symbol="FH_up"
                    formula="FR_up · sen(θ)"
                    substitution={`${fmtF(frUp)} · sen(${thetaUp.toFixed(1)}°)`}
                    result={fmtF(fhUp)}
                    unit={unitF}
                  />
                  <CalculationLine
                    theme="blue"
                    label="Componente Vertical (Montante)"
                    symbol="FV_up"
                    formula="FR_up · cos(θ)"
                    substitution={`${fmtF(frUp)} · cos(${thetaUp.toFixed(1)}°)`}
                    result={fmtF(fvUp)}
                    unit={unitF}
                  />
                  <CalculationLine
                    theme="blue"
                    label="Centro de Pressão (do fundo / da superfície)"
                    symbol="y_cp_up"
                    formula="h_up / 3 (h_cp = 2·h_up/3)"
                    substitution={`${hUp.toFixed(2)} / 3 (h_cp = ${(fd.up?.h_cp ?? 0).toFixed(2)} m)`}
                    result={(fd.up?.y_cp ?? 0).toFixed(2)}
                    unit="m"
                  />
                </>
              )}

              {hDown > 0 && fd.down && (
                <>
                  <div className="mt-4 pt-2"></div>
                  <CalculationLine theme="indigo" isSubHeader label={`Jusante (θ_jus = ${thetaDown.toFixed(1)}° | ${(90 - thetaDown).toFixed(1)}° c/ vertical)`} symbol="Downstream" result="" unit="" />
                  <CalculationLine
                    theme="indigo"
                    label="Área / Comprimento Molhado (Jusante)"
                    symbol="A_down"
                    formula="h_down / sen(θ_jus)"
                    substitution={`${hDown.toFixed(2)} / sen(${thetaDown.toFixed(1)}°)`}
                    result={(fd.down.area ?? 0).toFixed(2)}
                    unit="m²/m"
                  />
                  <CalculationLine
                    theme="indigo"
                    label="Força Normal à Face (Jusante)"
                    symbol="FR_down"
                    formula="γ · h_cg_down · A_down"
                    substitution={`${gammaUnitVal} · ${(fd.down.h_cg ?? 0).toFixed(2)} · ${(fd.down.area ?? 0).toFixed(2)}`}
                    result={fmtF(frDown)}
                    unit={unitF}
                  />
                  <CalculationLine
                    theme="indigo"
                    label="Componente Horizontal (Jusante)"
                    symbol="FH_down"
                    formula="FR_down · sen(θ_jus)"
                    result={fmtF(fhDown)}
                    unit={unitF}
                  />
                  <CalculationLine
                    theme="indigo"
                    label="Componente Vertical (Jusante)"
                    symbol="FV_down"
                    formula="FR_down · cos(θ_jus)"
                    result={fmtF(fvDown)}
                    unit={unitF}
                  />
                  <CalculationLine
                    theme="indigo"
                    label="Centro de Pressão ao Longo da Face (da sup.)"
                    symbol="s_cp_down"
                    formula="⅔ · L_molhado"
                    substitution={`⅔ · ${(fd.down.wetLength ?? 0).toFixed(2)}`}
                    result={(fd.down.s_cp ?? 0).toFixed(2)}
                    unit="m"
                  />
                  <CalculationLine
                    theme="indigo"
                    label="Altura Vertical do CP (Jusante, do fundo)"
                    symbol="y_cp_down"
                    formula="h_down / 3"
                    substitution={`${hDown.toFixed(2)} / 3`}
                    result={(fd.down.y_cp ?? 0).toFixed(2)}
                    unit="m"
                  />
                </>
              )}
            </div>
          </section>

          <section>
            <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-6 h-px bg-cyan-200 dark:bg-cyan-900"></div> Força Líquida Resultante{' '}
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
            </h4>
            <div className="bg-cyan-50/30 dark:bg-cyan-950/20 p-6 rounded-2xl border border-cyan-100/50 dark:border-cyan-900/40 space-y-1">
              <CalculationLine
                theme="cyan"
                label="Resultante Horizontal Líquida"
                symbol="FH_net"
                formula="FH_up - FH_down"
                substitution={`${fmtF(fhUp)} - ${fmtF(fhDown)}`}
                result={fmtF(fd.FH_net)}
                unit={unitF}
              />
              <CalculationLine
                theme="cyan"
                label="Resultante Vertical (Água sobre faces)"
                symbol="FV_net"
                formula="FV_up + FV_down"
                substitution={`${fmtF(fvUp)} + ${fmtF(fvDown)}`}
                result={fmtF(fd.FV_net)}
                unit={unitF}
              />
              <CalculationLine
                theme="cyan"
                label="Módulo da Resultante Vetorial"
                symbol="FR_net"
                formula="√(FH_net² + FV_net²)"
                substitution={`√(${fmtF(fd.FH_net)}² + ${fmtF(fd.FV_net)}²)`}
                result={fmtF(Math.abs(fd.FR_net))}
                unit={unitF}
                isSubHeader
              />
              <CalculationLine
                theme="cyan"
                label="Altura do CP Horizontal Líquido"
                symbol="y_cp_net"
                formula="ΣM_H / FH_net"
                substitution={`${(fd.moment_total / 1000).toFixed(2)} / ${(fd.FH_net / 1000).toFixed(2)}`}
                result={fd.y_cp_net.toFixed(2)}
                unit="m"
              />
            </div>
          </section>

          {st && (
            <section>
              <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <div className="w-6 h-px bg-emerald-200 dark:bg-emerald-900"></div> Análise de Estabilidade{' '}
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
              </h4>

              {st.isArchDam ? (
                <div className="bg-blue-50/40 dark:bg-blue-950/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-2">
                  <CalculationLine
                    theme="blue"
                    isSubHeader
                    label="Efeito de Arco (Transmissão às Ombreiras)"
                    symbol="N_arco"
                    formula="p_max · R"
                    substitution={`${(fd.p_max_up / 1000).toFixed(2)} · ${(analyzedResults.normalizedInputs.archRadius ?? 30).toFixed(1)}`}
                    result={((st.archThrust ?? 0) / 1000).toFixed(2)}
                    unit="kN/m"
                  />
                  <CalculationLine
                    theme="blue"
                    label="Tensão Média de Compressão na Base"
                    symbol="σ_arco"
                    formula="N_arco / B_base"
                    substitution={`${((st.archThrust ?? 0) / 1000).toFixed(2)} / ${st.actualBaseWidth.toFixed(2)}`}
                    result={((st.archStressBase ?? 0) / 1e6).toFixed(2)}
                    unit="MPa"
                  />
                  <p className="text-xs text-slate-600 dark:text-slate-300 pt-2">
                    Em barragens em arco, a estabilidade não depende apenas do peso próprio da seção 2D; o carregamento hidrostático é transferido por compressão em arco para as ombreiras rochosas do vale.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/40">
                    <CalculationLine theme="emerald" isSubHeader label="Tombamento (Pé de Jusante)" symbol="Overturning" result="" unit="" />
                    <CalculationLine
                      theme="emerald"
                      label="Braço Real do Peso"
                      symbol="b_W"
                      formula="B - x_cg"
                      substitution={`${st.actualBaseWidth.toFixed(2)} - ${st.x_cg.toFixed(2)}`}
                      result={st.lever_arm_weight.toFixed(2)}
                      unit="m"
                    />
                    <CalculationLine
                      theme="emerald"
                      label="Momento Estabilizante (W + FV)"
                      symbol="M_est"
                      formula="W·b_W + Σ(FV·b_V)"
                      substitution={`${((st.weight * st.lever_arm_weight) / 1000).toFixed(1)} + ${(st.moment_resisting_water_v / 1000).toFixed(1)}`}
                      result={(st.moment_resisting / 1000).toFixed(2)}
                      unit="kN·m/m"
                    />
                    <CalculationLine
                      theme="emerald"
                      label="Momento Tombador"
                      symbol="M_tomb"
                      formula="|FH_net| · y_cp_net"
                      substitution={`${(Math.abs(fd.FH_net) / 1000).toFixed(2)} · ${fd.y_cp_net.toFixed(2)}`}
                      result={(st.moment_overturning / 1000).toFixed(2)}
                      unit="kN·m/m"
                    />
                    <CalculationLine
                      theme="emerald"
                      label="Fator de Segurança (Tomb.)"
                      symbol="FS_tomb"
                      formula="M_est / M_tomb"
                      substitution={`${(st.moment_resisting / 1000).toFixed(2)} / ${(st.moment_overturning / 1000).toFixed(2)}`}
                      result={st.fs_tomb.toFixed(2)}
                      unit=""
                      isSubHeader
                    />
                  </div>

                  <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/40">
                    <CalculationLine theme="emerald" isSubHeader label="Deslizamento" symbol="Sliding" result="" unit="" />
                    <CalculationLine theme="emerald" label="Coeficiente de Atrito" symbol="μ" result={mu.toFixed(2)} unit="" />
                    <CalculationLine
                      theme="emerald"
                      label="Resultante Vertical Total"
                      symbol="ΣV"
                      formula="W + FV_net"
                      substitution={`${(st.weight / 1000).toFixed(2)} + ${(fd.FV_net / 1000).toFixed(2)}`}
                      result={(st.total_vertical_force / 1000).toFixed(2)}
                      unit="kN/m"
                    />
                    <CalculationLine
                      theme="emerald"
                      label="Força Resistente"
                      symbol="F_res"
                      formula="μ · ΣV"
                      substitution={`${mu.toFixed(2)} · ${(st.total_vertical_force / 1000).toFixed(2)}`}
                      result={((st.total_vertical_force * mu) / 1000).toFixed(2)}
                      unit="kN/m"
                    />
                    <CalculationLine
                      theme="emerald"
                      label="Fator de Segurança (Desl.)"
                      symbol="FS_desl"
                      formula="F_res / |FH_net|"
                      substitution={`${((st.total_vertical_force * mu) / 1000).toFixed(2)} / ${(Math.abs(fd.FH_net) / 1000).toFixed(2)}`}
                      result={st.fs_desl.toFixed(2)}
                      unit=""
                      isSubHeader
                    />
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
