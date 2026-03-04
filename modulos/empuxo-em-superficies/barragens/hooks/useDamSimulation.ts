import { useMemo } from 'react';
import { DamSimulationConfig } from '../types';
import { calculateNetForce } from '../physics/damHydrostatics';

export const useDamSimulation = (config: DamSimulationConfig) => {
  const {
    upstreamLevel,
    downstreamLevel,
    density,
    gravity,
    damHeight,
    inclinationAngle,
  } = config;

  return useMemo(() => {
    const gamma = density * gravity;

    // Cálculo da força líquida (montante - jusante) e CP (por metro de largura)
    const forceData = calculateNetForce(
      damHeight,
      inclinationAngle,
      upstreamLevel,
      downstreamLevel,
      gamma
    );

    return { forceData };
  }, [
    upstreamLevel,
    downstreamLevel,
    density,
    gravity,
    damHeight,
    inclinationAngle,
  ]);
};
