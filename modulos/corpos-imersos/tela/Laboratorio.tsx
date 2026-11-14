import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  BookOpen,
  RotateCcw,
  ArrowLeftRight,
  Gauge,
  X,
} from 'lucide-react';
import { MATERIALS, FLUIDS } from '../dominio/configuracao';
import { ObjectShape } from '../dominio/tipos';
import { PainelControles } from './PainelControles';
import { PainelResultados } from './PainelResultados';
import { PainelComparacaoFluidos } from './PainelComparacaoFluidos';
import { Memorial } from './Memorial';
import { Vista2D } from '../visual/Vista2D';
import { Vista3D } from '../visual/Vista3D';
import { simularCorposImersos } from '../calculos/simulador';
import { calcularPesoEspecificoCorpoImerso } from '../calculos/pesoEspecificoImerso';
import { getFluidColor } from '../visual/visualUtils';
import { salvarNoHistorico } from '../../../interface/historicoGerenciador';
import { ScrollablePanel } from '../../../interface/ScrollablePanel';

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
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [showCenterOfBuoyancy, setShowCenterOfBuoyancy] = useState<boolean>(true);
  const [showFluidComparison, setShowFluidComparison] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [currentEnunciado, setCurrentEnunciado] = useState<string | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);

  // --- STATE: MODO DETERMINAÇÃO DO PESO ESPECÍFICO (EXEMPLO 2.11) ---
  const [inverseSpecificWeightMode, setInverseSpecificWeightMode] = useState<boolean>(false);
  const [realWeightN, setRealWeightN] = useState<number>(445);
  const [apparentWeightN, setApparentWeightN] = useState<number>(267);
  const [fluidSpecificWeight, setFluidSpecificWeight] = useState<number>(9802);

  // --- LAYOUT CALCULATIONS ---
  const svgHeight = 600;
  const svgWidth = 700;
  const tankBottomY = 530;
  const tankTopMargin = 195;
  const availablePixelHeight = tankBottomY - tankTopMargin;
  const availablePixelWidth = svgWidth - 120;

  const fluidTotalDepth = enableTwoFluids ? depthA + depthB : depthA;
  const autoTankHeight = Math.max(tankHeight, Math.ceil(fluidTotalDepth * 1.15));
  const scaleHeight = availablePixelHeight / autoTankHeight;
  const scaleWidth = availablePixelWidth / tankWidth;
  const visualScaleFactor = Math.min(scaleHeight, scaleWidth);

  const currentTankW = tankWidth * visualScaleFactor;
  const currentTankH = autoTankHeight * visualScaleFactor;
  const tankOffsetX = (svgWidth - currentTankW) / 2 + 30;
  const originalFluidSurfaceY = tankBottomY - fluidTotalDepth * visualScaleFactor;

  const inversePreCalc = useMemo(
    () =>
      inverseSpecificWeightMode
        ? calcularPesoEspecificoCorpoImerso({
            realWeightN,
            apparentWeightN,
            fluidSpecificWeight,
            gravity,
            tankWidthCm: tankWidth,
            tankDepthCm: tankDepth,
          })
        : null,
    [inverseSpecificWeightMode, realWeightN, apparentWeightN, fluidSpecificWeight, gravity, tankWidth, tankDepth]
  );

  const effectiveDim1 = inverseSpecificWeightMode
    ? (inversePreCalc?.illustrativeCubeSideCm ?? 26.28)
    : dim1;

  let visualWidth = 0;
  let visualHeight = 0;
  if (shape === ObjectShape.CUBE) {
    visualWidth = effectiveDim1 * visualScaleFactor;
    visualHeight = effectiveDim1 * visualScaleFactor;
  } else if (shape === ObjectShape.SPHERE) {
    visualWidth = effectiveDim1 * 2 * visualScaleFactor;
    visualHeight = effectiveDim1 * 2 * visualScaleFactor;
  } else {
    visualWidth = effectiveDim1 * 2 * visualScaleFactor;
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
  const rhoA = inverseSpecificWeightMode
    ? fluidSpecificWeight / gravity
    : selectedFluid === 'Custom'
    ? customFluidDensity
    : FLUIDS.find((f) => f.name === selectedFluid)?.density || 0;
  const rhoB = selectedFluidB === 'Custom' ? customFluidDensityB : (FLUIDS.find(f => f.name === selectedFluidB)?.density || 0);

  // --- ANIMATION STATE ---
  const [animBlockY, setAnimBlockY] = useState<number>(0);
  const posRef = useRef<number>(0);
  const velRef = useRef<number>(0);
  const reqRef = useRef<number>(undefined);
  const speedRef = useRef<number>(speedMultiplier);
  speedRef.current = speedMultiplier;
  const lastTimeRef = useRef<number>(0);

  // Initial physics for animation
  const initialPhysics = useMemo(() => simularCorposImersos({
    shape, dim1: effectiveDim1, dim2, objectDensity: customObjDensity,
    rhoA, rhoB, depthA, depthB, enableTwoFluids, gravity,
    tankWidth, tankDepth, visualScaleFactor, visualHeight,
    fluidSurfaceY: originalFluidSurfaceY, h_in_A: 0, h_in_B: 0,
    h_in_A_2: 0, h_in_B_2: 0,
    extraWeight, twoBlocks, density2, dim1_2, dim2_2, cordLength, shape2,
    rigidRod: activeExerciseId === 'ex2',
    inverseSpecificWeightMode,
    realWeightN,
    apparentWeightN,
    fluidSpecificWeight,
  }), [shape, effectiveDim1, dim2, customObjDensity, rhoA, rhoB, depthA, depthB, enableTwoFluids, gravity, tankWidth, tankDepth, visualScaleFactor, visualHeight, originalFluidSurfaceY, extraWeight, twoBlocks, density2, dim1_2, dim2_2, cordLength, shape2, activeExerciseId, inverseSpecificWeightMode, realWeightN, apparentWeightN, fluidSpecificWeight]);

  const equilibriumBlockY = originalFluidSurfaceY + (initialPhysics.d_eq * visualScaleFactor) - (twoBlocks ? (initialPhysics.H2_cm * visualScaleFactor + initialPhysics.actualCordLength * visualScaleFactor) : 0) - visualHeight;
  const totalInitialVisualH = visualHeight + (twoBlocks ? (initialPhysics.H2_cm * visualScaleFactor + initialPhysics.actualCordLength * visualScaleFactor) : 0);
  const startBlockY = Math.max(45, tankBottomY - currentTankH - totalInitialVisualH - 22);

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
        const spd = speedRef.current;
        const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05) * spd; 
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
    shape, dim1: effectiveDim1, dim2, objectDensity: customObjDensity,
    rhoA, rhoB, depthA, depthB, enableTwoFluids, gravity,
    tankWidth, tankDepth, visualScaleFactor, visualHeight,
    fluidSurfaceY: originalFluidSurfaceY, h_in_A, h_in_B,
    h_in_A_2, h_in_B_2,
    extraWeight, twoBlocks, density2, dim1_2, dim2_2, cordLength, shape2,
    rigidRod: activeExerciseId === 'ex2',
    inverseSpecificWeightMode,
    realWeightN,
    apparentWeightN,
    fluidSpecificWeight,
  }), [shape, effectiveDim1, dim2, customObjDensity, rhoA, rhoB, depthA, depthB, enableTwoFluids, gravity, tankWidth, tankDepth, visualScaleFactor, visualHeight, originalFluidSurfaceY, h_in_A, h_in_B, h_in_A_2, h_in_B_2, extraWeight, twoBlocks, density2, dim1_2, dim2_2, cordLength, shape2, activeExerciseId, inverseSpecificWeightMode, realWeightN, apparentWeightN, fluidSpecificWeight]);

  const exportData = useMemo(() => ({
    tipo: 'corpos-imersos',
    geometria: inverseSpecificWeightMode ? 'Bloco de Concreto (Ilustrativo)' : shape,
    dimensoes: inverseSpecificWeightMode
      ? {}
      : {
          'Aresta/Raio (cm)': dim1,
          ...(shape !== ObjectShape.CUBE && shape !== ObjectShape.SPHERE ? { 'Comprimento (cm)': dim2 } : {}),
          ...(twoBlocks ? { 'Aresta 2 (cm)': dim1_2 } : {}),
        },
    inverseSpecificWeightMode,
    pesoEspecificoFluido: physics.fluidSpecificWeight ?? fluidSpecificWeight,
    pesoEspecificoCorpo: physics.objectSpecificWeight ?? 0,
    pesoAparente: physics.apparentWeight,
    densidadeObjeto: inverseSpecificWeightMode ? physics.objectDensity : customObjDensity,
    densidadeEquivalente: physics.equivalentDensity,
    densidadeFluido: rhoA,
    status: physics.status,
    empuxo: physics.buoyancyForce,
    peso: physics.objectWeight,
    volumeDeslocado: physics.vol_deslocado,
    alturaSubmersa: physics.h_sub_actual / 100,
    isSimulating,
    isAnalyzed: isSimulating,
  }), [shape, dim1, dim2, twoBlocks, dim1_2, customObjDensity, rhoA, physics, isSimulating, inverseSpecificWeightMode, fluidSpecificWeight]);

  const fluidSurfaceY = originalFluidSurfaceY - physics.deltaH_cm * visualScaleFactor;
  const maxBlockY = tankBottomY - (twoBlocks ? (visualHeight + H2_cm_visual + initialPhysics.actualCordLength * visualScaleFactor) : visualHeight);
  const isFloatingAtFreeSurface =
    physics.status === 'FLUTUANDO' ||
    physics.status === 'FLUTUANDO EM A' ||
    physics.status === 'FLUTUANDO NA INTERFACE A/B';
  const visualBlockY = isFloatingAtFreeSurface
    ? Math.min(maxBlockY, animBlockY - physics.deltaH_cm * visualScaleFactor)
    : Math.min(maxBlockY, animBlockY);

  // --- HANDLERS ---
  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const matName = e.target.value;
    setSelectedMaterial(matName);
    if (matName !== 'Custom') {
      const mat = MATERIALS.find((m) => m.name === matName);
      if (mat) setCustomObjDensity(mat.density);
    }
  };

  const handleResetSimulation = () => {
    setIsSimulating(false);
    setActiveExerciseId(null);
    setInverseSpecificWeightMode(false);
    setCurrentEnunciado(null);
    setTwoBlocks(false);
    setExtraWeight(0);
    setSelectedMaterial('Concreto');
    setCustomObjDensity(2400);
    setShape(ObjectShape.CUBE);
    setDim1(100);
    setDim2(100);
    setSelectedFluid(FLUIDS[4].name);
    setCustomFluidDensity(FLUIDS[4].density);
    setDepthA(300);
    setEnableTwoFluids(false);
    setSelectedFluidB(FLUIDS[6].name);
    setCustomFluidDensityB(FLUIDS[6].density);
    setDepthB(100);
    setTankWidth(500);
    setTankDepth(500);
    setTankHeight(500);
    setSelectedMaterial2('Concreto');
    setDensity2(2400);
    setDim1_2(100);
    setDim2_2(100);
    setCordLength(20);
    setShape2(ObjectShape.CUBE);
    setShowCalculations(false);
    setToastMsg('Estado inicial restaurado!');
    setTimeout(() => setToastMsg(null), 1500);
  };

  const EXERCISES = [
    {
      id: 'sim1',
      title: 'Simulação 1: Cubo de Carvalho',
      subtitle: 'Aresta 100 cm em Óleo de Soja (400 cm)',
      enunciado: 'Um cubo de madeira (Carvalho, ρ = 750 kg/m³) com aresta de 100 cm é colocado em um reservatório contendo Óleo de Soja (ρ = 920 kg/m³) com 400 cm de profundidade. Determine o estado de equilíbrio, o empuxo, o volume deslocado e a altura submersa.',
      load: () => {
        setIsSimulating(false);
        setActiveExerciseId('sim1');
        setInverseSpecificWeightMode(false);
        setCurrentEnunciado('Um cubo de madeira (Carvalho, ρ = 750 kg/m³) com aresta de 100 cm é colocado em um reservatório contendo Óleo de Soja (ρ = 920 kg/m³) com 400 cm de profundidade. Determine o estado de equilíbrio, o empuxo, o volume deslocado e a altura submersa.');
        setTwoBlocks(false);
        setExtraWeight(0);
        setShape(ObjectShape.CUBE);
        setDim1(100);
        setSelectedMaterial('Madeira (Carvalho)');
        setCustomObjDensity(750);
        setSelectedFluid('Óleo de Soja');
        setCustomFluidDensity(920);
        setEnableTwoFluids(false);
        setDepthA(400);
        setTankWidth(500);
        setTankDepth(500);
        setTankHeight(500);
        setToastMsg('Simulação 1 Carregada!');
        setTimeout(() => setToastMsg(null), 1500);
      }
    },
    {
      id: 'sim2',
      title: 'Simulação 2: Cubo de Ouro',
      subtitle: 'Aresta 200 cm em Mercúrio (Tanque 600x600 cm)',
      enunciado: 'Um cubo de Ouro (ρ = 19300 kg/m³) com aresta de 200 cm é imerso em um reservatório de 600 × 600 cm contendo Mercúrio (ρ = 13534 kg/m³) com 600 cm de profundidade. Determine o estado de equilíbrio, o empuxo, o peso aparente e o volume deslocado.',
      load: () => {
        setIsSimulating(false);
        setActiveExerciseId('sim2');
        setInverseSpecificWeightMode(false);
        setCurrentEnunciado('Um cubo de Ouro (ρ = 19300 kg/m³) com aresta de 200 cm é imerso em um reservatório de 600 × 600 cm contendo Mercúrio (ρ = 13534 kg/m³) com 600 cm de profundidade. Determine o estado de equilíbrio, o empuxo, o peso aparente e o volume deslocado.');
        setTwoBlocks(false);
        setExtraWeight(0);
        setShape(ObjectShape.CUBE);
        setDim1(200);
        setSelectedMaterial('Ouro');
        setCustomObjDensity(19300);
        setSelectedFluid('Mercúrio');
        setCustomFluidDensity(13534);
        setEnableTwoFluids(false);
        setDepthA(600);
        setTankWidth(600);
        setTankDepth(600);
        setTankHeight(600);
        setToastMsg('Simulação 2 Carregada!');
        setTimeout(() => setToastMsg(null), 1500);
      }
    },
    {
      id: 'sim3',
      title: 'Simulação 3: Esfera de Isopor',
      subtitle: 'Raio 50 cm em Óleo de Soja (Tanque 500x500 cm)',
      enunciado: 'Uma esfera de Isopor (ρ = 30 kg/m³) com raio de 50 cm é colocada em um tanque de 500 × 500 cm contendo Óleo de Soja (ρ = 920 kg/m³). Determine o estado de equilíbrio, o empuxo, o volume deslocado e a altura submersa.',
      load: () => {
        setIsSimulating(false);
        setActiveExerciseId('sim3');
        setInverseSpecificWeightMode(false);
        setCurrentEnunciado('Uma esfera de Isopor (ρ = 30 kg/m³) com raio de 50 cm é colocada em um tanque de 500 × 500 cm contendo Óleo de Soja (ρ = 920 kg/m³). Determine o estado de equilíbrio, o empuxo, o volume deslocado e a altura submersa.');
        setTwoBlocks(false);
        setExtraWeight(0);
        setShape(ObjectShape.SPHERE);
        setDim1(50);
        setSelectedMaterial('Isopor');
        setCustomObjDensity(30);
        setSelectedFluid('Óleo de Soja');
        setCustomFluidDensity(920);
        setEnableTwoFluids(false);
        setDepthA(300);
        setTankWidth(500);
        setTankDepth(500);
        setTankHeight(500);
        setToastMsg('Simulação 3 Carregada!');
        setTimeout(() => setToastMsg(null), 1500);
      }
    },
    {
      id: 'sim4',
      title: 'Simulação 4: Esfera de Pinho',
      subtitle: 'Raio 150 cm em Água do Mar (Tanque 1000x1000 cm)',
      enunciado: 'Uma esfera de Madeira (Pinho, ρ = 500 kg/m³) com raio de 150 cm é colocada em um tanque de 1000 × 1000 cm contendo Água do Mar (ρ = 1025 kg/m³) com 500 cm de profundidade. Determine o estado de equilíbrio, o empuxo, o volume deslocado e a altura submersa.',
      load: () => {
        setIsSimulating(false);
        setActiveExerciseId('sim4');
        setInverseSpecificWeightMode(false);
        setCurrentEnunciado('Uma esfera de Madeira (Pinho, ρ = 500 kg/m³) com raio de 150 cm é colocada em um tanque de 1000 × 1000 cm contendo Água do Mar (ρ = 1025 kg/m³) com 500 cm de profundidade. Determine o estado de equilíbrio, o empuxo, o volume deslocado e a altura submersa.');
        setTwoBlocks(false);
        setExtraWeight(0);
        setShape(ObjectShape.SPHERE);
        setDim1(150);
        setSelectedMaterial('Madeira (Pinho)');
        setCustomObjDensity(500);
        setSelectedFluid('Água do Mar');
        setCustomFluidDensity(1025);
        setEnableTwoFluids(false);
        setDepthA(500);
        setTankWidth(1000);
        setTankDepth(1000);
        setTankHeight(600);
        setToastMsg('Simulação 4 Carregada!');
        setTimeout(() => setToastMsg(null), 1500);
      }
    },
    {
      id: 'sim5',
      title: 'Simulação 5: Cubo de Concreto (2 Líquidos)',
      subtitle: 'Aresta 100 cm em Mel (300 cm) e Mercúrio (100 cm)',
      enunciado: 'Um cubo de Concreto (ρ = 2400 kg/m³) com aresta de 100 cm é imerso em dois líquidos imiscíveis: Mel (superior, ρ = 1420 kg/m³, 300 cm) e Mercúrio (inferior, ρ = 13534 kg/m³, 100 cm). Determine o equilíbrio na interface e a fração submersa em cada fluido.',
      load: () => {
        setIsSimulating(false);
        setActiveExerciseId('sim5');
        setInverseSpecificWeightMode(false);
        setCurrentEnunciado('Um cubo de Concreto (ρ = 2400 kg/m³) com aresta de 100 cm é imerso em dois líquidos imiscíveis: Mel (superior, ρ = 1420 kg/m³, 300 cm) e Mercúrio (inferior, ρ = 13534 kg/m³, 100 cm). Determine o equilíbrio na interface e a fração submersa em cada fluido.');
        setTwoBlocks(false);
        setExtraWeight(0);
        setShape(ObjectShape.CUBE);
        setDim1(100);
        setSelectedMaterial('Concreto');
        setCustomObjDensity(2400);
        setSelectedFluid('Mel');
        setCustomFluidDensity(1420);
        setDepthA(300);
        setEnableTwoFluids(true);
        setSelectedFluidB('Mercúrio');
        setCustomFluidDensityB(13534);
        setDepthB(100);
        setTankWidth(500);
        setTankDepth(500);
        setTankHeight(500);
        setToastMsg('Simulação 5 Carregada!');
        setTimeout(() => setToastMsg(null), 1500);
      }
    },
    {
      id: 'ex_2_11',
      title: 'Exemplo 2.11 – Determinação do Peso Específico de um Corpo Imerso',
      subtitle: 'Bloco de Concreto: P = 445 N, P_ap = 267 N em Água Doce (9.802 N/m³)',
      enunciado: "Um bloco de concreto pesa 445 N no ar e 'pesa' apenas 267 N quando imerso em água doce (9.802 N/m³). Qual é o peso específico médio do bloco?",
      load: () => {
        setIsSimulating(false);
        setActiveExerciseId('ex_2_11');
        setInverseSpecificWeightMode(true);
        setRealWeightN(445);
        setApparentWeightN(267);
        setFluidSpecificWeight(9802);
        setCurrentEnunciado("Um bloco de concreto pesa 445 N no ar e 'pesa' apenas 267 N quando imerso em água doce (9.802 N/m³). Qual é o peso específico médio do bloco?");
        setTwoBlocks(false);
        setExtraWeight(0);
        setShape(ObjectShape.CUBE);
        setSelectedMaterial('Concreto');
        setCustomObjDensity(2498);
        setSelectedFluid('Água Doce');
        setCustomFluidDensity(9802 / 9.81);
        setEnableTwoFluids(false);
        setDepthA(80);
        setTankWidth(90);
        setTankDepth(90);
        setTankHeight(100);
        setToastMsg('Exemplo 2.11 Carregado!');
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
    customFluidDensity,
    depthA,
    selectedFluidB,
    customFluidDensityB,
    depthB,
    enableTwoFluids,
    tankWidth,
    tankDepth,
    tankHeight,
    extraWeight,
    twoBlocks,
    selectedMaterial2,
    density2,
    dim1_2,
    dim2_2,
    cordLength,
    shape2,
    inverseSpecificWeightMode,
    realWeightN,
    apparentWeightN,
    fluidSpecificWeight,
  ]);

  const objectWidthCm = shape === ObjectShape.CUBE ? effectiveDim1 : effectiveDim1 * 2;
  const isObjectTooWide = objectWidthCm > tankWidth;
  const objColor = MATERIALS.find((m) => m.name === selectedMaterial)?.color || '#475569';
  const TANK_BORDER_COLOR = '#06b6d4';
  const OBJECT_BORDER_COLOR = '#475569';
  const forceText = isSimulating
    ? `${(physics.apparentWeight / 1000).toFixed(2)} kN`
    : '?';

  const colorA = getFluidColor(selectedFluid);
  const colorB = getFluidColor(selectedFluidB);

  const specialResult: { title: string; value: string; unit?: string; description?: string } | null = null;

  const geom = {
    formula: shape === ObjectShape.CUBE ? 'L³' : shape === ObjectShape.SPHERE ? '4/3 · π · r³' : 'π · r² · h',
    substitution: shape === ObjectShape.CUBE ? `${(effectiveDim1 / 100).toFixed(2)}³` : shape === ObjectShape.SPHERE ? `4/3 · π · ${(effectiveDim1 / 100).toFixed(2)}³` : `π · ${(effectiveDim1 / 100).toFixed(2)}² · ${(dim2 / 100).toFixed(2)}`
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-1 lg:min-h-0 lg:overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)] gap-6 lg:flex-1 lg:h-full lg:min-h-0 lg:overflow-hidden">
        {/* --- LEFT SIDEBAR: CONTROLS --- */}
        <ScrollablePanel
          id="tour-controles"
          dataTour="painel-controles"
          className="lg:col-span-3 h-[600px] lg:h-full lg:max-h-full min-h-0 overflow-hidden"
          contentClassName="flex flex-col gap-4 pr-3.5 pb-4"
        >
          {/* SIMULAÇÕES PRONTAS */}
          <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl p-4 shadow-md text-white shrink-0">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-sm font-bold tracking-wider opacity-90">
                <BookOpen className="w-4 h-4" />
                SIMULAÇÕES PRONTAS
              </div>
              <button
                type="button"
                onClick={handleResetSimulation}
                title="Fechar simulação e restaurar estado inicial"
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/20 hover:bg-white/30 border border-white/30 text-[10px] font-bold uppercase tracking-wider text-white transition-colors cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3 h-3" />
                Resetar
              </button>
            </div>
            <select
              className="w-full bg-white/20 hover:bg-white/30 transition-colors rounded-lg p-3 text-left flex items-center gap-3 border border-white/30 text-white outline-none cursor-pointer text-xs"
              value={activeExerciseId || ""}
              onChange={(e) => {
                const ex = EXERCISES.find(x => x.id === e.target.value);
                if (ex) ex.load();
              }}
            >
              <option value="" disabled className="text-gray-800">Selecione uma simulação...</option>
              {EXERCISES.map(ex => (
                <option key={ex.id} value={ex.id} className="text-gray-800">
                  {ex.title} ({ex.subtitle})
                </option>
              ))}
            </select>
            {currentEnunciado && (
              <div className="mt-4 p-3 bg-white/10 rounded-lg border border-white/20 text-xs leading-relaxed text-blue-50 relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">Enunciado:</span>
                  <button
                    type="button"
                    onClick={handleResetSimulation}
                    title="Fechar simulação e voltar ao estado inicial"
                    className="p-0.5 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {currentEnunciado}
              </div>
            )}
          </div>

          <PainelControles
            selectedMaterial={selectedMaterial}
            customObjDensity={customObjDensity}
            shape={shape}
            dim1={dim1}
            dim2={dim2}
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
            onDim2Change={setDim2}
            onFluidChange={(e) => {
                setSelectedFluid(e.target.value);
                if (e.target.value !== 'Custom') {
                  const foundDensity = FLUIDS.find((f) => f.name === e.target.value)?.density || 0;
                  setCustomFluidDensity(foundDensity);
                  if (inverseSpecificWeightMode) {
                    setFluidSpecificWeight(Math.round(foundDensity * gravity));
                  }
                }
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
            showFluidComparison={showFluidComparison}
            onToggleFluidComparison={() => setShowFluidComparison((prev) => !prev)}
            inverseSpecificWeightMode={inverseSpecificWeightMode}
            realWeightN={realWeightN}
            apparentWeightN={apparentWeightN}
            fluidSpecificWeight={fluidSpecificWeight}
            gravity={gravity}
            onRealWeightChange={setRealWeightN}
            onApparentWeightChange={setApparentWeightN}
            onFluidSpecificWeightChange={setFluidSpecificWeight}
          />
        </ScrollablePanel>

        {/* --- CENTER: SCENE --- */}
        <div id="areaSimulacao" data-simulacao={JSON.stringify(exportData)} className="lg:col-span-6 flex flex-col h-[500px] lg:h-full lg:max-h-full lg:min-h-0 bg-white rounded-3xl border border-blue-100/50 overflow-hidden relative shadow-2xl shadow-blue-200/20">
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
                isObjectAboveWater={visualBlockY < fluidSurfaceY}
                TANK_BORDER_COLOR={TANK_BORDER_COLOR}
                OBJECT_BORDER_COLOR={OBJECT_BORDER_COLOR}
                objColor={objColor}
                selectedMaterial={selectedMaterial}
                shape={shape}
                visualWidth={visualWidth}
                visualHeight={visualHeight}
                objBottomDistFromTankBottom={tankBottomY - (visualBlockY + visualHeight)}
                objD_visual={visualWidth}
                visualTankDepth={tankDepth * visualScaleFactor}
                showFBD={showFBD}
                objectWeight={physics.objectWeight}
                buoyancyForce={physics.buoyancyForce}
                centerOfBuoyancyY_visual={(visualBlockY + visualHeight) - (physics.centerOfBuoyancyY * visualScaleFactor)}
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
                inverseSpecificWeightMode={inverseSpecificWeightMode}
                apparentWeight={physics.apparentWeight}
                vol_deslocado={physics.vol_deslocado}
              />
            ) : (
              <Vista2D
                svgWidth={svgWidth}
                svgHeight={svgHeight}
                tankBottomY={tankBottomY}
                tankOffsetX={tankOffsetX}
                currentTankW={currentTankW}
                currentTankH={currentTankH}
                tankWidth={tankWidth}
                tankDepth={tankDepth}
                shape={shape}
                visualWidth={visualWidth}
                visualHeight={visualHeight}
                selectedMaterial={selectedMaterial}
                blockY={visualBlockY}
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
                centerOfBuoyancyY_visual={(visualBlockY + visualHeight) - (physics.centerOfBuoyancyY * visualScaleFactor)}
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
                inverseSpecificWeightMode={inverseSpecificWeightMode}
                apparentWeight={physics.apparentWeight}
              />
            )}
          </div>
          
          {/* --- CONTROLS OVERLAY --- */}
          {/* Top Control Bar */}
          <div className="absolute top-6 left-6 flex z-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-blue-100/50 p-1">
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

          {/* Speed Control */}
          <div className="absolute top-6 right-6 flex z-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-blue-100/50 p-1 items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-slate-400 ml-2" />
            {[
              { label: '0.5×', value: 0.5 },
              { label: '1×', value: 1 },
              { label: '2×', value: 2 },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSpeedMultiplier(opt.value)}
                className={`px-3 py-1.5 rounded-full font-bold transition-all text-xs ${
                  speedMultiplier === opt.value
                    ? 'bg-blue-100/80 text-blue-700 shadow-inner'
                    : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Main Action Button */}
          <div id="tour-btn-acao" data-tour="botao-acao" className="absolute bottom-6 right-6 z-10">
            <button 
              onClick={() => {
                const proximo = !isSimulating;
                setIsSimulating(proximo);
                if (proximo && physics) {
                  const E_eq = physics.eqBuoyancyForce ?? physics.buoyancyForce;
                  const V_eq = physics.eqVolDeslocado ?? physics.vol_deslocado;
                  const H_eq = physics.eqHSubActual ?? physics.h_sub_actual;
                  salvarNoHistorico({
                    modulo: 'corpos-imersos',
                    moduloNome: 'Corpos Imersos',
                    titulo: inverseSpecificWeightMode
                      ? `Bloco Imerso (${selectedMaterial || 'Concreto'}) – Determinação de γ`
                      : `Corpo ${shape} (${selectedMaterial || 'Personalizado'})`,
                    parametros: inverseSpecificWeightMode
                      ? {
                          'Objeto': `Bloco (${selectedMaterial || 'Concreto'})`,
                          'Peso Real (P)': `${realWeightN.toFixed(1)} N`,
                          'Peso Aparente (P_ap)': `${apparentWeightN.toFixed(1)} N`,
                          'Fluido': selectedFluid,
                          'Peso Específico do Fluido (γ_f)': `${fluidSpecificWeight.toFixed(0)} N/m³`,
                        }
                      : {
                          'Forma': shape,
                          'Dimensão 1 (cm)': dim1,
                          ...(shape !== ObjectShape.CUBE && shape !== ObjectShape.SPHERE ? { 'Dimensão 2 (cm)': dim2 } : {}),
                          'Densidade Objeto': `${customObjDensity} kg/m³`,
                          'Fluido': selectedFluid,
                          'Densidade Fluido': `${rhoA} kg/m³`,
                        },
                    resultados: {
                      empuxo: E_eq,
                      empuxoFormatado: `${(E_eq / 1000).toFixed(3)} kN (${E_eq.toFixed(1)} N)`,
                      peso: physics.objectWeight,
                      pesoFormatado: `${(physics.objectWeight / 1000).toFixed(3)} kN (${physics.objectWeight.toFixed(1)} N)`,
                      volumeDeslocado: `${(V_eq * 1000).toFixed(2)} L (${V_eq.toFixed(5)} m³)`,
                      alturaSubmersa: inverseSpecificWeightMode ? 'Totalmente imerso' : `${H_eq.toFixed(1)} cm`,
                      segurancaOuStatus: inverseSpecificWeightMode
                        ? `γ_c = ${(physics.objectSpecificWeight ?? 0).toFixed(0)} N/m³ (ρ_c ≈ ${physics.objectDensity.toFixed(0)} kg/m³)`
                        : physics.status.includes('AFUNDADO') ? 'Afunda (P > E)' : physics.status.includes('NEUTRO') ? 'Equilíbrio Neutro (E = P)' : 'Flutua (E = P)',
                    },
                  });
                }
              }} 
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

      {/* Comparador de Fluidos */}
      {showFluidComparison && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <PainelComparacaoFluidos
              shape={shape}
              dim1={dim1}
              dim2={dim2}
              selectedMaterial={selectedMaterial}
              customObjDensity={customObjDensity}
              gravity={gravity}
              extraWeight={extraWeight}
              onApplyFluid={(fluidName, fluidDensity) => {
                setSelectedFluid(fluidName);
                setCustomFluidDensity(fluidDensity);
              }}
              onClose={() => setShowFluidComparison(false)}
            />
          </div>
        </div>
      )}

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
          enunciado={currentEnunciado}
          onClose={() => setShowCalculations(false)}
        />
      )}
    </div>
  );
};
