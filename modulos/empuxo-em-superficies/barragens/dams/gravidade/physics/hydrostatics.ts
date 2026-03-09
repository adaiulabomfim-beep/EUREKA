import { calculateNetForce, calculateSurface } from '../../../core/shared/damHydrostatics';

export const calculateGravityHydrostatics = (
  damHeight: number,
  inclinationAngle: number,
  upstreamLevel: number,
  downstreamLevel: number,
  gamma: number
) => {
  const netForce = calculateNetForce(damHeight, inclinationAngle, upstreamLevel, downstreamLevel, gamma);
  const up = calculateSurface(damHeight, inclinationAngle, upstreamLevel, gamma);
  
  // Pressão máxima no pé da barragem (p_max = gamma * H)
  const p_max_up = gamma * Math.min(upstreamLevel, damHeight);
  const p_max_down = gamma * Math.min(downstreamLevel, damHeight);

  return {
    ...netForce,
    p_max_up,
    p_max_down,
  };
};
