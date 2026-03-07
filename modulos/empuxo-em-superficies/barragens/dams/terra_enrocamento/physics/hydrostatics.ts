import { calculateNetForce } from '../../../../core/shared/damHydrostatics';

export const calculateEarthRockfillHydrostatics = (
  damHeight: number,
  inclinationAngle: number,
  upstreamLevel: number,
  downstreamLevel: number,
  gamma: number
) => {
  return calculateNetForce(damHeight, inclinationAngle, upstreamLevel, downstreamLevel, gamma);
};
