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
        {analyzedResults ? (
          <>
            {/* Hydrostatic Force Card */}
            <ResultsCard
              title="Força Hidrostática Resultante"
              value={(Math.abs(analyzedResults.forceData.FR_net) / 1000).toFixed(2)}
              unit="kN"
              theme="blue"
              icon={ArrowDown}
            />

            {/* Center of Pressure Depth */}
            <ResultsCard
              title="Centro de Pressão (CP)"
              value={analyzedResults.forceData.s_cp_net.toFixed(2)}
              unit="m"
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
                    value={(Math.abs(analyzedResults.equilibrium.M_hinge) / 1000).toFixed(2)}
                    unit="kN·m"
                    theme="purple"
                    icon={RotateCw}
                  />
                )}
                {hasTieRod && (
                  <ResultsCard
                    title="Força no Tirante"
                    value={(Math.abs(analyzedResults.equilibrium.F_tie) / 1000).toFixed(2)}
                    unit="kN"
                    theme="amber"
                    icon={RotateCw}
                  />
                )}
              </>
            )}

            {/* Geometry Properties */}
            <ResultsCard
              title="Área Molhada (Montante)"
              value={analyzedResults.forceData.up.area.toFixed(2)}
              unit="m²"
              theme="slate"
              icon={Maximize}
            />
            
            <ResultsCard
              title="Área Molhada (Jusante)"
              value={analyzedResults.forceData.down.area.toFixed(2)}
              unit="m²"
              theme="slate"
              icon={Maximize}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 p-4 py-20">
            <div className="bg-blue-50 p-4 rounded-full mb-3">
              <AlertCircle className="w-8 h-8 text-blue-400" />
            </div>
            <h4 className="text-sm font-black text-slate-600 tracking-tight">Aguardando análise</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px] font-medium">
              Configure os parâmetros e clique em "Analisar" na área central.
            </p>
          </div>
        )}
      </ResultsPanel>
    </div>
  );
};

