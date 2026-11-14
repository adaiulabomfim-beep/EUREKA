import React, { useId, useMemo } from 'react';
import { Box as BoxIcon } from 'lucide-react';
import { ObjectShape } from '../dominio/tipos';
import { SvgDefs } from './SvgDefs';
import { getMaterialPattern } from './visualUtils';
import { useSvgPanZoom } from '../../../src/hooks/useSvgPanZoom';
import { ControlesNavegacaoCena } from '../../../src/components/ui/ControlesNavegacaoCena';

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
  tankWidth?: number;
  tankDepth?: number;

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
  twoBlocks?: boolean;
  H2_visual?: number;
  cordLength_visual?: number;
  obj2Color?: string;
  extraWeight?: number;

  shape2?: ObjectShape;
  visualWidth2?: number;

  inverseSpecificWeightMode?: boolean;
  apparentWeight?: number;

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
  tankWidth,
  tankDepth,
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
  twoBlocks = false,
  H2_visual = 0,
  cordLength_visual = 0,
  obj2Color = '#475569',
  extraWeight = 0,
  shape2 = ObjectShape.CUBE,
  visualWidth2 = 0,
  inverseSpecificWeightMode = false,
  apparentWeight = 0,
}) => {
  const clipId = useId().replace(/:/g, '');
  const clipUnderWaterId = `clip-under-water-${clipId}`;
  const clipAboveWaterId = `clip-above-water-${clipId}`;
  const arrowRedId = `arrow-red-${clipId}`;
  const arrowGreenId = `arrow-green-${clipId}`;
  const arrowBlueId = `arrow-blue-${clipId}`;

  const cx = tankOffsetX + currentTankW / 2 + pan.x;
  const cy = blockY + pan.y;
  const renderFill = getMaterialPattern(selectedMaterial, objColor);

  const tankLeft = tankOffsetX + pan.x;
  const tankTop = tankBottomY - currentTankH + pan.y;

  const fluidAHeight = Math.max(0, tankBottomY - fluidSurfaceY - (effectiveHB_px || 0));
  const rippleHeight = Math.max(0, Math.min(30, hA_dynamic_px));
  const fluidBTop = tankBottomY - (effectiveHB_px || 0) + pan.y;

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

  const extraWeightHeight = extraWeight > 0 ? 18 : 0;
  const extraWeightLabel =
    extraWeight >= 1000 ? `+${(extraWeight / 1000).toFixed(2)} kN` : `+${extraWeight} N`;
  const extraWeightWidth = Math.max(48, extraWeightLabel.length * 7.5 + 14);
  const pTargetY = cy - extraWeightHeight;

  const maxArrowP = Math.max(25, pTargetY - 16);
  const arrowLenP = Math.min(maxArrowP, Math.min(110, Math.max(30, objectWeight * 0.005)));
  const blockBottomY = cy + visualHeight + (twoBlocks ? cordLength_visual + H2_visual : 0);
  const maxArrowE = Math.max(30, (tankBottomY + pan.y + 34) - blockBottomY);
  const arrowLenE = Math.min(maxArrowE, Math.min(120, Math.max(30, buoyancyForce * 0.005)));

  const showBuoyancyVector = isSimulating && h_sub_actual > 0.001;
  const eVectorTailY = showFBD && showBuoyancyVector ? blockBottomY + arrowLenE : 0;
  const baseDimY =
    eVectorTailY > tankBottomY + pan.y + 8
      ? Math.max(tankBottomY + pan.y + 22, eVectorTailY + 18)
      : tankBottomY + pan.y + 22;

  const nav = useSvgPanZoom({
    svgWidth,
    svgHeight,
    minZoom: 0.45,
    maxZoom: 4.0,
  });

  return (
    <div
      ref={nav.containerRef}
      className={`relative w-full h-full select-none ${
        nav.isPanning ? 'cursor-grabbing' : nav.isSpacePressed ? 'cursor-grab' : ''
      }`}
      {...nav.containerHandlers}
    >
      <ControlesNavegacaoCena
        mode="2d"
        onZoomIn={nav.zoomIn}
        onZoomOut={nav.zoomOut}
        onReset={nav.resetView}
        zoomPercent={nav.zoomPercent}
        canZoomIn={nav.canZoomIn}
        canZoomOut={nav.canZoomOut}
        className="bottom-6 left-6"
      />

      <svg
        ref={nav.svgRef}
        width="100%"
        height="100%"
        className="overflow-visible touch-none"
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

        <marker id={arrowBlueId} markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
          <path d="M0,0 L6,2 L0,4 Z" fill="#2563eb" />
        </marker>

        <clipPath id={clipUnderWaterId}>
          <rect x="-2000" y={fluidSurfaceY + pan.y} width="5000" height="5000" />
        </clipPath>

        <clipPath id={clipAboveWaterId}>
          <rect x="-2000" y="-2000" width="5000" height={fluidSurfaceY + pan.y + 2000} />
        </clipPath>
      </defs>

      <g transform={`translate(${nav.pan.x}, ${nav.pan.y}) scale(${nav.zoom})`}>
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

      {/* Cabo entre blocos */}
      {twoBlocks && (
        <line
          x1={cx}
          y1={cy + visualHeight}
          x2={cx}
          y2={cy + visualHeight + cordLength_visual}
          stroke="#475569"
          strokeWidth="2"
          strokeDasharray="2,2"
        />
      )}

      {/* Bloco 2 (Sempre submerso visualmente se houver equilíbrio) */}
      {twoBlocks && (
        <g transform={`translate(${cx}, ${cy + visualHeight + cordLength_visual})`}>
          {shape2 === ObjectShape.SPHERE ? (
            <>
              <circle
                cx={0}
                cy={H2_visual / 2}
                r={visualWidth2 / 2}
                fill={obj2Color}
                stroke={OBJECT_BORDER_COLOR}
                strokeWidth="1"
                opacity="0.9"
              />
              <circle
                cx={0}
                cy={H2_visual / 2}
                r={visualWidth2 / 2}
                fill="url(#sphereLight)"
                opacity="0.2"
              />
              <text x={0} y={H2_visual / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontWeight="bold" fontSize={Math.max(12, visualWidth2/3)}>B</text>
            </>
          ) : (
            <>
              <rect
                x={-visualWidth2 / 2}
                y={0}
                width={visualWidth2}
                height={H2_visual}
                fill={obj2Color}
                stroke={OBJECT_BORDER_COLOR}
                strokeWidth="1"
                opacity="0.9"
              />
              <rect
                x={-visualWidth2 / 2}
                y={0}
                width={visualWidth2}
                height={H2_visual}
                fill="url(#sphereLight)"
                opacity="0.2"
              />
            </>
          )}
        </g>
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
            <text x={cx} y={cy + visualHeight / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontWeight="bold" fontSize={Math.max(12, visualWidth/3)}>A</text>
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
            {shape === ObjectShape.CYLINDER && (
              <>
                <ellipse
                  cx={cx}
                  cy={cy + 4}
                  rx={visualWidth / 2}
                  ry={Math.min(6, visualHeight * 0.08)}
                  fill="rgba(255,255,255,0.22)"
                  stroke={OBJECT_BORDER_COLOR}
                  strokeWidth="0.9"
                />
                <line
                  x1={cx}
                  y1={cy + 2}
                  x2={cx}
                  y2={cy + visualHeight - 2}
                  stroke="rgba(255,255,255,0.45)"
                  strokeWidth="1"
                  strokeDasharray="4,3"
                />
              </>
            )}
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
            <text x={cx} y={cy + visualHeight / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontWeight="bold" fontSize={Math.max(12, visualWidth/3)}>A</text>
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
            {shape === ObjectShape.CYLINDER && (
              <>
                <ellipse
                  cx={cx}
                  cy={cy + 4}
                  rx={visualWidth / 2}
                  ry={Math.min(6, visualHeight * 0.08)}
                  fill="rgba(255,255,255,0.22)"
                  stroke={OBJECT_BORDER_COLOR}
                  strokeWidth="0.9"
                />
                <line
                  x1={cx}
                  y1={cy + 2}
                  x2={cx}
                  y2={cy + visualHeight - 2}
                  stroke="rgba(255,255,255,0.45)"
                  strokeWidth="1"
                  strokeDasharray="4,3"
                />
              </>
            )}
          </>
        )}
      </g>

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

      {/* Cota horizontal da base do tanque */}
      {tankWidth !== undefined && (
        <g>
          <line
            x1={tankLeft}
            y1={baseDimY}
            x2={tankLeft + currentTankW}
            y2={baseDimY}
            stroke={TANK_BORDER_COLOR}
            strokeWidth="1"
          />
          <path
            d={`M${tankLeft},${baseDimY} L${tankLeft + 8},${baseDimY - 3} L${tankLeft + 8},${baseDimY + 3} Z`}
            fill={TANK_BORDER_COLOR}
          />
          <line
            x1={tankLeft}
            y1={baseDimY - 8}
            x2={tankLeft}
            y2={baseDimY + 8}
            stroke={TANK_BORDER_COLOR}
            strokeWidth="1"
          />
          <path
            d={`M${tankLeft + currentTankW},${baseDimY} L${tankLeft + currentTankW - 8},${baseDimY - 3} L${tankLeft + currentTankW - 8},${baseDimY + 3} Z`}
            fill={TANK_BORDER_COLOR}
          />
          <line
            x1={tankLeft + currentTankW}
            y1={baseDimY - 8}
            x2={tankLeft + currentTankW}
            y2={baseDimY + 8}
            stroke={TANK_BORDER_COLOR}
            strokeWidth="1"
          />
          <g transform={`translate(${tankLeft + currentTankW / 2}, ${baseDimY})`}>
            <rect x="-85" y="-10" width="170" height="20" fill="white" opacity="0.9" rx="4" />
            <text
              x="0"
              y="4"
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
              fill={TANK_BORDER_COLOR}
              fontFamily="monospace"
            >
              {tankDepth !== undefined ? `${tankWidth} × ${tankDepth} cm` : `${tankWidth} cm`}
            </text>
          </g>
        </g>
      )}

      {/* Peso Extra (renderizado acima do fluido para máxima nitidez e sem sobreposição da seta P) */}
      {extraWeight > 0 && (
        <g transform={`translate(${cx - extraWeightWidth / 2}, ${cy - extraWeightHeight})`} pointerEvents="none">
          <rect
            width={extraWeightWidth}
            height={extraWeightHeight}
            fill="#1e293b"
            stroke="#f59e0b"
            strokeWidth="1.5"
            rx="4"
          />
          <text
            x={extraWeightWidth / 2}
            y={extraWeightHeight / 2 + 3.5}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {extraWeightLabel}
          </text>
        </g>
      )}

      {/* Cabo de suspensão e dinamômetro (modo ensaio de corpo totalmente imerso sem contato com fundo) */}
      {inverseSpecificWeightMode && (
        <g pointerEvents="none">
          <line
            x1={cx - 18}
            y1={24}
            x2={cx + 18}
            y2={24}
            stroke="#334155"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1={cx}
            y1={24}
            x2={cx}
            y2={cy}
            stroke="#475569"
            strokeWidth="1.8"
            strokeDasharray="4,2"
          />
          <circle cx={cx} cy={cy} r={3.5} fill="#475569" />
          <g transform={`translate(${cx}, 46)`}>
            <rect
              x="-72"
              y="-12"
              width="144"
              height="24"
              rx="12"
              fill="#ffffff"
              stroke="#2563eb"
              strokeWidth="1.4"
              opacity="0.96"
            />
            <text
              x="0"
              y="0.5"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#1e3a8a"
              fontSize="10.5"
              fontWeight="bold"
            >
              {isSimulating
                ? `Dinamômetro: ${apparentWeight.toFixed(1).replace('.', ',')} N`
                : `No ar (P): ${objectWeight.toFixed(1).replace('.', ',')} N`}
            </text>
          </g>
          <g transform={`translate(${tankLeft + currentTankW / 2}, ${tankBottomY + pan.y + 48})`}>
            <rect x="-155" y="-10" width="310" height="20" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#475569" fontSize="10" fontWeight="600">
              {`Geometria ilustrativa (V = ${(vol_deslocado ?? 0).toFixed(5).replace('.', ',')} m³) — sem dimensões no enunciado`}
            </text>
          </g>
        </g>
      )}

      {/* Vetores (renderizados no topo para nunca ficarem encobertos) */}
      {showFBD && (
        inverseSpecificWeightMode ? (() => {
          const baseLen = 78;
          const pLen = objectWeight > 0 ? baseLen : 0;
          const eLen = objectWeight > 0 ? Math.max(18, baseLen * (buoyancyForce / objectWeight)) : 0;
          const papLen = objectWeight > 0 ? Math.max(18, baseLen * (apparentWeight / objectWeight)) : 0;
          const xOff = Math.min(18, visualWidth * 0.24);
          const pYStart = centerOfMass.y;
          const pYEnd = pYStart + pLen;
          const eYStart = centerOfMass.y;
          const eYEnd = eYStart - eLen;
          const papX = cx + visualWidth / 2 + 28;
          const papYStart = centerOfMass.y - papLen / 2;
          const papYEnd = papYStart + papLen;

          return (
            <g pointerEvents="none">
              {/* Peso Real (P) apontando para baixo */}
              <circle cx={cx - xOff} cy={pYStart} r={3} fill="#ef4444" />
              <line
                x1={cx - xOff}
                y1={pYStart}
                x2={cx - xOff}
                y2={pYEnd}
                stroke="#ef4444"
                strokeWidth="3"
                markerEnd={`url(#${arrowRedId})`}
              />
              <g transform={`translate(${cx - xOff - 84}, ${pYStart + pLen * 0.55})`}>
                <rect x="0" y="-10" width="76" height="20" fill="white" opacity="0.93" stroke="#fca5a5" strokeWidth="1" rx="6" />
                <text x="38" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#dc2626" fontSize="10.5" fontWeight="bold">
                  P = {objectWeight.toFixed(0)} N
                </text>
              </g>

              {showBuoyancyVector && (
                <>
                  {/* Empuxo (E) apontando para cima */}
                  <circle cx={cx + xOff} cy={eYStart} r={3} fill="#16a34a" />
                  <line
                    x1={cx + xOff}
                    y1={eYStart}
                    x2={cx + xOff}
                    y2={eYEnd}
                    stroke="#16a34a"
                    strokeWidth="3"
                    markerEnd={`url(#${arrowGreenId})`}
                  />
                  <g transform={`translate(${cx + xOff + 8}, ${eYEnd - 12})`}>
                    <rect x="0" y="-10" width="76" height="20" fill="white" opacity="0.93" stroke="#86efac" strokeWidth="1" rx="6" />
                    <text x="38" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#15803d" fontSize="10.5" fontWeight="bold">
                      E = {buoyancyForce.toFixed(0)} N
                    </text>
                  </g>

                  {/* Peso Aparente (Pap = P - E) representado como resultante para baixo */}
                  {apparentWeight > 0.01 && (
                    <>
                      <line
                        x1={papX}
                        y1={papYStart}
                        x2={papX}
                        y2={papYEnd}
                        stroke="#2563eb"
                        strokeWidth="3"
                        markerEnd={`url(#${arrowBlueId})`}
                      />
                      <circle cx={papX} cy={papYStart} r={3} fill="#2563eb" />
                      <g transform={`translate(${papX + 8}, ${(papYStart + papYEnd) / 2})`}>
                        <rect x="0" y="-11" width="108" height="22" fill="white" opacity="0.95" stroke="#93c5fd" strokeWidth="1.2" rx="6" />
                        <text x="54" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#1d4ed8" fontSize="10" fontWeight="bold">
                          P<tspan baselineShift="sub" fontSize="7.5">ap</tspan> = {apparentWeight.toFixed(0)} N (Result.)
                        </text>
                      </g>
                    </>
                  )}
                </>
              )}
            </g>
          );
        })() : (
        <g pointerEvents="none">
          {/* Peso (P) - Acima do bloco (ou do peso extra) apontando para baixo */}
          <line
            x1={cx}
            y1={pTargetY - arrowLenP}
            x2={cx}
            y2={pTargetY}
            stroke="#ef4444"
            strokeWidth="3"
            markerEnd={`url(#${arrowRedId})`}
          />
          <circle cx={cx} cy={pTargetY} r={3} fill="#ef4444" />
          <g transform={`translate(${cx + 10}, ${pTargetY - arrowLenP / 2})`}>
            <rect x="0" y="-10" width="24" height="20" fill="white" opacity="0.9" rx="4" />
            <text x="12" y="4" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">
              P
            </text>
          </g>

          {showBuoyancyVector && (
            <>
              {/* Empuxo (E) - Abaixo do bloco (ou do bloco 2) apontando para cima */}
              <line
                x1={cx}
                y1={blockBottomY + arrowLenE}
                x2={cx}
                y2={blockBottomY}
                stroke="#16a34a"
                strokeWidth="3"
                markerEnd={`url(#${arrowGreenId})`}
              />
              <circle cx={cx} cy={blockBottomY} r={3} fill="#16a34a" />
              <g transform={`translate(${cx + 10}, ${blockBottomY + arrowLenE / 2})`}>
                <rect x="0" y="-10" width="24" height="20" fill="white" opacity="0.9" rx="4" />
                <text x="12" y="4" textAnchor="middle" fill="#16a34a" fontSize="12" fontWeight="bold">
                  E
                </text>
              </g>
            </>
          )}
        </g>
        )
      )}
    </g>
    </svg>
    </div>
  );
};
