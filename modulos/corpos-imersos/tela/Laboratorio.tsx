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
import { getFluidColor } from '../visual/visualUtils';

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
  const [tankWidth, setTankWidth] = useState<number>(500);
  const [tankDepth, setTankDepth] = useState<number>(500);
  const [tankHeight, setTankHeight] = useState<number>(500);

  // --- NEW STATE: EXTRA WEIGHT & SECOND BLOCK ---
  const [extraWeight, setExtraWeight] = useState<number>(0);
  const [twoBlocks, setTwoBlocks] = useState<boolean>(false);
  const [selectedMaterial2, setSelectedMaterial2] = useState<string>('Concreto');
  const [density2, setDensity2] = useState<number>(2400);
  const [dim1_2, setDim1_2] = useState<number>(100);
  const [dim2_2, setDim2_2] = useState<number>(100);
  const [cordLength, setCordLength] = useState<number>(20);
  const [shape2, setShape2] = useState<ObjectShape>(ObjectShape.CUBE);

  // --- STATE: UI & CONTROL ---
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [is3D, setIs3D] = useState<boolean>(false);
  const [showFBD, setShowFBD] = useState<boolean>(true);
  const [showCalculations, setShowCalculations] = useState<boolean>(false);
  const [showCenterOfBuoyancy, setShowCenterOfBuoyancy] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [currentEnunciado, setCurrentEnunciado] = useState<string | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);

  // --- LAYOUT CALCULATIONS ---
  const svgHeight = 600;
  const svgWidth = 700;
  const tankBottomY = 510;
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

  let visualWidth2 = 0;
  if (shape2 === ObjectShape.CUBE) {
    visualWidth2 = dim1_2 * visualScaleFactor;
  } else if (shape2 === ObjectShape.SPHERE) {
    visualWidth2 = dim1_2 * 2 * visualScaleFactor;
  } else {
    visualWidth2 = dim1_2 * 2 * visualScaleFactor;
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
    fluidSurfaceY: originalFluidSurfaceY, h_in_A: 0, h_in_B: 0,
    h_in_A_2: 0, h_in_B_2: 0,
    extraWeight, twoBlocks, density2, dim1_2, dim2_2, cordLength, shape2
  }), [shape, dim1, dim2, customObjDensity, rhoA, rhoB, depthA, depthB, enableTwoFluids, gravity, tankWidth, tankDepth, visualScaleFactor, visualHeight, originalFluidSurfaceY, extraWeight, twoBlocks, density2, dim1_2, dim2_2, cordLength, shape2]);

  const equilibriumBlockY = originalFluidSurfaceY + (initialPhysics.d_eq * visualScaleFactor) - (twoBlocks ? (initialPhysics.H2_cm * visualScaleFactor + initialPhysics.actualCordLength * visualScaleFactor) : 0) - visualHeight;
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
        const floorY = tankBottomY - (twoBlocks ? (visualHeight + (H2_cm_visual) + (initialPhysics.actualCordLength * visualScaleFactor)) : visualHeight);
        const effectiveTargetY = Math.min(targetY, floorY);
        
        const objectBottom = posRef.current + visualHeight;
        const lowestPoint = objectBottom + (twoBlocks ? (H2_cm_visual + initialPhysics.actualCordLength * visualScaleFactor) : 0);
        let accel = 0;

        if (lowestPoint < originalFluidSurfaceY) {
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
  }, [isSimulating, equilibriumBlockY, startBlockY, originalFluidSurfaceY, visualHeight, tankBottomY, twoBlocks, initialPhysics.H2_cm, visualScaleFactor, initialPhysics.actualCordLength]);

  // --- DYNAMIC RESULTS ---
  const blockY = animBlockY;
  const H2_cm_visual = (initialPhysics.H2_cm || 0) * visualScaleFactor;
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

  // Calculate depths for block 2
  const currentObj2TopDepth = currentObjBottomDepth + initialPhysics.actualCordLength;
  const currentObj2BottomDepth = currentObj2TopDepth + (initialPhysics.H2_cm || 0);

  const overlapA2_start = Math.max(currentObj2TopDepth, topA);
  const overlapA2_end = Math.min(currentObj2BottomDepth, botA);
  const h_in_A_2 = twoBlocks ? Math.max(0, overlapA2_end - overlapA2_start) : 0;

  const overlapB2_start = Math.max(currentObj2TopDepth, topB);
  const overlapB2_end = Math.min(currentObj2BottomDepth, botB);
  const h_in_B_2 = twoBlocks ? Math.max(0, overlapB2_end - overlapB2_start) : 0;

  const physics = useMemo(() => simularCorposImersos({
    shape, dim1, dim2, objectDensity: customObjDensity,
    rhoA, rhoB, depthA, depthB, enableTwoFluids, gravity,
    tankWidth, tankDepth, visualScaleFactor, visualHeight,
    fluidSurfaceY: originalFluidSurfaceY, h_in_A, h_in_B,
    h_in_A_2, h_in_B_2,
    extraWeight, twoBlocks, density2, dim1_2, dim2_2, cordLength, shape2
  }), [shape, dim1, dim2, customObjDensity, rhoA, rhoB, depthA, depthB, enableTwoFluids, gravity, tankWidth, tankDepth, visualScaleFactor, visualHeight, originalFluidSurfaceY, h_in_A, h_in_B, h_in_A_2, h_in_B_2, extraWeight, twoBlocks, density2, dim1_2, dim2_2, cordLength, shape2]);

  const exportData = useMemo(() => ({
    tipo: 'corpos-imersos',
    geometria: shape,
    dimensoes: { 
      'Aresta/Raio (cm)': dim1, 
      ...(shape !== ObjectShape.CUBE && shape !== ObjectShape.SPHERE ? { 'Comprimento (cm)': dim2 } : {}),
      ...(twoBlocks ? { 'Aresta 2 (cm)': dim1_2 } : {})
    },
    densidadeObjeto: customObjDensity,
    densidadeFluido: rhoA,
    empuxo: physics.buoyancyForce,
    peso: physics.objectWeight,
    volumeDeslocado: physics.vol_deslocado / 1e6,
    alturaSubmersa: physics.h_sub_actual / 100
  }), [shape, dim1, dim2, twoBlocks, dim1_2, customObjDensity, rhoA, physics]);

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

  const EXERCISES = [
    {
      id: 'ex1',
      title: 'Exercício 1: Bloco Uniforme',
      subtitle: 'Peso 50N ar, 40N submerso',
      enunciado: 'Um bloco pesa 50N no ar e 40N quando totalmente submerso em água. Determine o volume e a densidade do bloco.',
      load: () => {
        setIsSimulating(false);
        setActiveExerciseId('ex1');
        setCurrentEnunciado('Um bloco pesa 50N no ar e 40N quando totalmente submerso em água. Determine o volume e a densidade do bloco.');
        setTwoBlocks(false);
        setExtraWeight(0);
        setSelectedMaterial('Custom');
        setCustomObjDensity(5000); // 50N / (10000 N/m3 * V) = 40N aparente? 
        // W = 50N, E = 10N. E = rho_w * V * g => 10 = 10000 * V => V = 0.001 m3.
        // rho_b = W / (V*g) = 50 / (0.001 * 10) = 5000 kg/m3.
        setShape(ObjectShape.CUBE);
        setDim1(10); // 10x10x10 cm = 1000 cm3 = 0.001 m3
        setSelectedFluid('Água Doce');
        setCustomFluidDensity(1000);
        setEnableTwoFluids(false);
        setDepthA(50);
        setTankWidth(100);
        setTankDepth(100);
        setTankHeight(100);
        setToastMsg('Exercício 1 Carregado!');
        setTimeout(() => setToastMsg(null), 1500);
      }
    },
    {
      id: 'ex2',
      title: 'Exercício 2: Duas Esferas',
      subtitle: 'Esferas A e B ligadas',
      enunciado: 'Duas esferas, A e B, de raios iguais, estão ligadas por um arame de peso e volume desprezíveis e flutuam na água, conforme se apresenta na figura. Sabendo que as massas específicas da água e da esfera A são respectivamente 1,0 g/cm³ e 0,8 g/cm³, calcule a massa específica da esfera B.',
      load: () => {
        setIsSimulating(false);
        setActiveExerciseId('ex2');
        setCurrentEnunciado('Duas esferas, A e B, de raios iguais, estão ligadas por um arame de peso e volume desprezíveis e flutuam na água, conforme se apresenta na figura. Sabendo que as massas específicas da água e da esfera A são respectivamente 1,0 g/cm³ e 0,8 g/cm³, calcule a massa específica da esfera B.');
        setTwoBlocks(true);
        setExtraWeight(0);
        setShape(ObjectShape.SPHERE);
        setDim1(10); // raio 10
        setSelectedMaterial('Custom');
        setCustomObjDensity(800); // Esfera A: 0.8 g/cm3 = 800 kg/m3
        
        setShape2(ObjectShape.SPHERE);
        setDim1_2(10);
        setSelectedMaterial2('Custom');
        setDensity2(1200); // Esfera B: 1.2 g/cm3 = 1200 kg/m3
        setCordLength(20);

        setSelectedFluid('Água Doce');
        setCustomFluidDensity(1000);
        setEnableTwoFluids(false);
        setDepthA(100);
        setTankWidth(200);
        setTankDepth(200);
        setTankHeight(200);
        setToastMsg('Exercício 2 Carregado!');
        setTimeout(() => setToastMsg(null), 1500);
      }
    },
    {
      id: 'ex5',
      title: 'Exercício 5: Dois Cubos',
      subtitle: 'Conectados por cordão',
      enunciado: 'Dois cubos conectados por um cordão. O cubo inferior é mais denso, enquanto o superior garante a flutuabilidade do conjunto.',
      load: () => {
        setIsSimulating(false);
        setActiveExerciseId('ex5');
        setCurrentEnunciado('Dois cubos conectados por um cordão. O cubo inferior é mais denso, enquanto o superior garante a flutuabilidade do conjunto.');
        setTwoBlocks(true);
        setExtraWeight(0);
        setShape(ObjectShape.CUBE);
        setDim1(100); // 1m3 volume => 100cm aresta
        setSelectedMaterial('Custom');
        setCustomObjDensity(800); // d=0.8
        
        setShape2(ObjectShape.CUBE);
        setDim1_2(100);
        setSelectedMaterial2('Custom');
        setDensity2(1100); // d=1.1
        setCordLength(50);

        setSelectedFluid('Água Doce');
        setCustomFluidDensity(1000);
        setEnableTwoFluids(false);
        setDepthA(400);
        setTankWidth(500);
        setTankDepth(500);
        setTankHeight(500);
        setToastMsg('Exercício 5 Carregado!');
        setTimeout(() => setToastMsg(null), 1500);
      }
    },
    {
      id: 'ex_extra_weight',
      title: 'Peso Extra',
      subtitle: 'Bloco com carga superior',
      enunciado: 'Um bloco de madeira flutua na água. Uma carga adicional é colocada sobre ele. Determine o novo calado (altura submersa) do bloco.',
      load: () => {
        setIsSimulating(false);
        setActiveExerciseId('ex_extra_weight');
        setCurrentEnunciado('Um bloco de madeira flutua na água. Uma carga adicional é colocada sobre ele. Determine o novo calado (altura submersa) do bloco.');
        setTwoBlocks(false);
        setExtraWeight(50); // 50N extra
        setSelectedMaterial('Madeira (Pinho)');
        setCustomObjDensity(600);
        setShape(ObjectShape.CUBE);
        setDim1(30);
        setSelectedFluid('Água Doce');
        setCustomFluidDensity(1000);
        setEnableTwoFluids(false);
        setDepthA(100);
        setTankWidth(200);
        setTankDepth(200);
        setTankHeight(200);
        setToastMsg('Simulação com Peso Extra Carregada!');
        setTimeout(() => setToastMsg(null), 1500);
      }
    },
    {
      id: 'ex_two_blocks_connected',
      title: 'Dois Blocos Conectados',
      subtitle: 'Equilíbrio de dois corpos',
      enunciado: 'Dois blocos de densidades diferentes estão conectados. Encontre o ponto de equilíbrio do sistema quando imerso em água.',
      load: () => {
        setIsSimulating(false);
        setActiveExerciseId('ex_two_blocks_connected');
        setCurrentEnunciado('Dois blocos de densidades diferentes estão conectados. Encontre o ponto de equilíbrio do sistema quando imerso em água.');
        setTwoBlocks(true);
        setExtraWeight(0);
        setShape(ObjectShape.CUBE);
        setDim1(10); // 1000 cm3
        setSelectedMaterial('Custom');
        setCustomObjDensity(500); // 0.5 g/cm3
        setShape2(ObjectShape.CUBE);
        setDim1_2(10);
        setSelectedMaterial2('Custom');
        setDensity2(1500); // 1.5 g/cm3
        setCordLength(20);
        setSelectedFluid('Água Doce');
        setCustomFluidDensity(1000);
        setEnableTwoFluids(false);
        setDepthA(100);
        setTankWidth(200);
        setTankDepth(200);
        setTankHeight(200);
        setToastMsg('Exercício Dois Blocos Carregado!');
        setTimeout(() => setToastMsg(null), 1500);
      }
    }
  ];

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
  const objColor = MATERIALS.find((m) => m.name === selectedMaterial)?.color || '#475569';
  const TANK_BORDER_COLOR = '#06b6d4';
  const OBJECT_BORDER_COLOR = '#475569';
  const forceText = isSimulating
    ? physics.apparentWeight >= 10000
      ? `${(physics.apparentWeight / 1000).toFixed(1)} kN`
      : `${physics.apparentWeight.toFixed(1)} N`
    : '?';

  const colorA = getFluidColor(selectedFluid);
  const colorB = getFluidColor(selectedFluidB);

  let specialResult: { title: string; value: string; unit?: string; description?: string } | null = null;
  if (activeExerciseId === 'ex2') {
    const rho_w = selectedFluid === 'Custom' ? customFluidDensity : (FLUIDS.find(f => f.name === selectedFluid)?.density || 1000);
    const rho_A = customObjDensity;
    const rho_B = (1.5 * rho_w) - rho_A;
    specialResult = {
      title: 'Massa Específica (Esfera B)',
      value: isSimulating ? rho_B.toFixed(0) : '???',
      unit: 'kg/m³',
      description: 'Calculado p/ Esfera A 50% submersa'
    };
  }

  const geom = {
    formula: shape === ObjectShape.CUBE ? 'L³' : shape === ObjectShape.SPHERE ? '4/3 · π · r³' : 'L · P · H',
    substitution: shape === ObjectShape.CUBE ? `${dim1}³` : shape === ObjectShape.SPHERE ? `4/3 · π · ${dim1}³` : `${dim1} · ${dim1} · ${dim2}`
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[800px]">
        {/* --- LEFT SIDEBAR: CONTROLS --- */}
        <div className="lg:col-span-3 flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
          {/* SIMULAÇÕES PRONTAS */}
          <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl p-4 shadow-md text-white">
            <div className="flex items-center gap-2 mb-3 text-sm font-bold tracking-wider opacity-90">
              <BookOpen className="w-4 h-4" />
              SIMULAÇÕES PRONTAS
            </div>
            <select
              className="w-full bg-white/20 hover:bg-white/30 transition-colors rounded-lg p-3 text-left flex items-center gap-3 border border-white/30 text-white outline-none cursor-pointer text-xs"
              onChange={(e) => {
                const ex = EXERCISES.find(x => x.id === e.target.value);
                if (ex) ex.load();
              }}
              defaultValue=""
            >
              <option value="" disabled className="text-gray-800">Selecione uma simulação...</option>
              {EXERCISES.map(ex => (
                <option key={ex.id} value={ex.id} className="text-gray-800">
                  {ex.title} ({ex.subtitle})
                </option>
              ))}
            </select>
            {currentEnunciado && (
              <div className="mt-4 p-3 bg-white/10 rounded-lg border border-white/20 text-xs leading-relaxed text-blue-50">
                <span className="font-bold block mb-1 text-white">Enunciado:</span>
                {currentEnunciado}
              </div>
            )}
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
            extraWeight={extraWeight}
            onExtraWeightChange={setExtraWeight}
            twoBlocks={twoBlocks}
            onTwoBlocksChange={setTwoBlocks}
            selectedMaterial2={selectedMaterial2}
            onMaterial2Change={(e) => {
              setSelectedMaterial2(e.target.value);
              if (e.target.value !== 'Custom') {
                const mat = MATERIALS.find(m => m.name === e.target.value);
                if (mat) setDensity2(mat.density);
              }
            }}
            density2={density2}
            onDensity2Change={setDensity2}
            dim1_2={dim1_2}
            onDim1_2Change={setDim1_2}
            cordLength={cordLength}
            onCordLengthChange={setCordLength}
            shape2={shape2}
            onShape2Change={setShape2}
          />
        </div>

        {/* --- CENTER: SCENE --- */}
        <div id="areaSimulacao" data-simulacao={JSON.stringify(exportData)} className="lg:col-span-6 flex flex-col h-full bg-white rounded-3xl border border-blue-100/50 overflow-hidden relative shadow-2xl shadow-blue-200/20 min-h-[500px]">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 z-20"></div>
          <div className="w-full h-full">
            {is3D ? (
              <Vista3D
                svgWidth={svgWidth}
                svgHeight={svgHeight}
                currentTankW={currentTankW}
                currentTankH={currentTankH}
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
                isObjectAboveWater={animBlockY < fluidSurfaceY}
                TANK_BORDER_COLOR={TANK_BORDER_COLOR}
                OBJECT_BORDER_COLOR={OBJECT_BORDER_COLOR}
                objColor={objColor}
                selectedMaterial={selectedMaterial}
                shape={shape}
                visualWidth={visualWidth}
                visualHeight={visualHeight}
                objBottomDistFromTankBottom={tankBottomY - (animBlockY + visualHeight)}
                objD_visual={dim1 * visualScaleFactor}
                visualTankDepth={tankDepth * visualScaleFactor}
                showFBD={showFBD}
                objectWeight={physics.objectWeight}
                buoyancyForce={physics.buoyancyForce}
                centerOfBuoyancyY_visual={(animBlockY + visualHeight) - (physics.centerOfBuoyancyY * visualScaleFactor)}
                showCenterOfBuoyancy={showCenterOfBuoyancy}
                onToggleCenterOfBuoyancy={() => setShowCenterOfBuoyancy(!showCenterOfBuoyancy)}
                h_sub_actual={physics.h_sub_actual}
                twoBlocks={twoBlocks}
                H2_visual={H2_cm_visual}
                cordLength_visual={initialPhysics.actualCordLength * visualScaleFactor}
                obj2Color={MATERIALS.find(m => m.name === selectedMaterial2)?.color || '#475569'}
                extraWeight={extraWeight}
                shape2={shape2}
                visualWidth2={visualWidth2}
              />
            ) : (
              <Vista2D
                svgWidth={svgWidth}
                svgHeight={svgHeight}
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
                vol_deslocado={physics.vol_deslocado}
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
                showFBD={showFBD}
                objectWeight={physics.objectWeight}
                buoyancyForce={physics.buoyancyForce}
                centerOfBuoyancyY_visual={(animBlockY + visualHeight) - (physics.centerOfBuoyancyY * visualScaleFactor)}
                h_sub_actual={physics.h_sub_actual}
                showCenterOfBuoyancy={showCenterOfBuoyancy}
                onToggleCenterOfBuoyancy={() => setShowCenterOfBuoyancy(!showCenterOfBuoyancy)}
                twoBlocks={twoBlocks}
                H2_visual={H2_cm_visual}
                cordLength_visual={initialPhysics.actualCordLength * visualScaleFactor}
                obj2Color={MATERIALS.find(m => m.name === selectedMaterial2)?.color || '#475569'}
                extraWeight={extraWeight}
                shape2={shape2}
                visualWidth2={visualWidth2}
              />
            )}
          </div>
          
          {/* --- CONTROLS OVERLAY --- */}
          {/* Top Control Bar */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex z-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-blue-100/50 p-1">
            <button 
              onClick={() => setIs3D(!is3D)} 
              className={`px-4 py-1.5 rounded-full font-bold transition-all text-xs flex items-center gap-2 ${is3D ? 'bg-blue-100/80 text-blue-700 shadow-inner' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'}`}
            >
              <Box className="w-3.5 h-3.5" />
              {is3D ? '3D ON' : '3D OFF'}
            </button>
            <button 
              onClick={() => setShowFBD(!showFBD)} 
              className={`px-4 py-1.5 rounded-full font-bold transition-all text-xs flex items-center gap-2 ${showFBD ? 'bg-blue-100/80 text-blue-700 shadow-inner' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'}`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              VETORES
            </button>
          </div>

          {/* Main Action Button */}
          <div className="absolute bottom-6 right-6 z-10">
            <button 
              onClick={() => setIsSimulating(!isSimulating)} 
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-xs tracking-wide uppercase transition-all active:scale-95 shadow-lg
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
        <PainelResultados
          physics={physics}
          isSimulating={isSimulating}
          enableTwoFluids={enableTwoFluids}
          forceText={forceText}
          showCalculations={showCalculations}
          onToggleCalculations={() => setShowCalculations(!showCalculations)}
          specialResult={specialResult}
        />
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
          activeExerciseId={activeExerciseId}
          onClose={() => setShowCalculations(false)}
        />
      )}
    </div>
  );
};
