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

          {physics.anchoredBuoyMode ? (
            <>
              <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong className="text-slate-800 dark:text-slate-100">Condição Física (Exemplo 2.10):</strong> A boia esférica encontra-se completamente submersa na Água do Mar e ancorada ao fundo por um cabo vertical. Como o empuxo hidrostático (<MathTex tex="E" />) supera o peso próprio da boia (<MathTex tex="W" />), o cabo permanece tracionado para baixo com força <MathTex tex="T = E - W" />, mantendo o equilíbrio estático vertical.
              </div>

              <section>
                <h4 className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-slate-300 dark:bg-slate-700"></div> ETAPA 1 – Identificação dos Dados{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="amber"
                    label="Diâmetro e Raio da Boia Esférica"
                    symbol={<MathTex tex="D,\; R" />}
                    formula={<MathTex tex="R = \frac{D}{2}" />}
                    substitution={<MathTex tex={`R = \\frac{${texNum(physics.diameterM.toFixed(2))}\\text{ m}}{2}`} />}
                    result={<MathTex tex={`D = ${texNum(physics.diameterM.toFixed(2))}\\text{ m},\\; R = ${texNum(physics.radiusM.toFixed(2))}\\text{ m}`} />}
                    unit=""
                  />
                  <CalculationLine
                    theme="red"
                    label="Peso Próprio da Boia"
                    symbol={<MathTex tex="W" />}
                    formula={<MathTex tex="W = \text{dado do enunciado}" />}
                    substitution={<MathTex tex={`${texNum(physics.weightKN.toFixed(2))}\\text{ kN}`} />}
                    result={<MathTex tex={`${texNum(physics.weightKN.toFixed(2))}\\text{ kN}\\;\\left(${texNum(physics.weightN.toFixed(1))}\\text{ N}\\right)`} />}
                    unit=""
                  />
                  <CalculationLine
                    theme="cyan"
                    label="Fluido — Água do Mar (Biblioteca de Fluidos do EUREKA)"
                    symbol={<MathTex tex="\rho_{\text{mar}},\; T_{\text{pad}}" />}
                    formula={<MathTex tex="\rho_{\text{mar}} \text{ na temperatura padrão } T_{\text{pad}} = 15\,^\circ\text{C}" />}
                    substitution={<MathTex tex={`\\rho_{\\text{mar}} = ${texNum(physics.fluidDensity.toFixed(0))}\\text{ kg/m}^3,\\; g = ${texNum(gravity.toFixed(2))}\\text{ m/s}^2`} />}
                    result={<MathTex tex={`\\rho_{\\text{mar}} = ${texNum(physics.fluidDensity.toFixed(0))}\\text{ kg/m}^3\\;\\left(T_{\\text{pad}} = ${physics.standardTemperatureC}\\,^\\circ\\text{C}\\right)`} />}
                    unit=""
                  />
                  <CalculationLine
                    theme="blue"
                    label="Peso Específico da Água do Mar"
                    symbol={<MathTex tex="\gamma_{\text{mar}}" />}
                    formula={<MathTex tex="\gamma_{\text{mar}} = \rho_{\text{mar}} \cdot g" />}
                    substitution={<MathTex tex={`${texNum(physics.fluidDensity.toFixed(0))} \\cdot ${texNum(gravity.toFixed(2))}`} />}
                    result={<MathTex tex={`${texNum(physics.specificWeightKNm3.toFixed(3))}\\text{ kN/m}^3\\;\\left(${texNum(physics.specificWeightNm3.toFixed(2))}\\text{ N/m}^3\\right)`} />}
                    unit=""
                    isSubHeader
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-slate-300 dark:bg-slate-700"></div> ETAPA 2 – Determinação do Volume da Esfera{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="amber"
                    label="Volume Total da Boia Esférica"
                    symbol={<MathTex tex="V" />}
                    formula={<MathTex tex="V = \frac{\pi \cdot D^3}{6} = \frac{4}{3}\pi R^3" />}
                    substitution={<MathTex tex={`\\frac{\\pi \\cdot (${texNum(physics.diameterM.toFixed(2))})^3}{6}`} />}
                    result={<MathTex tex={`${texNum(physics.volume.toFixed(4))}`} />}
                    unit="m³"
                    isSubHeader
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-slate-300 dark:bg-slate-700"></div> ETAPA 3 – Determinação do Volume Deslocado{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="cyan"
                    label="Condição de Imersão Total (100% Submersa)"
                    symbol={<MathTex tex="V_{\text{sub}}" />}
                    formula={<MathTex tex="V_{\text{sub}} = V" />}
                    substitution={<MathTex tex={`V_{\\text{sub}} = ${texNum(physics.volume.toFixed(4))}\\text{ m}^3`} />}
                    result={<MathTex tex={`${texNum(physics.submergedVolume.toFixed(4))}`} />}
                    unit="m³"
                    isSubHeader
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-slate-300 dark:bg-slate-700"></div> ETAPA 4 – Cálculo do Empuxo{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="emerald"
                    label="Força de Empuxo Hidrostático (Princípio de Arquimedes)"
                    symbol={<MathTex tex="E" />}
                    formula={<MathTex tex="E = \gamma_{\text{mar}} \cdot V_{\text{sub}}" />}
                    substitution={<MathTex tex={`${texNum(physics.specificWeightKNm3.toFixed(3))}\\text{ kN/m}^3 \\cdot ${texNum(physics.submergedVolume.toFixed(4))}\\text{ m}^3`} />}
                    result={<MathTex tex={`${texNum(physics.buoyancyKN.toFixed(2))}\\text{ kN}\\;\\left(${texNum(physics.buoyancy.toFixed(1))}\\text{ N}\\right)`} />}
                    unit=""
                    isSubHeader
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-slate-300 dark:bg-slate-700"></div> ETAPA 5 – Diagrama de Corpo Livre{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="emerald"
                    label="Força Ascendente (+y): Empuxo Hidrostático"
                    symbol={<MathTex tex="+E" />}
                    formula={<MathTex tex="\text{Atua verticalmente para cima no Centro de Empuxo (CE)}" />}
                    substitution={<MathTex tex={`+${texNum(physics.buoyancyKN.toFixed(2))}\\text{ kN}`} />}
                    result={<MathTex tex={`E = ${texNum(physics.buoyancyKN.toFixed(2))}\\text{ kN}\\;(\\uparrow)`} />}
                    unit=""
                  />
                  <CalculationLine
                    theme="red"
                    label="Força Descendente (-y): Peso Próprio da Boia"
                    symbol={<MathTex tex="-W" />}
                    formula={<MathTex tex="\text{Atua verticalmente para baixo no Centro de Gravidade (CG)}" />}
                    substitution={<MathTex tex={`-${texNum(physics.weightKN.toFixed(2))}\\text{ kN}`} />}
                    result={<MathTex tex={`W = ${texNum(physics.weightKN.toFixed(2))}\\text{ kN}\\;(\\downarrow)`} />}
                    unit=""
                  />
                  <CalculationLine
                    theme="amber"
                    label="Força Descendente (-y): Tração no Cabo de Ancoragem"
                    symbol={<MathTex tex="-T" />}
                    formula={<MathTex tex="\text{Atua verticalmente para baixo no ponto inferior de fixação da boia}" />}
                    substitution={<MathTex tex="\text{Incógnita de reação no cabo}" />}
                    result={<MathTex tex="T\;(\downarrow)" />}
                    unit=""
                    isSubHeader
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-slate-300 dark:bg-slate-700"></div> ETAPA 6 – Aplicação do Equilíbrio Vertical{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="blue"
                    label="Equação de Equilíbrio Estático Vertical"
                    symbol={<MathTex tex="\sum F_y = 0" />}
                    formula={<MathTex tex="E - W - T = 0" />}
                    substitution={<MathTex tex={`${texNum(physics.buoyancyKN.toFixed(2))} - ${texNum(physics.weightKN.toFixed(2))} - T = 0`} />}
                    result={<MathTex tex="T = E - W" />}
                    unit=""
                    isSubHeader
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-slate-300 dark:bg-slate-700"></div> ETAPA 7 – Determinação da Tração no Cabo{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="amber"
                    label="Força de Tração no Cabo de Ancoragem"
                    symbol={<MathTex tex="T" />}
                    formula={<MathTex tex="T = E - W" />}
                    substitution={<MathTex tex={`${texNum(physics.buoyancyKN.toFixed(2))}\\text{ kN} - ${texNum(physics.weightKN.toFixed(2))}\\text{ kN}`} />}
                    result={<MathTex tex={`${texNum(physics.cableTensionKN.toFixed(2))}\\text{ kN}\\;\\left(${texNum(physics.cableTension.toFixed(1))}\\text{ N}\\right)`} />}
                    unit=""
                    isSubHeader
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-slate-300 dark:bg-slate-700"></div> ETAPA 8 – Verificação do Equilíbrio{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="emerald"
                    label="Balanço Resultante das Forças Verticais"
                    symbol={<MathTex tex="R_y" />}
                    formula={<MathTex tex="R_y = E - W - T" />}
                    substitution={<MathTex tex={`${texNum(physics.buoyancyKN.toFixed(2))} - ${texNum(physics.weightKN.toFixed(2))} - ${texNum(physics.cableTensionKN.toFixed(2))}`} />}
                    result={<MathTex tex="0,00\text{ kN}\;\text{(Equilíbrio Confirmado)}" />}
                    unit=""
                  />
                  <CalculationLine
                    theme="slate"
                    label="Referência Bibliográfica (Munson, γ = 10,05 kN/m³)"
                    symbol={<MathTex tex="T_{\text{ref}}" />}
                    formula={<MathTex tex="E_{\text{ref}} = 10,05 \cdot 1,7671 = 17,76\text{ kN}" />}
                    substitution={<MathTex tex="T_{\text{ref}} = 17,76 - 8,50" />}
                    result={<MathTex tex="9,26\text{ kN}\;\left(\Delta < 0,1\%\right)" />}
                    unit=""
                    isSubHeader
                  />
                </div>
              </section>
            </>
          ) : physics.interfaceEquilibriumMode ? (
            <>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong className="text-slate-800 dark:text-slate-100">Observação sobre a geometria:</strong> o enunciado não fornece as dimensões absolutas do bloco. Como o bloco é prismático e uniforme (área transversal <MathTex tex="A" /> constante), a área <MathTex tex="A" /> cancela-se algebricamente na equação de equilíbrio vertical, tornando a razão <MathTex tex="a/b" /> dependente apenas das densidades relativas. As dimensões (<MathTex tex={`L = ${texNum(physics.illustrativeWidthCm.toFixed(0))}\\text{ cm}`} />, <MathTex tex={`H = a + b = ${texNum(physics.illustrativeHeightCm.toFixed(0))}\\text{ cm}`} />) são ilustrativas e editáveis.
              </div>

              <section>
                <h4 className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-slate-300 dark:bg-slate-700"></div> ETAPA 1 – Identificação das Propriedades dos Materiais e Fluidos{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="amber"
                    label={<>Bloco Uniforme de Aço (<MathTex tex="d_s,\;\gamma_s" />)</>}
                    symbol={<MathTex tex="d_s" />}
                    formula={<MathTex tex="\gamma_s = d_s \cdot \gamma_{\text{água,ref}}" />}
                    substitution={
                      <MathTex
                        tex={`${texNum(physics.bodyRelativeDensity.toFixed(2))} \\cdot ${texNum(physics.waterRefSpecificWeight.toFixed(0))}`}
                      />
                    }
                    result={
                      <MathTex
                        tex={`d_s = ${texNum(physics.bodyRelativeDensity.toFixed(2))}\\;\\left(\\gamma_s = ${texNum(physics.bodySpecificWeight.toFixed(1))}\\text{ N/m}^3\\right)`}
                      />
                    }
                    unit=""
                  />
                  <CalculationLine
                    theme="cyan"
                    label={<>Fluido Superior — Água (<MathTex tex="d_a,\;\gamma_a" />)</>}
                    symbol={<MathTex tex="d_a" />}
                    formula={<MathTex tex="\gamma_a = d_a \cdot \gamma_{\text{água,ref}}" />}
                    substitution={
                      <MathTex
                        tex={`${texNum(physics.upperFluidRelativeDensity.toFixed(2))} \\cdot ${texNum(physics.waterRefSpecificWeight.toFixed(0))}`}
                      />
                    }
                    result={
                      <MathTex
                        tex={`d_a = ${texNum(physics.upperFluidRelativeDensity.toFixed(2))}\\;\\left(\\gamma_a = ${texNum(physics.upperFluidSpecificWeight.toFixed(0))}\\text{ N/m}^3\\right)`}
                      />
                    }
                    unit=""
                  />
                  <CalculationLine
                    theme="blue"
                    label={<>Fluido Inferior — Mercúrio (<MathTex tex="d_m,\;\gamma_m" />)</>}
                    symbol={<MathTex tex="d_m" />}
                    formula={<MathTex tex="\gamma_m = d_m \cdot \gamma_{\text{água,ref}}" />}
                    substitution={
                      <MathTex
                        tex={`${texNum(physics.lowerFluidRelativeDensity.toFixed(2))} \\cdot ${texNum(physics.waterRefSpecificWeight.toFixed(0))}`}
                      />
                    }
                    result={
                      <MathTex
                        tex={`d_m = ${texNum(physics.lowerFluidRelativeDensity.toFixed(2))}\\;\\left(\\gamma_m = ${texNum(physics.lowerFluidSpecificWeight.toFixed(1))}\\text{ N/m}^3\\right)`}
                      />
                    }
                    unit=""
                    isSubHeader
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-cyan-200 dark:bg-cyan-800"></div> ETAPA 2 – Identificação das Regiões Submersas{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="cyan"
                    label={<>Volume Submerso na Camada de Água (<MathTex tex="V_a" />)</>}
                    symbol={<MathTex tex="V_a" />}
                    formula={<MathTex tex="A \cdot a" />}
                    result={<MathTex tex="\text{Região superior do bloco com altura } a" />}
                    unit=""
                  />
                  <CalculationLine
                    theme="slate"
                    label={<>Volume Submerso na Camada de Mercúrio (<MathTex tex="V_m" />)</>}
                    symbol={<MathTex tex="V_m" />}
                    formula={<MathTex tex="A \cdot b" />}
                    result={<MathTex tex="\text{Região inferior do bloco com altura } b" />}
                    unit=""
                  />
                  <CalculationLine
                    theme="blue"
                    label={<>Volume Total do Bloco de Aço (<MathTex tex="V_{\text{total}}" />)</>}
                    symbol={<MathTex tex="V_{\text{total}}" />}
                    formula={<MathTex tex="V_a + V_m = A \cdot (a + b)" />}
                    result={<MathTex tex="\text{Altura total imersa } H = a + b" />}
                    unit=""
                    isSubHeader
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-emerald-200 dark:bg-emerald-800"></div> ETAPA 3 – Aplicação do Princípio de Arquimedes{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="cyan"
                    label={<>Empuxo Exercido pela Água (<MathTex tex="E_{\text{água}}" />)</>}
                    symbol={<MathTex tex="E_{\text{água}}" />}
                    formula={<MathTex tex="\gamma_a \cdot V_a = \gamma_a \cdot A \cdot a" />}
                    result={<MathTex tex="\text{Vertical para cima (camada superior)}" />}
                    unit=""
                  />
                  <CalculationLine
                    theme="emerald"
                    label={<>Empuxo Exercido pelo Mercúrio (<MathTex tex="E_{\text{mercúrio}}" />)</>}
                    symbol={<MathTex tex="E_{\text{mercúrio}}" />}
                    formula={<MathTex tex="\gamma_m \cdot V_m = \gamma_m \cdot A \cdot b" />}
                    result={<MathTex tex="\text{Vertical para cima (camada inferior)}" />}
                    unit=""
                  />
                  <CalculationLine
                    theme="red"
                    label={<>Peso Próprio do Bloco de Aço (<MathTex tex="P" />)</>}
                    symbol={<MathTex tex="P" />}
                    formula={<MathTex tex="\gamma_s \cdot V_{\text{total}} = \gamma_s \cdot A \cdot (a + b)" />}
                    result={<MathTex tex="\text{Vertical para baixo}" />}
                    unit=""
                    isSubHeader
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-blue-200 dark:bg-blue-800"></div> ETAPA 4 – Equação de Equilíbrio Vertical{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="blue"
                    label={<>Balanço de Forças Verticais (<MathTex tex="\sum F_y = 0" />)</>}
                    symbol={<MathTex tex="P" />}
                    formula={<MathTex tex="E_{\text{água}} + E_{\text{mercúrio}} = P" />}
                    result={
                      <MathTex
                        tex="\gamma_a \cdot A \cdot a + \gamma_m \cdot A \cdot b = \gamma_s \cdot A \cdot (a + b)"
                      />
                    }
                    unit=""
                    isSubHeader
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-amber-200 dark:bg-amber-800"></div> ETAPA 5 – Substituição das Densidades Relativas{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="amber"
                    label={<>Dividindo ambos os membros por <MathTex tex="\gamma_{\text{água,ref}} \cdot A" /></>}
                    symbol={<MathTex tex="d_a a + d_m b" />}
                    formula={<MathTex tex="d_a \cdot a + d_m \cdot b = d_s \cdot (a + b)" />}
                    substitution={
                      <MathTex
                        tex={`${texNum(physics.upperFluidRelativeDensity.toFixed(2))} \\cdot a + ${texNum(physics.lowerFluidRelativeDensity.toFixed(2))} \\cdot b = ${texNum(physics.bodyRelativeDensity.toFixed(2))} \\cdot (a + b)`}
                      />
                    }
                    result={
                      <MathTex
                        tex={`${texNum(physics.upperFluidRelativeDensity.toFixed(2))}\\,a + ${texNum(physics.lowerFluidRelativeDensity.toFixed(2))}\\,b = ${texNum(physics.bodyRelativeDensity.toFixed(2))}\\,a + ${texNum(physics.bodyRelativeDensity.toFixed(2))}\\,b`}
                      />
                    }
                    unit=""
                    isSubHeader
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-slate-300 dark:bg-slate-700"></div> ETAPA 6 – Simplificação Algébrica{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="slate"
                    label={<>Agrupando os termos em <MathTex tex="a" /> e <MathTex tex="b" /></>}
                    symbol={<MathTex tex="(d_s - d_a)\,a" />}
                    formula={<MathTex tex="(d_s - d_a) \cdot a = (d_m - d_s) \cdot b" />}
                    substitution={
                      <MathTex
                        tex={`(${texNum(physics.bodyRelativeDensity.toFixed(2))} - ${texNum(physics.upperFluidRelativeDensity.toFixed(2))}) \\cdot a = (${texNum(physics.lowerFluidRelativeDensity.toFixed(2))} - ${texNum(physics.bodyRelativeDensity.toFixed(2))}) \\cdot b`}
                      />
                    }
                    result={
                      <MathTex
                        tex={`${texNum(physics.denominatorDiff.toFixed(2))} \\cdot a = ${texNum(physics.numeratorDiff.toFixed(2))} \\cdot b`}
                      />
                    }
                    unit=""
                    isSubHeader
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-purple-200 dark:bg-purple-800"></div> ETAPA 7 – Determinação da Razão entre as Alturas a e b{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="purple"
                    label={<>Razão Adimensional (<MathTex tex="a / b" />)</>}
                    symbol={<MathTex tex="\frac{a}{b}" />}
                    formula={<MathTex tex="\frac{d_m - d_s}{d_s - d_a}" />}
                    substitution={
                      <MathTex
                        tex={`\\frac{${texNum(physics.numeratorDiff.toFixed(2))}}{${texNum(physics.denominatorDiff.toFixed(2))}}`}
                      />
                    }
                    result={
                      <MathTex
                        tex={`${texNum(physics.ratioAtoB.toFixed(4))} \\approx ${texNum(physics.ratioAtoB.toFixed(3))}`}
                      />
                    }
                    unit=""
                    isSubHeader
                  />
                  <CalculationLine
                    theme="cyan"
                    label={<>Altura Ilustrativa em Água (<MathTex tex="a" /> para <MathTex tex={`H = ${texNum(physics.illustrativeHeightCm.toFixed(0))}\\text{ cm}`} />)</>}
                    symbol={<MathTex tex="a" />}
                    formula={<MathTex tex="H \cdot \frac{d_m - d_s}{d_m - d_a}" />}
                    substitution={
                      <MathTex
                        tex={`${texNum(physics.illustrativeHeightCm.toFixed(0))} \\cdot \\frac{${texNum(physics.numeratorDiff.toFixed(2))}}{${texNum(physics.totalDensitySpan.toFixed(2))}}`}
                      />
                    }
                    result={
                      <MathTex
                        tex={`${texNum(physics.heightA_cm.toFixed(2))}\\text{ cm}\\;(${texNum((physics.fractionA * 100).toFixed(2))}\\%)`}
                      />
                    }
                    unit=""
                  />
                  <CalculationLine
                    theme="slate"
                    label={<>Altura Ilustrativa em Mercúrio (<MathTex tex="b" /> para <MathTex tex={`H = ${texNum(physics.illustrativeHeightCm.toFixed(0))}\\text{ cm}`} />)</>}
                    symbol={<MathTex tex="b" />}
                    formula={<MathTex tex="H \cdot \frac{d_s - d_a}{d_m - d_a}" />}
                    substitution={
                      <MathTex
                        tex={`${texNum(physics.illustrativeHeightCm.toFixed(0))} \\cdot \\frac{${texNum(physics.denominatorDiff.toFixed(2))}}{${texNum(physics.totalDensitySpan.toFixed(2))}}`}
                      />
                    }
                    result={
                      <MathTex
                        tex={`${texNum(physics.heightB_cm.toFixed(2))}\\text{ cm}\\;(${texNum((physics.fractionB * 100).toFixed(2))}\\%)`}
                      />
                    }
                    unit=""
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-emerald-200 dark:bg-emerald-800"></div> ETAPA 8 – Verificação do Equilíbrio (Geometria Ilustrativa){' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="cyan"
                    label={<>Empuxo da Água (<MathTex tex="E_{\text{água}}" />)</>}
                    symbol={<MathTex tex="E_{\text{água}}" />}
                    formula={<MathTex tex="\gamma_a \cdot A \cdot a" />}
                    substitution={
                      <MathTex
                        tex={`${texNum(physics.upperFluidSpecificWeight.toFixed(0))} \\cdot ${texNum(physics.baseArea.toFixed(4))} \\cdot ${texNum(physics.heightA_m.toFixed(4))}`}
                      />
                    }
                    result={
                      <MathTex
                        tex={`${texNum(physics.E_A.toFixed(1))}\\text{ N}\\;(${texNum((physics.E_A / 1000).toFixed(3))}\\text{ kN})`}
                      />
                    }
                    unit=""
                  />
                  <CalculationLine
                    theme="emerald"
                    label={<>Empuxo do Mercúrio (<MathTex tex="E_{\text{mercúrio}}" />)</>}
                    symbol={<MathTex tex="E_{\text{mercúrio}}" />}
                    formula={<MathTex tex="\gamma_m \cdot A \cdot b" />}
                    substitution={
                      <MathTex
                        tex={`${texNum(physics.lowerFluidSpecificWeight.toFixed(1))} \\cdot ${texNum(physics.baseArea.toFixed(4))} \\cdot ${texNum(physics.heightB_m.toFixed(4))}`}
                      />
                    }
                    result={
                      <MathTex
                        tex={`${texNum(physics.E_B.toFixed(1))}\\text{ N}\\;(${texNum((physics.E_B / 1000).toFixed(3))}\\text{ kN})`}
                      />
                    }
                    unit=""
                  />
                  <CalculationLine
                    theme="red"
                    label={<>Verificação: <MathTex tex="E_{\text{água}} + E_{\text{mercúrio}} = P" /></>}
                    symbol={<MathTex tex="E_{\text{total}} = P" />}
                    formula={<MathTex tex="E_{\text{água}} + E_{\text{mercúrio}}" />}
                    substitution={
                      <MathTex
                        tex={`${texNum(physics.E_A.toFixed(1))} + ${texNum(physics.E_B.toFixed(1))}`}
                      />
                    }
                    result={
                      <MathTex
                        tex={`${texNum(physics.buoyancyForce.toFixed(1))}\\text{ N} = P\\;(${texNum((physics.objectWeight / 1000).toFixed(3))}\\text{ kN})`}
                      />
                    }
                    unit=""
                    isSubHeader
                  />
                </div>
              </section>
            </>
          ) : physics.floatingEquilibriumMode ? (
            <>
              <section>
                <h4 className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-slate-300 dark:bg-slate-700"></div> ETAPA 1 – Identificação dos Dados{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="slate"
                    label={<>Diâmetro da Lata Cilíndrica (<MathTex tex="D" />)</>}
                    symbol={<MathTex tex="D" />}
                    result={
                      <MathTex
                        tex={`${texNum(physics.diameterCm.toFixed(1))}\\text{ cm} = ${texNum((physics.diameterCm / 100).toFixed(2))}\\text{ m}`}
                      />
                    }
                    unit=""
                  />
                  <CalculationLine
                    theme="slate"
                    label={<>Altura Total da Lata (<MathTex tex="H" />)</>}
                    symbol={<MathTex tex="H" />}
                    result={
                      <MathTex
                        tex={`${texNum(physics.totalHeightCm.toFixed(1))}\\text{ cm} = ${texNum((physics.totalHeightCm / 100).toFixed(2))}\\text{ m}`}
                      />
                    }
                    unit=""
                  />
                  <CalculationLine
                    theme="cyan"
                    label={<>Altura Submersa (<MathTex tex="h_{\text{sub}}" />)</>}
                    symbol={<MathTex tex="h_{\text{sub}}" />}
                    result={
                      <MathTex
                        tex={`${texNum(physics.submergedHeightCm.toFixed(1))}\\text{ cm} = ${texNum((physics.submergedHeightCm / 100).toFixed(2))}\\text{ m}`}
                      />
                    }
                    unit=""
                  />
                  <CalculationLine
                    theme="amber"
                    label={<>Altura Emersa (<MathTex tex="h_{\text{em}}" />)</>}
                    symbol={<MathTex tex="h_{\text{em}}" />}
                    formula={<MathTex tex="H - h_{\text{sub}}" />}
                    substitution={
                      <MathTex
                        tex={`${texNum(physics.totalHeightCm.toFixed(1))} - ${texNum(physics.submergedHeightCm.toFixed(1))}`}
                      />
                    }
                    result={
                      <MathTex
                        tex={`${texNum(physics.emergedHeightCm.toFixed(1))}\\text{ cm} = ${texNum((physics.emergedHeightCm / 100).toFixed(2))}\\text{ m}`}
                      />
                    }
                    unit=""
                  />
                  <CalculationLine
                    theme="blue"
                    label={<>Peso Específico do Fluido (<MathTex tex="\gamma_{\text{água}}" />)</>}
                    symbol={<MathTex tex="\gamma_{\text{água}}" />}
                    formula={<MathTex tex="\rho_{\text{água}} \cdot g" />}
                    substitution={
                      <MathTex
                        tex={`${texNum(physics.rhoA.toFixed(0))} \\cdot ${texNum(gravity.toFixed(2))}`}
                      />
                    }
                    result={
                      <MathTex
                        tex={`${texNum((physics.fluidSpecificWeight ?? 9810).toFixed(0))}\\text{ N/m}^3`}
                      />
                    }
                    unit=""
                    isSubHeader
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-blue-200 dark:bg-blue-800"></div> ETAPA 2 – Determinação da Área da Seção Transversal{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="blue"
                    label={<>Área da Seção Circular da Lata (<MathTex tex="A" />)</>}
                    symbol={<MathTex tex="A" />}
                    formula={<MathTex tex="\frac{\pi \cdot D^2}{4}" />}
                    substitution={
                      <MathTex
                        tex={`\\frac{\\pi \\cdot (${texNum((physics.diameterCm / 100).toFixed(2))})^2}{4}`}
                      />
                    }
                    result={
                      <MathTex
                        tex={`${texNum(physics.baseArea.toFixed(6))}\\text{ m}^2\\;(${texNum((physics.baseArea * 10000).toFixed(2))}\\text{ cm}^2)`}
                      />
                    }
                    unit=""
                    isSubHeader
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-cyan-200 dark:bg-cyan-800"></div> ETAPA 3 – Cálculo do Volume Submerso{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="cyan"
                    label={<>Volume Submerso Deslocado (<MathTex tex="V_{\text{sub}}" />)</>}
                    symbol={<MathTex tex="V_{\text{sub}}" />}
                    formula={<MathTex tex="A \cdot h_{\text{sub}}" />}
                    substitution={
                      <MathTex
                        tex={`${texNum(physics.baseArea.toFixed(6))} \\cdot ${texNum((physics.submergedHeightCm / 100).toFixed(2))}`}
                      />
                    }
                    result={
                      <MathTex
                        tex={`${texNum(physics.vol_deslocado.toFixed(6))}\\text{ m}^3\\;(${texNum((physics.vol_deslocado * 1e6).toFixed(2))}\\text{ cm}^3)`}
                      />
                    }
                    unit=""
                    isSubHeader
                  />
                  <CalculationLine
                    theme="slate"
                    label={<>Volume Total da Lata (<MathTex tex="V_{\text{total}}" />)</>}
                    symbol={<MathTex tex="V_{\text{total}}" />}
                    formula={<MathTex tex="A \cdot H" />}
                    substitution={
                      <MathTex
                        tex={`${texNum(physics.baseArea.toFixed(6))} \\cdot ${texNum((physics.totalHeightCm / 100).toFixed(2))}`}
                      />
                    }
                    result={
                      <MathTex
                        tex={`${texNum(physics.volume.toFixed(6))}\\text{ m}^3\\;(${texNum((physics.volume * 1e6).toFixed(2))}\\text{ cm}^3)`}
                      />
                    }
                    unit=""
                  />
                  <CalculationLine
                    theme="amber"
                    label={<>Volume Emerso (<MathTex tex="V_{\text{em}}" />)</>}
                    symbol={<MathTex tex="V_{\text{em}}" />}
                    formula={<MathTex tex="V_{\text{total}} - V_{\text{sub}}" />}
                    substitution={
                      <MathTex
                        tex={`${texNum(physics.volume.toFixed(6))} - ${texNum(physics.vol_deslocado.toFixed(6))}`}
                      />
                    }
                    result={
                      <MathTex
                        tex={`${texNum(physics.vol_emerso.toFixed(6))}\\text{ m}^3\\;(${texNum((physics.vol_emerso * 1e6).toFixed(2))}\\text{ cm}^3)`}
                      />
                    }
                    unit=""
                  />
                  <CalculationLine
                    theme="purple"
                    label={<>Fração Submersa (<MathTex tex="f_{\text{sub}}" />)</>}
                    symbol={<MathTex tex="f_{\text{sub}}" />}
                    formula={<MathTex tex="\frac{h_{\text{sub}}}{H}" />}
                    substitution={
                      <MathTex
                        tex={`\\frac{${texNum(physics.submergedHeightCm.toFixed(1))}}{${texNum(physics.totalHeightCm.toFixed(1))}}`}
                      />
                    }
                    result={<MathTex tex={`${texNum(physics.submergedPercentage.toFixed(2))}\\%`} />}
                    unit=""
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-emerald-200 dark:bg-emerald-800"></div> ETAPA 4 – Aplicação do Princípio de Arquimedes{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="emerald"
                    label={<>Expressão Geral do Empuxo Hidrostático (<MathTex tex="E" />)</>}
                    symbol={<MathTex tex="E" />}
                    formula={<MathTex tex="\gamma_{\text{água}} \cdot V_{\text{sub}}" />}
                    result={<MathTex tex="\text{Peso do volume de água deslocado pela parte submersa}" />}
                    unit=""
                    isSubHeader
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-emerald-200 dark:bg-emerald-800"></div> ETAPA 5 – Determinação do Empuxo{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="emerald"
                    label={<>Força de Empuxo Vertical (<MathTex tex="E" />)</>}
                    symbol={<MathTex tex="E" />}
                    formula={<MathTex tex="\gamma_{\text{água}} \cdot V_{\text{sub}}" />}
                    substitution={
                      <MathTex
                        tex={`${texNum((physics.fluidSpecificWeight ?? 9810).toFixed(0))} \\cdot ${texNum(physics.vol_deslocado.toFixed(6))}`}
                      />
                    }
                    result={<MathTex tex={`${texNum(physics.buoyancyForce.toFixed(2))}\\text{ N}`} />}
                    unit=""
                    isSubHeader
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-amber-200 dark:bg-amber-800"></div> ETAPA 6 – Aplicação da Condição de Equilíbrio{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="amber"
                    label={<>Equilíbrio Vertical na Flutuação Livre</>}
                    symbol={<MathTex tex="\sum F_y = 0" />}
                    formula={<MathTex tex="E - P = 0 \;\Rightarrow\; P = E" />}
                    result={<MathTex tex="\text{O peso próprio da lata iguala o empuxo hidrostático}" />}
                    unit=""
                    isSubHeader
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-6 h-px bg-purple-200 dark:bg-purple-800"></div> ETAPA 7 – Determinação do Peso da Lata{' '}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </h4>
                <div className="flex flex-col gap-0 bg-white dark:bg-slate-900/90 shadow-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CalculationLine
                    theme="purple"
                    label={<>Peso da Lata Flutuante (<MathTex tex="P" />)</>}
                    symbol={<MathTex tex="P" />}
                    formula={<MathTex tex="P = E" />}
                    substitution={
                      <MathTex
                        tex={`P = ${texNum(physics.buoyancyForce.toFixed(3))}\\text{ N}`}
                      />
                    }
                    result={<MathTex tex={`${texNum(physics.objectWeight.toFixed(2))}\\text{ N}`} />}
                    unit=""
                    isSubHeader
                  />
                  <CalculationLine
                    theme="slate"
                    label={<>Massa Equivalente da Lata (<MathTex tex="m" /> — complementar)</>}
                    symbol={<MathTex tex="m" />}
                    formula={<MathTex tex="\frac{P}{g}" />}
                    substitution={
                      <MathTex
                        tex={`\\frac{${texNum(physics.objectWeight.toFixed(3))}}{${texNum(gravity.toFixed(2))}}`}
                      />
                    }
                    result={
                      <MathTex
                        tex={`${texNum(physics.objectMass.toFixed(4))}\\text{ kg}\\;(${texNum((physics.objectMass * 1000).toFixed(1))}\\text{ g})`}
                      />
                    }
                    unit=""
                  />
                </div>
              </section>
            </>
          ) : physics.inverseSpecificWeightMode ? (
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
