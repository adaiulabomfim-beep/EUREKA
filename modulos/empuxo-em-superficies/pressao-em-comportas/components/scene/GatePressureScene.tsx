import React, { useMemo, useRef, useState, useEffect } from 'react';
import { DamType, GateShape, HingePosition } from '../../types';
import { Target, Play, RotateCcw, Cuboid, MousePointer2, Maximize } from 'lucide-react';

import type { RectSurfaceResult } from '../../physics/planeSurface';

interface Point3D { x: number; y: number; z: number }
interface Face {
  pts: { x: number; y: number }[];
  fill: string;
  opacity: number;
  stroke?: string;
  strokeWidth?: number;
  zDepth: number;
  brightness?: number;
  isFrontFacing: boolean;
  kind: 'DAM' | 'GATE' | 'WATER';
}

interface GatePressureSceneProps {
  damType: DamType;
  damHeight: number;
  damBaseWidth: number;
  damCrestWidth: number;
  inclinationAngle: number;

  upstreamLevel: number;
  downstreamLevel?: number;

  hasGate: boolean;
  gateShape?: GateShape;
  gateWidth: number;
  gateHeight: number;
  gateDepthFromCrest: number;

  gateInclination?: number;

  force: number;  // FR_net (N)
  s_cp: number;   // s_cp_net (m ao longo)

  up?: RectSurfaceResult;
  down?: RectSurfaceResult;

  hingePosition: HingePosition;
  hasTieRod: boolean;
  tieRodPosRel: number;
  tieRodAngle: number;

  gateWeight: number;
  gateWeightEnabled: boolean;

  onCalculate: () => void;
  isDamMode?: boolean;
}

const TANK_BORDER_COLOR = '#22d3ee';
const OBJECT_BORDER_COLOR = '#0f172a';
const WATER_COLOR_TOP = '#60a5fa';

