import React, { useMemo, useRef, useState, useCallback } from "react";
import { DamType, GateShape, HingePosition } from "../../types";
import { Target, RotateCcw, Cuboid, MousePointer2, MoveHorizontal } from "lucide-react";

import type { RectSurfaceResult } from "../../physics/planeSurface";

interface Point3D {
  x: number;
  y: number;
  z: number;
}
interface Face {
  pts: { x: number; y: number }[];
  fill: string;
  opacity: number;
  stroke?: string;
  strokeWidth?: number;
  zDepth: number;
  brightness?: number;
  isFrontFacing: boolean;
  kind: "DAM" | "GATE" | "WATER";
  priority: number;
  id: number;
  hatchPattern?: string;
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

  force: number; // FR_net (N)
  s_cp: number; // s_cp_net (m ao longo)

  up?: RectSurfaceResult;
  down?: RectSurfaceResult;

  hingePosition: HingePosition;
  hasTieRod: boolean;
  tieRodPosRel: number;
  tieRodAngle: number;

  gateWeight: number;
  gateWeightEnabled: boolean;

  isAnalyzed: boolean;
  onCalculate: () => void;
  onReset: () => void;
}

const WATER_LINE_COLOR = "#38bdf8";

// Materiais
const CONCRETE_FILL = "#9ca3af";
const CONCRETE_STROKE = "#64748b";
const EARTH_FILL = "#8B5A2B";
const EARTH_STROKE = "#5C3A21";
const OBJECT_BORDER_COLOR = "#0f172a";

