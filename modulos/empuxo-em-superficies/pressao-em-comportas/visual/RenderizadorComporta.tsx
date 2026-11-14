import React from 'react';
import { Vista2D } from './Vista2D';
import { Scene3D } from '../visual-3d/Scene3D';
import { FormaComporta, PosicaoDobradica, SistemaUnidades, ModoPosicionamentoComporta } from '../dominio/tipos';
import { ResultadoSimulacaoComporta } from '../dominio/resultado';

interface RenderizadorComportaProps {
  upstreamLevel: number;
  downstreamLevel: number;
  upstreamFluidKey: string;
  downstreamFluidKey: string;
  upstreamDensity?: number;
  downstreamDensity?: number;
  gravity?: number;
  liveResults?: ResultadoSimulacaoComporta;
  hasGate: boolean;
  gateOpeningPercent?: number;
  gateShape: FormaComporta;
  gateWidth: number;
  gateHeight: number;
  gateDepthFromCrest: number;
  gateInclination: number;
  force: number;
  s_cp: number;
  hingePosition: PosicaoDobradica;
  hasTieRod: boolean;
  hasSmoothWallSupport?: boolean;
  hasSmoothFloorSupport?: boolean;
  hasVerticalWallHingeA?: boolean;
  tieRodPosRel: number;
  tieRodAngle: number;
  gateWeight?: number;
  gateWeightEnabled?: boolean;
  isAnalyzed: boolean;
  onCalculate: () => void;
  onReset: () => void;
  is3D: boolean;
  setIs3D: (v: boolean) => void;
  isFrontalView: boolean;
  setIsFrontalView: (v: boolean) => void;
  showVectors: boolean;
  setShowVectors: (v: boolean) => void;
  wallDims: { height: number; thickness: number; width: number; };
  sistemaUnidades?: SistemaUnidades;
  modoPosicionamento?: ModoPosicionamentoComporta;
  y_cg_direto?: number;
}

export const RenderizadorComporta: React.FC<RenderizadorComportaProps> = (props) => {
  return props.is3D ? <Scene3D {...props} /> : <Vista2D {...props} />;
};
