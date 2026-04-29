import React, { useRef, useState } from 'react';
import { Cuboid, MousePointer2, Maximize, RotateCcw, Box as BoxIcon } from 'lucide-react';
import { ObjectShape } from '../dominio/tipos';
import { SvgDefs } from './SvgDefs';
import { getMaterialPattern } from './visualUtils';

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface TankPoints {
  p1: Point;
  p2: Point;
  p3: Point;
  p4: Point;
  p5: Point;
  p6: Point;
  p7: Point;
  p8: Point;
}

interface Vista3DProps {
  svgWidth: number;
  svgHeight: number;
  currentTankW: number;
  currentTankH: number;
  effectiveHB_px: number;
  tankBottomY: number;
  tankOffsetX: number;
  originalFluidSurfaceY: number;
  fluidSurfaceY: number;
  enableTwoFluids: boolean;
  isSimulating: boolean;
  deltaH_cm: number;
  colorA: string;
  colorB: string;
  isObjectAboveWater: boolean;
  TANK_BORDER_COLOR: string;
  OBJECT_BORDER_COLOR: string;
  objColor: string;
  selectedMaterial: string;
  shape: ObjectShape;
  visualWidth: number;
  visualHeight: number;
  objBottomDistFromTankBottom: number;
  objD_visual: number;
  h_sub_actual?: number;
  objectWeight?: number;
  buoyancyForce?: number;
  showFBD?: boolean;
  centerOfBuoyancyY_visual?: number;
  showCenterOfBuoyancy?: boolean;
  onToggleCenterOfBuoyancy?: () => void;
  visualTankDepth: number;
  twoBlocks?: boolean;
  H2_visual?: number;
  cordLength_visual?: number;
  obj2Color?: string;
  extraWeight?: number;
  shape2?: ObjectShape;
  visualWidth2?: number;
}

type FaceDef = {
  pts: Point[];
  n: { x: number; y: number; z: number };
};