export const GatePressureScene: React.FC<GatePressureSceneProps> = (props) => {
  const {
    damType, damHeight, damBaseWidth, damCrestWidth, inclinationAngle,
    upstreamLevel, downstreamLevel = 0,
    hasGate, gateShape = GateShape.RECTANGULAR, gateWidth, gateHeight, gateDepthFromCrest,
    gateInclination = 90,
    force, s_cp,
    up, down,
    hingePosition, hasTieRod, tieRodPosRel, tieRodAngle,
    gateWeight, gateWeightEnabled,
    onCalculate, isDamMode,
  } = props;

  // ===== VIEW =====
  const [showVectors, setShowVectors] = useState(true);
  const [is3D, setIs3D] = useState(true);

  // Camera
  const [rotX, setRotX] = useState(25);
  const [rotY, setRotY] = useState(-35);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Interaction
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isOrbiting, setIsOrbiting] = useState(false);

  // ===== CONSTANTS =====
  const SVG_W = 900;
  const SVG_H = 520;
  const ORIGIN_X = SVG_W * 0.52;
  const ORIGIN_Y = SVG_H * 0.82;
  
  const SCALE = useMemo(() => {
    const maxDim = Math.max(damHeight, damBaseWidth, gateHeight, 20);
    // Ajusta a escala para que a altura da barragem ocupe cerca de 60% da altura do SVG
    return Math.min(25, (SVG_H * 0.65) / maxDim);
  }, [damHeight, damBaseWidth, gateHeight]);

  const CHANNEL_WIDTH = 40;

  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  const resetView = () => {
    setRotX(25);
    setRotY(-35);
    setPan({ x: 0, y: 0 });
  };

  // ===== Interaction =====
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    if (e.button === 2 || e.shiftKey || !is3D) {
      setIsPanning(true);
      setIsOrbiting(false);
    } else {
      setIsPanning(false);
      setIsOrbiting(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;

    if (isPanning) {
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (isOrbiting && is3D) {
      setRotY(prev => prev + dx * 0.5);
      setRotX(prev => clamp(prev - dy * 0.5, -10, 70));
    }

    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsPanning(false);
    setIsOrbiting(false);
  };

  // ===== GEOMETRY =====
  const getDamFaceX = (y: number): number => {
    const angleRad = (inclinationAngle * Math.PI) / 180;
    const safe = Math.max(0.02, Math.min(Math.PI - 0.02, angleRad));
    return (y / Math.tan(safe));
  };

  const getDamBackX = (y: number): number => {
    const t_base = damBaseWidth;
    const t_crest = damCrestWidth;
    const ratio = Math.max(0, Math.min(1, y / Math.max(1e-6, damHeight)));
    const thicknessAtY = t_base + (t_crest - t_base) * ratio;
    return getDamFaceX(y) + thicknessAtY;
  };

  const getDamProfile = () => {
    const xFaceBot = getDamFaceX(0);
    const xFaceTop = getDamFaceX(damHeight);
    const xBackBot = getDamBackX(0);
    const xBackTop = getDamBackX(damHeight);

    const gravity = [
      { x: xFaceBot, y: 0 },
      { x: xBackBot, y: 0 },
      { x: xBackTop, y: damHeight },
      { x: xFaceTop, y: damHeight }
    ];

    if (damType === DamType.GRAVITY) return gravity;

    if (damType === DamType.EMBANKMENT) {
      const crest = clamp(damCrestWidth, 4, 12);
      const base = clamp(damBaseWidth, damHeight * 2, damHeight * 4);
      const xB0 = xFaceBot + base;
      const xBT = xFaceTop + crest;
      return [
        { x: xFaceBot, y: 0 },
        { x: xB0, y: 0 },
        { x: xBT, y: damHeight },
        { x: xFaceTop, y: damHeight }
      ];
    }

    if (damType === DamType.BUTTRESS) {
      const thinBack0 = xFaceBot + clamp(damBaseWidth * 0.55, 2, 20);
      const thinBackT = xFaceTop + clamp(damCrestWidth * 0.8, 1, 10);
      const stepY = damHeight * 0.55;
      const stepX = thinBack0 + clamp(damBaseWidth * 0.35, 1, 15);
      return [
        { x: xFaceBot, y: 0 },
        { x: thinBack0, y: 0 },
        { x: stepX, y: stepY },
        { x: thinBackT, y: damHeight },
        { x: xFaceTop, y: damHeight }
      ];
    }

    if (damType === DamType.ARCH) {
      const midY = damHeight * 0.55;
      const bulge = clamp(damBaseWidth * 0.25, 1, 8);
      return [
        { x: xFaceBot, y: 0 },
        { x: xBackBot, y: 0 },
        { x: xBackTop + bulge, y: midY },
        { x: xBackTop, y: damHeight },
        { x: xFaceTop, y: damHeight }
      ];
    }

    return gravity;
  };

  const gateWorld = useMemo(() => {
    if (!hasGate) return null;
    const yTop = damHeight - gateDepthFromCrest;
    const xTop = getDamFaceX(yTop);
    const th = (gateInclination * Math.PI) / 180;
    const sin = Math.max(1e-6, Math.sin(th));
    const cos = Math.cos(th);
    const verticalH = gateHeight * sin;
    const yBot = yTop - verticalH;
    const horizontalW = gateHeight * cos;
    const xBot = xTop - horizontalW;
    return { xTop, yTop, xBot, yBot, th, sin, cos };
  }, [hasGate, damHeight, gateDepthFromCrest, gateInclination, gateHeight, inclinationAngle]);

  // ===== Projection =====
  const rotate = (v: Point3D) => {
    const ax = (rotX * Math.PI) / 180;
    const ay = (rotY * Math.PI) / 180;
    const x1 = v.x * Math.cos(ay) - v.z * Math.sin(ay);
    const z1 = v.x * Math.sin(ay) + v.z * Math.cos(ay);
    const y2 = v.y * Math.cos(ax) - z1 * Math.sin(ax);
    const z2 = v.y * Math.sin(ax) + z1 * Math.cos(ax);
    return { x: x1, y: y2, z: z2 };
  };

  const project = (p: Point3D) => {
    const dx = p.x - (damBaseWidth / 2);
    const dy = p.y;
    const dz = p.z;
    if (!is3D) {
      return { x: ORIGIN_X + dx * SCALE + pan.x, y: ORIGIN_Y - dy * SCALE + pan.y, zDepth: 0 };
    }
    const r = rotate({ x: dx, y: dy, z: dz });
    return { x: ORIGIN_X + r.x * SCALE + pan.x, y: ORIGIN_Y - r.y * SCALE + pan.y, zDepth: r.z };
  };

  const brightness = (nx: number, ny: number, nz: number) => {
    if (!is3D) return 1;
    const lx = -0.45, ly = 0.9, lz = 1;
    const ll = Math.sqrt(lx * lx + ly * ly + lz * lz);
    const Lx = lx / ll, Ly = ly / ll, Lz = lz / ll;
    const dot = nx * Lx + ny * Ly + nz * Lz;
    return Math.max(0.5, 0.65 + dot * 0.35);
  };

  const face = (pts3: Point3D[], fill: string, opacity: number, stroke = 'none', strokeWidth = 1, normal?: Point3D, kind: 'DAM' | 'GATE' | 'WATER' = 'DAM'): Face => {
    const proj = pts3.map(project);
    const zDepth = proj.reduce((a, p) => a + p.zDepth, 0) / Math.max(1, proj.length);
    let b = 1;
    let isFrontFacing = true;
    if (normal) {
      b = brightness(normal.x, normal.y, normal.z);
      if (is3D) {
        const rotNormal = rotate(normal);
        isFrontFacing = rotNormal.z > 0;
      }
    }
    return {
      pts: proj.map(p => ({ x: p.x, y: p.y })),
      fill,
      opacity,
      stroke,
      strokeWidth,
      zDepth,
      brightness: b,
      isFrontFacing,
      kind
    };
  };

  const prism = (profile: { x: number; y: number }[], zWidth: number, fill: string, opacity: number, stroke = 'none', strokeWidth = 1, kind: 'DAM' | 'GATE' | 'WATER' = 'DAM') => {
    const faces: Face[] = [];
    const zF = zWidth / 2;
    const zB = -zWidth / 2;
    faces.push(face(profile.map(p => ({ ...p, z: zF })), fill, opacity, stroke, strokeWidth, { x: 0, y: 0, z: 1 }, kind));
    faces.push(face(profile.map(p => ({ ...p, z: zB })).reverse(), fill, opacity, stroke, strokeWidth, { x: 0, y: 0, z: -1 }, kind));
    for (let i = 0; i < profile.length; i++) {
      const p1 = profile[i];
      const p2 = profile[(i + 1) % profile.length];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const mag = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dy / mag;
      const ny = -dx / mag;
      faces.push(face(
        [{ x: p1.x, y: p1.y, z: zF }, { x: p2.x, y: p2.y, z: zF }, { x: p2.x, y: p2.y, z: zB }, { x: p1.x, y: p1.y, z: zB }],
        fill, opacity, stroke, strokeWidth, { x: nx, y: ny, z: 0 }, kind
      ));
    }
    return faces;
  };

  // ===== Scene generation =====
  const rendered = useMemo(() => {
    const damFaces: Face[] = [];
    const gateFaces: Face[] = [];
    const waterUpFaces: Face[] = [];
    const waterDownFaces: Face[] = [];

    // 1. Dam
    const damProfile = getDamProfile();
    const damFill = "url(#concretePattern)";
    if (is3D) {
      damFaces.push(...prism(damProfile, CHANNEL_WIDTH, damFill, 1, '#525252', 1.2, 'DAM'));
    } else {
      damFaces.push(face(damProfile.map(p => ({ ...p, z: 0 })), damFill, 1, '#525252', 1.5, { x: 0, y: 0, z: 1 }, 'DAM'));
    }

    // 2. Gate
    // Check if upstream face is visible
    const xFaceBot = getDamFaceX(0);
    const xFaceTop = getDamFaceX(damHeight);
    const dx = xFaceTop - xFaceBot;
    const dy = damHeight;
    const mag = Math.sqrt(dx * dx + dy * dy) || 1;
    const upstreamNormal = { x: -dy / mag, y: dx / mag, z: 0 };
    const rotUpNormal = rotate(upstreamNormal);
    const isUpstreamVisible = !is3D || rotUpNormal.z > 0;

    if (hasGate && gateWorld && isUpstreamVisible) {
      const { xTop, yTop, xBot, yBot, th } = gateWorld;
      const thickness = 0.45;
      const nx = -Math.sin(th) * thickness;
      const ny = Math.cos(th) * thickness;
      const gateFill = "url(#goldGradient)";
      const zGate = Math.min(gateWidth, CHANNEL_WIDTH);
      
      if (gateShape === GateShape.RECTANGULAR) {
        const profile = [
          { x: xBot, y: yBot },
          { x: xTop, y: yTop },
          { x: xTop + nx, y: yTop + ny },
          { x: xBot + nx, y: yBot + ny },
        ];
        if (is3D) {
          gateFaces.push(...prism(profile, zGate, gateFill, 1, OBJECT_BORDER_COLOR, 1.2, 'GATE'));
        } else {
          gateFaces.push(face(profile.map(p => ({ ...p, z: 0 })), gateFill, 1, OBJECT_BORDER_COLOR, 1.5, { x: 0, y: 0, z: 1 }, 'GATE'));
        }
      } else {
        // Circular or Semi-Circular
        const segments = 32;
        const ptsFront: Point3D[] = [];
        const ptsBack: Point3D[] = [];
        
        const R = gateHeight / (gateShape === GateShape.CIRCULAR ? 2 : 1);
        const u_x = Math.cos(th);
        const u_y = Math.sin(th);
        
        const u_center = gateShape === GateShape.CIRCULAR ? R : 0;
        
        for (let i = 0; i <= segments; i++) {
          let alpha = 0;
          let u_local = 0;
          let v_local = 0;
          
          if (gateShape === GateShape.CIRCULAR) {
            alpha = (i / segments) * Math.PI * 2;
            u_local = u_center + R * Math.cos(alpha);
            v_local = R * Math.sin(alpha);
          } else {
            // Semi-circular
            alpha = (i / segments) * Math.PI;
            u_local = R * Math.sin(alpha);
            v_local = R * Math.cos(alpha);
          }
          
          // Limit v_local to channel width
          v_local = clamp(v_local, -CHANNEL_WIDTH / 2, CHANNEL_WIDTH / 2);
          
          const x_base = xBot + u_local * u_x;
          const y_base = yBot + u_local * u_y;
          
          ptsBack.push({ x: x_base, y: y_base, z: v_local });
          ptsFront.push({ x: x_base + nx, y: y_base + ny, z: v_local });
        }
        
        if (is3D) {
          // Front face
          gateFaces.push(face(ptsFront, gateFill, 1, OBJECT_BORDER_COLOR, 1.2, { x: nx, y: ny, z: 0 }, 'GATE'));
          // Back face
          gateFaces.push(face([...ptsBack].reverse(), gateFill, 1, OBJECT_BORDER_COLOR, 1.2, { x: -nx, y: -ny, z: 0 }, 'GATE'));
          
          // Side faces
          for (let i = 0; i < ptsFront.length - 1; i++) {
            const p1F = ptsFront[i];
            const p2F = ptsFront[i + 1];
            const p1B = ptsBack[i];
            const p2B = ptsBack[i + 1];
            
            const dx = p2F.x - p1F.x;
            const dy = p2F.y - p1F.y;
            const dz = p2F.z - p1F.z;
            
            // Approximate normal for the side face
            // Vector 1: along the edge (dx, dy, dz)
            // Vector 2: front to back (-nx, -ny, 0)
            // Cross product
            const normX = dy * 0 - dz * (-ny);
            const normY = dz * (-nx) - dx * 0;
            const normZ = dx * (-ny) - dy * (-nx);
            const mag = Math.sqrt(normX*normX + normY*normY + normZ*normZ) || 1;
            
            gateFaces.push(face(
              [p1F, p2F, p2B, p1B],
              gateFill, 1, OBJECT_BORDER_COLOR, 1.2,
              { x: normX/mag, y: normY/mag, z: normZ/mag },
              'GATE'
            ));
          }
          
          // If semi-circular, add the straight base face
          if (gateShape === GateShape.SEMI_CIRCULAR) {
            const p1F = ptsFront[ptsFront.length - 1];
            const p2F = ptsFront[0];
            const p1B = ptsBack[ptsBack.length - 1];
            const p2B = ptsBack[0];
            
            // Normal is pointing downwards along the dam face
            const normX = -u_x;
            const normY = -u_y;
            
            gateFaces.push(face(
              [p1F, p2F, p2B, p1B],
              gateFill, 1, OBJECT_BORDER_COLOR, 1.2,
              { x: normX, y: normY, z: 0 },
              'GATE'
            ));
          }
        } else {
          // 2D view - just draw the side profile
          // The side profile is the projection of the gate on the XY plane.
          // For circular/semi-circular, it's just a line segment with thickness.
          const profile = [
            { x: xBot, y: yBot },
            { x: xTop, y: yTop },
            { x: xTop + nx, y: yTop + ny },
            { x: xBot + nx, y: yBot + ny },
          ];
          gateFaces.push(face(profile.map(p => ({ ...p, z: 0 })), gateFill, 1, OBJECT_BORDER_COLOR, 1.5, { x: 0, y: 0, z: 1 }, 'GATE'));
        }
      }
    }

    // 3. Water Upstream
    if (upstreamLevel > 0) {
      const resFarX = -120;
      const waterProfile = [];
      waterProfile.push({ x: resFarX, y: 0 });
      
      const steps = 10;
      const contactPts = [];
      for (let i = 0; i <= steps; i++) {
        const y = (i / steps) * upstreamLevel;
        const x = getDamFaceX(y);
        contactPts.push({ x, y });
        waterProfile.push({ x, y });
      }
      waterProfile.push({ x: resFarX, y: upstreamLevel });

      if (is3D) {
        const zF = CHANNEL_WIDTH / 2;
        const zB = -CHANNEL_WIDTH / 2;
        
        // Front face
        waterUpFaces.push(face(waterProfile.map(p => ({ ...p, z: zF })), "url(#fluidDepthA)", 1, TANK_BORDER_COLOR, 1, { x: 0, y: 0, z: 1 }, 'WATER'));
        // Back face
        waterUpFaces.push(face(waterProfile.map(p => ({ ...p, z: zB })).reverse(), "url(#fluidDepthA)", 1, 'none', 0, { x: 0, y: 0, z: -1 }, 'WATER'));
        
        // Top surface
        const xContact = contactPts[contactPts.length - 1].x;
        const surfacePts = [
          { x: resFarX, y: upstreamLevel, z: zF },
          { x: xContact, y: upstreamLevel, z: zF },
          { x: xContact, y: upstreamLevel, z: zB },
          { x: resFarX, y: upstreamLevel, z: zB },
        ];
        waterUpFaces.push(face(surfacePts, "url(#surfaceGradientA)", 1, 'none', 0, { x: 0, y: 1, z: 0 }, 'WATER'));
        waterUpFaces.push(face(surfacePts, "url(#ripplePattern)", 1, 'none', 0, { x: 0, y: 1, z: 0 }, 'WATER'));
        
        // Bottom surface
        const xFaceBotW = contactPts[0].x;
        const bottomPts = [
          { x: resFarX, y: 0, z: zB },
          { x: xFaceBotW, y: 0, z: zB },
          { x: xFaceBotW, y: 0, z: zF },
          { x: resFarX, y: 0, z: zF },
        ];
        waterUpFaces.push(face(bottomPts, "url(#fluidDepthA)", 1, 'none', 0, { x: 0, y: -1, z: 0 }, 'WATER'));

        // Left surface
        const leftPts = [
          { x: resFarX, y: 0, z: zF },
          { x: resFarX, y: 0, z: zB },
          { x: resFarX, y: upstreamLevel, z: zB },
          { x: resFarX, y: upstreamLevel, z: zF },
        ];
        waterUpFaces.push(face(leftPts, "url(#fluidDepthA)", 1, 'none', 0, { x: -1, y: 0, z: 0 }, 'WATER'));

        // Right surface (contact with dam)
        for (let i = 0; i < contactPts.length - 1; i++) {
          const p1 = contactPts[i];
          const p2 = contactPts[i+1];
          const dxU = p2.x - p1.x;
          const dyU = p2.y - p1.y;
          const magU = Math.sqrt(dxU*dxU + dyU*dyU) || 1;
          const nxU = dyU / magU;
          const nyU = -dxU / magU;
          const rightPts = [
            { x: p1.x, y: p1.y, z: zF },
            { x: p2.x, y: p2.y, z: zF },
            { x: p2.x, y: p2.y, z: zB },
            { x: p1.x, y: p1.y, z: zB },
          ];
          waterUpFaces.push(face(rightPts, "url(#fluidDepthA)", 1, 'none', 0, { x: nxU, y: nyU, z: 0 }, 'WATER'));
        }

        // Glass layer
        waterUpFaces.push(face(waterProfile.map(p => ({ ...p, z: zF })), "url(#glassGradient)", 0.2, 'none', 0, { x: 0, y: 0, z: 1 }, 'WATER'));
      } else {
        const xContact = contactPts[contactPts.length - 1].x;
        waterUpFaces.push(face(waterProfile.map(p => ({ ...p, z: 0 })), "url(#fluidDepthA)", 1, TANK_BORDER_COLOR, 1, { x: 0, y: 0, z: 1 }, 'WATER'));
        waterUpFaces.push(face([{ x: resFarX, y: upstreamLevel, z: 0 }, { x: xContact, y: upstreamLevel, z: 0 }], "url(#ripplePattern)", 1, 'rgba(255,255,255,0.6)', 2, { x: 0, y: 0, z: 1 }, 'WATER'));
      }
    }

    // 4. Water Downstream
    if (downstreamLevel > 0) {
      const resRightFarX = 140;
      const waterProfile = [];
      const steps = 10;
      const contactPts = [];
      
      for (let i = 0; i <= steps; i++) {
        const y = (i / steps) * downstreamLevel;
        const x = getDamBackX(y);
        contactPts.push({ x, y });
        waterProfile.push({ x, y });
      }
      waterProfile.push({ x: resRightFarX, y: downstreamLevel });
      waterProfile.push({ x: resRightFarX, y: 0 });

      if (is3D) {
        const zF = CHANNEL_WIDTH / 2;
        const zB = -CHANNEL_WIDTH / 2;
        
        // Front face
        waterDownFaces.push(face(waterProfile.map(p => ({ ...p, z: zF })), "url(#fluidDepthA)", 1, TANK_BORDER_COLOR, 1, { x: 0, y: 0, z: 1 }, 'WATER'));
        // Back face
        waterDownFaces.push(face(waterProfile.map(p => ({ ...p, z: zB })).reverse(), "url(#fluidDepthA)", 1, 'none', 0, { x: 0, y: 0, z: -1 }, 'WATER'));
        
        // Top surface
        const xContactBack = contactPts[contactPts.length - 1].x;
        const surfacePts = [
          { x: xContactBack, y: downstreamLevel, z: zF },
          { x: resRightFarX, y: downstreamLevel, z: zF },
          { x: resRightFarX, y: downstreamLevel, z: zB },
          { x: xContactBack, y: downstreamLevel, z: zB },
        ];
        waterDownFaces.push(face(surfacePts, "url(#surfaceGradientA)", 1, 'none', 0, { x: 0, y: 1, z: 0 }, 'WATER'));
        waterDownFaces.push(face(surfacePts, "url(#ripplePattern)", 1, 'none', 0, { x: 0, y: 1, z: 0 }, 'WATER'));
        
        // Bottom surface
        const xBackBotW = contactPts[0].x;
        const bottomPts = [
          { x: xBackBotW, y: 0, z: zB },
          { x: resRightFarX, y: 0, z: zB },
          { x: resRightFarX, y: 0, z: zF },
          { x: xBackBotW, y: 0, z: zF },
        ];
        waterDownFaces.push(face(bottomPts, "url(#fluidDepthA)", 1, 'none', 0, { x: 0, y: -1, z: 0 }, 'WATER'));

        // Right surface
        const rightPts = [
          { x: resRightFarX, y: 0, z: zB },
          { x: resRightFarX, y: 0, z: zF },
          { x: resRightFarX, y: downstreamLevel, z: zF },
          { x: resRightFarX, y: downstreamLevel, z: zB },
        ];
        waterDownFaces.push(face(rightPts, "url(#fluidDepthA)", 1, 'none', 0, { x: 1, y: 0, z: 0 }, 'WATER'));

        // Left surface (contact with dam)
        for (let i = 0; i < contactPts.length - 1; i++) {
          const p1 = contactPts[i];
          const p2 = contactPts[i+1];
          const dxD = p2.x - p1.x;
          const dyD = p2.y - p1.y;
          const magD = Math.sqrt(dxD*dxD + dyD*dyD) || 1;
          const nxD = -dyD / magD;
          const nyD = dxD / magD;
          const leftPts = [
            { x: p1.x, y: p1.y, z: zB },
            { x: p2.x, y: p2.y, z: zB },
            { x: p2.x, y: p2.y, z: zF },
            { x: p1.x, y: p1.y, z: zF },
          ];
          waterDownFaces.push(face(leftPts, "url(#fluidDepthA)", 1, 'none', 0, { x: nxD, y: nyD, z: 0 }, 'WATER'));
        }

        // Glass layer
        waterDownFaces.push(face(waterProfile.map(p => ({ ...p, z: zF })), "url(#glassGradient)", 0.2, 'none', 0, { x: 0, y: 0, z: 1 }, 'WATER'));
      } else {
        const xContactBack = contactPts[contactPts.length - 1].x;
        waterDownFaces.push(face(waterProfile.map(p => ({ ...p, z: 0 })), "url(#fluidDepthA)", 1, TANK_BORDER_COLOR, 1, { x: 0, y: 0, z: 1 }, 'WATER'));
        waterDownFaces.push(face([{ x: xContactBack, y: downstreamLevel, z: 0 }, { x: resRightFarX, y: downstreamLevel, z: 0 }], "url(#ripplePattern)", 1, 'rgba(255,255,255,0.6)', 2, { x: 0, y: 0, z: 1 }, 'WATER'));
      }
    }

    const sortBackToFront = (a: Face, b: Face) => {
      // Nudge water slightly back to avoid z-fighting with dam/gate at same plane
      const aDepth = a.kind === 'WATER' ? a.zDepth - 0.01 : a.zDepth;
      const bDepth = b.kind === 'WATER' ? b.zDepth - 0.01 : b.zDepth;
      return aDepth - bDepth;
    };

    const allFaces = [...damFaces, ...gateFaces, ...waterUpFaces, ...waterDownFaces].sort(sortBackToFront);

    return {
      allFaces,
      isUpstreamVisible
    };
  }, [is3D, rotX, rotY, pan, damHeight, damBaseWidth, damCrestWidth, inclinationAngle, damType, upstreamLevel, downstreamLevel, hasGate, gateShape, gateWidth, gateHeight, gateDepthFromCrest, gateInclination, gateWorld]);

  // ===== Vectors =====
  const renderVectors = () => {
    if (!showVectors) return null;

    if (isDamMode) {
      if (upstreamLevel <= 0) return null;
      
      const arrows = [];
      const numArrows = 6;
      const maxPressure = upstreamLevel; // Proportional to depth
      
      for (let i = 1; i <= numArrows; i++) {
        const y = (i / numArrows) * upstreamLevel;
        const x = getDamFaceX(y);
        
        // Normal to the face at this point
        // Approximate by taking a small delta
        const deltaY = 0.1;
        const x1 = getDamFaceX(y - deltaY);
        const x2 = getDamFaceX(y + deltaY);
        const dx = x2 - x1;
        const dy = 2 * deltaY;
        const mag = Math.sqrt(dx*dx + dy*dy) || 1;
        const nx = dy / mag;
        const ny = -dx / mag;
        
        const depth = upstreamLevel - y;
        const vecLen = (depth / upstreamLevel) * 60; // Max length 60px
        
        const pEnd = project({ x, y, z: 0 });
        const pStart = project({ x: x - nx * (vecLen / SCALE), y: y - ny * (vecLen / SCALE), z: 0 });
        
        arrows.push(
          <g key={`up-arrow-${i}`}>
            <line x1={pStart.x} y1={pStart.y} x2={pEnd.x} y2={pEnd.y} stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrow-blue)" opacity="0.7" />
          </g>
        );
      }

      // Resultant force
      if (force > 0) {
        // For a vertical or inclined face, CP is at 1/3 from bottom
        const yCP = upstreamLevel / 3;
        const xCP = getDamFaceX(yCP);
        
        const deltaY = 0.1;
        const x1 = getDamFaceX(yCP - deltaY);
        const x2 = getDamFaceX(yCP + deltaY);
        const dx = x2 - x1;
        const dy = 2 * deltaY;
        const mag = Math.sqrt(dx*dx + dy*dy) || 1;
        const nx = dy / mag;
        const ny = -dx / mag;

        const vecLen = 80;
        const pEnd = project({ x: xCP, y: yCP, z: 0 });
        const pStart = project({ x: xCP - nx * (vecLen / SCALE), y: yCP - ny * (vecLen / SCALE), z: 0 });

        arrows.push(
          <g key="resultant">
            <line x1={pStart.x} y1={pStart.y} x2={pEnd.x} y2={pEnd.y} stroke="#ef4444" strokeWidth="4" markerEnd="url(#arrow-red)" />
            <circle cx={pEnd.x} cy={pEnd.y} r="4" fill="white" stroke="#ef4444" strokeWidth="2" />
            <g transform={`translate(${pStart.x}, ${pStart.y - 18})`}>
              <rect x="-25" y="-12" width="50" height="20" rx="6" fill="white" fillOpacity="0.9" stroke="#ef4444" strokeWidth="1" />
              <text x="0" y="3" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="900">F_R</text>
            </g>
          </g>
        );
      }

      return <g className="pointer-events-none">{arrows}</g>;
    }

    if (!hasGate || !gateWorld || !rendered.isUpstreamVisible) return null;
    const { xTop, yTop, th, sin, cos } = gateWorld;
    
    const pointOnGate = (s: number) => {
      const tx = -cos;
      const ty = -sin;
      return project({ x: xTop + s * tx, y: yTop + s * ty, z: 0 });
    };

    const clampS = (s: number) => Math.max(0, Math.min(gateHeight, s));
    
    // Ponto de aplicação (CP)
    const pCP = pointOnGate(clampS(s_cp));
    
    // Direção normal à comporta (para o vetor de força)
    const nx = Math.sin(th);
    const ny = -Math.cos(th);
    
    // Escala visual da força
    const forceMagnitude = Math.abs(force);
    const vecLen = Math.min(100, Math.max(30, forceMagnitude / 1500));
    
    // O vetor aponta PARA a comporta (sentido da pressão)
    const start3D = {
      x: (xTop + clampS(s_cp) * (-cos)) - nx * (vecLen / SCALE),
      y: (yTop + clampS(s_cp) * (-sin)) - ny * (vecLen / SCALE),
      z: 0,
    };
    const pStart = project(start3D);

    let pHinge: { x: number; y: number } | null = null;
    if (hingePosition === HingePosition.TOP) pHinge = pointOnGate(0);
    if (hingePosition === HingePosition.BOTTOM) pHinge = pointOnGate(gateHeight);

    let pTie: any = null, pTieEnd: any = null;
    if (hasTieRod) {
      const sTie = Math.max(0, Math.min(1, tieRodPosRel)) * gateHeight;
      pTie = pointOnGate(sTie);
      const tie = (tieRodAngle * Math.PI) / 180;
      const txd = Math.cos(tie);
      const tyd = Math.sin(tie);
      pTieEnd = project({ 
        x: xTop + sTie * (-cos) + txd * (55 / SCALE), 
        y: yTop + sTie * (-sin) + tyd * (55 / SCALE), 
        z: 0 
      });
    }

    let pW0: any = null, pW1: any = null;
    if (gateWeightEnabled) {
      const sCG = gateHeight / 2;
      pW0 = pointOnGate(sCG);
      pW1 = project({ x: xTop + sCG * (-cos), y: yTop + sCG * (-sin) - (55 / SCALE), z: 0 });
    }

    return (
      <g className="pointer-events-none">
        {forceMagnitude > 1e-3 && (
          <>
            <line x1={pStart.x} y1={pStart.y} x2={pCP.x} y2={pCP.y} stroke="#ef4444" strokeWidth="4" markerEnd="url(#arrow-red)" />
            <circle cx={pCP.x} cy={pCP.y} r="4" fill="white" stroke="#ef4444" strokeWidth="2" />
            <g transform={`translate(${pStart.x}, ${pStart.y - 18})`}>
              <rect x="-25" y="-12" width="50" height="20" rx="6" fill="white" fillOpacity="0.9" stroke="#ef4444" strokeWidth="1" />
              <text x="0" y="3" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="900">F_R</text>
            </g>
          </>
        )}
        {pHinge && (
          <>
            <circle cx={pHinge.x} cy={pHinge.y} r="6" fill="#334155" stroke="white" strokeWidth="2" />
            <text x={pHinge.x + 12} y={pHinge.y - 8} fontSize="11" fontWeight={900} fill="#334155" filter="drop-shadow(0 1px 1px white)">Hinge</text>
          </>
        )}
        {pTie && pTieEnd && (
          <>
            <line x1={pTie.x} y1={pTie.y} x2={pTieEnd.x} y2={pTieEnd.y} stroke="#10b981" strokeWidth="3" markerEnd="url(#arrow-green)" strokeDasharray="4 2" />
            <circle cx={pTie.x} cy={pTie.y} r="3" fill="white" stroke="#10b981" strokeWidth="2" />
          </>
        )}
        {pW0 && pW1 && (
          <>
            <line x1={pW0.x} y1={pW0.y} x2={pW1.x} y2={pW1.y} stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow-weight)" />
            <circle cx={pW0.x} cy={pW0.y} r="3" fill="white" stroke="#64748b" strokeWidth="1.5" />
          </>
        )}
      </g>
    );
  };

  const renderFace = (f: Face, i: number, keyPrefix: string) => {
    if (!f.isFrontFacing && f.kind !== 'WATER') return null;
    let fillStyle = f.brightness && f.brightness !== 1 ? { filter: `brightness(${f.brightness})` } : {};
    return (
      <React.Fragment key={`${keyPrefix}-${i}`}>
        <path d={`M${f.pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')} Z`} fill={f.fill} fillOpacity={f.opacity} stroke="none" style={fillStyle} />
        {f.stroke && f.stroke !== 'none' && (f.isFrontFacing || f.kind === 'WATER') && (
          <path d={`M${f.pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')} Z`} fill="none" stroke={f.stroke} strokeWidth={f.strokeWidth || 1} strokeLinejoin="round" />
        )}
      </React.Fragment>
    );
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 relative flex flex-col items-center p-2 min-h-[420px] h-full overflow-hidden ${isOrbiting || isPanning ? (isPanning ? 'cursor-move' : 'cursor-grabbing') : 'cursor-grab'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/85 p-1.5 rounded-full shadow-2xl border border-blue-100/60 backdrop-blur-md z-30 select-none">
        <button onClick={onCalculate} className="flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-[10px] transition-all bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 active:scale-95 uppercase tracking-widest"><Play className="w-3.5 h-3.5 fill-current" /> Analisar</button>
        <div className="w-px h-5 bg-blue-100 mx-1" />
        <button onClick={() => { const next = !is3D; setIs3D(next); if (next) resetView(); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-black text-[10px] transition-all border uppercase tracking-widest ${is3D ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white/60 border-blue-100 text-slate-500 hover:bg-white'}`}><Cuboid className="w-3.5 h-3.5" /> 3D {is3D ? 'ON' : 'OFF'}</button>
        <button onClick={() => setShowVectors(!showVectors)} className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-black text-[10px] transition-all border uppercase tracking-widest ${showVectors ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white/60 border-blue-100 text-slate-500 hover:bg-white'}`}><Target className="w-3.5 h-3.5" /> Vetores</button>
        <button onClick={(e) => { e.stopPropagation(); resetView(); }} className="ml-1 bg-white/80 p-3 rounded-full shadow-xl border border-blue-100 text-slate-500 hover:text-blue-700 hover:scale-110 transition-all"><RotateCcw className="w-4 h-4" /> </button>
      </div>

      {is3D && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 text-slate-500 bg-white/80 px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest pointer-events-none backdrop-blur-md border border-blue-100/60 shadow-xl select-none">
          <span className="flex items-center gap-1.5"><MousePointer2 className="w-3 h-3 text-blue-600" /> Arraste para girar</span>
          <span className="w-px h-3 bg-blue-100" />
          <span className="flex items-center gap-1.5"><Maximize className="w-3 h-3 text-blue-600" /> Shift+Arraste para mover</span>
        </div>
      )}

      <svg width="100%" height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="50%" stopColor="white" stopOpacity="0.1" />
            <stop offset="100%" stopColor="white" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <filter id="concreteNoise"><feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="3" stitchTiles="stitch" /></filter>
          <pattern id="concretePattern" width="64" height="64" patternUnits="userSpaceOnUse">
            <rect width="64" height="64" fill="#a3a3a3" />
            <rect width="64" height="64" filter="url(#concreteNoise)" opacity="0.25" />
          </pattern>
          <linearGradient id="fluidDepthA" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={WATER_COLOR_TOP} stopOpacity="0.15" />
            <stop offset="100%" stopColor={WATER_COLOR_TOP} stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="surfaceGradientA" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={WATER_COLOR_TOP} stopOpacity="0.4" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor={WATER_COLOR_TOP} stopOpacity="0.5" />
          </linearGradient>
          <pattern id="ripplePattern" width="120" height="40" patternUnits="userSpaceOnUse">
            <animateTransform attributeName="patternTransform" type="translate" from="0 0" to="120 20" dur="8s" repeatCount="indefinite" />
            <path d="M0,20 Q30,10 60,20 T120,20" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
            <path d="M-60,0 Q-30,-10 0,0 T60,0" fill="none" stroke="white" strokeWidth="0.5" opacity="0.2" />
          </pattern>
          <marker id="arrow-red" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><path d="M0,0 L6,2 L0,4 Z" fill="#ef4444" /></marker>
          <marker id="arrow-blue" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><path d="M0,0 L6,2 L0,4 Z" fill="#3b82f6" /></marker>
          <marker id="arrow-green" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><path d="M0,0 L6,2 L0,4 Z" fill="#10b981" /></marker>
          <marker id="arrow-weight" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><path d="M0,0 L6,2 L0,4 Z" fill="#64748b" /></marker>
        </defs>

        {/* Unified Layered Rendering */}
        {rendered.allFaces.map((f, i) => renderFace(f, i, 'face'))}

        {renderVectors()}
      </svg>
    </div>
  );
};
