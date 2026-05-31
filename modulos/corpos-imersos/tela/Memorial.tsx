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
        slate: { text: 'text-slate-600', bg: 'bg-slate-100 text-slate-800', border: 'border-slate-100', subBg: 'bg-slate-600 text-white', unitText: 'text-slate-500', unitSub: 'text-slate-200', subHeaderWrap: 'bg-slate-50/80' },
        blue: { text: 'text-blue-600', bg: 'bg-blue-50 text-blue-900', border: 'border-blue-50', subBg: 'bg-blue-600 text-white', unitText: 'text-blue-500', unitSub: 'text-blue-200', subHeaderWrap: 'bg-blue-50/50' },
        cyan: { text: 'text-cyan-600', bg: 'bg-cyan-50 text-cyan-900', border: 'border-cyan-50', subBg: 'bg-cyan-600 text-white', unitText: 'text-cyan-500', unitSub: 'text-cyan-200', subHeaderWrap: 'bg-cyan-50/50' },
        emerald: { text: 'text-emerald-600', bg: 'bg-emerald-50 text-emerald-900', border: 'border-emerald-50', subBg: 'bg-emerald-600 text-white', unitText: 'text-emerald-500', unitSub: 'text-emerald-200', subHeaderWrap: 'bg-emerald-50/50' },
        amber: { text: 'text-amber-600', bg: 'bg-amber-50 text-amber-900', border: 'border-amber-50', subBg: 'bg-amber-500 text-white', unitText: 'text-amber-500', unitSub: 'text-amber-100', subHeaderWrap: 'bg-amber-50/50' },
        red: { text: 'text-red-600', bg: 'bg-red-50 text-red-900', border: 'border-red-50', subBg: 'bg-red-600 text-white', unitText: 'text-red-500', unitSub: 'text-red-200', subHeaderWrap: 'bg-red-50/50' },
        purple: { text: 'text-purple-600', bg: 'bg-purple-50 text-purple-900', border: 'border-purple-50', subBg: 'bg-purple-600 text-white', unitText: 'text-purple-500', unitSub: 'text-purple-200', subHeaderWrap: 'bg-purple-50/50' },
        indigo: { text: 'text-indigo-600', bg: 'bg-indigo-50 text-indigo-900', border: 'border-indigo-50', subBg: 'bg-indigo-600 text-white', unitText: 'text-indigo-500', unitSub: 'text-indigo-200', subHeaderWrap: 'bg-indigo-50/50' },
    }[theme];

    return (
        <div className={`flex flex-col sm:flex-row sm:items-baseline justify-between py-3 border-b ${t.border} last:border-0 ${isSubHeader ? `${t.subHeaderWrap} -mx-6 px-6 font-bold text-slate-800 mt-4 mb-2 py-4 shadow-sm rounded-xl` : ''}`}>
            <div className={`font-bold uppercase tracking-widest ${isSubHeader ? 'text-sm text-slate-700' : 'text-xs text-slate-500'}`}>{label}</div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-xl w-[95vw] lg:w-[75vw] h-[95vh] lg:h-[75vh] overflow-y-auto rounded-3xl shadow-2xl border border-blue-100 animate-in slide-in-from-bottom-10 zoom-in-95 duration-300 relative">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-blue-50 p-6 flex items-center justify-between z-10">
           <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 tracking-tight">
               <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200"><FileText className="w-5 h-5" /></div> 
               Memorial de Cálculo
           </h3>
           <button onClick={onClose} className="text-[10px] font-black text-slate-400 hover:text-blue-600 px-4 py-2 hover:bg-blue-50 rounded-xl transition-all uppercase tracking-widest">Fechar</button>
        </div>

        <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-white">
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
                  
                  <div className="bg-white shadow-sm p-6 rounded-2xl border border-slate-100 mt-6 flex flex-col gap-0">
                    <CalculationLine theme="purple"
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
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-6 h-px bg-slate-200"></div> Geometria & Massa <div className="flex-1 h-px bg-slate-100"></div>
            </h4>
            <div className="flex flex-col gap-0 bg-white shadow-sm p-6 rounded-2xl border border-slate-100">
                <CalculationLine theme="slate" label="Volume Total (V)" symbol="V" formula={geom.formula} substitution={geom.substitution} result={physics.volume.toFixed(4)} unit="m³" />
                <CalculationLine theme="slate" label="Massa (m)" symbol="m" formula="ρ · V" substitution={`${physics.objectDensity} · ${physics.volume.toFixed(4)}`} result={physics.objectMass.toFixed(2)} unit="kg" />
                <CalculationLine theme="red" label="Peso (P)" symbol="P" formula="m · g" substitution={`${physics.objectMass.toFixed(2)} · ${gravity}`} result={physics.objectWeight.toFixed(2)} unit="N" />
            </div>
          </section>

          <section>
            <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-6 h-px bg-cyan-200"></div> Hidrostática & Deslocamento <div className="flex-1 h-px bg-slate-100"></div>
            </h4>
            <div className="flex flex-col gap-0 bg-white shadow-sm p-6 rounded-2xl border border-slate-100">
              <CalculationLine theme="cyan"
                label="Volume Deslocado Total"
                symbol={<>V<sub>desl</sub></>}
                formula={<>V<sub>sub,A</sub> + V<sub>sub,B</sub></>}
                result={physics.vol_deslocado.toFixed(6)}
                unit="m³"
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
                substitution={`${physics.vol_deslocado.toFixed(6)} / ${physics.tankBaseArea.toFixed(3)}`}
                result={(physics.deltaH_cm / 100).toFixed(4)}
                unit="m"
                isSubHeader
              />

              <h5 className="text-[10px] font-bold text-cyan-900 uppercase mt-8 mb-3">Cálculo das Forças</h5>
              <CalculationLine theme="cyan"
                label="Altura Submersa Total"
                symbol={<>h<sub>sub</sub></>}
                result={physics.h_sub_actual.toFixed(2)}
                unit="cm"
              />

              <h5 className="text-[10px] font-bold text-cyan-900 uppercase mt-6 mb-3">Fluido A (Superior)</h5>
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
                result={physics.E_A.toFixed(2)}
                unit="N"
                isSubHeader={!enableTwoFluids}
              />

              {enableTwoFluids && (
                <>
                  <h5 className="text-[10px] font-bold text-cyan-900 uppercase mt-6 mb-3">Fluido B (Inferior)</h5>
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
                    result={physics.E_B.toFixed(2)}
                    unit="N"
                  />
                  <div className="mt-4 pt-2">
                    <CalculationLine theme="cyan"
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
            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-6 h-px bg-amber-200"></div> Análise Final <div className="flex-1 h-px bg-slate-100"></div>
            </h4>
            <div className="flex flex-col gap-0 bg-white shadow-sm p-6 rounded-2xl border border-slate-100">
              <CalculationLine theme="amber"
                label="Peso Aparente (Dinamômetro)"
                symbol={<>P<sub>ap</sub></>}
                formula="|P - E|"
                substitution={`|${physics.objectWeight.toFixed(2)} - ${physics.buoyancyForce.toFixed(2)}|`}
                result={physics.apparentWeight.toFixed(2)}
                unit="N"
                isSubHeader
              />
              <div className="mt-4 text-center pt-2">
                <div className="inline-block px-4 py-2 bg-white rounded-xl border border-amber-100 shadow-sm text-sm font-bold text-amber-900">
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
