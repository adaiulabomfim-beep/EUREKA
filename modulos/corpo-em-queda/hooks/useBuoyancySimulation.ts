import { useState, useEffect, useRef, useMemo } from 'react';
import { ObjectShape, FLUIDS } from '../types';
import { calculateVolume, calculateBaseArea, calculateHeight, calculateVolumeFromBottom } from '../physics/volume';
import { calculateMass, calculateWeight } from '../physics/mass';
import { calculateBuoyancyForce, calculateApparentWeight } from '../physics/buoyancy';
import { calculateDeltaH, calculateTankBaseArea } from '../physics/displacement';

interface SimulationProps {
  shape: ObjectShape;
  dim1: number;
  dim2: number;
  objectDensity: number;
  selectedFluid: string;
  customFluidDensity: number;
  selectedFluidB: string;
  customFluidDensityB: number;
  depthA: number;
  depthB: number;
  enableTwoFluids: boolean;
  gravity: number;
  isSimulating: boolean;
  
  // Layout info for animation mapping
  tankHeight: number;
  tankBottomY: number;
  visualScaleFactor: number;
  visualHeight: number;
  fluidSurfaceY: number;
  tankWidth: number;
  tankDepth?: number; // cm
}

export const useBuoyancySimulation = (props: SimulationProps) => {
  const {
    shape, dim1, dim2, objectDensity,
    selectedFluid, customFluidDensity, selectedFluidB, customFluidDensityB,
    depthA, depthB, enableTwoFluids, gravity, isSimulating,
    visualScaleFactor, tankBottomY, visualHeight, fluidSurfaceY,
    tankHeight, tankWidth, tankDepth = 100
  } = props;

  const tankBaseArea = calculateTankBaseArea(tankWidth / 100, tankDepth / 100); // m^2

  // --- PHYSICS CALCULATIONS ---
  const toM = (cm: number) => cm / 100;

  const volume = useMemo(() => {
    return calculateVolume(shape, toM(dim1), toM(dim2));
  }, [shape, dim1, dim2]);

  const baseArea = useMemo(() => {
    return calculateBaseArea(shape, toM(dim1));
  }, [shape, dim1]);

  const H_cm = useMemo(() => {
    return calculateHeight(shape, toM(dim1)) * 100;
  }, [shape, dim1, dim2]);

  const H_m = toM(H_cm);
  const objectMass = calculateMass(volume, objectDensity);
  const objectWeight = calculateWeight(objectMass, gravity);
  
  const rhoA = selectedFluid === 'Custom' ? customFluidDensity : (FLUIDS.find(f => f.name === selectedFluid)?.density || 0);
  const rhoB = selectedFluidB === 'Custom' ? customFluidDensityB : (FLUIDS.find(f => f.name === selectedFluidB)?.density || 0);

  // Equilibrium Calculation
  const fluidTotalDepth = enableTwoFluids ? depthA + depthB : depthA;
  let d_eq = 0; 
  let status = "FLUTUANDO";
  
  if (!enableTwoFluids) {
      if (Math.abs(objectDensity - rhoA) < 1) {
          status = "SUSPENSO (EQUILÍBRIO NEUTRO)";
          d_eq = fluidTotalDepth / 2 + H_cm/2; 
      } else if (objectDensity < rhoA) {
          status = "FLUTUANDO";
          d_eq = H_cm * (objectDensity / rhoA);
      } else {
          status = "AFUNDADO";
          d_eq = fluidTotalDepth; 
      }
  } else {
      if (objectDensity <= rhoA) {
          status = "FLUTUANDO EM A";
          const d_req_A = H_cm * (objectDensity / rhoA);
          if (d_req_A <= depthA) { d_eq = d_req_A; } else { d_eq = depthA; }
      } else if (objectDensity < rhoB) {
          status = "SUSPENSO NA INTERFACE";
          let h_in_B_calc = H_cm * (objectDensity - rhoA) / (rhoB - rhoA);
          if (h_in_B_calc > H_cm) h_in_B_calc = H_cm;
          if (h_in_B_calc < 0) h_in_B_calc = 0; 
          d_eq = depthA + h_in_B_calc;
      } else {
           status = "AFUNDADO";
           d_eq = fluidTotalDepth; 
      }
  }

  // --- ANIMATION STATE ---
  const equilibriumBlockY = fluidSurfaceY + (d_eq * visualScaleFactor) - visualHeight;
  const startBlockY = tankBottomY - (tankHeight * visualScaleFactor) - visualHeight - 50;
  
  const [animBlockY, setAnimBlockY] = useState<number>(0);
  const posRef = useRef<number>(0);
  const velRef = useRef<number>(0);
  const reqRef = useRef<number>(undefined);
  const lastTimeRef = useRef<number>(0);

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

        if (objectBottom < fluidSurfaceY) {
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
  }, [isSimulating, equilibriumBlockY, startBlockY, fluidSurfaceY, visualHeight, tankBottomY]);

  // --- DYNAMIC RESULTS ---
  const blockY = animBlockY;
  const currentObjBottomDepth = (blockY + visualHeight - fluidSurfaceY) / visualScaleFactor;
  const currentObjTopDepth = (blockY - fluidSurfaceY) / visualScaleFactor;

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

  const h_sub_actual = h_in_A + h_in_B;
  
  const d1_m = toM(dim1);
  const d2_m = toM(dim2);
  
  // Calculate volumes based on geometry (bottom-up accumulation)
  const vol_sub_B = calculateVolumeFromBottom(shape, d1_m, toM(h_in_B));
  const vol_total_sub = calculateVolumeFromBottom(shape, d1_m, toM(h_in_A + h_in_B));
  const vol_sub_A = Math.max(0, vol_total_sub - vol_sub_B);

  // Volume Deslocado (m^3)
  const vol_deslocado = vol_total_sub;
  const deltaH_m = calculateDeltaH(vol_deslocado, tankBaseArea);
  const deltaH_cm = deltaH_m * 100;
  
  const E_A = calculateBuoyancyForce(rhoA, vol_sub_A, gravity);
  const E_B = enableTwoFluids ? calculateBuoyancyForce(rhoB, vol_sub_B, gravity) : 0;
  const buoyancyForce = E_A + E_B;
  const apparentWeight = calculateApparentWeight(objectWeight, buoyancyForce);

  return {
    volume,
    baseArea,
    H_cm,
    H_m,
    objectWeight,
    objectMass,
    rhoA,
    rhoB,
    status,
    blockY,
    h_sub_actual,
    h_in_A,
    h_in_B,
    vol_sub_A,
    vol_sub_B,
    vol_deslocado,
    deltaH_cm,
    tankBaseArea,
    E_A,
    E_B,
    buoyancyForce,
    apparentWeight
  };
};
