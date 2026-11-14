import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { FormaComporta, SistemaUnidades, ModoPosicionamentoComporta } from '../dominio/tipos';
import { ConfiguracaoSimulacaoComporta } from '../dominio/configuracao';
import { CalculationLine } from '@/src/components/ui/CalculationLine';
import { MathTex, texNum } from '@/src/components/ui/MathTex';

export { CalculationLine };

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
  // Sistema de unidades local ou do config
  const initialUnit = config?.sistemaUnidades ?? analyzedResults?.sistemaUnidades ?? SistemaUnidades.SI;
  const [unitSystem, setUnitSystem] = useState<SistemaUnidades>(initialUnit);

  if (!analyzedResults) return null;

  const isKgf = unitSystem === SistemaUnidades.TECNICO_KGF;

  const g = config?.fluidoMontante?.gravidade ?? 9.81;
  const rho = config?.fluidoMontante?.densidade ?? analyzedResults?.densityUp ?? 1000;
  const gamma_N = analyzedResults?.gammaUp ?? rho * g;
  const gamma_kgf = rho; // kgf/m³

  // Grandeza selecionada
  const gamma_val = isKgf ? gamma_kgf : gamma_N;
  const p_unit_tex = isKgf ? '\\text{kgf/m}^2' : '\\text{kPa}';
  const force_unit_tex = isKgf ? '\\text{kgf}' : '\\text{kN}';

  const thetaRad = (gateInclination * Math.PI) / 180;
  const sinTheta = Math.sin(thetaRad);

  const H = config?.comporta?.altura ?? 1.0;
  const W = config?.comporta?.largura ?? 1.0;
  const isCircular = gateShape === FormaComporta.CIRCULAR;
  const isRect = gateShape === FormaComporta.RETANGULAR;
  const isSemi = gateShape === FormaComporta.SEMI_CIRCULAR;

  const area = analyzedResults.forceData.up.area;
  const Ixx =
    analyzedResults.forceData.up.Ixx ??
    (isCircular
      ? (Math.PI * Math.pow(H / 2, 4)) / 4
      : isRect
      ? (W * Math.pow(H, 3)) / 12
      : Math.pow(H, 4) * (Math.PI / 8 - 8 / (9 * Math.PI)));
  const h_cg = analyzedResults.forceData.up.h_cg;
  const ybarRel = isSemi ? (4 * H) / (3 * Math.PI) : H / 2;
  const Y_CG = analyzedResults.forceData.up.Y_CG ?? h_cg / Math.max(0.001, sinTheta);
  const delta_y = analyzedResults.forceData.up.delta_y ?? Ixx / (area * Y_CG);
  const Y_CP = analyzedResults.forceData.up.Y_CP ?? Y_CG + delta_y;
  const h_cp = analyzedResults.forceData.up.h_cp;

  // Pressão no centróide
  const p_cg_Pa = gamma_N * h_cg;
  const p_cg_disp = isKgf ? (p_cg_Pa / g).toFixed(1) : (p_cg_Pa / 1000).toFixed(2);

  // Forças (Montante, Jusante e Líquida)
  const FR_up_N = analyzedResults.forceData.up?.FR ?? p_cg_Pa * area;
  const FR_down_N = analyzedResults.forceData.down?.FR ?? 0;
  const hasDownForce = FR_down_N > 1e-3;
  const FR_up_disp = isKgf ? Math.round(FR_up_N / g).toLocaleString('pt-BR') : (FR_up_N / 1000).toFixed(2);
  const FR_down_disp = isKgf ? Math.round(FR_down_N / g).toLocaleString('pt-BR') : (FR_down_N / 1000).toFixed(2);

  // Força resultante líquida
  const FR_N = Math.abs(analyzedResults.forceData.FR_net);
  const FR_disp = isKgf ? Math.round(FR_N / g).toLocaleString('pt-BR') : (FR_N / 1000).toFixed(2);

  const isFloorSupport = Boolean(analyzedResults?.equilibrium?.apoioFundoAtivo);
  const cosTheta = Math.cos(thetaRad);
  const fDiv = isKgf ? g : 1000;
  const moment_unit_tex = isKgf ? '\\text{kgf}\\cdot\\text{m}' : '\\text{kN}\\cdot\\text{m}';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl w-[95vw] lg:w-[80vw] h-[95vh] lg:h-[82vh] overflow-y-auto rounded-3xl shadow-2xl border border-blue-100 dark:border-slate-800 animate-in slide-in-from-bottom-10 zoom-in-95 duration-300 relative flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-blue-100 dark:border-slate-800 p-5 px-8 flex items-center justify-between z-20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-200 dark:shadow-none">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
                Memorial de Cálculo Hidrostático
              </h3>
              <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 tracking-widest">
                Passo a passo com equações e deduções didáticas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Unit Toggle in Memorial */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setUnitSystem(SistemaUnidades.SI)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  !isKgf
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                SI (kN, kPa)
              </button>
              <button
                type="button"
                onClick={() => setUnitSystem(SistemaUnidades.TECNICO_KGF)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  isKgf
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Técnico (kgf)
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-[11px] font-black text-slate-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all uppercase tracking-widest border border-slate-200/60 dark:border-slate-700 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-950/60">
          {isFloorSupport ? (() => {
            const eq = analyzedResults.equilibrium;
            const up = analyzedResults.forceData.up;
            const down = analyzedResults.forceData.down;
            const massaKg = config?.comporta?.pesoProprioAtivo ? (config.comporta.pesoProprio ?? 0) : 0;
            const W_N = eq.W_peso ?? massaKg * g;
            const W_disp = isKgf ? Math.round(W_N / g).toLocaleString('pt-BR') : (W_N / 1000).toFixed(3);
            const d_W_A = eq.d_W_A ?? (H / 2) * cosTheta;

            const rho_g = config?.fluidoMontante?.densidade ?? analyzedResults.densityUp ?? 1261.3;
            const rho_a = config?.fluidoJusante?.densidade ?? analyzedResults.densityDown ?? 998.2;
            const gamma_g_N = analyzedResults.gammaUp ?? rho_g * g;
            const gamma_a_N = analyzedResults.gammaDown ?? rho_a * g;
            const gamma_g_disp = isKgf ? rho_g : gamma_g_N;
            const gamma_a_disp = isKgf ? rho_a : gamma_a_N;
            const gamma_unit_tex = isKgf ? '\\text{kgf/m}^3' : '\\text{N/m}^3';

            const h_g = config?.fluidoMontante?.nivel ?? analyzedResults.hidraulica?.nivelMontante ?? 2.0;
            const h_curr = analyzedResults.hidraulica?.nivelJusanteEfetivo ?? config?.fluidoJusante?.nivel ?? 0;
            const h_eq = eq.h_jusante_eq ?? h_curr;

            const p_cg_g_disp = isKgf ? (up.p_cg / g).toFixed(1) : (up.p_cg / 1000).toFixed(2);
            const p_cg_a_disp = isKgf ? (down.p_cg / g).toFixed(1) : (down.p_cg / 1000).toFixed(2);
            const F_g_disp = isKgf ? Math.round(up.FR / g).toLocaleString('pt-BR') : (up.FR / 1000).toFixed(2);
            const F_a_disp = isKgf ? Math.round(down.FR / g).toLocaleString('pt-BR') : (down.FR / 1000).toFixed(2);

            const M_g_A_val = (eq.M_up_A ?? up.FR * up.s_cp) / fDiv;
            const M_W_A_val = (eq.M_W_A ?? W_N * d_W_A) / fDiv;
            const M_a_A_val = (eq.M_down_A ?? down.FR * down.s_cp) / fDiv;
            const d_cp_g = eq.d_cp_up_A ?? up.s_cp;
            const d_cp_a = eq.d_cp_down_A ?? down.s_cp;
            const R_B_N = eq.R_B ?? 0;
            const Ax_N = eq.Rx_hinge ?? 0;
            const Ay_N = eq.Ry_hinge ?? 0;
            const RA_N = eq.R_hinge ?? 0;
            const deltaX = eq.deltaX_BA ?? H * cosTheta;
            const deltaY = eq.deltaY_BA ?? H * sinTheta;
            const resFx = Ax_N + (up.FR - down.FR) * sinTheta;
            const resFy = Ay_N - W_N + (down.FR - up.FR) * cosTheta + R_B_N;
            const resMA = (eq.M_up_A ?? 0) + (eq.M_W_A ?? 0) - (eq.M_down_A ?? 0) - R_B_N * deltaX;

            const fmtF = (valN: number, dec = 2) =>
              isKgf ? Math.round(valN / g).toLocaleString('pt-BR') : (valN / 1000).toFixed(dec);

            return (
              <>
                {/* 1. PESO PRÓPRIO DA COMPORTA */}
                <section>
                  <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-6 h-px bg-amber-300 dark:bg-amber-700"></div> 1. Peso Próprio da Comporta e Geometria{' '}
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                  </h4>
                  <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <CalculationLine
                      theme="amber"
                      label={<>Área da Comporta (<MathTex tex="A" />) e Inércia (<MathTex tex="I_{xx}" />)</>}
                      symbol={<MathTex tex="A,\; I_{xx}" />}
                      formula={<MathTex tex="A = b \cdot L,\quad I_{xx} = \frac{b \cdot L^3}{12}" />}
                      substitution={<MathTex tex={`A = ${W.toFixed(2)} \\cdot ${H.toFixed(2)},\\quad I_{xx} = \\frac{${W.toFixed(2)} \\cdot (${H.toFixed(2)})^3}{12}`} />}
                      result={<MathTex tex={`${area.toFixed(2)}\\text{ m}^2\\; |\\; ${Ixx.toFixed(4)}`} />}
                      unit={<MathTex tex="\text{m}^4" />}
                    />
                    <CalculationLine
                      theme="amber"
                      label={<>Peso Próprio da Comporta (<MathTex tex="W" />)</>}
                      symbol={<MathTex tex="W" />}
                      formula={<MathTex tex="m \cdot g" />}
                      substitution={<MathTex tex={`${massaKg.toFixed(1)} \\cdot ${g.toFixed(2)}`} />}
                      result={<MathTex tex={texNum(W_disp)} />}
                      unit={<MathTex tex={force_unit_tex} />}
                    />
                    <CalculationLine
                      theme="amber"
                      label={<>Braço Horizontal do Peso até A (<MathTex tex="d_{W,A}" />)</>}
                      symbol={<MathTex tex="d_{W,A}" />}
                      formula={<MathTex tex="\frac{L}{2} \cdot \cos(\theta)" />}
                      substitution={<MathTex tex={`\\frac{${H.toFixed(2)}}{2} \\cdot \\cos(${gateInclination}^\\circ)`} />}
                      result={<MathTex tex={d_W_A.toFixed(3)} />}
                      unit={<MathTex tex="\text{m}" />}
                      isSubHeader
                    />
                  </div>
                </section>

                {/* 2. PROPRIEDADES DOS FLUIDOS A 20 °C */}
                <section>
                  <h4 className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-6 h-px bg-purple-300 dark:bg-purple-700"></div> 2. Propriedades dos Fluidos a 20 °C{' '}
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                  </h4>
                  <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <CalculationLine
                      theme="purple"
                      label={<>Glicerina a 20 °C (<MathTex tex="\rho_g,\; \gamma_g" />)</>}
                      symbol={<MathTex tex="\gamma_g" />}
                      formula={<MathTex tex="\rho_g \cdot g" />}
                      substitution={<MathTex tex={`${rho_g.toFixed(1)} \\cdot ${g.toFixed(2)}`} />}
                      result={<MathTex tex={texNum(gamma_g_disp.toFixed(1))} />}
                      unit={<MathTex tex={gamma_unit_tex} />}
                    />
                    <CalculationLine
                      theme="cyan"
                      label={<>Água a 20 °C (<MathTex tex="\rho_a,\; \gamma_a" />)</>}
                      symbol={<MathTex tex="\gamma_a" />}
                      formula={<MathTex tex="\rho_a \cdot g" />}
                      substitution={<MathTex tex={`${rho_a.toFixed(1)} \\cdot ${g.toFixed(2)}`} />}
                      result={<MathTex tex={texNum(gamma_a_disp.toFixed(1))} />}
                      unit={<MathTex tex={gamma_unit_tex} />}
                    />
                  </div>
                </section>

                {/* 3. PRESSÕES HIDROSTÁTICAS NAS DUAS FACES */}
                <section>
                  <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-6 h-px bg-blue-300 dark:bg-blue-700"></div> 3. Pressões Hidrostáticas nas Duas Faces{' '}
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                  </h4>
                  <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <CalculationLine
                      theme="purple"
                      label={<>Profundidade e Pressão no CG — Glicerina (<MathTex tex="h_{\text{CG},g},\; p_{\text{CG},g}" />)</>}
                      symbol={<MathTex tex="p_{\text{CG},g}" />}
                      formula={<MathTex tex="\gamma_g \cdot h_{\text{CG},g} = \gamma_g \cdot \left(h_g - \frac{L}{2}\operatorname{sen}(\theta)\right)" />}
                      substitution={<MathTex tex={`${gamma_g_disp.toFixed(1)} \\cdot ${up.h_cg.toFixed(4)}`} />}
                      result={<MathTex tex={`${up.h_cg.toFixed(3)}\\text{ m}\\; |\\; ${texNum(p_cg_g_disp)}`} />}
                      unit={<MathTex tex={p_unit_tex} />}
                    />
                    <CalculationLine
                      theme="cyan"
                      label={<>Profundidade e Pressão no CG — Água (<MathTex tex="h_{\text{CG},a},\; p_{\text{CG},a}" />)</>}
                      symbol={<MathTex tex="p_{\text{CG},a}" />}
                      formula={<MathTex tex="\gamma_a \cdot h_{\text{CG},a} = \gamma_a \cdot \left(h - \frac{L}{2}\operatorname{sen}(\theta)\right)" />}
                      substitution={<MathTex tex={`${gamma_a_disp.toFixed(1)} \\cdot ${down.h_cg.toFixed(4)}`} />}
                      result={<MathTex tex={`${down.h_cg.toFixed(3)}\\text{ m}\\; |\\; ${texNum(p_cg_a_disp)}`} />}
                      unit={<MathTex tex={p_unit_tex} />}
                    />
                  </div>
                </section>

                {/* 4. FORÇAS HIDROSTÁTICAS RESULTANTES */}
                <section>
                  <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-6 h-px bg-indigo-300 dark:bg-indigo-700"></div> 4. Forças Hidrostáticas Resultantes{' '}
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                  </h4>
                  <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <CalculationLine
                      theme="purple"
                      label={<>Força Resultante da Glicerina (<MathTex tex="F_{R,g}" />)</>}
                      symbol={<MathTex tex="F_{R,g}" />}
                      formula={<MathTex tex="\gamma_g \cdot h_{\text{CG},g} \cdot A" />}
                      substitution={<MathTex tex={`${texNum(p_cg_g_disp)} \\cdot ${area.toFixed(2)}`} />}
                      result={<MathTex tex={texNum(F_g_disp)} />}
                      unit={<MathTex tex={force_unit_tex} />}
                    />
                    <CalculationLine
                      theme="cyan"
                      label={<>Força Resultante da Água (<MathTex tex="F_{R,a}" />)</>}
                      symbol={<MathTex tex="F_{R,a}" />}
                      formula={<MathTex tex="\gamma_a \cdot h_{\text{CG},a} \cdot A" />}
                      substitution={<MathTex tex={`${texNum(p_cg_a_disp)} \\cdot ${area.toFixed(2)}`} />}
                      result={<MathTex tex={texNum(F_a_disp)} />}
                      unit={<MathTex tex={force_unit_tex} />}
                      isSubHeader
                    />
                  </div>
                </section>

                {/* 5. CENTROS DE PRESSÃO DE CADA FLUIDO */}
                <section>
                  <h4 className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-6 h-px bg-cyan-300 dark:bg-cyan-700"></div> 5. Centros de Pressão (<MathTex tex="Y_{\text{CP}}" />, <MathTex tex="y_{\text{CP}}" /> e <MathTex tex="h_{\text{CP}}" /> de cada fluido){' '}
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                  </h4>
                  <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <CalculationLine
                      theme="purple"
                      label={<>CP da Glicerina (<MathTex tex="Y_{\text{CP},g},\; d_{\text{CP},g}" /> a partir de A)</>}
                      symbol={<MathTex tex="Y_{\text{CP},g},\; d_{\text{CP},g}" />}
                      formula={<MathTex tex="Y_{\text{CG},g} + \frac{I_{xx}}{A \cdot Y_{\text{CG},g}},\quad d_{\text{CP},g} = \frac{L}{2} + \Delta y_g" />}
                      substitution={<MathTex tex={`${(up.Y_CG ?? 0).toFixed(4)} + ${(up.delta_y ?? 0).toFixed(4)}`} />}
                      result={<MathTex tex={`Y_{\\text{CP},g}=${(up.Y_CP ?? 0).toFixed(3)}\\text{ m}\\; |\\; d_{\\text{CP},g}=${d_cp_g.toFixed(4)}`} />}
                      unit={<MathTex tex="\text{m}" />}
                    />
                    <CalculationLine
                      theme="purple"
                      label={<>Profundidade Vertical do CP da Glicerina (<MathTex tex="h_{\text{CP},g}" />)</>}
                      symbol={<MathTex tex="h_{\text{CP},g}" />}
                      formula={<MathTex tex="Y_{\text{CP},g} \cdot \operatorname{sen}(\theta)" />}
                      substitution={<MathTex tex={`${(up.Y_CP ?? 0).toFixed(4)} \\cdot \\operatorname{sen}(${gateInclination}^\\circ)`} />}
                      result={<MathTex tex={(up.h_cp ?? 0).toFixed(3)} />}
                      unit={<MathTex tex="\text{m}" />}
                    />
                    <CalculationLine
                      theme="cyan"
                      label={<>CP da Água (<MathTex tex="Y_{\text{CP},a},\; d_{\text{CP},a}" /> a partir de A)</>}
                      symbol={<MathTex tex="Y_{\text{CP},a},\; d_{\text{CP},a}" />}
                      formula={<MathTex tex="Y_{\text{CG},a} + \frac{I_{xx}}{A \cdot Y_{\text{CG},a}},\quad d_{\text{CP},a} = \frac{L}{2} + \Delta y_a" />}
                      substitution={<MathTex tex={`${(down.Y_CG ?? 0).toFixed(4)} + ${(down.delta_y ?? 0).toFixed(4)}`} />}
                      result={<MathTex tex={`Y_{\\text{CP},a}=${(down.Y_CP ?? 0).toFixed(3)}\\text{ m}\\; |\\; d_{\\text{CP},a}=${d_cp_a.toFixed(4)}`} />}
                      unit={<MathTex tex="\text{m}" />}
                    />
                    <CalculationLine
                      theme="cyan"
                      label={<>Profundidade Vertical do CP da Água (<MathTex tex="h_{\text{CP},a}" />)</>}
                      symbol={<MathTex tex="h_{\text{CP},a}" />}
                      formula={<MathTex tex="Y_{\text{CP},a} \cdot \operatorname{sen}(\theta)" />}
                      substitution={<MathTex tex={`${(down.Y_CP ?? 0).toFixed(4)} \\cdot \\operatorname{sen}(${gateInclination}^\\circ)`} />}
                      result={<MathTex tex={(down.h_cp ?? 0).toFixed(3)} />}
                      unit={<MathTex tex="\text{m}" />}
                    />
                  </div>
                </section>

                {/* 6. MOMENTOS EM RELAÇÃO À ARTICULAÇÃO A */}
                <section>
                  <h4 className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-6 h-px bg-purple-300 dark:bg-purple-700"></div> 6. Momentos em Relação à Articulação A (<MathTex tex="\Sigma M_A = 0" />){' '}
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                  </h4>
                  <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <CalculationLine
                      theme="purple"
                      label={<>Momento da Glicerina em A (<MathTex tex="M_{g,A}" />, anti-horário +)</>}
                      symbol={<MathTex tex="M_{g,A}" />}
                      formula={<MathTex tex="+F_{R,g} \cdot d_{\text{CP},g}" />}
                      substitution={<MathTex tex={`${(up.FR / fDiv).toFixed(3)} \\cdot ${d_cp_g.toFixed(4)}`} />}
                      result={<MathTex tex={M_g_A_val.toFixed(3)} />}
                      unit={<MathTex tex={moment_unit_tex} />}
                    />
                    <CalculationLine
                      theme="amber"
                      label={<>Momento do Peso Próprio em A (<MathTex tex="M_{W,A}" />, anti-horário +)</>}
                      symbol={<MathTex tex="M_{W,A}" />}
                      formula={<MathTex tex="+W \cdot \left(\frac{L}{2}\cos\theta\right)" />}
                      substitution={<MathTex tex={`${(W_N / fDiv).toFixed(3)} \\cdot ${d_W_A.toFixed(3)}`} />}
                      result={<MathTex tex={M_W_A_val.toFixed(3)} />}
                      unit={<MathTex tex={moment_unit_tex} />}
                    />
                    <CalculationLine
                      theme="cyan"
                      label={<>Momento da Água em A (<MathTex tex="M_{a,A}" />, horário −)</>}
                      symbol={<MathTex tex="M_{a,A}" />}
                      formula={<MathTex tex="-F_{R,a} \cdot d_{\text{CP},a}" />}
                      substitution={<MathTex tex={`-${(down.FR / fDiv).toFixed(3)} \\cdot ${d_cp_a.toFixed(4)}`} />}
                      result={<MathTex tex={`-${M_a_A_val.toFixed(3)}`} />}
                      unit={<MathTex tex={moment_unit_tex} />}
                    />
                  </div>
                </section>

                {/* 7. APLICAÇÃO DA CONDIÇÃO DE EQUILÍBRIO R_B = 0 */}
                <section>
                  <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-6 h-px bg-emerald-300 dark:bg-emerald-700"></div> 7. Aplicação da Condição de Equilíbrio <MathTex tex="R_B = 0" />{' '}
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                  </h4>
                  <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <CalculationLine
                      theme="emerald"
                      label={<>Equação Geral com Apoio Liso em B (<MathTex tex="R_B" /> vertical)</>}
                      symbol={<MathTex tex="\Sigma M_A = 0" />}
                      formula={<MathTex tex="M_{g,A} + M_{W,A} - M_{a,A} - R_B \cdot (L\cos\theta) = 0" />}
                      substitution={<MathTex tex={`R_B = 0 \\implies F_{R,a} \\cdot d_{\\text{CP},a} = F_{R,g} \\cdot d_{\\text{CP},g} + W \\cdot d_{W,A}`} />}
                      result={<MathTex tex={`${(M_g_A_val + M_W_A_val).toFixed(3)}`} />}
                      unit={<MathTex tex={moment_unit_tex} />}
                    />
                  </div>
                </section>

                {/* 8. DETERMINAÇÃO DA PROFUNDIDADE h DA ÁGUA */}
                <section>
                  <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-6 h-px bg-emerald-300 dark:bg-emerald-700"></div> 8. Determinação da Profundidade <MathTex tex="h" /> da Água{' '}
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                  </h4>
                  <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <CalculationLine
                      theme="emerald"
                      label={<>Momento da Água em Função de <MathTex tex="h_{\text{CG},a}" /></>}
                      symbol={<MathTex tex="F_{R,a} \cdot d_{\text{CP},a}" />}
                      formula={<MathTex tex="\gamma_a \cdot A \cdot \left(\frac{L}{2}\, h_{\text{CG},a} + \frac{I_{xx}\operatorname{sen}\theta}{A}\right) = M_{g,A} + M_{W,A}" />}
                      substitution={<MathTex tex={`h_{\\text{CG},a} = h - \\frac{L}{2}\\operatorname{sen}(${gateInclination}^\\circ)`} />}
                      result={<MathTex tex={`${Math.max(0, h_eq - 0.5 * deltaY).toFixed(4)}`} />}
                      unit={<MathTex tex="\text{m}" />}
                    />
                    <CalculationLine
                      theme="emerald"
                      label={<>Profundidade Limite da Água para <MathTex tex="R_B = 0" /> (<MathTex tex="h" />)</>}
                      symbol={<MathTex tex="h" />}
                      formula={<MathTex tex="h_{\text{CG},a} + \frac{L}{2}\operatorname{sen}(\theta)" />}
                      substitution={<MathTex tex={`${Math.max(0, h_eq - 0.5 * deltaY).toFixed(4)} + ${(0.5 * deltaY).toFixed(4)}`} />}
                      result={<MathTex tex={`${h_eq.toFixed(3)}\\; (\\approx ${h_eq.toFixed(2)})`} />}
                      unit={<MathTex tex="\text{m}" />}
                      isSubHeader
                    />
                  </div>
                </section>

                {/* 9. VERIFICAÇÃO FINAL DAS EQUAÇÕES DE EQUILÍBRIO */}
                <section>
                  <h4 className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-6 h-px bg-slate-300 dark:bg-slate-700"></div> 9. Verificação Final das Equações de Equilíbrio{' '}
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                  </h4>
                  <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <CalculationLine
                      theme="purple"
                      label={<>Reação Horizontal na Articulação A (<MathTex tex="A_x" />)</>}
                      symbol={<MathTex tex="A_x" />}
                      formula={<MathTex tex="(F_{R,a} - F_{R,g}) \cdot \operatorname{sen}(\theta)" />}
                      substitution={<MathTex tex={`(${(down.FR / fDiv).toFixed(2)} - ${(up.FR / fDiv).toFixed(2)}) \\cdot \\operatorname{sen}(${gateInclination}^\\circ)`} />}
                      result={<MathTex tex={texNum(fmtF(Ax_N))} />}
                      unit={<MathTex tex={force_unit_tex} />}
                    />
                    <CalculationLine
                      theme="purple"
                      label={<>Reação Vertical na Articulação A (<MathTex tex="A_y" />)</>}
                      symbol={<MathTex tex="A_y" />}
                      formula={<MathTex tex="W + (F_{R,g} - F_{R,a}) \cdot \cos(\theta) - R_B" />}
                      substitution={<MathTex tex={`${(W_N / fDiv).toFixed(3)} + (${(up.FR / fDiv).toFixed(2)} - ${(down.FR / fDiv).toFixed(2)}) \\cdot \\cos(${gateInclination}^\\circ) - ${(R_B_N / fDiv).toFixed(3)}`} />}
                      result={<MathTex tex={texNum(fmtF(Ay_N))} />}
                      unit={<MathTex tex={force_unit_tex} />}
                    />
                    <CalculationLine
                      theme="slate"
                      label={<>Reação Resultante em A (<MathTex tex="R_A" />) e Reação em B (<MathTex tex="R_B" />)</>}
                      symbol={<MathTex tex="R_A,\; R_B" />}
                      formula={<MathTex tex="R_A = \sqrt{A_x^2 + A_y^2}" />}
                      substitution={<MathTex tex={`\\sqrt{(${(Ax_N / fDiv).toFixed(2)})^2 + (${(Ay_N / fDiv).toFixed(2)})^2}`} />}
                      result={<MathTex tex={`R_A=${texNum(fmtF(RA_N))}\\; |\\; R_B=${texNum(fmtF(R_B_N, 3))}`} />}
                      unit={<MathTex tex={force_unit_tex} />}
                    />
                    <CalculationLine
                      theme="emerald"
                      label={<>Verificação das Equações Globais (<MathTex tex="\Sigma F_x,\; \Sigma F_y,\; \Sigma M_A" />)</>}
                      symbol={<MathTex tex="\Sigma = 0" />}
                      formula={<MathTex tex="\Sigma F_x = 0,\quad \Sigma F_y = 0,\quad \Sigma M_A = 0" />}
                      substitution={<MathTex tex={`\\Sigma F_x=${(resFx / 1000).toFixed(4)}\\text{ kN},\\; \\Sigma F_y=${(resFy / 1000).toFixed(4)}\\text{ kN}`} />}
                      result={<MathTex tex={`\\Sigma M_A = ${(resMA / 1000).toFixed(4)}`} />}
                      unit={<MathTex tex="\text{kN}\cdot\text{m}" />}
                      isSubHeader
                    />
                  </div>
                </section>
              </>
            );
          })() : (
            <>
          {/* 1. DADOS DE ENTRADA */}
          <section>
            <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-6 h-px bg-slate-300 dark:bg-slate-700"></div> 1. Dados de Entrada do Problema{' '}
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50/70 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
              <div>
                <span className="text-slate-400 dark:text-slate-400 block font-medium">Formato da Comporta:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {isCircular ? 'Circular' : isRect ? 'Retangular' : 'Semicircular'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-400 block font-medium">Dimensões:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {isCircular ? (
                    <>
                      Diâmetro <MathTex tex={`\\varnothing = ${H.toFixed(2)}\\text{ m}`} />
                    </>
                  ) : (
                    <MathTex tex={`H = ${H.toFixed(2)}\\text{ m},\\; B = ${W.toFixed(2)}\\text{ m}`} />
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-400 block font-medium">Ângulo de Inclinação:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  <MathTex tex={`\\theta = ${gateInclination}^\\circ`} />
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-400 block font-medium">
                  Fluido & Peso Específico (<MathTex tex="\gamma" />):
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {isKgf ? (
                    <MathTex tex={`\\gamma = ${gamma_kgf}\\text{ kgf/m}^3`} />
                  ) : (
                    <MathTex
                      tex={`\\gamma = ${gamma_N.toFixed(0)}\\text{ N/m}^3\\;(${(gamma_N / 1000).toFixed(2)}\\text{ kN/m}^3)`}
                    />
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-400 block font-medium">Modo de Posicionamento:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {config?.comporta?.modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO ? (
                    <>
                      Modo <MathTex tex="Y_{\text{CG}}" /> Direto (<MathTex tex={`${Y_CG.toFixed(2)}\\text{ m}`} />)
                    </>
                  ) : (
                    <>
                      Modo Padrão <MathTex tex="h_1" /> (
                      <MathTex tex={`${(config?.comporta?.profundidadeTopo ?? 0).toFixed(2)}\\text{ m}`} />)
                    </>
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-400 block font-medium">Sistema de Unidades:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                  {isKgf ? (
                    <>
                      Técnico (<MathTex tex="\text{kgf},\; \text{kgf/m}^2" />)
                    </>
                  ) : (
                    <>
                      SI (<MathTex tex="\text{kN},\; \text{kPa}" />)
                    </>
                  )}
                </span>
              </div>
              {analyzedResults?.operacao && (
                <div className="md:col-span-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-400 dark:text-slate-400 font-medium mr-2">Condição Operacional:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {analyzedResults.operacao.estadoLabel} ({analyzedResults.operacao.grauAberturaPercent}%)
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 ml-2">
                      — {analyzedResults.operacao.condicaoPassagem}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
                    Área livre:{' '}
                    <MathTex tex={`${analyzedResults.operacao.areaAberturaLivre.toFixed(4)}\\text{ m}^2`} /> |{' '}
                    <MathTex
                      tex={`\\Delta h = ${(analyzedResults.hidraulica?.diferencaNivel ?? 0).toFixed(2)}\\text{ m}`}
                    />
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* 2. GEOMETRIA DA SEÇÃO TRANSVERSAL */}
          <section>
            <h4 className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-6 h-px bg-slate-300 dark:bg-slate-700"></div> 2. Propriedades Geométricas da Área
              Molhada <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
            </h4>
            <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              <CalculationLine
                theme="slate"
                label={
                  <>
                    Área da Comporta (<MathTex tex="A" />)
                  </>
                }
                symbol={<MathTex tex="A" />}
                formula={
                  isCircular ? (
                    <MathTex tex="\frac{\pi \cdot D^2}{4}" />
                  ) : isRect ? (
                    <MathTex tex="b \cdot h" />
                  ) : (
                    <MathTex tex="\frac{\pi \cdot R^2}{2}" />
                  )
                }
                substitution={
                  isCircular ? (
                    <MathTex tex={`\\frac{\\pi \\cdot (${H.toFixed(2)})^2}{4}`} />
                  ) : isRect ? (
                    <MathTex tex={`${W.toFixed(2)} \\cdot ${H.toFixed(2)}`} />
                  ) : (
                    <MathTex tex={`\\frac{\\pi \\cdot (${H.toFixed(2)})^2}{2}`} />
                  )
                }
                result={<MathTex tex={area.toFixed(4)} />}
                unit={<MathTex tex="\text{m}^2" />}
              />
              <CalculationLine
                theme="slate"
                label={
                  <>
                    Momento de Inércia Centroidal (<MathTex tex="I_{xx}" />)
                  </>
                }
                symbol={<MathTex tex="I_{xx}" />}
                formula={
                  isCircular ? (
                    <MathTex tex="\frac{\pi \cdot D^4}{64}" />
                  ) : isRect ? (
                    <MathTex tex="\frac{b \cdot h^3}{12}" />
                  ) : (
                    <MathTex tex="R^4 \cdot \left(\frac{\pi}{8} - \frac{8}{9\pi}\right)" />
                  )
                }
                substitution={
                  isCircular ? (
                    <MathTex tex={`\\frac{\\pi \\cdot (${H.toFixed(2)})^4}{64}`} />
                  ) : isRect ? (
                    <MathTex tex={`\\frac{${W.toFixed(2)} \\cdot (${H.toFixed(2)})^3}{12}`} />
                  ) : (
                    <MathTex tex={`(${H.toFixed(2)})^4 \\cdot \\left(\\frac{\\pi}{8} - \\frac{8}{9\\pi}\\right)`} />
                  )
                }
                result={<MathTex tex={Ixx.toFixed(5)} />}
                unit={<MathTex tex="\text{m}^4" />}
              />
            </div>
          </section>

          {/* 3. CENTRÓIDE E PRESSÃO NO CENTRÓIDE */}
          <section>
            <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-6 h-px bg-blue-300 dark:bg-blue-700"></div> 3. Centróide e Pressão Hidrostática{' '}
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
            </h4>
            <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              <CalculationLine
                theme="blue"
                label={
                  <>
                    Distância Inclinada da NA ao Centróide (<MathTex tex="Y_{\text{CG}}" />)
                  </>
                }
                symbol={<MathTex tex="Y_{\text{CG}}" />}
                formula={
                  config?.comporta?.modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO ? (
                    <span className="font-sans text-xs italic">Informado diretamente</span>
                  ) : isSemi ? (
                    <MathTex tex="\frac{h_{\text{topo}}}{\operatorname{sen}(\theta)} + \frac{4R}{3\pi}" />
                  ) : (
                    <MathTex tex="\frac{h_{\text{topo}}}{\operatorname{sen}(\theta)} + \frac{H}{2}" />
                  )
                }
                substitution={
                  config?.comporta?.modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO ? undefined : (
                    <MathTex
                      tex={`\\frac{${(config?.comporta?.profundidadeTopo ?? 0).toFixed(2)}}{\\operatorname{sen}(${gateInclination}^\\circ)} + ${ybarRel.toFixed(3)}`}
                    />
                  )
                }
                result={<MathTex tex={Y_CG.toFixed(3)} />}
                unit={<MathTex tex="\text{m}" />}
              />
              <CalculationLine
                theme="blue"
                label={
                  <>
                    Profundidade Vertical do Centróide (<MathTex tex="h_{\text{CG}}" />)
                  </>
                }
                symbol={<MathTex tex="h_{\text{CG}}" />}
                formula={<MathTex tex="Y_{\text{CG}} \cdot \operatorname{sen}(\theta)" />}
                substitution={<MathTex tex={`${Y_CG.toFixed(3)} \\cdot \\operatorname{sen}(${gateInclination}^\\circ)`} />}
                result={<MathTex tex={h_cg.toFixed(3)} />}
                unit={<MathTex tex="\text{m}" />}
              />
              <CalculationLine
                theme="blue"
                label={
                  <>
                    Pressão no Centróide (<MathTex tex="p_{\text{CG}}" />)
                  </>
                }
                symbol={<MathTex tex="p_{\text{CG}}" />}
                formula={<MathTex tex="\gamma \cdot h_{\text{CG}}" />}
                substitution={<MathTex tex={`${gamma_val.toFixed(0)} \\cdot ${h_cg.toFixed(3)}`} />}
                result={<MathTex tex={texNum(p_cg_disp)} />}
                unit={<MathTex tex={p_unit_tex} />}
                isSubHeader
              />
            </div>
          </section>

          {/* 4. FORÇA RESULTANTE (EMPUXO) */}
          <section>
            <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-6 h-px bg-indigo-300 dark:bg-indigo-700"></div> 4. Força Hidrostática Resultante
              (Empuxo <MathTex tex="F_R" />){' '}
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
            </h4>
            <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              {hasDownForce ? (
                <>
                  <CalculationLine
                    theme="indigo"
                    label={
                      <>
                        Força Hidrostática de Montante (<MathTex tex="F_{R,\text{M}}" />)
                      </>
                    }
                    symbol={<MathTex tex="F_{R,\text{M}}" />}
                    formula={<MathTex tex="p_{\text{CG,M}} \cdot A_{\text{M}}" />}
                    substitution={
                      isKgf ? (
                        <MathTex tex={`${texNum(p_cg_disp)} \\cdot ${area.toFixed(4)}`} />
                      ) : (
                        <MathTex tex={`${texNum(p_cg_disp)}\\text{ kPa} \\cdot ${area.toFixed(4)}\\text{ m}^2`} />
                      )
                    }
                    result={<MathTex tex={texNum(FR_up_disp)} />}
                    unit={<MathTex tex={force_unit_tex} />}
                  />
                  <CalculationLine
                    theme="indigo"
                    label={
                      <>
                        Força Hidrostática de Jusante (<MathTex tex="F_{R,\text{J}}" />)
                      </>
                    }
                    symbol={<MathTex tex="F_{R,\text{J}}" />}
                    formula={<MathTex tex="\gamma_{\text{J}} \cdot h_{\text{CG,J}} \cdot A_{\text{J}}" />}
                    result={<MathTex tex={texNum(FR_down_disp)} />}
                    unit={<MathTex tex={force_unit_tex} />}
                  />
                  <CalculationLine
                    theme="indigo"
                    label={
                      <>
                        Força Resultante Líquida (<MathTex tex="F_R / E" />)
                      </>
                    }
                    symbol={<MathTex tex="F_R" />}
                    formula={<MathTex tex="|F_{R,\text{M}} - F_{R,\text{J}}|" />}
                    substitution={<MathTex tex={`|${texNum(FR_up_disp)} - ${texNum(FR_down_disp)}|`} />}
                    result={<MathTex tex={texNum(FR_disp)} />}
                    unit={<MathTex tex={force_unit_tex} />}
                    isSubHeader
                  />
                </>
              ) : (
                <CalculationLine
                  theme="indigo"
                  label={
                    <>
                      Força Resultante (<MathTex tex="F_R / E" />)
                    </>
                  }
                  symbol={<MathTex tex="F_R" />}
                  formula={<MathTex tex="p_{\text{CG}} \cdot A = \gamma \cdot h_{\text{CG}} \cdot A" />}
                  substitution={
                    isKgf ? (
                      <MathTex tex={`${texNum(p_cg_disp)} \\cdot ${area.toFixed(4)}`} />
                    ) : (
                      <MathTex tex={`${texNum(p_cg_disp)}\\text{ kPa} \\cdot ${area.toFixed(4)}\\text{ m}^2`} />
                    )
                  }
                  result={<MathTex tex={texNum(FR_disp)} />}
                  unit={<MathTex tex={force_unit_tex} />}
                  isSubHeader
                />
              )}
            </div>
          </section>

          {/* 5. CENTRO DE PRESSÃO (CP) */}
          <section>
            <h4 className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-6 h-px bg-cyan-300 dark:bg-cyan-700"></div> 5. Ponto de Aplicação e Centro de
              Pressão (CP) <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
            </h4>
            <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              <CalculationLine
                theme="cyan"
                label={
                  <>
                    Excentricidade do CP ao longo do plano (<MathTex tex="\Delta y" />)
                  </>
                }
                symbol={<MathTex tex="\Delta y" />}
                formula={<MathTex tex="\frac{I_{xx}}{A \cdot Y_{\text{CG}}}" />}
                substitution={
                  <MathTex tex={`\\frac{${Ixx.toFixed(5)}}{${area.toFixed(4)} \\cdot ${Y_CG.toFixed(3)}}`} />
                }
                result={<MathTex tex={(delta_y * 100).toFixed(2)} />}
                unit={<MathTex tex="\text{cm}" />}
              />
              <CalculationLine
                theme="cyan"
                label={
                  <>
                    Distância Inclinada da NA ao CP (<MathTex tex="Y_{\text{CP}}" />)
                  </>
                }
                symbol={<MathTex tex="Y_{\text{CP}}" />}
                formula={<MathTex tex="Y_{\text{CG}} + \Delta y = Y_{\text{CG}} + \frac{I_{xx}}{A \cdot Y_{\text{CG}}}" />}
                substitution={<MathTex tex={`${Y_CG.toFixed(3)} + ${delta_y.toFixed(4)}`} />}
                result={<MathTex tex={Y_CP.toFixed(3)} />}
                unit={<MathTex tex="\text{m}" />}
                isSubHeader
              />
              <CalculationLine
                theme="cyan"
                label={
                  <>
                    Profundidade Vertical do CP (<MathTex tex="h_{\text{CP}}" />)
                  </>
                }
                symbol={<MathTex tex="h_{\text{CP}}" />}
                formula={<MathTex tex="Y_{\text{CP}} \cdot \operatorname{sen}(\theta)" />}
                substitution={<MathTex tex={`${Y_CP.toFixed(3)} \\cdot \\operatorname{sen}(${gateInclination}^\\circ)`} />}
                result={<MathTex tex={h_cp.toFixed(3)} />}
                unit={<MathTex tex="\text{m}" />}
                isSubHeader
              />
            </div>
          </section>

          {/* 6. EQUILÍBRIO (SE HOUVER DOBRADIÇA, TIRANTE OU APOIO EM PAREDE LISA) */}
          {(Math.abs(analyzedResults.equilibrium.M_hinge) > 1e-6 ||
            Math.abs(analyzedResults.equilibrium.F_tie) > 1e-6 ||
            analyzedResults.equilibrium.apoioParedeAtivo) && (
            <section>
              <h4 className="text-[10px] font-black text-purple-500 dark:text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-6 h-px bg-purple-200 dark:bg-purple-800"></div> 6. Equilíbrio Estático e Reações nos Apoios{' '}
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
              </h4>
              <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                {analyzedResults.equilibrium.apoioParedeAtivo ? (() => {
                  const eq = analyzedResults.equilibrium;
                  const fDiv = isKgf ? g : 1000;
                  const P_val = Math.abs(eq.P_apoio ?? 0) / fDiv;
                  const Bx_val = Math.abs(eq.Rx_hinge ?? 0) / fDiv;
                  const By_val = Math.abs(eq.Ry_hinge ?? 0) / fDiv;
                  const RB_val = (eq.R_hinge ?? 0) / fDiv;
                  const d_cp_B = Math.max(0, H - analyzedResults.forceData.s_cp_net);
                  const deltaY = eq.deltaY_BA ?? H * sinTheta;
                  const cosTheta = Math.cos(thetaRad);
                  const FR_scaled = FR_N / fDiv;
                  const FR_x_scaled = FR_scaled * sinTheta;
                  const FR_y_scaled = FR_scaled * cosTheta;

                  return (
                    <>
                      <CalculationLine
                        theme="purple"
                        label={
                          <>
                            Desnível Vertical entre B e A (<MathTex tex="\Delta y_{BA}" />)
                          </>
                        }
                        symbol={<MathTex tex="\Delta y_{BA}" />}
                        formula={<MathTex tex="L \cdot \operatorname{sen}(\theta)" />}
                        substitution={<MathTex tex={`${H.toFixed(2)} \\cdot \\operatorname{sen}(${gateInclination}^\\circ)`} />}
                        result={<MathTex tex={deltaY.toFixed(3)} />}
                        unit={<MathTex tex="\text{m}" />}
                      />
                      <CalculationLine
                        theme="purple"
                        label={
                          <>
                            Reação Horizontal na Parede Lisa em A (<MathTex tex="P" />)
                          </>
                        }
                        symbol={<MathTex tex="P" />}
                        formula={<MathTex tex="\frac{F_R \cdot d_{\text{CP},B}}{\Delta y_{BA}}" />}
                        substitution={
                          <MathTex tex={`\\frac{${FR_scaled.toFixed(2)} \\cdot ${d_cp_B.toFixed(3)}}{${deltaY.toFixed(3)}}`} />
                        }
                        result={<MathTex tex={texNum(isKgf ? Math.round(P_val).toLocaleString('pt-BR') : P_val.toFixed(2))} />}
                        unit={<MathTex tex={force_unit_tex} />}
                        isSubHeader
                      />
                      <CalculationLine
                        theme="purple"
                        label={
                          <>
                            Reação Horizontal na Articulação B (<MathTex tex="B_x" />)
                          </>
                        }
                        symbol={<MathTex tex="B_x" />}
                        formula={<MathTex tex="P - F_R \cdot \operatorname{sen}(\theta)" />}
                        substitution={
                          <MathTex tex={`${P_val.toFixed(2)} - ${FR_x_scaled.toFixed(2)}`} />
                        }
                        result={<MathTex tex={texNum(isKgf ? Math.round(Bx_val).toLocaleString('pt-BR') : Bx_val.toFixed(2))} />}
                        unit={<MathTex tex={force_unit_tex} />}
                        isSubHeader
                      />
                      <CalculationLine
                        theme="purple"
                        label={
                          <>
                            Reação Vertical na Articulação B (<MathTex tex="B_y" />)
                          </>
                        }
                        symbol={<MathTex tex="B_y" />}
                        formula={<MathTex tex="F_R \cdot \cos(\theta)" />}
                        substitution={
                          <MathTex tex={`${FR_scaled.toFixed(2)} \\cdot \\cos(${gateInclination}^\\circ) = ${FR_y_scaled.toFixed(2)}`} />
                        }
                        result={<MathTex tex={texNum(isKgf ? Math.round(By_val).toLocaleString('pt-BR') : By_val.toFixed(2))} />}
                        unit={<MathTex tex={force_unit_tex} />}
                        isSubHeader
                      />
                      <CalculationLine
                        theme="slate"
                        label={
                          <>
                            Reação Resultante na Articulação B (<MathTex tex="R_B" />)
                          </>
                        }
                        symbol={<MathTex tex="R_B" />}
                        formula={<MathTex tex="\sqrt{B_x^2 + B_y^2}" />}
                        substitution={
                          <MathTex tex={`\\sqrt{(${Bx_val.toFixed(2)})^2 + (${By_val.toFixed(2)})^2}`} />
                        }
                        result={<MathTex tex={texNum(isKgf ? Math.round(RB_val).toLocaleString('pt-BR') : RB_val.toFixed(2))} />}
                        unit={<MathTex tex={force_unit_tex} />}
                      />
                    </>
                  );
                })() : (
                  <>
                    {Math.abs(analyzedResults.equilibrium.M_hinge) > 1e-6 && (
                      <CalculationLine
                        theme="purple"
                        label="Momento no Apoio da Dobradiça"
                        symbol={<MathTex tex="M_{\text{hinge}}" />}
                        formula={<MathTex tex="F_R \cdot d_{\text{CP}} \pm W_{\perp} \cdot d_{\text{CG}}" />}
                        result={
                          <MathTex
                            tex={(Math.abs(analyzedResults.equilibrium.M_hinge) / (isKgf ? g : 1000)).toFixed(2)}
                          />
                        }
                        unit={<MathTex tex={isKgf ? '\\text{kgf}\\cdot\\text{m}' : '\\text{kN}\\cdot\\text{m}'} />}
                      />
                    )}
                    {Math.abs(analyzedResults.equilibrium.F_tie) > 1e-6 && (
                      <CalculationLine
                        theme="purple"
                        label="Força Necessária no Tirante"
                        symbol={<MathTex tex="F_{\text{tie}}" />}
                        formula={<MathTex tex="\frac{|M_{\text{hinge}}|}{d_{\text{tie}} \cdot \operatorname{sen}(\alpha)}" />}
                        result={
                          <MathTex tex={(Math.abs(analyzedResults.equilibrium.F_tie) / (isKgf ? g : 1000)).toFixed(2)} />
                        }
                        unit={<MathTex tex={force_unit_tex} />}
                        isSubHeader
                      />
                    )}
                  </>
                )}
              </div>
            </section>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
