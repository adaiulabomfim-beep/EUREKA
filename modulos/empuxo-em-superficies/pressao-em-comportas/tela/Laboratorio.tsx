import React, { useState, useEffect, useMemo } from 'react';
import { Layers, Info, Maximize, AlertCircle } from 'lucide-react';
import { TipoBarragem, FormaComporta, PosicaoDobradica } from '../dominio/tipos';
import { ConfiguracaoSimulacaoComporta } from '../dominio/configuracao';
import { simularComportas } from '../calculos/simulador';
import { CenaPressaoComporta } from '../visual/CenaPressaoComporta';
import { PRESETS } from '../dominio/presets';
import { PainelResultados } from './PainelResultados';
import { Memorial } from './Memorial';
import { PainelControles } from './PainelControles';

interface GatePressureLabProps {
    onContextUpdate?: (ctx: string) => void;
}

import { ResultsPanel, ResultsCard } from '../../../../interface/PainelResultados';
import { CalculationLine } from './Memorial';
import { Calculator, ArrowDown, MoveVertical, FileText, RotateCw } from 'lucide-react';

export const Laboratorio: React.FC<GatePressureLabProps> = ({ onContextUpdate }) => {
  // STATE
  const [config, setConfig] = useState<ConfiguracaoSimulacaoComporta>({
    barragem: {
      tipo: TipoBarragem.GRAVIDADE,
      altura: 15,
      larguraBase: 12,
      larguraCrista: 4,
      anguloInclinacao: 90,
    },
    fluido: {
      nivelMontante: 12,
      nivelJusante: 0,
      densidade: 1000,
      gravidade: 9.81,
    },
    comporta: {
      ativa: true,
      forma: FormaComporta.RETANGULAR,
      largura: 2,
      altura: 3,
      profundidadeCrista: 4,
      inclinacao: 90,
      posicaoDobradica: PosicaoDobradica.NONE,
      temTirante: false,
      posicaoTiranteRelativa: 1,
      anguloTirante: 0,
      pesoProprio: 500,
      pesoProprioAtivo: false,
    }
  });

  const [syncGateAngle, setSyncGateAngle] = useState<boolean>(true);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [analyzedResults, setAnalyzedResults] = useState<any | null>(null);

  const { barragem, fluido, comporta } = config;
  const { tipo: damType, altura: damHeight, larguraBase: damBaseWidth, larguraCrista: damCrestWidth, anguloInclinacao: inclinationAngle } = barragem;
  const { nivelMontante: upstreamLevel, nivelJusante: downstreamLevel, densidade: density, gravidade: gravity } = fluido;
  const { 
      ativa: hasGate, 
      forma: gateShape, 
      largura: gateWidth, 
      altura: gateHeight, 
      profundidadeCrista: gateDepthFromCrest, 
      inclinacao: gateInclination, 
      posicaoDobradica: hingePosition, 
      temTirante: hasTieRod, 
      posicaoTiranteRelativa: tieRodPosRel, 
      anguloTirante: tieRodAngle, 
      pesoProprio: gateWeight, 
      pesoProprioAtivo: gateWeightEnabled 
  } = comporta;
  
  const hasDownstream = downstreamLevel > 0;
  const setHasDownstream = (val: boolean) => setConfig(prev => ({ ...prev, fluido: { ...prev.fluido, nivelJusante: val ? prev.fluido.nivelJusante : 0 } }));
  
  // LOGIC
  useEffect(() => {
    setConfig(prev => {
        let newBarragem = { ...prev.barragem };
        switch (newBarragem.tipo) {
            case TipoBarragem.GRAVIDADE: newBarragem.anguloInclinacao = 90; newBarragem.larguraBase = newBarragem.altura * 0.8; newBarragem.larguraCrista = 4; break;
            case TipoBarragem.TERRA_ENROCAMENTO: newBarragem.anguloInclinacao = 45; newBarragem.larguraBase = newBarragem.altura * 3; newBarragem.larguraCrista = 6; break;
            case TipoBarragem.ARCO: newBarragem.anguloInclinacao = 90; newBarragem.larguraBase = 5; newBarragem.larguraCrista = 3; break;
            case TipoBarragem.CONTRAFORTE: newBarragem.anguloInclinacao = 70; newBarragem.larguraBase = newBarragem.altura * 0.9; newBarragem.larguraCrista = 2; break;
        }
        return { ...prev, barragem: newBarragem };
    });
  }, [config.barragem.tipo, config.barragem.altura]); 
  
  // Force sync when inclination changes if toggle is on
  useEffect(() => { 
      if (syncGateAngle) {
          setConfig(prev => ({ ...prev, comporta: { ...prev.comporta, inclinacao: prev.barragem.anguloInclinacao } }));
      }
  }, [config.barragem.anguloInclinacao, syncGateAngle]);

  const maxGateHeight = Math.max(0.1, config.barragem.altura - config.comporta.profundidadeCrista);
  const maxWaterLevel = config.barragem.altura + 5; 

  // Handler for toggling gate
  const toggleGate = (active: boolean) => {
      setConfig(prev => ({ ...prev, comporta: { ...prev.comporta, ativa: active } }));
      if (active) {
          setSyncGateAngle(true);
          setConfig(prev => ({ ...prev, comporta: { ...prev.comporta, inclinacao: prev.barragem.anguloInclinacao } }));
          setConfig(prev => ({ ...prev, fluido: { ...prev.fluido, nivelJusante: prev.fluido.nivelJusante === 0 ? 3 : prev.fluido.nivelJusante } }));
      }
  };

  const loadExercise6 = () => {
      setConfig(PRESETS.exercise30);
  };
  
  const configForSimulation: ConfiguracaoSimulacaoComporta = {
      ...config,
      fluido: { ...config.fluido, nivelJusante: downstreamLevel }
  };
  
  const liveResults = useMemo(() => simularComportas(configForSimulation), [configForSimulation]);

  useEffect(() => { setAnalyzedResults(null); }, [liveResults]);
  const handleCalculate = () => { setAnalyzedResults(liveResults); };

  useEffect(() => {
      if (onContextUpdate) {
          if (analyzedResults) {
              onContextUpdate(`LABORATÓRIO DE HIDROSTÁTICA: Comporta: ${gateShape}, H=${gateHeight}m, Larg=${gateWidth}m, θ=${gateInclination}°, Força Hidrostática Resultante: ${(analyzedResults.forceData.FR_net/1000).toFixed(2)} kN, CP ao longo da comporta: ${(analyzedResults.forceData.s_cp_net).toFixed(2)}m`);
          }
      }
  }, [analyzedResults, onContextUpdate, gateHeight, gateWidth, gateInclination, gateShape, damType, damHeight, damBaseWidth, damCrestWidth, inclinationAngle, upstreamLevel, downstreamLevel]);

  // Handle Dimensions based on shape
  const handleHeightChange = (val: number) => {
      setConfig(prev => {
          let newWidth = prev.comporta.largura;
          if (prev.comporta.forma === FormaComporta.CIRCULAR) { newWidth = val; }
          if (prev.comporta.forma === FormaComporta.SEMI_CIRCULAR) { newWidth = val * 2; }
          return { ...prev, comporta: { ...prev.comporta, altura: val, largura: newWidth } };
      });
  };

  const handleShapeChange = (newShape: FormaComporta) => {
      setConfig(prev => {
          let newWidth = prev.comporta.largura;
          if (newShape === FormaComporta.CIRCULAR) { newWidth = prev.comporta.altura; }
          if (newShape === FormaComporta.SEMI_CIRCULAR) { newWidth = prev.comporta.altura * 2; }
          return { ...prev, comporta: { ...prev.comporta, forma: newShape, largura: newWidth } };
      });
  };

  const labelClass = "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5";
  const selectClass = "w-full h-9 px-3 border border-blue-100 rounded-lg text-sm bg-blue-50/30 text-slate-800 font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm cursor-pointer hover:bg-white";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[800px]">
        
        {/* --- LEFT SIDEBAR: CONTROLS --- */}
        <PainelControles 
            config={config} 
            setConfig={setConfig} 
            syncGateAngle={syncGateAngle} 
            setSyncGateAngle={setSyncGateAngle} 
            hasDownstream={hasDownstream} 
            setHasDownstream={setHasDownstream} 
            maxGateHeight={maxGateHeight} 
            maxWaterLevel={maxWaterLevel} 
            toggleGate={toggleGate} 
            loadExercise6={loadExercise6} 
            handleHeightChange={handleHeightChange} 
            handleShapeChange={handleShapeChange} 
        />

        {/* --- CENTER: SCENE --- */}
        <div className="lg:col-span-6 flex flex-col h-full bg-slate-50 rounded-3xl border border-blue-100/50 overflow-hidden relative shadow-2xl shadow-blue-200/20">
             <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 z-10"></div>
            <CenaPressaoComporta
                damType={damType} damHeight={damHeight} damBaseWidth={damBaseWidth} damCrestWidth={damCrestWidth}
                inclinationAngle={inclinationAngle} upstreamLevel={upstreamLevel} downstreamLevel={downstreamLevel}
                hasGate={hasGate} gateShape={gateShape}
                gateWidth={gateWidth} gateHeight={gateHeight} gateDepthFromCrest={gateDepthFromCrest}
                gateInclination={gateInclination}
                force={analyzedResults ? analyzedResults.forceData.FR_net : 0} 
                s_cp={analyzedResults ? analyzedResults.forceData.s_cp_net : 0}
                hingePosition={hingePosition}
                hasTieRod={hasTieRod}
                tieRodPosRel={tieRodPosRel}
                tieRodAngle={tieRodAngle}
                gateWeight={gateWeight}
                gateWeightEnabled={gateWeightEnabled}
                isAnalyzed={!!analyzedResults}
                onCalculate={handleCalculate}
                onReset={() => setAnalyzedResults(null)}
            />
             <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-200/50 to-transparent pointer-events-none"></div>
        </div>

        {/* --- RIGHT SIDEBAR: RESULTS --- */}
        <div className="lg:col-span-3 flex flex-col gap-4 h-full">
          <PainelResultados
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
          </PainelResultados>
        </div>
      </div>

      {/* Floating Details Panel */}
      {showDetails && analyzedResults && (
        <Memorial 
          analyzedResults={analyzedResults} 
          onClose={() => setShowDetails(false)} 
          gateInclination={gateInclination}
          gateShape={gateShape}
        />
      )}
    </div>
  );
};
