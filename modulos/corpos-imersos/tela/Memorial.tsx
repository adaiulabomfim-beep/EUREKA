import React from 'react';
import { FileText } from 'lucide-react';
import { CalculationLine } from '@/src/components/ui/CalculationLine';
import { MathTex, RichMathText, texNum } from '@/src/components/ui/MathTex';

export { CalculationLine };

interface MemorialProps {
  physics: any;
  geom: any;
  gravity: number;
  tankWidth: number;
  tankDepth: number;
  enableTwoFluids: boolean;
  onClose: () => void;
  activeExerciseId?: string | null;
  enunciado?: string | null;
}

const fmtForceTex = (valN: number) =>
  `${(valN / 1000).toFixed(2)}\\text{ kN}\\;(${valN.toFixed(1)}\\text{ N})`;

const toGeomTex = (expr?: string | React.ReactNode): React.ReactNode => {
  if (!expr) return expr;
  if (typeof expr !== 'string') return expr;

  let tex = expr.trim();
  if (tex.startsWith('4/3')) {
    tex = `\\frac{4}{3}${tex.slice(3)}`;
  }
  tex = tex
    .replace(/·/g, '\\cdot ')
    .replace(/π/g, '\\pi ')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3');

  return <MathTex tex={tex} />;
};

export const Memorial: React.FC<MemorialProps> = ({
  physics,
  geom,
  gravity,
  tankWidth,
  tankDepth,
  enableTwoFluids,
  onClose,
  activeExerciseId,
  enunciado,
}) => {
  const totalVolume = physics.volume + (physics.volume2 || 0);
  const effectiveRho = physics.equivalentDensity ?? physics.objectDensity ?? 0;
  const objRhoDisplay = Number.isInteger(physics.objectDensity)
    ? String(physics.objectDensity)
    : Number(physics.objectDensity || 0).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl w-[95vw] lg:w-[75vw] h-[95vh] lg:h-[75vh] overflow-y-auto rounded-3xl shadow-2xl border border-blue-100 dark:border-slate-800 animate-in slide-in-from-bottom-10 zoom-in-95 duration-300 relative flex flex-col">
        <div className="sticky top-0 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border-b border-blue-50 dark:border-slate-800 p-6 flex items-center justify-between z-10 transition-colors">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tight">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200 dark:shadow-none">
              <FileText className="w-5 h-5" />
            </div>
            Memorial de Cálculo
          </h3>
          <button
            onClick={onClose}
            className="text-[10px] font-black text-slate-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all uppercase tracking-widest border border-slate-200/60 dark:border-slate-700 cursor-pointer"
          >
            Fechar
          </button>
        </div>

        <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-950/60">
          {enunciado && (
            <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 block mb-1">
                Enunciado da Simulação ({activeExerciseId?.toUpperCase()})
              </span>
              <RichMathText text={enunciado} />
            </div>
          )}

          {physics.inverseSpecificWeightMode ? (
            <>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong className="text-slate-800 dark:text-slate-100">Observação sobre a geometria:</strong> o enunciado não fornece as dimensões geométricas do bloco. O sólido exibido na cena é apenas uma representação ilustrativa de volume equivalente ao volume deslocado calculado (<MathTex tex={`V = ${texNum(physics.vol_deslocado.toFixed(5))}\\text{ m}^3`} />), mantido totalmente imerso sem contato com o fundo ou com as paredes.
              </div>

              <section>
                <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-emerald-200 dark:bg-emerald-800"></div> ETAPA 1 – Determinação do Empuxo{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="red"
                    label={<>Peso Real no Ar (<MathTex tex="P" />)</>}
                    symbol={<MathTex tex="P" />}
                    result={<MathTex tex={`${texNum(physics.objectWeight.toFixed(1))}\\text{ N}`} />}
                    unit=""
                  />
                  <CalculationLine
                    theme="blue"
                    label={<>Peso Aparente na Água (<MathTex tex="P_{\text{ap}}" />)</>}
                    symbol={<MathTex tex="P_{\text{ap}}" />}
                    result={<MathTex tex={`${texNum(physics.apparentWeight.toFixed(1))}\\text{ N}`} />}
                    unit=""
                  />
                  <CalculationLine
                    theme="emerald"
                    label={<>Empuxo Exercido pelo Fluido (<MathTex tex="E" />)</>}
                    symbol={<MathTex tex="E" />}
                    formula={<MathTex tex="P - P_{\text{ap}}" />}
                    substitution={
                      <MathTex
                        tex={`${texNum(physics.objectWeight.toFixed(1))} - ${texNum(physics.apparentWeight.toFixed(1))}`}
                      />
                    }
                    result={<MathTex tex={`${texNum(physics.buoyancyForce.toFixed(1))}\\text{ N}`} />}
                    unit=""
                    isSubHeader
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-cyan-200 dark:bg-cyan-800"></div> ETAPA 2 – Determinação do Volume Deslocado{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="cyan"
                    label={<>Peso Específico do Fluido (<MathTex tex="\gamma_f" />)</>}
                    symbol={<MathTex tex="\gamma_f" />}
                    result={<MathTex tex={`${texNum((physics.fluidSpecificWeight ?? 9802).toFixed(0))}\\text{ N/m}^3`} />}
                    unit=""
                  />
                  <CalculationLine
                    theme="cyan"
                    label={<>Princípio de Arquimedes (Corpo Totalmente Imerso)</>}
                    symbol={<MathTex tex="V" />}
                    formula={<MathTex tex="E = \gamma_f \cdot V \;\Rightarrow\; V = \frac{E}{\gamma_f}" />}
                    substitution={
                      <MathTex
                        tex={`\\frac{${texNum(physics.buoyancyForce.toFixed(1))}}{${texNum((physics.fluidSpecificWeight ?? 9802).toFixed(0))}}`}
                      />
                    }
                    result={
                      <MathTex
                        tex={`${texNum(physics.vol_deslocado.toFixed(5))}\\text{ m}^3\\;(${texNum((physics.vol_deslocado * 1000).toFixed(2))}\\text{ L})`}
                      />
                    }
                    unit=""
                    isSubHeader
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-purple-200 dark:bg-purple-800"></div> ETAPA 3 – Determinação do Peso Específico do Bloco{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="purple"
                    label={<>Peso Específico Médio do Bloco (<MathTex tex="\gamma_c" />)</>}
                    symbol={<MathTex tex="\gamma_c" />}
                    formula={<MathTex tex="\frac{P}{V}" />}
                    substitution={
                      <MathTex
                        tex={`\\frac{${texNum(physics.objectWeight.toFixed(1))}}{${texNum(physics.vol_deslocado.toFixed(5))}}`}
                      />
                    }
                    result={
                      <MathTex
                        tex={`${texNum(Math.round(physics.objectSpecificWeight || 0).toLocaleString('pt-BR'))}\\text{ N/m}^3\\;(${texNum(((physics.objectSpecificWeight || 0) / 1000).toFixed(3))}\\text{ kN/m}^3)`}
                      />
                    }
                    unit=""
                    isSubHeader
                  />
                  <CalculationLine
                    theme="slate"
                    label={<>Densidade Aproximada do Material (<MathTex tex="\rho_c" /> — complementar)</>}
                    symbol={<MathTex tex="\rho_c" />}
                    formula={<MathTex tex="\frac{\gamma_c}{g}" />}
                    substitution={
                      <MathTex
                        tex={`\\frac{${texNum(Math.round(physics.objectSpecificWeight || 0).toLocaleString('pt-BR'))}}{${texNum(gravity.toFixed(2))}}`}
                      />
                    }
                    result={
                      <MathTex
                        tex={`${texNum(Math.round(physics.objectDensity || 0).toLocaleString('pt-BR'))}\\text{ kg/m}^3`}
                      />
                    }
                    unit=""
                  />
                </div>
              </section>
            </>
          ) : (
            <>
          <section>
            <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-6 h-px bg-slate-200 dark:bg-slate-700"></div> Geometria & Massa{' '}
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
            </h4>
            <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              {physics.twoBlocks ? (
                <>
                  <CalculationLine
                    theme="slate"
                    label="Volume Bloco 1 (Superior)"
                    symbol={<MathTex tex="V_1" />}
                    formula={toGeomTex(geom.formula)}
                    substitution={toGeomTex(geom.substitution)}
                    result={<MathTex tex={physics.volume.toFixed(4)} />}
                    unit={<MathTex tex="\text{m}^3" />}
                  />
                  <CalculationLine
                    theme="slate"
                    label="Volume Bloco 2 (Inferior)"
                    symbol={<MathTex tex="V_2" />}
                    result={<MathTex tex={(physics.volume2 || 0).toFixed(4)} />}
                    unit={<MathTex tex="\text{m}^3" />}
                  />
                  <CalculationLine
                    theme="slate"
                    label="Volume Total do Sistema"
                    symbol={<MathTex tex="V" />}
                    formula={<MathTex tex="V_1 + V_2" />}
                    substitution={
                      <MathTex tex={`${physics.volume.toFixed(4)} + ${(physics.volume2 || 0).toFixed(4)}`} />
                    }
                    result={<MathTex tex={totalVolume.toFixed(4)} />}
                    unit={<MathTex tex="\text{m}^3" />}
                  />
                  <CalculationLine
                    theme="slate"
                    label="Massa Bloco 1"
                    symbol={<MathTex tex="m_1" />}
                    formula={<MathTex tex="\rho_1 \cdot V_1" />}
                    result={<MathTex tex={(physics.objectMass1 ?? physics.objectMass).toFixed(2)} />}
                    unit={<MathTex tex="\text{kg}" />}
                  />
                  <CalculationLine
                    theme="slate"
                    label="Massa Bloco 2"
                    symbol={<MathTex tex="m_2" />}
                    formula={<MathTex tex="\rho_2 \cdot V_2" />}
                    result={<MathTex tex={(physics.objectMass2 || 0).toFixed(2)} />}
                    unit={<MathTex tex="\text{kg}" />}
                  />
                  <CalculationLine
                    theme="slate"
                    label="Densidade Equivalente"
                    symbol={<MathTex tex="\rho_{\text{eq}}" />}
                    formula={<MathTex tex="\frac{m_{\text{total}}}{V_{\text{total}}}" />}
                    result={<MathTex tex={effectiveRho.toFixed(2)} />}
                    unit={<MathTex tex="\text{kg/m}^3" />}
                  />
                </>
              ) : (
                <>
                  <CalculationLine
                    theme="slate"
                    label={
                      <>
                        Volume Total (<MathTex tex="V" />)
                      </>
                    }
                    symbol={<MathTex tex="V" />}
                    formula={toGeomTex(geom.formula)}
                    substitution={toGeomTex(geom.substitution)}
                    result={<MathTex tex={totalVolume.toFixed(4)} />}
                    unit={<MathTex tex="\text{m}^3" />}
                  />
                  <CalculationLine
                    theme="slate"
                    label={
                      <>
                        Massa do Objeto (<MathTex tex="m" />)
                      </>
                    }
                    symbol={<MathTex tex="m" />}
                    formula={<MathTex tex="\rho \cdot V" />}
                    substitution={<MathTex tex={`${objRhoDisplay} \cdot ${totalVolume.toFixed(4)}`} />}
                    result={<MathTex tex={(physics.objectMass1 ?? physics.objectMass).toFixed(2)} />}
                    unit={<MathTex tex="\text{kg}" />}
                  />
                </>
              )}

              {physics.extraWeight > 0 && (
                <>
                  <CalculationLine
                    theme="amber"
                    label={
                      <>
                        Peso do Corpo (<MathTex tex="P_{\text{corpo}}" />)
                      </>
                    }
                    symbol={<MathTex tex="P_{\text{corpo}}" />}
                    formula={<MathTex tex="m \cdot g" />}
                    result={<MathTex tex={fmtForceTex(physics.objectWeight - physics.extraWeight)} />}
                    unit=""
                  />
                  <CalculationLine
                    theme="amber"
                    label={
                      <>
                        Carga Extra Adicional (<MathTex tex="P_{\text{extra}}" />)
                      </>
                    }
                    symbol={<MathTex tex="P_{\text{extra}}" />}
                    result={<MathTex tex={fmtForceTex(physics.extraWeight)} />}
                    unit=""
                  />
                  <CalculationLine
                    theme="slate"
                    label="Densidade Efetiva c/ Carga"
                    symbol={<MathTex tex="\rho_{\text{ef}}" />}
                    formula={<MathTex tex="\frac{P_{\text{total}} / g}{V}" />}
                    result={<MathTex tex={effectiveRho.toFixed(2)} />}
                    unit={<MathTex tex="\text{kg/m}^3" />}
                  />
                </>
              )}

              <CalculationLine
                theme="red"
                label={
                  <>
                    Peso Real Total (<MathTex tex="P" />)
                  </>
                }
                symbol={<MathTex tex="P" />}
                formula={
                  physics.extraWeight > 0 ? (
                    <MathTex tex="P_{\text{corpo}} + P_{\text{extra}}" />
                  ) : (
                    <MathTex tex="m \cdot g" />
                  )
                }
                substitution={
                  physics.extraWeight > 0 ? (
                    <MathTex
                      tex={`${(physics.objectWeight - physics.extraWeight).toFixed(1)} + ${physics.extraWeight.toFixed(1)}\text{ N}`}
                    />
                  ) : (
                    <MathTex tex={`${physics.objectMass.toFixed(2)} \cdot ${gravity}`} />
                  )
                }
                result={<MathTex tex={fmtForceTex(physics.objectWeight)} />}
                unit=""
                isSubHeader
              />
            </div>
          </section>

          <section>
            <h4 className="text-[10px] font-black text-cyan-500 dark:text-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-6 h-px bg-cyan-200 dark:bg-cyan-800"></div> Hidrostática & Deslocamento{' '}
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
            </h4>
            <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              <CalculationLine
                theme="cyan"
                label="Volume Deslocado Total"
                symbol={<MathTex tex="V_{\text{desl}}" />}
                formula={
                  enableTwoFluids ? (
                    <MathTex tex="V_{\text{sub},A} + V_{\text{sub},B}" />
                  ) : (
                    <MathTex tex="V_{\text{sub}}" />
                  )
                }
                result={
                  <MathTex
                    tex={`${physics.vol_deslocado.toFixed(6)}\text{ m}^3\\;(${(physics.vol_deslocado * 1000).toFixed(2)}\text{ L})`}
                  />
                }
                unit=""
              />
              <CalculationLine
                theme="cyan"
                label="Área da Base do Tanque"
                symbol={<MathTex tex="A_{\text{tanque}}" />}
                formula={<MathTex tex="L \cdot P" />}
                substitution={
                  <MathTex tex={`${(tankWidth / 100).toFixed(2)} \cdot ${(tankDepth / 100).toFixed(2)}`} />
                }
                result={<MathTex tex={physics.tankBaseArea.toFixed(3)} />}
                unit={<MathTex tex="\text{m}^2" />}
              />
              <CalculationLine
                theme="cyan"
                label={
                  <>
                    Elevação do Nível (<MathTex tex="\Delta h" />)
                  </>
                }
                symbol={<MathTex tex="\Delta h" />}
                formula={<MathTex tex="\frac{V_{\text{desl}}}{A_{\text{tanque}}}" />}
                substitution={
                  <MathTex tex={`${physics.vol_deslocado.toFixed(4)} / ${physics.tankBaseArea.toFixed(2)}`} />
                }
                result={
                  <MathTex
                    tex={`${physics.deltaH_cm.toFixed(2)}\text{ cm}\\;(${(physics.deltaH_cm / 100).toFixed(4)}\text{ m})`}
                  />
                }
                unit=""
                isSubHeader
              />

              <h5 className="text-[10px] font-bold text-cyan-900 dark:text-cyan-300 uppercase mt-8 mb-3">
                Cálculo das Forças e Submersão
              </h5>
              <CalculationLine
                theme="cyan"
                label="Altura Submersa Total (Calado)"
                symbol={<MathTex tex="h_{\text{sub}}" />}
                result={
                  <MathTex
                    tex={`${physics.h_sub_actual.toFixed(2)}\text{ cm}\\;(${(physics.h_sub_actual / 100).toFixed(4)}\text{ m})`}
                  />
                }
                unit=""
              />

              <h5 className="text-[10px] font-bold text-cyan-900 dark:text-cyan-300 uppercase mt-6 mb-3">
                {enableTwoFluids ? 'Fluido A (Camada Superior)' : 'Fluido Principal'}
              </h5>
              {enableTwoFluids && (
                <CalculationLine
                  theme="cyan"
                  label="Altura Submersa em A"
                  symbol={<MathTex tex="h_{\text{sub},A}" />}
                  result={<MathTex tex={physics.h_in_A.toFixed(2)} />}
                  unit={<MathTex tex="\text{cm}" />}
                />
              )}
              <CalculationLine
                theme="cyan"
                label="Volume Submerso em A"
                symbol={<MathTex tex="V_{\text{sub},A}" />}
                result={<MathTex tex={physics.vol_sub_A.toFixed(6)} />}
                unit={<MathTex tex="\text{m}^3" />}
              />
              <CalculationLine
                theme="cyan"
                label="Força de Empuxo em A"
                symbol={<MathTex tex="E_A" />}
                formula={<MathTex tex="\rho_A \cdot g \cdot V_{\text{sub},A}" />}
                substitution={
                  <MathTex tex={`${physics.rhoA} \cdot ${gravity} \cdot ${physics.vol_sub_A.toFixed(4)}`} />
                }
                result={<MathTex tex={fmtForceTex(physics.E_A)} />}
                unit=""
                isSubHeader={!enableTwoFluids}
              />

              {enableTwoFluids && (
                <>
                  <h5 className="text-[10px] font-bold text-cyan-900 dark:text-cyan-300 uppercase mt-6 mb-3">
                    Fluido B (Camada Inferior)
                  </h5>
                  <CalculationLine
                    theme="cyan"
                    label="Altura Submersa em B"
                    symbol={<MathTex tex="h_{\text{sub},B}" />}
                    result={<MathTex tex={physics.h_in_B.toFixed(2)} />}
                    unit={<MathTex tex="\text{cm}" />}
                  />
                  <CalculationLine
                    theme="cyan"
                    label="Volume Submerso em B"
                    symbol={<MathTex tex="V_{\text{sub},B}" />}
                    result={<MathTex tex={physics.vol_sub_B.toFixed(6)} />}
                    unit={<MathTex tex="\text{m}^3" />}
                  />
                  <CalculationLine
                    theme="cyan"
                    label="Força de Empuxo em B"
                    symbol={<MathTex tex="E_B" />}
                    formula={<MathTex tex="\rho_B \cdot g \cdot V_{\text{sub},B}" />}
                    substitution={
                      <MathTex tex={`${physics.rhoB} \cdot ${gravity} \cdot ${physics.vol_sub_B.toFixed(4)}`} />
                    }
                    result={<MathTex tex={fmtForceTex(physics.E_B)} />}
                    unit=""
                  />
                  <div className="mt-4 pt-2">
                    <CalculationLine
                      theme="cyan"
                      label="Empuxo Total Resultante"
                      symbol={<MathTex tex="E_{\text{total}}" />}
                      formula={<MathTex tex="E_A + E_B" />}
                      substitution={
                        <MathTex
                          tex={`${(physics.E_A / 1000).toFixed(2)} + ${(physics.E_B / 1000).toFixed(2)}\text{ kN}`}
                        />
                      }
                      result={<MathTex tex={fmtForceTex(physics.buoyancyForce)} />}
                      unit=""
                      isSubHeader
                    />
                  </div>
                </>
              )}

              {physics.twoBlocks && (
                <>
                  <h5 className="text-[10px] font-bold text-purple-900 dark:text-purple-300 uppercase mt-6 mb-3">
                    Interação entre os Dois Blocos
                  </h5>
                  <CalculationLine
                    theme="purple"
                    label="Empuxo no Bloco 1 (Superior)"
                    symbol={<MathTex tex="E_1" />}
                    result={<MathTex tex={fmtForceTex(physics.E_1 ?? 0)} />}
                    unit=""
                  />
                  <CalculationLine
                    theme="purple"
                    label="Empuxo no Bloco 2 (Inferior)"
                    symbol={<MathTex tex="E_2" />}
                    result={<MathTex tex={fmtForceTex(physics.E_2 ?? 0)} />}
                    unit=""
                  />
                  <CalculationLine
                    theme="purple"
                    label="Tração no Cabo"
                    symbol={<MathTex tex="T" />}
                    result={<MathTex tex={fmtForceTex(physics.cordTension ?? 0)} />}
                    unit=""
                  />
                </>
              )}
            </div>
          </section>

          <section>
            <h4 className="text-[10px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-6 h-px bg-amber-200 dark:bg-amber-800"></div> Análise Final{' '}
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
            </h4>
            <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              <CalculationLine
                theme="amber"
                label="Peso Aparente (Dinamômetro)"
                symbol={<MathTex tex="P_{\text{ap}}" />}
                formula={<MathTex tex="\max(0,\; P - E)" />}
                substitution={
                  <MathTex
                    tex={`\\max\\!\\left(0,\\; ${texNum((physics.objectWeight / 1000).toFixed(2))} - ${texNum((physics.buoyancyForce / 1000).toFixed(2))}\\text{ kN}\\right)`}
                  />
                }
                result={<MathTex tex={fmtForceTex(physics.apparentWeight)} />}
                unit=""
                isSubHeader
              />
              <div className="mt-4 text-center pt-2">
                <div className="inline-block px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-amber-100 dark:border-amber-900/60 shadow-sm text-sm font-bold text-amber-900 dark:text-amber-300">
                  {physics.status === 'AFUNDADO' ? (
                    physics.isShallowTank ? (
                      <>
                        <MathTex tex="P > E" /> no fundo (Lâmina líquida insuficiente no reservatório para flutuação livre)
                      </>
                    ) : (
                      <>
                        <MathTex tex="P > E" /> (Afunda: densidade equivalente maior que a do fluido)
                      </>
                    )
                  ) : (
                    <>
                      <MathTex tex="P = E" /> (Equilíbrio Hidrostático)
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
