import React from 'react';
import { ArrowDown, ArrowUp, EyeOff, Ruler, Calculator, Weight, Droplets, Scale, CheckCircle2, Box, Gauge } from 'lucide-react';
import { ResultsPanel, ResultsCard } from '../../../interface/PainelResultados';
import { MathTex } from '@/src/components/ui/MathTex';

interface PainelResultadosProps {
  physics: any;
  isSimulating: boolean;
  enableTwoFluids: boolean;
  forceText: string;
  showCalculations: boolean;
  onToggleCalculations: () => void;
  specialResult?: {
    title: string;
    value: string;
    unit?: string;
    description?: string;
  } | null;
}

export const PainelResultados: React.FC<PainelResultadosProps> = ({
  physics,
  isSimulating,
  enableTwoFluids,
  forceText,
  showCalculations,
  onToggleCalculations,
  specialResult,
}) => {
  const getStatusHighlight = (status: string, simulating: boolean): string => {
    if (!simulating) return 'slate';
    if (status.includes('AFUNDADO')) return 'red';
    if (status.includes('NEUTRO') || status.includes('SUSPENSO')) return 'amber';
    if (status.includes('INTERFACE')) return 'blue';
    if (status.includes('FLUTUANDO')) return 'green';
    return 'purple';
  };

  const isInverseMode = Boolean(physics?.inverseSpecificWeightMode);
  const isValidInverse = Boolean(physics?.inverseValid);

  return (
    <div id="tour-resultados" data-tour="painel-resultados" className="lg:col-span-3 flex flex-col gap-3 h-[600px] lg:h-full lg:max-h-full min-h-0 overflow-hidden">
      <ResultsPanel
        footerButton={{
          label: showCalculations ? 'Ocultar Memorial' : 'Memorial',
          onClick: onToggleCalculations,
          icon: Calculator,
          disabled: !isSimulating,
        }}
      >
        {isInverseMode ? (
          <>
            <ResultsCard
              title={<>Peso Específico Médio (<MathTex tex="\gamma_c" />)</>}
              value={
                isSimulating
                  ? isValidInverse
                    ? `${Math.round(physics.objectSpecificWeight).toLocaleString('pt-BR')} N/m³`
                    : 'DADOS INVÁLIDOS'
                  : 'PRONTO (?)'
              }
              highlight={true}
              leftIcon={Gauge}
              highlightTheme={isSimulating ? (isValidInverse ? 'purple' : 'red') : 'slate'}
              secondaryValue={
                isSimulating
                  ? isValidInverse
                    ? `Resultado Principal | ${(physics.objectSpecificWeight / 1000).toFixed(3).replace('.', ',')} kN/m³`
                    : 'Peso real deve superar o peso aparente'
                  : 'Execute a análise para determinar γc'
              }
            />

            <ResultsCard
              title={<>Peso Real no Ar (<MathTex tex="P" />)</>}
              value={physics.objectWeight.toFixed(1).replace('.', ',')}
              unit="N"
              secondaryValue={`${(physics.objectWeight / 1000).toFixed(3).replace('.', ',')} kN | Dado do ensaio`}
              leftIcon={Weight}
              icon={ArrowDown}
              theme="red"
            />

            <ResultsCard
              title={<>Peso Aparente na Água (<MathTex tex="P_{ap}" />)</>}
              value={physics.apparentWeight.toFixed(1).replace('.', ',')}
              unit="N"
              secondaryValue={`${(physics.apparentWeight / 1000).toFixed(3).replace('.', ',')} kN | Resultante`}
              leftIcon={Scale}
              theme="blue"
              badge="DINAMÔMETRO"
            />

            <ResultsCard
              title={<>Empuxo (<MathTex tex="E" />)</>}
              value={isSimulating ? physics.buoyancyForce.toFixed(1).replace('.', ',') : '?'}
              unit={isSimulating ? 'N' : ''}
              secondaryValue={
                isSimulating
                  ? `${(physics.buoyancyForce / 1000).toFixed(3).replace('.', ',')} kN | E = P − Pap`
                  : 'E = P − Pap'
              }
              leftIcon={Droplets}
              icon={isSimulating ? ArrowUp : EyeOff}
              theme="green"
            />

            <ResultsCard
              title={<>Volume Deslocado (<MathTex tex="V_{desl}" />)</>}
              value={isSimulating ? physics.vol_deslocado.toFixed(5).replace('.', ',') : '?'}
              unit={isSimulating ? 'm³' : ''}
              leftIcon={Box}
              theme="amber"
              badge="V = E / γf"
              secondaryValue={
                isSimulating
                  ? `${(physics.vol_deslocado * 1000).toFixed(2).replace('.', ',')} L | Corpo totalmente imerso`
                  : 'Princípio de Arquimedes'
              }
            />

            <ResultsCard
              title={<>Densidade do Material (<MathTex tex="\rho_c" />)</>}
              value={isSimulating ? Math.round(physics.objectDensity).toLocaleString('pt-BR') : '?'}
              unit={isSimulating ? 'kg/m³' : ''}
              leftIcon={CheckCircle2}
              theme="cyan"
              secondaryValue={
                isSimulating
                  ? `ρc = γc / g | ${physics.status}`
                  : 'Informação complementar (g = 9,81 m/s²)'
              }
            />
          </>
        ) : (
          <>
            <ResultsCard
              title="Peso Real (P)"
              value={(physics.objectWeight / 1000).toFixed(2)}
              unit="kN"
              secondaryValue={`${physics.objectWeight.toFixed(1)} N`}
              leftIcon={Weight}
              icon={ArrowDown}
              theme="red"
            />

            <ResultsCard
              title="Empuxo Total (E)"
              value={isSimulating ? (physics.buoyancyForce / 1000).toFixed(2) : '???'}
              unit={isSimulating ? 'kN' : ''}
              secondaryValue={isSimulating ? `${physics.buoyancyForce.toFixed(1)} N` : undefined}
              leftIcon={Droplets}
              icon={isSimulating ? ArrowUp : EyeOff}
              theme="green"
            />

            <ResultsCard
              title="Peso Aparente (Pap)"
              value={isSimulating ? (physics.apparentWeight / 1000).toFixed(2) : '?'}
              unit={isSimulating ? 'kN' : ''}
              secondaryValue={
                isSimulating
                  ? physics.apparentWeight > 0
                    ? `${physics.apparentWeight.toFixed(1)} N`
                    : '0.0 N (Flutuando / Suspenso)'
                  : undefined
              }
              leftIcon={Scale}
              theme="blue"
              badge="DINAMÔMETRO"
            />

            <ResultsCard
              title="Estado do Objeto"
              value={isSimulating ? physics.status : 'PRONTO'}
              highlight={true}
              leftIcon={CheckCircle2}
              highlightTheme={getStatusHighlight(physics.status, isSimulating)}
              secondaryValue={
                isSimulating
                  ? physics.isShallowTank
                    ? 'Apoiado no fundo (lâmina líquida insuficiente)'
                    : physics.equivalentDensity
                    ? `Densidade Eq.: ${physics.equivalentDensity.toFixed(1)} kg/m³`
                    : undefined
                  : undefined
              }
            />

            <ResultsCard
              title="Altura Submersa (Hsub)"
              value={isSimulating ? physics.h_sub_actual.toFixed(2) : '?'}
              unit={isSimulating ? 'cm' : ''}
              leftIcon={Droplets}
              icon={Ruler}
              theme="cyan"
              secondaryValue={
                isSimulating
                  ? enableTwoFluids
                    ? `${(physics.h_sub_actual / 100).toFixed(4)} m | A: ${physics.h_in_A.toFixed(2)} cm | B: ${physics.h_in_B.toFixed(2)} cm`
                    : `Equivalente: ${(physics.h_sub_actual / 100).toFixed(4)} m`
                  : undefined
              }
            />

            <ResultsCard
              title="Volume Deslocado (Vdesl)"
              value={isSimulating ? physics.vol_deslocado.toFixed(4) : '?'}
              unit={isSimulating ? 'm³' : ''}
              leftIcon={Box}
              theme="amber"
              badge="Vdesl = Vsub"
              secondaryValue={
                isSimulating
                  ? `${(physics.vol_deslocado * 1000).toFixed(2)} L | Δh: ${physics.deltaH_cm.toFixed(2)} cm`
                  : 'Elevação do Nível (Δh): ? cm'
              }
            />

            {specialResult && (
              <ResultsCard
                title={specialResult.title}
                value={specialResult.value}
                unit={specialResult.unit}
                theme="purple"
                badge="INCÓGNITA"
                secondaryValue={specialResult.description}
              />
            )}
          </>
        )}
      </ResultsPanel>
    </div>
  );
};
