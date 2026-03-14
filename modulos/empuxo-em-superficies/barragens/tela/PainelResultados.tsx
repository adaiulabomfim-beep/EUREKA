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
        {analyzedResults ? (
          <>
            {/* Hydrostatic Force Card */}
            <ResultsCard
              title="Força Hidrostática Resultante"
              value={(Math.abs(analyzedResults.forceData.FR_net) / 1000).toFixed(2)}
              unit="kN/m"
              theme="blue"
              icon={ArrowDown}
            />

            {/* Center of Pressure Depth */}
            <ResultsCard
              title="Centro de Pressão (CP)"
              value={analyzedResults.forceData.y_cp_net.toFixed(2)}
              unit="m"
              theme="cyan"
              icon={MoveVertical}
              secondaryValue="Altura vertical a partir do fundo"
            />

            {/* New Hydrostatic Cards */}
            {'p_max_up' in analyzedResults.forceData && (
              <ResultsCard
                title="Pressão Máxima (Pé)"
                value={(analyzedResults.forceData.p_max_up / 1000).toFixed(2)}
                unit="kPa"
                theme="blue"
                icon={AlertCircle}
              />
            )}
            
            <ResultsCard
              title="Área Molhada"
              value={analyzedResults.forceData.up?.area?.toFixed(2) || '0.00'}
              unit="m²/m"
              theme="slate"
              icon={Maximize}
            />

            {/* Stability Cards */}
            {analyzedResults.stabilityData && (
                <>
                    <ResultsCard
                    title="Peso Próprio"
                    value={(analyzedResults.stabilityData.weight / 1000).toFixed(2)}
                    unit="kN/m"
                    theme="slate"
                    icon={Construction}
                    />

                    <ResultsCard
                    title="FS Tombamento"
                    value={analyzedResults.stabilityData.fs_tomb.toFixed(2)}
                    unit=""
                    theme={analyzedResults.stabilityData.fs_tomb >= 2 ? "green" : analyzedResults.stabilityData.fs_tomb >= 1.5 ? "amber" : "red"}
                    icon={RotateCw}
                    />
                    
                    <ResultsCard
                    title="FS Deslizamento"
                    value={analyzedResults.stabilityData.fs_desl.toFixed(2)}
                    unit=""
                    theme={analyzedResults.stabilityData.fs_desl >= 1.5 ? "green" : analyzedResults.stabilityData.fs_desl >= 1.0 ? "amber" : "red"}
                    icon={MoveVertical}
                    />
                </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
            <Calculator className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">Configure os parâmetros e clique em "Analisar" para ver os resultados detalhados.</p>
          </div>
        )}
      </ResultsPanel>
    </div>
  );
};
