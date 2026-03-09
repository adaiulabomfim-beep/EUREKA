import { useMemo } from 'react';
import { DamSimulationConfig } from '../core/interfaces/DamSimulationConfig';
import { calculateGravityHydrostatics } from '../dams/gravidade/physics/hydrostatics';
import { calculateGravityStability } from '../dams/gravidade/physics/stability';
import { calculateNetForce } from '../core/shared/damHydrostatics';

export const useDamSimulation = (config: DamSimulationConfig) => {
  const { upstreamLevel, downstreamLevel, density, gravity, damHeight, inclinationAngle, damBaseWidth, damCrestWidth } = config;

  return useMemo(() => {
    const gamma = density * gravity;
    
    if (config.damType === 'GRAVITY') {
        const forceData = calculateGravityHydrostatics(damHeight, inclinationAngle, upstreamLevel, downstreamLevel, gamma);
        const stabilityData = calculateGravityStability(damHeight, damBaseWidth, damCrestWidth, upstreamLevel, downstreamLevel, forceData.FR_net, forceData.y_cp_net);
        
        return { forceData, stabilityData };
    }
    
    // Fallback for other types
    const forceData = calculateNetForce(damHeight, inclinationAngle, upstreamLevel, downstreamLevel, gamma);
    return { forceData };
  }, [upstreamLevel, downstreamLevel, density, gravity, damHeight, inclinationAngle, damBaseWidth, damCrestWidth, config.damType]);
};
