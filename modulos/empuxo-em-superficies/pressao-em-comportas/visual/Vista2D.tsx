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
  wallDims: { height: number; thickness: number; width: number; };
}

export const Vista2D: React.FC<Vista2DProps> = (props) => {
  const SVG_W = 900;
  const SVG_H = 520;
  
  // Use the editable wall dimensions from props
  const wallHeightMeters = props.wallDims.height;
  
  // Calculate scale matching motorCena3D.ts behavior (factor 0.6 for 2D)
  const SCALE = Math.min((SVG_H * 0.6) / wallHeightMeters, 150);

  const wallBaseWidthMeters = props.wallDims.thickness;
  const wallBaseWidth = wallBaseWidthMeters * SCALE;
  const wallHeight = wallHeightMeters * SCALE;
  
  // Origin aligning the structure to the center
  const ORIGIN_X = SVG_W * 0.5 - wallBaseWidth / 2; // Center the wall precisely
  const ORIGIN_Y = SVG_H * 0.82; 
  
  const wallInclination = props.gateInclination;
  const wallInclinationRad = (wallInclination * Math.PI) / 180;

  const getWallX = (y: number) => {
    return ORIGIN_X + (ORIGIN_Y - y) / Math.tan(wallInclinationRad);
  };

  const gateWidth = props.gateWidth * SCALE;
  const gateHeight = props.gateHeight * SCALE;
  const gateTopY = ORIGIN_Y - (props.upstreamLevel - props.gateDepthFromCrest) * SCALE;
  const gateTopX = getWallX(gateTopY);
  
  // The gate length along the slope is gateHeight
  const gateBottomY = gateTopY + Math.sin(wallInclinationRad) * props.gateHeight * SCALE;
  const gateBottomX = getWallX(gateBottomY);
  
  // Calculate normal vector for the gate (pointing right and down into the wall)
  const vx = gateBottomX - gateTopX; // negative
  const vy = gateBottomY - gateTopY; // positive
  const vLen = Math.sqrt(vx*vx + vy*vy);
  const nx = vy / vLen;
  const ny = -vx / vLen;

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
    }
  ];

  if (props.hasGate) {
    // Bottom wall part
    renderedFaces.push({
      id: 'wall-bottom',
      kind: 'DAM',
      pts: [
        { x: ORIGIN_X, y: ORIGIN_Y },
        { x: ORIGIN_X + wallBaseWidth, y: ORIGIN_Y },
        { x: gateBottomX + wallBaseWidth, y: gateBottomY },
        { x: gateBottomX, y: gateBottomY },
      ],
      fill: 'url(#concretePattern)',
      stroke: '#6b7280',
      strokeWidth: 1.2,
      opacity: 1,
    });
    // Top wall part
    renderedFaces.push({
      id: 'wall-top',
      kind: 'DAM',
      pts: [
        { x: gateTopX, y: gateTopY },
        { x: gateTopX + wallBaseWidth, y: gateTopY },
        { x: getWallX(ORIGIN_Y - wallHeight) + wallBaseWidth, y: ORIGIN_Y - wallHeight },
        { x: getWallX(ORIGIN_Y - wallHeight), y: ORIGIN_Y - wallHeight },
      ],
      fill: 'url(#concretePattern)',
      stroke: '#6b7280',
      strokeWidth: 1.2,
      opacity: 1,
    });
    // Dashed lines
    renderedFaces.push({
      id: 'hole-top-line',
      pts: [
        { x: gateTopX, y: gateTopY },
        { x: gateTopX + wallBaseWidth, y: gateTopY },
      ],
      stroke: '#4b5563',
      strokeWidth: 1.5,
      strokeDasharray: '6 4',
    });
    renderedFaces.push({
      id: 'hole-bottom-line',
      pts: [
        { x: gateBottomX, y: gateBottomY },
        { x: gateBottomX + wallBaseWidth, y: gateBottomY },
      ],
      stroke: '#4b5563',
      strokeWidth: 1.5,
      strokeDasharray: '6 4',
    });
  } else {
    renderedFaces.push({
      id: 'wall-solid',
      kind: 'DAM',
      pts: [
        { x: ORIGIN_X, y: ORIGIN_Y },
        { x: ORIGIN_X + wallBaseWidth, y: ORIGIN_Y },
        { x: getWallX(ORIGIN_Y - wallHeight) + wallBaseWidth, y: ORIGIN_Y - wallHeight },
        { x: getWallX(ORIGIN_Y - wallHeight), y: ORIGIN_Y - wallHeight },
      ],
      fill: 'url(#concretePattern)',
      stroke: '#6b7280',
      strokeWidth: 1.2,
      opacity: 1,
    });
  }

  renderedFaces.push({
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
  });


  if (props.downstreamLevel > 0) {
    renderedFaces.push({
      id: 'water-down',
      kind: 'WATER_DOWN',
      pts: [
        { x: ORIGIN_X + wallBaseWidth, y: ORIGIN_Y },
        { x: ORIGIN_X + wallBaseWidth + 30 * SCALE, y: ORIGIN_Y },
        { x: ORIGIN_X + wallBaseWidth + 30 * SCALE, y: ORIGIN_Y - props.downstreamLevel * SCALE },
        { x: getWallX(ORIGIN_Y - props.downstreamLevel * SCALE) + wallBaseWidth, y: ORIGIN_Y - props.downstreamLevel * SCALE }, 
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
    const wallThicknessPerpendicular = wallBaseWidth * Math.sin(wallInclinationRad);
    const gateThickness = wallThicknessPerpendicular * 0.4; // 40% of wall thickness
    const gateOffset = (wallThicknessPerpendicular - gateThickness) / 2;

    renderedFaces.push({
      id: 'gate',
      pts: [
        { x: gateTopX + nx * gateOffset, y: gateTopY + ny * gateOffset },
        { x: gateBottomX + nx * gateOffset, y: gateBottomY + ny * gateOffset },
        { x: gateBottomX + nx * (gateOffset + gateThickness), y: gateBottomY + ny * (gateOffset + gateThickness) },
        { x: gateTopX + nx * (gateOffset + gateThickness), y: gateTopY + ny * (gateOffset + gateThickness) },
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
      const tx = gateTopX + vx * props.tieRodPosRel;
      const ty = gateTopY + vy * props.tieRodPosRel;
      
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
          const y = gateTopY + Math.sin(wallInclinationRad) * s;
          const x = getWallX(y);
          
          const depth = (ORIGIN_Y - y) / SCALE;
          if (depth > 0) {
              const pressure = gamma * depth;
              const vectorLength = (pressure / (gamma * props.upstreamLevel)) * 60; // Scale vector length
              
              vectors.push({
                start: { x: x - nx * vectorLength, y: y - ny * vectorLength },
                end: { x: x, y: y },
                color: '#38bdf8',
                strokeWidth: 2,
                opacity: 0.7,
                isResultant: false
              });
          }
      }

      const cpY = gateTopY + Math.sin(wallInclinationRad) * props.s_cp * SCALE;
      const cpX = getWallX(cpY);
      
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
    const wallThicknessPerpendicular = wallBaseWidth * Math.sin(wallInclinationRad);
    const gateThickness = wallThicknessPerpendicular * 0.4;
    const gateOffset = (wallThicknessPerpendicular - gateThickness) / 2;
    
    renderedFaces.push({
      id: 'gate-open',
      pts: [
        { x: gateTopX + nx * gateOffset, y: gateTopY - liftY + ny * gateOffset },
        { x: gateBottomX + nx * gateOffset, y: gateBottomY - liftY + ny * gateOffset },
        { x: gateBottomX + nx * (gateOffset + gateThickness), y: gateBottomY - liftY + ny * (gateOffset + gateThickness) },
        { x: gateTopX + nx * (gateOffset + gateThickness), y: gateTopY - liftY + ny * (gateOffset + gateThickness) },
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

    const drawLevelSymbol = (
      key: string,
      x: number,
      y: number,
      text: string,
      flipX: boolean = false
    ) => {
      const dir = flipX ? -1 : 1;
      return (
        <g key={key} stroke="#475569" strokeWidth="1.2" opacity="0.9">
          {/* Inverted triangle: left half empty, right half filled */}
          <polygon points={`${x},${y} ${x-7},${y-14} ${x},${y-14}`} fill="none" />
          <polygon points={`${x},${y} ${x},${y-14} ${x+7},${y-14}`} fill="#475569" />
          
          {/* Stem and flag */}
          <polyline points={`${x},${y-14} ${x},${y-30} ${x + dir * 40},${y-30}`} fill="none" />
          
          {/* Text on top of flag */}
          <text
            x={x + dir * 20}
            y={y - 34}
            textAnchor="middle"
            dominantBaseline="alphabetic"
            fill="#334155"
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
        { x: getWallX(ORIGIN_Y - wallHeight) + wallBaseWidth, y: ORIGIN_Y - wallHeight },
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
        drawLevelSymbol(
          'upstreamLevel',
          ORIGIN_X - 25,
          yL,
          `NA=${props.upstreamLevel.toFixed(2)}`,
          true // flipX so it points leftwards
        )
      );
    }

    // Nível de Jusante (Downstream Level)
    if (props.downstreamLevel > 0) {
      const yL = ORIGIN_Y - props.downstreamLevel * SCALE;
      dims.push(
        drawLevelSymbol(
          'downstreamLevel',
          ORIGIN_X + wallBaseWidth + 25,
          yL,
          `NA=${props.downstreamLevel.toFixed(2)}`,
          false
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
