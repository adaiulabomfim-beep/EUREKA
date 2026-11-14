import React, { useRef, useState } from 'react';
import { MousePointer2 } from 'lucide-react';
import { ObjectShape } from '../dominio/tipos';
import { SvgDefs } from './SvgDefs';
import { getMaterialPattern } from './visualUtils';
import { useSvgPanZoom } from '../../../src/hooks/useSvgPanZoom';
import { ControlesNavegacaoCena } from '../../../src/components/ui/ControlesNavegacaoCena';

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
  inverseSpecificWeightMode?: boolean;
  apparentWeight?: number;
  vol_deslocado?: number;
  floatingEquilibriumMode?: boolean;
  cylinderDiameterCm?: number;
  cylinderHeightCm?: number;
  submergedHeightCm?: number;
  emergedHeightCm?: number;
  interfaceEquilibriumMode?: boolean;
  heightA_cm?: number;
  heightB_cm?: number;
  ratioAtoB?: number;
  E_A?: number;
  E_B?: number;
  bodyRelativeDensity?: number;
  upperFluidRelativeDensity?: number;
  lowerFluidRelativeDensity?: number;
  anchoredBuoyMode?: boolean;
  buoyDiameterM?: number;
  buoyWeightKN?: number;
  cableTensionN?: number;
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
  shape2 = ObjectShape.CUBE,
  visualWidth2 = 0,
  inverseSpecificWeightMode = false,
  apparentWeight = 0,
  vol_deslocado = 0,
  floatingEquilibriumMode = false,
  cylinderDiameterCm = 9,
  cylinderHeightCm = 11,
  submergedHeightCm = 8,
  emergedHeightCm = 3,
  interfaceEquilibriumMode = false,
  heightA_cm = 40.91,
  heightB_cm = 49.09,
  ratioAtoB = 0.8336,
  E_A = 0,
  E_B = 0,
  bodyRelativeDensity = 7.85,
  upperFluidRelativeDensity = 1.0,
  lowerFluidRelativeDensity = 13.56,
  anchoredBuoyMode = false,
  buoyDiameterM = 1.5,
  buoyWeightKN = 8.5,
  cableTensionN = 0,
}) => {
  // câmera do 3D
  const [rotX, setRotX] = useState<number>(15);
  const [rotY, setRotY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const isDraggingRef = useRef(false);
  const isTouchOrbitRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const cameraAnimRef = useRef<number | null>(null);

  const nav = useSvgPanZoom({
    svgWidth,
    svgHeight,
    minZoom: 0.45,
    maxZoom: 4.0,
    allowRightDragPan: true,
  });

  const renderFill = getMaterialPattern(selectedMaterial, objColor);

  const animateCameraReset = () => {
    if (cameraAnimRef.current) cancelAnimationFrame(cameraAnimRef.current);
    nav.resetView();

    const startX = rotX;
    const startY = rotY;

    const targetX = 15;
    const nearestTargetY = startY + ((((0 - startY) % 360) + 540) % 360) - 180;

    const startTime = performance.now();
    const duration = 500;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);

      setRotX(startX + (targetX - startX) * ease);
      setRotY(startY + (nearestTargetY - startY) * ease);

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
    nav.containerHandlers.onMouseDown(e);
    const isPanAction =
      e.button === 1 ||
      e.button === 2 ||
      e.shiftKey ||
      nav.isSpacePressed;

    if (isPanAction) {
      isDraggingRef.current = false;
      setIsDragging(false);
      return;
    }

    if (e.button !== 0) return;
    e.preventDefault();
    if (cameraAnimRef.current) cancelAnimationFrame(cameraAnimRef.current);

    setIsDragging(true);
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - lastMouseRef.current.x;
    const deltaY = e.clientY - lastMouseRef.current.y;

    setRotY((prev) => prev + deltaX * 0.5);
    setRotX((prev) => Math.max(-90, Math.min(90, prev - deltaY * 0.5)));

    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      if (cameraAnimRef.current) cancelAnimationFrame(cameraAnimRef.current);
      isTouchOrbitRef.current = true;
      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      isTouchOrbitRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isTouchOrbitRef.current) {
      const deltaX = e.touches[0].clientX - lastMouseRef.current.x;
      const deltaY = e.touches[0].clientY - lastMouseRef.current.y;
      setRotY((prev) => prev + deltaX * 0.5);
      setRotX((prev) => Math.max(-90, Math.min(90, prev - deltaY * 0.5)));
      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length >= 2) {
      isTouchOrbitRef.current = false;
    }
  };

  const handleTouchEnd = () => {
    isTouchOrbitRef.current = false;
  };

  const project = (x: number, y: number, z: number): Point => {
    const cx = tankOffsetX + currentTankW / 2;
    const cy = tankBottomY - currentTankH / 2;

    const dx = x;
    const dy = y - cy;
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
    strokeWidth: number = 0,
    fillOpacity?: number
  ) => {
    const d = `M${pts.map((p) => `${p.x},${p.y}`).join(' L')} Z`;
    return (
      <path
        d={d}
        fill={fill}
        fillOpacity={fillOpacity !== undefined ? fillOpacity : opacity}
        stroke={stroke}
        strokeOpacity={stroke !== 'none' ? opacity : undefined}
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
    const tankFaces = getBoxFaces(tankPts, 'url(#glassGradient)', 0.55, TANK_BORDER_COLOR, 2, 'tank', true);
    
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
          const strokeOpacity = f.isTank ? (f.isFront ? 0.65 : 0.35) : f.opacity;
          const fillOpacity = f.isTank
            ? (f.isFront ? 0.05 : 0)
            : f.isFront
              ? 0.78
              : f.id.endsWith('-bottom')
                ? 0.42
                : 0.36;

          return (
            <g key={f.id}>
              {drawPoly(f.pts, fill, strokeOpacity, f.stroke, f.strokeWidth, fillOpacity)}
            </g>
          );
        })}
      </g>
    );
  };

  const FluidSurface = () => {
    const ptsADynamic = getPoints(0, tankBottomY - fluidSurfaceY, currentTankW, 0, 0, visualTankDepth);
    return (
      <g>
        {drawPoly([ptsADynamic.p1, ptsADynamic.p2, ptsADynamic.p6, ptsADynamic.p5], 'url(#surfaceGradientA)', 0.80)}
        {drawPoly([ptsADynamic.p1, ptsADynamic.p2, ptsADynamic.p6, ptsADynamic.p5], 'url(#ripplePattern)', 1)}
        <line x1={ptsADynamic.p1.x} y1={ptsADynamic.p1.y} x2={ptsADynamic.p5.x} y2={ptsADynamic.p5.y} stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
        <line x1={ptsADynamic.p2.x} y1={ptsADynamic.p2.y} x2={ptsADynamic.p6.x} y2={ptsADynamic.p6.y} stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
        <line x1={ptsADynamic.p5.x} y1={ptsADynamic.p5.y} x2={ptsADynamic.p6.x} y2={ptsADynamic.p6.y} stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
      </g>
    );
  };

  const getCylinderFaces = (y_from_bot: number, radius: number, h: number, segments: number = 18): FaceDef[] => {
    const s_y_bot = tankBottomY - y_from_bot;
    const s_y_top = tankBottomY - (y_from_bot + h);
    const topPts: Point[] = [];
    const botPts: Point[] = [];
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * 2 * Math.PI;
      const cx = radius * Math.cos(a);
      const cz = radius * Math.sin(a);
      topPts.push(project(cx, s_y_top, cz));
      botPts.push(project(cx, s_y_bot, cz));
    }
    const cylFaces: FaceDef[] = [];
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      const aMid = ((i + 0.5) / segments) * 2 * Math.PI;
      cylFaces.push({
        pts: [topPts[i], topPts[next], botPts[next], botPts[i]],
        n: { x: Math.cos(aMid), y: 0, z: Math.sin(aMid) },
      });
    }
    cylFaces.push({ pts: topPts, n: { x: 0, y: 1, z: 0 } });
    cylFaces.push({ pts: [...botPts].reverse(), n: { x: 0, y: -1, z: 0 } });
    return cylFaces;
  };

  const Object3D = () => {
    const center = project(0, tankBottomY - (objBottomDistFromTankBottom + visualHeight / 2), 0);
    const effectiveYBot = objBottomDistFromTankBottom;
    const objPts = getPoints(0, effectiveYBot, visualWidth, visualHeight, 0, objD_visual);

    const faces: FaceDef[] =
      shape === ObjectShape.CYLINDER
        ? getCylinderFaces(effectiveYBot, visualWidth / 2, visualHeight)
        : [
            { pts: [objPts.p1, objPts.p2, objPts.p3, objPts.p4], n: { x: 0, y: 0, z: -1 } },
            { pts: [objPts.p5, objPts.p6, objPts.p7, objPts.p8], n: { x: 0, y: 0, z: 1 } },
            { pts: [objPts.p1, objPts.p2, objPts.p6, objPts.p5], n: { x: 0, y: 1, z: 0 } },
            { pts: [objPts.p4, objPts.p3, objPts.p7, objPts.p8], n: { x: 0, y: -1, z: 0 } },
            { pts: [objPts.p1, objPts.p5, objPts.p8, objPts.p4], n: { x: -1, y: 0, z: 0 } },
            { pts: [objPts.p2, objPts.p6, objPts.p7, objPts.p3], n: { x: 1, y: 0, z: 0 } },
          ];

    const sortedFaces = faces
      .map((f) => {
        const z = f.pts.reduce((acc, p) => acc + (p.z || 0), 0) / f.pts.length;
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
    const w2 = visualWidth2 > 0 ? visualWidth2 : visualWidth;
    const yBot2 = effectiveYBot - cordLength_visual - H2_visual;
    const center2 = project(0, tankBottomY - (yBot2 + H2_visual / 2), 0);
    const obj2Pts = twoBlocks ? getPoints(0, yBot2, w2, H2_visual, 0, w2) : null;
    const faces2: FaceDef[] = obj2Pts
      ? shape2 === ObjectShape.CYLINDER
        ? getCylinderFaces(yBot2, w2 / 2, H2_visual)
        : [
            { pts: [obj2Pts.p1, obj2Pts.p2, obj2Pts.p3, obj2Pts.p4], n: { x: 0, y: 0, z: -1 } },
            { pts: [obj2Pts.p5, obj2Pts.p6, obj2Pts.p7, obj2Pts.p8], n: { x: 0, y: 0, z: 1 } },
            { pts: [obj2Pts.p1, obj2Pts.p2, obj2Pts.p6, obj2Pts.p5], n: { x: 0, y: 1, z: 0 } },
            { pts: [obj2Pts.p4, obj2Pts.p3, obj2Pts.p7, obj2Pts.p8], n: { x: 0, y: -1, z: 0 } },
            { pts: [obj2Pts.p1, obj2Pts.p5, obj2Pts.p8, obj2Pts.p4], n: { x: -1, y: 0, z: 0 } },
            { pts: [obj2Pts.p2, obj2Pts.p6, obj2Pts.p7, obj2Pts.p3], n: { x: 1, y: 0, z: 0 } },
          ]
      : [];

    const sortedFaces2 = faces2
      .map((f) => {
        const z = f.pts.reduce((acc, p) => acc + (p.z || 0), 0) / f.pts.length;
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
        {twoBlocks && (shape2 === ObjectShape.SPHERE ? (
          <g>
            <circle cx={center2.x} cy={center2.y} r={w2 / 2} fill={obj2Color} stroke={OBJECT_BORDER_COLOR} strokeWidth="1" />
            <circle cx={center2.x} cy={center2.y} r={w2 / 2} fill="url(#sphereLight)" stroke="none" pointerEvents="none" />
          </g>
        ) : (
          sortedFaces2.map((f, i) => (
            <g key={`b2-${i}`}>
              <path d={`M${f.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')} Z`} fill={obj2Color} stroke={OBJECT_BORDER_COLOR} strokeWidth={shape2 === ObjectShape.CYLINDER && f.pts.length === 4 ? "0.4" : "1"} />
              <path d={`M${f.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')} Z`} fill="black" fillOpacity={f.shadowOpacity} stroke="none" />
              <path d={`M${f.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')} Z`} fill="white" fillOpacity={f.highlightOpacity} stroke="none" />
            </g>
          ))
        ))}

        {/* Bloco 1 */}
        {shape === ObjectShape.SPHERE ? (
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
        ) : (
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
                strokeWidth={shape === ObjectShape.CYLINDER && f.pts.length === 4 ? "0.4" : "1"}
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
        )}

        {/* Peso Extra */}
        {extraWeight > 0 && (() => {
          const extraWeightHeight = 18;
          const extraWeightLabel = extraWeight >= 1000 ? `+${(extraWeight / 1000).toFixed(2)} kN` : `+${extraWeight} N`;
          const extraWeightWidth = Math.max(48, extraWeightLabel.length * 7.5 + 14);
          const topY = project(0, tankBottomY - (effectiveYBot + visualHeight), 0).y;
          return (
            <g transform={`translate(${center.x - extraWeightWidth / 2}, ${topY - extraWeightHeight})`}>
              <rect width={extraWeightWidth} height={extraWeightHeight} fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" rx="4" />
              <text x={extraWeightWidth / 2} y={extraWeightHeight / 2 + 3.5} textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="monospace">
                {extraWeightLabel}
              </text>
            </g>
          );
        })()}
      </g>
    );
  };

  const Vectors = () => {
    if (anchoredBuoyMode) {
      const topCenter = project(0, tankBottomY - (objBottomDistFromTankBottom + visualHeight), 0);
      const botCenter = project(0, tankBottomY - objBottomDistFromTankBottom, 0);
      const floorCenter = project(0, tankBottomY, 0);
      const cgPt = project(0, tankBottomY - (objBottomDistFromTankBottom + visualHeight / 2), 0);
      const topRight = project(
        visualWidth / 2,
        tankBottomY - (objBottomDistFromTankBottom + visualHeight),
        0
      );
      const dimXRight = Math.max(topRight.x, cgPt.x + visualWidth / 2) + 38;
      const wX = cgPt.x - 16;
      const eX = cgPt.x + 16;
      const tX = botCenter.x + 8;

      return (
        <g pointerEvents="none">
          {/* Cabo de ancoragem vertical até o fundo */}
          <line x1={botCenter.x} y1={botCenter.y} x2={floorCenter.x} y2={floorCenter.y - 4} stroke="#1e293b" strokeWidth="2.8" />
          <circle cx={botCenter.x} cy={botCenter.y} r={3.5} fill="#334155" stroke="#ffffff" strokeWidth="1" />
          <rect x={floorCenter.x - 14} y={floorCenter.y - 5} width={28} height={5} rx="2" fill="#334155" />

          {/* Rótulo do cabo */}
          <g transform={`translate(${botCenter.x - 62}, ${(botCenter.y + floorCenter.y) / 2})`}>
            <rect x="-46" y="-10" width="92" height="20" rx="5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" opacity="0.94" />
            <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#334155" fontSize="9.5" fontWeight="bold">
              Cabo de Ancoragem
            </text>
          </g>

          {/* Cota D = 1,50 m */}
          <line x1={topCenter.x} y1={topCenter.y} x2={dimXRight} y2={topCenter.y} stroke="#334155" strokeWidth="1" strokeDasharray="3,2" />
          <line x1={botCenter.x} y1={botCenter.y} x2={dimXRight} y2={botCenter.y} stroke="#334155" strokeWidth="1" strokeDasharray="3,2" />
          <line x1={dimXRight} y1={topCenter.y} x2={dimXRight} y2={botCenter.y} stroke="#1e293b" strokeWidth="1.5" />
          <g transform={`translate(${dimXRight + 46}, ${cgPt.y})`}>
            <rect x="-42" y="-11" width="84" height="22" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" opacity="0.95" />
            <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#0f172a" fontSize="10.5" fontWeight="bold" fontFamily="monospace">
              {`D = ${buoyDiameterM.toFixed(2).replace('.', ',')} m`}
            </text>
          </g>

          {/* CG ≡ CE */}
          <circle cx={cgPt.x} cy={cgPt.y} r={4} fill="#0f172a" stroke="#ffffff" strokeWidth="1.4" />
          <g transform={`translate(${cgPt.x - visualWidth / 2 - 38}, ${cgPt.y})`}>
            <rect x="-32" y="-10" width="64" height="20" rx="5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" opacity="0.94" />
            <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#1e293b" fontSize="9.5" fontWeight="bold">
              CG ≡ CE
            </text>
          </g>

          {isSimulating && showFBD && (
            <>
              <circle cx={eX} cy={cgPt.y} r={4} fill="#16a34a" stroke="#ffffff" strokeWidth="1.4" />
              <line x1={eX} y1={cgPt.y} x2={eX} y2={cgPt.y - 68} stroke="#16a34a" strokeWidth="3" markerEnd="url(#arrow-green-3d)" />
              <g transform={`translate(${eX + 46}, ${cgPt.y - 78})`}>
                <rect x="-48" y="-10" width="96" height="20" rx="6" fill="#ffffff" stroke="#86efac" strokeWidth="1" opacity="0.95" />
                <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#15803d" fontSize="10" fontWeight="bold">
                  {`E = ${(buoyancyForce / 1000).toFixed(2).replace('.', ',')} kN`}
                </text>
              </g>

              <circle cx={wX} cy={cgPt.y} r={4} fill="#ef4444" stroke="#ffffff" strokeWidth="1.4" />
              <line x1={wX} y1={cgPt.y} x2={wX} y2={cgPt.y + 44} stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrow-red-3d)" />
              <g transform={`translate(${wX - 50}, ${cgPt.y + 54})`}>
                <rect x="-46" y="-10" width="92" height="20" rx="6" fill="#ffffff" stroke="#fca5a5" strokeWidth="1" opacity="0.95" />
                <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#dc2626" fontSize="10" fontWeight="bold">
                  {`W = ${buoyWeightKN.toFixed(2).replace('.', ',')} kN`}
                </text>
              </g>

              <circle cx={tX} cy={botCenter.y} r={4} fill="#2563eb" stroke="#ffffff" strokeWidth="1.4" />
              <line x1={tX} y1={botCenter.y} x2={tX} y2={botCenter.y + 48} stroke="#2563eb" strokeWidth="3" markerEnd="url(#arrow-blue-3d)" />
              <g transform={`translate(${tX + 52}, ${botCenter.y + 32})`}>
                <rect x="-46" y="-10" width="92" height="20" rx="6" fill="#ffffff" stroke="#93c5fd" strokeWidth="1" opacity="0.95" />
                <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#1d4ed8" fontSize="10" fontWeight="bold">
                  {`T = ${(cableTensionN / 1000).toFixed(2).replace('.', ',')} kN`}
                </text>
              </g>
            </>
          )}

          {isSimulating && (
            <g transform={`translate(${tankOffsetX + currentTankW / 2}, ${tankBottomY + 46})`}>
              <rect x="-180" y="-11" width="360" height="22" rx="11" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.2" opacity="0.98" />
              <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#1e3a8a" fontSize="10.5" fontWeight="bold" fontFamily="monospace">
                {`Equilíbrio: E = W + T  |  Tração no cabo T = ${(cableTensionN / 1000).toFixed(2).replace('.', ',')} kN`}
              </text>
            </g>
          )}
        </g>
      );
    }

    if (interfaceEquilibriumMode) {
      const topCenter = project(0, tankBottomY - (objBottomDistFromTankBottom + visualHeight), 0);
      const botCenter = project(0, tankBottomY - objBottomDistFromTankBottom, 0);
      const interfaceCenter = project(0, tankBottomY - effectiveHB_px, 0);
      const cgPt = project(0, tankBottomY - (objBottomDistFromTankBottom + visualHeight / 2), 0);
      const ceWaterPt = project(
        0,
        (tankBottomY - (objBottomDistFromTankBottom + visualHeight) + (tankBottomY - effectiveHB_px)) / 2,
        0
      );
      const ceMercPt = project(
        0,
        (tankBottomY - effectiveHB_px + (tankBottomY - objBottomDistFromTankBottom)) / 2,
        0
      );
      const topRight = project(
        visualWidth / 2,
        tankBottomY - (objBottomDistFromTankBottom + visualHeight),
        0
      );

      const dimXRight = Math.max(topRight.x, botCenter.x + visualWidth / 2) + 38;
      const fmtRel = (v: number) => v.toFixed(2).replace('.', ',');

      const pX = cgPt.x - 16;
      const eWaterX = ceWaterPt.x + 16;
      const eMercX = ceMercPt.x + 6;

      return (
        <g pointerEvents="none">
          {/* Rótulo do Bloco de Aço */}
          <g transform={`translate(${topCenter.x}, ${topCenter.y - 20})`}>
            <rect x="-66" y="-10" width="132" height="20" rx="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" opacity="0.94" />
            <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#f8fafc" fontSize="10.5" fontWeight="bold">
              {`Aço (d = ${fmtRel(bodyRelativeDensity)})`}
            </text>
          </g>

          {/* Cota a (Água) */}
          <line x1={topRight.x} y1={topCenter.y} x2={dimXRight} y2={topCenter.y} stroke="#0284c7" strokeWidth="1" strokeDasharray="3,2" />
          <line x1={topRight.x} y1={interfaceCenter.y} x2={dimXRight} y2={interfaceCenter.y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3,2" />
          <line x1={dimXRight} y1={topCenter.y} x2={dimXRight} y2={interfaceCenter.y} stroke="#0284c7" strokeWidth="1.5" />
          {isSimulating ? (
            <g transform={`translate(${dimXRight + 50}, ${(topCenter.y + interfaceCenter.y) / 2})`}>
              <rect x="-44" y="-13" width="88" height="26" rx="6" fill="#f0f9ff" stroke="#38bdf8" strokeWidth="1" opacity="0.95" />
              <text x="0" y="-3.5" textAnchor="middle" dominantBaseline="central" fill="#0369a1" fontSize="11" fontWeight="bold" fontFamily="monospace">
                {`a = ${heightA_cm.toFixed(1).replace('.', ',')} cm`}
              </text>
              <text x="0" y="7.5" textAnchor="middle" dominantBaseline="central" fill="#0284c7" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                {`d = ${fmtRel(upperFluidRelativeDensity)}`}
              </text>
            </g>
          ) : (
            <g transform={`translate(${dimXRight + 24}, ${(topCenter.y + interfaceCenter.y) / 2})`}>
              <rect x="-14" y="-11" width="28" height="22" rx="6" fill="#f0f9ff" stroke="#38bdf8" strokeWidth="1" opacity="0.95" />
              <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#0369a1" fontSize="12" fontWeight="bold" fontFamily="monospace">
                a
              </text>
            </g>
          )}

          {/* Cota b (Mercúrio) */}
          <line x1={topRight.x} y1={interfaceCenter.y} x2={dimXRight} y2={interfaceCenter.y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3,2" />
          <line x1={topRight.x} y1={botCenter.y} x2={dimXRight} y2={botCenter.y} stroke="#475569" strokeWidth="1" strokeDasharray="3,2" />
          <line x1={dimXRight} y1={interfaceCenter.y} x2={dimXRight} y2={botCenter.y} stroke="#334155" strokeWidth="1.5" />
          {isSimulating ? (
            <g transform={`translate(${dimXRight + 50}, ${(interfaceCenter.y + botCenter.y) / 2})`}>
              <rect x="-44" y="-13" width="88" height="26" rx="6" fill="#f8fafc" stroke="#64748b" strokeWidth="1" opacity="0.95" />
              <text x="0" y="-3.5" textAnchor="middle" dominantBaseline="central" fill="#1e293b" fontSize="11" fontWeight="bold" fontFamily="monospace">
                {`b = ${heightB_cm.toFixed(1).replace('.', ',')} cm`}
              </text>
              <text x="0" y="7.5" textAnchor="middle" dominantBaseline="central" fill="#475569" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                {`d = ${fmtRel(lowerFluidRelativeDensity)}`}
              </text>
            </g>
          ) : (
            <g transform={`translate(${dimXRight + 24}, ${(interfaceCenter.y + botCenter.y) / 2})`}>
              <rect x="-14" y="-11" width="28" height="22" rx="6" fill="#f8fafc" stroke="#64748b" strokeWidth="1" opacity="0.95" />
              <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#1e293b" fontSize="12" fontWeight="bold" fontFamily="monospace">
                b
              </text>
            </g>
          )}

          {isSimulating && showFBD && (
            <>
              <circle cx={pX} cy={cgPt.y} r={4} fill="#ef4444" stroke="#ffffff" strokeWidth="1.4" />
              <line x1={pX} y1={cgPt.y} x2={pX} y2={cgPt.y + 58} stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrow-red-3d)" />
              <g transform={`translate(${pX - 48}, ${cgPt.y + 68})`}>
                <rect x="-44" y="-10" width="88" height="20" rx="6" fill="#ffffff" stroke="#fca5a5" strokeWidth="1" opacity="0.94" />
                <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#dc2626" fontSize="10" fontWeight="bold">
                  {`P = ${(objectWeight / 1000).toFixed(2).replace('.', ',')} kN`}
                </text>
              </g>

              <circle cx={eWaterX} cy={ceWaterPt.y} r={4} fill="#2563eb" stroke="#ffffff" strokeWidth="1.4" />
              <line x1={eWaterX} y1={ceWaterPt.y} x2={eWaterX} y2={ceWaterPt.y - 44} stroke="#2563eb" strokeWidth="3" markerEnd="url(#arrow-blue-3d)" />
              <g transform={`translate(${eWaterX + 46}, ${ceWaterPt.y - 54})`}>
                <rect x="-48" y="-10" width="96" height="20" rx="6" fill="#ffffff" stroke="#93c5fd" strokeWidth="1" opacity="0.94" />
                <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#1d4ed8" fontSize="10" fontWeight="bold">
                  {`E_água = ${(E_A / 1000).toFixed(2).replace('.', ',')} kN`}
                </text>
              </g>

              <circle cx={eMercX} cy={ceMercPt.y} r={4} fill="#16a34a" stroke="#ffffff" strokeWidth="1.4" />
              <line x1={eMercX} y1={ceMercPt.y} x2={eMercX} y2={ceMercPt.y - 60} stroke="#16a34a" strokeWidth="3" markerEnd="url(#arrow-green-3d)" />
              <g transform={`translate(${eMercX + 52}, ${ceMercPt.y - 50})`}>
                <rect x="-52" y="-10" width="104" height="20" rx="6" fill="#ffffff" stroke="#86efac" strokeWidth="1" opacity="0.94" />
                <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#15803d" fontSize="10" fontWeight="bold">
                  {`E_merc = ${(E_B / 1000).toFixed(2).replace('.', ',')} kN`}
                </text>
              </g>
            </>
          )}

          {isSimulating && (
            <g transform={`translate(${tankOffsetX + currentTankW / 2}, ${tankBottomY + 46})`}>
              <rect x="-175" y="-11" width="350" height="22" rx="11" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.2" opacity="0.98" />
              <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#1e3a8a" fontSize="10.5" fontWeight="bold" fontFamily="monospace">
                {`Equilíbrio: P = E_água + E_mercúrio  |  Razão a / b = ${ratioAtoB.toFixed(3).replace('.', ',')}`}
              </text>
            </g>
          )}
        </g>
      );
    }

    if (floatingEquilibriumMode) {
      const topCenter = project(0, tankBottomY - (objBottomDistFromTankBottom + visualHeight), 0);
      const botCenter = project(0, tankBottomY - objBottomDistFromTankBottom, 0);
      const waterCenter = project(0, fluidSurfaceY, 0);
      const cgPt = project(0, tankBottomY - (objBottomDistFromTankBottom + visualHeight / 2), 0);
      const cePt = project(0, centerOfBuoyancyY_visual, 0);
      const topLeft = project(-visualWidth / 2, tankBottomY - (objBottomDistFromTankBottom + visualHeight), 0);
      const topRight = project(visualWidth / 2, tankBottomY - (objBottomDistFromTankBottom + visualHeight), 0);

      const vecLen = 64;
      const xOff = Math.min(18, Math.max(10, visualWidth * 0.16));
      const pX = cgPt.x - xOff;
      const eX = cePt.x + xOff;
      const dimXRight = Math.max(topRight.x, botCenter.x + visualWidth / 2) + 38;
      const dimYTop = Math.min(topLeft.y, topRight.y) - 24;
      const fmtCm = (val: number) =>
        Number.isInteger(val) ? `${val} cm` : `${val.toFixed(1).replace('.', ',')} cm`;

      return (
        <g pointerEvents="none">
          {/* Cota Diâmetro D = 9 cm */}
          <line x1={topLeft.x} y1={topLeft.y} x2={topLeft.x} y2={dimYTop} stroke="#334155" strokeWidth="1" strokeDasharray="3,2" />
          <line x1={topRight.x} y1={topRight.y} x2={topRight.x} y2={dimYTop} stroke="#334155" strokeWidth="1" strokeDasharray="3,2" />
          <line x1={topLeft.x} y1={dimYTop} x2={topRight.x} y2={dimYTop} stroke="#1e293b" strokeWidth="1.4" />
          <g transform={`translate(${(topLeft.x + topRight.x) / 2}, ${dimYTop - 13})`}>
            <rect x="-38" y="-10" width="76" height="20" rx="5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" opacity="0.95" />
            <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#0f172a" fontSize="11" fontWeight="bold" fontFamily="monospace">
              {`D = ${fmtCm(cylinderDiameterCm)}`}
            </text>
          </g>

          {/* Cota Altura Emersa (3 cm) */}
          {emergedHeightCm > 0.05 && (
            <>
              <line x1={topRight.x} y1={topCenter.y} x2={dimXRight} y2={topCenter.y} stroke="#475569" strokeWidth="1" strokeDasharray="3,2" />
              <line x1={topRight.x} y1={waterCenter.y} x2={dimXRight} y2={waterCenter.y} stroke="#0284c7" strokeWidth="1" strokeDasharray="3,2" />
              <line x1={dimXRight} y1={topCenter.y} x2={dimXRight} y2={waterCenter.y} stroke="#d97706" strokeWidth="1.4" />
              <g transform={`translate(${dimXRight + 38}, ${(topCenter.y + waterCenter.y) / 2})`}>
                <rect x="-30" y="-10" width="60" height="20" rx="5" fill="#fffbeb" stroke="#fcd34d" strokeWidth="1" opacity="0.95" />
                <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#b45309" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  {fmtCm(emergedHeightCm)}
                </text>
              </g>
            </>
          )}

          {/* Cota Altura Submersa (8 cm) */}
          {submergedHeightCm > 0.05 && (
            <>
              <line x1={topRight.x} y1={waterCenter.y} x2={dimXRight} y2={waterCenter.y} stroke="#0284c7" strokeWidth="1" strokeDasharray="3,2" />
              <line x1={topRight.x} y1={botCenter.y} x2={dimXRight} y2={botCenter.y} stroke="#475569" strokeWidth="1" strokeDasharray="3,2" />
              <line x1={dimXRight} y1={waterCenter.y} x2={dimXRight} y2={botCenter.y} stroke="#0284c7" strokeWidth="1.4" />
              <g transform={`translate(${dimXRight + 38}, ${(waterCenter.y + botCenter.y) / 2})`}>
                <rect x="-30" y="-10" width="60" height="20" rx="5" fill="#f0f9ff" stroke="#7dd3fc" strokeWidth="1" opacity="0.95" />
                <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#0369a1" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  {fmtCm(submergedHeightCm)}
                </text>
              </g>
            </>
          )}

          {showFBD && (
            <>
              <circle cx={pX} cy={cgPt.y} r={4} fill="#ef4444" stroke="#ffffff" strokeWidth="1.4" />
              <line x1={pX} y1={cgPt.y} x2={pX} y2={cgPt.y + vecLen} stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrow-red-3d)" />
              <g transform={`translate(${pX - 50}, ${cgPt.y + vecLen + 12})`}>
                <rect x="-46" y="-10" width="92" height="20" fill="white" opacity="0.94" stroke="#fca5a5" strokeWidth="1" rx="6" />
                <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#dc2626" fontSize="10.5" fontWeight="bold">
                  {isSimulating ? `P = ${objectWeight.toFixed(2).replace('.', ',')} N` : 'P = ?'}
                </text>
              </g>

              {showCenterOfBuoyancy && (
                <circle cx={eX} cy={cePt.y} r={4} fill="#16a34a" stroke="#ffffff" strokeWidth="1.4" />
              )}
              <line x1={eX} y1={cePt.y} x2={eX} y2={cePt.y - vecLen} stroke="#16a34a" strokeWidth="3" markerEnd="url(#arrow-green-3d)" />
              <g transform={`translate(${eX + 50}, ${cePt.y - vecLen - 12})`}>
                <rect x="-46" y="-10" width="92" height="20" fill="white" opacity="0.94" stroke="#86efac" strokeWidth="1" rx="6" />
                <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#15803d" fontSize="10.5" fontWeight="bold">
                  {isSimulating ? `E = ${buoyancyForce.toFixed(2).replace('.', ',')} N` : 'E = γ · Vsub'}
                </text>
              </g>
            </>
          )}
        </g>
      );
    }

    if (inverseSpecificWeightMode) {
      const centerTop = project(0, tankBottomY - (objBottomDistFromTankBottom + visualHeight), 0);
      const centerMid = project(0, tankBottomY - (objBottomDistFromTankBottom + visualHeight / 2), 0);
      const hookPt = project(0, tankBottomY - currentTankH - 42, 0);
      const baseLen = 78;
      const pLen = objectWeight > 0 ? baseLen : 0;
      const eLen = objectWeight > 0 ? Math.max(18, baseLen * (buoyancyForce / objectWeight)) : 0;
      const papLen = objectWeight > 0 ? Math.max(18, baseLen * (apparentWeight / objectWeight)) : 0;
      const xOff = Math.min(18, visualWidth * 0.24);
      const pStart = { x: centerMid.x - xOff, y: centerMid.y };
      const eStart = { x: centerMid.x + xOff, y: centerMid.y };
      const papX = centerMid.x + visualWidth / 2 + 32;
      const papYStart = centerMid.y - papLen / 2;
      const papYEnd = papYStart + papLen;

      return (
        <g pointerEvents="none">
          {/* Cabo e Dinamômetro */}
          <line x1={hookPt.x - 16} y1={hookPt.y} x2={hookPt.x + 16} y2={hookPt.y} stroke="#334155" strokeWidth="3" strokeLinecap="round" />
          <line x1={hookPt.x} y1={hookPt.y} x2={centerTop.x} y2={centerTop.y} stroke="#475569" strokeWidth="1.8" strokeDasharray="4,2" />
          <circle cx={centerTop.x} cy={centerTop.y} r={3.5} fill="#475569" />
          <g transform={`translate(${hookPt.x}, ${hookPt.y + 18})`}>
            <rect x="-72" y="-11" width="144" height="22" rx="11" fill="#ffffff" stroke="#2563eb" strokeWidth="1.4" opacity="0.96" />
            <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#1e3a8a" fontSize="10.5" fontWeight="bold">
              {isSimulating
                ? `Dinamômetro: ${apparentWeight.toFixed(1).replace('.', ',')} N`
                : `No ar (P): ${objectWeight.toFixed(1).replace('.', ',')} N`}
            </text>
          </g>

          {showFBD && (
            <>
              <circle cx={pStart.x} cy={pStart.y} r={3} fill="#ef4444" />
              <line x1={pStart.x} y1={pStart.y} x2={pStart.x} y2={pStart.y + pLen} stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrow-red-3d)" />
              <g transform={`translate(${pStart.x - 84}, ${pStart.y + pLen * 0.55})`}>
                <rect x="0" y="-10" width="76" height="20" fill="white" opacity="0.93" stroke="#fca5a5" strokeWidth="1" rx="6" />
                <text x="38" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#dc2626" fontSize="10.5" fontWeight="bold">
                  P = {objectWeight.toFixed(0)} N
                </text>
              </g>

              {isSimulating && h_sub_actual > 0.001 && (
                <>
                  <circle cx={eStart.x} cy={eStart.y} r={3} fill="#16a34a" />
                  <line x1={eStart.x} y1={eStart.y} x2={eStart.x} y2={eStart.y - eLen} stroke="#16a34a" strokeWidth="3" markerEnd="url(#arrow-green-3d)" />
                  <g transform={`translate(${eStart.x + 8}, ${eStart.y - eLen - 12})`}>
                    <rect x="0" y="-10" width="76" height="20" fill="white" opacity="0.93" stroke="#86efac" strokeWidth="1" rx="6" />
                    <text x="38" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#15803d" fontSize="10.5" fontWeight="bold">
                      E = {buoyancyForce.toFixed(0)} N
                    </text>
                  </g>

                  {apparentWeight > 0.01 && (
                    <>
                      <circle cx={papX} cy={papYStart} r={3} fill="#2563eb" />
                      <line x1={papX} y1={papYStart} x2={papX} y2={papYEnd} stroke="#2563eb" strokeWidth="3" markerEnd="url(#arrow-blue-3d)" />
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
            </>
          )}

          <g transform={`translate(${tankOffsetX + currentTankW / 2}, ${tankBottomY + 46})`}>
            <rect x="-155" y="-10" width="310" height="20" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#475569" fontSize="10" fontWeight="600">
              {`Geometria ilustrativa (V = ${vol_deslocado.toFixed(5).replace('.', ',')} m³) — sem dimensões no enunciado`}
            </text>
          </g>
        </g>
      );
    }

    if (!showFBD) return null;

    const centerTop = project(0, tankBottomY - (objBottomDistFromTankBottom + visualHeight), 0);
    const pTargetY = centerTop.y - (extraWeight > 0 ? 18 : 0);
    const lowestDistFromBottom = twoBlocks
      ? Math.max(0, objBottomDistFromTankBottom - cordLength_visual - H2_visual)
      : objBottomDistFromTankBottom;
    const centerBottom = project(0, tankBottomY - lowestDistFromBottom, 0);
    const centerCB = project(0, centerOfBuoyancyY_visual, 0);

    const arrowLenP = Math.min(120, Math.max(30, objectWeight * 0.005));
    const arrowLenE = Math.min(120, Math.max(30, buoyancyForce * 0.005));

    return (
      <g pointerEvents="none">
        {/* Peso (P) - Acima do bloco apontando para baixo */}
        <line
          x1={centerTop.x}
          y1={pTargetY - arrowLenP}
          x2={centerTop.x}
          y2={pTargetY}
          stroke="#ef4444"
          strokeWidth="3"
          markerEnd="url(#arrow-red)"
        />
        <circle cx={centerTop.x} cy={pTargetY} r={3} fill="#ef4444" />
        <g transform={`translate(${centerTop.x + 10}, ${pTargetY - arrowLenP / 2})`}>
          <rect x="0" y="-10" width="24" height="20" fill="white" opacity="0.9" rx="4" />
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
    return (
      <>
        {renderEnvironmentFaces(false)}
        {!isObjectAboveWater && <Object3D />}
        <FluidSurface />
        {isObjectAboveWater && <Object3D />}
        {renderEnvironmentFaces(true)}
      </>
    );
  };

  return (
    <div
      ref={nav.containerRef}
      className={`relative flex flex-col items-center justify-center w-full h-full overflow-hidden transition-colors select-none ${
        nav.isPanning
          ? 'cursor-move'
          : isDragging
            ? 'cursor-grabbing'
            : nav.isSpacePressed
              ? 'cursor-grab'
              : 'cursor-grab'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onAuxClick={nav.containerHandlers.onAuxClick}
      onContextMenu={nav.containerHandlers.onContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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

      <svg
        ref={nav.svgRef}
        width="100%"
        height={svgHeight}
        className="overflow-visible touch-none"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <SvgDefs colorA={colorA} colorB={colorB} />
        <defs>
          <marker id="arrow-red-3d" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
            <path d="M0,0 L6,2 L0,4 Z" fill="#ef4444" />
          </marker>
          <marker id="arrow-green-3d" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
            <path d="M0,0 L6,2 L0,4 Z" fill="#16a34a" />
          </marker>
          <marker id="arrow-blue-3d" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
            <path d="M0,0 L6,2 L0,4 Z" fill="#2563eb" />
          </marker>
        </defs>

        <g transform={`translate(${nav.pan.x}, ${nav.pan.y}) scale(${nav.zoom})`}>
          <SceneLayers />

          <Vectors />
        </g>
      </svg>

      <div
        className={`hidden sm:flex absolute bottom-6 left-1/2 -translate-x-1/2 items-center gap-3 text-slate-400 bg-white/80 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest pointer-events-none backdrop-blur select-none transition-opacity whitespace-nowrap ${
          isDragging || nav.isPanning ? 'opacity-50' : 'opacity-100'
        }`}
      >
        <span className="flex items-center gap-1">
          <MousePointer2 className="w-3 h-3" /> Girar
        </span>
        <span className="w-px h-3 bg-slate-300" />
        <span>Pan (dir./meio)</span>
        <span className="w-px h-3 bg-slate-300" />
        <span>Zoom</span>
      </div>

      <ControlesNavegacaoCena
        mode="3d"
        onZoomIn={nav.zoomIn}
        onZoomOut={nav.zoomOut}
        onReset={animateCameraReset}
        zoomPercent={nav.zoomPercent}
        canZoomIn={nav.canZoomIn}
        canZoomOut={nav.canZoomOut}
        className="bottom-6 left-6"
      />
    </div>
  );
};
