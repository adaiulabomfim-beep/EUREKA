import React from 'react';
import { Construction, Calculator, RotateCw, MoveVertical, Maximize, AlertCircle, ArrowDown } from 'lucide-react';
import { ResultadoSimulacaoBarragem } from '../dominio/tipos';
import { ResultsPanel, ResultsCard } from '../../../../interface/PainelResultados';

interface PainelResultadosProps {
  analyzedResults: ResultadoSimulacaoBarragem | null;
  showDetails: boolean;
  setShowDetails: (val: boolean) => void;
}

export const PainelResultados: React.FC<PainelResultadosProps> = ({
  analyzedResults, showDetails, setShowDetails
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
            unit={analyzedResults ? 'kN/m' : ''}
            theme="blue"
            icon={ArrowDown}
          />

          {/* Center of Pressure Depth */}
          <ResultsCard
            title="Centro de Pressão (CP)"
            value={analyzedResults ? analyzedResults.forceData.y_cp_net.toFixed(2) : '?'}
            unit={analyzedResults ? 'm' : ''}
            theme="cyan"
            icon={MoveVertical}
            secondaryValue="Altura vertical a partir do fundo"
          />

          {/* Pressão Máxima */}
          <ResultsCard
            title="Pressão Máxima (Pé)"
            value={analyzedResults && 'p_max_up' in analyzedResults.forceData ? (analyzedResults.forceData.p_max_up / 1000).toFixed(2) : '?'}
            unit={analyzedResults ? 'kPa' : ''}
            theme="blue"
            icon={AlertCircle}
          />
          
          <ResultsCard
            title="Área Molhada"
            value={analyzedResults ? (analyzedResults.forceData.up?.area?.toFixed(2) || '0.00') : '?'}
            unit={analyzedResults ? 'm²/m' : ''}
            theme="slate"
            icon={Maximize}
          />

          {/* Stability Cards */}
          <ResultsCard
            title="Peso Próprio"
            value={analyzedResults && analyzedResults.stabilityData ? (analyzedResults.stabilityData.weight / 1000).toFixed(2) : '???'}
            unit={analyzedResults ? 'kN/m' : ''}
            theme="slate"
            icon={Construction}
          />

          <ResultsCard
            title="FS Tombamento"
            value={analyzedResults && analyzedResults.stabilityData ? analyzedResults.stabilityData.fs_tomb.toFixed(2) : '?'}
            unit=""
            theme={analyzedResults && analyzedResults.stabilityData ? (analyzedResults.stabilityData.fs_tomb >= 2 ? "green" : analyzedResults.stabilityData.fs_tomb >= 1.5 ? "amber" : "red") : "slate"}
            icon={RotateCw}
          />
          
          <ResultsCard
            title="FS Deslizamento"
            value={analyzedResults && analyzedResults.stabilityData ? analyzedResults.stabilityData.fs_desl.toFixed(2) : '?'}
            unit=""
            theme={analyzedResults && analyzedResults.stabilityData ? (analyzedResults.stabilityData.fs_desl >= 1.5 ? "green" : analyzedResults.stabilityData.fs_desl >= 1.0 ? "amber" : "red") : "slate"}
            icon={MoveVertical}
          />
        </>
      </ResultsPanel>
    </div>
  );
};
