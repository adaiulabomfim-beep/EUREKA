import React from 'react';
import { ResultsPanel, ResultsCard } from '../../../../interface/PainelResultados';
import { Calculator, ArrowDown, MoveVertical, RotateCw, Maximize, AlertCircle } from 'lucide-react';
import { PosicaoDobradica } from '../dominio/tipos';

interface PainelResultadosProps {
  analyzedResults: any;
  showDetails: boolean;
  setShowDetails: (val: boolean) => void;
  hingePosition: PosicaoDobradica;
  hasTieRod: boolean;
}

export const PainelResultados: React.FC<PainelResultadosProps> = ({
  analyzedResults,
  showDetails,
  setShowDetails,
  hingePosition,
  hasTieRod
}) => {
  return (
    <div className="lg:col-span-3 flex flex-col gap-4 h-full">
      <ResultsPanel
        footerButton={{
          label: showDetails ? 'Ocultar Memória' : 'Memória de Cálculo',
          onClick: () => setShowDetails(!showDetails),
          icon: Calculator,
          disabled: !analyzedResults,
        }}
      >
        <>
          {/* Hydrostatic Force Card */}
          <ResultsCard
            title="Força Hidrostática Resultante"
            value={analyzedResults ? (Math.abs(analyzedResults.forceData.FR_net) / 1000).toFixed(2) : '???'}
            unit={analyzedResults ? 'kN' : ''}
            theme="blue"
            icon={ArrowDown}
          />

          {/* Center of Pressure Depth */}
          <ResultsCard
            title="Centro de Pressão (CP)"
            value={analyzedResults ? analyzedResults.forceData.s_cp_net.toFixed(2) : '?'}
            unit={analyzedResults ? 'm' : ''}
            theme="cyan"
            icon={MoveVertical}
            secondaryValue="Posição ao longo da face (do topo)"
          />

          {/* Equilibrium */}
          {(hingePosition !== PosicaoDobradica.NONE || hasTieRod) && (
            <>
              {hingePosition !== PosicaoDobradica.NONE && (
                <ResultsCard
                  title="Momento no Apoio"
                  value={analyzedResults ? (Math.abs(analyzedResults.equilibrium.M_hinge) / 1000).toFixed(2) : '???'}
                  unit={analyzedResults ? 'kN·m' : ''}
                  theme="purple"
                  icon={RotateCw}
                />
              )}
              {hasTieRod && (
                <ResultsCard
                  title="Força no Tirante"
                  value={analyzedResults ? (Math.abs(analyzedResults.equilibrium.F_tie) / 1000).toFixed(2) : '???'}
                  unit={analyzedResults ? 'kN' : ''}
                  theme="amber"
                  icon={RotateCw}
                />
              )}
            </>
          )}

          {/* Geometry Properties */}
          <ResultsCard
            title="Área Molhada (Montante)"
            value={analyzedResults ? analyzedResults.forceData.up.area.toFixed(2) : '?'}
            unit={analyzedResults ? 'm²' : ''}
            theme="slate"
            icon={Maximize}
          />
          
          <ResultsCard
            title="Área Molhada (Jusante)"
            value={analyzedResults ? analyzedResults.forceData.down.area.toFixed(2) : '?'}
            unit={analyzedResults ? 'm²' : ''}
            theme="slate"
            icon={Maximize}
          />
        </>
      </ResultsPanel>
    </div>
  );
};

