import React, { useState } from 'react';
import { FormaComporta, PosicaoDobradica, SistemaUnidades, ModoPosicionamentoComporta } from '../dominio/tipos';
import { ResultadoSimulacaoComporta } from '../dominio/resultado';
import { RenderizadorComporta } from './RenderizadorComporta';

interface CenaProps {
  upstreamLevel: number;
  downstreamLevel: number;
  upstreamFluidKey: string;
  downstreamFluidKey: string;
  upstreamDensity?: number;
  downstreamDensity?: number;
  gravity?: number;
  liveResults?: ResultadoSimulacaoComporta;
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
  gateWeight: number;
  gateWeightEnabled: boolean;
  isAnalyzed: boolean;
  onCalculate: () => void;
  onReset: () => void;
  wallDims: { height: number; thickness: number; width: number };
  sistemaUnidades?: SistemaUnidades;
  modoPosicionamento?: ModoPosicionamentoComporta;
  y_cg_direto?: number;
}

export const CenaPressaoComporta: React.FC<CenaProps> = (props) => {
  const [is3D, setIs3D] = useState(false);
  const [showVectors, setShowVectors] = useState(true);

  const handleCalculate = () => {
    setShowVectors(true);
    props.onCalculate();
  };

  return (
    <RenderizadorComporta
      {...props}
      onCalculate={handleCalculate}
      is3D={is3D}
      setIs3D={setIs3D}
      showVectors={showVectors}
      setShowVectors={setShowVectors}
    />
  );
};
