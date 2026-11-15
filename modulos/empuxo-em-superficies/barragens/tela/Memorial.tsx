import React from 'react';
import { FileText, BookOpen, Info } from 'lucide-react';
import { ResultadoSimulacaoBarragem, SistemaUnidadesBarragem } from '../dominio/tipos';
import { CalculationLine } from '@/src/components/ui/CalculationLine';
import { MathTex, RichMathText } from '@/src/components/ui/MathTex';

export { CalculationLine };

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
  const unitFTex = isKgf ? '\\text{kgf/m}' : '\\text{kN/m}';
  const fmtP = (valPa: number) => (isKgf ? (valPa / gravity).toFixed(0) : (valPa / 1000).toFixed(2));
  const unitPTex = isKgf ? '\\text{kgf/m}^2' : '\\text{kPa}';
  const gammaUnitVal = isKgf ? density.toFixed(0) : (density * gravity).toFixed(0);

  const st = analyzedResults.stabilityData;
  const fd = analyzedResults.forceData;
  const apC = st?.analisePontoC;
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

  const isTriangular3DMode = Boolean(
    analyzedResults.normalizedInputs.showTriangularMode ||
      (st?.damWidth ?? analyzedResults.normalizedInputs.damWidth ?? 1) > 1.001
  );

  const fmtBrTex = (val: number, dec = 2) =>
    val.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  const fmtTotalForceTex = (valN: number) =>
    isKgf ? fmtBrTex(valN / gravity, 0) : fmtBrTex(valN / 1000, 1);

  const fmtTotalMomentTex = (valNm: number) =>
    isKgf ? fmtBrTex(valNm / gravity, 0) : fmtBrTex(valNm / 1000, 1);

  const totalForceUnitTex = isKgf ? '\\text{kgf}' : '\\text{kN}';
  const totalMomentUnitTex = isKgf ? '\\text{kgf}\\cdot\\text{m}' : '\\text{kN}\\cdot\\text{m}';

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
            className="text-[10px] font-black text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all uppercase tracking-widest cursor-pointer"
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
                  <RichMathText text={enunciado} />
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
                {isTriangular3DMode && apC ? (
                  <>
                    Análise tridimensional na largura longitudinal total{' '}
                    <MathTex tex={`b = ${apC.larguraLongitudinal.toFixed(2)}\\text{ m}`} />, água a 20 °C (
                    <MathTex tex={`\\gamma_{\\text{água}} = ${(density * gravity).toFixed(0)}\\text{ N/m}^3`} />
                    ), concreto com densidade relativa{' '}
                    <MathTex tex={`d = ${(st?.concreteSpecificGravity ?? 2.4).toFixed(2)}`} /> (
                    <MathTex tex={`\\gamma_{\\text{conc}} = ${fmtBrTex(gammaMat, 0)}\\text{ N/m}^3`} />
                    ). Para a condição com percolação sob a base <MathTex tex="BC" />, comenta-se o efeito da
                    subpressão <MathTex tex="U" /> sobre a distribuição das reações na base e avaliação de
                    estabilidade (com hipótese clássica linear variando de{' '}
                    <MathTex tex={`p_B = ${(apC.subpressao.fatorMontante * 100).toFixed(0)}\\%\\cdot \\gamma h`} /> em{' '}
                    <MathTex tex="B" /> até{' '}
                    <MathTex tex={`p_C = ${(apC.subpressao.fatorJusante * 100).toFixed(0)}\\%`} /> em{' '}
                    <MathTex tex="C" />).
                  </>
                ) : (
                  <>
                    Análise por metro linear de barragem (<MathTex tex="1\text{ m}" />),{' '}
                    <MathTex tex={`\\gamma_{\\text{água}} = ${(density * gravity).toFixed(0)}\\text{ N/m}^3`} />,{' '}
                    <MathTex tex={`\\gamma_{\\text{mat}} = ${(gammaMat / 1000).toFixed(1)}\\text{ kN/m}^3`} />, atrito{' '}
                    <MathTex tex={`\\mu = ${mu.toFixed(2)}`} />,{' '}
                    <RichMathText text={st?.upliftAssumption ?? 'subpressão desconsiderada (U = 0)'} />.
                    {analyzedResults.damType === 'CONTRAFORTE' &&
                      ' Contrafortes considerados com 20% da largura do vão (5×4%).'}
                  </>
                )}
              </p>
            </div>
          </div>

          {isTriangular3DMode && apC && st && (
            <div className="space-y-8">
              {/* ETAPA 1 */}
              <section>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-6 h-px bg-slate-300 dark:bg-slate-700"></div>
                  Etapa 1 – Características Geométricas da Barragem ABC
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="slate"
                    label="Altura Vertical (Aresta AC)"
                    symbol={<MathTex tex="H_{AC}" />}
                    result={<MathTex tex={analyzedResults.normalizedInputs.damHeight.toFixed(2)} />}
                    unit={<MathTex tex="\text{m}" />}
                  />
                  <CalculationLine
                    theme="slate"
                    label="Largura da Base (Aresta BC)"
                    symbol={<MathTex tex="B_{BC}" />}
                    result={<MathTex tex={st.actualBaseWidth.toFixed(2)} />}
                    unit={<MathTex tex="\text{m}" />}
                  />
                  <CalculationLine
                    theme="slate"
                    label="Largura Longitudinal da Barragem"
                    symbol={<MathTex tex="b" />}
                    result={<MathTex tex={apC.larguraLongitudinal.toFixed(2)} />}
                    unit={<MathTex tex="\text{m}" />}
                  />
                  <CalculationLine
                    theme="slate"
                    label="Comprimento da Face Inclinada AB"
                    symbol={<MathTex tex="L_{AB}" />}
                    formula={<MathTex tex="\sqrt{B_{BC}^2 + H_{AC}^2}" />}
                    substitution={
                      <MathTex
                        tex={`\\sqrt{${st.actualBaseWidth.toFixed(1)}^2 + ${analyzedResults.normalizedInputs.damHeight.toFixed(1)}^2}`}
                      />
                    }
                    result={<MathTex tex={apC.L_AB.toFixed(2)} />}
                    unit={<MathTex tex="\text{m}" />}
                  />
                  <CalculationLine
                    theme="slate"
                    label="Ângulo de Inclinação da Face AB"
                    symbol={<MathTex tex="\theta" />}
                    formula={<MathTex tex="\arctan\!\left(\frac{H_{AC}}{B_{BC}}\right)" />}
                    substitution={
                      <MathTex
                        tex={`\\arctan\\!\\left(\\frac{${analyzedResults.normalizedInputs.damHeight.toFixed(1)}}{${st.actualBaseWidth.toFixed(1)}}\\right)`}
                      />
                    }
                    result={<MathTex tex={thetaUp.toFixed(2)} />}
                    unit={<MathTex tex="^\circ" />}
                  />
                  <CalculationLine
                    theme="slate"
                    label="Área da Seção Transversal Triangular"
                    symbol={<MathTex tex="A_{\text{seção}}" />}
                    formula={<MathTex tex="\frac{1}{2} \cdot B_{BC} \cdot H_{AC}" />}
                    substitution={
                      <MathTex
                        tex={`\\frac{1}{2} \\cdot ${st.actualBaseWidth.toFixed(1)} \\cdot ${analyzedResults.normalizedInputs.damHeight.toFixed(1)}`}
                      />
                    }
                    result={<MathTex tex={fmtBrTex(st.area, 1)} />}
                    unit={<MathTex tex="\text{m}^2" />}
                  />
                </div>
              </section>

              {/* ETAPA 2 */}
              <section>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-6 h-px bg-slate-300 dark:bg-slate-700"></div>
                  Etapa 2 – Propriedades dos Materiais e Fluidos
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="slate"
                    label="Peso Específico da Água (a 20 °C)"
                    symbol={<MathTex tex="\gamma_{\text{água}}" />}
                    formula={<MathTex tex="\gamma_{20^\circ\text{C}}" />}
                    substitution={<MathTex tex="9\,790" />}
                    result={<MathTex tex={fmtBrTex(density * gravity, 0)} />}
                    unit={<MathTex tex="\text{N/m}^3" />}
                  />
                  <CalculationLine
                    theme="slate"
                    label="Densidade Relativa do Concreto"
                    symbol={<MathTex tex="d_{\text{conc}}" />}
                    result={<MathTex tex={(st.concreteSpecificGravity ?? 2.4).toFixed(2)} />}
                    unit=""
                  />
                  <CalculationLine
                    theme="slate"
                    label="Peso Específico do Concreto"
                    symbol={<MathTex tex="\gamma_{\text{conc}}" />}
                    formula={<MathTex tex="d_{\text{conc}} \cdot \gamma_{\text{água}}" />}
                    substitution={
                      <MathTex
                        tex={`${(st.concreteSpecificGravity ?? 2.4).toFixed(2)} \\cdot ${fmtBrTex(density * gravity, 0)}`}
                      />
                    }
                    result={<MathTex tex={fmtBrTex(gammaMat, 0)} />}
                    unit={<MathTex tex="\text{N/m}^3" />}
                  />
                </div>
              </section>

              {/* ETAPA 3 */}
              <section>
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-6 h-px bg-blue-300 dark:bg-blue-800"></div>
                  Etapa 3 – Determinação da Força Hidrostática na Face AB
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-blue-100 dark:border-blue-900/50">
                  <CalculationLine
                    theme="blue"
                    label="Área Molhada Total da Superfície AB"
                    symbol={<MathTex tex="A_{AB}" />}
                    formula={<MathTex tex="L_{\text{molhado}} \cdot b" />}
                    substitution={
                      <MathTex
                        tex={`${(fd.up?.wetLength ?? apC.L_AB).toFixed(2)} \\cdot ${apC.larguraLongitudinal.toFixed(1)}`}
                      />
                    }
                    result={<MathTex tex={fmtBrTex(apC.areaMolhadaTotal, 1)} />}
                    unit={<MathTex tex="\text{m}^2" />}
                  />
                  <CalculationLine
                    theme="blue"
                    label="Profundidade Vertical do Centroide da Face AB"
                    symbol={<MathTex tex="h_{CG}" />}
                    formula={<MathTex tex="\frac{h}{2}" />}
                    substitution={<MathTex tex={`\\frac{${hUp.toFixed(2)}}{2}`} />}
                    result={<MathTex tex={(fd.up?.h_cg ?? 0).toFixed(2)} />}
                    unit={<MathTex tex="\text{m}" />}
                  />
                  <CalculationLine
                    theme="blue"
                    label="Pressão Hidrostática Média no Centroide"
                    symbol={<MathTex tex="p_{CG}" />}
                    formula={<MathTex tex="\gamma_{\text{água}} \cdot h_{CG}" />}
                    substitution={
                      <MathTex
                        tex={`${fmtBrTex((density * gravity) / 1000, 3)} \\cdot ${(fd.up?.h_cg ?? 0).toFixed(2)}`}
                      />
                    }
                    result={<MathTex tex={fmtP(apC.p_cg)} />}
                    unit={<MathTex tex={unitPTex} />}
                  />
                  <CalculationLine
                    theme="blue"
                    label="Força Hidrostática Resultante na Superfície AB"
                    symbol={<MathTex tex="F_{R,AB}" />}
                    formula={<MathTex tex="\gamma_{\text{água}} \cdot h_{CG} \cdot A_{AB}" />}
                    substitution={
                      <MathTex
                        tex={`${fmtBrTex(density * gravity, 0)} \\cdot ${(fd.up?.h_cg ?? 0).toFixed(2)} \\cdot ${fmtBrTex(apC.areaMolhadaTotal, 0)}`}
                      />
                    }
                    result={<MathTex tex={fmtBrTex(apC.F_R_total, 0)} />}
                    unit={<MathTex tex="\text{N}" />}
                    isSubHeader
                  />
                  <CalculationLine
                    theme="blue"
                    label="Componente Horizontal (Para a Direita +x)"
                    symbol={<MathTex tex="F_H" />}
                    formula={<MathTex tex="F_{R,AB} \cdot \operatorname{sen}(\theta)" />}
                    substitution={
                      <MathTex
                        tex={`${fmtBrTex(apC.F_R_total, 0)} \\cdot \\operatorname{sen}(${thetaUp.toFixed(2)}^\\circ)`}
                      />
                    }
                    result={<MathTex tex={fmtBrTex(apC.F_H_total, 0)} />}
                    unit={<MathTex tex="\text{N}" />}
                  />
                  <CalculationLine
                    theme="blue"
                    label="Componente Vertical (Atua para Baixo sobre AB)"
                    symbol={<MathTex tex="F_V" />}
                    formula={<MathTex tex="F_{R,AB} \cdot \cos(\theta)" />}
                    substitution={
                      <MathTex
                        tex={`${fmtBrTex(apC.F_R_total, 0)} \\cdot \\cos(${thetaUp.toFixed(2)}^\\circ)`}
                      />
                    }
                    result={<MathTex tex={fmtBrTex(apC.F_V_total, 0)} />}
                    unit={<MathTex tex="\text{N}" />}
                  />
                </div>
              </section>

              {/* ETAPA 4 */}
              <section>
                <h4 className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-6 h-px bg-cyan-300 dark:bg-cyan-800"></div>
                  Etapa 4 – Determinação do Centro de Pressão (CP)
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-cyan-100 dark:border-cyan-900/50">
                  <CalculationLine
                    theme="cyan"
                    label="Momento de Inércia Baricêntrico da Face AB"
                    symbol={<MathTex tex="I_{CG}" />}
                    formula={<MathTex tex="\frac{b \cdot L_{\text{molhado}}^3}{12}" />}
                    substitution={
                      <MathTex
                        tex={`\\frac{${apC.larguraLongitudinal.toFixed(0)} \\cdot ${(fd.up?.wetLength ?? apC.L_AB).toFixed(1)}^3}{12}`}
                      />
                    }
                    result={
                      <MathTex
                        tex={fmtBrTex(
                          (apC.larguraLongitudinal * Math.pow(fd.up?.wetLength ?? apC.L_AB, 3)) / 12,
                          0
                        )}
                      />
                    }
                    unit={<MathTex tex="\text{m}^4" />}
                  />
                  <CalculationLine
                    theme="cyan"
                    label="Posição ao Longo da Face Inclinada (a partir de A)"
                    symbol={<MathTex tex="s_{CP,A}" />}
                    formula={<MathTex tex="s_{CG} + \frac{I_{CG}}{s_{CG} \cdot A_{AB}} = \frac{2}{3} L_{AB}" />}
                    substitution={<MathTex tex={`\\frac{2}{3} \\cdot ${(fd.up?.wetLength ?? apC.L_AB).toFixed(2)}`} />}
                    result={<MathTex tex={(fd.up?.s_cp ?? 0).toFixed(2)} />}
                    unit={<MathTex tex="\text{m}" />}
                  />
                  <CalculationLine
                    theme="cyan"
                    label="Profundidade Vertical do Centro de Pressão"
                    symbol={<MathTex tex="h_{CP}" />}
                    formula={<MathTex tex="s_{CP,A} \cdot \operatorname{sen}(\theta) = \frac{2}{3} h" />}
                    substitution={<MathTex tex={`\\frac{2}{3} \\cdot ${hUp.toFixed(2)}`} />}
                    result={<MathTex tex={(fd.up?.h_cp ?? 0).toFixed(2)} />}
                    unit={<MathTex tex="\text{m}" />}
                  />
                  <CalculationLine
                    theme="cyan"
                    label="Altura Vertical do CP a partir da Base BC"
                    symbol={<MathTex tex="y_{CP}" />}
                    formula={<MathTex tex="h - h_{CP} = \frac{1}{3} h" />}
                    substitution={<MathTex tex={`${hUp.toFixed(2)} - ${(fd.up?.h_cp ?? 0).toFixed(2)}`} />}
                    result={<MathTex tex={apC.y_cp_B.toFixed(2)} />}
                    unit={<MathTex tex="\text{m}" />}
                  />
                  <CalculationLine
                    theme="cyan"
                    label="Coordenada Horizontal do CP a partir de B"
                    symbol={<MathTex tex="x_{CP,B}" />}
                    formula={<MathTex tex="y_{CP} \cdot \cot(\theta)" />}
                    substitution={
                      <MathTex tex={`${apC.y_cp_B.toFixed(2)} \\cdot \\cot(${thetaUp.toFixed(2)}^\\circ)`} />
                    }
                    result={<MathTex tex={apC.x_cp_B.toFixed(2)} />}
                    unit={<MathTex tex="\text{m}" />}
                  />
                </div>
              </section>

              {/* ETAPA 5 */}
              <section>
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-6 h-px bg-amber-300 dark:bg-amber-800"></div>
                  Etapa 5 – Cálculo do Momento Hidrostático em Relação a C
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                  <CalculationLine
                    theme="amber"
                    label="Projeção Ortogonal de AC sobre AB (a partir de A)"
                    symbol={<MathTex tex="AD" />}
                    formula={<MathTex tex="H_{AC} \cdot \operatorname{sen}(\theta)" />}
                    substitution={
                      <MathTex
                        tex={`${analyzedResults.normalizedInputs.damHeight.toFixed(1)} \\cdot \\operatorname{sen}(${thetaUp.toFixed(2)}^\\circ)`}
                      />
                    }
                    result={<MathTex tex={apC.projecao_AD.toFixed(2)} />}
                    unit={<MathTex tex="\text{m}" />}
                  />
                  <CalculationLine
                    theme="amber"
                    label="Braço de Alavanca Perpendicular de F_R até C"
                    symbol={<MathTex tex="d_{\perp,C}" />}
                    formula={<MathTex tex="|s_{CP,A} - AD|" />}
                    substitution={
                      <MathTex
                        tex={`|${(fd.up?.s_cp ?? 0).toFixed(2)} - ${apC.projecao_AD.toFixed(2)}|`}
                      />
                    }
                    result={<MathTex tex={apC.braco_FR_C.toFixed(3)} />}
                    unit={<MathTex tex="\text{m}" />}
                  />
                  <CalculationLine
                    theme="amber"
                    label="Parcela Horária de F_H em torno de C"
                    symbol={<MathTex tex="M_{F_H,C}" />}
                    formula={<MathTex tex="+F_H \cdot y_{CP}" />}
                    substitution={
                      <MathTex tex={`${fmtBrTex(apC.F_H_total, 0)} \\cdot ${apC.y_cp_B.toFixed(2)}`} />
                    }
                    result={<MathTex tex={fmtBrTex(apC.M_FH_C_por_metro * apC.larguraLongitudinal, 0)} />}
                    unit={<MathTex tex="\text{N}\cdot\text{m}" />}
                  />
                  <CalculationLine
                    theme="amber"
                    label="Parcela Anti-horária de F_V em torno de C"
                    symbol={<MathTex tex="M_{F_V,C}" />}
                    formula={<MathTex tex="-F_V \cdot (B_{BC} - x_{CP,B})" />}
                    substitution={
                      <MathTex
                        tex={`-${fmtBrTex(apC.F_V_total, 0)} \\cdot (${st.actualBaseWidth.toFixed(1)} - ${apC.x_cp_B.toFixed(1)})`}
                      />
                    }
                    result={<MathTex tex={fmtBrTex(Math.abs(apC.M_FV_C_por_metro * apC.larguraLongitudinal), 0)} />}
                    unit={<MathTex tex="\text{N}\cdot\text{m}" />}
                  />
                  <CalculationLine
                    theme="amber"
                    label="Momento Hidrostático Resultante em C (Anti-horário)"
                    symbol={<MathTex tex="M_{C,\text{hidro}}" />}
                    formula={<MathTex tex="F_{R,AB} \cdot d_{\perp,C} = |M_{F_H,C} + M_{F_V,C}|" />}
                    substitution={
                      <MathTex
                        tex={`${fmtBrTex(apC.F_R_total, 0)} \\cdot ${apC.braco_FR_C.toFixed(3)}`}
                      />
                    }
                    result={<MathTex tex={fmtBrTex(Math.abs(apC.M_hidro_C_total), 0)} />}
                    unit={<MathTex tex="\text{N}\cdot\text{m}" />}
                    isSubHeader
                  />
                </div>
              </section>

              {/* ETAPA 6 */}
              <section>
                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-6 h-px bg-slate-300 dark:bg-slate-700"></div>
                  Etapa 6 – Determinação do Peso Próprio da Barragem (W)
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="slate"
                    label="Volume Total de Concreto"
                    symbol={<MathTex tex="V_{\text{barragem}}" />}
                    formula={<MathTex tex="A_{\text{seção}} \cdot b" />}
                    substitution={
                      <MathTex tex={`${fmtBrTex(st.area, 0)} \\cdot ${apC.larguraLongitudinal.toFixed(0)}`} />
                    }
                    result={<MathTex tex={fmtBrTex(st.area * apC.larguraLongitudinal, 0)} />}
                    unit={<MathTex tex="\text{m}^3" />}
                  />
                  <CalculationLine
                    theme="slate"
                    label="Peso Próprio Total da Barragem"
                    symbol={<MathTex tex="W" />}
                    formula={<MathTex tex="\gamma_{\text{conc}} \cdot V_{\text{barragem}}" />}
                    substitution={
                      <MathTex
                        tex={`${fmtBrTex(gammaMat, 0)} \\cdot ${fmtBrTex(st.area * apC.larguraLongitudinal, 0)}`}
                      />
                    }
                    result={<MathTex tex={fmtBrTex(apC.W_total, 0)} />}
                    unit={<MathTex tex="\text{N}" />}
                    isSubHeader
                  />
                  <CalculationLine
                    theme="slate"
                    label="Posição Horizontal do CG (a partir de B)"
                    symbol={<MathTex tex="x_{CG,B}" />}
                    formula={<MathTex tex="\frac{2}{3} \cdot B_{BC}" />}
                    substitution={<MathTex tex={`\\frac{2}{3} \\cdot ${st.actualBaseWidth.toFixed(1)}`} />}
                    result={<MathTex tex={st.x_cg.toFixed(2)} />}
                    unit={<MathTex tex="\text{m}" />}
                  />
                  <CalculationLine
                    theme="slate"
                    label="Braço de Alavanca do Peso em relação a C"
                    symbol={<MathTex tex="b_{W,C}" />}
                    formula={<MathTex tex="B_{BC} - x_{CG,B} = \frac{1}{3} B_{BC}" />}
                    substitution={<MathTex tex={`${st.actualBaseWidth.toFixed(1)} - ${st.x_cg.toFixed(1)}`} />}
                    result={<MathTex tex={st.lever_arm_weight.toFixed(2)} />}
                    unit={<MathTex tex="\text{m}" />}
                  />
                  <CalculationLine
                    theme="slate"
                    label="Momento Estabilizante do Peso Próprio em C"
                    symbol={<MathTex tex="M_{W,C}" />}
                    formula={<MathTex tex="W \cdot b_{W,C}" />}
                    substitution={
                      <MathTex tex={`${fmtBrTex(apC.W_total, 0)} \\cdot ${st.lever_arm_weight.toFixed(2)}`} />
                    }
                    result={<MathTex tex={fmtBrTex(apC.M_W_C_total, 0)} />}
                    unit={<MathTex tex="\text{N}\cdot\text{m}" />}
                    isSubHeader
                  />
                </div>
              </section>

              {/* ETAPA 7 */}
              <section>
                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-6 h-px bg-emerald-300 dark:bg-emerald-800"></div>
                  Etapa 7 – Verificação Qualitativa Sem Percolação (Fundação Impermeável)
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-6 rounded-2xl border border-emerald-200/70 dark:border-emerald-900/50 space-y-3">
                  <CalculationLine
                    theme="emerald"
                    label="Momento Hidrostático em C (Anti-horário)"
                    symbol={<MathTex tex="M_{C,\text{hidro}}" />}
                    result={<MathTex tex={fmtBrTex(Math.abs(apC.M_hidro_C_total), 0)} />}
                    unit={<MathTex tex="\text{N}\cdot\text{m}" />}
                  />
                  <CalculationLine
                    theme="emerald"
                    label="Momento Resistente do Peso Próprio em C (Anti-horário)"
                    symbol={<MathTex tex="M_{W,C}" />}
                    result={<MathTex tex={fmtBrTex(apC.M_W_C_total, 0)} />}
                    unit={<MathTex tex="\text{N}\cdot\text{m}" />}
                  />
                  <div className="text-xs text-emerald-950 dark:text-emerald-100 leading-relaxed pt-2 border-t border-emerald-200/60 dark:border-emerald-800/50">
                    <strong>Resposta à pergunta do problema (Sem Percolação):</strong>{' '}
                    <strong>Não, a força hidrostática sobre AB não poderia tombar a barragem.</strong> Conforme a
                    resolução do livro de White, como o centro de pressão <MathTex tex="CP" /> (<MathTex tex="s_{CP} = 66{,}67\text{ m}" />)
                    situa-se abaixo da projeção perpendicular de <MathTex tex="C" /> sobre <MathTex tex="AB" /> (<MathTex tex="AD = 64{,}00\text{ m}" />),
                    a linha de ação de <MathTex tex="F_R" /> passa a <MathTex tex="d_{\perp,C} = 2{,}67\text{ m}" /> abaixo de <MathTex tex="D" />,
                    produzindo um momento resultante no sentido <strong>anti-horário</strong> em torno de <MathTex tex="C" /> (
                    <MathTex tex={`M_C = ${fmtBrTex(Math.abs(apC.M_hidro_C_total), 0)}\\text{ N}\\cdot\\text{m}`} />
                    ), o qual atua contra o tombamento para a direita (somando-se ao momento anti-horário do peso próprio <MathTex tex="W" />).
                  </div>
                </div>
              </section>

              {/* ETAPA 8 */}
              <section>
                <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-6 h-px bg-purple-300 dark:bg-purple-800"></div>
                  Etapa 8 – Efeito da Percolação sob a Fundação (Base BC)
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-purple-100 dark:border-purple-900/50">
                  <div className="mb-3 p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
                    <strong>Interpretação Física da Percolação:</strong> A percolação de água sob a barragem modifica a
                    distribuição das reações na base <MathTex tex="BC" /> e altera a avaliação da estabilidade ao gerar
                    uma força de subpressão vertical para cima (<MathTex tex="U" />). Adotando distribuição linear desde{' '}
                    <MathTex tex="p_B = \gamma_{\text{água}} \cdot h" /> em <MathTex tex="B" /> até <MathTex tex="p_C = 0" /> em{' '}
                    <MathTex tex="C" />:
                  </div>
                  <CalculationLine
                    theme="indigo"
                    label="Pressão de Subpressão no Pé de Montante B"
                    symbol={<MathTex tex="p_B" />}
                    formula={<MathTex tex="k_B \cdot \gamma_{\text{água}} \cdot h" />}
                    substitution={
                      <MathTex
                        tex={`${apC.subpressao.fatorMontante.toFixed(2)} \\cdot ${fmtBrTex(density * gravity, 0)} \\cdot ${hUp.toFixed(2)}`}
                      />
                    }
                    result={<MathTex tex={fmtBrTex(apC.subpressao.p_B, 0)} />}
                    unit={<MathTex tex="\text{Pa}" />}
                  />
                  <CalculationLine
                    theme="indigo"
                    label="Força Vertical de Subpressão sob a Base BC"
                    symbol={<MathTex tex="U" />}
                    formula={<MathTex tex="\frac{1}{2} \cdot (p_B + p_C) \cdot B_{BC} \cdot b" />}
                    substitution={
                      <MathTex
                        tex={`\\frac{1}{2} \\cdot ${fmtBrTex(apC.subpressao.p_B, 0)} \\cdot ${st.actualBaseWidth.toFixed(1)} \\cdot ${apC.larguraLongitudinal.toFixed(0)}`}
                      />
                    }
                    result={<MathTex tex={fmtBrTex(apC.subpressao.U_total, 0)} />}
                    unit={<MathTex tex="\text{N}" />}
                    isSubHeader
                  />
                  <CalculationLine
                    theme="indigo"
                    label="Posição do Centroide do Diagrama Triangular (de B)"
                    symbol={<MathTex tex="x_U" />}
                    formula={<MathTex tex="\frac{1}{3} \cdot B_{BC}" />}
                    substitution={<MathTex tex={`\\frac{1}{3} \\cdot ${st.actualBaseWidth.toFixed(1)}`} />}
                    result={<MathTex tex={apC.subpressao.x_U.toFixed(2)} />}
                    unit={<MathTex tex="\text{m}" />}
                  />
                  <CalculationLine
                    theme="indigo"
                    label="Momento de Subpressão (Braço B/3 = 20 m)"
                    symbol={<MathTex tex="M_{U,\text{ref}}" />}
                    formula={<MathTex tex="U \cdot \frac{B_{BC}}{3}" />}
                    substitution={
                      <MathTex
                        tex={`${fmtBrTex(apC.subpressao.U_total, 0)} \\cdot ${apC.subpressao.x_U.toFixed(2)}`}
                      />
                    }
                    result={<MathTex tex={fmtBrTex(apC.subpressao.M_U_ref_total, 0)} />}
                    unit={<MathTex tex="\text{N}\cdot\text{m}" />}
                    isSubHeader
                  />
                  <CalculationLine
                    theme="indigo"
                    label="Momento de Subpressão Medido até C (Braço 2B/3 = 40 m)"
                    symbol={<MathTex tex="M_{U,C}" />}
                    formula={<MathTex tex="U \cdot (B_{BC} - x_U)" />}
                    substitution={
                      <MathTex
                        tex={`${fmtBrTex(apC.subpressao.U_total, 0)} \\cdot ${apC.subpressao.braco_U_C.toFixed(2)}`}
                      />
                    }
                    result={<MathTex tex={fmtBrTex(apC.subpressao.M_U_C_total, 0)} />}
                    unit={<MathTex tex="\text{N}\cdot\text{m}" />}
                  />
                </div>
              </section>

              {/* ETAPA 9 */}
              <section>
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-6 h-px bg-blue-300 dark:bg-blue-800"></div>
                  Etapa 9 – Síntese dos Resultados (Largura Total 30 m vs Metro Linear 1 m)
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="bg-slate-50 dark:bg-slate-900/90 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                      <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-1">
                        Valores Totais para Largura b = {apC.larguraLongitudinal.toFixed(0)} m
                      </div>
                      <ul className="text-xs text-slate-700 dark:text-slate-200 space-y-1">
                        <li>
                          • Força Hidrostática (<MathTex tex="F_R" />):{' '}
                          <strong>{fmtBrTex(apC.F_R_total, 0)} N</strong> ({fmtTotalForceTex(apC.F_R_total)} kN)
                        </li>
                        <li>
                          • Componentes: <MathTex tex="F_H" /> = <strong>{fmtBrTex(apC.F_H_total, 0)} N</strong> |{' '}
                          <MathTex tex="F_V" /> = <strong>{fmtBrTex(apC.F_V_total, 0)} N</strong> (para baixo)
                        </li>
                        <li>
                          • Momento em C (<MathTex tex="M_C" />):{' '}
                          <strong>{fmtBrTex(Math.abs(apC.M_hidro_C_total), 0)} N·m</strong> (Anti-horário)
                        </li>
                        <li>
                          • Tombamento sem percolação: <strong>Não pode tombar (momento anti-horário)</strong>
                        </li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60">
                      <div className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-1">
                        Valores Equivalentes por Metro Linear (1 m)
                      </div>
                      <ul className="text-xs text-slate-700 dark:text-slate-200 space-y-1">
                        <li>
                          • Força Resultante (<MathTex tex="F_R / b" />):{' '}
                          <strong>{fmtBrTex(frUp / 1000, 0)} kN/m</strong>
                        </li>
                        <li>
                          • Componente Horizontal (<MathTex tex="F_H / b" />):{' '}
                          <strong>{fmtBrTex(fhUp / 1000, 0)} kN/m</strong>
                        </li>
                        <li>
                          • Componente Vertical (<MathTex tex="F_V / b" />):{' '}
                          <strong>{fmtBrTex(fvUp / 1000, 0)} kN/m</strong> (para baixo)
                        </li>
                        <li>
                          • Centro de Pressão: <MathTex tex="s_{CP} = 66{,}67\text{ m}" />,{' '}
                          <MathTex tex="h_p = 53{,}33\text{ m}" />, <MathTex tex="y_{CP} = 26{,}67\text{ m}" />
                        </li>
                      </ul>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>Interpretação Física:</strong> A inclinação da face de montante <MathTex tex="AB" /> faz
                    com que a componente vertical descendente <MathTex tex="F_V" /> produza um momento anti-horário em
                    relação a <MathTex tex="C" /> maior que o momento horário de <MathTex tex="F_H" />, resultando em um
                    momento hidrostático líquido anti-horário (<MathTex tex={`M_C = ${fmtBrTex(Math.abs(apC.M_hidro_C_total), 0)}\\text{ N}\\cdot\\text{m}`} />)
                    que não pode tombar a barragem para a direita na condição sem percolação. Caso ocorra percolação sob
                    a barragem, a subpressão na base <MathTex tex="BC" /> modifica a distribuição das reações na fundação
                    e introduz um momento horário tombante, alterando a avaliação da estabilidade.
                  </p>
                </div>
              </section>
            </div>
          )}

          <section>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-6 h-px bg-slate-200 dark:bg-slate-700"></div> Resumo Unitário por Metro Linear (1 m){' '}
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
            </h4>
            <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              <CalculationLine
                theme="slate"
                label="Peso Específico da Água"
                symbol={<MathTex tex="\gamma" />}
                formula={<MathTex tex="\rho \cdot g" />}
                substitution={<MathTex tex={`${density} \cdot ${gravity}`} />}
                result={<MathTex tex={(density * gravity).toFixed(0)} />}
                unit={<MathTex tex="\text{N/m}^3" />}
              />
              {st && (
                <>
                  <CalculationLine
                    theme="slate"
                    label="Área Efetiva da Seção"
                    symbol={<MathTex tex="A_{\text{seção}}" />}
                    result={<MathTex tex={st.area.toFixed(2)} />}
                    unit={<MathTex tex="\text{m}^2/\text{m}" />}
                  />
                  <CalculationLine
                    theme="slate"
                    label="Peso Próprio da Barragem"
                    symbol={<MathTex tex="W" />}
                    formula={<MathTex tex="A_{\text{seção}} \cdot \gamma_{\text{mat}}" />}
                    substitution={
                      <MathTex tex={`${st.area.toFixed(2)} \cdot ${(gammaMat / 1000).toFixed(1)}`} />
                    }
                    result={<MathTex tex={(st.weight / 1000).toFixed(2)} />}
                    unit={<MathTex tex="\text{kN/m}" />}
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
              <CalculationLine
                theme="blue"
                isSubHeader
                label={
                  <>
                    Montante (<MathTex tex={`\\theta = ${thetaUp.toFixed(1)}^\\circ`} />)
                  </>
                }
                symbol="Upstream"
                result=""
                unit=""
              />

              {mud ? (
                <>
                  <CalculationLine
                    theme="blue"
                    label="Camada de Água (Topo)"
                    symbol={<MathTex tex="h_{\text{água}}" />}
                    formula={<MathTex tex="H_{\text{up}} - h_{\text{lama}}" />}
                    substitution={<MathTex tex={`${hUp.toFixed(2)} - ${mud.mudHeight.toFixed(2)}`} />}
                    result={<MathTex tex={mud.waterHeight.toFixed(2)} />}
                    unit={<MathTex tex="\text{m}" />}
                  />
                  <CalculationLine
                    theme="blue"
                    label={
                      <>
                        Empuxo na Camada de Água (<MathTex tex="P'" />)
                      </>
                    }
                    symbol={<MathTex tex="P'" />}
                    formula={
                      <MathTex tex="\frac{1}{2} \cdot \gamma_{\text{água}} \cdot \frac{h_{\text{água}}^2}{\operatorname{sen}(\theta)}" />
                    }
                    substitution={
                      <MathTex
                        tex={`0.5 \\cdot ${gammaUnitVal} \\cdot \\frac{${mud.waterHeight.toFixed(2)}^2}{\\operatorname{sen}(${thetaUp.toFixed(1)}^\\circ)}`}
                      />
                    }
                    result={<MathTex tex={fmtF(mud.F_water)} />}
                    unit={<MathTex tex={unitFTex} />}
                  />
                  <CalculationLine
                    theme="blue"
                    label={
                      <>
                        Centro de Pressão de <MathTex tex="P'" /> (<MathTex tex="C'" /> do fundo)
                      </>
                    }
                    symbol={<MathTex tex="y_{C'}" />}
                    formula={<MathTex tex="h_{\text{lama}} + \frac{h_{\text{água}}}{3}" />}
                    substitution={
                      <MathTex tex={`${mud.mudHeight.toFixed(2)} + ${(mud.waterHeight / 3).toFixed(2)}`} />
                    }
                    result={<MathTex tex={mud.y_cp_water.toFixed(2)} />}
                    unit={<MathTex tex="\text{m}" />}
                  />
                  <CalculationLine
                    theme="amber"
                    label={
                      <>
                        Pressão na Interface (<MathTex tex={`y = ${mud.mudHeight.toFixed(2)}\\text{ m}`} />)
                      </>
                    }
                    symbol={<MathTex tex="p_{\text{int}}" />}
                    formula={<MathTex tex="\gamma_{\text{água}} \cdot h_{\text{água}}" />}
                    substitution={<MathTex tex={`${gammaUnitVal} \\cdot ${mud.waterHeight.toFixed(2)}`} />}
                    result={<MathTex tex={fmtP(mud.p_interface)} />}
                    unit={<MathTex tex={unitPTex} />}
                  />
                  <CalculationLine
                    theme="amber"
                    label="Parcela Retangular na Lama"
                    symbol={<MathTex tex="P''_{\text{ret}}" />}
                    formula={<MathTex tex="p_{\text{int}} \cdot \frac{h_{\text{lama}}}{\operatorname{sen}(\theta)}" />}
                    result={<MathTex tex={fmtF(mud.F_mud_rect)} />}
                    unit={<MathTex tex={unitFTex} />}
                  />
                  <CalculationLine
                    theme="amber"
                    label={
                      <>
                        Parcela Triangular na Lama (<MathTex tex={`\\rho = ${mud.mudDensity}\\text{ kg/m}^3`} />)
                      </>
                    }
                    symbol={<MathTex tex="P''_{\text{tri}}" />}
                    formula={
                      <MathTex tex="\frac{1}{2} \cdot \gamma_{\text{lama}} \cdot \frac{h_{\text{lama}}^2}{\operatorname{sen}(\theta)}" />
                    }
                    result={<MathTex tex={fmtF(mud.F_mud_tri)} />}
                    unit={<MathTex tex={unitFTex} />}
                  />
                  <CalculationLine
                    theme="amber"
                    label={
                      <>
                        Empuxo na Camada de Lama (<MathTex tex="P''" />)
                      </>
                    }
                    symbol={<MathTex tex="P''" />}
                    formula={<MathTex tex="P''_{\text{ret}} + P''_{\text{tri}}" />}
                    substitution={<MathTex tex={`${fmtF(mud.F_mud_rect)} + ${fmtF(mud.F_mud_tri)}`} />}
                    result={<MathTex tex={fmtF(mud.F_mud)} />}
                    unit={<MathTex tex={unitFTex} />}
                  />
                  <CalculationLine
                    theme="amber"
                    label={
                      <>
                        Centro de Pressão de <MathTex tex="P''" /> (<MathTex tex="C''" /> do fundo)
                      </>
                    }
                    symbol={<MathTex tex="y_{C''}" />}
                    result={<MathTex tex={mud.y_cp_mud.toFixed(2)} />}
                    unit={<MathTex tex="\text{m}" />}
                  />
                  <CalculationLine
                    theme="blue"
                    label={
                      <>
                        Empuxo Total a Montante (<MathTex tex="P = P' + P''" />)
                      </>
                    }
                    symbol={<MathTex tex="F_{R,\text{up}}" />}
                    formula={<MathTex tex="P' + P''" />}
                    substitution={<MathTex tex={`${fmtF(mud.F_water)} + ${fmtF(mud.F_mud)}`} />}
                    result={<MathTex tex={fmtF(frUp)} />}
                    unit={<MathTex tex={unitFTex} />}
                  />
                  <CalculationLine
                    theme="blue"
                    label="Centro de Pressão Total (do fundo)"
                    symbol={<MathTex tex="y_{\text{cp},\text{up}}" />}
                    formula={<MathTex tex="\frac{P' \cdot y_{C'} + P'' \cdot y_{C''}}{F_{R,\text{up}}}" />}
                    result={<MathTex tex={(fd.up?.y_cp ?? 0).toFixed(2)} />}
                    unit={<MathTex tex="\text{m}" />}
                  />
                </>
              ) : (
                <>
                  <CalculationLine
                    theme="blue"
                    label="Área Molhada (Montante)"
                    symbol={<MathTex tex="A_{\text{up}}" />}
                    formula={<MathTex tex="\frac{h_{\text{up}}}{\operatorname{sen}(\theta)}" />}
                    substitution={
                      <MathTex tex={`${hUp.toFixed(2)} / \\operatorname{sen}(${thetaUp.toFixed(1)}^\\circ)`} />
                    }
                    result={<MathTex tex={(fd.up?.area ?? 0).toFixed(2)} />}
                    unit={<MathTex tex="\text{m}^2/\text{m}" />}
                  />
                  <CalculationLine
                    theme="blue"
                    label="Prof. Centro de Gravidade"
                    symbol={<MathTex tex="h_{\text{cg},\text{up}}" />}
                    formula={<MathTex tex="\frac{h_{\text{up}}}{2}" />}
                    substitution={<MathTex tex={`${hUp.toFixed(2)} / 2`} />}
                    result={<MathTex tex={(fd.up?.h_cg ?? 0).toFixed(2)} />}
                    unit={<MathTex tex="\text{m}" />}
                  />
                  <CalculationLine
                    theme="blue"
                    label="Força Normal à Face (Montante)"
                    symbol={<MathTex tex="F_{R,\text{up}}" />}
                    formula={<MathTex tex="\gamma \cdot h_{\text{cg},\text{up}} \cdot A_{\text{up}}" />}
                    substitution={
                      <MathTex
                        tex={`${gammaUnitVal} \\cdot ${(fd.up?.h_cg ?? 0).toFixed(2)} \\cdot ${(fd.up?.area ?? 0).toFixed(2)}`}
                      />
                    }
                    result={<MathTex tex={fmtF(frUp)} />}
                    unit={<MathTex tex={unitFTex} />}
                  />
                  <CalculationLine
                    theme="blue"
                    label="Componente Horizontal (Montante)"
                    symbol={<MathTex tex="F_{H,\text{up}}" />}
                    formula={<MathTex tex="F_{R,\text{up}} \cdot \operatorname{sen}(\theta)" />}
                    substitution={
                      <MathTex tex={`${fmtF(frUp)} \\cdot \\operatorname{sen}(${thetaUp.toFixed(1)}^\\circ)`} />
                    }
                    result={<MathTex tex={fmtF(fhUp)} />}
                    unit={<MathTex tex={unitFTex} />}
                  />
                  <CalculationLine
                    theme="blue"
                    label="Componente Vertical (Montante)"
                    symbol={<MathTex tex="F_{V,\text{up}}" />}
                    formula={<MathTex tex="F_{R,\text{up}} \cdot \cos(\theta)" />}
                    substitution={
                      <MathTex tex={`${fmtF(frUp)} \\cdot \\cos(${thetaUp.toFixed(1)}^\\circ)`} />
                    }
                    result={<MathTex tex={fmtF(fvUp)} />}
                    unit={<MathTex tex={unitFTex} />}
                  />
                  <CalculationLine
                    theme="blue"
                    label="Centro de Pressão (do fundo / da superfície)"
                    symbol={<MathTex tex="y_{\text{cp},\text{up}}" />}
                    formula={<MathTex tex="\frac{h_{\text{up}}}{3}\;\left(h_{\text{cp}} = \frac{2\cdot h_{\text{up}}}{3}\right)" />}
                    substitution={
                      <MathTex
                        tex={`${hUp.toFixed(2)} / 3\\;\\left(h_{\\text{cp}} = ${(fd.up?.h_cp ?? 0).toFixed(2)}\\text{ m}\\right)`}
                      />
                    }
                    result={<MathTex tex={(fd.up?.y_cp ?? 0).toFixed(2)} />}
                    unit={<MathTex tex="\text{m}" />}
                  />
                </>
              )}

              {hDown > 0 && fd.down && (
                <>
                  <div className="mt-4 pt-2"></div>
                  <CalculationLine
                    theme="indigo"
                    isSubHeader
                    label={
                      <>
                        Jusante (<MathTex tex={`\\theta_{\\text{jus}} = ${thetaDown.toFixed(1)}^\\circ`} /> |{' '}
                        <MathTex tex={`${(90 - thetaDown).toFixed(1)}^\\circ`} /> c/ vertical)
                      </>
                    }
                    symbol="Downstream"
                    result=""
                    unit=""
                  />
                  <CalculationLine
                    theme="indigo"
                    label="Área / Comprimento Molhado (Jusante)"
                    symbol={<MathTex tex="A_{\text{down}}" />}
                    formula={<MathTex tex="\frac{h_{\text{down}}}{\operatorname{sen}(\theta_{\text{jus}})}" />}
                    substitution={
                      <MathTex tex={`${hDown.toFixed(2)} / \\operatorname{sen}(${thetaDown.toFixed(1)}^\\circ)`} />
                    }
                    result={<MathTex tex={(fd.down.area ?? 0).toFixed(2)} />}
                    unit={<MathTex tex="\text{m}^2/\text{m}" />}
                  />
                  <CalculationLine
                    theme="indigo"
                    label="Força Normal à Face (Jusante)"
                    symbol={<MathTex tex="F_{R,\text{down}}" />}
                    formula={<MathTex tex="\gamma \cdot h_{\text{cg},\text{down}} \cdot A_{\text{down}}" />}
                    substitution={
                      <MathTex
                        tex={`${gammaUnitVal} \\cdot ${(fd.down.h_cg ?? 0).toFixed(2)} \\cdot ${(fd.down.area ?? 0).toFixed(2)}`}
                      />
                    }
                    result={<MathTex tex={fmtF(frDown)} />}
                    unit={<MathTex tex={unitFTex} />}
                  />
                  <CalculationLine
                    theme="indigo"
                    label="Componente Horizontal (Jusante)"
                    symbol={<MathTex tex="F_{H,\text{down}}" />}
                    formula={<MathTex tex="F_{R,\text{down}} \cdot \operatorname{sen}(\theta_{\text{jus}})" />}
                    result={<MathTex tex={fmtF(fhDown)} />}
                    unit={<MathTex tex={unitFTex} />}
                  />
                  <CalculationLine
                    theme="indigo"
                    label="Componente Vertical (Jusante)"
                    symbol={<MathTex tex="F_{V,\text{down}}" />}
                    formula={<MathTex tex="F_{R,\text{down}} \cdot \cos(\theta_{\text{jus}})" />}
                    result={<MathTex tex={fmtF(fvDown)} />}
                    unit={<MathTex tex={unitFTex} />}
                  />
                  <CalculationLine
                    theme="indigo"
                    label="Centro de Pressão ao Longo da Face (da sup.)"
                    symbol={<MathTex tex="s_{\text{cp},\text{down}}" />}
                    formula={<MathTex tex="\frac{2}{3} \cdot L_{\text{molhado}}" />}
                    substitution={<MathTex tex={`\\frac{2}{3} \\cdot ${(fd.down.wetLength ?? 0).toFixed(2)}`} />}
                    result={<MathTex tex={(fd.down.s_cp ?? 0).toFixed(2)} />}
                    unit={<MathTex tex="\text{m}" />}
                  />
                  <CalculationLine
                    theme="indigo"
                    label="Altura Vertical do CP (Jusante, do fundo)"
                    symbol={<MathTex tex="y_{\text{cp},\text{down}}" />}
                    formula={<MathTex tex="\frac{h_{\text{down}}}{3}" />}
                    substitution={<MathTex tex={`${hDown.toFixed(2)} / 3`} />}
                    result={<MathTex tex={(fd.down.y_cp ?? 0).toFixed(2)} />}
                    unit={<MathTex tex="\text{m}" />}
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
                symbol={<MathTex tex="F_{H,\text{net}}" />}
                formula={<MathTex tex="F_{H,\text{up}} - F_{H,\text{down}}" />}
                substitution={<MathTex tex={`${fmtF(fhUp)} - ${fmtF(fhDown)}`} />}
                result={<MathTex tex={fmtF(fd.FH_net)} />}
                unit={<MathTex tex={unitFTex} />}
              />
              <CalculationLine
                theme="cyan"
                label="Resultante Vertical (Água sobre faces)"
                symbol={<MathTex tex="F_{V,\text{net}}" />}
                formula={<MathTex tex="F_{V,\text{up}} + F_{V,\text{down}}" />}
                substitution={<MathTex tex={`${fmtF(fvUp)} + ${fmtF(fvDown)}`} />}
                result={<MathTex tex={fmtF(fd.FV_net)} />}
                unit={<MathTex tex={unitFTex} />}
              />
              <CalculationLine
                theme="cyan"
                label="Módulo da Resultante Vetorial"
                symbol={<MathTex tex="F_{R,\text{net}}" />}
                formula={<MathTex tex="\sqrt{F_{H,\text{net}}^2 + F_{V,\text{net}}^2}" />}
                substitution={
                  <MathTex tex={`\\sqrt{${fmtF(fd.FH_net)}^2 + ${fmtF(fd.FV_net)}^2}`} />
                }
                result={<MathTex tex={fmtF(Math.abs(fd.FR_net))} />}
                unit={<MathTex tex={unitFTex} />}
                isSubHeader
              />
              <CalculationLine
                theme="cyan"
                label="Altura do CP Horizontal Líquido"
                symbol={<MathTex tex="y_{\text{cp},\text{net}}" />}
                formula={<MathTex tex="\frac{\Sigma M_H}{F_{H,\text{net}}}" />}
                substitution={
                  <MathTex
                    tex={`${(fd.moment_total / 1000).toFixed(2)} / ${(fd.FH_net / 1000).toFixed(2)}`}
                  />
                }
                result={<MathTex tex={fd.y_cp_net.toFixed(2)} />}
                unit={<MathTex tex="\text{m}" />}
              />
            </div>
          </section>

          {st && !isTriangular3DMode && (
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
                    symbol={<MathTex tex="N_{\text{arco}}" />}
                    formula={<MathTex tex="p_{\text{máx}} \cdot R" />}
                    substitution={
                      <MathTex
                        tex={`${(fd.p_max_up / 1000).toFixed(2)} \\cdot ${(analyzedResults.normalizedInputs.archRadius ?? 30).toFixed(1)}`}
                      />
                    }
                    result={<MathTex tex={((st.archThrust ?? 0) / 1000).toFixed(2)} />}
                    unit={<MathTex tex="\text{kN/m}" />}
                  />
                  <CalculationLine
                    theme="blue"
                    label="Tensão Média de Compressão na Base"
                    symbol={<MathTex tex="\sigma_{\text{arco}}" />}
                    formula={<MathTex tex="\frac{N_{\text{arco}}}{B_{\text{base}}}" />}
                    substitution={
                      <MathTex
                        tex={`${((st.archThrust ?? 0) / 1000).toFixed(2)} / ${st.actualBaseWidth.toFixed(2)}`}
                      />
                    }
                    result={<MathTex tex={((st.archStressBase ?? 0) / 1e6).toFixed(2)} />}
                    unit={<MathTex tex="\text{MPa}" />}
                  />
                  <p className="text-xs text-slate-600 dark:text-slate-300 pt-2">
                    Em barragens em arco, a estabilidade não depende apenas do peso próprio da seção 2D; o
                    carregamento hidrostático é transferido por compressão em arco para as ombreiras rochosas do vale.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/40">
                    <CalculationLine
                      theme="emerald"
                      isSubHeader
                      label="Tombamento (Pé de Jusante)"
                      symbol="Overturning"
                      result=""
                      unit=""
                    />
                    <CalculationLine
                      theme="emerald"
                      label="Braço Real do Peso"
                      symbol={<MathTex tex="b_W" />}
                      formula={<MathTex tex="B - x_{\text{cg}}" />}
                      substitution={
                        <MathTex tex={`${st.actualBaseWidth.toFixed(2)} - ${st.x_cg.toFixed(2)}`} />
                      }
                      result={<MathTex tex={st.lever_arm_weight.toFixed(2)} />}
                      unit={<MathTex tex="\text{m}" />}
                    />
                    <CalculationLine
                      theme="emerald"
                      label={
                        <>
                          Momento Estabilizante (<MathTex tex="W + F_V" />)
                        </>
                      }
                      symbol={<MathTex tex="M_{\text{est}}" />}
                      formula={<MathTex tex="W \cdot b_W + \Sigma(F_V \cdot b_V)" />}
                      substitution={
                        <MathTex
                          tex={`${((st.weight * st.lever_arm_weight) / 1000).toFixed(1)} + ${(st.moment_resisting_water_v / 1000).toFixed(1)}`}
                        />
                      }
                      result={<MathTex tex={(st.moment_resisting / 1000).toFixed(2)} />}
                      unit={<MathTex tex="\text{kN}\cdot\text{m/m}" />}
                    />
                    <CalculationLine
                      theme="emerald"
                      label="Momento Tombador"
                      symbol={<MathTex tex="M_{\text{tomb}}" />}
                      formula={<MathTex tex="|F_{H,\text{net}}| \cdot y_{\text{cp},\text{net}}" />}
                      substitution={
                        <MathTex
                          tex={`${(Math.abs(fd.FH_net) / 1000).toFixed(2)} \\cdot ${fd.y_cp_net.toFixed(2)}`}
                        />
                      }
                      result={<MathTex tex={(st.moment_overturning / 1000).toFixed(2)} />}
                      unit={<MathTex tex="\text{kN}\cdot\text{m/m}" />}
                    />
                    <CalculationLine
                      theme="emerald"
                      label="Fator de Segurança (Tomb.)"
                      symbol={<MathTex tex="FS_{\text{tomb}}" />}
                      formula={<MathTex tex="\frac{M_{\text{est}}}{M_{\text{tomb}}}" />}
                      substitution={
                        <MathTex
                          tex={`${(st.moment_resisting / 1000).toFixed(2)} / ${(st.moment_overturning / 1000).toFixed(2)}`}
                        />
                      }
                      result={<MathTex tex={st.fs_tomb.toFixed(2)} />}
                      unit=""
                      isSubHeader
                    />
                  </div>

                  <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/40">
                    <CalculationLine
                      theme="emerald"
                      isSubHeader
                      label="Deslizamento"
                      symbol="Sliding"
                      result=""
                      unit=""
                    />
                    <CalculationLine
                      theme="emerald"
                      label="Coeficiente de Atrito"
                      symbol={<MathTex tex="\mu" />}
                      result={<MathTex tex={mu.toFixed(2)} />}
                      unit=""
                    />
                    <CalculationLine
                      theme="emerald"
                      label="Resultante Vertical Total"
                      symbol={<MathTex tex="\Sigma V" />}
                      formula={<MathTex tex="W + F_{V,\text{net}}" />}
                      substitution={
                        <MathTex tex={`${(st.weight / 1000).toFixed(2)} + ${(fd.FV_net / 1000).toFixed(2)}`} />
                      }
                      result={<MathTex tex={(st.total_vertical_force / 1000).toFixed(2)} />}
                      unit={<MathTex tex="\text{kN/m}" />}
                    />
                    <CalculationLine
                      theme="emerald"
                      label="Força Resistente"
                      symbol={<MathTex tex="F_{\text{res}}" />}
                      formula={<MathTex tex="\mu \cdot \Sigma V" />}
                      substitution={
                        <MathTex
                          tex={`${mu.toFixed(2)} \\cdot ${(st.total_vertical_force / 1000).toFixed(2)}`}
                        />
                      }
                      result={<MathTex tex={((st.total_vertical_force * mu) / 1000).toFixed(2)} />}
                      unit={<MathTex tex="\text{kN/m}" />}
                    />
                    <CalculationLine
                      theme="emerald"
                      label="Fator de Segurança (Desl.)"
                      symbol={<MathTex tex="FS_{\text{desl}}" />}
                      formula={<MathTex tex="\frac{F_{\text{res}}}{|F_{H,\text{net}}|}" />}
                      substitution={
                        <MathTex
                          tex={`${((st.total_vertical_force * mu) / 1000).toFixed(2)} / ${(Math.abs(fd.FH_net) / 1000).toFixed(2)}`}
                        />
                      }
                      result={<MathTex tex={st.fs_desl.toFixed(2)} />}
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
