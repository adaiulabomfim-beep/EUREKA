import { useMemo } from 'react';
import { DamSimulationConfig } from '../core/interfaces/DamSimulationConfig';
import { calculateNetForce } from '../core/shared/damHydrostatics';

export const useDamSimulation = (config: DamSimulationConfig) => {
  // We avoid conditionally calling hooks by moving the useMemo here
  // and calling the simulation logic inside it.
  // Currently, all dam types use the same simulation logic, but if they
  // diverge in the future, we can call specific functions (not hooks) here.
  const { upstreamLevel, downstreamLevel, density, gravity, damHeight, inclinationAngle } = config;

  return useMemo(() => {
    // If we want to use specific simulation logic per dam type in the future,
    // we would call a regular function from the registry here, e.g.:
    // return damTypeRegistry[config.damType].simulate(config);
    
    const gamma = density * gravity;
    const forceData = calculateNetForce(damHeight, inclinationAngle, upstreamLevel, downstreamLevel, gamma);
    return { forceData };
  }, [upstreamLevel, downstreamLevel, density, gravity, damHeight, inclinationAngle, config.damType]);
};
