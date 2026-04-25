import React, { useState, useEffect, useMemo } from 'react';
import { Maximize, AlertCircle } from 'lucide-react';
import { FormaComporta, PosicaoDobradica } from '../dominio/tipos';
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

export const Laboratorio: React.FC<GatePressureLabProps> = ({ onContextUpdate }) => {
  // STATE
  const [config, setConfig] = useState<ConfiguracaoSimulacaoComporta>({
    fluidoMontante: {
      chave: 'agua',
      nivel: 12,
      densidade: 1000,
      gravidade: 9.81,
    },
    fluidoJusante: {
      chave: 'agua',
      nivel: 0,
      densidade: 1000,
      gravidade: 9.81,
      ativo: false,
    },
    comporta: {
      ativa: true,
      forma: FormaComporta.RETANGULAR,
      largura: 2,
      altura: 3,
      profundidadeTopo: 4,
      angulo: 90,
      posicaoDobradica: PosicaoDobradica.NONE,
      temTirante: false,
      posicaoTiranteRelativa: 1,
      anguloTirante: 0,
      pesoProprio: 500,
      pesoProprioAtivo: false,
    }
  });

  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [analyzedResults, setAnalyzedResults] = useState<any | null>(null);

  const { fluidoMontante, fluidoJusante, comporta } = config;
  const { nivel: upstreamLevel, densidade: density, gravidade: gravity, chave: upstreamFluidKey } = fluidoMontante;
  const { nivel: downstreamLevel, ativo: hasDownstream, chave: downstreamFluidKey } = fluidoJusante;
  
  const { 
      ativa: hasGate, 
      forma: gateShape, 
      largura: gateWidth, 
      altura: gateHeight, 
      profundidadeTopo: gateDepthFromCrest, 
      angulo: gateInclination, 
      posicaoDobradica: hingePosition, 
      temTirante: hasTieRod, 
      posicaoTiranteRelativa: tieRodPosRel, 
      anguloTirante: tieRodAngle, 
      pesoProprio: gateWeight, 
      pesoProprioAtivo: gateWeightEnabled 
  } = comporta;
  
  const setHasDownstream = (val: boolean) => setConfig(prev => ({ 
    ...prev, 
    fluidoJusante: { ...prev.fluidoJusante, ativo: val } 
  }));
  
  // LOGIC
  const maxGateHeight = Math.max(0.1, 20 - config.comporta.profundidadeTopo);
  const maxWaterLevel = 25; 

  // Handler for toggling gate
  const toggleGate = (active: boolean) => {
      setConfig(prev => ({ 
          ...prev, 
          comporta: { ...prev.comporta, ativa: active },
          // Se ativar a comporta e a jusante estiver em 0, dá um nível inicial pra facilitar a visualização
          fluidoJusante: { 
            ...prev.fluidoJusante, 
            nivel: (active && prev.fluidoJusante.nivel === 0) ? 3 : prev.fluidoJusante.nivel 
          }
      }));
  };

  const loadPreset = (key: string) => {
      const preset = PRESETS[key];
      if (preset) {
          setConfig(preset);
      }
  };
  
  const liveResults = useMemo(() => simularComportas(config), [config]);

  useEffect(() => { setAnalyzedResults(null); }, [liveResults]);
  const handleCalculate = () => { setAnalyzedResults(liveResults); };

  useEffect(() => {
      if (onContextUpdate) {
          if (analyzedResults) {
              onContextUpdate(`LABORATÓRIO DE HIDROSTÁTICA: Comporta: ${gateShape}, H=${gateHeight}m, Larg=${gateWidth}m, θ=${gateInclination}°, Força Hidrostática Resultante: ${(analyzedResults.forceData.FR_net/1000).toFixed(2)} kN, CP ao longo da comporta: ${(analyzedResults.forceData.s_cp_net).toFixed(2)}m`);
          }
      }
  }, [analyzedResults, onContextUpdate, gateHeight, gateWidth, gateInclination, gateShape, upstreamLevel, downstreamLevel]);

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

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[800px]">
        
        {/* --- LEFT SIDEBAR: CONTROLS --- */}
        <PainelControles 
            config={config} 
            setConfig={setConfig} 
            hasDownstream={hasDownstream} 
            setHasDownstream={setHasDownstream} 
            maxGateHeight={maxGateHeight} 
            maxWaterLevel={maxWaterLevel} 
            toggleGate={toggleGate} 
            loadPreset={loadPreset} 
            presets={PRESETS}
            handleHeightChange={handleHeightChange} 
            handleShapeChange={handleShapeChange} 
        />

        {/* --- CENTER: SCENE --- */}
        <div className="lg:col-span-6 relative bg-white rounded-3xl border border-blue-100/50 shadow-2xl shadow-blue-200/20 overflow-hidden flex flex-col h-full min-h-[500px]">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 z-20"></div>
            <CenaPressaoComporta
                upstreamLevel={upstreamLevel} downstreamLevel={downstreamLevel}
                upstreamFluidKey={upstreamFluidKey} downstreamFluidKey={downstreamFluidKey}
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
        <PainelResultados 
          analyzedResults={analyzedResults}
          showDetails={showDetails}
          setShowDetails={setShowDetails}
          hingePosition={hingePosition}
          hasTieRod={hasTieRod}
        />
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