export const GatePressureScene: React.FC<GatePressureSceneProps> = (props) => {
  const {
    damType,
    damHeight,
    damBaseWidth,
    damCrestWidth,
    inclinationAngle,
    upstreamLevel,
    downstreamLevel = 0,
    hasGate,
    gateShape = GateShape.RECTANGULAR,
    gateWidth,
    gateHeight,
    gateDepthFromCrest,
    gateInclination = 90,
    force,
    s_cp,
    up,
    down,
    hingePosition,
    hasTieRod,
    tieRodPosRel,
    tieRodAngle,
    gateWeight,
    gateWeightEnabled,
    isAnalyzed,
    onCalculate,
    onReset,
  } = props;

  // ===== VIEW =====
  const [showVectors, setShowVectors] = useState(true);
  const [showDimensions, setShowDimensions] = useState(false);
  const [is3D, setIs3D] = useState(false);

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
  const ORIGIN_X = SVG_W * 0.5;
  const ORIGIN_Y = SVG_H * 0.88;

  const SCALE = useMemo(() => {
    const maxDim = Math.max(damHeight, damBaseWidth, gateHeight, 15);
    const baseScale = Math.min(150, (SVG_H * 0.8) / maxDim);
    return is3D ? baseScale * 1.2 : baseScale;
  }, [damHeight, damBaseWidth, gateHeight, is3D]);

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
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (isOrbiting && is3D) {
      setRotY((prev) => prev + dx * 0.5);
      setRotX((prev) => clamp(prev - dy * 0.5, -10, 70));
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
    let angle = inclinationAngle;
    if (damType === DamType.EMBANKMENT) angle = Math.min(angle, 45);
    const angleRad = (angle * Math.PI) / 180;
    const safe = Math.max(0.02, Math.min(Math.PI - 0.02, angleRad));
    return y / Math.tan(safe);
  };

  const getDamBackX = (y: number): number => {
    const t_base = damBaseWidth;
    const t_crest = damCrestWidth;
    const ratio = Math.max(0, Math.min(1, y / Math.max(1e-6, damHeight)));
    const thicknessAtY = t_base + (t_crest - t_base) * ratio;
    return getDamFaceX(y) + thicknessAtY;
  };

  const getDamProfile = () => {
    if (hasGate) {
      // Parede de concreto simples
      const width = damCrestWidth;
      return [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: damHeight },
        { x: 0, y: damHeight },
      ];
    }

    const xFaceBot = getDamFaceX(0);
    const xFaceTop = getDamFaceX(damHeight);
    const xBackBot = getDamBackX(0);
    const xBackTop = getDamBackX(damHeight);

    const gravity = [
      { x: xFaceBot, y: 0 },
      { x: xBackBot, y: 0 },
      { x: xBackTop, y: damHeight },
      { x: xFaceTop, y: damHeight },
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
        { x: xFaceTop, y: damHeight },
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
        { x: xFaceTop, y: damHeight },
      ];
    }

    if (damType === DamType.ARCH) return gravity;

    return gravity;
  };

  const archRadius = Math.max(CHANNEL_WIDTH, damBaseWidth * 2);
  const archOffsetFn =
    damType === DamType.ARCH
      ? (z: number) => archRadius - Math.sqrt(Math.max(0, archRadius * archRadius - z * z))
      : undefined;

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
  }, [hasGate, damHeight, gateDepthFromCrest, gateInclination, gateHeight]);

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
    const dx = p.x - damBaseWidth / 2;
    const dy = p.y;
    const dz = p.z;
    const cx = ORIGIN_X;
    const cy = ORIGIN_Y;

    if (!is3D) {
      return { x: cx + dx * SCALE + pan.x, y: cy - dy * SCALE + pan.y, zDepth: 0 };
    }
    const r = rotate({ x: dx, y: dy, z: dz });
    return { x: cx + r.x * SCALE + pan.x, y: cy - r.y * SCALE + pan.y, zDepth: r.z };
  };

  const brightness = useCallback(
    (n: Point3D) => {
      if (!is3D) return 1;
      const rn = rotate(n);
      const lx = -0.45,
        ly = 0.9,
        lz = 1;
      const ll = Math.sqrt(lx * lx + ly * ly + lz * lz) || 1;
      const Lx = lx / ll,
        Ly = ly / ll,
        Lz = lz / ll;
      const dot = rn.x * Lx + rn.y * Ly + rn.z * Lz;
      return Math.max(0.55, 0.68 + dot * 0.32);
    },
    [is3D, rotX, rotY]
  );

  const face = useCallback(
    (
      pts3: Point3D[],
      fill: string,
      opacity: number,
      stroke = "none",
      strokeWidth = 1,
      normal?: Point3D,
      kind: "DAM" | "GATE" | "WATER" = "DAM",
      priority: number = 0,
      id: number = 0,
      hatchPattern?: string
    ): Face => {
      const proj = pts3.map(project);
      // Usar o máximo zDepth (ponto mais próximo da câmera) ajuda a evitar que faces grandes fiquem atrás de faces menores
      const zDepth = Math.max(...proj.map((p) => p.zDepth));
      let b = 1;
      let isFrontFacing = true;
      if (normal) {
        b = brightness(normal);
        if (is3D) {
          const rotNormal = rotate(normal);
          isFrontFacing = rotNormal.z > 0;
        }
      }
      return {
        pts: proj.map((p) => ({ x: p.x, y: p.y })),
        fill,
        opacity,
        stroke,
        strokeWidth,
        zDepth,
        brightness: b,
        isFrontFacing,
        kind,
        priority,
        id,
        hatchPattern,
      };
    },
    [project, brightness, is3D, rotX, rotY]
  );

  const prism = useCallback(
    (
      profile: { x: number; y: number }[],
      zWidth: number,
      fill: string,
      opacity: number,
      stroke = "none",
      strokeWidth = 1,
      kind: "DAM" | "GATE" | "WATER" = "DAM",
      xOffsetFn?: (z: number) => number,
      hatchPattern?: string
    ) => {
      const faces: Face[] = [];
      const zF = zWidth / 2;
      const zB = -zWidth / 2;
      const priority = kind === "DAM" ? 2 : 1;

      if (!xOffsetFn) {
        faces.push(face(profile.map((p) => ({ ...p, z: zF })), fill, opacity, stroke, strokeWidth, { x: 0, y: 0, z: 1 }, kind, priority, faces.length, hatchPattern));
        faces.push(face(profile.map((p) => ({ ...p, z: zB })).reverse(), fill, opacity, stroke, strokeWidth, { x: 0, y: 0, z: -1 }, kind, priority, faces.length, hatchPattern));
        for (let i = 0; i < profile.length; i++) {
          const p1 = profile[i];
          const p2 = profile[(i + 1) % profile.length];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const mag = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = dy / mag;
          const ny = -dx / mag;
          faces.push(
            face(
              [
                { x: p1.x, y: p1.y, z: zF },
                { x: p2.x, y: p2.y, z: zF },
                { x: p2.x, y: p2.y, z: zB },
                { x: p1.x, y: p1.y, z: zB },
              ],
              fill,
              opacity,
              stroke,
              strokeWidth,
              { x: nx, y: ny, z: 0 },
              kind,
              priority,
              faces.length,
              hatchPattern
            )
          );
        }
      } else {
        // mantém sua extrusão segmentada para o arco (ok)
        const segments = 64;
        const dz = zWidth / segments;

        faces.push(face(profile.map((p) => ({ x: p.x + xOffsetFn(zF), y: p.y, z: zF })), fill, opacity, stroke, strokeWidth, { x: 0, y: 0, z: 1 }, kind, priority, faces.length, hatchPattern));
        faces.push(face(profile.map((p) => ({ x: p.x + xOffsetFn(zB), y: p.y, z: zB })).reverse(), fill, opacity, stroke, strokeWidth, { x: 0, y: 0, z: -1 }, kind, priority, faces.length, hatchPattern));

        for (let i = 0; i < profile.length; i++) {
          const p1 = profile[i];
          const p2 = profile[(i + 1) % profile.length];

          for (let j = 0; j < segments; j++) {
            const z1 = zB + j * dz;
            const z2 = zB + (j + 1) * dz;
            const off1 = xOffsetFn(z1);
            const off2 = xOffsetFn(z2);

            const vec1 = { x: p2.x + off1 - (p1.x + off1), y: p2.y - p1.y, z: 0 };
            const vec2 = { x: p1.x + off2 - (p1.x + off1), y: 0, z: z2 - z1 };
            const normX = vec1.y * vec2.z - vec1.z * vec2.y;
            const normY = vec1.z * vec2.x - vec1.x * vec2.z;
            const normZ = vec1.x * vec2.y - vec1.y * vec2.x;
            const nMag = Math.sqrt(normX * normX + normY * normY + normZ * normZ) || 1;

            faces.push(
              face(
                [
                  { x: p1.x + off2, y: p1.y, z: z2 },
                  { x: p2.x + off2, y: p2.y, z: z2 },
                  { x: p2.x + off1, y: p2.y, z: z1 },
                  { x: p1.x + off1, y: p1.y, z: z1 },
                ],
                fill,
                opacity,
                stroke,
                strokeWidth,
                { x: normX / nMag, y: normY / nMag, z: normZ / nMag },
                kind,
                priority,
                faces.length,
                hatchPattern
              )
            );
          }
        }
      }
      return faces;
    },
    [face]
  );

  // ===== Scene generation =====
  const rendered = useMemo(() => {
    const damFaces: Face[] = [];
    const gateFaces: Face[] = [];
    const waterUpFaces: Face[] = [];
    const waterDownFaces: Face[] = [];

    // 1) Dam
    const damProfile = getDamProfile();
    const isEarth = damType === DamType.EMBANKMENT;
    const isArch = damType === DamType.ARCH;
    const damFill = isEarth ? EARTH_FILL : CONCRETE_FILL;
    const damStroke = isEarth ? EARTH_STROKE : (isArch ? "none" : CONCRETE_STROKE);
    const damPattern = isEarth ? "url(#earthHatch)" : (isArch ? undefined : "url(#concretePattern)");

    if (is3D) {
      damFaces.push(...prism(damProfile, CHANNEL_WIDTH, damFill, 1, isArch ? damFill : damStroke, isArch ? 0.1 : 1.2, "DAM", archOffsetFn, damPattern));
    } else {
      damFaces.push(face(damProfile.map((p) => ({ ...p, z: 0 })), damFill, 1, damStroke, 1.5, { x: 0, y: 0, z: 1 }, "DAM", 2, 0, damPattern));
    }

    // 2) Gate visibility check
    const xFaceBot = getDamFaceX(0);
    const xFaceTop = getDamFaceX(damHeight);
    const dx = xFaceTop - xFaceBot;
    const dy = damHeight;
    const mag = Math.sqrt(dx * dx + dy * dy) || 1;
    const upstreamNormal = { x: -dy / mag, y: dx / mag, z: 0 };
    const rotUpNormal = rotate(upstreamNormal);
    const isUpstreamVisible = !is3D || rotUpNormal.z > 0;

    // 2) Gate
    if (hasGate && gateWorld) {
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
        if (is3D) gateFaces.push(...prism(profile, gateWidth, gateFill, 1, OBJECT_BORDER_COLOR, 1.2, "GATE"));
        else gateFaces.push(face(profile.map((p) => ({ ...p, z: 0 })), gateFill, 1, OBJECT_BORDER_COLOR, 1.5, { x: 0, y: 0, z: 1 }, "GATE"));
      } else {
        // Mantém seu código circular/semicircular (sem mudanças de “linhas”)
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
            alpha = (i / segments) * Math.PI;
            u_local = R * Math.sin(alpha);
            v_local = R * Math.cos(alpha);
          }

          v_local = clamp(v_local, -CHANNEL_WIDTH / 2, CHANNEL_WIDTH / 2);

          const x_base = xBot + u_local * u_x;
          const y_base = yBot + u_local * u_y;

          ptsBack.push({ x: x_base, y: y_base, z: v_local });
          ptsFront.push({ x: x_base + nx, y: y_base + ny, z: v_local });
        }

        if (is3D) {
          gateFaces.push(face(ptsFront, gateFill, 1, OBJECT_BORDER_COLOR, 1.2, { x: nx, y: ny, z: 0 }, "GATE"));
          gateFaces.push(face([...ptsBack].reverse(), gateFill, 1, OBJECT_BORDER_COLOR, 1.2, { x: -nx, y: -ny, z: 0 }, "GATE"));

          for (let i = 0; i < ptsFront.length - 1; i++) {
            const p1F = ptsFront[i];
            const p2F = ptsFront[i + 1];
            const p1B = ptsBack[i];
            const p2B = ptsBack[i + 1];

            const dx = p2F.x - p1F.x;
            const dy = p2F.y - p1F.y;

            const normX = 0 - 0 * (-ny);
            const normY = 0 - dx * 0;
            const normZ = dx * (-ny) - dy * (-nx);
            const mag = Math.sqrt(normX * normX + normY * normY + normZ * normZ) || 1;

            gateFaces.push(
              face([p1F, p2F, p2B, p1B], gateFill, 1, OBJECT_BORDER_COLOR, 1.2, { x: normX / mag, y: normY / mag, z: normZ / mag }, "GATE")
            );
          }

          if (gateShape === GateShape.SEMI_CIRCULAR) {
            const p1F = ptsFront[ptsFront.length - 1];
            const p2F = ptsFront[0];
            const p1B = ptsBack[ptsBack.length - 1];
            const p2B = ptsBack[0];

            const normX = -u_x;
            const normY = -u_y;

            gateFaces.push(face([p1F, p2F, p2B, p1B], gateFill, 1, OBJECT_BORDER_COLOR, 1.2, { x: normX, y: normY, z: 0 }, "GATE"));
          }
        } else {
          const profile = [
            { x: xBot, y: yBot },
            { x: xTop, y: yTop },
            { x: xTop + nx, y: yTop + ny },
            { x: xBot + nx, y: yBot + ny },
          ];
          gateFaces.push(face(profile.map((p) => ({ ...p, z: 0 })), gateFill, 1, OBJECT_BORDER_COLOR, 1.5, { x: 0, y: 0, z: 1 }, "GATE"));
        }
      }
    }

    // 3) Water Upstream (CORRIGIDO: sem “glass layer” + sem contato segmentado)
    if (upstreamLevel > 0) {
      const resFarX = -120;
      const steps = 10;

      if (is3D) {
        const zF = CHANNEL_WIDTH / 2;
        const zB = -CHANNEL_WIDTH / 2;

        const getWaterProfileForZ = (z: number) => {
          const profile: { x: number; y: number }[] = [];
          profile.push({ x: resFarX, y: 0 });
          const offset = archOffsetFn ? archOffsetFn(z) : 0;
          for (let i = 0; i <= steps; i++) {
            const y = (i / steps) * upstreamLevel;
            const x = getDamFaceX(y) + offset;
            profile.push({ x, y });
          }
          profile.push({ x: resFarX, y: upstreamLevel });
          return profile;
        };

        const profileF = getWaterProfileForZ(zF);
        const profileB = getWaterProfileForZ(zB);

        // Front/Back faces
        waterUpFaces.push(face(profileF.map((p) => ({ ...p, z: zF })), "url(#fluidDepthA)", 1, "none", 0, { x: 0, y: 0, z: 1 }, "WATER"));
        waterUpFaces.push(face(profileB.map((p) => ({ ...p, z: zB })).reverse(), "url(#fluidDepthA)", 1, "none", 0, { x: 0, y: 0, z: -1 }, "WATER"));

        // Top surface (+ ripple)
        const makeSurfaceStrip = (z1: number, z2: number) => {
          const off1 = archOffsetFn ? archOffsetFn(z1) : 0;
          const off2 = archOffsetFn ? archOffsetFn(z2) : 0;
          const xContact1 = getDamFaceX(upstreamLevel) + off1;
          const xContact2 = getDamFaceX(upstreamLevel) + off2;

          const surfacePts = [
            { x: resFarX, y: upstreamLevel, z: z2 },
            { x: xContact2, y: upstreamLevel, z: z2 },
            { x: xContact1, y: upstreamLevel, z: z1 },
            { x: resFarX, y: upstreamLevel, z: z1 },
          ];
          // Combinando gradiente e padrão na mesma face, opacidade reduzida
          waterUpFaces.push(face(surfacePts, "url(#surfaceGradientA)", 1, "none", 0, { x: 0, y: 1, z: 0 }, "WATER", 1, waterUpFaces.length));
        };

        if (archOffsetFn) {
          const seg = 10;
          const dz = CHANNEL_WIDTH / seg;
          for (let j = 0; j < seg; j++) {
            const z1 = zB + j * dz;
            const z2 = zB + (j + 1) * dz;
            makeSurfaceStrip(z1, z2);
          }
        } else {
          makeSurfaceStrip(zB, zF);
        }

        // Bottom surface
        const makeBottomStrip = (z1: number, z2: number) => {
          const off1 = archOffsetFn ? archOffsetFn(z1) : 0;
          const off2 = archOffsetFn ? archOffsetFn(z2) : 0;
          const xBot1 = getDamFaceX(0) + off1;
          const xBot2 = getDamFaceX(0) + off2;

          const bottomPts = [
            { x: resFarX, y: 0, z: z1 },
            { x: xBot1, y: 0, z: z1 },
            { x: xBot2, y: 0, z: z2 },
            { x: resFarX, y: 0, z: z2 },
          ];
          waterUpFaces.push(face(bottomPts, "url(#fluidDepthA)", 1, "none", 0, { x: 0, y: -1, z: 0 }, "WATER"));
        };

        if (archOffsetFn) {
          const seg = 10;
          const dz = CHANNEL_WIDTH / seg;
          for (let j = 0; j < seg; j++) {
            const z1 = zB + j * dz;
            const z2 = zB + (j + 1) * dz;
            makeBottomStrip(z1, z2);
          }
        } else {
          makeBottomStrip(zB, zF);
        }

        // Far wall (fecha a caixa)
        const leftPts = [
          { x: resFarX, y: 0, z: zF },
          { x: resFarX, y: 0, z: zB },
          { x: resFarX, y: upstreamLevel, z: zB },
          { x: resFarX, y: upstreamLevel, z: zF },
        ];
        waterUpFaces.push(face(leftPts, "url(#fluidDepthA)", 1, "none", 0, { x: -1, y: 0, z: 0 }, "WATER"));

        // ✅ Contato com a barragem: UMA face só (remove “faixas”)
        const offF = archOffsetFn ? archOffsetFn(zF) : 0;
        const offB = archOffsetFn ? archOffsetFn(zB) : 0;
        const xTopF = getDamFaceX(upstreamLevel) + offF;
        const xTopB = getDamFaceX(upstreamLevel) + offB;
        const xBotF = getDamFaceX(0) + offF;
        const xBotB = getDamFaceX(0) + offB;

        const contactPts = [
          { x: xBotB, y: 0, z: zB },
          { x: xTopB, y: upstreamLevel, z: zB },
          { x: xTopF, y: upstreamLevel, z: zF },
          { x: xBotF, y: 0, z: zF },
        ];
        waterUpFaces.push(face(contactPts, "url(#fluidDepthA)", 1, "none", 0, { x: 1, y: 0, z: 0 }, "WATER"));
      } else {
        const waterProfile: { x: number; y: number }[] = [];
        waterProfile.push({ x: resFarX, y: 0 });
        for (let i = 0; i <= steps; i++) {
          const y = (i / steps) * upstreamLevel;
          waterProfile.push({ x: getDamFaceX(y), y });
        }
        waterProfile.push({ x: resFarX, y: upstreamLevel });
        const xContact = getDamFaceX(upstreamLevel);
        waterUpFaces.push(face(waterProfile.map((p) => ({ ...p, z: 0 })), "url(#fluidDepthA)", 1, WATER_LINE_COLOR, 1, { x: 0, y: 0, z: 1 }, "WATER"));
        waterUpFaces.push(face([{ x: resFarX, y: upstreamLevel, z: 0 }, { x: xContact, y: upstreamLevel, z: 0 }], "url(#ripplePattern)", 1, "rgba(255,255,255,0.6)", 2, { x: 0, y: 0, z: 1 }, "WATER"));
      }
    }

    // 4) Water Downstream (CORRIGIDO: sem “glass layer” + sem contato segmentado)
    if (downstreamLevel > 0) {
      const resRightFarX = 140;
      const waterProfile: { x: number; y: number }[] = [];
      const steps = 10;
      const contactPts: { x: number; y: number }[] = [];

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

        // Front/Back
        waterDownFaces.push(face(waterProfile.map((p) => ({ ...p, z: zF })), "url(#fluidDepthB)", 1, "none", 0, { x: 0, y: 0, z: 1 }, "WATER"));
        waterDownFaces.push(face(waterProfile.map((p) => ({ ...p, z: zB })).reverse(), "url(#fluidDepthB)", 1, "none", 0, { x: 0, y: 0, z: -1 }, "WATER"));

        // Top (+ ripple)
        const xContactTop = contactPts[contactPts.length - 1].x;
        const surfacePts = [
          { x: xContactTop, y: downstreamLevel, z: zF },
          { x: resRightFarX, y: downstreamLevel, z: zF },
          { x: resRightFarX, y: downstreamLevel, z: zB },
          { x: xContactTop, y: downstreamLevel, z: zB },
        ];
        waterDownFaces.push(face(surfacePts, "url(#surfaceGradientB)", 1, "none", 0, { x: 0, y: 1, z: 0 }, "WATER", 1, waterDownFaces.length, "url(#ripplePattern)"));

        // Bottom
        const xContactBot = contactPts[0].x;
        const bottomPts = [
          { x: xContactBot, y: 0, z: zB },
          { x: resRightFarX, y: 0, z: zB },
          { x: resRightFarX, y: 0, z: zF },
          { x: xContactBot, y: 0, z: zF },
        ];
        waterDownFaces.push(face(bottomPts, "url(#fluidDepthB)", 1, "none", 0, { x: 0, y: -1, z: 0 }, "WATER"));

        // Far wall
        const rightPts = [
          { x: resRightFarX, y: 0, z: zB },
          { x: resRightFarX, y: 0, z: zF },
          { x: resRightFarX, y: downstreamLevel, z: zF },
          { x: resRightFarX, y: downstreamLevel, z: zB },
        ];
        waterDownFaces.push(face(rightPts, "url(#fluidDepthB)", 1, "none", 0, { x: 1, y: 0, z: 0 }, "WATER"));

        // ✅ Contato com a barragem: UMA face só (remove “faixas”)
        const xTop = getDamBackX(downstreamLevel);
        const xBot = getDamBackX(0);
        const contact = [
          { x: xBot, y: 0, z: zB },
          { x: xTop, y: downstreamLevel, z: zB },
          { x: xTop, y: downstreamLevel, z: zF },
          { x: xBot, y: 0, z: zF },
        ];
        waterDownFaces.push(face(contact, "url(#fluidDepthB)", 1, "none", 0, { x: -1, y: 0, z: 0 }, "WATER"));
      } else {
        const xContactBack = contactPts[contactPts.length - 1].x;
        waterDownFaces.push(face(waterProfile.map((p) => ({ ...p, z: 0 })), "url(#fluidDepthB)", 1, WATER_LINE_COLOR, 1, { x: 0, y: 0, z: 1 }, "WATER"));
        waterDownFaces.push(face([{ x: xContactBack, y: downstreamLevel, z: 0 }, { x: resRightFarX, y: downstreamLevel, z: 0 }], "url(#ripplePattern)", 1, "rgba(255,255,255,0.6)", 2, { x: 0, y: 0, z: 1 }, "WATER"));
      }
    }

    const sortBackToFront = (a: Face, b: Face) => {
      if (a.zDepth !== b.zDepth) return a.zDepth - b.zDepth; // longe -> perto
      if (a.kind !== b.kind) return a.kind === "WATER" ? -1 : 1;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.id - b.id;
    };

    const allFaces = [...damFaces, ...gateFaces, ...waterUpFaces, ...waterDownFaces].sort(sortBackToFront);

    return {
      allFaces,
      isUpstreamVisible,
    };
  }, [
    is3D,
    rotX,
    rotY,
    pan,
    damHeight,
    damBaseWidth,
    damCrestWidth,
    inclinationAngle,
    damType,
    upstreamLevel,
    downstreamLevel,
    hasGate,
    gateShape,
    gateWidth,
    gateHeight,
    gateDepthFromCrest,
    gateInclination,
    gateWorld,
  ]);

  // ===== Vectors (sem mudanças) =====
  const renderVectors = () => {
    if (!showVectors) return null;
    if (!hasGate || !gateWorld || !rendered.isUpstreamVisible) return null;

    const { xTop, yTop, th, sin, cos } = gateWorld;

    const pointOnGate = (s: number) => {
      const tx = -cos;
      const ty = -sin;
      return project({ x: xTop + s * tx, y: yTop + s * ty, z: 0 });
    };

    const zGate = Math.min(gateWidth, CHANNEL_WIDTH);
    const zFace = zGate / 2;

    const pointOnGateFace = (s: number) => {
      const tx = -cos;
      const ty = -sin;
      return project({ x: xTop + s * tx, y: yTop + s * ty, z: zFace });
    };

    const pushArrow = (pStart: any, pEnd: any, color: string, val?: string, isResultant = false) => {
      const marker = color === "#1e40af" ? "url(#arrowhead-red)" : color === "#3b82f6" ? "url(#arrowhead-blue)" : color === "#10b981" ? "url(#arrowhead-green)" : "url(#arrowhead-weight)";

      const dx = pEnd.x - pStart.x;
      const dy = pEnd.y - pStart.y;
      const mag = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / mag;
      const ny = dx / mag;

      const labelX = pStart.x + dx * 0.5 + nx * 16;
      const labelY = pStart.y + dy * 0.5 + ny * 16;

      return (
        <g key={`vec-${Math.random()}`}>
          <line x1={pStart.x} y1={pStart.y} x2={pEnd.x} y2={pEnd.y} stroke={color} strokeWidth={isResultant ? 3.5 : 1.6} markerEnd={marker} opacity={1} />
          <circle cx={pEnd.x} cy={pEnd.y} r={isResultant ? 3 : 1.6} fill={color} />
          {val && (
            <g transform={`translate(${labelX}, ${labelY})`}>
              <rect x="-42" y="-12" width="84" height="24" rx="6" fill="#0f172a" opacity="0.78" />
              <text x="0" y="0" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="10" fontWeight="bold" fontFamily="monospace">
                {val}
              </text>
            </g>
          )}
        </g>
      );
    };

    const vecs: any[] = [];
    const clampS = (s: number) => Math.max(0, Math.min(gateHeight, s));

    const pCP = pointOnGateFace(clampS(s_cp));

    const nx = Math.sin(th);
    const ny = -Math.cos(th);

    const forceMagnitude = Math.abs(force);
    const vecLen = Math.min(100, Math.max(30, forceMagnitude / 1500));

    const start3D = {
      x: xTop + clampS(s_cp) * -cos - nx * (vecLen / SCALE),
      y: yTop + clampS(s_cp) * -sin - ny * (vecLen / SCALE),
      z: zFace,
    };
    const pStart = project(start3D);

    if (forceMagnitude > 1e-3) {
      vecs.push(pushArrow(pStart, pCP, "#1e40af", `${(force / 1000).toFixed(1)} kN/m`, true));
    }

    // Hinge
    let pHinge: { x: number; y: number } | null = null;
    if (hingePosition === HingePosition.TOP) pHinge = pointOnGate(0);
    if (hingePosition === HingePosition.BOTTOM) pHinge = pointOnGate(gateHeight);

    if (pHinge) {
      vecs.push(
        <g key="hinge">
          <circle cx={pHinge.x} cy={pHinge.y} r="5" fill="white" stroke="#334155" strokeWidth="2" />
          <circle cx={pHinge.x} cy={pHinge.y} r="1.5" fill="#334155" />
        </g>
      );
    }

    // Tie Rod
    if (hasTieRod) {
      const sTie = Math.max(0, Math.min(1, tieRodPosRel)) * gateHeight;
      const pTie = pointOnGate(sTie);
      const tie = (tieRodAngle * Math.PI) / 180;
      const txd = Math.cos(tie);
      const tyd = Math.sin(tie);
      const pTieEnd = project({
        x: xTop + sTie * -cos + txd * (55 / SCALE),
        y: yTop + sTie * -sin + tyd * (55 / SCALE),
        z: 0,
      });
      vecs.push(
        <g key="tie">
          <line x1={pTie.x} y1={pTie.y} x2={pTieEnd.x} y2={pTieEnd.y} stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" />
          <circle cx={pTie.x} cy={pTie.y} r="3" fill="#10b981" />
          <text x={pTieEnd.x + 5} y={pTieEnd.y} fill="#10b981" fontSize="10" fontWeight="bold">
            T
          </text>
        </g>
      );
    }

    // Weight
    if (gateWeightEnabled) {
      const sCG = gateHeight / 2;
      const pW0 = pointOnGate(sCG);
      const pW1 = project({ x: xTop + sCG * -cos, y: yTop + sCG * -sin - 55 / SCALE, z: 0 });
      vecs.push(pushArrow(pW1, pW0, "#64748b", `${(gateWeight / 1000).toFixed(1)} kN/m`, true));
    }

    // Distributed pressure arrows
    const N = 8;
    for (let i = 0; i < N; i++) {
      const s = (i / (N - 1)) * gateHeight;
      const pEnd = pointOnGate(s);
      const pStart = project({ x: xTop + s * -cos - nx * (20 / SCALE), y: yTop + s * -sin - ny * (20 / SCALE), z: 0 });
      vecs.push(pushArrow(pStart, pEnd, "#1e40af"));
    }

    return <g className="pointer-events-none">{vecs}</g>;
  };

  const renderWaterPath = () => {
    if (!hasGate || !gateWorld) return null;
    const { xTop, yTop, xBot, yBot } = gateWorld;
    
    const p1 = project({ x: xTop - 50, y: yTop, z: 0 });
    const p2 = project({ x: xTop, y: yTop, z: 0 });
    const p3 = project({ x: xBot, y: yBot, z: 0 });
    const p4 = project({ x: xBot + 50, y: yBot, z: 0 });
    
    const path = `M${p1.x},${p1.y} L${p2.x},${p2.y} L${p3.x},${p3.y} L${p4.x},${p4.y}`;
    
    return (
      <path
        d={path}
        stroke="#38bdf8"
        strokeWidth="2"
        fill="none"
        strokeDasharray="4 4"
        className="pointer-events-none"
      />
    );
  };

  const renderFace = (f: Face, i: number, keyPrefix: string) => {
    // ✅ CORREÇÃO PRINCIPAL: culling também para WATER (remove “faixas” por alpha stacking)
    if (!f.isFrontFacing && f.kind !== "DAM") return null;

    const d = `M${f.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L")} Z`;
    const style: React.CSSProperties = { transition: "none" };

    if ((f.kind === "DAM" || f.kind === "GATE") && f.fill.startsWith("url")) {
      const overlayColor = f.brightness && f.brightness < 1 ? "#000" : "#fff";
      const overlayOpacity = f.brightness ? Math.abs(1 - f.brightness) * 0.15 : 0;
      const opacity = f.kind === "DAM" ? 1 : f.opacity;

      return (
        <g key={`${keyPrefix}-${i}`}>
          <path d={d} fill={f.fill} opacity={opacity} stroke={f.stroke} strokeWidth={f.strokeWidth || 1} strokeLinejoin="round" style={style} />
          <path d={d} fill={overlayColor} opacity={overlayOpacity} style={{ mixBlendMode: f.brightness && f.brightness < 1 ? "multiply" : "overlay" }} />
          {f.hatchPattern && <path d={d} fill={f.hatchPattern} opacity={1} stroke="none" />}
        </g>
      );
    }

    if (f.kind === "DAM") {
      const overlayColor = f.brightness && f.brightness < 1 ? "#000" : "#fff";
      const overlayOpacity = f.brightness ? Math.abs(1 - f.brightness) * 0.15 : 0;
      return (
        <g key={`${keyPrefix}-${i}`}>
          <path d={d} fill={f.fill} opacity={1} stroke={f.stroke} strokeWidth={f.strokeWidth || 1} strokeLinejoin="round" style={style} />
          <path d={d} fill={overlayColor} opacity={overlayOpacity} style={{ mixBlendMode: f.brightness && f.brightness < 1 ? "multiply" : "overlay" }} />
          {f.hatchPattern && <path d={d} fill={f.hatchPattern} opacity={1} stroke="none" />}
        </g>
      );
    }

    return (
      <g key={`${keyPrefix}-${i}`}>
        <path d={d} fill={f.fill} opacity={f.opacity} stroke={f.stroke} strokeWidth={f.strokeWidth || 1} strokeLinejoin="round" style={style} />
        {f.hatchPattern && <path d={d} fill={f.hatchPattern} opacity={1} stroke="none" />}
      </g>
    );
  };

  return (
    <div
      className={`
        relative flex flex-col items-center justify-center
        min-h-[520px] h-full p-2 overflow-hidden
        rounded-2xl
        bg-white/70 backdrop-blur-md
        border border-blue-100/70
        shadow-2xl shadow-blue-200/25
        transition-colors
        ${is3D ? (isDraggingRef.current ? (isPanning ? "cursor-move" : "cursor-grabbing") : "cursor-grab") : ""}
      `}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* halos */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full blur-[120px] opacity-40" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.18), transparent 60%)" }} />
        <div className="absolute -bottom-28 -right-28 w-[520px] h-[520px] rounded-full blur-[140px] opacity-40" style={{ background: "radial-gradient(circle, rgba(34,211,238,0.18), transparent 60%)" }} />
      </div>

      {/* pills */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/85 p-1.5 rounded-full shadow-xl border border-blue-100/70 backdrop-blur-md z-30 transition-all hover:scale-[1.03]" onMouseDown={(e) => e.stopPropagation()}>
        <button
          onClick={() => setIs3D((v) => !v)}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs transition-colors
            ${is3D ? "bg-blue-50 text-blue-700 border border-blue-100" : "text-slate-600 hover:bg-white/70 border border-transparent"}
          `}
          title="Alternar 2D/3D"
        >
          <Cuboid className="w-4 h-4" /> {is3D ? "3D ON" : "3D OFF"}
        </button>

        <button
          onClick={() => setShowVectors((v) => !v)}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs transition-colors
            ${showVectors ? "bg-blue-50 text-blue-700 border border-blue-100" : "text-slate-600 hover:bg-white/70 border border-transparent"}
          `}
          title="Mostrar vetores"
        >
          <MoveHorizontal className="w-4 h-4" /> VETORES
        </button>
      </div>

      {/* analisar/reiniciar */}
      <div className="absolute bottom-20 right-6 z-30" onMouseDown={(e) => e.stopPropagation()}>
        <button
          onClick={isAnalyzed ? onReset : onCalculate}
          className={`
            flex items-center gap-2
            px-5 py-2.5 rounded-full
            shadow-lg
            font-black text-xs tracking-wide uppercase
            transition-all active:scale-95
            ${isAnalyzed ? "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-slate-200/50" : "bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-600 text-white shadow-blue-500/20"}
          `}
          title={isAnalyzed ? "Reiniciar" : "Analisar"}
        >
          {isAnalyzed ? (
            <>
              <RotateCcw className="w-3.5 h-3.5" /> REINICIAR
            </>
          ) : (
            <>
              <Target className="w-3.5 h-3.5" /> ANALISAR
            </>
          )}
        </button>
      </div>

      {/* dica */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-slate-400 bg-white/80 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest pointer-events-none backdrop-blur select-none animate-in fade-in transition-opacity z-20" style={{ opacity: isDraggingRef.current ? 0.55 : 1 }}>
        <span className="flex items-center gap-1">
          <MousePointer2 className="w-3 h-3" /> {is3D ? "Girar" : "Mover"}
        </span>
        <span className="w-px h-3 bg-slate-300" />
        <span className="flex items-center gap-1">
          <span className="font-black">Shift</span> + arrastar: pan
        </span>
      </div>

      {/* reset camera */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          resetView();
        }}
        className="absolute bottom-6 right-6 bg-white/90 p-2.5 rounded-full shadow-lg border border-blue-100/70 text-slate-500 hover:text-blue-600 hover:scale-110 transition-all z-30 group"
        title="Resetar Câmera"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
      </button>

      <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="xMidYMid meet" className="flex-1 touch-none">
        <defs>
          {/* Água */}
          <linearGradient id="fluidDepthA" gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="450">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="fluidDepthB" gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="450">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="surfaceGradientA" gradientUnits="userSpaceOnUse" x1="100" y1="100" x2="700" y2="500">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="surfaceGradientB" gradientUnits="userSpaceOnUse" x1="100" y1="100" x2="700" y2="500">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.45" />
          </linearGradient>

          {/* Concreto */}
          <filter id="concreteNoise">
            <feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <pattern id="concretePattern" width="64" height="64" patternUnits="userSpaceOnUse">
            <rect width="64" height="64" fill="#a3a3a3" />
            <rect width="64" height="64" filter="url(#concreteNoise)" opacity="0.25" />
            <path d="M10,20 Q15,15 20,20 T30,20" stroke="#525252" strokeWidth="0.5" fill="none" opacity="0.3" />
            <circle cx="45" cy="50" r="1.5" fill="#525252" opacity="0.4" />
            <circle cx="10" cy="50" r="1" fill="#e5e5e5" opacity="0.4" />
          </pattern>

          {/* Terra */}
          <pattern id="earthHatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="10" stroke="#4a3018" strokeWidth="1" opacity="0.22" />
          </pattern>

          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          <pattern id="ripplePattern" width="120" height="40" patternUnits="userSpaceOnUse">
            <animateTransform attributeName="patternTransform" type="translate" from="0 0" to="120 20" dur="8s" repeatCount="indefinite" />
            <path d="M0,20 Q30,10 60,20 T120,20" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
            <path d="M-60,0 Q-30,-10 0,0 T60,0" fill="none" stroke="white" strokeWidth="0.5" opacity="0.2" />
          </pattern>

          <marker id="arrowhead-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#1e40af" />
          </marker>
          <marker id="arrowhead-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#3b82f6" />
          </marker>
          <marker id="arrowhead-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#10b981" />
          </marker>
          <marker id="arrowhead-weight" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#64748b" />
          </marker>
        </defs>

        {rendered.allFaces.map((f, i) => renderFace(f, i, "face"))}
        {renderVectors()}
        {renderWaterPath()}
      </svg>
    </div>
  );
};