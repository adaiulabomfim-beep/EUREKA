import { DamType } from '../types/DamType';

export interface DamSimulationConfig {
  damType: DamType;
  damHeight: number;
  damBaseWidth: number;
  damCrestWidth: number;
  inclinationAngle: number;
  upstreamLevel: number;
  downstreamLevel: number;
  density: number;
  gravity: number;
}
