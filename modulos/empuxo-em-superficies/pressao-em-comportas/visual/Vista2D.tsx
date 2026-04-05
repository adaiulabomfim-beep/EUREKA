import React from 'react';
import { ContainerComportas } from './ContainerComportas';
import { FormaComporta, PosicaoDobradica } from '../dominio/tipos';

interface Vista2DProps {
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

export const Vista2D: React.FC<Vista2DProps> = (props) => {
  const SVG_W = 800;
  const SVG_H = 600;
  
  // Dynamic scaling based on the maximum height (upstream level)
  const maxH = Math.max(props.upstreamLevel, props.downstreamLevel, props.gateHeight) || 10;
  const SCALE = Math.min(SVG_H * 0.7 / maxH, 40); // Clamp scale to avoid extreme sizes
  
  const ORIGIN_X = SVG_W / 2;
  const ORIGIN_Y = SVG_H * 0.8; // Surface reference at y=0 (top of water)

  const wallBaseWidth = 5 * SCALE;
  const wallInclination = 90;
  const wallHeight = maxH * 1.2 * SCALE;
  const wallInclinationRad = (wallInclination * Math.PI) / 180;
  const dxTop = 0;

  const getWallX = (y: number) => {
    return ORIGIN_X;
  };

  const renderedFaces: any[] = [
    {
      id: 'floor',
      kind: 'DAM',
      pts: [
        { x: ORIGIN_X - 30 * SCALE, y: ORIGIN_Y },
        { x: ORIGIN_X + wallBaseWidth + 30 * SCALE, y: ORIGIN_Y },
        { x: ORIGIN_X + wallBaseWidth + 30 * SCALE, y: ORIGIN_Y + 5 * SCALE },
        { x: ORIGIN_X - 30 * SCALE, y: ORIGIN_Y + 5 * SCALE },
      ],
      fill: '#e5e7eb',
      stroke: '#d1d5db',
      strokeWidth: 1,
      opacity: 1,
    },
    {
      id: 'wall',
      kind: 'DAM',
      pts: [
        { x: ORIGIN_X, y: ORIGIN_Y },
        { x: ORIGIN_X + wallBaseWidth, y: ORIGIN_Y },
        { x: ORIGIN_X + wallBaseWidth, y: ORIGIN_Y - wallHeight },
        { x: ORIGIN_X + dxTop, y: ORIGIN_Y - wallHeight },
      ],
      fill: 'url(#concretePattern)',
      stroke: '#525252',
      strokeWidth: 1,
      opacity: 1,
    },
    {
      id: 'water-up',
      kind: 'WATER',
      pts: [
        { x: ORIGIN_X - 30 * SCALE, y: ORIGIN_Y },
        { x: ORIGIN_X, y: ORIGIN_Y },
        { x: getWallX(ORIGIN_Y - props.upstreamLevel * SCALE), y: ORIGIN_Y - props.upstreamLevel * SCALE },
        { x: ORIGIN_X - 30 * SCALE, y: ORIGIN_Y - props.upstreamLevel * SCALE },
      ],
      fill: 'url(#fluidDepthA)',
      stroke: 'none',
      strokeWidth: 0,
      opacity: 0.8,
    }
  ];


  if (props.downstreamLevel > 0) {
    renderedFaces.push({
      id: 'water-down',
      kind: 'WATER',
      pts: [
        { x: ORIGIN_X + wallBaseWidth, y: ORIGIN_Y },
        { x: ORIGIN_X + wallBaseWidth + 30 * SCALE, y: ORIGIN_Y },
        { x: ORIGIN_X + wallBaseWidth + 30 * SCALE, y: ORIGIN_Y - props.downstreamLevel * SCALE },
        { x: ORIGIN_X + wallBaseWidth, y: ORIGIN_Y - props.downstreamLevel * SCALE }, 
      ],
      fill: 'url(#fluidDepthB)',
      stroke: 'none',
      strokeWidth: 0,
      opacity: 0.8,
    });
  }

  const vectors: any[] = [];
  const overlayElements: React.ReactNode[] = [];

  if (props.hasGate) {
    const gateWidth = props.gateWidth * SCALE;
    const gateHeight = props.gateHeight * SCALE;
    // Surface is at ORIGIN_Y - (upstreamLevel * SCALE)
    const gateTopY = ORIGIN_Y - (props.upstreamLevel - props.gateDepthFromCrest) * SCALE;
    const gateTopX = getWallX(gateTopY);
    const gateAngleRad = (props.gateInclination * Math.PI) / 180;
    
    const gateBottomX = gateTopX + Math.cos(gateAngleRad) * gateHeight;
    const gateBottomY = gateTopY + Math.sin(gateAngleRad) * gateHeight;


    renderedFaces.push({
      id: 'gate',
      pts: [
        { x: gateTopX, y: gateTopY },
        { x: gateBottomX, y: gateBottomY },
        { x: gateBottomX - Math.sin(gateAngleRad) * 5, y: gateBottomY - Math.cos(gateAngleRad) * 5 },
        { x: gateTopX - Math.sin(gateAngleRad) * 5, y: gateTopY - Math.cos(gateAngleRad) * 5 },
      ],
      fill: 'url(#metalLinear)',
      stroke: '#1e293b',
      strokeWidth: 1,
      opacity: 1,
    });

    const flowPath = (
      <line
        key="flow-path"
        x1={gateTopX + gateWidth / 2}
        y1={gateTopY + gateHeight / 2}
        x2={gateTopX + gateWidth / 2 + 100}
        y2={gateTopY + gateHeight / 2 + 50}
        stroke="#64748b"
        strokeWidth="2"
        strokeDasharray="4 2"
      />
    );
    overlayElements.push(flowPath);

    if (props.hingePosition !== PosicaoDobradica.NONE) {
      const hx = props.hingePosition === PosicaoDobradica.TOP ? gateTopX : gateBottomX;
      const hy = props.hingePosition === PosicaoDobradica.TOP ? gateTopY : gateBottomY;
      
      overlayElements.push(
        <circle key="hinge" cx={hx} cy={hy} r={6} fill="#f59e0b" stroke="#b45309" strokeWidth={2} />
      );
    }

    if (props.hasTieRod) {
      const tx = gateTopX + Math.cos(gateAngleRad) * gateHeight * props.tieRodPosRel;
      const ty = gateTopY + Math.sin(gateAngleRad) * gateHeight * props.tieRodPosRel;
      
      const tieRad = (props.tieRodAngle * Math.PI) / 180;
      const tieLen = 80;
      const endX = tx + Math.cos(tieRad) * tieLen;
      const endY = ty - Math.sin(tieRad) * tieLen;
      
      overlayElements.push(
        <g key="tierod">
          <line x1={tx} y1={ty} x2={endX} y2={endY} stroke="#64748b" strokeWidth={3} strokeDasharray="4 2" />
          <rect x={endX - 4} y={endY - 4} width={8} height={8} fill="#475569" />
        </g>
      );
    }

    if (props.isAnalyzed && props.showVectors) {
      const numVectors = 5;
      const gamma = 9810; // N/m³
      
      for (let i = 0; i <= numVectors; i++) {
          const t = i / numVectors;
          const s = t * gateHeight;
          const y = gateTopY + Math.sin(gateAngleRad) * s;
          const x = gateTopX + Math.cos(gateAngleRad) * s;
          
          const depth = (ORIGIN_Y - y) / SCALE;
          if (depth > 0) {
              const pressure = gamma * depth;
              const vectorLength = (pressure / (gamma * props.upstreamLevel)) * 60; // Scale vector length
              
              const nx = -Math.sin(gateAngleRad);
              const ny = Math.cos(gateAngleRad);
              
              vectors.push({
                start: { x: x + nx * vectorLength, y: y + ny * vectorLength },
                end: { x: x, y: y },
                color: '#ef4444',
                strokeWidth: 2,
                opacity: 0.7,
                isResultant: false
              });
          }
      }

      const cpY = gateTopY + Math.sin(gateAngleRad) * props.s_cp * SCALE;
      const cpX = gateTopX + Math.cos(gateAngleRad) * props.s_cp * SCALE;
      
      const nx = Math.sin(gateAngleRad);
      const ny = -Math.cos(gateAngleRad);
      
      vectors.push({
        start: { x: cpX - nx * 80, y: cpY - ny * 80 },
        end: { x: cpX, y: cpY },
        color: '#ef4444',
        strokeWidth: 3,
        opacity: 1,
        isResultant: true,
        val: `${(props.force / 1000).toFixed(1)} kN`
      });
    }
  }

  const waterLevels = [
    { y: ORIGIN_Y - props.upstreamLevel * SCALE, label: `Montante: ${props.upstreamLevel}m`, x: ORIGIN_X - 10 * SCALE }
  ];
  if (props.downstreamLevel > 0) {
    waterLevels.push({ y: ORIGIN_Y - props.downstreamLevel * SCALE, label: `Jusante: ${props.downstreamLevel}m`, x: ORIGIN_X + wallBaseWidth + 10 * SCALE });
  }


  return (
    <div className="relative w-full h-full">
      <ContainerComportas
        is3D={props.is3D}
        setIs3D={props.setIs3D}
        showVectors={props.showVectors}
        setShowVectors={props.setShowVectors}
        isAnalyzed={props.isAnalyzed}
        onCalculate={props.onCalculate}
        onReset={props.onReset}
        resetView={() => {}}
        handlers={{}}
        renderedFaces={renderedFaces}
        vectors={vectors}
        SVG_W={SVG_W}
        SVG_H={SVG_H}
        ORIGIN_X={ORIGIN_X}
        ORIGIN_Y={ORIGIN_Y}
      />
      
      <div className="absolute inset-0 pointer-events-none">
        <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="xMidYMid meet">
          {waterLevels.map((wl, i) => (
            <g key={i}>
              <line x1={wl.x - 20} y1={wl.y} x2={wl.x + 20} y2={wl.y} stroke="#64748b" strokeWidth="1" strokeDasharray="4 2" />
              <polygon points={`${wl.x},${wl.y} ${wl.x-5},${wl.y-8} ${wl.x+5},${wl.y-8}`} fill="#64748b" />
              <text x={wl.x} y={wl.y - 12} textAnchor="middle" fill="#1e40af" fontSize="12" fontWeight="bold" className="drop-shadow-sm">
                {wl.label}
              </text>
            </g>
          ))}
          {overlayElements}
        </svg>
      </div>
    </div>
  );
};
