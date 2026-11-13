import React, { useState, useEffect, useMemo } from 'react';
import {
  TipoBarragem,
  SistemaUnidadesBarragem,
  ConfiguracaoSimulacaoBarragem,
  ResultadoSimulacaoBarragem,
} from '../dominio/tipos';
import { DAM_PRESETS } from '../dominio/presets';
import { simularBarragem } from '../calculos/simulador';
import { RenderizadorBarragens } from '../visual/RenderizadorBarragens';
import { registroTiposBarragem } from '../dominio/registroTipos';
import { PainelControles } from './PainelControles';
import { PainelResultados } from './PainelResultados';
import { Memorial } from './Memorial';
import { salvarNoHistorico } from '../../../../interface/historicoGerenciador';

interface DamLabProps {
  onContextUpdate?: (ctx: string) => void;
}

export const Laboratorio: React.FC<DamLabProps> = ({ onContextUpdate }) => {
  // STATE
  const [damType, setDamType] = useState<TipoBarragem>(TipoBarragem.GRAVIDADE);
  const [damHeight, setDamHeight] = useState<number>(15);
  const [damCrestWidth, setDamCrestWidth] = useState<number>(4);
  const [damBaseWidth, setDamBaseWidth] = useState<number>(12);
  const [inclinationAngle, setInclinationAngle] = useState<number>(90);
  const [downstreamAngle, setDownstreamAngle] = useState<number>(45);
  const [buttressAngle, setButtressAngle] = useState<number>(45);
  const [archRadius, setArchRadius] = useState<number>(30);

  const [upstreamLevel, setUpstreamLevel] = useState<number>(12);
  const [hasDownstream, setHasDownstream] = useState<boolean>(false);
  const [downstreamLevel, setDownstreamLevel] = useState<number>(5);

  const [hasMudLayer, setHasMudLayer] = useState<boolean>(false);
  const [mudHeight, setMudHeight] = useState<number>(3);
  const [mudDensity, setMudDensity] = useState<number>(1500);
  const [unitSystem, setUnitSystem] = useState<SistemaUnidadesBarragem>('SI');
  const [activePresetKey, setActivePresetKey] = useState<string | null>(null);

  const [density] = useState<number>(1000);
  const [gravity] = useState<number>(9.81);

  // UI STATE
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [analyzedResults, setAnalyzedResults] = useState<ResultadoSimulacaoBarragem | null>(null);

  // LOGIC
  const handleDamTypeChange = (newType: TipoBarragem) => {
    setActivePresetKey(null);
    setDamType(newType);
    const defaults = registroTiposBarragem[newType].getDefaults(damHeight);
    setInclinationAngle(defaults.inclinationAngle);
    if (defaults.downstreamAngle !== undefined) setDownstreamAngle(defaults.downstreamAngle);
    setDamBaseWidth(defaults.damBaseWidth);
    setDamCrestWidth(defaults.damCrestWidth);
    if (defaults.buttressAngle !== undefined) setButtressAngle(defaults.buttressAngle);
  };

  const loadPreset = (key: string) => {
    const preset = DAM_PRESETS[key];
    if (!preset) return;
    setActivePresetKey(key);
    setDamType(preset.damType);
    setDamHeight(preset.damHeight);
    setDamBaseWidth(preset.damBaseWidth);
    setDamCrestWidth(preset.damCrestWidth);
    setInclinationAngle(preset.inclinationAngle);
    if (preset.downstreamAngle !== undefined) setDownstreamAngle(preset.downstreamAngle);
    if (preset.buttressAngle !== undefined) setButtressAngle(preset.buttressAngle);
    if (preset.archRadius !== undefined) setArchRadius(preset.archRadius);
    setUpstreamLevel(preset.upstreamLevel);
    setHasDownstream(preset.hasDownstream);
    setDownstreamLevel(preset.downstreamLevel);
    setHasMudLayer(!!preset.hasMudLayer);
    setMudHeight(preset.mudHeight ?? 0);
    setMudDensity(preset.mudDensity ?? 1500);
    setUnitSystem(preset.unitSystem ?? 'SI');
  };

  const resetDefaults = () => {
    setActivePresetKey(null);
    setDamType(TipoBarragem.GRAVIDADE);
    setDamHeight(15);
    setDamBaseWidth(12);
    setDamCrestWidth(4);
    setInclinationAngle(90);
    setDownstreamAngle(45);
    setButtressAngle(45);
    setArchRadius(30);
    setUpstreamLevel(12);
    setHasDownstream(false);
    setDownstreamLevel(5);
    setHasMudLayer(false);
    setMudHeight(3);
    setMudDensity(1500);
    setUnitSystem('SI');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (upstreamLevel > damHeight) setUpstreamLevel(damHeight);
      if (downstreamLevel > damHeight) setDownstreamLevel(damHeight);
      if (mudHeight > upstreamLevel) setMudHeight(upstreamLevel);
    }, 1200);
    return () => clearTimeout(timer);
  }, [damHeight, upstreamLevel, downstreamLevel, mudHeight]);

  const safeUp = (typeof upstreamLevel !== 'number' || isNaN(upstreamLevel)) ? 0 : upstreamLevel;
  const safeDown = (typeof downstreamLevel !== 'number' || isNaN(downstreamLevel)) ? 0 : downstreamLevel;
  const safeH = (typeof damHeight !== 'number' || isNaN(damHeight)) ? 15 : damHeight;
  const safeMudH = (typeof mudHeight !== 'number' || isNaN(mudHeight)) ? 0 : mudHeight;

  const maxWaterLevel = safeH;

  const effectiveUpstreamLevel = Math.min(safeUp, safeH);
  const effectiveDownstreamLevel = hasDownstream ? Math.min(safeDown, safeH) : 0;
  const effectiveMudHeight = hasMudLayer ? Math.min(Math.max(0, safeMudH), effectiveUpstreamLevel) : 0;

  const effectiveBaseWidth = useMemo(() => {
    if (damType !== TipoBarragem.TERRA_ENROCAMENTO) return damBaseWidth;
    const radUp = (inclinationAngle * Math.PI) / 180;
    const radDown = (downstreamAngle * Math.PI) / 180;
    const dxUp = inclinationAngle === 90 ? 0 : damHeight / Math.tan(radUp);
    const dxDown = downstreamAngle === 90 ? 0 : damHeight / Math.tan(radDown);
    return parseFloat((dxUp + damCrestWidth + dxDown).toFixed(2));
  }, [damType, damBaseWidth, inclinationAngle, downstreamAngle, damHeight, damCrestWidth]);

  const config: ConfiguracaoSimulacaoBarragem = {
    damType,
    damHeight,
    damBaseWidth: effectiveBaseWidth,
    damCrestWidth,
    inclinationAngle,
    downstreamAngle,
    buttressAngle,
    archRadius,
    upstreamLevel: effectiveUpstreamLevel,
    downstreamLevel: effectiveDownstreamLevel,
    hasMudLayer,
    mudHeight: effectiveMudHeight,
    mudDensity,
    density,
    gravity,
    unitSystem,
  };

  const liveResults = useMemo(
    () => simularBarragem(config),
    [
      damType,
      damHeight,
      effectiveBaseWidth,
      damCrestWidth,
      inclinationAngle,
      downstreamAngle,
      buttressAngle,
      archRadius,
      effectiveUpstreamLevel,
      effectiveDownstreamLevel,
      hasMudLayer,
      effectiveMudHeight,
      mudDensity,
      density,
      gravity,
      unitSystem,
    ]
  );

  useEffect(() => {
    setAnalyzedResults(null);
  }, [liveResults]);

  const handleCalculate = () => {
    setAnalyzedResults(liveResults);
    if (liveResults) {
      const st = liveResults.stabilityData;
      const isKgf = unitSystem === 'TECNICO_KGF';
      const fmtF = (valN: number) =>
        isKgf
          ? `${(Math.abs(valN) / gravity).toFixed(1)} kgf/m`
          : `${(Math.abs(valN) / 1000).toFixed(2)} kN/m`;

      salvarNoHistorico({
        modulo: 'barragens',
        moduloNome: 'Barragens',
        titulo: activePresetKey ? DAM_PRESETS[activePresetKey].title : `Barragem ${damType} (H=${damHeight}m)`,
        parametros: {
          'Tipo': damType,
          'Altura (m)': damHeight,
          'Largura Base (m)': liveResults.normalizedInputs.damBaseWidth,
          'Largura Crista (m)': damCrestWidth,
          'Nível Montante (m)': effectiveUpstreamLevel,
          ...(hasDownstream ? { 'Nível Jusante (m)': effectiveDownstreamLevel } : {}),
          ...(hasMudLayer ? { 'Camada de Lama (m)': effectiveMudHeight, 'ρ Lama (kg/m³)': mudDensity } : {}),
        },
        resultados: {
          empuxo: liveResults.forceData.FR_net,
          empuxoFormatado: fmtF(liveResults.forceData.FR_net),
          peso: st?.weight,
          pesoFormatado: st ? fmtF(st.weight) : undefined,
          centroPressao: `${liveResults.forceData.y_cp_net.toFixed(2)} m (do fundo)`,
          segurancaOuStatus: st
            ? st.isArchDam
              ? `Efeito de Arco | N = ${fmtF(st.archThrust ?? 0)}`
              : `FS Tomb: ${st.fs_tomb.toFixed(2)} | FS Desl: ${st.fs_desl.toFixed(2)}`
            : undefined,
        },
      });
    }
  };

  const contextString = useMemo(
    () =>
      `LABORATÓRIO DE HIDROSTÁTICA: Barragem: ${damType}, H=${damHeight}m, Largura Base=${liveResults.normalizedInputs.damBaseWidth}m, Largura Crista=${damCrestWidth}m, θ=${inclinationAngle}°, Nível Montante=${effectiveUpstreamLevel}m, Nível Jusante=${effectiveDownstreamLevel}m${hasMudLayer ? `, Lama=${effectiveMudHeight}m (ρ=${mudDensity} kg/m³)` : ''}`,
    [
      damType,
      damHeight,
      liveResults.normalizedInputs.damBaseWidth,
      damCrestWidth,
      inclinationAngle,
      effectiveUpstreamLevel,
      effectiveDownstreamLevel,
      hasMudLayer,
      effectiveMudHeight,
      mudDensity,
    ]
  );

  useEffect(() => {
    if (onContextUpdate) {
      onContextUpdate(contextString);
    }
  }, [contextString, onContextUpdate]);

  const exportData = {
    tipo: 'barragens',
    geometria: activePresetKey ? DAM_PRESETS[activePresetKey].title : `Barragem ${damType}`,
    dimensoes: {
      altura: damHeight,
      larguraBase: liveResults.normalizedInputs.damBaseWidth,
      larguraCrista: damCrestWidth,
      inclinacao: inclinationAngle,
      nivelMontante: effectiveUpstreamLevel,
      nivelJusante: effectiveDownstreamLevel,
      ...(hasMudLayer ? { alturaLama: effectiveMudHeight, densidadeLama: mudDensity } : {}),
    },
    empuxo: analyzedResults ? analyzedResults.forceData.FR_net : 0,
    peso: analyzedResults && analyzedResults.stabilityData ? analyzedResults.stabilityData.weight : 0,
    volumeDeslocado: analyzedResults ? 1 : 0,
    alturaSubmersa: effectiveUpstreamLevel,
    isAnalyzed: !!analyzedResults,
    analyzedResults: analyzedResults,
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-1 lg:min-h-0 lg:overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)] gap-6 lg:flex-1 lg:h-full lg:min-h-0 lg:overflow-hidden">
        {/* --- LEFT SIDEBAR: CONTROLS --- */}
        <PainelControles
          damType={damType}
          setDamType={handleDamTypeChange}
          inclinationAngle={inclinationAngle}
          setInclinationAngle={setInclinationAngle}
          downstreamAngle={downstreamAngle}
          setDownstreamAngle={setDownstreamAngle}
          buttressAngle={buttressAngle}
          setButtressAngle={setButtressAngle}
          archRadius={archRadius}
          setArchRadius={setArchRadius}
          damHeight={damHeight}
          setDamHeight={setDamHeight}
          damBaseWidth={damBaseWidth}
          setDamBaseWidth={setDamBaseWidth}
          damCrestWidth={damCrestWidth}
          setDamCrestWidth={setDamCrestWidth}
          upstreamLevel={upstreamLevel}
          setUpstreamLevel={setUpstreamLevel}
          hasDownstream={hasDownstream}
          setHasDownstream={setHasDownstream}
          downstreamLevel={downstreamLevel}
          setDownstreamLevel={setDownstreamLevel}
          hasMudLayer={hasMudLayer}
          setHasMudLayer={setHasMudLayer}
          mudHeight={mudHeight}
          setMudHeight={setMudHeight}
          mudDensity={mudDensity}
          setMudDensity={setMudDensity}
          unitSystem={unitSystem}
          setUnitSystem={setUnitSystem}
          maxWaterLevel={maxWaterLevel}
          presets={DAM_PRESETS}
          activePresetKey={activePresetKey}
          loadPreset={loadPreset}
          onResetDefaults={resetDefaults}
        />

        {/* --- CENTER: SCENE --- */}
        <div
          id="areaSimulacao"
          data-simulacao={JSON.stringify(exportData)}
          className="lg:col-span-6 relative bg-white rounded-3xl border border-blue-100/50 shadow-2xl shadow-blue-200/20 overflow-hidden flex flex-col h-[500px] lg:h-full lg:max-h-full lg:min-h-0"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 z-20"></div>
          <RenderizadorBarragens
            key={damType}
            damType={damType}
            damHeight={damHeight}
            damBaseWidth={effectiveBaseWidth}
            damCrestWidth={damCrestWidth}
            inclinationAngle={inclinationAngle}
            downstreamAngle={downstreamAngle}
            buttressAngle={buttressAngle}
            archRadius={archRadius}
            upstreamLevel={effectiveUpstreamLevel}
            downstreamLevel={effectiveDownstreamLevel}
            hasMudLayer={hasMudLayer}
            mudHeight={effectiveMudHeight}
            mudDensity={mudDensity}
            unitSystem={unitSystem}
            gravity={gravity}
            force={analyzedResults ? analyzedResults.forceData.FR_net : 0}
            forceH={analyzedResults ? analyzedResults.forceData.FH_net : 0}
            forceV={analyzedResults ? analyzedResults.forceData.FV_net : 0}
            s_cp={analyzedResults ? analyzedResults.forceData.s_cp_net : 0}
            y_cp={analyzedResults ? analyzedResults.forceData.y_cp_net : 0}
            up={analyzedResults ? analyzedResults.forceData.up : undefined}
            down={analyzedResults ? analyzedResults.forceData.down : undefined}
            stability={analyzedResults ? analyzedResults.stabilityData : undefined}
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
          unitSystem={unitSystem}
          gravity={gravity}
        />
      </div>

      {/* Floating Details Panel */}
      <Memorial
        showDetails={showDetails}
        setShowDetails={setShowDetails}
        analyzedResults={analyzedResults}
        density={density}
        gravity={gravity}
        unitSystem={unitSystem}
        enunciado={activePresetKey ? DAM_PRESETS[activePresetKey]?.enunciado : undefined}
      />
    </div>
  );
};
