import React, { useId, useMemo } from 'react';
import { Box as BoxIcon } from 'lucide-react';
import { ObjectShape } from '../dominio/tipos';
import { SvgDefs } from './SvgDefs';
import { getMaterialPattern } from './visualUtils';

type Point2D = {
  x: number;
  y: number;
};

interface Vista2DProps {
  svgWidth: number;
  svgHeight: number;

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
  vol_deslocado?: number;
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
  showCenterOfBuoyancy?: boolean;
  onToggleCenterOfBuoyancy?: () => void;

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

const renderDimensionLine = (
  x: number,
  y1: number,
  y2: number,
  label: React.ReactNode,
  color = '#475569'
) => {
  const midY = (y1 + y2) / 2;
  const height = Math.abs(y2 - y1);

  if (height < 20) {
    return (
      <g>
        <line x1={x - 8} y1={y1} x2={x + 8} y2={y1} stroke={color} strokeWidth="1" />
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
          >
            {label}
          </text>
        </g>
      </g>
    );
  }

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
  vol_deslocado,
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
  showCenterOfBuoyancy = true,
  onToggleCenterOfBuoyancy,
}) => {
  const clipId = useId().replace(/:/g, '');
  const clipUnderWaterId = `clip-under-water-${clipId}`;
  const clipAboveWaterId = `clip-above-water-${clipId}`;
  const arrowRedId = `arrow-red-${clipId}`;
  const arrowGreenId = `arrow-green-${clipId}`;

  const cx = tankOffsetX + currentTankW / 2 + pan.x;
  const cy = blockY + pan.y;
  const renderFill = getMaterialPattern(selectedMaterial, objColor);

  const tankLeft = tankOffsetX + pan.x;
  const tankTop = tankBottomY - currentTankH + pan.y;

  const fluidAHeight = Math.max(0, tankBottomY - fluidSurfaceY - (effectiveHB_px || 0));
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

  const arrowLenP = Math.min(120, Math.max(30, objectWeight * 0.005));
  const arrowLenE = Math.min(120, Math.max(30, buoyancyForce * 0.005));

  const showBuoyancyVector = isSimulating && h_sub_actual > 0.001;

  return (
    <div className="relative w-full h-full">
      {onToggleCenterOfBuoyancy && (
        <div className="absolute top-4 right-4 flex gap-2 z-30" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={onToggleCenterOfBuoyancy}
            className={`bg-white/85 p-2 rounded-full shadow-md border border-blue-100/70 backdrop-blur ${
              showCenterOfBuoyancy ? 'text-blue-600' : 'text-slate-400'
            }`}
            title="Mostrar Centro de Carena"
          >
            <BoxIcon className="w-4 h-4" />
          </button>
        </div>
      )}
      <svg
        width="100%"
        height="100%"
        className="overflow-visible"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
      <SvgDefs colorA={colorA} colorB={colorB} />
      <defs>
        <marker id={arrowRedId} markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
          <path d="M0,0 L6,2 L0,4 Z" fill="#ef4444" />
        </marker>

        <marker id={arrowGreenId} markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
          <path d="M0,0 L6,2 L0,4 Z" fill="#16a34a" />
        </marker>

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
          'url(#glassGradient)',
          0.2,
          TANK_BORDER_COLOR,
          2
        )}
      </g>

      {/* Linha de nível original */}
      {isSimulating && deltaH_cm > 0 && (
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
          <>
            <circle
              cx={cx}
              cy={cy + visualHeight / 2}
              r={visualWidth / 2}
              fill={objColor}
              stroke="none"
            />
            <circle
              cx={cx}
              cy={cy + visualHeight / 2}
              r={visualWidth / 2}
              fill={renderFill}
              stroke={OBJECT_BORDER_COLOR}
              strokeWidth="1"
            />
            <circle
              cx={cx}
              cy={cy + visualHeight / 2}
              r={visualWidth / 2}
              fill="url(#sphereLight)"
              stroke="none"
            />
          </>
        ) : shape === ObjectShape.CYLINDER ? (
          <>
            <rect
              x={cx - visualWidth / 2}
              y={cy}
              width={visualWidth}
              height={visualHeight}
              fill={objColor}
              stroke="none"
            />
            <rect
              x={cx - visualWidth / 2}
              y={cy}
              width={visualWidth}
              height={visualHeight}
              fill={renderFill}
              stroke={OBJECT_BORDER_COLOR}
              strokeWidth="1"
            />
            <rect
              x={cx - visualWidth / 2}
              y={cy}
              width={visualWidth}
              height={visualHeight}
              fill="url(#metalLinear2D)"
              stroke="none"
              opacity="0.4"
              pointerEvents="none"
            />
          </>
        ) : (
          <>
            <rect
              x={cx - visualWidth / 2}
              y={cy}
              width={visualWidth}
              height={visualHeight}
              fill={objColor}
              stroke="none"
            />
            <rect
              x={cx - visualWidth / 2}
              y={cy}
              width={visualWidth}
              height={visualHeight}
              fill={renderFill}
              stroke={OBJECT_BORDER_COLOR}
              strokeWidth="1"
            />
            <rect
              x={cx - visualWidth / 2}
              y={cy}
              width={visualWidth}
              height={visualHeight}
              fill="url(#sphereLight)"
              stroke="none"
              opacity="0.3"
              pointerEvents="none"
            />
          </>
        )}
      </g>

      {/* Parte emersa do objeto */}
      <g clipPath={`url(#${clipAboveWaterId})`}>
        {shape === ObjectShape.SPHERE ? (
          <>
            <circle
              cx={cx}
              cy={cy + visualHeight / 2}
              r={visualWidth / 2}
              fill={objColor}
              stroke="none"
            />
            <circle
              cx={cx}
              cy={cy + visualHeight / 2}
              r={visualWidth / 2}
              fill={renderFill}
              stroke={OBJECT_BORDER_COLOR}
              strokeWidth="1"
            />
            <circle
              cx={cx}
              cy={cy + visualHeight / 2}
              r={visualWidth / 2}
              fill="url(#sphereLight)"
              stroke="none"
              pointerEvents="none"
            />
          </>
        ) : shape === ObjectShape.CYLINDER ? (
          <>
            <rect
              x={cx - visualWidth / 2}
              y={cy}
              width={visualWidth}
              height={visualHeight}
              fill={objColor}
              stroke="none"
            />
            <rect
              x={cx - visualWidth / 2}
              y={cy}
              width={visualWidth}
              height={visualHeight}
              fill={renderFill}
              stroke={OBJECT_BORDER_COLOR}
              strokeWidth="1"
            />
            <rect
              x={cx - visualWidth / 2}
              y={cy}
              width={visualWidth}
              height={visualHeight}
              fill="url(#metalLinear2D)"
              stroke="none"
              opacity="0.4"
              pointerEvents="none"
            />
          </>
        ) : (
          <>
            <rect
              x={cx - visualWidth / 2}
              y={cy}
              width={visualWidth}
              height={visualHeight}
              fill={objColor}
              stroke="none"
            />
            <rect
              x={cx - visualWidth / 2}
              y={cy}
              width={visualWidth}
              height={visualHeight}
              fill={renderFill}
              stroke={OBJECT_BORDER_COLOR}
              strokeWidth="1"
            />
            <rect
              x={cx - visualWidth / 2}
              y={cy}
              width={visualWidth}
              height={visualHeight}
              fill="url(#sphereLight)"
              stroke="none"
              opacity="0.3"
              pointerEvents="none"
            />
          </>
        )}
      </g>

      {/* Vetores */}
      {showFBD && (
        <g pointerEvents="none">
          {/* Peso (P) - Acima do bloco apontando para baixo */}
          <line
            x1={cx}
            y1={cy - arrowLenP}
            x2={cx}
            y2={cy}
            stroke="#ef4444"
            strokeWidth="3"
            markerEnd={`url(#${arrowRedId})`}
          />
          <circle cx={cx} cy={cy} r={3} fill="#ef4444" />
          <g transform={`translate(${cx + 10}, ${cy - arrowLenP / 2})`}>
            <rect x="0" y="-10" width="24" height="20" fill="white" opacity="0.8" rx="4" />
            <text x="12" y="4" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">
              P
            </text>
          </g>

          {showBuoyancyVector && (
            <>
              {/* Empuxo (E) - Abaixo do bloco apontando para cima */}
              <line
                x1={cx}
                y1={cy + visualHeight + arrowLenE}
                x2={cx}
                y2={cy + visualHeight}
                stroke="#16a34a"
                strokeWidth="3"
                markerEnd={`url(#${arrowGreenId})`}
              />
              <circle cx={cx} cy={cy + visualHeight} r={3} fill="#16a34a" />
              <g transform={`translate(${cx + 10}, ${cy + visualHeight + arrowLenE / 2})`}>
                <rect x="0" y="-10" width="24" height="20" fill="white" opacity="0.8" rx="4" />
                <text x="12" y="4" textAnchor="middle" fill="#16a34a" fontSize="12" fontWeight="bold">
                  E
                </text>
              </g>
            </>
          )}

          {showCenterOfBuoyancy && h_sub_actual > 0.001 && (
            <circle
              cx={centerOfBuoyancy.x}
              cy={centerOfBuoyancy.y}
              r={6}
              fill="white"
              stroke="#16a34a"
              strokeWidth="2"
            />
          )}
        </g>
      )}

      {/* Fluidos */}
      <g pointerEvents="none">
        <rect
          x={tankLeft}
          y={fluidSurfaceY + pan.y}
          width={currentTankW}
          height={fluidAHeight}
          fill="url(#fluidDepthA)"
        />

        <rect
          x={tankLeft}
          y={fluidSurfaceY + pan.y}
          width={currentTankW}
          height={rippleHeight}
          fill="url(#ripplePattern)"
        />
        
        <line
          x1={tankLeft}
          y1={fluidSurfaceY + pan.y}
          x2={tankLeft + currentTankW}
          y2={fluidSurfaceY + pan.y}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1"
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
      {isSimulating && deltaH_cm > 0 && renderDimensionLine(
        tankLeft - 20,
        fluidSurfaceY + pan.y,
        originalFluidSurfaceY + pan.y,
        `Δh = ${deltaH_cm.toFixed(2)}cm`,
        colorA
      )}
      {enableTwoFluids ? (
        <>
          {renderDimensionLine(
            tankLeft - 20,
            originalFluidSurfaceY + pan.y,
            tankBottomY - effectiveHB_px + pan.y,
            `hA = ${depthA.toFixed(1)}cm`,
            colorA
          )}
          {renderDimensionLine(
            tankLeft - 20,
            tankBottomY - effectiveHB_px + pan.y,
            tankBottomY + pan.y,
            `hB = ${depthB.toFixed(1)}cm`,
            colorB
          )}
        </>
      ) : (
        renderDimensionLine(
          tankLeft - 20,
          originalFluidSurfaceY + pan.y,
          tankBottomY + pan.y,
          `hA = ${depthA.toFixed(1)}cm`,
          colorA
        )
      )}
    </svg>
    </div>
  );
};
