import React, { useState } from 'react';
import { FormaComporta, PosicaoDobradica, TipoBarragem } from '../dominio/tipos';
import { SceneContainer } from '../../barragens/visual/ContainerCena';

interface CenaProps {
  damType: TipoBarragem;
  damHeight: number;
  damBaseWidth: number;
  damCrestWidth: number;
  inclinationAngle: number;
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
  gateWeight: number;
  gateWeightEnabled: boolean;
  isAnalyzed: boolean;
  onCalculate: () => void;
  onReset: () => void;
}

export const CenaPressaoComporta: React.FC<CenaProps> = (props) => {
  const [is3D, setIs3D] = useState(false);
  const [showVectors, setShowVectors] = useState(true);

  const SVG_W = 800;
  const SVG_H = 600;
  const ORIGIN_X = 400;
  const ORIGIN_Y = 500;
  const SCALE = 20;

  // Calculate dam face points
  const damLeftBaseX = ORIGIN_X - props.damBaseWidth * SCALE / 2;
  const damRightBaseX = ORIGIN_X + props.damBaseWidth * SCALE / 2;
  
  // Calculate crest points based on inclination
  const rad = (props.inclinationAngle * Math.PI) / 180;
  const dx = (props.damHeight * SCALE) / Math.tan(rad);
  
  const damLeftCrestX = damLeftBaseX + dx;
  const damRightCrestX = damLeftCrestX + props.damCrestWidth * SCALE;
  const damCrestY = ORIGIN_Y - props.damHeight * SCALE;

  // Mock faces for now to get visual parity with the container
  const renderedFaces: any[] = [
    {
      id: 'dam',
      pts: [
        { x: damLeftBaseX, y: ORIGIN_Y },
        { x: damRightBaseX, y: ORIGIN_Y },
        { x: damRightCrestX, y: damCrestY },
        { x: damLeftCrestX, y: damCrestY },
      ],
      fill: '#94a3b8',
      stroke: '#475569',
      strokeWidth: 2,
      opacity: 1,
    },
    {
      id: 'water-up',
      kind: 'WATER',
      pts: [
        { x: ORIGIN_X - 300, y: ORIGIN_Y },
        { x: damLeftBaseX, y: ORIGIN_Y },
        { x: damLeftBaseX + (props.upstreamLevel * SCALE) / Math.tan(rad), y: ORIGIN_Y - props.upstreamLevel * SCALE },
        { x: ORIGIN_X - 300, y: ORIGIN_Y - props.upstreamLevel * SCALE },
      ],
      fill: '#bfdbfe',
      stroke: 'none',
      strokeWidth: 0,
      opacity: 0.6,
    }
  ];

  if (props.downstreamLevel > 0) {
    renderedFaces.push({
      id: 'water-down',
      kind: 'WATER',
      pts: [
        { x: damRightBaseX, y: ORIGIN_Y },
        { x: ORIGIN_X + 300, y: ORIGIN_Y },
        { x: ORIGIN_X + 300, y: ORIGIN_Y - props.downstreamLevel * SCALE },
        { x: damRightBaseX, y: ORIGIN_Y - props.downstreamLevel * SCALE }, // Simplified vertical back face for now
      ],
      fill: '#bfdbfe',
      stroke: 'none',
      strokeWidth: 0,
      opacity: 0.6,
    });
  }

  if (props.hasGate) {
    const gateTopY = damCrestY + props.gateDepthFromCrest * SCALE;
    const gateTopX = damLeftCrestX - (props.gateDepthFromCrest * SCALE) / Math.tan(rad);
    
    const gateBottomY = gateTopY + props.gateHeight * SCALE;
    const gateBottomX = gateTopX - (props.gateHeight * SCALE) / Math.tan(rad);

    renderedFaces.push({
      id: 'gate',
      pts: [
        { x: gateTopX, y: gateTopY },
        { x: gateTopX - 4, y: gateTopY }, // Thickness
        { x: gateBottomX - 4, y: gateBottomY },
        { x: gateBottomX, y: gateBottomY },
      ],
      fill: '#1e293b',
      stroke: '#0f172a',
      strokeWidth: 1,
      opacity: 1,
    });
  }

  const vectors: any[] = [];
  const overlayElements: React.ReactNode[] = [];

  if (props.hasGate) {
    const gateTopY = damCrestY + props.gateDepthFromCrest * SCALE;
    const gateTopX = damLeftCrestX - (props.gateDepthFromCrest * SCALE) / Math.tan(rad);
    
    const gateBottomY = gateTopY + props.gateHeight * SCALE;
    const gateBottomX = gateTopX - (props.gateHeight * SCALE) / Math.tan(rad);

    // Hinge Visual
    if (props.hingePosition !== PosicaoDobradica.NONE) {
      const hx = props.hingePosition === PosicaoDobradica.TOP ? gateTopX : gateBottomX;
      const hy = props.hingePosition === PosicaoDobradica.TOP ? gateTopY : gateBottomY;
      
      overlayElements.push(
        <circle key="hinge" cx={hx} cy={hy} r={6} fill="#f59e0b" stroke="#b45309" strokeWidth={2} />
      );
    }

    // Tie Rod Visual
    if (props.hasTieRod) {
      const tx = gateTopX + (gateBottomX - gateTopX) * props.tieRodPosRel;
      const ty = gateTopY + (gateBottomY - gateTopY) * props.tieRodPosRel;
      
      const tieRad = (props.tieRodAngle * Math.PI) / 180;
      const tieLen = 80;
      const endX = tx + Math.cos(tieRad) * tieLen;
      const endY = ty - Math.sin(tieRad) * tieLen;

      overlayElements.push(
        <g key="tierod">
          <line x1={tx} y1={ty} x2={endX} y2={endY} stroke="#64748b" strokeWidth={3} strokeDasharray="5 5" />
          <rect x={endX - 4} y={endY - 4} width={8} height={8} fill="#475569" />
        </g>
      );
    }

    if (props.isAnalyzed && showVectors) {
      const cpY = damCrestY + props.s_cp * SCALE;
      const cpX = damLeftCrestX - (props.s_cp * SCALE) / Math.tan(rad);
      
      // Vector perpendicular to the face
      const nx = Math.sin(rad);
      const ny = Math.cos(rad);
      
      vectors.push({
        start: { x: cpX - nx * 60, y: cpY + ny * 60 },
        end: { x: cpX, y: cpY },
        color: '#ef4444',
        strokeWidth: 3,
        opacity: 1,
        isResultant: true,
        val: `${(props.force / 1000).toFixed(1)} kN`
      });
    }
  }

  // Add water level indicators
  const waterLevels = [
    { y: ORIGIN_Y - props.upstreamLevel * SCALE, label: `Montante: ${props.upstreamLevel}m`, x: ORIGIN_X - 280 }
  ];
  if (props.downstreamLevel > 0) {
    waterLevels.push({ y: ORIGIN_Y - props.downstreamLevel * SCALE, label: `Jusante: ${props.downstreamLevel}m`, x: ORIGIN_X + 280 });
  }

  return (
    <div className="relative w-full h-full">
      <SceneContainer
        is3D={is3D}
        setIs3D={setIs3D}
        showVectors={showVectors}
        setShowVectors={setShowVectors}
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
      
      {/* Water Level Labels Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="xMidYMid meet">
          {waterLevels.map((wl, i) => (
            <g key={i}>
              <line x1={wl.x - 20} y1={wl.y} x2={wl.x + 20} y2={wl.y} stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 2" />
              <polygon points={`${wl.x},${wl.y} ${wl.x-5},${wl.y-8} ${wl.x+5},${wl.y-8}`} fill="#3b82f6" />
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
