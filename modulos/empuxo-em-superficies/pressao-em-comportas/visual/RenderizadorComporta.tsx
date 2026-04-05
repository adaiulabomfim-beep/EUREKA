import React from 'react';
import { Vista2D } from './Vista2D';
import { Vista3D } from './Vista3D';
import { FormaComporta, PosicaoDobradica } from '../dominio/tipos';

interface RenderizadorComportaProps {
  upstreamLevel: number;
  downstreamLevel: number;
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
}

export const RenderizadorComporta: React.FC<RenderizadorComportaProps> = (props) => {
  return props.is3D ? <Vista3D {...props} /> : <Vista2D {...props} />;
};
