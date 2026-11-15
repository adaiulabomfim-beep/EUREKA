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
                  Valores Totais na Largura (b = {apC.larguraLongitudinal.toFixed(2).replace('.', ',')} m)
                </span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 uppercase">
                  Total ({apC.larguraLongitudinal.toFixed(0)} m)
                </span>
              </div>

              <div className="rounded-xl border-y border-r border-l-[4px] border-slate-100 dark:border-slate-800 border-l-slate-400 bg-white dark:bg-slate-900/90 py-2.5 px-3 shadow-sm">
                <div className="text-[9.5px] font-bold uppercase tracking-tight text-slate-400">
                  Área Molhada (AB) e Centroide
                </div>
                <div className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  A_AB = {fmtBrNum(apC.areaMolhadaTotal, 2)} m² | h_CG = {fmtBrNum(fd.up.h_cg, 2)} m
                </div>
                <div className="text-[10px] mt-0.5 text-blue-600 dark:text-blue-400 font-medium">
                  L_AB = {fmtBrNum(apC.L_AB, 2)} m | θ = {fd.thetaUp.toFixed(2).replace('.', ',')}°
                </div>
              </div>

              <div className="rounded-xl border-y border-r border-l-[4px] border-slate-100 dark:border-slate-800 border-l-blue-600 bg-white dark:bg-slate-900/90 py-2.5 px-3 shadow-sm">
                <div className="text-[9.5px] font-bold uppercase tracking-tight text-blue-600 dark:text-blue-400">
                  Força Hidrostática Total sobre AB (b = {apC.larguraLongitudinal.toFixed(0)} m)
                </div>
                <div className="text-[15px] font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  F_R = {isKgf ? fmtBrNum(apC.F_R_total / gravity, 0) : fmtBrNum(apC.F_R_total, 0)} {isKgf ? 'kgf' : 'N'}
                </div>
                <div className="text-[10px] mt-0.5 text-blue-600 dark:text-blue-400 font-medium">
                  ({formatTotalForce(apC.F_R_total)} {totalForceUnit} — perpendicular ao paramento AB)
                </div>
              </div>

              <div className="rounded-xl border-y border-r border-l-[4px] border-slate-100 dark:border-slate-800 border-l-blue-500 bg-white dark:bg-slate-900/90 py-2.5 px-3 shadow-sm">
                <div className="text-[9.5px] font-bold uppercase tracking-tight text-blue-600 dark:text-blue-400">
                  Componentes da Força (b = {apC.larguraLongitudinal.toFixed(0)} m)
                </div>
                <div className="text-xs font-black text-slate-800 dark:text-slate-100 mt-0.5 space-y-0.5">
                  <div>F_H = {isKgf ? fmtBrNum(apC.F_H_total / gravity, 0) : fmtBrNum(apC.F_H_total, 0)} {isKgf ? 'kgf' : 'N'} (horizontal →)</div>
                  <div>F_V = {isKgf ? fmtBrNum(apC.F_V_total / gravity, 0) : fmtBrNum(apC.F_V_total, 0)} {isKgf ? 'kgf' : 'N'} (vertical ↓)</div>
                </div>
                <div className="text-[10px] mt-0.5 text-blue-600 dark:text-blue-400 font-medium">
                  A componente vertical F_V atua para baixo sobre a barragem
                </div>
              </div>

              <div className="rounded-xl border-y border-r border-l-[4px] border-slate-100 dark:border-slate-800 border-l-cyan-500 bg-white dark:bg-slate-900/90 py-2.5 px-3 shadow-sm">
                <div className="text-[9.5px] font-bold uppercase tracking-tight text-cyan-600 dark:text-cyan-400">
                  Centro de Pressão (CP sobre AB)
                </div>
                <div className="text-xs font-black text-slate-800 dark:text-slate-100 mt-0.5 space-y-0.5">
                  <div>• Ao longo de AB (a partir de A): {fmtBrNum(fd.up.s_cp, 2)} m</div>
                  <div>• Profundidade vertical (abaixo da sup.): {fmtBrNum(fd.up.h_cp, 2)} m</div>
                  <div>• Altura vertical acima da base: {fmtBrNum(fd.up.y_cp, 2)} m</div>
                </div>
              </div>

              <div className="rounded-xl border-y border-r border-l-[4px] border-slate-100 dark:border-slate-800 border-l-emerald-500 bg-white dark:bg-slate-900/90 py-2.5 px-3 shadow-sm">
                <div className="text-[9.5px] font-bold uppercase tracking-tight text-emerald-600 dark:text-emerald-400">
                  Momento em Relação ao Ponto C (M_C)
                </div>
                <div className="text-[15px] font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  M_C = {isKgf ? fmtBrNum(Math.abs(apC.M_hidro_C_total) / gravity, 0) : fmtBrNum(Math.abs(apC.M_hidro_C_total), 0)} {isKgf ? 'kgf·m' : 'N·m'}
                </div>
                <div className="text-[10px] mt-0.5 text-emerald-700 dark:text-emerald-400 font-bold">
                  Sentido: {apC.M_hidro_C_total > 0 ? 'Horário' : 'Anti-horário'} | Braço d_⊥,C = {fmtBrNum(apC.braco_FR_C, 2)} m
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-[11px] leading-snug text-emerald-950 dark:text-emerald-100">
                <div className="font-black uppercase text-[10px] text-emerald-800 dark:text-emerald-300 mb-0.5">
                  Verificação Qualitativa de Tombamento (Sem Percolação):
                </div>
                <div>
                  <strong>A força hidrostática não pode tombar a barragem.</strong> A resultante <span className="font-bold">F_R</span> produz momento no sentido <strong>anti-horário</strong> em relação ao ponto C (<span className="font-mono">M_C = {fmtBrNum(Math.abs(apC.M_hidro_C_total), 0)} N·m</span>), pois o momento estabilizante da componente vertical descendente <span className="font-bold">F_V</span> supera o momento horário de <span className="font-bold">F_H</span>, impedindo o tombamento para a direita.
                </div>
              </div>
            </div>

            {/* BLOCO UNITÁRIO: POR METRO LINEAR DE BARRAGEM */}
            <div className="rounded-2xl border border-blue-200 dark:border-blue-800/70 bg-blue-50/40 dark:bg-blue-950/20 p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-blue-200/70 dark:border-blue-800/50 pb-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-800 dark:text-blue-300">
                  Valores Equivalentes por Metro Linear (1,00 m)
                </span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                  Unitário (1 m)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800">
                  <div className="text-[9px] font-black text-slate-400 uppercase">F_R (1 m)</div>
                  <div className="text-xs font-black text-blue-700 dark:text-blue-300">
                    {fmtBrNum(fd.up.FR / 1000, 0)} kN/m
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800">
                  <div className="text-[9px] font-black text-slate-400 uppercase">F_H (1 m)</div>
                  <div className="text-xs font-black text-blue-700 dark:text-blue-300">
                    {fmtBrNum(fd.up.FH / 1000, 0)} kN/m
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800">
                  <div className="text-[9px] font-black text-slate-400 uppercase">F_V (1 m)</div>
                  <div className="text-xs font-black text-blue-700 dark:text-blue-300">
                    {fmtBrNum(fd.up.FV / 1000, 0)} kN/m
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-600 dark:text-slate-300 font-medium text-center">
                γ_água (20 °C) = {fmtBrNum(st.analisePontoC ? st.analisePontoC.p_cg / Math.max(1e-6, fd.up.h_cg) : 9790, 0)} N/m³ | γ_concreto (d = {(st.concreteSpecificGravity ?? 2.4).toFixed(2).replace('.', ',')}) = {fmtBrNum(st.gammaMaterial, 0)} N/m³
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
                  B. Avaliação com Percolação (Base BC)
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">
                  Subpressão U
                </span>
              </div>

              <ResultsCard
                title={`Força de Subpressão na Base U (b = ${apC.larguraLongitudinal.toFixed(0)} m)`}
                value={isKgf ? fmtBrNum(apC.subpressao.U_total / gravity, 0) : fmtBrNum(apC.subpressao.U_total, 0)}
                unit={isKgf ? 'kgf' : 'N'}
                theme="amber"
                leftIcon={AlertCircle}
                secondaryValue={`p_B = ${formatPressureVal(apC.subpressao.p_B)} ${pressureUnit} → p_C = ${formatPressureVal(apC.subpressao.p_C)} ${pressureUnit} | Braço B/3 = ${apC.subpressao.x_U.toFixed(1).replace('.', ',')} m`}
              />

              <ResultsCard
                title="Momento de Subpressão (M_U)"
                value={isKgf ? fmtBrNum(apC.subpressao.M_U_ref_total / gravity, 0) : fmtBrNum(apC.subpressao.M_U_ref_total, 0)}
                unit={isKgf ? 'kgf·m' : 'N·m'}
                theme="red"
                leftIcon={RotateCw}
                secondaryValue={`Braço 20 m (B/3): ${formatTotalMoment(apC.subpressao.M_U_ref_total)} ${totalMomentUnit} | Braço 40 m (até C): ${formatTotalMoment(apC.subpressao.M_U_C_total)} ${totalMomentUnit}`}
              />

              <ResultsCard
                title={`Peso Próprio do Concreto W (b = ${apC.larguraLongitudinal.toFixed(0)} m)`}
                value={isKgf ? fmtBrNum(apC.W_total / gravity, 0) : fmtBrNum(apC.W_total, 0)}
                unit={isKgf ? 'kgf' : 'N'}
                theme="slate"
                leftIcon={Construction}
                secondaryValue={`M_W,C = ${isKgf ? fmtBrNum(apC.M_W_C_total / gravity, 0) : fmtBrNum(apC.M_W_C_total, 0)} ${isKgf ? 'kgf·m' : 'N·m'} (Anti-horário | b_W,C = ${st.lever_arm_weight.toFixed(1).replace('.', ',')} m)`}
              />

              <div className="p-2.5 rounded-xl bg-purple-100/70 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800 text-[10.5px] leading-snug text-purple-950 dark:text-purple-100">
                <strong>Efeito da percolação sob a barragem:</strong> A percolação sob a base BC introduz subpressão vertical para cima (<span className="font-mono">U</span>), modificando a distribuição das reações na fundação e produzindo momento horário (tombante) em relação a C, o que altera a avaliação da estabilidade da barragem.
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
