export enum DamType {
  GRAVITY = 'GRAVITY',
  EMBANKMENT = 'EMBANKMENT',
  ARCH = 'ARCH',
  BUTTRESS = 'BUTTRESS'
}

export enum GateShape {
  RECTANGULAR = 'RECTANGULAR',
  CIRCULAR = 'CIRCULAR',
  SEMI_CIRCULAR = 'SEMI_CIRCULAR',
  TRAPEZOIDAL = 'TRAPEZOIDAL'
}

export enum HingePosition {
  TOP = 'TOP',
  BOTTOM = 'BOTTOM',
  NONE = 'NONE'
}

export interface SimulationConfig {
  damType: DamType;
  damHeight: number;
  damBaseWidth: number;
  damCrestWidth: number;
  inclinationAngle: number;
  
  upstreamLevel: number;
  downstreamLevel: number;
  density: number;
  gravity: number;
  
  hasGate: boolean;
  gateShape: GateShape;
  gateWidth: number;
  gateLength: number;
  gateDepthFromCrest: number;
  gateInclination: number;
  
  gateWeight: number; // Force in N
  gateWeightEnabled: boolean;
  
  hingePosition: HingePosition;
  hasTieRod: boolean;
  tieRodPosRel: number;
  tieRodAngle: number;
}
