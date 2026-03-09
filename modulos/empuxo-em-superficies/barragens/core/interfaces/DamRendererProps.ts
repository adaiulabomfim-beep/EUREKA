import { DamType } from '../types/DamType';
import { RectSurfaceResult } from '../shared/damHydrostatics';

export interface DamRendererProps {
  damType: DamType;
  damHeight: number;
  damBaseWidth: number;
  damCrestWidth: number;
  inclinationAngle: number;
  upstreamLevel: number;
  downstreamLevel?: number;
  force: number;
  s_cp: number;
  y_cp: number;
  up?: RectSurfaceResult;
  down?: RectSurfaceResult;
  isAnalyzed: boolean;
  onCalculate: () => void;
  onReset: () => void;
}

export interface DamViewProps {
  damHeight: number;
  damBaseWidth: number;
  damCrestWidth: number;
  inclinationAngle: number;
  upstreamLevel: number;
  downstreamLevel: number;
  forceData?: any;
  project?: (p: { x: number; y: number; z: number }) => { x: number; y: number; zDepth: number };
  face: (pts3: any[], fill: string, opacity: number, stroke?: string, strokeWidth?: number, normal?: any, kind?: "DAM" | "WATER", hatchPattern?: string, priority?: number) => any;
  prism: (profile: any[], zWidth: number, fill: string, opacity: number, stroke?: string, strokeWidth?: number, kind?: "DAM" | "WATER", xOffsetFn?: (z: number) => number, zOffset?: number, hatchPattern?: string, toWorldX?: (x: number) => number, priority?: number) => any[];
  waterBox3D: (waterLevelY: number, depth: number, farX: number, damFaceSide: "UPSTREAM" | "DOWNSTREAM", getDamXAtY: (y: number, side: "UPSTREAM" | "DOWNSTREAM") => number, toWorldX: (x: number) => number, offsetFn?: (z: number) => number, fillId?: "A" | "B") => any[];
  toWorldX: (x: number) => number;
  CHANNEL_WIDTH: number;
  archOffsetFn?: (z: number) => number;
}
