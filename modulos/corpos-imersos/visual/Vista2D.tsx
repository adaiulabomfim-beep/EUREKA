import React, { useId, useMemo } from 'react';
import { ObjectShape } from '../dominio/tipos';

type Point2D = {
  x: number;
  y: number;
};

interface Vista2DProps {
  svgWidth: number;
  svgHeight: number;

  tankWidth: number;
  tankHeight: number;
  tankBottomY: number;
  tankOffsetX: number;
  currentTankW: number;
  currentTankH: number;

  shape: ObjectShape;
  visualWidth: number;
  visualHeight: number;
  selectedMaterial: string;

  blockY: number;
  fluidSurfaceY: number;
  originalFluidSurfaceY: number;

  depthA: number;
  depthB: number;
  enableTwoFluids: boolean;

  deltaH_cm: number;
  isSimulating: boolean;

  selectedFluid: string;
  selectedFluidB: string;
  colorA: string;
  colorB: string;

  objColor: string;
  TANK_BORDER_COLOR: string;
  OBJECT_BORDER_COLOR: string;

  effectiveHB_px: number;
  hA_dynamic_px: number;

  showFBD?: boolean;
  objectWeight?: number;
  buoyancyForce?: number;
  centerOfBuoyancyY_visual?: number;
  h_sub_actual?: number;

  pan?: { x: number; y: number };
}

const drawPoly = (
  pts: Point2D[],
  fill: string,
  opacity = 1,
  stroke = 'none',
  strokeWidth = 0
) => {
  const d = `M${pts.map((p) => `${p.x},${p.y}`).join(' L')} Z`;
  return (
    <path
      d={d}
      fill={fill}
      opacity={opacity}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
  );
};

const getMaterialFill = (materialName: string, baseColor: string) => {
  const n = materialName.toLowerCase();

  if (
    n.includes('ouro') ||
    n.includes('latão') ||
    n.includes('bronze') ||
    n.includes('cobre')
  ) {
    return 'url(#goldGradient2D)';
  }

  if (n.includes('madeira') || n.includes('cortiça')) {
    return 'url(#woodPattern2D)';
  }

  if (
    n.includes('concreto') ||
    n.includes('asfalto') ||
    n.includes('granito') ||
    n.includes('pedra')
  ) {
    return 'url(#concretePattern2D)';
  }

  if (
    n.includes('aço') ||
    n.includes('alumínio') ||
    n.includes('ferro') ||
    n.includes('prata')
  ) {
    return 'url(#metalLinear2D)';
  }

  return baseColor;
};

const renderDimensionLine = (
  x: number,
  y1: number,
  y2: number,
  label: React.ReactNode,
  color = '#475569'
) => {
  const midY = (y1 + y2) / 2;
  const height = Math.abs(y2 - y1);

  if (height < 5) return null;

  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2} stroke={color} strokeWidth="1" />

      <path
        d={`M${x},${y1} L${x - 3},${y1 + 8} L${x + 3},${y1 + 8} Z`}
        fill={color}
      />
      <line x1={x - 8} y1={y1} x2={x + 8} y2={y1} stroke={color} strokeWidth="1" />

      <path
        d={`M${x},${y2} L${x - 3},${y2 - 8} L${x + 3},${y2 - 8} Z`}
        fill={color}
      />
      <line x1={x - 8} y1={y2} x2={x + 8} y2={y2} stroke={color} strokeWidth="1" />

      <g transform={`translate(${x - 16}, ${midY}) rotate(-90)`}>
        <rect x="-55" y="-10" width="110" height="20" fill="white" opacity="0.82" rx="4" />
        <text
          x="0"
          y="4"
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill={color}
          fontFamily="monospace"
        >
          {label}
        </text>
      </g>
    </g>
  );
};

