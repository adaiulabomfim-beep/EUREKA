import React from 'react';
import {
  Construction,
  Calculator,
  RotateCw,
  MoveVertical,
  Maximize,
  AlertCircle,
  Droplets,
  MoveRight,
  ShieldCheck,
} from 'lucide-react';
import { ResultadoSimulacaoBarragem, SistemaUnidadesBarragem } from '../dominio/tipos';
import { ResultsPanel, ResultsCard } from '../../../../interface/PainelResultados';

interface PainelResultadosProps {
  analyzedResults: ResultadoSimulacaoBarragem | null;
  showDetails: boolean;
  setShowDetails: (val: boolean) => void;
  unitSystem?: SistemaUnidadesBarragem;
  gravity?: number;
  hasPercolation?: boolean;
  setHasPercolation?: (val: boolean) => void;
  showTriangularMode?: boolean;
}

export const PainelResultados: React.FC<PainelResultadosProps> = ({
  analyzedResults,
  showDetails,
  setShowDetails,
  unitSystem = 'SI',
  gravity = 9.81,
  hasPercolation = false,
  setHasPercolation,
  showTriangularMode = false,
}) => {
  const st = analyzedResults?.stabilityData;
  const fd = analyzedResults?.forceData;
  const apC = st?.analisePontoC;
  const isArch = !!st?.isArchDam;
  const isKgf = unitSystem === 'TECNICO_KGF';
  const bLong = st?.damWidth ?? analyzedResults?.normalizedInputs?.damWidth ?? 1;
  const is3DTotalMode = Boolean(showTriangularMode || bLong > 1.001 || hasPercolation);

  const formatForceVal = (valN: number, decimalsSI = 2, decimalsKgf = 1) =>
    isKgf ? (valN / gravity).toFixed(decimalsKgf) : (valN / 1000).toFixed(decimalsSI);

  const fmtBrNum = (val: number, dec = 2) =>
    val.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  const formatTotalForce = (valN: number) =>
    isKgf ? fmtBrNum(valN / gravity, 0) : fmtBrNum(valN / 1000, 1);

  const formatTotalMoment = (valNm: number) =>
    isKgf ? fmtBrNum(valNm / gravity, 0) : fmtBrNum(valNm / 1000, 1);

  const forceUnit = isKgf ? 'kgf/m' : 'kN/m';
  const totalForceUnit = isKgf ? 'kgf' : 'kN';
  const totalMomentUnit = isKgf ? 'kgf·m' : 'kN·m';

  const formatPressureVal = (valPa: number) =>
    isKgf ? (valPa / gravity).toFixed(0) : (valPa / 1000).toFixed(2);

  const pressureUnit = isKgf ? 'kgf/m²' : 'kPa';

  const hasDownWater = !!fd && fd.down && fd.down.FR > 1e-3;
  const mud = fd?.up?.mudLayer;

  return (
    <div id="tour-resultados" data-tour="painel-resultados" className="lg:col-span-3 flex flex-col gap-4 h-[600px] lg:h-full lg:max-h-full min-h-0 overflow-hidden">
      <ResultsPanel
        footerButton={{
          label: showDetails ? 'Ocultar Memorial' : 'Memorial',
          onClick: () => setShowDetails(!showDetails),
          icon: Calculator,
          disabled: !analyzedResults,
        }}
      >
        {is3DTotalMode && apC && fd && st ? (
          <>
            {/* Seletor rápido de condição na cena */}
            {setHasPercolation && (
              <div className="bg-slate-100/90 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setHasPercolation(false)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    !hasPercolation
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
                  }`}
                >
                  A. Sem Percolação
                </button>
                <button
                  type="button"
                  onClick={() => setHasPercolation(true)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    hasPercolation
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
                  }`}
                >
                  B. Com Percolação
                </button>
              </div>
            )}

            {/* BLOCO A: SEM PERCOLAÇÃO */}
            <div
              className={`rounded-2xl border p-3 space-y-2.5 transition-all ${
                !hasPercolation
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/70 shadow-sm'
                  : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-90'
              }`}
            >
              <div className="flex items-center justify-between border-b border-emerald-200/70 dark:border-emerald-800/50 pb-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
                  A. Condição Sem Percolação (U = 0)
                </span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 uppercase">
                  b = {apC.larguraLongitudinal.toFixed(0)} m
                </span>
              </div>

              <ResultsCard
                title="Força Hidrostática Resultante (AB)"
                value={formatTotalForce(apC.F_R_total)}
                unit={totalForceUnit}
                theme="blue"
                leftIcon={Droplets}
                secondaryValue={`FH = ${formatTotalForce(apC.F_H_total)} ${totalForceUnit} | FV = ${formatTotalForce(apC.F_V_total)} ${totalForceUnit} (${formatForceVal(fd.up.FR)} ${forceUnit})`}
              />

              <ResultsCard
                title="Centro de Pressão (Face AB)"
                value={`h_CP = ${fd.up.h_cp.toFixed(2).replace('.', ',')} m (hp)`}
                unit=""
                theme="cyan"
                leftIcon={MoveVertical}
                secondaryValue={`yp (Inclinado) = ${fd.up.s_cp.toFixed(2).replace('.', ',')} m | Dist. ao Fundo = ${fd.up.y_cp.toFixed(2).replace('.', ',')} m`}
              />

              <ResultsCard
                title="Momento Hidrostático em C (M_C)"
                value={formatTotalMoment(Math.abs(apC.M_hidro_C_total))}
                unit={totalMomentUnit}
                theme={apC.M_hidro_C_total > 0 ? 'amber' : 'green'}
                leftIcon={RotateCw}
                secondaryValue={`Sentido: ${
                  apC.M_hidro_C_total > 0 ? 'Horário (Tombante +)' : 'Anti-horário (Estabilizante)'
                } | d_⊥,C = ${apC.braco_FR_C.toFixed(3).replace('.', ',')} m`}
              />

              <ResultsCard
                title="Peso Próprio (W) e Momento em C"
                value={formatTotalForce(apC.W_total)}
                unit={totalForceUnit}
                theme="slate"
                leftIcon={Construction}
                secondaryValue={`M_W,C = ${formatTotalMoment(apC.M_W_C_total)} ${totalMomentUnit} (Anti-horário estabilizante | x_CG = ${st.x_cg.toFixed(1)} m)`}
              />

              <div className="p-2.5 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-[11px] leading-snug text-emerald-950 dark:text-emerald-100">
                <div className="font-black uppercase text-[10px] text-emerald-800 dark:text-emerald-300 mb-0.5">
                  Avaliação de Tombamento (Sem Percolação):
                </div>
                <div>
                  <strong>Não pode tombar a barragem.</strong> A componente vertical <span className="font-bold">FV</span> sobre a face inclinada AB gera momento anti-horário estabilizante em C que reduz drasticamente o momento líquido de <span className="font-bold">FR</span> ({formatTotalMoment(Math.abs(apC.M_hidro_C_total))} {totalMomentUnit} ≪ M_W,C = {formatTotalMoment(apC.M_W_C_total)} {totalMomentUnit}, FS_tomb = {apC.fs_tomb_sem_percolacao.toFixed(2).replace('.', ',')}).
                </div>
              </div>
            </div>

            {/* BLOCO B: COM PERCOLAÇÃO SOB A FUNDAÇÃO */}
            <div
              className={`rounded-2xl border p-3 space-y-2.5 transition-all ${
                hasPercolation
                  ? 'bg-purple-50/60 dark:bg-purple-950/25 border-purple-400 dark:border-purple-700 shadow-sm'
                  : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-90'
              }`}
            >
              <div className="flex items-center justify-between border-b border-purple-200/70 dark:border-purple-800/50 pb-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-800 dark:text-purple-300">
                  B. Condição Com Percolação (Subpressão U)
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">
                  Hipótese Triangular
                </span>
              </div>

              <ResultsCard
                title="Força de Subpressão na Base (U)"
                value={formatTotalForce(apC.subpressao.U_total)}
                unit={totalForceUnit}
                theme="amber"
                leftIcon={AlertCircle}
                secondaryValue={`p_B = ${formatPressureVal(apC.subpressao.p_B)} ${pressureUnit} → p_C = ${formatPressureVal(apC.subpressao.p_C)} ${pressureUnit} | Braço B/3 = ${apC.subpressao.x_U.toFixed(1).replace('.', ',')} m`}
              />

              <ResultsCard
                title="Momento de Subpressão em C (M_U,C)"
                value={formatTotalMoment(apC.subpressao.M_U_ref_total)}
                unit={totalMomentUnit}
                theme="red"
                leftIcon={RotateCw}
                secondaryValue={`Braço 20 m (B/3): ${formatTotalMoment(apC.subpressao.M_U_ref_total)} ${totalMomentUnit} | Dist. 40 m (2B/3 a C): ${formatTotalMoment(apC.subpressao.M_U_C_total)} ${totalMomentUnit}`}
              />

              <ResultsCard
                title="Momento Total Hidrostático + Subpressão"
                value={formatTotalMoment(Math.abs(apC.M_hidro_C_total) + apC.subpressao.M_U_ref_total)}
                unit={totalMomentUnit}
                theme={apC.estavel_com_percolacao ? 'green' : 'red'}
                leftIcon={ShieldCheck}
                secondaryValue={`Estab. M_W,C = ${formatTotalMoment(apC.M_W_C_total)} ${totalMomentUnit} | FS_tomb = ${apC.fs_tomb_com_percolacao.toFixed(2).replace('.', ',')}`}
              />

              <div className="p-2.5 rounded-xl bg-purple-100/70 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800 text-[10.5px] leading-snug text-purple-950 dark:text-purple-100">
                <strong>Nota sobre hipótese adotada:</strong> A distribuição triangular sob a base BC (<span className="font-mono">p_B = γ·h</span> até <span className="font-mono">p_C = 0</span>) é uma hipótese clássica de engenharia adotada para avaliar a percolação (não fornecida no enunciado). Com braço de <strong>{apC.subpressao.x_U.toFixed(0)} m</strong>, <span className="font-mono">M_U = {formatTotalMoment(apC.subpressao.M_U_ref_total)} {totalMomentUnit}</span> (ou <strong>{formatTotalMoment(apC.subpressao.M_U_C_total)} {totalMomentUnit}</strong> medido a {apC.subpressao.braco_U_C.toFixed(0)} m de C), e a barragem permanece estável (<span className="font-mono">M_W,C = {formatTotalMoment(apC.M_W_C_total)} {totalMomentUnit}</span>).
              </div>
            </div>
          </>
        ) : (
          <>
            <ResultsCard
              title={hasDownWater ? 'Resultante Líquida (Net)' : 'Força Hidrostática Resultante'}
              value={fd ? formatForceVal(Math.abs(fd.FR_net)) : '???'}
              unit={fd ? forceUnit : ''}
              theme="blue"
              leftIcon={Droplets}
              secondaryValue={
                fd
                  ? mud
                    ? `P' (água) = ${formatForceVal(mud.F_water)} | P'' (lama) = ${formatForceVal(mud.F_mud)} ${forceUnit}`
                    : `FH = ${formatForceVal(fd.FH_net, 1, 0)} | FV = ${formatForceVal(fd.FV_net, 1, 0)} ${forceUnit}`
                  : undefined
              }
            />

            {hasDownWater && fd && (
              <ResultsCard
                title="Empuxos Individuais (Faces)"
                value={formatForceVal(fd.up.FR)}
                unit={forceUnit}
                theme="cyan"
                leftIcon={Droplets}
                secondaryValue={`Montante: ${formatForceVal(fd.up.FR)} | Jusante: ${formatForceVal(fd.down.FR)} ${forceUnit}`}
              />
            )}

            <ResultsCard
              title="Centro de Pressão (CP)"
              value={fd ? `${fd.up.h_cp.toFixed(2)} m` : '?'}
              unit="hp"
              theme="cyan"
              leftIcon={MoveVertical}
              secondaryValue={
                fd
                  ? hasDownWater
                    ? `Mont: yp=${fd.up.s_cp.toFixed(2)}m, hp=${fd.up.h_cp.toFixed(2)}m (Fundo: ${fd.up.y_cp.toFixed(2)}m) | Jus: yp=${fd.down.s_cp.toFixed(2)}m`
                    : mud
                    ? `P' a ${mud.y_cp_water.toFixed(2)}m | P'' a ${mud.y_cp_mud.toFixed(2)}m`
                    : `yp (inclinado) = ${fd.up.s_cp.toFixed(2)}m | Dist. ao Fundo = ${fd.up.y_cp.toFixed(2)}m`
                  : undefined
              }
            />

            <ResultsCard
              title="Pressão Máxima (Pé)"
              value={fd ? formatPressureVal(fd.p_max_up) : '?'}
              unit={fd ? pressureUnit : ''}
              theme="blue"
              leftIcon={AlertCircle}
              secondaryValue={
                mud
                  ? `Interface = ${formatPressureVal(mud.p_interface)} ${pressureUnit}`
                  : undefined
              }
            />

            <ResultsCard
              title="Área Molhada (Montante)"
              value={fd ? (fd.up?.area?.toFixed(2) || '0.00') : '?'}
              unit={fd ? 'm²/m' : ''}
              theme="slate"
              leftIcon={Maximize}
            />

            <ResultsCard
              title="Peso Próprio"
              value={st ? formatForceVal(st.weight) : '???'}
              unit={st ? forceUnit : ''}
              theme="slate"
              leftIcon={Construction}
            />

            {isArch ? (
              <>
                <ResultsCard
                  title="Esforço no Arco (p·R)"
                  value={st?.archThrust !== undefined ? formatForceVal(st.archThrust, 1, 0) : '?'}
                  unit={st ? forceUnit : ''}
                  theme="blue"
                  leftIcon={ShieldCheck}
                  secondaryValue={
                    st?.archStressBase !== undefined
                      ? `σ base ≈ ${(st.archStressBase / 1e6).toFixed(2)} MPa`
                      : undefined
                  }
                />
                <ResultsCard
                  title="Estabilidade por Gravidade"
                  value="N/A"
                  unit=""
                  theme="slate"
                  leftIcon={RotateCw}
                  secondaryValue="Resistência por efeito de arco às ombreiras"
                />
              </>
            ) : (
              <>
                <ResultsCard
                  title="FS Tombamento"
                  value={st ? st.fs_tomb.toFixed(2) : '?'}
                  unit=""
                  theme={st ? (st.fs_tomb >= 2 ? "green" : st.fs_tomb >= 1.5 ? "amber" : "red") : "slate"}
                  leftIcon={RotateCw}
                />

                <ResultsCard
                  title="FS Deslizamento"
                  value={st ? st.fs_desl.toFixed(2) : '?'}
                  unit=""
                  theme={st ? (st.fs_desl >= 1.5 ? "green" : st.fs_desl >= 1.0 ? "amber" : "red") : "slate"}
                  leftIcon={MoveRight}
                />
              </>
            )}
          </>
        )}
      </ResultsPanel>
    </div>
  );
};
