import React from 'react';
import { ResultsPanel, ResultsCard } from '../../../../interface/PainelResultados';
import { Calculator, ArrowDown, MoveVertical, RotateCw, Maximize, Droplets, Compass } from 'lucide-react';
import { PosicaoDobradica, SistemaUnidades } from '../dominio/tipos';

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
  const isKgf = analyzedResults?.sistemaUnidades === SistemaUnidades.TECNICO_KGF;
  const g = 9.81;

  let forceVal = '???';
  let forceUnit = '';
  let forceSec = '';

  if (analyzedResults) {
    const F_N = Math.abs(analyzedResults.forceData.FR_net);
    if (isKgf) {
      forceVal = Math.round(F_N / g).toLocaleString('pt-BR');
      forceUnit = 'kgf';
      forceSec = `${(F_N / 1000).toFixed(2)} kN`;
    } else {
      forceVal = (F_N / 1000).toFixed(2);
      forceUnit = 'kN';
      forceSec = `${Math.round(F_N / g).toLocaleString('pt-BR')} kgf`;
    }
  } else {
    forceSec = 'Clique em Analisar para calcular';
  }

  return (
    <div id="tour-resultados" data-tour="painel-resultados" className="lg:col-span-3 flex flex-col gap-4 h-full">
      <ResultsPanel
        footerButton={{
          label: showDetails ? 'Ocultar Memorial' : 'Memorial',
          onClick: () => setShowDetails(!showDetails),
          icon: Calculator,
          disabled: !analyzedResults,
        }}
      >
        <>
          {/* Hydrostatic Force Card */}
          <ResultsCard
            title="Força Hidrostática Resultante"
            value={forceVal}
            unit={forceUnit}
            secondaryValue={forceSec}
            theme="blue"
            leftIcon={Droplets}
          />

          {/* Distância Inclinada Y_CG */}
          <ResultsCard
            title={<>Distância Inclinada (y<sub>CG</sub>)</>}
            value={analyzedResults?.forceData?.up?.Y_CG !== undefined ? analyzedResults.forceData.up.Y_CG.toFixed(2) : '???'}
            unit={analyzedResults ? 'm' : ''}
            theme="cyan"
            leftIcon={Compass}
            secondaryValue="Da linha d'água ao Centróide (CG)"
          />

          {/* Distância Inclinada Y_CP */}
          <ResultsCard
            title={<>Distância Inclinada (y<sub>CP</sub>)</>}
            value={analyzedResults?.forceData?.up?.Y_CP !== undefined ? analyzedResults.forceData.up.Y_CP.toFixed(2) : '???'}
            unit={analyzedResults ? 'm' : ''}
            theme="cyan"
            leftIcon={MoveVertical}
            secondaryValue="Da linha d'água ao Centro de Pressão"
          />

          {/* Profundidade Vertical h_CG */}
          <ResultsCard
            title={<>Profundidade do Centróide (h<sub>CG</sub>)</>}
            value={analyzedResults?.forceData?.up?.h_cg !== undefined ? analyzedResults.forceData.up.h_cg.toFixed(2) : '???'}
            unit={analyzedResults ? 'm' : ''}
            theme="slate"
            leftIcon={MoveVertical}
            secondaryValue="Profundidade vertical da superfície livre"
          />

          {/* Profundidade Vertical h_CP */}
          <ResultsCard
            title={<>Profundidade Vertical (h<sub>CP</sub>)</>}
            value={analyzedResults?.forceData?.up?.h_cp !== undefined ? analyzedResults.forceData.up.h_cp.toFixed(2) : '???'}
            unit={analyzedResults ? 'm' : ''}
            theme="slate"
            leftIcon={MoveVertical}
            secondaryValue="Profundidade vertical do ponto de aplicação"
          />

          {/* Equilibrium */}
          {(hingePosition !== PosicaoDobradica.NONE || hasTieRod) && (
            <>
              {hingePosition !== PosicaoDobradica.NONE && (
                <ResultsCard
                  title="Momento no Apoio"
                  value={analyzedResults ? (Math.abs(analyzedResults.equilibrium.M_hinge) / (isKgf ? g : 1000)).toFixed(2) : '???'}
                  unit={analyzedResults ? (isKgf ? 'kgf·m' : 'kN·m') : ''}
                  theme="purple"
                  leftIcon={RotateCw}
                />
              )}
              {hasTieRod && (
                <ResultsCard
                  title="Força no Tirante"
                  value={analyzedResults ? (Math.abs(analyzedResults.equilibrium.F_tie) / (isKgf ? g : 1000)).toFixed(2) : '???'}
                  unit={analyzedResults ? (isKgf ? 'kgf' : 'kN') : ''}
                  theme="amber"
                  leftIcon={ArrowDown}
                />
              )}
            </>
          )}

          {/* Geometry Properties */}
          <ResultsCard
            title="Área Molhada (Montante)"
            value={analyzedResults ? analyzedResults.forceData.up.area.toFixed(4) : '???'}
            unit={analyzedResults ? 'm²' : ''}
            theme="slate"
            leftIcon={Maximize}
          />
        </>
      </ResultsPanel>
    </div>
  );
};

