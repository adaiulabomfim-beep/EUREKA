import React from 'react';
import { ArrowDown, ArrowUp, EyeOff, Ruler, Calculator, Weight, Droplets, Scale, CheckCircle2, Box } from 'lucide-react';
import { ResultsPanel, ResultsCard } from '../../../interface/PainelResultados';

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
      </ResultsPanel>
    </div>
  );
};
