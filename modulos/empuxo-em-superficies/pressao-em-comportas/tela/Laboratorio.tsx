import React, { useState, useEffect, useMemo } from 'react';
import { Maximize, AlertCircle, AlertTriangle } from 'lucide-react';
import { FormaComporta, PosicaoDobradica, ModoPosicionamentoComporta, SistemaUnidades } from '../dominio/tipos';
import { ConfiguracaoSimulacaoComporta } from '../dominio/configuracao';
import { resolverGrauAberturaPercent, simularComportas } from '../calculos/simulador';
import { getGateYBarTotal } from '../calculos/hidrostatica';
import { CenaPressaoComporta } from '../visual/CenaPressaoComporta';
import { PRESETS, CONFIG_PADRAO_COMPORTA } from '../dominio/presets';
import { PainelResultados } from './PainelResultados';
import { Memorial } from './Memorial';
import { PainelControles } from './PainelControles';
import { salvarNoHistorico } from '../../../../interface/historicoGerenciador';

interface GatePressureLabProps {
    onContextUpdate?: (ctx: string) => void;
}

export const Laboratorio: React.FC<GatePressureLabProps> = ({ onContextUpdate }) => {
  // STATE
  const [config, setConfig] = useState<ConfiguracaoSimulacaoComporta>(CONFIG_PADRAO_COMPORTA);
  const [activePresetKey, setActivePresetKey] = useState<string | null>(null);

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
      apoioParedeLisa: hasSmoothWallSupport,
      posicaoTiranteRelativa: tieRodPosRel, 
      anguloTirante: tieRodAngle, 
      pesoProprio: gateWeight, 
      pesoProprioAtivo: gateWeightEnabled 
  } = comporta;

  const gateOpeningPercent = resolverGrauAberturaPercent(comporta);
  
  const setHasDownstream = (val: boolean) => setConfigManual(prev => ({ 
    ...prev, 
    fluidoJusante: { 
      ...prev.fluidoJusante, 
      ativo: val,
      nivel: (val && prev.fluidoJusante.nivel === 0)
        ? Math.max(0.5, Number((prev.fluidoMontante.nivel * 0.5).toFixed(1)))
        : prev.comporta.apoioFundoLiso
        ? prev.fluidoJusante.nivel
        : Math.min(prev.fluidoJusante.nivel, prev.fluidoMontante.nivel)
    } 
  }));
  
  // LOGIC
  const maxGateHeight = Math.max(0.1, 20 - config.comporta.profundidadeTopo);
  const maxWaterLevel = 25;

  const setGateOpeningPercent = (percent: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(percent)));
      setConfigManual(prev => ({
          ...prev,
          comporta: {
            ...prev.comporta,
            ativa: true,
            aberturaPercent: clamped,
          },
      }));
  };

  const loadPreset = (key: string) => {
      const preset = PRESETS[key];
      if (preset) {
          setConfig(preset);
          setActivePresetKey(key);
          setAnalyzedResults(null);
      }
  };

  const resetDefaults = () => {
      setConfig(CONFIG_PADRAO_COMPORTA);
      setActivePresetKey(null);
      setAnalyzedResults(null);
  };

  // Qualquer edição manual desvincula a simulação ativa
  const setConfigManual: React.Dispatch<React.SetStateAction<ConfiguracaoSimulacaoComporta>> = (action) => {
      setActivePresetKey(null);
      setConfig(action);
  };
  
  const liveResults = useMemo(() => simularComportas(config), [config]);

  useEffect(() => { setAnalyzedResults(null); }, [liveResults]);
  const handleCalculate = () => {
    setAnalyzedResults(liveResults);
    if (liveResults) {
      const weightN = gateWeightEnabled ? gateWeight * gravity : 0;
      const opLabel = liveResults.operacao
        ? `${liveResults.operacao.estadoLabel} (${liveResults.operacao.grauAberturaPercent}%)`
        : 'Fechada (0%)';
      salvarNoHistorico({
        modulo: 'comportas',
        moduloNome: 'Comportas',
        titulo: `Comporta ${gateShape} (${gateHeight}m × ${gateWidth}m)`,
        parametros: {
          'Forma': gateShape,
          'Estado': opLabel,
          'Altura (m)': gateHeight,
          'Largura (m)': gateWidth,
          'Inclinação (°)': gateInclination,
          'Nível Montante (m)': upstreamLevel,
          ...(hasDownstream ? { 'Nível Jusante (m)': downstreamLevel } : {}),
        },
        resultados: {
          empuxo: liveResults.forceData.FR_net,
          empuxoFormatado: `${(Math.abs(liveResults.forceData.FR_net) / 1000).toFixed(2)} kN`,
          peso: gateWeightEnabled ? weightN : undefined,
          pesoFormatado: gateWeightEnabled ? `${(weightN / 1000).toFixed(2)} kN (${gateWeight.toFixed(0)} kg)` : undefined,
          centroPressao: `s_cp = ${(liveResults.forceData.s_cp_net).toFixed(2)} m`,
          segurancaOuStatus: opLabel,
        },
      });
    }
  };

  useEffect(() => {
      if (onContextUpdate) {
          if (analyzedResults) {
              const opInfo = analyzedResults.operacao
                ? `Estado=${analyzedResults.operacao.estadoLabel} (${analyzedResults.operacao.grauAberturaPercent}%)`
                : '';
              onContextUpdate(`LABORATÓRIO DE HIDROSTÁTICA: Comporta: ${gateShape}, ${opInfo}, H=${gateHeight}m, Larg=${gateWidth}m, θ=${gateInclination}°, Força Hidrostática Referência: ${(analyzedResults.forceData.FR_net/1000).toFixed(2)} kN, CP ao longo da comporta: ${(analyzedResults.forceData.s_cp_net).toFixed(2)}m`);
          }
      }
  }, [analyzedResults, onContextUpdate, gateHeight, gateWidth, gateInclination, gateShape, upstreamLevel, downstreamLevel]);

  // Handle Dimensions based on shape
  const handleHeightChange = (val: number) => {
      setConfigManual(prev => {
          let newWidth = prev.comporta.largura;
          if (prev.comporta.forma === FormaComporta.CIRCULAR) { newWidth = val; }
          if (prev.comporta.forma === FormaComporta.SEMI_CIRCULAR) { newWidth = val * 2; }
          const sinTheta = Math.sin(((prev.comporta.angulo || 90) * Math.PI) / 180);
          const ybarTotal = getGateYBarTotal(prev.comporta.forma, val);
          if (prev.comporta.modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO && prev.comporta.y_cg_direto !== undefined) {
              const h_topo = prev.comporta.y_cg_direto * sinTheta - ybarTotal * sinTheta;
              return {
                  ...prev,
                  comporta: {
                      ...prev.comporta,
                      altura: val,
                      largura: newWidth,
                      profundidadeTopo: parseFloat(h_topo.toFixed(3)),
                  },
              };
          }
          const calculatedY_CG = prev.comporta.profundidadeTopo / Math.max(0.01, sinTheta) + ybarTotal;
          const nextProfTopo = prev.comporta.apoioFundoLiso
            ? Math.max(0, prev.fluidoMontante.nivel - val * sinTheta)
            : prev.comporta.profundidadeTopo;
          return {
              ...prev,
              comporta: {
                  ...prev.comporta,
                  altura: val,
                  largura: newWidth,
                  profundidadeTopo: nextProfTopo,
                  y_cg_direto: parseFloat(calculatedY_CG.toFixed(3)),
              },
          };
      });
  };

  const handleShapeChange = (newShape: FormaComporta) => {
      setConfigManual(prev => {
          let newWidth = prev.comporta.largura;
          if (newShape === FormaComporta.CIRCULAR) { newWidth = prev.comporta.altura; }
          if (newShape === FormaComporta.SEMI_CIRCULAR) { newWidth = prev.comporta.altura * 2; }
          const sinTheta = Math.sin(((prev.comporta.angulo || 90) * Math.PI) / 180);
          const ybarTotal = getGateYBarTotal(newShape, prev.comporta.altura);
          if (prev.comporta.modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO && prev.comporta.y_cg_direto !== undefined) {
              const h_topo = prev.comporta.y_cg_direto * sinTheta - ybarTotal * sinTheta;
              return {
                  ...prev,
                  comporta: {
                      ...prev.comporta,
                      forma: newShape,
                      largura: newWidth,
                      profundidadeTopo: parseFloat(h_topo.toFixed(3)),
                  },
              };
          }
          const calculatedY_CG = prev.comporta.profundidadeTopo / Math.max(0.01, sinTheta) + ybarTotal;
          return {
              ...prev,
              comporta: {
                  ...prev.comporta,
                  forma: newShape,
                  largura: newWidth,
                  y_cg_direto: parseFloat(calculatedY_CG.toFixed(3)),
              },
          };
      });
  };

  const validationAlerts: string[] = useMemo(() => {
    const alerts: string[] = [];
    const ang = gateInclination ?? 90;
    if (ang <= 0) {
      alerts.push('Ângulo de inclinação nulo ou negativo (θ ≤ 0°): risco de indeterminação física e divisão por zero (sen θ = 0).');
    }
    if (hasDownstream && downstreamLevel > upstreamLevel && !comporta.apoioFundoLiso) {
      alerts.push('Nível de jusante maior que o de montante: fluxo de escoamento reverso ou equilíbrio inviável.');
    }
    const ybarTotal = getGateYBarTotal(gateShape, gateHeight);
    const h_topo = config.comporta.modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO && config.comporta.y_cg_direto !== undefined
      ? config.comporta.y_cg_direto * Math.sin((ang * Math.PI) / 180) - ybarTotal * Math.sin((ang * Math.PI) / 180)
      : gateDepthFromCrest;

    if (h_topo < -1e-4) {
      alerts.push('Profundidade do topo da comporta negativa: a crista da comporta está posicionada acima da linha d\'água (NA).');
    }
    const h_bot = h_topo + gateHeight * Math.sin((ang * Math.PI) / 180);
    if (h_bot > upstreamLevel + 1e-4) {
      alerts.push('Comporta excede a profundidade disponível: a base da comporta ultrapassa o fundo do reservatório.');
    }
    return alerts;
  }, [gateInclination, hasDownstream, downstreamLevel, upstreamLevel, config.comporta, gateDepthFromCrest, gateHeight, gateShape]);

  const exportData = {
    tipo: 'comportas',
    geometria: `Comporta ${gateShape}`,
    dimensoes: {
      'Altura (m)': gateHeight,
      'Base/Largura (m)': gateWidth,
      'Inclinação (°)': gateInclination
    },
    empuxo: analyzedResults ? analyzedResults.forceData.FR_net : 0, 
    peso: gateWeightEnabled ? gateWeight * gravity : 0,
    volumeDeslocado: analyzedResults ? 1 : 0,
    alturaSubmersa: upstreamLevel,
    isAnalyzed: !!analyzedResults,
    analyzedResults: analyzedResults
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-1 lg:min-h-0 lg:overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)] gap-6 lg:flex-1 lg:h-full lg:min-h-0 lg:overflow-hidden">
        
        {/* --- LEFT SIDEBAR: CONTROLS --- */}
        <PainelControles 
            config={config} 
            setConfig={setConfigManual} 
            hasDownstream={hasDownstream} 
            setHasDownstream={setHasDownstream} 
            maxGateHeight={maxGateHeight} 
            maxWaterLevel={maxWaterLevel} 
            gateOpeningPercent={gateOpeningPercent}
            setGateOpeningPercent={setGateOpeningPercent}
            loadPreset={loadPreset} 
            presets={PRESETS}
            activePresetKey={activePresetKey}
            onResetDefaults={resetDefaults}
            handleHeightChange={handleHeightChange} 
            handleShapeChange={handleShapeChange} 
            liveH_eq={liveResults.equilibrium?.h_jusante_eq}
            wallDims={wallDims}
            setWallDims={setWallDims}
        />

        {/* --- CENTER: SCENE --- */}
        <div id="areaSimulacao" data-simulacao={JSON.stringify(exportData)} className="lg:col-span-6 relative bg-white rounded-3xl border border-blue-100/50 shadow-2xl shadow-blue-200/20 overflow-hidden flex flex-col h-[500px] lg:h-full lg:max-h-full lg:min-h-0">
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
                upstreamLevel={upstreamLevel} downstreamLevel={hasDownstream ? (liveResults.hidraulica?.nivelJusanteEfetivo ?? downstreamLevel) : 0}
                upstreamFluidKey={upstreamFluidKey} downstreamFluidKey={downstreamFluidKey}
                upstreamDensity={density} downstreamDensity={fluidoJusante.densidade}
                gravity={gravity} liveResults={liveResults}
                hasGate={hasGate} gateOpeningPercent={gateOpeningPercent} gateShape={gateShape}
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
                hasSmoothWallSupport={Boolean(hasSmoothWallSupport)}
                hasSmoothFloorSupport={Boolean(comporta.apoioFundoLiso)}
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
          liveOperacao={liveResults.operacao}
          showDetails={showDetails}
          setShowDetails={setShowDetails}
          hingePosition={hingePosition}
          hasTieRod={hasTieRod}
          hasSmoothWallSupport={Boolean(hasSmoothWallSupport)}
          hasSmoothFloorSupport={Boolean(comporta.apoioFundoLiso)}
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
