import React from 'react';
import { Vista2D } from './Vista2D';
import { Scene3D } from '../visual-3d/Scene3D';
import { FormaComporta, PosicaoDobradica } from '../dominio/tipos';

interface RenderizadorComportaProps {
  upstreamLevel: number;
  downstreamLevel: number;
  upstreamFluidKey: string;
  downstreamFluidKey: string;
  hasGate: boolean;
  gateShape: FormaComporta;
  gateWidth: number;
  gateHeight: number;
  gateDepthFromCrest: number;
  gateInclination: number;
  force: number;
  s_cp: number;
  hingePosition: PosicaoDobradica;
  hasTieRod: boolean;
  tieRodPosRel: number;
  tieRodAngle: number;
  isAnalyzed: boolean;
  onCalculate: () => void;
  onReset: () => void;
  is3D: boolean;
  setIs3D: (v: boolean) => void;
  showVectors: boolean;
  setShowVectors: (v: boolean) => void;
  wallDims: { height: number; thickness: number; width: number; };
}

export const RenderizadorComporta: React.FC<RenderizadorComportaProps> = (props) => {
  return props.is3D ? <Scene3D {...props} /> : <Vista2D {...props} />;
};
