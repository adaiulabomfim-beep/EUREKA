import { DamSimulationConfig, DamType } from './types';

export const DAM_PRESETS: Record<string, DamSimulationConfig> = {
  default: {
    damType: DamType.GRAVITY,
    damHeight: 15,
    damBaseWidth: 12,
    damCrestWidth: 4,
    inclinationAngle: 90,
    upstreamLevel: 12,
    downstreamLevel: 0,
    density: 1000,
    gravity: 9.81,
  },
  exercise30: {
    damType: DamType.EMBANKMENT,
    damHeight: 10,
    damBaseWidth: 20,
    damCrestWidth: 4,
    inclinationAngle: 30,
    upstreamLevel: 8,
    downstreamLevel: 0,
    density: 1000,
    gravity: 9.81,
  }
};
