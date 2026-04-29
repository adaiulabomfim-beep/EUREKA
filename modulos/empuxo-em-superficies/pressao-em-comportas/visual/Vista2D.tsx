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
  const SVG_W = 800;
  const SVG_H = 600;
  
  // Dynamic scaling based on the maximum height (upstream level)
  const maxH = Math.max(props.upstreamLevel, props.downstreamLevel, 1);
  const ORIGIN_X = SVG_W / 2;
  const ORIGIN_Y = SVG_H * 0.75; 
  
  // Adjusted scale to be more "afastado" (0.5 instead of 0.7)
  const SCALE = Math.min(SVG_H * 0.5 / maxH, 40); 

  const wallBaseWidth = 5 * SCALE;
  const wallInclination = 90;
  const wallHeight = maxH * 1.2 * SCALE;
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

  // The wall is now rendered as two pieces: top block and bottom block to leave a hole.
  // Assumes a vertical wall for simplicity in 2D section.
  const wallTopBlock = {
    id: 'wall-top',
    kind: 'DAM',
    pts: [
      { x: ORIGIN_X, y: gateTopY },
      { x: ORIGIN_X + wallBaseWidth, y: gateTopY },
      { x: ORIGIN_X + wallBaseWidth, y: ORIGIN_Y - wallHeight },
      { x: ORIGIN_X + dxTop, y: ORIGIN_Y - wallHeight },
    ],
    fill: 'url(#concretePattern)',
    stroke: '#6b7280',
    strokeWidth: 1.2,
    opacity: 1,
  };

  const wallBottomBlock = {
    id: 'wall-bottom',
    kind: 'DAM',
    pts: [
      { x: ORIGIN_X, y: ORIGIN_Y },
      { x: ORIGIN_X + wallBaseWidth, y: ORIGIN_Y },
      { x: ORIGIN_X + wallBaseWidth, y: gateBottomY },
      { x: ORIGIN_X, y: gateBottomY },
    ],
    fill: 'url(#concretePattern)',
    stroke: '#6b7280',
    strokeWidth: 1.2,
    opacity: 1,
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
    wallBottomBlock,
    wallTopBlock,
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

      return (
        <g key={key} stroke="#64748b" strokeWidth="1.5" fill="none" opacity="0.9">
          <line x1={p1.x} y1={p1.y} x2={p1Off.x} y2={p1Off.y} strokeDasharray="3 3" opacity="0.4" />
          <line x1={p2.x} y1={p2.y} x2={p2Off.x} y2={p2Off.y} strokeDasharray="3 3" opacity="0.4" />
          <line
            x1={p1Off.x}
            y1={p1Off.y}
            x2={p2Off.x}
            y2={p2Off.y}
            markerStart="url(#arrow)"
            markerEnd="url(#arrow)"
          />
          <text
            x={(p1Off.x + p2Off.x) / 2 + textOffsetPx.x}
            y={(p1Off.y + p2Off.y) / 2 + textOffsetPx.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#475569"
            fontSize="11"
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
        { x: 60, y: 0 },
        { x: 30, y: 0 }
      )
    );

    // Base da Parede (Structure Base)
    dims.push(
      drawDim(
        'wallBase',
        { x: ORIGIN_X, y: ORIGIN_Y },
        { x: ORIGIN_X + wallBaseWidth, y: ORIGIN_Y },
        `${(wallBaseWidth / SCALE).toFixed(1)}m`,
        { x: 0, y: 45 },
        { x: 0, y: 15 }
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
          { x: -60, y: 0 },
          { x: -40, y: 0 }
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
          { x: 120, y: 0 },
          { x: 40, y: 0 }
        )
      );
    }

    // Yp (Center of Pressure) - se analisado
    if (props.isAnalyzed && props.s_cp > 0) {
       // s_cp is distance along gate, but in 2D it's vertical for 90deg wall
       const yCp = ORIGIN_Y - (props.upstreamLevel - props.gateDepthFromCrest + props.s_cp) * SCALE; 
       // For a simple gate in a wall, this needs more logic if skewed, but for now:
       dims.push(
        drawDim(
          'ypDim',
          { x: ORIGIN_X - 10, y: ORIGIN_Y },
          { x: ORIGIN_X - 10, y: yCp },
          `Yp=${(props.upstreamLevel - (ORIGIN_Y-yCp)/SCALE).toFixed(2)}m`,
          { x: -130, y: 0 },
          { x: -45, y: 0 }
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