export const Vista3D: React.FC<Vista3DProps> = ({
  svgWidth,
  svgHeight,
  currentTankW,
  currentTankH,
  effectiveHB_px,
  tankBottomY,
  tankOffsetX,
  originalFluidSurfaceY,
  fluidSurfaceY,
  enableTwoFluids,
  isSimulating,
  deltaH_cm,
  colorA,
  colorB,
  isObjectAboveWater,
  TANK_BORDER_COLOR,
  OBJECT_BORDER_COLOR,
  objColor,
  selectedMaterial,
  shape,
  visualWidth,
  visualHeight,
  objBottomDistFromTankBottom,
  objD_visual,
  h_sub_actual = 0,
  objectWeight = 0,
  buoyancyForce = 0,
  showFBD = false,
  centerOfBuoyancyY_visual = 0,
  showCenterOfBuoyancy = true,
  onToggleCenterOfBuoyancy,
  visualTankDepth,
  twoBlocks = false,
  H2_visual = 0,
  cordLength_visual = 0,
  obj2Color = '#475569',
  extraWeight = 0,
}) => {
  // câmera do 3D antigo
  const [rotX, setRotX] = useState<number>(15);
  const [rotY, setRotY] = useState<number>(0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);

  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const cameraAnimRef = useRef<number | null>(null);

  const renderFill = getMaterialPattern(selectedMaterial, objColor);

  const animateCameraReset = () => {
    if (cameraAnimRef.current) cancelAnimationFrame(cameraAnimRef.current);

    const startX = rotX;
    const startY = rotY;
    const startPanX = pan.x;
    const startPanY = pan.y;

    const targetX = 15;
    const nearestTargetY = startY + ((((0 - startY) % 360) + 540) % 360) - 180;

    const startTime = performance.now();
    const duration = 800;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);

      setRotX(startX + (targetX - startX) * ease);
      setRotY(startY + (nearestTargetY - startY) * ease);
      setPan({
        x: startPanX + (0 - startPanX) * ease,
        y: startPanY + (0 - startPanY) * ease,
      });

      if (progress < 1) {
        cameraAnimRef.current = requestAnimationFrame(step);
      } else {
        setRotY(0);
        cameraAnimRef.current = null;
      }
    };

    cameraAnimRef.current = requestAnimationFrame(step);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (cameraAnimRef.current) cancelAnimationFrame(cameraAnimRef.current);

    if (e.button === 2 || e.shiftKey) {
      setIsPanning(true);
    } else {
      setIsDragging(true);
    }

    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - lastMouseRef.current.x;
    const deltaY = e.clientY - lastMouseRef.current.y;

    if (isPanning) {
      setPan((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    } else if (isDragging) {
      setRotY((prev) => prev + deltaX * 0.5);
      setRotX((prev) => Math.max(-90, Math.min(90, prev - deltaY * 0.5)));
    }

    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    setIsPanning(false);
  };

  const project = (x: number, y: number, z: number): Point => {
    const cx0 = tankOffsetX + currentTankW / 2;
    const cy0 = tankBottomY - currentTankH / 2;

    const cx = cx0 + pan.x;
    const cy = cy0 + pan.y;

    const dx = x;
    const dy = y - cy0;
    const dz = z;

    const radX = (rotX * Math.PI) / 180;
    const radY = (rotY * Math.PI) / 180;

    const x1 = dx * Math.cos(radY) - dz * Math.sin(radY);
    const z1 = dx * Math.sin(radY) + dz * Math.cos(radY);
    const y2 = dy * Math.cos(radX) + z1 * Math.sin(radX);
    const z2 = -dy * Math.sin(radX) + z1 * Math.cos(radX);

    return { x: cx + x1, y: cy + y2, z: z2 };
  };

  const rotateVector = (v: { x: number; y: number; z: number }) => {
    const radX = (rotX * Math.PI) / 180;
    const radY = (rotY * Math.PI) / 180;

    const x1 = v.x * Math.cos(radY) - v.z * Math.sin(radY);
    const z1 = v.x * Math.sin(radY) + v.z * Math.cos(radY);
    const y2 = v.y * Math.cos(radX) + z1 * Math.sin(radX);
    const z2 = -v.y * Math.sin(radX) + z1 * Math.cos(radX);

    return { x: x1, y: y2, z: z2 };
  };

  const drawPoly = (
    pts: Point[],
    fill: string,
    opacity: number = 1,
    stroke: string = 'none',
    strokeWidth: number = 0
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

  const getPoints = (
    x: number,
    y_from_bot: number,
    w: number,
    h: number,
    z: number,
    depth: number
  ) => {
    const x_left = x - w / 2;
    const x_right = x + w / 2;

    const s_y_bot = tankBottomY - y_from_bot;
    const s_y_top = tankBottomY - (y_from_bot + h);

    const z_back = z - depth / 2;
    const z_front = z + depth / 2;

    return {
      p1: project(x_left, s_y_top, z_back),
      p2: project(x_right, s_y_top, z_back),
      p3: project(x_right, s_y_bot, z_back),
      p4: project(x_left, s_y_bot, z_back),
      p5: project(x_left, s_y_top, z_front),
      p6: project(x_right, s_y_top, z_front),
      p7: project(x_right, s_y_bot, z_front),
      p8: project(x_left, s_y_bot, z_front),
    };
  };

  const tankPts = getPoints(0, 0, currentTankW, currentTankH, 0, visualTankDepth);

  interface EnvFace {
    id: string;
    pts: Point[];
    n: { x: number; y: number; z: number };
    fill: string;
    opacity: number;
    stroke?: string;
    strokeWidth?: number;
    z?: number;
    isFront?: boolean;
    isTank?: boolean;
  }

  const getBoxFaces = (
    pts: ReturnType<typeof getPoints>,
    fill: string,
    opacity: number,
    stroke: string = 'none',
    strokeWidth: number = 0,
    idPrefix: string = '',
    isTank: boolean = false
  ): EnvFace[] => {
    return [
      { id: `${idPrefix}-back`, pts: [pts.p1, pts.p2, pts.p3, pts.p4], n: { x: 0, y: 0, z: -1 }, fill, opacity, stroke, strokeWidth, isTank },
      { id: `${idPrefix}-front`, pts: [pts.p5, pts.p6, pts.p7, pts.p8], n: { x: 0, y: 0, z: 1 }, fill, opacity, stroke, strokeWidth, isTank },
      { id: `${idPrefix}-left`, pts: [pts.p1, pts.p5, pts.p8, pts.p4], n: { x: -1, y: 0, z: 0 }, fill, opacity, stroke, strokeWidth, isTank },
      { id: `${idPrefix}-right`, pts: [pts.p2, pts.p6, pts.p7, pts.p3], n: { x: 1, y: 0, z: 0 }, fill, opacity, stroke, strokeWidth, isTank },
      { id: `${idPrefix}-bottom`, pts: [pts.p4, pts.p3, pts.p7, pts.p8], n: { x: 0, y: 1, z: 0 }, fill, opacity, stroke, strokeWidth, isTank },
    ];
  };

  const renderEnvironmentFaces = (isFrontGroup: boolean) => {
    const tankFaces = getBoxFaces(tankPts, 'url(#glassGradient)', 0.2, TANK_BORDER_COLOR, 2, 'tank', true);
    
    const ptsB = getPoints(0, 0, currentTankW, effectiveHB_px, 0, visualTankDepth);
    const fluidBFaces = enableTwoFluids ? getBoxFaces(ptsB, 'url(#fluidDepthB)', 1, 'none', 0, 'fluidB') : [];

    const ptsA = getPoints(
      0,
      effectiveHB_px,
      currentTankW,
      tankBottomY - fluidSurfaceY - effectiveHB_px,
      0,
      visualTankDepth
    );
    const fluidAFaces = getBoxFaces(ptsA, 'url(#fluidDepthA)', 1, 'none', 0, 'fluidA');

    const allFaces = [...tankFaces, ...fluidBFaces, ...fluidAFaces];

    const filteredFaces = allFaces.filter(f => {
      const isFront = rotateVector(f.n).z > 0;
      f.isFront = isFront;
      return isFront === isFrontGroup;
    });

    filteredFaces.forEach(f => {
      f.z = f.pts.reduce((acc, p) => acc + (p.z || 0), 0) / 4;
    });

    filteredFaces.sort((a, b) => (a.z || 0) - (b.z || 0));

    return (
      <g pointerEvents="none">
        {filteredFaces.map(f => {
          const fill = (f.isTank && !f.isFront) ? 'none' : f.fill;
          return (
            <g key={f.id}>
              {drawPoly(f.pts, fill, f.opacity, f.stroke, f.strokeWidth)}
            </g>
          );
        })}
      </g>
    );
  };

  const FluidSurfaceBack = () => {
    const depth = visualTankDepth / 2;
    const zCenter = -visualTankDepth / 4;
    const ptsADynamic = getPoints(0, tankBottomY - fluidSurfaceY, currentTankW, 0, zCenter, depth);
    return (
      <g>
        {drawPoly([ptsADynamic.p1, ptsADynamic.p2, ptsADynamic.p6, ptsADynamic.p5], 'url(#ripplePattern)', 1)}
        <line x1={ptsADynamic.p1.x} y1={ptsADynamic.p1.y} x2={ptsADynamic.p2.x} y2={ptsADynamic.p2.y} stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        <line x1={ptsADynamic.p1.x} y1={ptsADynamic.p1.y} x2={ptsADynamic.p5.x} y2={ptsADynamic.p5.y} stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        <line x1={ptsADynamic.p2.x} y1={ptsADynamic.p2.y} x2={ptsADynamic.p6.x} y2={ptsADynamic.p6.y} stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      </g>
    );
  };

  const FluidSurfaceFront = () => {
    const depth = visualTankDepth / 2;
    const zCenter = visualTankDepth / 4;
    const ptsADynamic = getPoints(0, tankBottomY - fluidSurfaceY, currentTankW, 0, zCenter, depth);
    return (
      <g>
        {drawPoly([ptsADynamic.p1, ptsADynamic.p2, ptsADynamic.p6, ptsADynamic.p5], 'url(#ripplePattern)', 1)}
        <line x1={ptsADynamic.p1.x} y1={ptsADynamic.p1.y} x2={ptsADynamic.p5.x} y2={ptsADynamic.p5.y} stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        <line x1={ptsADynamic.p2.x} y1={ptsADynamic.p2.y} x2={ptsADynamic.p6.x} y2={ptsADynamic.p6.y} stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        <line x1={ptsADynamic.p5.x} y1={ptsADynamic.p5.y} x2={ptsADynamic.p6.x} y2={ptsADynamic.p6.y} stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      </g>
    );
  };

  const Object3D = () => {
    const center = project(0, tankBottomY - (objBottomDistFromTankBottom + visualHeight / 2), 0);
    const effectiveYBot = objBottomDistFromTankBottom;
    const objPts = getPoints(0, effectiveYBot, visualWidth, visualHeight, 0, objD_visual);

    const faces: FaceDef[] = [
      { pts: [objPts.p1, objPts.p2, objPts.p3, objPts.p4], n: { x: 0, y: 0, z: -1 } },
      { pts: [objPts.p5, objPts.p6, objPts.p7, objPts.p8], n: { x: 0, y: 0, z: 1 } },
      { pts: [objPts.p1, objPts.p2, objPts.p6, objPts.p5], n: { x: 0, y: 1, z: 0 } },
      { pts: [objPts.p4, objPts.p3, objPts.p7, objPts.p8], n: { x: 0, y: -1, z: 0 } },
      { pts: [objPts.p1, objPts.p5, objPts.p8, objPts.p4], n: { x: -1, y: 0, z: 0 } },
      { pts: [objPts.p2, objPts.p6, objPts.p7, objPts.p3], n: { x: 1, y: 0, z: 0 } },
    ];

    const sortedFaces = faces
      .map((f) => {
        const z = f.pts.reduce((acc, p) => acc + (p.z || 0), 0) / 4;
        const rn = rotateVector(f.n);

        const lx = -0.5;
        const ly = 0.5;
        const lz = -0.8;
        const mag = Math.sqrt(lx * lx + ly * ly + lz * lz);
        const dot = (rn.x * lx + rn.y * ly + rn.z * lz) / mag;
        const shadowOpacity = dot < 0 ? -dot * 0.4 : 0;
        const highlightOpacity = dot > 0 ? dot * 0.3 : 0;

        return { ...f, z, shadowOpacity, highlightOpacity };
      })
      .sort((a, b) => a.z - b.z);

    // Bloco 2
    const obj2Pts = twoBlocks ? getPoints(0, effectiveYBot - cordLength_visual - H2_visual, visualWidth, H2_visual, 0, objD_visual) : null;
    const faces2: FaceDef[] = obj2Pts ? [
      { pts: [obj2Pts.p1, obj2Pts.p2, obj2Pts.p3, obj2Pts.p4], n: { x: 0, y: 0, z: -1 } },
      { pts: [obj2Pts.p5, obj2Pts.p6, obj2Pts.p7, obj2Pts.p8], n: { x: 0, y: 0, z: 1 } },
      { pts: [obj2Pts.p1, obj2Pts.p2, obj2Pts.p6, obj2Pts.p5], n: { x: 0, y: 1, z: 0 } },
      { pts: [obj2Pts.p4, obj2Pts.p3, obj2Pts.p7, obj2Pts.p8], n: { x: 0, y: -1, z: 0 } },
      { pts: [obj2Pts.p1, obj2Pts.p5, obj2Pts.p8, obj2Pts.p4], n: { x: -1, y: 0, z: 0 } },
      { pts: [obj2Pts.p2, obj2Pts.p6, obj2Pts.p7, obj2Pts.p3], n: { x: 1, y: 0, z: 0 } },
    ] : [];

    const sortedFaces2 = faces2
      .map((f) => {
        const z = f.pts.reduce((acc, p) => acc + (p.z || 0), 0) / 4;
        const rn = rotateVector(f.n);
        const lx = -0.5; const ly = 0.5; const lz = -0.8;
        const mag = Math.sqrt(lx * lx + ly * ly + lz * lz);
        const dot = (rn.x * lx + rn.y * ly + rn.z * lz) / mag;
        const shadowOpacity = dot < 0 ? -dot * 0.4 : 0;
        const highlightOpacity = dot > 0 ? dot * 0.3 : 0;
        return { ...f, z, shadowOpacity, highlightOpacity };
      })
      .sort((a, b) => a.z - b.z);

    return (
      <g>
        {/* Cabo */}
        {twoBlocks && (
          <line
            x1={project(0, tankBottomY - effectiveYBot, 0).x}
            y1={project(0, tankBottomY - effectiveYBot, 0).y}
            x2={project(0, tankBottomY - (effectiveYBot - cordLength_visual), 0).x}
            y2={project(0, tankBottomY - (effectiveYBot - cordLength_visual), 0).y}
            stroke="#475569"
            strokeWidth="2"
            strokeDasharray="2,2"
          />
        )}

        {/* Bloco 2 */}
        {twoBlocks && sortedFaces2.map((f, i) => (
          <g key={`b2-${i}`}>
            <path d={`M${f.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')} Z`} fill={obj2Color} stroke={OBJECT_BORDER_COLOR} strokeWidth="1" />
            <path d={`M${f.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')} Z`} fill="black" fillOpacity={f.shadowOpacity} stroke="none" />
            <path d={`M${f.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')} Z`} fill="white" fillOpacity={f.highlightOpacity} stroke="none" />
          </g>
        ))}

        {/* Bloco 1 */}
        {shape === ObjectShape.CUBE ? (
          sortedFaces.map((f, i) => (
            <g key={i}>
              <path
                d={`M${f.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')} Z`}
                fill={objColor}
                stroke="none"
              />
              <path
                d={`M${f.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')} Z`}
                fill={renderFill}
                stroke={OBJECT_BORDER_COLOR}
                strokeWidth="1"
                strokeLinejoin="round"
              />
              <path
                d={`M${f.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')} Z`}
                fill="black"
                fillOpacity={f.shadowOpacity}
                stroke="none"
                pointerEvents="none"
              />
              <path
                d={`M${f.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')} Z`}
                fill="white"
                fillOpacity={f.highlightOpacity}
                stroke="none"
                pointerEvents="none"
              />
            </g>
          ))
        ) : (
          <g>
            <circle
              cx={center.x}
              cy={center.y}
              r={visualWidth / 2}
              fill={objColor}
              stroke="none"
            />
            <circle
              cx={center.x}
              cy={center.y}
              r={visualWidth / 2}
              fill={renderFill}
              stroke={OBJECT_BORDER_COLOR}
              strokeWidth="1"
            />
            <circle
              cx={center.x}
              cy={center.y}
              r={visualWidth / 2}
              fill="url(#sphereLight)"
              stroke="none"
              pointerEvents="none"
            />
          </g>
        )}

        {/* Peso Extra */}
        {extraWeight > 0 && (
          <g transform={`translate(${center.x - 15}, ${project(0, tankBottomY - (effectiveYBot + visualHeight), 0).y - 10})`}>
            <rect width="30" height="10" fill="#334155" rx="2" />
            <text x="15" y="8" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">+{extraWeight}N</text>
          </g>
        )}
      </g>
    );
  };

  const Vectors = () => {
    if (!showFBD) return null;

    const centerTop = project(0, tankBottomY - (objBottomDistFromTankBottom + visualHeight), 0);
    const centerBottom = project(0, tankBottomY - objBottomDistFromTankBottom, 0);
    const centerCB = project(0, centerOfBuoyancyY_visual, 0);

    const arrowLenP = Math.min(120, Math.max(30, objectWeight * 0.005));
    const arrowLenE = Math.min(120, Math.max(30, buoyancyForce * 0.005));

    return (
      <g pointerEvents="none">
        {/* Peso (P) - Acima do bloco apontando para baixo */}
        <line
          x1={centerTop.x}
          y1={centerTop.y - arrowLenP}
          x2={centerTop.x}
          y2={centerTop.y}
          stroke="#ef4444"
          strokeWidth="3"
          markerEnd="url(#arrow-red)"
        />
        <circle cx={centerTop.x} cy={centerTop.y} r={3} fill="#ef4444" />
        <g transform={`translate(${centerTop.x + 10}, ${centerTop.y - arrowLenP / 2})`}>
          <rect x="0" y="-10" width="24" height="20" fill="white" opacity="0.8" rx="4" />
          <text x="12" y="4" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">
            P
          </text>
        </g>

        {h_sub_actual > 0.001 && (
          <>
            {/* Empuxo (E) - Abaixo do bloco apontando para cima */}
            <line
              x1={centerBottom.x}
              y1={centerBottom.y + arrowLenE}
              x2={centerBottom.x}
              y2={centerBottom.y}
              stroke="#16a34a"
              strokeWidth="3"
              markerEnd="url(#arrow-green)"
            />
            <circle cx={centerBottom.x} cy={centerBottom.y} r={3} fill="#16a34a" />
            <g transform={`translate(${centerBottom.x + 10}, ${centerBottom.y + arrowLenE / 2})`}>
              <rect x="0" y="-10" width="24" height="20" fill="white" opacity="0.8" rx="4" />
              <text x="12" y="4" textAnchor="middle" fill="#16a34a" fontSize="12" fontWeight="bold">
                E
              </text>
            </g>
          </>
        )}

        {showCenterOfBuoyancy && h_sub_actual > 0.001 && (
          <circle
            cx={centerCB.x}
            cy={centerCB.y}
            r={6}
            fill="white"
            stroke="#16a34a"
            strokeWidth="2"
          />
        )}
      </g>
    );
  };

  const SceneLayers = () => {
    if (isObjectAboveWater) {
      return (
        <>
          {renderEnvironmentFaces(false)}
          <FluidSurfaceBack />
          <Object3D />
          <FluidSurfaceFront />
          {renderEnvironmentFaces(true)}
        </>
      );
    } else {
      return (
        <>
          {renderEnvironmentFaces(false)}
          <Object3D />
          <FluidSurfaceBack />
          <FluidSurfaceFront />
          {renderEnvironmentFaces(true)}
        </>
      );
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full h-full overflow-hidden transition-colors ${
        isDragging ? (isPanning ? 'cursor-move' : 'cursor-grabbing') : 'cursor-grab'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full blur-[120px] opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.18), transparent 60%)',
          }}
        />
        <div
          className="absolute -bottom-28 -right-28 w-[520px] h-[520px] rounded-full blur-[140px] opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(34,211,238,0.18), transparent 60%)',
          }}
        />
      </div>

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
        height={svgHeight}
        className="overflow-visible"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <SvgDefs colorA={colorA} colorB={colorB} />

        <SceneLayers />

        <Vectors />
      </svg>

      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-slate-400 bg-white/80 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest pointer-events-none backdrop-blur select-none transition-opacity ${
          isDragging ? 'opacity-50' : 'opacity-100'
        }`}
      >
        <span className="flex items-center gap-1">
          <MousePointer2 className="w-3 h-3" /> Girar
        </span>
        <span className="w-px h-3 bg-slate-300"></span>
        <span className="flex items-center gap-1">
          <Maximize className="w-3 h-3" /> Pan (Direito)
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          animateCameraReset();
        }}
        className="absolute bottom-6 left-6 bg-white/90 p-2.5 rounded-full shadow-lg border border-blue-100/70 text-slate-500 hover:text-blue-600 hover:scale-110 transition-all z-30 group"
        title="Resetar Câmera"
      >
        <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
      </button>
    </div>
  );
};
