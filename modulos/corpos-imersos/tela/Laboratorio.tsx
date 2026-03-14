import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  BookOpen,
  RotateCcw,
  ArrowLeftRight,
} from 'lucide-react';
import { MATERIALS, FLUIDS } from '../dominio/configuracao';
import { ObjectShape } from '../dominio/tipos';
import { PainelControles } from './PainelControles';
import { PainelResultados } from './PainelResultados';
import { Memorial } from './Memorial';
import { Vista2D } from '../visual/Vista2D';
import { Vista3D } from '../visual/Vista3D';
import { simularCorposImersos } from '../calculos/simulador';
import { getPoints, getFluidColor } from '../visual/visualUtils';

interface BodyFallLabProps {
  onContextUpdate?: (ctx: string) => void;
}

export const Laboratorio: React.FC<BodyFallLabProps> = ({ onContextUpdate }) => {
  // --- STATE: INPUTS ---
  const [selectedMaterial, setSelectedMaterial] = useState<string>('Concreto');
  const [customObjDensity, setCustomObjDensity] = useState<number>(2400);
  const [shape, setShape] = useState<ObjectShape>(ObjectShape.CUBE);
  const [dim1, setDim1] = useState<number>(100);
  const [dim2, setDim2] = useState<number>(100);

  const [selectedFluid, setSelectedFluid] = useState<string>(FLUIDS[4].name);
  const [customFluidDensity, setCustomFluidDensity] = useState<number>(FLUIDS[4].density);
  const [depthA, setDepthA] = useState<number>(300);

  const [enableTwoFluids, setEnableTwoFluids] = useState<boolean>(false);
  const [selectedFluidB, setSelectedFluidB] = useState<string>(FLUIDS[6].name);
  const [customFluidDensityB, setCustomFluidDensityB] = useState<number>(FLUIDS[6].density);
  const [depthB, setDepthB] = useState<number>(100);

  const [gravity] = useState<number>(9.81);
  const [tankWidth, setTankWidth] = useState<number>(600);
  const [tankDepth, setTankDepth] = useState<number>(100);
  const [tankHeight, setTankHeight] = useState<number>(500);

  // --- STATE: UI & CONTROL ---
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [is3D, setIs3D] = useState<boolean>(false);
  const [showFBD, setShowFBD] = useState<boolean>(true);
  const [showCalculations, setShowCalculations] = useState<boolean>(false);
  const [showCenterOfBuoyancy, setShowCenterOfBuoyancy] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // --- LAYOUT CALCULATIONS ---
  const svgHeight = 600;
  const svgWidth = 700;
  const tankBottomY = 580;
  const tankTopMargin = 160;
  const availablePixelHeight = tankBottomY - tankTopMargin;
  const availablePixelWidth = svgWidth - 120;

  const fluidTotalDepth = enableTwoFluids ? depthA + depthB : depthA;
  const autoTankHeight = Math.max(tankHeight, Math.ceil(fluidTotalDepth + 10));
  const scaleHeight = availablePixelHeight / autoTankHeight;
  const scaleWidth = availablePixelWidth / tankWidth;
  const visualScaleFactor = Math.min(scaleHeight, scaleWidth);

  const currentTankW = tankWidth * visualScaleFactor;
  const currentTankH = autoTankHeight * visualScaleFactor;
  const tankOffsetX = (svgWidth - currentTankW) / 2 + 30;
  const originalFluidSurfaceY = tankBottomY - fluidTotalDepth * visualScaleFactor;

  let visualWidth = 0;
  let visualHeight = 0;
  if (shape === ObjectShape.CUBE) {
    visualWidth = dim1 * visualScaleFactor;
    visualHeight = dim1 * visualScaleFactor;
  } else if (shape === ObjectShape.SPHERE) {
    visualWidth = dim1 * 2 * visualScaleFactor;
    visualHeight = dim1 * 2 * visualScaleFactor;
  } else {
    visualWidth = dim1 * 2 * visualScaleFactor;
    visualHeight = dim2 * visualScaleFactor;
  }

  // --- PHYSICS CALCULATIONS ---
  const rhoA = selectedFluid === 'Custom' ? customFluidDensity : (FLUIDS.find(f => f.name === selectedFluid)?.density || 0);
  const rhoB = selectedFluidB === 'Custom' ? customFluidDensityB : (FLUIDS.find(f => f.name === selectedFluidB)?.density || 0);

  // --- ANIMATION STATE ---
  const [animBlockY, setAnimBlockY] = useState<number>(0);
  const posRef = useRef<number>(0);
  const velRef = useRef<number>(0);
  const reqRef = useRef<number>(undefined);
  const lastTimeRef = useRef<number>(0);

  // Initial physics for animation
  const initialPhysics = useMemo(() => simularCorposImersos({
    shape, dim1, dim2, objectDensity: customObjDensity,
    rhoA, rhoB, depthA, depthB, enableTwoFluids, gravity,
    tankWidth, tankDepth, visualScaleFactor, visualHeight,
    fluidSurfaceY: originalFluidSurfaceY, h_in_A: 0, h_in_B: 0
  }), [shape, dim1, dim2, customObjDensity, rhoA, rhoB, depthA, depthB, enableTwoFluids, gravity, tankWidth, tankDepth, visualScaleFactor, visualHeight, originalFluidSurfaceY]);

  const equilibriumBlockY = originalFluidSurfaceY + (initialPhysics.d_eq * visualScaleFactor) - visualHeight;
  const startBlockY = tankBottomY - (autoTankHeight * visualScaleFactor) - visualHeight - 50;

  useEffect(() => {
    if (!isSimulating) {
        if (reqRef.current) cancelAnimationFrame(reqRef.current);
        posRef.current = startBlockY;
        velRef.current = 0;
        setAnimBlockY(startBlockY);
        return;
    }

    lastTimeRef.current = performance.now();
    
    const animate = (time: number) => {
        const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05); 
        lastTimeRef.current = time;

        const k = 100; // Spring constant
        const damping = 6; // Damping factor

        const targetY = equilibriumBlockY;
        const floorY = tankBottomY - visualHeight;
        const effectiveTargetY = Math.min(targetY, floorY);
        
        const objectBottom = posRef.current + visualHeight;
        let accel = 0;

        if (objectBottom < originalFluidSurfaceY) {
            const g_visual = 2000; 
            accel = g_visual;
        } else {
            const displacement = posRef.current - effectiveTargetY;
            const springForce = -k * displacement;
            const dampingForce = -damping * velRef.current;
            accel = springForce + dampingForce;
        }

        velRef.current += accel * dt;
        posRef.current += velRef.current * dt;

        if (posRef.current > floorY) {
            posRef.current = floorY;
            velRef.current = 0; 
        }

        setAnimBlockY(posRef.current);
        reqRef.current = requestAnimationFrame(animate);
    };

    reqRef.current = requestAnimationFrame(animate);
    return () => {
        if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isSimulating, equilibriumBlockY, startBlockY, originalFluidSurfaceY, visualHeight, tankBottomY]);

  // --- DYNAMIC RESULTS ---
  const blockY = animBlockY;
  const currentObjBottomDepth = (blockY + visualHeight - originalFluidSurfaceY) / visualScaleFactor;
  const currentObjTopDepth = (blockY - originalFluidSurfaceY) / visualScaleFactor;

  const topA = 0;
  const botA = depthA;
  const overlapA_start = Math.max(currentObjTopDepth, topA);
  const overlapA_end = Math.min(currentObjBottomDepth, botA);
  const h_in_A = Math.max(0, overlapA_end - overlapA_start);

  const topB = depthA;
  const botB = depthA + depthB;
  const overlapB_start = Math.max(currentObjTopDepth, topB);
  const overlapB_end = Math.min(currentObjBottomDepth, botB);
  const h_in_B = Math.max(0, overlapB_end - overlapB_start);

  const physics = useMemo(() => simularCorposImersos({
    shape, dim1, dim2, objectDensity: customObjDensity,
    rhoA, rhoB, depthA, depthB, enableTwoFluids, gravity,
    tankWidth, tankDepth, visualScaleFactor, visualHeight,
    fluidSurfaceY: originalFluidSurfaceY, h_in_A, h_in_B
  }), [shape, dim1, dim2, customObjDensity, rhoA, rhoB, depthA, depthB, enableTwoFluids, gravity, tankWidth, tankDepth, visualScaleFactor, visualHeight, originalFluidSurfaceY, h_in_A, h_in_B]);

  const fluidSurfaceY = originalFluidSurfaceY - physics.deltaH_cm * visualScaleFactor;

  // --- HANDLERS ---
  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const matName = e.target.value;
    setSelectedMaterial(matName);
    if (matName !== 'Custom') {
      const mat = MATERIALS.find((m) => m.name === matName);
      if (mat) setCustomObjDensity(mat.density);
    }
  };

  const loadExercise5 = () => {
    setIsSimulating(false);
    setSelectedMaterial('Custom');
    setCustomObjDensity(650);
    setShape(ObjectShape.CUBE);
    setDim1(20);
    setSelectedFluid('Água Doce');
    setCustomFluidDensity(1000);
    setEnableTwoFluids(false);
    setDepthA(50);
    setTankWidth(100);
    setTankHeight(80);
    setToastMsg('Exercício 5 Carregado!');
    setTimeout(() => setToastMsg(null), 1500);
  };

  useEffect(() => {
    if (onContextUpdate) {
      onContextUpdate(
        `CONTEXTO DO LABORATÓRIO DE EMPUXO: Objeto: ${shape} (${selectedMaterial}), Peso: ${physics.objectWeight.toFixed(
          2
        )} N, Empuxo: ${physics.buoyancyForce.toFixed(2)} N, Estado: ${physics.status}, Submerso: ${physics.h_sub_actual.toFixed(
          2
        )} cm`
      );
    }
  }, [
    onContextUpdate,
    physics.objectWeight,
    physics.buoyancyForce,
    physics.status,
    physics.h_sub_actual,
    shape,
    selectedMaterial,
  ]);

  useEffect(() => {
    setIsSimulating(false);
  }, [
    selectedMaterial,
    customObjDensity,
    shape,
    dim1,
    dim2,
    selectedFluid,
    depthA,
    selectedFluidB,
    depthB,
    enableTwoFluids,
    tankWidth,
    tankHeight,
  ]);

  const objectWidthCm = shape === ObjectShape.CUBE ? dim1 : dim1 * 2;
  const isObjectTooWide = objectWidthCm > tankWidth;
  const objColor = MATERIALS.find((m) => m.name === selectedMaterial)?.color || '#000000';
  const TANK_BORDER_COLOR = '#06b6d4';
  const OBJECT_BORDER_COLOR = '#475569';
  const forceText = isSimulating
    ? physics.apparentWeight >= 10000
      ? `${(physics.apparentWeight / 1000).toFixed(1)} kN`
      : `${physics.apparentWeight.toFixed(1)} N`
    : '?';

  const colorA = getFluidColor(selectedFluid);
  const colorB = getFluidColor(selectedFluidB);

  const tankPts = getPoints(0, 0, tankWidth, autoTankHeight, 0, tankDepth, tankOffsetX, tankBottomY);

  const geom = {
    formula: shape === ObjectShape.CUBE ? 'L³' : shape === ObjectShape.SPHERE ? '4/3 · π · r³' : 'L · P · H',
    substitution: shape === ObjectShape.CUBE ? `${dim1}³` : shape === ObjectShape.SPHERE ? `4/3 · π · ${dim1}³` : `${dim1} · ${dim1} · ${dim2}`
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[750px]">
        {/* --- LEFT SIDEBAR: CONTROLS --- */}
        <div className="lg:col-span-3 flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
          {/* EXERCÍCIO DO SLIDE */}
          <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl p-4 shadow-md text-white">
            <div className="flex items-center gap-2 mb-3 text-sm font-bold tracking-wider opacity-90">
              <BookOpen className="w-4 h-4" />
              EXERCÍCIO DO SLIDE
            </div>
            <button
              onClick={loadExercise5}
              className="w-full bg-white/20 hover:bg-white/30 transition-colors rounded-lg p-3 text-left flex items-center gap-3 border border-white/30"
            >
              <div className="bg-white text-blue-600 font-bold px-2 py-1 rounded text-xs">Ex.5</div>
              <div>
                <div className="font-bold text-sm">Bloco de Madeira</div>
                <div className="text-xs opacity-80">Slide 30 (γ = 650)</div>
              </div>
            </button>
          </div>

          <PainelControles
            selectedMaterial={selectedMaterial}
            customObjDensity={customObjDensity}
            shape={shape}
            dim1={dim1}
            selectedFluid={selectedFluid}
            customFluidDensity={customFluidDensity}
            depthA={depthA}
            enableTwoFluids={enableTwoFluids}
            selectedFluidB={selectedFluidB}
            customFluidDensityB={customFluidDensityB}
            depthB={depthB}
            tankWidth={tankWidth}
            tankDepth={tankDepth}
            physics={physics}
            onMaterialChange={handleMaterialChange}
            onCustomObjDensityChange={setCustomObjDensity}
            onShapeChange={setShape}
            onDim1Change={setDim1}
            onFluidChange={(e) => {
                setSelectedFluid(e.target.value);
                if (e.target.value !== 'Custom') setCustomFluidDensity(FLUIDS.find((f) => f.name === e.target.value)?.density || 0);
            }}
            onCustomFluidDensityChange={setCustomFluidDensity}
            onDepthAChange={setDepthA}
            onEnableTwoFluidsChange={setEnableTwoFluids}
            onFluidBChange={(e) => {
                setSelectedFluidB(e.target.value);
                if (e.target.value !== 'Custom') setCustomFluidDensityB(FLUIDS.find((f) => f.name === e.target.value)?.density || 0);
            }}
            onCustomFluidDensityBChange={setCustomFluidDensityB}
            onDepthBChange={setDepthB}
            onTankWidthChange={setTankWidth}
            onTankDepthChange={setTankDepth}
          />
        </div>

        {/* --- CENTER: SCENE --- */}
        <div className="lg:col-span-6 flex flex-col h-full rounded-3xl border border-white/50 overflow-hidden relative shadow-2xl shadow-blue-500/10 bg-white/60 backdrop-blur-md">
          <div className="mt-20">
            {is3D ? (
              <Vista3D
                svgWidth={svgWidth}
                svgHeight={svgHeight}
                currentTankW={currentTankW}
                currentTankH={currentTankH}
                tankDepth={tankDepth}
                effectiveHB_px={enableTwoFluids ? depthB * visualScaleFactor : 0}
                tankBottomY={tankBottomY}
                tankOffsetX={tankOffsetX}
                originalFluidSurfaceY={originalFluidSurfaceY}
                fluidSurfaceY={fluidSurfaceY}
                enableTwoFluids={enableTwoFluids}
                isSimulating={isSimulating}
                deltaH_cm={physics.deltaH_cm}
                colorA={colorA}
                colorB={colorB}
                isObjectAboveWater={animBlockY + visualHeight < fluidSurfaceY}
                TANK_BORDER_COLOR={TANK_BORDER_COLOR}
                OBJECT_BORDER_COLOR={OBJECT_BORDER_COLOR}
                objColor={objColor}
                selectedMaterial={selectedMaterial}
                shape={shape}
                visualWidth={visualWidth}
                visualHeight={visualHeight}
                objBottomDistFromTankBottom={tankBottomY - (animBlockY + visualHeight)}
                objD_visual={dim1 * visualScaleFactor}
              />
            ) : (
              <Vista2D
                svgWidth={svgWidth}
                svgHeight={svgHeight}
                tankWidth={tankWidth}
                tankHeight={autoTankHeight}
                tankBottomY={tankBottomY}
                tankOffsetX={tankOffsetX}
                currentTankW={currentTankW}
                currentTankH={currentTankH}
                shape={shape}
                visualWidth={visualWidth}
                visualHeight={visualHeight}
                selectedMaterial={selectedMaterial}
                blockY={animBlockY}
                fluidSurfaceY={fluidSurfaceY}
                originalFluidSurfaceY={originalFluidSurfaceY}
                depthA={depthA}
                depthB={depthB}
                enableTwoFluids={enableTwoFluids}
                deltaH_cm={physics.deltaH_cm}
                isSimulating={isSimulating}
                objColor={objColor}
                TANK_BORDER_COLOR={TANK_BORDER_COLOR}
                OBJECT_BORDER_COLOR={OBJECT_BORDER_COLOR}
                selectedFluid={selectedFluid}
                selectedFluidB={selectedFluidB}
                colorA={colorA}
                colorB={colorB}
                effectiveHB_px={enableTwoFluids ? depthB * visualScaleFactor : 0}
                hA_dynamic_px={depthA * visualScaleFactor}
              />
            )}
          </div>
          
          {/* --- CONTROLS OVERLAY --- */}
          {/* Top Control Bar */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex z-10 bg-white rounded-full shadow-md border border-slate-200 p-1">
            <button 
              onClick={() => setIs3D(!is3D)} 
              className={`px-5 py-2 rounded-full font-bold transition-all text-sm flex items-center gap-2 ${is3D ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Box className="w-4 h-4" />
              {is3D ? '3D ON' : '3D OFF'}
            </button>
            <button 
              onClick={() => setShowFBD(!showFBD)} 
              className={`px-5 py-2 rounded-full font-bold transition-all text-sm flex items-center gap-2 ${showFBD ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              VETORES
            </button>
          </div>

          {/* Main Action Button */}
          <div className="absolute bottom-6 right-6 z-10">
            <button 
              onClick={() => setIsSimulating(!isSimulating)} 
              className={`
                flex items-center gap-2 px-8 py-3 rounded-full font-black text-xs tracking-wide uppercase transition-all active:scale-95 shadow-lg
                ${isSimulating 
                  ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-slate-200/50' 
                  : 'bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-600 text-white shadow-blue-500/20'
                }
              `}
            >
              {isSimulating ? (
                <>
                  <RotateCcw className="w-4 h-4" /> REINICIAR
                </>
              ) : (
                <>
                  <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent"></div>
                  SOLTAR BLOCO
                </>
              )}
            </button>
          </div>
        </div>

        {/* --- RIGHT SIDEBAR: RESULTS --- */}
        <div className="lg:col-span-3 flex flex-col gap-3 h-full">
          <PainelResultados
            physics={physics}
            isSimulating={isSimulating}
            enableTwoFluids={enableTwoFluids}
            forceText={forceText}
            showCalculations={showCalculations}
            onToggleCalculations={() => setShowCalculations(!showCalculations)}
          />
        </div>
      </div>

      {/* Floating Calculation Panel */}
      {showCalculations && isSimulating && (
        <Memorial
          physics={physics}
          geom={geom}
          gravity={gravity}
          tankWidth={tankWidth}
          tankDepth={tankDepth}
          enableTwoFluids={enableTwoFluids}
          onClose={() => setShowCalculations(false)}
        />
      )}
    </div>
  );
};
