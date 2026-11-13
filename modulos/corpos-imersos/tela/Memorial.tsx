import React from 'react';
import { FileText } from 'lucide-react';

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

const fmtForce = (valN: number) => `${(valN / 1000).toFixed(2)} kN (${valN.toFixed(1)} N)`;

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
        return <>{parts.map((part, i) => i % 2 === 1 ? <sub key={i} className="text-[0.8em] leading-[0] font-semibold">{part}</sub> : part)}</>;
    };

    const t = {
        slate: { 
          text: 'text-slate-600 dark:text-slate-300', 
          bg: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100', 
          border: 'border-slate-100 dark:border-slate-800', 
          subBg: 'bg-slate-600 dark:bg-slate-700 text-white', 
          unitText: 'text-slate-500 dark:text-slate-400', 
          unitSub: 'text-slate-200', 
          subHeaderWrap: 'bg-slate-50/80 dark:bg-slate-800/60' 
        },
        blue: { 
          text: 'text-blue-600 dark:text-blue-400', 
          bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200', 
          border: 'border-blue-50 dark:border-slate-800', 
          subBg: 'bg-blue-600 dark:bg-blue-600 text-white', 
          unitText: 'text-blue-500 dark:text-blue-400', 
          unitSub: 'text-blue-200', 
          subHeaderWrap: 'bg-blue-50/50 dark:bg-blue-950/40' 
        },
        cyan: { 
          text: 'text-cyan-600 dark:text-cyan-400', 
          bg: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-200', 
          border: 'border-cyan-50 dark:border-slate-800', 
          subBg: 'bg-cyan-600 dark:bg-cyan-600 text-white', 
          unitText: 'text-cyan-500 dark:text-cyan-400', 
          unitSub: 'text-cyan-200', 
          subHeaderWrap: 'bg-cyan-50/50 dark:bg-cyan-950/40' 
        },
        emerald: { 
          text: 'text-emerald-600 dark:text-emerald-400', 
          bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200', 
          border: 'border-emerald-50 dark:border-slate-800', 
          subBg: 'bg-emerald-600 dark:bg-emerald-600 text-white', 
          unitText: 'text-emerald-500 dark:text-emerald-400', 
          unitSub: 'text-emerald-200', 
          subHeaderWrap: 'bg-emerald-50/50 dark:bg-emerald-950/40' 
        },
        amber: { 
          text: 'text-amber-600 dark:text-amber-400', 
          bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200', 
          border: 'border-amber-50 dark:border-slate-800', 
          subBg: 'bg-amber-500 dark:bg-amber-600 text-white', 
          unitText: 'text-amber-500 dark:text-amber-400', 
          unitSub: 'text-amber-100', 
          subHeaderWrap: 'bg-amber-50/50 dark:bg-amber-950/40' 
        },
        red: { 
          text: 'text-red-600 dark:text-red-400', 
          bg: 'bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-200', 
          border: 'border-red-50 dark:border-slate-800', 
          subBg: 'bg-red-600 dark:bg-red-600 text-white', 
          unitText: 'text-red-500 dark:text-red-400', 
          unitSub: 'text-red-200', 
          subHeaderWrap: 'bg-red-50/50 dark:bg-red-950/40' 
        },
        purple: { 
          text: 'text-purple-600 dark:text-purple-400', 
          bg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200', 
          border: 'border-purple-50 dark:border-slate-800', 
          subBg: 'bg-purple-600 dark:bg-purple-600 text-white', 
          unitText: 'text-purple-500 dark:text-purple-400', 
          unitSub: 'text-purple-200', 
          subHeaderWrap: 'bg-purple-50/50 dark:bg-purple-950/40' 
        },
        indigo: { 
          text: 'text-indigo-600 dark:text-indigo-400', 
          bg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200', 
          border: 'border-indigo-50 dark:border-slate-800', 
          subBg: 'bg-indigo-600 dark:bg-indigo-600 text-white', 
          unitText: 'text-indigo-500 dark:text-indigo-400', 
          unitSub: 'text-indigo-200', 
          subHeaderWrap: 'bg-indigo-50/50 dark:bg-indigo-950/40' 
        },
    }[theme];

    return (
        <div className={`flex flex-col sm:flex-row sm:items-baseline justify-between py-3 border-b ${t.border} last:border-0 ${isSubHeader ? `${t.subHeaderWrap} -mx-6 px-6 font-bold text-slate-800 dark:text-slate-100 mt-4 mb-2 py-4 shadow-sm rounded-xl` : ''}`}>
            <div className={`font-bold uppercase tracking-widest ${isSubHeader ? 'text-sm text-slate-700 dark:text-slate-200' : 'text-xs text-slate-500 dark:text-slate-400'}`}>{label}</div>
            <div className="flex flex-wrap items-center gap-2.5 text-[13px] sm:text-sm font-mono text-slate-700 dark:text-slate-300 mt-2 sm:mt-0">
                <span className={`font-bold ${t.text}`}>{parseSub(symbol)}</span>
                {formula && <span className="text-slate-400 dark:text-slate-500 hidden lg:inline">= {parseSub(formula)}</span>}
                {substitution && <span className="text-slate-500 dark:text-slate-400">= {parseSub(substitution)}</span>}
                <span className={`font-bold px-3 py-1.5 rounded-lg ml-auto ${isSubHeader ? t.subBg : t.bg}`}>
                    = {result} {unit && <span className={`text-[11px] font-sans ml-1 font-semibold ${isSubHeader ? t.unitSub : t.unitText}`}>{unit}</span>}
                </span>
            </div>
        </div>
    );
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl w-[95vw] lg:w-[75vw] h-[95vh] lg:h-[75vh] overflow-y-auto rounded-3xl shadow-2xl border border-blue-100 dark:border-slate-800 animate-in slide-in-from-bottom-10 zoom-in-95 duration-300 relative flex flex-col">
        <div className="sticky top-0 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border-b border-blue-50 dark:border-slate-800 p-6 flex items-center justify-between z-10 transition-colors">
           <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tight">
               <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200 dark:shadow-none"><FileText className="w-5 h-5" /></div> 
               Memorial de Cálculo
           </h3>
           <button onClick={onClose} className="text-[10px] font-black text-slate-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all uppercase tracking-widest border border-slate-200/60 dark:border-slate-700 cursor-pointer">Fechar</button>
        </div>

        <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-950/60">
          {enunciado && (
            <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 block mb-1">
                Enunciado da Simulação ({activeExerciseId?.toUpperCase()})
              </span>
              {enunciado}
            </div>
          )}
          <section>
            <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-6 h-px bg-slate-200 dark:bg-slate-700"></div> Geometria & Massa <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
            </h4>
            <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              {physics.twoBlocks ? (
                <>
                  <CalculationLine theme="slate" label="Volume Bloco 1 (Superior)" symbol={<>V<sub>1</sub></>} formula={geom.formula} substitution={geom.substitution} result={physics.volume.toFixed(4)} unit="m³" />
                  <CalculationLine theme="slate" label="Volume Bloco 2 (Inferior)" symbol={<>V<sub>2</sub></>} result={(physics.volume2 || 0).toFixed(4)} unit="m³" />
                  <CalculationLine theme="slate" label="Volume Total do Sistema" symbol="V" formula={<>V<sub>1</sub> + V<sub>2</sub></>} substitution={`${physics.volume.toFixed(4)} + ${(physics.volume2 || 0).toFixed(4)}`} result={totalVolume.toFixed(4)} unit="m³" />
                  <CalculationLine theme="slate" label="Massa Bloco 1" symbol={<>m<sub>1</sub></>} formula={<>ρ<sub>1</sub> · V<sub>1</sub></>} result={(physics.objectMass1 ?? physics.objectMass).toFixed(2)} unit="kg" />
                  <CalculationLine theme="slate" label="Massa Bloco 2" symbol={<>m<sub>2</sub></>} formula={<>ρ<sub>2</sub> · V<sub>2</sub></>} result={(physics.objectMass2 || 0).toFixed(2)} unit="kg" />
                  <CalculationLine theme="slate" label="Densidade Equivalente" symbol={<>ρ<sub>eq</sub></>} formula={<>m<sub>total</sub> / V<sub>total</sub></>} result={effectiveRho.toFixed(2)} unit="kg/m³" />
                </>
              ) : (
                <>
                  <CalculationLine theme="slate" label="Volume Total (V)" symbol="V" formula={geom.formula} substitution={geom.substitution} result={totalVolume.toFixed(4)} unit="m³" />
                  <CalculationLine theme="slate" label="Massa do Objeto (m)" symbol="m" formula="ρ · V" substitution={`${Number.isInteger(physics.objectDensity) ? physics.objectDensity : physics.objectDensity.toFixed(1)} · ${totalVolume.toFixed(4)}`} result={(physics.objectMass1 ?? physics.objectMass).toFixed(2)} unit="kg" />
                </>
              )}
              {physics.extraWeight > 0 && (
                <>
                  <CalculationLine theme="amber" label="Peso do Corpo (P_corpo)" symbol={<>P<sub>corpo</sub></>} formula="m · g" result={fmtForce(physics.objectWeight - physics.extraWeight)} unit="" />
                  <CalculationLine theme="amber" label="Carga Extra Adicional" symbol={<>P<sub>extra</sub></>} result={fmtForce(physics.extraWeight)} unit="" />
                  <CalculationLine theme="slate" label="Densidade Efetiva c/ Carga" symbol={<>ρ<sub>ef</sub></>} formula={<>(P<sub>total</sub> / g) / V</>} result={effectiveRho.toFixed(2)} unit="kg/m³" />
                </>
              )}
              <CalculationLine
                theme="red"
                label="Peso Real Total (P)"
                symbol="P"
                formula={physics.extraWeight > 0 ? <>P<sub>corpo</sub> + P<sub>extra</sub></> : 'm · g'}
                substitution={physics.extraWeight > 0 ? `${(physics.objectWeight - physics.extraWeight).toFixed(1)} + ${physics.extraWeight.toFixed(1)} N` : `${physics.objectMass.toFixed(2)} · ${gravity}`}
                result={fmtForce(physics.objectWeight)}
                unit=""
                isSubHeader
              />
            </div>
          </section>

          <section>
            <h4 className="text-[10px] font-black text-cyan-500 dark:text-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-6 h-px bg-cyan-200 dark:bg-cyan-800"></div> Hidrostática & Deslocamento <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
            </h4>
            <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              <CalculationLine theme="cyan"
                label="Volume Deslocado Total"
                symbol={<>V<sub>desl</sub></>}
                formula={enableTwoFluids ? <>V<sub>sub,A</sub> + V<sub>sub,B</sub></> : <>V<sub>sub</sub></>}
                result={`${physics.vol_deslocado.toFixed(6)} m³ (${(physics.vol_deslocado * 1000).toFixed(2)} L)`}
                unit=""
              />
              <CalculationLine theme="cyan"
                label="Área da Base do Tanque"
                symbol={<>A<sub>tanque</sub></>}
                formula="L · P"
                substitution={`${(tankWidth / 100).toFixed(2)} · ${(tankDepth / 100).toFixed(2)}`}
                result={physics.tankBaseArea.toFixed(3)}
                unit="m²"
              />
              <CalculationLine theme="cyan"
                label="Elevação do Nível (Δh)"
                symbol="Δh"
                formula={<>V<sub>desl</sub> / A<sub>tanque</sub></>}
                substitution={`${physics.vol_deslocado.toFixed(4)} / ${physics.tankBaseArea.toFixed(2)}`}
                result={`${physics.deltaH_cm.toFixed(2)} cm (${(physics.deltaH_cm / 100).toFixed(4)} m)`}
                unit=""
                isSubHeader
              />

              <h5 className="text-[10px] font-bold text-cyan-900 dark:text-cyan-300 uppercase mt-8 mb-3">Cálculo das Forças e Submersão</h5>
              <CalculationLine theme="cyan"
                label="Altura Submersa Total (Calado)"
                symbol={<>h<sub>sub</sub></>}
                result={`${physics.h_sub_actual.toFixed(2)} cm (${(physics.h_sub_actual / 100).toFixed(4)} m)`}
                unit=""
              />

              <h5 className="text-[10px] font-bold text-cyan-900 dark:text-cyan-300 uppercase mt-6 mb-3">
                {enableTwoFluids ? 'Fluido A (Camada Superior)' : 'Fluido Principal'}
              </h5>
              {enableTwoFluids && (
                <CalculationLine theme="cyan"
                  label="Altura Submersa em A"
                  symbol={<>h<sub>sub,A</sub></>}
                  result={physics.h_in_A.toFixed(2)}
                  unit="cm"
                />
              )}
              <CalculationLine theme="cyan"
                label="Volume Submerso em A"
                symbol={<>V<sub>sub,A</sub></>}
                result={physics.vol_sub_A.toFixed(6)}
                unit="m³"
              />
              <CalculationLine theme="cyan"
                label="Força de Empuxo em A"
                symbol={<>E<sub>A</sub></>}
                formula={<>ρ<sub>A</sub> · g · V<sub>sub,A</sub></>}
                substitution={`${physics.rhoA} · ${gravity} · ${physics.vol_sub_A.toFixed(4)}`}
                result={fmtForce(physics.E_A)}
                unit=""
                isSubHeader={!enableTwoFluids}
              />

              {enableTwoFluids && (
                <>
                  <h5 className="text-[10px] font-bold text-cyan-900 dark:text-cyan-300 uppercase mt-6 mb-3">Fluido B (Camada Inferior)</h5>
                  <CalculationLine theme="cyan"
                    label="Altura Submersa em B"
                    symbol={<>h<sub>sub,B</sub></>}
                    result={physics.h_in_B.toFixed(2)}
                    unit="cm"
                  />
                  <CalculationLine theme="cyan"
                    label="Volume Submerso em B"
                    symbol={<>V<sub>sub,B</sub></>}
                    result={physics.vol_sub_B.toFixed(6)}
                    unit="m³"
                  />
                  <CalculationLine theme="cyan"
                    label="Força de Empuxo em B"
                    symbol={<>E<sub>B</sub></>}
                    formula={<>ρ<sub>B</sub> · g · V<sub>sub,B</sub></>}
                    substitution={`${physics.rhoB} · ${gravity} · ${physics.vol_sub_B.toFixed(4)}`}
                    result={fmtForce(physics.E_B)}
                    unit=""
                  />
                  <div className="mt-4 pt-2">
                    <CalculationLine theme="cyan"
                      label="Empuxo Total Resultante"
                      symbol={<>E<sub>total</sub></>}
                      formula={<>E<sub>A</sub> + E<sub>B</sub></>}
                      substitution={`${(physics.E_A / 1000).toFixed(2)} + ${(physics.E_B / 1000).toFixed(2)} kN`}
                      result={fmtForce(physics.buoyancyForce)}
                      unit=""
                      isSubHeader
                    />
                  </div>
                </>
              )}

              {physics.twoBlocks && (
                <>
                  <h5 className="text-[10px] font-bold text-purple-900 dark:text-purple-300 uppercase mt-6 mb-3">Interação entre os Dois Blocos</h5>
                  <CalculationLine theme="purple"
                    label="Empuxo no Bloco 1 (Superior)"
                    symbol={<>E<sub>1</sub></>}
                    result={fmtForce(physics.E_1 ?? 0)}
                    unit=""
                  />
                  <CalculationLine theme="purple"
                    label="Empuxo no Bloco 2 (Inferior)"
                    symbol={<>E<sub>2</sub></>}
                    result={fmtForce(physics.E_2 ?? 0)}
                    unit=""
                  />
                  <CalculationLine theme="purple"
                    label="Tração no Cabo"
                    symbol="T"
                    result={fmtForce(physics.cordTension ?? 0)}
                    unit=""
                  />
                </>
              )}
            </div>
          </section>

          <section>
            <h4 className="text-[10px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-6 h-px bg-amber-200 dark:bg-amber-800"></div> Análise Final <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
            </h4>
            <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              <CalculationLine theme="amber"
                label="Peso Aparente (Dinamômetro)"
                symbol={<>P<sub>ap</sub></>}
                formula="max(0, P - E)"
                substitution={`max(0, ${(physics.objectWeight / 1000).toFixed(2)} - ${(physics.buoyancyForce / 1000).toFixed(2)} kN)`}
                result={fmtForce(physics.apparentWeight)}
                unit=""
                isSubHeader
              />
              <div className="mt-4 text-center pt-2">
                <div className="inline-block px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-amber-100 dark:border-amber-900/60 shadow-sm text-sm font-bold text-amber-900 dark:text-amber-300">
                  {physics.status === 'AFUNDADO'
                    ? physics.isShallowTank
                      ? 'P > E no fundo (Lâmina líquida insuficiente no reservatório para flutuação livre)'
                      : 'P > E (Afunda: densidade equivalente maior que a do fluido)'
                    : 'P = E (Equilíbrio Hidrostático)'}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