export const Vista2D: React.FC<Vista2DProps> = ({
  svgWidth,
  svgHeight,
  tankOffsetX,
  currentTankW,
  currentTankH,
  tankBottomY,
  shape,
  visualWidth,
  visualHeight,
  selectedMaterial,
  blockY,
  fluidSurfaceY,
  originalFluidSurfaceY,
  depthA,
  depthB,
  enableTwoFluids,
  deltaH_cm,
  isSimulating,
  pan = { x: 0, y: 0 },
  objColor,
  TANK_BORDER_COLOR,
  OBJECT_BORDER_COLOR,
  colorA,
  colorB,
  effectiveHB_px,
  hA_dynamic_px,
  showFBD = true,
  objectWeight = 0,
  buoyancyForce = 0,
  centerOfBuoyancyY_visual = 0,
  h_sub_actual = 0,
}) => {
  const clipId = useId().replace(/:/g, '');
  const clipUnderWaterId = `clip-under-water-${clipId}`;
  const clipAboveWaterId = `clip-above-water-${clipId}`;
  const arrowRedId = `arrow-red-${clipId}`;
  const arrowGreenId = `arrow-green-${clipId}`;

  const cx = tankOffsetX + currentTankW / 2 + pan.x;
  const cy = blockY + pan.y;
  const renderFill = getMaterialFill(selectedMaterial, objColor);

  const tankLeft = tankOffsetX + pan.x;
  const tankTop = tankBottomY - currentTankH + pan.y;

  const fluidAHeight = Math.max(0, tankBottomY - originalFluidSurfaceY - effectiveHB_px);
  const deltaFluidHeight = Math.max(0, originalFluidSurfaceY - fluidSurfaceY);
  const rippleHeight = Math.max(0, Math.min(30, hA_dynamic_px));
  const fluidBTop = fluidSurfaceY + hA_dynamic_px + pan.y;

  const centerOfMass = useMemo(
    () => ({
      x: cx,
      y: cy + visualHeight / 2,
    }),
    [cx, cy, visualHeight]
  );

  const centerOfBuoyancy = useMemo(
    () => ({
      x: cx,
      y: centerOfBuoyancyY_visual + pan.y,
    }),
    [cx, centerOfBuoyancyY_visual, pan.y]
  );

  const arrowLenP = Math.min(200, Math.max(50, objectWeight * 0.01));
  const arrowLenE = Math.min(200, Math.max(50, buoyancyForce * 0.01));

  const showBuoyancyVector = isSimulating && h_sub_actual > 0.001;

  return (
    <svg
      width="100%"
      height="100%"
      className="overflow-visible"
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker id={arrowRedId} markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
          <path d="M0,0 L6,2 L0,4 Z" fill="#ef4444" />
        </marker>

        <marker id={arrowGreenId} markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
          <path d="M0,0 L6,2 L0,4 Z" fill="#16a34a" />
        </marker>

        <linearGradient id="fluidDepthA" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colorA} stopOpacity="0.15" />
          <stop offset="100%" stopColor={colorA} stopOpacity="0.6" />
        </linearGradient>

        <linearGradient id="fluidDepthB" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colorB} stopOpacity="0.3" />
          <stop offset="100%" stopColor={colorB} stopOpacity="0.8" />
        </linearGradient>

        <linearGradient id="goldGradient2D" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        <linearGradient id="metalLinear2D" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <pattern
          id="woodPattern2D"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(10)"
        >
          <rect width="20" height="20" fill="#d97706" />
          <path
            d="M0,5 Q10,2 20,5 M0,15 Q10,18 20,15"
            stroke="#92400e"
            strokeWidth="1"
            fill="none"
            opacity="0.5"
          />
          <path
            d="M5,0 Q2,10 5,20"
            stroke="#b45309"
            strokeWidth="0.5"
            fill="none"
            opacity="0.3"
          />
        </pattern>

        <filter id="concreteNoise2D">
          <feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="3" stitchTiles="stitch" />
        </filter>

        <pattern id="concretePattern2D" width="64" height="64" patternUnits="userSpaceOnUse">
          <rect width="64" height="64" fill="#a3a3a3" />
          <rect width="64" height="64" filter="url(#concreteNoise2D)" opacity="0.25" />
          <path
            d="M10,20 Q15,15 20,20 T30,20"
            stroke="#525252"
            strokeWidth="0.5"
            fill="none"
            opacity="0.3"
          />
          <circle cx="45" cy="50" r="1.5" fill="#525252" opacity="0.4" />
          <circle cx="10" cy="50" r="1" fill="#e5e5e5" opacity="0.4" />
        </pattern>

        <pattern id="ripplePattern" width="120" height="40" patternUnits="userSpaceOnUse">
          <animateTransform
            attributeName="patternTransform"
            type="translate"
            from="0 0"
            to="120 20"
            dur="8s"
            repeatCount="indefinite"
          />
          <path
            d="M0,20 Q30,10 60,20 T120,20"
            fill="none"
            stroke="white"
            strokeWidth="1"
            opacity="0.4"
          />
          <path
            d="M-60,0 Q-30,-10 0,0 T60,0"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            opacity="0.2"
          />
        </pattern>

        <clipPath id={clipUnderWaterId}>
          <rect x="-2000" y={fluidSurfaceY + pan.y} width="5000" height="5000" />
        </clipPath>

        <clipPath id={clipAboveWaterId}>
          <rect x="-2000" y="-2000" width="5000" height={fluidSurfaceY + pan.y + 2000} />
        </clipPath>
      </defs>

      {/* Fundo do tanque */}
      <g>
        {drawPoly(
          [
            { x: tankLeft, y: tankBottomY + pan.y },
            { x: tankLeft + currentTankW, y: tankBottomY + pan.y },
            { x: tankLeft + currentTankW, y: tankTop },
            { x: tankLeft, y: tankTop },
          ],
          '#ffffff',
          1
        )}
      </g>

      {/* Linha de nível original */}
      {isSimulating && deltaH_cm > 0.01 && (
        <line
          x1={tankLeft}
          y1={originalFluidSurfaceY + pan.y}
          x2={tankLeft + currentTankW}
          y2={originalFluidSurfaceY + pan.y}
          stroke="#64748b"
          strokeWidth="1"
          strokeDasharray="4,4"
          opacity="0.6"
        />
      )}

      {/* Parte submersa do objeto */}
      <g clipPath={`url(#${clipUnderWaterId})`}>
        {shape === ObjectShape.SPHERE ? (
          <circle
            cx={cx}
            cy={cy + visualHeight / 2}
            r={visualWidth / 2}
            fill={renderFill}
            stroke={OBJECT_BORDER_COLOR}
            strokeWidth="1"
          />
        ) : (
          <rect
            x={cx - visualWidth / 2}
            y={cy}
            width={visualWidth}
            height={visualHeight}
            fill={renderFill}
            stroke={OBJECT_BORDER_COLOR}
            strokeWidth="1"
          />
        )}
      </g>

      {/* Parte emersa do objeto */}
      <g clipPath={`url(#${clipAboveWaterId})`}>
        {shape === ObjectShape.SPHERE ? (
          <circle
            cx={cx}
            cy={cy + visualHeight / 2}
            r={visualWidth / 2}
            fill={renderFill}
            stroke={OBJECT_BORDER_COLOR}
            strokeWidth="1"
          />
        ) : (
          <rect
            x={cx - visualWidth / 2}
            y={cy}
            width={visualWidth}
            height={visualHeight}
            fill={renderFill}
            stroke={OBJECT_BORDER_COLOR}
            strokeWidth="1"
          />
        )}
      </g>

      {/* Vetores */}
      {showFBD && (
        <g pointerEvents="none">
          <line
            x1={centerOfMass.x}
            y1={centerOfMass.y}
            x2={centerOfMass.x}
            y2={centerOfMass.y + arrowLenP}
            stroke="#ef4444"
            strokeWidth="3"
            markerEnd={`url(#${arrowRedId})`}
          />
          <circle cx={centerOfMass.x} cy={centerOfMass.y} r={3} fill="#ef4444" />
          <g transform={`translate(${centerOfMass.x + 10}, ${centerOfMass.y + arrowLenP / 2})`}>
            <rect x="0" y="-10" width="24" height="20" fill="white" opacity="0.85" rx="4" />
            <text x="12" y="4" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">
              P
            </text>
          </g>

          {showBuoyancyVector && (
            <>
              <line
                x1={centerOfBuoyancy.x}
                y1={centerOfBuoyancy.y}
                x2={centerOfBuoyancy.x}
                y2={centerOfBuoyancy.y - arrowLenE}
                stroke="#16a34a"
                strokeWidth="3"
                markerEnd={`url(#${arrowGreenId})`}
              />
              <circle cx={centerOfBuoyancy.x} cy={centerOfBuoyancy.y} r={3} fill="#16a34a" />
              <g transform={`translate(${centerOfBuoyancy.x + 10}, ${centerOfBuoyancy.y - arrowLenE / 2})`}>
                <rect x="0" y="-10" width="24" height="20" fill="white" opacity="0.85" rx="4" />
                <text x="12" y="4" textAnchor="middle" fill="#16a34a" fontSize="12" fontWeight="bold">
                  E
                </text>
              </g>
            </>
          )}
        </g>
      )}

      {/* Fluidos */}
      <g pointerEvents="none">
        <rect
          x={tankLeft}
          y={originalFluidSurfaceY + pan.y}
          width={currentTankW}
          height={fluidAHeight}
          fill="url(#fluidDepthA)"
        />

        {isSimulating && deltaH_cm > 0.01 && (
          <rect
            x={tankLeft}
            y={fluidSurfaceY + pan.y}
            width={currentTankW}
            height={deltaFluidHeight}
            fill={colorA}
            opacity="0.4"
          />
        )}

        <rect
          x={tankLeft}
          y={fluidSurfaceY + pan.y}
          width={currentTankW}
          height={rippleHeight}
          fill="url(#ripplePattern)"
        />

        {enableTwoFluids && (
          <rect
            x={tankLeft}
            y={fluidBTop}
            width={currentTankW}
            height={Math.max(0, effectiveHB_px || 0)}
            fill="url(#fluidDepthB)"
          />
        )}
        <rect
          x={tankLeft}
          y={tankBottomY - currentTankH + pan.y}
          width={currentTankW}
          height={Math.max(0, currentTankH || 0)}
          fill="none"
          stroke={TANK_BORDER_COLOR}
          strokeWidth="2"
        />
      </g>

      {/* Cotas */}
      {renderDimensionLine(
        tankLeft - 20,
        originalFluidSurfaceY + pan.y,
        tankBottomY + pan.y,
        `hA = ${depthA.toFixed(1)}cm`,
        '#60a5fa'
      )}
    </svg>
  );
};
