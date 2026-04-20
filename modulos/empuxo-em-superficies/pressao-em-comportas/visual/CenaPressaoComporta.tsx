import React, { useState } from 'react';
import { FormaComporta, PosicaoDobradica } from '../dominio/tipos';
import { RenderizadorComporta } from './RenderizadorComporta';

interface CenaProps {
  upstreamLevel: number;
  downstreamLevel: number;
  upstreamFluidKey: string;
  downstreamFluidKey: string;
  hasGate: boolean;
  // ... rest of the props
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
  gateWeight: number;
  gateWeightEnabled: boolean;
  isAnalyzed: boolean;
  onCalculate: () => void;
  onReset: () => void;
}

export const CenaPressaoComporta: React.FC<CenaProps> = (props) => {
  const [is3D, setIs3D] = useState(false);
  const [showVectors, setShowVectors] = useState(true);

  return (
    <RenderizadorComporta
      {...props}
      is3D={is3D}
      setIs3D={setIs3D}
      showVectors={showVectors}
      setShowVectors={setShowVectors}
    />
  );
};
