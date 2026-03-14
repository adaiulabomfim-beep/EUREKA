import React from 'react';
import { ArrowDown, ArrowUp, EyeOff, Ruler, Calculator } from 'lucide-react';
import { ResultsPanel, ResultsCard } from '../../../interface/PainelResultados';

interface PainelResultadosProps {
  physics: any;
  isSimulating: boolean;
  enableTwoFluids: boolean;
  forceText: string;
  showCalculations: boolean;
  onToggleCalculations: () => void;
}

export const PainelResultados: React.FC<PainelResultadosProps> = ({
  physics,
  isSimulating,
  enableTwoFluids,
  forceText,
  showCalculations,
  onToggleCalculations,
}) => {
  return (
    <ResultsPanel
      footerButton={{
        label: showCalculations ? 'Ocultar Memorial' : 'Memorial de Cálculo',
        onClick: onToggleCalculations,
        icon: Calculator,
        disabled: !isSimulating,
      }}
    >
      <ResultsCard
        title="Peso Real (P)"
        value={physics.objectWeight >= 10000 ? (physics.objectWeight / 1000).toFixed(1) : physics.objectWeight.toFixed(1)}
        unit={physics.objectWeight >= 10000 ? 'kN' : 'N'}
        icon={ArrowDown}
        theme="red"
      />

      <ResultsCard
        title="Empuxo Total (E)"
        value={isSimulating ? (physics.buoyancyForce >= 10000 ? (physics.buoyancyForce / 1000).toFixed(1) : physics.buoyancyForce.toFixed(1)) : '???'}
        unit={isSimulating ? (physics.buoyancyForce >= 10000 ? 'kN' : 'N') : ''}
        icon={isSimulating ? ArrowUp : EyeOff}
        theme="green"
      />

      <ResultsCard
        title="Peso Aparente (Pap)"
        value={forceText}
        theme="blue"
        badge="DINAMÔMETRO"
      />

      <ResultsCard
        title="Estado do Objeto"
        value={isSimulating ? physics.status : 'PRONTO'}
        highlight={true}
      />

      <ResultsCard
        title="Altura Submersa (Hsub)"
        value={isSimulating ? (physics.h_sub_actual / 100).toFixed(2) : '?'}
        unit="m"
        icon={Ruler}
        theme="cyan"
        secondaryValue={enableTwoFluids && isSimulating ? `A: ${(physics.h_in_A / 100).toFixed(2)}m | B: ${(physics.h_in_B / 100).toFixed(2)}m` : undefined}
      />

      <ResultsCard
        title="Volume Deslocado (Vdesl)"
        value={isSimulating ? physics.vol_deslocado.toFixed(4) : '?'}
        unit="m³"
        theme="amber"
        badge="Vdesl = Vsub"
        secondaryValue={`Elevação do Nível (Δh): ${isSimulating ? physics.deltaH_cm.toFixed(2) : '?'} cm`}
      />
    </ResultsPanel>
  );
};
