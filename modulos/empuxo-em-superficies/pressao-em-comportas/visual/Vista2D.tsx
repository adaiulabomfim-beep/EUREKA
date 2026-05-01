import React from 'react';
import { ContainerComportas } from './ContainerComportas';
import { FormaComporta, PosicaoDobradica } from '../dominio/tipos';

interface Vista2DProps {
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
}

export const Vista2D: React.FC<Vista2DProps> = (props) => {
  const SVG_W = 900;
  const SVG_H = 520;
  
  // Dynamic scaling based on the maximum height
  const maxH = Math.max(props.upstreamLevel, props.downstreamLevel, 1);
  const wallHeightMeters = Math.max(maxH * 1.2, 5);
  
  // Calculate scale matching motorCena3D.ts behavior (factor 0.6 for 2D)
  const SCALE = Math.min((SVG_H * 0.6) / wallHeightMeters, 150);

  const wallBaseWidthMeters = 5;
  const wallBaseWidth = wallBaseWidthMeters * SCALE;
  const wallHeight = wallHeightMeters * SCALE;
  
  // Origin aligning the structure to the center
  const ORIGIN_X = SVG_W * 0.5 - wallBaseWidth / 2; // Center the wall precisely
  const ORIGIN_Y = SVG_H * 0.82; 
  
  const wallInclination = 90;
  const wallInclinationRad = (wallInclination * Math.PI) / 180;
  const dxTop = 0;

  const getWallX = (y: number) => {
    return ORIGIN_X;
  };

  const gateWidth = props.gateWidth * SCALE;
  const gateHeight = props.gateHeight * SCALE;
  const gateTopY = ORIGIN_Y - (props.upstreamLevel - props.gateDepthFromCrest) * SCALE;
  const gateTopX = getWallX(gateTopY);
  const gateAngleRad = (props.gateInclination * Math.PI) / 180;
  const gateBottomX = gateTopX + Math.cos(gateAngleRad) * gateHeight;
  const gateBottomY = gateTopY + Math.sin(gateAngleRad) * gateHeight;

  // The wall is rendered as a single block in 2D to show the structure surrounding the hole.
  // Dashed lines indicate the top and bottom of the opening.
  const wallBlock = {
    id: 'wall-solid',
    kind: 'DAM',
    pts: [
      { x: ORIGIN_X, y: ORIGIN_Y },
      { x: ORIGIN_X + wallBaseWidth, y: ORIGIN_Y },
      { x: ORIGIN_X + wallBaseWidth, y: ORIGIN_Y - wallHeight },
      { x: ORIGIN_X + dxTop, y: ORIGIN_Y - wallHeight },
    ],
    fill: 'url(#concretePattern)',
    stroke: '#6b7280',
    strokeWidth: 1.2,
    opacity: 1,
  };

  const holeTopLine = {
    id: 'hole-top-line',
    pts: [
      { x: ORIGIN_X, y: gateTopY },
      { x: ORIGIN_X + wallBaseWidth, y: gateTopY },
    ],
    stroke: '#4b5563',
    strokeWidth: 1.5,
    strokeDasharray: '6 4',
  };

  const holeBottomLine = {
    id: 'hole-bottom-line',
    pts: [
      { x: ORIGIN_X, y: gateBottomY },
      { x: ORIGIN_X + wallBaseWidth, y: gateBottomY },
    ],
    stroke: '#4b5563',
    strokeWidth: 1.5,
    strokeDasharray: '6 4',
  };

  const renderedFaces: any[] = [
    {
      id: 'earth-base',
      kind: 'DAM',
      pts: [
        { x: ORIGIN_X - 30 * SCALE, y: ORIGIN_Y },
        { x: ORIGIN_X + wallBaseWidth + 30 * SCALE, y: ORIGIN_Y },
        { x: ORIGIN_X + wallBaseWidth + 30 * SCALE, y: ORIGIN_Y + 5 * SCALE },
        { x: ORIGIN_X - 30 * SCALE, y: ORIGIN_Y + 5 * SCALE },
      ],
      fill: '#a16207',
      stroke: '#713f12',
      strokeWidth: 1.2,
      hatchPattern: 'url(#earthPattern)',
      opacity: 1,
    },
    wallBlock,
    holeTopLine,
    holeBottomLine,
    {
      id: 'water-up',
      kind: 'WATER_UP',
      pts: [
        { x: ORIGIN_X - 30 * SCALE, y: ORIGIN_Y },
        { x: ORIGIN_X, y: ORIGIN_Y },
        { x: getWallX(ORIGIN_Y - props.upstreamLevel * SCALE), y: ORIGIN_Y - props.upstreamLevel * SCALE },
        { x: ORIGIN_X - 30 * SCALE, y: ORIGIN_Y - props.upstreamLevel * SCALE },
      ],
      fill: 'url(#fluidDepthA)',
      stroke: 'none',
      strokeWidth: 0,
      opacity: 1,
    }
  ];


  if (props.downstreamLevel > 0) {
    renderedFaces.push({
      id: 'water-down',
      kind: 'WATER_DOWN',
      pts: [
        { x: ORIGIN_X + wallBaseWidth, y: ORIGIN_Y },
        { x: ORIGIN_X + wallBaseWidth + 30 * SCALE, y: ORIGIN_Y },
        { x: ORIGIN_X + wallBaseWidth + 30 * SCALE, y: ORIGIN_Y - props.downstreamLevel * SCALE },
        { x: ORIGIN_X + wallBaseWidth, y: ORIGIN_Y - props.downstreamLevel * SCALE }, 
      ],
      fill: 'url(#fluidDepthB)',
      stroke: 'none',
      strokeWidth: 0,
      opacity: 1,
    });
  }

  const vectors: any[] = [];
  const overlayElements: React.ReactNode[] = [];

  // Ripple Waves Overlay (Same as Barragens)
  if (props.upstreamLevel > 0) {
    const xLeft = ORIGIN_X - 30 * SCALE;
    const xRight = ORIGIN_X;
    const yTop = ORIGIN_Y - props.upstreamLevel * SCALE;
    const rippleHeight = Math.min(30, props.upstreamLevel * SCALE);
    
    overlayElements.push(
      <g key="ripple-up">
        <rect
          x={xLeft}
          y={yTop}
          width={xRight - xLeft}
          height={rippleHeight}
          fill="url(#ripplePattern)"
          pointerEvents="none"
        />
        <line
          x1={xLeft}
          y1={yTop}
          x2={xRight}
          y2={yTop}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5"
          pointerEvents="none"
        />
      </g>
    );
  }

  if (props.downstreamLevel > 0) {
    const xLeft = ORIGIN_X + wallBaseWidth;
    const xRight = ORIGIN_X + wallBaseWidth + 30 * SCALE;
    const yTop = ORIGIN_Y - props.downstreamLevel * SCALE;
    const rippleHeight = Math.min(30, props.downstreamLevel * SCALE);
    
    overlayElements.push(
      <g key="ripple-down">
        <rect
          x={xLeft}
          y={yTop}
          width={xRight - xLeft}
          height={rippleHeight}
          fill="url(#ripplePattern)"
          pointerEvents="none"
        />
        <line
          x1={xLeft}
          y1={yTop}
          x2={xRight}
          y2={yTop}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5"
          pointerEvents="none"
        />
      </g>
    );
  }

  if (props.hasGate) {
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
  } else {
    // Rendereiza comporta levantada
    const liftY = gateHeight * 1.1;
    renderedFaces.push({
      id: 'gate-open',
      pts: [
        { x: gateTopX, y: gateTopY - liftY },
        { x: gateBottomX, y: gateBottomY - liftY },
        { x: gateBottomX - Math.sin(gateAngleRad) * 5, y: gateBottomY - Math.cos(gateAngleRad) * 5 - liftY },
        { x: gateTopX - Math.sin(gateAngleRad) * 5, y: gateTopY - Math.cos(gateAngleRad) * 5 - liftY },
      ],
      fill: 'url(#metalLinear)',
      stroke: '#1e293b',
      strokeWidth: 1,
      opacity: 1,
    });

    // Renderiza fluxo de água passando
    const waterTop = Math.min(ORIGIN_Y - props.upstreamLevel * SCALE, gateTopY);
    if (ORIGIN_Y - props.upstreamLevel * SCALE < ORIGIN_Y) {
      if (waterTop < ORIGIN_Y) {
        renderedFaces.push({
          id: 'water-flow',
          kind: 'WATER',
          pts: [
            { x: ORIGIN_X, y: waterTop },
            { x: ORIGIN_X + wallBaseWidth, y: waterTop },
            { x: ORIGIN_X + wallBaseWidth, y: ORIGIN_Y },
            { x: ORIGIN_X, y: ORIGIN_Y },
          ],
          fill: 'url(#fluidDepthA)',
          stroke: 'none',
          strokeWidth: 0,
          opacity: 1,
        });
      }
    }
  }

  const renderDimensions = () => {
    const dims: React.ReactNode[] = [];

    const drawDim = (
      key: string,
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      text: string,
      offsetPx: { x: number; y: number },
      textOffsetPx: { x: number; y: number } = { x: 0, y: 0 }
    ) => {
      const p1Off = { x: p1.x + offsetPx.x, y: p1.y + offsetPx.y };
      const p2Off = { x: p2.x + offsetPx.x, y: p2.y + offsetPx.y };

      const cx = (p1Off.x + p2Off.x) / 2 + textOffsetPx.x;
      const cy = (p1Off.y + p2Off.y) / 2 + textOffsetPx.y;

      const textW = text.length * 6.5 + 8;
      const textH = 16;

      return (
        <g key={key} stroke="#64748b" strokeWidth="1" fill="none" opacity="0.9">
          {/* Extension lines connecting object to dimension line */}
          <line x1={p1.x} y1={p1.y} x2={p1Off.x} y2={p1Off.y} strokeDasharray="2 2" opacity="0.3" />
          <line x1={p2.x} y1={p2.y} x2={p2Off.x} y2={p2Off.y} strokeDasharray="2 2" opacity="0.3" />
          
          {/* Main dimension line with arrows */}
          <line
            x1={p1Off.x}
            y1={p1Off.y}
            x2={p2Off.x}
            y2={p2Off.y}
            markerStart="url(#arrow)"
            markerEnd="url(#arrow)"
          />
          
          <rect
            x={cx - textW / 2}
            y={cy - textH / 2}
            width={textW}
            height={textH}
            fill="white"
            rx="4"
            stroke="none"
            opacity="0.9"
          />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#475569"
            fontSize="10"
            fontWeight="bold"
            stroke="none"
          >
            {text}
          </text>
        </g>
      );
    };

    // Altura da Parede (Structure Height)
    dims.push(
      drawDim(
        'wallHeight',
        { x: ORIGIN_X + wallBaseWidth, y: ORIGIN_Y },
        { x: ORIGIN_X + wallBaseWidth, y: ORIGIN_Y - wallHeight },
        `${(wallHeight / SCALE).toFixed(1)}m`,
        { x: 40, y: 0 },
        { x: 0, y: 0 }
      )
    );

    // Base da Parede (Structure Base)
    dims.push(
      drawDim(
        'wallBase',
        { x: ORIGIN_X, y: ORIGIN_Y },
        { x: ORIGIN_X + wallBaseWidth, y: ORIGIN_Y },
        `${(wallBaseWidth / SCALE).toFixed(1)}m`,
        { x: 0, y: 35 },
        { x: 0, y: 0 }
      )
    );

    // Nível de Montante (Upstream Level)
    if (props.upstreamLevel > 0) {
      const yL = ORIGIN_Y - props.upstreamLevel * SCALE;
      dims.push(
        drawDim(
          'upstreamDim',
          { x: ORIGIN_X - 10, y: ORIGIN_Y },
          { x: ORIGIN_X - 10, y: yL },
          `NA=${props.upstreamLevel.toFixed(1)}m`,
          { x: -50, y: 0 },
          { x: -5, y: 0 }
        )
      );
    }

    // Nível de Jusante (Downstream Level)
    if (props.downstreamLevel > 0) {
      const yL = ORIGIN_Y - props.downstreamLevel * SCALE;
      dims.push(
        drawDim(
          'downstreamDim',
          { x: ORIGIN_X + wallBaseWidth + 10, y: ORIGIN_Y },
          { x: ORIGIN_X + wallBaseWidth + 10, y: yL },
          `NA=${props.downstreamLevel.toFixed(1)}m`,
          { x: 50, y: 0 },
          { x: 5, y: 0 }
        )
      );
    }

    // Yp (Center of Pressure) - se analisado
    if (props.isAnalyzed && props.s_cp > 0) {
       const yCp = ORIGIN_Y - (props.upstreamLevel - props.gateDepthFromCrest + props.s_cp) * SCALE; 
       dims.push(
        drawDim(
          'ypDim',
          { x: ORIGIN_X - 10, y: ORIGIN_Y },
          { x: ORIGIN_X - 10, y: yCp },
          `Yp=${(props.upstreamLevel - (ORIGIN_Y-yCp)/SCALE).toFixed(2)}m`,
          { x: -100, y: 0 },
          { x: -5, y: 0 }
        )
      );
    }

    return dims;
  };

  const waterLevels: any[] = [];


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
        upstreamFluidKey={props.upstreamFluidKey}
        downstreamFluidKey={props.downstreamFluidKey}
      />
      
      <div className="absolute inset-0 pointer-events-none">
        <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="xMidYMid meet">
          {renderDimensions()}
          {overlayElements}
        </svg>
      </div>
    </div>
  );
};
