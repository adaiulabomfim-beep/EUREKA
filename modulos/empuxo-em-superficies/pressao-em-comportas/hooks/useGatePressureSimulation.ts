import { useMemo } from 'react';
import { SimulationConfig } from '../types';
import { calculateNetForce } from '../physics/planeSurface';
import { calculateEquilibrium } from '../physics/moments';

export const useGatePressureSimulation = (config: SimulationConfig) => {
  const {
    upstreamLevel,
    downstreamLevel,
    density,
    gravity,

    gateLength,
    gateWidth,
    gateDepthFromCrest,
    gateInclination,

    damHeight,
    hingePosition,
    hasTieRod,
    tieRodPosRel,
    tieRodAngle,

    gateWeight,
    gateWeightEnabled,
  } = config;

  return useMemo(() => {
    const gamma = density * gravity;

    // Altura (coordenada Y) do topo da comporta medida a partir do fundo:
    // topo = H - d_crista
    const y_top_gate = damHeight - gateDepthFromCrest;

    // Profundidade vertical do topo da comporta abaixo do nível livre:
    // h_top = h_agua - y_top_gate
    // Se negativo => topo acima do nível livre (sem submersão no topo)
    const h_top_up = upstreamLevel - y_top_gate;
    const h_top_down = downstreamLevel - y_top_gate;

    // Cálculo da força líquida (montante - jusante) e CP ao longo da comporta
    const forceData = calculateNetForce(
      gateLength,
      gateWidth,
      gateInclination,
      h_top_up,
      h_top_down,
      gamma,
      config.gateShape
    );

    // Equilíbrio (dobradiça, tirante e peso próprio)
    const equilibrium = calculateEquilibrium(
      forceData.FR_net,
      forceData.s_cp_net,
      gateLength,
      hingePosition,
      hasTieRod,
      tieRodPosRel,
      tieRodAngle,
      gateInclination,
      gateWeight,
      gateWeightEnabled
    );

    return { forceData, equilibrium };
  }, [
    upstreamLevel,
    downstreamLevel,
    density,
    gravity,
    gateLength,
    gateWidth,
    gateDepthFromCrest,
    gateInclination,
    config.gateShape,
    damHeight,
    hingePosition,
    hasTieRod,
    tieRodPosRel,
    tieRodAngle,
    gateWeight,
    gateWeightEnabled,
  ]);
};