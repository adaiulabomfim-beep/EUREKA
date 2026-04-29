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
  activeExerciseId?: string;
}

const CalculationLine: React.FC<{
  label: string | React.ReactNode;
  symbol: string | React.ReactNode;
  formula?: string | React.ReactNode;
  substitution?: string | React.ReactNode;
  result: string;
  unit: string;
  isSubHeader?: boolean;
}> = ({ label, symbol, formula, substitution, result, unit, isSubHeader }) => (
  <div
    className={`flex flex-col sm:flex-row sm:items-baseline justify-between py-2 border-b border-slate-100 last:border-0 ${isSubHeader ? 'bg-slate-50/80 -mx-4 px-4 font-semibold text-slate-800 mt-2 py-2.5' : ''
      }`}
  >
    <div className="text-[10px] text-slate-500 font-medium">{label}</div>
    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-700 mt-1 sm:mt-0">
      <span className="font-bold text-blue-700">{symbol}</span>
      {formula && <span className="text-slate-400 hidden lg:inline">= {formula}</span>}
      {substitution && <span className="text-slate-500">= {substitution}</span>}
      <span
        className={`font-bold px-1.5 py-0.5 rounded ml-auto ${isSubHeader ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-900'
          }`}
      >
        = {result}{' '}
        <span className="text-[9px] font-sans text-slate-500 ml-0.5">{unit}</span>
      </span>
    </div>
  </div>
);

