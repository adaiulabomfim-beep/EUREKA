import { RectSurfaceResult } from '../shared/damHydrostatics';

export interface DamPhysicsResult {
  FR_net: number;
  y_cp_net: number;
  s_cp_net: number;
  up: RectSurfaceResult;
  down: RectSurfaceResult;
}
