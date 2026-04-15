import React, { useState, useEffect, useMemo } from 'react';
import { TipoBarragem, ConfiguracaoSimulacaoBarragem, ResultadoSimulacaoBarragem } from '../dominio/tipos';
import { simularBarragem } from '../calculos/simulador';
import { RenderizadorBarragens } from '../visual/RenderizadorBarragens';
import { registroTiposBarragem } from '../dominio/registroTipos';
import { PainelControles } from './PainelControles';
import { PainelResultados } from './PainelResultados';
import { Memorial } from './Memorial';
import { DAM_PRESETS } from '../dominio/presets';

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
  
  const [density] = useState<number>(1000); 
  const [gravity] = useState<number>(9.81);

  // UI STATE
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [analyzedResults, setAnalyzedResults] = useState<ResultadoSimulacaoBarragem | null>(null);

  // LOGIC
  const loadPreset = (key: string) => {
    const p = DAM_PRESETS[key];
    if (p) {
      setDamType(p.damType);
      setDamHeight(p.damHeight);
      setDamBaseWidth(p.damBaseWidth);
      setDamCrestWidth(p.damCrestWidth);
      setInclinationAngle(p.inclinationAngle);
      if (p.buttressAngle !== undefined) setButtressAngle(p.buttressAngle);
      if (p.archRadius !== undefined) setArchRadius(p.archRadius);
      setUpstreamLevel(p.upstreamLevel);
      setHasDownstream(p.hasDownstream);
      setDownstreamLevel(p.downstreamLevel);
    }
  };

  useEffect(() => {
    const defaults = registroTiposBarragem[damType].getDefaults(damHeight);
    setInclinationAngle(defaults.inclinationAngle);
    if (defaults.downstreamAngle !== undefined) setDownstreamAngle(defaults.downstreamAngle);
    setDamBaseWidth(defaults.damBaseWidth);
    setDamCrestWidth(defaults.damCrestWidth);
    if (defaults.buttressAngle !== undefined) setButtressAngle(defaults.buttressAngle);
  }, [damType]); 

  useEffect(() => {
    const timer = setTimeout(() => {
      if (upstreamLevel > damHeight) setUpstreamLevel(damHeight);
      if (downstreamLevel > damHeight) setDownstreamLevel(damHeight);
    }, 1200);
    return () => clearTimeout(timer);
  }, [damHeight, upstreamLevel, downstreamLevel]);

  const safeUp = (typeof upstreamLevel !== 'number' || isNaN(upstreamLevel)) ? 0 : upstreamLevel;
  const safeDown = (typeof downstreamLevel !== 'number' || isNaN(downstreamLevel)) ? 0 : downstreamLevel;
  const safeH = (typeof damHeight !== 'number' || isNaN(damHeight)) ? 15 : damHeight;

  const maxWaterLevel = safeH; 

  const effectiveUpstreamLevel = Math.min(safeUp, safeH);
  const effectiveDownstreamLevel = hasDownstream ? Math.min(safeDown, safeH) : 0;
  
  const effectiveBaseWidth = useMemo(() => {
    if (damType !== TipoBarragem.TERRA_ENROCAMENTO) return damBaseWidth;
    const radUp = (inclinationAngle * Math.PI) / 180;
    const radDown = (downstreamAngle * Math.PI) / 180;
    const dxUp = inclinationAngle === 90 ? 0 : damHeight / Math.tan(radUp);
    const dxDown = downstreamAngle === 90 ? 0 : damHeight / Math.tan(radDown);
    return parseFloat((dxUp + damCrestWidth + dxDown).toFixed(2));
  }, [damType, damBaseWidth, inclinationAngle, downstreamAngle, damHeight, damCrestWidth]);

  const config: ConfiguracaoSimulacaoBarragem = {
      damType, damHeight, damBaseWidth: effectiveBaseWidth, damCrestWidth, inclinationAngle, buttressAngle, archRadius,
      upstreamLevel: effectiveUpstreamLevel, downstreamLevel: effectiveDownstreamLevel, density, gravity
  };
  
  const liveResults = useMemo(() => simularBarragem(config), [damType, damHeight, effectiveBaseWidth, damCrestWidth, inclinationAngle, buttressAngle, archRadius, effectiveUpstreamLevel, effectiveDownstreamLevel, density, gravity]);

  useEffect(() => { setAnalyzedResults(null); }, [liveResults]);
  const handleCalculate = () => { setAnalyzedResults(liveResults); };

  const contextString = useMemo(() => `LABORATÓRIO DE HIDROSTÁTICA: Barragem: ${damType}, H=${damHeight}m, Largura Base=${effectiveBaseWidth}m, Largura Crista=${damCrestWidth}m, θ=${inclinationAngle}°, Nível Montante=${effectiveUpstreamLevel}m, Nível Jusante=${effectiveDownstreamLevel}m`, [damType, damHeight, effectiveBaseWidth, damCrestWidth, inclinationAngle, effectiveUpstreamLevel, effectiveDownstreamLevel]);

  useEffect(() => {
      if (onContextUpdate) {
          onContextUpdate(contextString);
      }
  }, [contextString, onContextUpdate]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[800px]">
        
        {/* --- LEFT SIDEBAR: CONTROLS --- */}
        <PainelControles
          damType={damType} setDamType={setDamType}
          inclinationAngle={inclinationAngle} setInclinationAngle={setInclinationAngle}
          downstreamAngle={downstreamAngle} setDownstreamAngle={setDownstreamAngle}
          buttressAngle={buttressAngle} setButtressAngle={setButtressAngle}
          archRadius={archRadius} setArchRadius={setArchRadius}
          damHeight={damHeight} setDamHeight={setDamHeight}
          damBaseWidth={damBaseWidth} setDamBaseWidth={setDamBaseWidth}
          damCrestWidth={damCrestWidth} setDamCrestWidth={setDamCrestWidth}
          upstreamLevel={upstreamLevel} setUpstreamLevel={setUpstreamLevel}
          hasDownstream={hasDownstream} setHasDownstream={setHasDownstream}
          downstreamLevel={downstreamLevel} setDownstreamLevel={setDownstreamLevel}
          maxWaterLevel={maxWaterLevel}
          loadPreset={loadPreset}
          presets={DAM_PRESETS}
        />

        {/* --- CENTER: SCENE --- */}
        <div className="lg:col-span-6 flex flex-col h-full bg-slate-50 rounded-3xl border border-blue-100/50 overflow-hidden relative shadow-2xl shadow-blue-200/20">
             <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 z-10"></div>
            <RenderizadorBarragens
                key={damType}
                damType={damType} damHeight={damHeight} damBaseWidth={effectiveBaseWidth} damCrestWidth={damCrestWidth}
                inclinationAngle={inclinationAngle} buttressAngle={buttressAngle} archRadius={archRadius} upstreamLevel={effectiveUpstreamLevel} downstreamLevel={effectiveDownstreamLevel}
                force={analyzedResults ? analyzedResults.forceData.FR_net : 0} 
                s_cp={analyzedResults ? analyzedResults.forceData.s_cp_net : 0}
                y_cp={analyzedResults ? analyzedResults.forceData.y_cp_net : 0}
                up={analyzedResults ? analyzedResults.forceData.up : undefined}
                down={analyzedResults ? analyzedResults.forceData.down : undefined}
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
        />
      </div>

      {/* Floating Details Panel */}
      <Memorial
        showDetails={showDetails}
        setShowDetails={setShowDetails}
        analyzedResults={analyzedResults}
        density={density}
        gravity={gravity}
      />
    </div>
  );
};