export const Memorial: React.FC<MemorialProps> = ({
  physics,
  geom,
  gravity,
  tankWidth,
  tankDepth,
  enableTwoFluids,
  onClose,
  activeExerciseId
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 zoom-in-95 duration-300">
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 p-6 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-700" />
            Memorial de Cálculo
          </h3>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-4 py-2 hover:bg-slate-100 rounded-xl transition-colors uppercase"
          >
            Fechar
          </button>
        </div>

        <div className="p-8 space-y-10">
          {activeExerciseId === 'ex2' ? (
            <div className="space-y-8">
              <section>
                <h4 className="text-xs font-black text-purple-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-purple-300"></div> Resolução do Exercício <div className="flex-1 h-px bg-slate-200"></div>
                </h4>
                
                <div className="bg-purple-50/40 p-6 rounded-2xl border border-purple-100/70 space-y-4 text-slate-700 text-sm leading-relaxed">
                  <p>Para resolver o exercício, analisamos o sistema em equilíbrio estático onde a soma das forças verticais é zero.</p>
                  
                  <div className="bg-white p-4 rounded-xl border border-slate-100 my-4 shadow-sm">
                    <p className="font-mono text-center mb-2 font-bold text-slate-800">Força Peso Total (P) = Empuxo Total (E)</p>
                    <p className="font-mono text-center text-xs text-slate-500">P<sub>A</sub> + P<sub>B</sub> = E<sub>A</sub> + E<sub>B</sub></p>
                  </div>

                  <p>Podemos expressar o peso e o empuxo em termos de massa específica (ρ), Volume (V) e gravidade (g). Como as esferas têm o mesmo raio, seus volumes são iguais (V<sub>A</sub> = V<sub>B</sub> = V).</p>
                  <ul className="list-disc pl-5 space-y-2 text-slate-600 font-mono text-xs">
                    <li>P<sub>A</sub> = ρ<sub>A</sub> · V · g</li>
                    <li>P<sub>B</sub> = ρ<sub>B</sub> · V · g</li>
                    <li>E<sub>A</sub> = ρ<sub>água</sub> · (V/2) · g <span className="font-sans italic text-slate-400">(A esfera A está 50% submersa)</span></li>
                    <li>E<sub>B</sub> = ρ<sub>água</sub> · V · g <span className="font-sans italic text-slate-400">(A esfera B está 100% submersa)</span></li>
                  </ul>

                  <div className="bg-white p-4 rounded-xl border border-slate-100 my-4 shadow-sm">
                    <p className="font-mono text-center text-xs">
                      ρ<sub>A</sub>·V·g + ρ<sub>B</sub>·V·g = ρ<sub>água</sub>·(V/2)·g + ρ<sub>água</sub>·V·g
                    </p>
                    <p className="font-mono text-center text-xs mt-2 text-slate-500">Dividindo toda a equação por (V·g):</p>
                    <p className="font-mono text-center text-sm font-bold mt-2 text-blue-700">
                      ρ<sub>A</sub> + ρ<sub>B</sub> = 1,5 · ρ<sub>água</sub>
                    </p>
                  </div>

                  <p>Isolando a incógnita (ρ<sub>B</sub>) e substituindo pelos valores fornecidos no enunciado (ρ<sub>A</sub> = 0,8 g/cm³ e ρ<sub>água</sub> = 1,0 g/cm³):</p>
                  
                  <div className="bg-slate-800 text-white p-6 rounded-xl mt-6">
                    <CalculationLine
                      label="Massa Específica B"
                      symbol={<>ρ<sub>B</sub></>}
                      formula={<>1,5 · ρ<sub>água</sub> - ρ<sub>A</sub></>}
                      substitution="1,5 · 1,0 - 0,8"
                      result="0,7"
                      unit="g/cm³"
                    />
                    <div className="text-right text-[10px] text-slate-400 mt-2 font-mono">
                      (ou 700 kg/m³)
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <>
              <section>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-6 h-px bg-slate-300"></div> Geometria & Massa <div className="flex-1 h-px bg-slate-200"></div>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
              <div>
                <CalculationLine label="Volume Total (V)" symbol="V" formula={geom.formula} substitution={geom.substitution} result={physics.volume.toFixed(4)} unit="m³" />
                <CalculationLine label="Massa (m)" symbol="m" formula="ρ · V" substitution={`${physics.objectDensity} · ${physics.volume.toFixed(4)}`} result={physics.objectMass.toFixed(2)} unit="kg" />
              </div>
              <div>
                <CalculationLine label="Peso (P)" symbol="P" formula="m · g" substitution={`${physics.objectMass.toFixed(2)} · ${gravity}`} result={physics.objectWeight.toFixed(2)} unit="N" isSubHeader />
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-xs font-black text-cyan-700 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-6 h-px bg-cyan-300"></div> Hidrostática & Deslocamento <div className="flex-1 h-px bg-slate-200"></div>
            </h4>
            <div className="bg-cyan-50/35 p-6 rounded-2xl border border-cyan-100/70">
              <CalculationLine
                label="Volume Deslocado Total"
                symbol={<>V<sub>desl</sub></>}
                formula={<>V<sub>sub,A</sub> + V<sub>sub,B</sub></>}
                result={physics.vol_deslocado.toFixed(6)}
                unit="m³"
              />
              <CalculationLine
                label="Área da Base do Tanque"
                symbol={<>A<sub>tanque</sub></>}
                formula="L · P"
                substitution={`${(tankWidth / 100).toFixed(2)} · ${(tankDepth / 100).toFixed(2)}`}
                result={physics.tankBaseArea.toFixed(3)}
                unit="m²"
              />
              <CalculationLine
                label="Elevação do Nível (Δh)"
                symbol="Δh"
                formula={<>V<sub>desl</sub> / A<sub>tanque</sub></>}
                substitution={`${physics.vol_deslocado.toFixed(6)} / ${physics.tankBaseArea.toFixed(3)}`}
                result={(physics.deltaH_cm / 100).toFixed(4)}
                unit="m"
                isSubHeader
              />

              <h5 className="text-xs font-bold text-cyan-900 uppercase mt-8 mb-3">Cálculo das Forças</h5>
              <CalculationLine
                label="Altura Submersa Total"
                symbol={<>h<sub>sub</sub></>}
                result={physics.h_sub_actual.toFixed(2)}
                unit="cm"
              />

              <h5 className="text-xs font-bold text-cyan-900 uppercase mt-6 mb-3">Fluido A (Superior)</h5>
              <CalculationLine
                label="Volume Submerso em A"
                symbol={<>V<sub>sub,A</sub></>}
                result={physics.vol_sub_A.toFixed(6)}
                unit="m³"
              />
              <CalculationLine
                label="Força de Empuxo em A"
                symbol={<>E<sub>A</sub></>}
                formula={<>ρ<sub>A</sub> · g · V<sub>sub,A</sub></>}
                result={physics.E_A.toFixed(2)}
                unit="N"
                isSubHeader={!enableTwoFluids}
              />

              {enableTwoFluids && (
                <>
                  <h5 className="text-xs font-bold text-cyan-900 uppercase mt-6 mb-3">Fluido B (Inferior)</h5>
                  <CalculationLine
                    label="Volume Submerso em B"
                    symbol={<>V<sub>sub,B</sub></>}
                    result={physics.vol_sub_B.toFixed(6)}
                    unit="m³"
                  />
                  <CalculationLine
                    label="Força de Empuxo em B"
                    symbol={<>E<sub>B</sub></>}
                    formula={<>ρ<sub>B</sub> · g · V<sub>sub,B</sub></>}
                    result={physics.E_B.toFixed(2)}
                    unit="N"
                  />
                  <div className="mt-4">
                    <CalculationLine
                      label="Empuxo Total Resultante"
                      symbol={<>E<sub>total</sub></>}
                      formula={<>E<sub>A</sub> + E<sub>B</sub></>}
                      result={physics.buoyancyForce.toFixed(2)}
                      unit="N"
                      isSubHeader
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          <section>
            <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-6 h-px bg-blue-300"></div> Análise Final <div className="flex-1 h-px bg-slate-200"></div>
            </h4>
            <div className="bg-blue-50/60 p-6 rounded-2xl border border-blue-100">
              <CalculationLine
                label="Peso Aparente (Dinamômetro)"
                symbol={<>P<sub>ap</sub></>}
                formula="|P - E|"
                substitution={`|${physics.objectWeight.toFixed(2)} - ${physics.buoyancyForce.toFixed(2)}|`}
                result={physics.apparentWeight.toFixed(2)}
                unit="N"
                isSubHeader
              />
              <div className="mt-4 text-center">
                <div className="inline-block px-4 py-2 bg-white rounded-xl border border-blue-100 shadow-sm text-sm font-bold text-blue-950">
                  {physics.status === 'AFUNDADO'
                    ? 'P > E (Afunda)'
                    : physics.status.includes('FLUTUANDO') ||
                      physics.status.includes('INTERFACE') ||
                      physics.status.includes('EQUILÍBRIO')
                      ? 'P = E (Equilíbrio)'
                      : 'P = E (Equilíbrio)'}
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
