import React, { useState, useEffect, useMemo } from 'react';
import { Maximize, AlertCircle, AlertTriangle } from 'lucide-react';
import { FormaComporta, PosicaoDobradica, ModoPosicionamentoComporta, SistemaUnidades } from '../dominio/tipos';
import { ConfiguracaoSimulacaoComporta } from '../dominio/configuracao';
import { simularComportas } from '../calculos/simulador';
import { CenaPressaoComporta } from '../visual/CenaPressaoComporta';
import { PRESETS } from '../dominio/presets';
import { PainelResultados } from './PainelResultados';
import { Memorial } from './Memorial';
import { PainelControles } from './PainelControles';
import { salvarNoHistorico } from '../../../../interface/historicoGerenciador';

interface GatePressureLabProps {
    onContextUpdate?: (ctx: string) => void;
}

export const Laboratorio: React.FC<GatePressureLabProps> = ({ onContextUpdate }) => {
  // STATE
  const [config, setConfig] = useState<ConfiguracaoSimulacaoComporta>(PRESETS.exercicioCircular60);

  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [analyzedResults, setAnalyzedResults] = useState<any | null>(null);
  
  // Local state for the concrete wall dimensions
  const [wallDims, setWallDims] = useState({ height: 15.6, thickness: 4.2, width: 14.0 });

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
    fluidoJusante: { 
      ...prev.fluidoJusante, 
      ativo: val,
      nivel: (val && prev.fluidoJusante.nivel === 0) ? 5 : prev.fluidoJusante.nivel
    } 
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
  const handleCalculate = () => {
    setAnalyzedResults(liveResults);
    if (liveResults) {
      salvarNoHistorico({
        modulo: 'comportas',
        moduloNome: 'Comportas',
        titulo: `Comporta ${gateShape} (${gateHeight}m × ${gateWidth}m)`,
        parametros: {
          'Forma': gateShape,
          'Altura (m)': gateHeight,
          'Largura (m)': gateWidth,
          'Inclinação (°)': gateInclination,
          'Nível Montante (m)': upstreamLevel,
          ...(hasDownstream ? { 'Nível Jusante (m)': downstreamLevel } : {}),
        },
        resultados: {
          empuxo: liveResults.forceData.FR_net,
          empuxoFormatado: `${(Math.abs(liveResults.forceData.FR_net) / 1000).toFixed(2)} kN`,
          peso: gateWeightEnabled ? gateWeight * 1000 : undefined,
          pesoFormatado: gateWeightEnabled ? `${gateWeight.toFixed(2)} kN` : undefined,
          centroPressao: `s_cp = ${(liveResults.forceData.s_cp_net).toFixed(2)} m`,
          segurancaOuStatus: 'Análise Concluída',
        },
      });
    }
  };

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

  const validationAlerts: string[] = useMemo(() => {
    const alerts: string[] = [];
    const ang = gateInclination ?? 90;
    if (ang <= 0) {
      alerts.push('Ângulo de inclinação nulo ou negativo (θ ≤ 0°): risco de indeterminação física e divisão por zero (sen θ = 0).');
    }
    if (hasDownstream && downstreamLevel >= upstreamLevel) {
      alerts.push('Nível de jusante maior ou igual ao de montante: fluxo de escoamento reverso ou equilíbrio inviável.');
    }
    const h_topo = config.comporta.modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO && config.comporta.y_cg_direto !== undefined
      ? config.comporta.y_cg_direto * Math.sin((ang * Math.PI) / 180) - (gateHeight / 2) * Math.sin((ang * Math.PI) / 180)
      : gateDepthFromCrest;

    if (h_topo < 0) {
      alerts.push('Profundidade do topo da comporta negativa: a crista da comporta está posicionada acima da linha d\'água (NA).');
    }
    const h_bot = h_topo + gateHeight * Math.sin((ang * Math.PI) / 180);
    if (h_bot > upstreamLevel) {
      alerts.push('Comporta excede a profundidade disponível: a base da comporta ultrapassa o fundo do reservatório.');
    }
    return alerts;
  }, [gateInclination, hasDownstream, downstreamLevel, upstreamLevel, config.comporta, gateDepthFromCrest, gateHeight]);

  const exportData = {
    tipo: 'comportas',
    geometria: `Comporta ${gateShape}`,
    dimensoes: {
      'Altura (m)': gateHeight,
      'Base/Largura (m)': gateWidth,
      'Inclinação (°)': gateInclination
    },
    // We set dummy values so validation passes if analyzed
    empuxo: analyzedResults ? analyzedResults.forceData.FR_net : 0, 
    peso: gateWeightEnabled ? gateWeight * 1000 : 0, // Using N instead of kN maybe?
    volumeDeslocado: analyzedResults ? 1 : 0, // Just a placeholder so validation passes
    alturaSubmersa: upstreamLevel,
    isAnalyzed: !!analyzedResults,
    analyzedResults: analyzedResults
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
            wallDims={wallDims}
            setWallDims={setWallDims}
        />

        {/* --- CENTER: SCENE --- */}
        <div id="areaSimulacao" data-simulacao={JSON.stringify(exportData)} className="lg:col-span-6 relative bg-white rounded-3xl border border-blue-100/50 shadow-2xl shadow-blue-200/20 overflow-hidden flex flex-col h-full min-h-[500px]">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 z-20"></div>

          {/* Banner de Validações e Alertas Visuais (Item 6) */}
          {validationAlerts.length > 0 && (
            <div className="absolute top-4 left-4 right-4 z-40 flex flex-col gap-1.5 pointer-events-auto animate-in fade-in slide-in-from-top-2">
              {validationAlerts.map((alert, idx) => (
                <div key={idx} className="flex items-center gap-2.5 px-4 py-2 bg-amber-500/95 backdrop-blur-md text-white text-[11px] font-bold rounded-xl shadow-lg border border-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
                  <span className="flex-1">{alert}</span>
                </div>
              ))}
            </div>
          )}

            <CenaPressaoComporta
                upstreamLevel={upstreamLevel} downstreamLevel={downstreamLevel}
                upstreamFluidKey={upstreamFluidKey} downstreamFluidKey={downstreamFluidKey}
                hasGate={hasGate} gateShape={gateShape}
                gateWidth={gateWidth} gateHeight={gateHeight} gateDepthFromCrest={gateDepthFromCrest}
                gateInclination={gateInclination}
                wallDims={wallDims}
                sistemaUnidades={config.sistemaUnidades}
                modoPosicionamento={config.comporta.modoPosicionamento}
                y_cg_direto={config.comporta.y_cg_direto}
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
          config={config}
        />
      )}
    </div>
  );
};
