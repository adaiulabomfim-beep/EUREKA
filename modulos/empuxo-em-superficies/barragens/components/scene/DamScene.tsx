import React, { useCallback, useMemo, useRef, useState } from "react";
import { DamType } from "../../types";
import { Target, RotateCcw, Cuboid, MousePointer2, MoveHorizontal } from "lucide-react";
import type { RectSurfaceResult } from "../../physics/damHydrostatics";

interface Point3D {
  x: number;
  y: number;
  z: number;
}
interface WorldFace {
  pts3: Point3D[];
  fill: string;
  opacity: number;
  stroke?: string;
  strokeWidth?: number;
  normal?: Point3D;
  kind: "DAM" | "WATER";
  hatchPattern?: string;
  priority?: number;
}
interface Face {
  pts: { x: number; y: number }[];
  fill: string;
  opacity: number;
  stroke?: string;
  strokeWidth?: number;
  zDepth: number;
  brightness?: number;
  kind: "DAM" | "WATER";
  hatchPattern?: string;
  id: number;
  priority: number;
}

interface DamSceneProps {
  damType: DamType;
  damHeight: number;
  damBaseWidth: number;
  damCrestWidth: number;
  inclinationAngle: number;

  upstreamLevel: number;
  downstreamLevel?: number;

  force: number; // FR_net (N)
  s_cp: number; // s_cp_net (m ao longo)

  up?: RectSurfaceResult;
  down?: RectSurfaceResult;

  isAnalyzed: boolean;
  onCalculate: () => void;
  onReset: () => void;
}

const TANK_BORDER_COLOR = "#22d3ee";
const WATER_LINE_COLOR = "#38bdf8";

// Materiais
const CONCRETE_FILL = "#9ca3af";
const CONCRETE_STROKE = "#64748b";
const EARTH_FILL = "#8B5A2B";
const EARTH_STROKE = "#5C3A21";

export const DamScene: React.FC<DamSceneProps> = (props) => {
  const {
    damType,
    damHeight,
    damBaseWidth,
    damCrestWidth,
    inclinationAngle,
    upstreamLevel,
    downstreamLevel = 0,
    up,
    down,
    isAnalyzed,
    onCalculate,
    onReset,
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

  // profundidade visual em Z
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

  // ===== COORD SYSTEM =====
  const toWorldX = useCallback((x: number) => x - damBaseWidth / 2, [damBaseWidth]);

  // ===== GEOMETRY HELPERS =====
  const getDamFaceX = useCallback(
    (y: number): number => {
      let angle = inclinationAngle;
      if (damType === DamType.EMBANKMENT) angle = Math.min(angle, 45);
      const angleRad = (angle * Math.PI) / 180;
      const safe = Math.max(0.02, Math.min(Math.PI - 0.02, angleRad));
      return y / Math.tan(safe);
    },
    [inclinationAngle, damType]
  );

  const buildGravityDam = useCallback(() => {
    const xFaceBot = 0;
    const xFaceTop = getDamFaceX(damHeight);
    const xBackBot = damBaseWidth;
    const xBackTop = xFaceTop + damCrestWidth;
    return {
      profile: [
        { x: xFaceBot, y: 0 },
        { x: xBackBot, y: 0 },
        { x: xBackTop, y: damHeight },
        { x: xFaceTop, y: damHeight },
      ],
    };
  }, [damHeight, damBaseWidth, damCrestWidth, getDamFaceX]);

  const buildEarthDam = useCallback(() => {
    const xFaceBot = 0;
    const xFaceTop = getDamFaceX(damHeight);
    const xBackBot = damBaseWidth;
    const xBackTop = xFaceTop + damCrestWidth;

    return {
      profile: [
        { x: xFaceBot, y: 0 },
        { x: xBackBot, y: 0 },
        { x: xBackTop, y: damHeight },
        { x: xFaceTop, y: damHeight },
      ],
    };
  }, [damHeight, damBaseWidth, damCrestWidth, getDamFaceX]);

  const buildArchDam = useCallback(() => {
    const profile: { x: number; y: number }[] = [];
    const steps = 12;

    const xFaceBot = 0;
    const xFaceTop = getDamFaceX(damHeight);

    // Upstream face
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = t * damHeight;
      const x = xFaceBot + t * (xFaceTop - xFaceBot);
      profile.push({ x, y });
    }

    // Downstream face
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const y = t * damHeight;
      const x = xFaceBot + t * (xFaceTop - xFaceBot);
      const thickness = damBaseWidth * (1 - t) + damCrestWidth * t;
      profile.push({ x: x + thickness, y });
    }

    return { profile };
  }, [damHeight, damBaseWidth, damCrestWidth, getDamFaceX]);

  const buildButtressDam = useCallback(() => {
    const wallThick = Math.max(0.8, damCrestWidth * 0.5);

    const wallProfile = [
      { x: 0, y: 0 },
      { x: wallThick, y: 0 },
      { x: wallThick, y: damHeight },
      { x: 0, y: damHeight },
    ];

    const buttressProfile = [
      { x: wallThick, y: 0 },
      { x: Math.max(wallThick + 0.5, damBaseWidth), y: 0 },
      { x: wallThick, y: damHeight },
    ];

    return { wallProfile, buttressProfile };
  }, [damHeight, damBaseWidth, damCrestWidth]);

  const getDamXAtY = useCallback(
    (y: number, side: "UPSTREAM" | "DOWNSTREAM") => {
      let profile: { x: number; y: number }[] = [];

      if (damType === DamType.GRAVITY) profile = buildGravityDam().profile;
      else if (damType === DamType.EMBANKMENT) profile = buildEarthDam().profile;
      else if (damType === DamType.ARCH) profile = buildArchDam().profile;
      else if (damType === DamType.BUTTRESS) {
        const b = buildButtressDam();
        profile = side === "UPSTREAM" ? b.wallProfile : b.buttressProfile;
      }

      if (damType === DamType.ARCH) {
        const steps = 24;
        if (side === "UPSTREAM") {
          for (let i = 0; i < steps; i++) {
            const p1 = profile[i];
            const p2 = profile[i + 1];
            if (p1.y <= y && p2.y >= y) {
              const t = (y - p1.y) / Math.max(1e-9, p2.y - p1.y);
              return p1.x + t * (p2.x - p1.x);
            }
          }
          return profile[0].x;
        } else {
          for (let i = steps + 1; i < profile.length - 1; i++) {
            const p1 = profile[i];
            const p2 = profile[i + 1];
            if (p1.y >= y && p2.y <= y) {
              const t = (y - p1.y) / Math.max(1e-9, p2.y - p1.y);
              return p1.x + t * (p2.x - p1.x);
            }
          }
          return profile[profile.length - 1].x;
        }
      }

      if (damType === DamType.BUTTRESS) {
        if (side === "UPSTREAM") return 0;
        return damBaseWidth;
      }

      if (side === "UPSTREAM") {
        const p1 = profile[0];
        const p2 = profile[3];
        const t = (y - p1.y) / Math.max(1e-9, p2.y - p1.y);
        return p1.x + t * (p2.x - p1.x);
      } else {
        const p1 = profile[1];
        const p2 = profile[2];
        const t = (y - p1.y) / Math.max(1e-9, p2.y - p1.y);
        return p1.x + t * (p2.x - p1.x);
      }
    },
    [damType, buildGravityDam, buildEarthDam, buildArchDam, buildButtressDam, damBaseWidth]
  );

  // ===== ARCH OFFSET (MEMO) =====
  const archRadius = useMemo(() => Math.max(CHANNEL_WIDTH * 0.6, damBaseWidth * 1.5), [damBaseWidth]);
  const archOffsetFn = useMemo(() => {
    if (damType !== DamType.ARCH) return undefined;
    return (z: number) => {
      const rr = archRadius * archRadius;
      const zz = z * z;
      return archRadius - Math.sqrt(Math.max(0, rr - zz));
    };
  }, [damType, archRadius]);

  // ===== ROTATION =====
  const rotate = useCallback(
    (v: Point3D) => {
      const ax = (rotX * Math.PI) / 180;
      const ay = (rotY * Math.PI) / 180;

      const x1 = v.x * Math.cos(ay) - v.z * Math.sin(ay);
      const z1 = v.x * Math.sin(ay) + v.z * Math.cos(ay);

      const y2 = v.y * Math.cos(ax) - z1 * Math.sin(ax);
      const z2 = v.y * Math.sin(ax) + z1 * Math.cos(ax);

      return { x: x1, y: y2, z: z2 };
    },
    [rotX, rotY]
  );

  // Auto-fit (geom only)
  const { autoScale, autoPan, center } = useMemo(() => {
    const pts: Point3D[] = [];
    const zs = [-CHANNEL_WIDTH / 2, CHANNEL_WIDTH / 2];

    let profiles: { x: number; y: number }[] = [];
    if (damType === DamType.GRAVITY) profiles = buildGravityDam().profile;
    else if (damType === DamType.EMBANKMENT) profiles = buildEarthDam().profile;
    else if (damType === DamType.ARCH) profiles = buildArchDam().profile;
    else if (damType === DamType.BUTTRESS) {
      const b = buildButtressDam();
      profiles = [...b.wallProfile, ...b.buttressProfile];
    }

    profiles.forEach((p) => {
      zs.forEach((z) => {
        const off = archOffsetFn ? archOffsetFn(z) : 0;
        pts.push({ x: toWorldX(p.x + off), y: p.y, z });
      });
    });

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    pts.forEach((p) => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
      minZ = Math.min(minZ, p.z);
      maxZ = Math.max(maxZ, p.z);
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const w = Math.max(1, maxX - minX);
    const h = Math.max(1, maxY - minY);

    const scaleX = (SVG_W * 0.65) / w;
    const scaleY = (SVG_H * 0.65) / h;
    const scale = Math.min(scaleX, scaleY, 40);

    const panX = SVG_W / 2 - ORIGIN_X - centerX * scale;
    const panY = SVG_H / 2 - ORIGIN_Y + centerY * scale - 60;

    return {
      autoScale: scale,
      autoPan: { x: panX, y: panY },
      center: { x: centerX, y: centerY, z: centerZ },
    };
  }, [
    damType,
    damHeight,
    damBaseWidth,
    damCrestWidth,
    upstreamLevel,
    downstreamLevel,
    archOffsetFn,
    toWorldX,
    buildGravityDam,
    buildEarthDam,
    buildArchDam,
    buildButtressDam,
    getDamXAtY,
  ]);

  const SCALE = autoScale;
  const finalPan = { x: pan.x + autoPan.x, y: pan.y + autoPan.y };

  // PROJECTION
  const project = useCallback(
    (p: Point3D) => {
      const local = { x: p.x - center.x, y: p.y - center.y, z: p.z - center.z };

      if (!is3D) {
        return {
          x: ORIGIN_X + local.x * SCALE + finalPan.x,
          y: ORIGIN_Y - local.y * SCALE + finalPan.y,
          zDepth: 0,
        };
      }

      const r = rotate(local);

      return {
        x: ORIGIN_X + r.x * SCALE + finalPan.x,
        y: ORIGIN_Y - r.y * SCALE + finalPan.y,
        zDepth: r.z,
      };
    },
    [center, is3D, rotate, SCALE, finalPan.x, finalPan.y]
  );

  // iluminação
  const brightness = useCallback(
    (n: Point3D) => {
      if (!is3D) return 1;

      const rn = rotate(n);

      const lx = -0.45, ly = 0.9, lz = 1;
      const ll = Math.sqrt(lx * lx + ly * ly + lz * lz) || 1;
      const Lx = lx / ll, Ly = ly / ll, Lz = lz / ll;

      const dot = rn.x * Lx + rn.y * Ly + rn.z * Lz;
      return Math.max(0.55, 0.68 + dot * 0.32);
    },
    [is3D, rotate]
  );

  const face = useCallback(
    (
      pts3: Point3D[],
      fill: string,
      opacity: number,
      stroke = "none",
      strokeWidth = 1,
      normal?: Point3D,
      kind: "DAM" | "WATER" = "DAM",
      hatchPattern?: string,
      priority: number = 0
    ): WorldFace => ({
      pts3,
      fill,
      opacity,
      stroke,
      strokeWidth,
      normal,
      kind,
      hatchPattern,
      priority,
    }),
    []
  );

  // Prism extrude
  const prism = useCallback(
    (
      profile: { x: number; y: number }[],
      zWidth: number,
      fill: string,
      opacity: number,
      stroke = "none",
      strokeWidth = 1,
      kind: "DAM" | "WATER" = "DAM",
      xOffsetFn?: (z: number) => number,
      zOffset: number = 0,
      hatchPattern?: string
    ) => {
      const faces: WorldFace[] = [];
      const steps = xOffsetFn ? 16 : 1;
      const dz = zWidth / steps;
      const zStart = zOffset - zWidth / 2;

      const mapPt = (p: { x: number; y: number }, z: number) => {
        const off = xOffsetFn ? xOffsetFn(z) : 0;
        return { x: toWorldX(p.x + off), y: p.y, z };
      };

      // Caps
      const zF = zOffset + zWidth / 2;
      const zB = zOffset - zWidth / 2;
      faces.push(face(profile.map((p) => mapPt(p, zF)), fill, opacity, stroke, strokeWidth, { x: 0, y: 0, z: 1 }, kind, hatchPattern, kind === "DAM" ? 2 : 1));
      faces.push(face(profile.map((p) => mapPt(p, zB)).reverse(), fill, opacity, stroke, strokeWidth, { x: 0, y: 0, z: -1 }, kind, hatchPattern, kind === "DAM" ? 2 : 1));

      // Sides
      for (let s = 0; s < steps; s++) {
        const sz1 = zStart + s * dz;
        const sz2 = zStart + (s + 1) * dz;

        for (let i = 0; i < profile.length; i++) {
          const p1 = profile[i];
          const p2 = profile[(i + 1) % profile.length];

          const p1_z1 = mapPt(p1, sz1);
          const p2_z1 = mapPt(p2, sz1);
          const p2_z2 = mapPt(p2, sz2);
          const p1_z2 = mapPt(p1, sz2);

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const mag = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = dy / mag;
          const ny = -dx / mag;

          faces.push(face([p1_z1, p2_z1, p2_z2, p1_z2], fill, opacity, "none", 0, { x: nx, y: ny, z: 0 }, kind, hatchPattern, kind === "DAM" ? 2 : 1));
        }
      }

      return faces;
    },
    [face, toWorldX]
  );

  // Água 3D como caixa
  const waterBox3D = useCallback(
    (
      waterLevelY: number,
      depth: number,
      farX: number,
      damFaceSide: "UPSTREAM" | "DOWNSTREAM",
      offsetFn?: (z: number) => number,
      fillId: "A" | "B" = "A"
    ) => {
      const faces: WorldFace[] = [];
      const steps = offsetFn ? 16 : 1;
      const dz = depth / steps;
      const zStart = -depth / 2;
      const farWorldX = toWorldX(farX);
      const fill = fillId === "A" ? "url(#fluidDepthA)" : "url(#fluidDepthB)";
      const surf = fillId === "A" ? "url(#surfaceGradientA)" : "url(#surfaceGradientB)";

      for (let s = 0; s < steps; s++) {
        const z1 = zStart + s * dz;
        const z2 = zStart + (s + 1) * dz;

        const getContactX = (y: number, z: number) => {
          const base = getDamXAtY(y, damFaceSide);
          const off = offsetFn ? offsetFn(z) : 0;
          return toWorldX(base + off);
        };

        const xC1_bot = getContactX(0, z1);
        const xC1_top = getContactX(waterLevelY, z1);
        const xC2_bot = getContactX(0, z2);
        const xC2_top = getContactX(waterLevelY, z2);

        if (s === 0) {
          const backPts = damFaceSide === "UPSTREAM"
            ? [{ x: farWorldX, y: 0, z: z1 }, { x: xC1_bot, y: 0, z: z1 }, { x: xC1_top, y: waterLevelY, z: z1 }, { x: farWorldX, y: waterLevelY, z: z1 }].reverse()
            : [{ x: xC1_bot, y: 0, z: z1 }, { x: farWorldX, y: 0, z: z1 }, { x: farWorldX, y: waterLevelY, z: z1 }, { x: xC1_top, y: waterLevelY, z: z1 }].reverse();
          faces.push(face(backPts, fill, 0.78, "none", 0, { x: 0, y: 0, z: -1 }, "WATER"));
        }
        if (s === steps - 1) {
          const frontPts = damFaceSide === "UPSTREAM"
            ? [{ x: farWorldX, y: 0, z: z2 }, { x: xC2_bot, y: 0, z: z2 }, { x: xC2_top, y: waterLevelY, z: z2 }, { x: farWorldX, y: waterLevelY, z: z2 }]
            : [{ x: xC2_bot, y: 0, z: z2 }, { x: farWorldX, y: 0, z: z2 }, { x: farWorldX, y: waterLevelY, z: z2 }, { x: xC2_top, y: waterLevelY, z: z2 }];
          faces.push(face(frontPts, fill, 0.78, "none", 0, { x: 0, y: 0, z: 1 }, "WATER"));
        }

        const topPts = damFaceSide === "UPSTREAM"
          ? [{ x: farWorldX, y: waterLevelY, z: z2 }, { x: xC2_top, y: waterLevelY, z: z2 }, { x: xC1_top, y: waterLevelY, z: z1 }, { x: farWorldX, y: waterLevelY, z: z1 }]
          : [{ x: xC1_top, y: waterLevelY, z: z1 }, { x: xC2_top, y: waterLevelY, z: z2 }, { x: farWorldX, y: waterLevelY, z: z2 }, { x: farWorldX, y: waterLevelY, z: z1 }];
        faces.push(face(topPts, surf, 0.6, "none", 0, { x: 0, y: 1, z: 0 }, "WATER"));

        const botPts = damFaceSide === "UPSTREAM"
          ? [{ x: farWorldX, y: 0, z: z1 }, { x: xC1_bot, y: 0, z: z1 }, { x: xC2_bot, y: 0, z: z2 }, { x: farWorldX, y: 0, z: z2 }]
          : [{ x: xC2_bot, y: 0, z: z2 }, { x: farWorldX, y: 0, z: z2 }, { x: farWorldX, y: 0, z: z1 }, { x: xC1_bot, y: 0, z: z1 }];
        faces.push(face(botPts, fill, 0.78, "none", 0, { x: 0, y: -1, z: 0 }, "WATER"));

        const farWallPts = damFaceSide === "UPSTREAM"
          ? [{ x: farWorldX, y: 0, z: z2 }, { x: farWorldX, y: waterLevelY, z: z2 }, { x: farWorldX, y: waterLevelY, z: z1 }, { x: farWorldX, y: 0, z: z1 }]
          : [{ x: farWorldX, y: 0, z: z1 }, { x: farWorldX, y: waterLevelY, z: z1 }, { x: farWorldX, y: waterLevelY, z: z2 }, { x: farWorldX, y: 0, z: z2 }];
        faces.push(face(farWallPts, fill, 0.78, "none", 0, { x: damFaceSide === "UPSTREAM" ? -1 : 1, y: 0, z: 0 }, "WATER"));

        const contactWallPts = damFaceSide === "UPSTREAM"
          ? [{ x: xC1_bot, y: 0, z: z1 }, { x: xC1_top, y: waterLevelY, z: z1 }, { x: xC2_top, y: waterLevelY, z: z2 }, { x: xC2_bot, y: 0, z: z2 }]
          : [{ x: xC2_bot, y: 0, z: z2 }, { x: xC2_top, y: waterLevelY, z: z2 }, { x: xC1_top, y: waterLevelY, z: z1 }, { x: xC1_bot, y: 0, z: z1 }];
        faces.push(face(contactWallPts, fill, 0.78, "none", 0, { x: damFaceSide === "UPSTREAM" ? 1 : -1, y: 0, z: 0 }, "WATER"));
      }

      return faces;
    },
    [face, getDamXAtY, toWorldX]
  );

  // ===== Scene generation (WORLD) =====
  const worldGeometry = useMemo(() => {
    const damFaces: WorldFace[] = [];
    const waterFaces: WorldFace[] = [];

    if (damType === DamType.BUTTRESS) {
      const { wallProfile, buttressProfile } = buildButtressDam();

      if (is3D) {
        damFaces.push(...prism(wallProfile, CHANNEL_WIDTH, CONCRETE_FILL, 1, CONCRETE_STROKE, 1, "DAM", archOffsetFn, 0, "url(#concretePattern)"));

        const numButtresses = 5;
        const spacing = CHANNEL_WIDTH / numButtresses;
        const buttressThick = spacing * 0.38;
        for (let i = 0; i < numButtresses; i++) {
          const zCenter = -CHANNEL_WIDTH / 2 + spacing / 2 + i * spacing;
          damFaces.push(...prism(buttressProfile, buttressThick, CONCRETE_FILL, 1, CONCRETE_STROKE, 1, "DAM", undefined, zCenter, "url(#concretePattern)"));
        }
      } else {
        damFaces.push(face(wallProfile.map((p) => ({ x: toWorldX(p.x), y: p.y, z: 0 })), CONCRETE_FILL, 1, CONCRETE_STROKE, 1.5, { x: 0, y: 0, z: 1 }, "DAM", "url(#concretePattern)", 2));
        damFaces.push(face(buttressProfile.map((p) => ({ x: toWorldX(p.x), y: p.y, z: 0 })), CONCRETE_FILL, 1, CONCRETE_STROKE, 1.5, { x: 0, y: 0, z: 1 }, "DAM", "url(#concretePattern)", 2));
      }
    } else if (damType === DamType.EMBANKMENT) {
      const { profile } = buildEarthDam();

      if (is3D) {
        damFaces.push(...prism(profile, CHANNEL_WIDTH, EARTH_FILL, 1, EARTH_STROKE, 1, "DAM", undefined, 0, "url(#earthHatch)"));
      } else {
        damFaces.push(face(profile.map((p) => ({ x: toWorldX(p.x), y: p.y, z: 0 })), EARTH_FILL, 1, EARTH_STROKE, 1.5, { x: 0, y: 0, z: 1 }, "DAM", "url(#earthHatch)", 2));
      }
    } else if (damType === DamType.ARCH) {
      const { profile } = buildArchDam();
      if (is3D) {
        damFaces.push(...prism(profile, CHANNEL_WIDTH, CONCRETE_FILL, 1, CONCRETE_STROKE, 1, "DAM", archOffsetFn, 0, "url(#concretePattern)"));
      } else {
        damFaces.push(face(profile.map((p) => ({ x: toWorldX(p.x), y: p.y, z: 0 })), CONCRETE_FILL, 1, CONCRETE_STROKE, 1.5, { x: 0, y: 0, z: 1 }, "DAM", "url(#concretePattern)", 2));
      }
    } else {
      const { profile } = buildGravityDam();
      if (is3D) {
        damFaces.push(...prism(profile, CHANNEL_WIDTH, CONCRETE_FILL, 1, CONCRETE_STROKE, 1, "DAM", undefined, 0, "url(#concretePattern)"));
      } else {
        damFaces.push(face(profile.map((p) => ({ x: toWorldX(p.x), y: p.y, z: 0 })), CONCRETE_FILL, 1, CONCRETE_STROKE, 1.5, { x: 0, y: 0, z: 1 }, "DAM", "url(#concretePattern)", 2));
      }
    }

    if (upstreamLevel > 0) {
      const farX = -80;
      if (is3D) {
        waterFaces.push(...waterBox3D(upstreamLevel, CHANNEL_WIDTH, farX, "UPSTREAM", archOffsetFn, "A"));
      } else {
        const xC = getDamXAtY(upstreamLevel, "UPSTREAM");
        const poly = [
          { x: toWorldX(farX), y: 0, z: 0 },
          { x: toWorldX(getDamXAtY(0, "UPSTREAM")), y: 0, z: 0 },
          { x: toWorldX(xC), y: upstreamLevel, z: 0 },
          { x: toWorldX(farX), y: upstreamLevel, z: 0 },
        ];
        waterFaces.push(face(poly, "url(#fluidDepthA)", 0.85, "none", 0, { x: 0, y: 0, z: 1 }, "WATER", undefined, 0));
        waterFaces.push(face([{ x: toWorldX(farX), y: upstreamLevel, z: 0 }, { x: toWorldX(xC), y: upstreamLevel, z: 0 }], "none", 1, WATER_LINE_COLOR, 2, { x: 0, y: 0, z: 1 }, "WATER"));
      }
    }

    if (downstreamLevel > 0) {
      const farX = 80;
      if (is3D) {
        waterFaces.push(...waterBox3D(downstreamLevel, CHANNEL_WIDTH, farX, "DOWNSTREAM", archOffsetFn, "B"));
      } else {
        const xC = getDamXAtY(downstreamLevel, "DOWNSTREAM");
        const poly = [
          { x: toWorldX(getDamXAtY(0, "DOWNSTREAM")), y: 0, z: 0 },
          { x: toWorldX(farX), y: 0, z: 0 },
          { x: toWorldX(farX), y: downstreamLevel, z: 0 },
          { x: toWorldX(xC), y: downstreamLevel, z: 0 },
        ];
        waterFaces.push(face(poly, "url(#fluidDepthB)", 0.85, "none", 0, { x: 0, y: 0, z: 1 }, "WATER", undefined, 0));
        waterFaces.push(face([{ x: toWorldX(xC), y: downstreamLevel, z: 0 }, { x: toWorldX(farX), y: downstreamLevel, z: 0 }], "none", 1, WATER_LINE_COLOR, 2, { x: 0, y: 0, z: 1 }, "WATER"));
      }
    }

    return [...waterFaces, ...damFaces];
  }, [
    damType,
    damHeight,
    damBaseWidth,
    damCrestWidth,
    inclinationAngle,
    upstreamLevel,
    downstreamLevel,
    is3D,
    archOffsetFn,
    buildButtressDam,
    buildEarthDam,
    buildArchDam,
    buildGravityDam,
    prism,
    face,
    toWorldX,
    getDamXAtY,
    waterBox3D,
  ]);

  // ===== Rendered faces =====
  const rendered = useMemo(() => {
    const projected: Face[] = worldGeometry.map((wf, index) => {
      const proj = wf.pts3.map(project);

      const zAvg = proj.reduce((a, p) => a + p.zDepth, 0) / Math.max(1, proj.length);

      let b = 1;
      if (wf.normal) b = brightness(wf.normal);

      return {
        id: index,
        pts: proj.map((p) => ({ x: p.x, y: p.y })),
        fill: wf.fill,
        opacity: wf.opacity,
        stroke: wf.stroke,
        strokeWidth: wf.strokeWidth,
        zDepth: zAvg,
        brightness: b,
        kind: wf.kind,
        hatchPattern: wf.hatchPattern,
        priority: wf.priority ?? 0,
      };
    });

    projected.sort((a, b) => {
      if (a.zDepth !== b.zDepth) return a.zDepth - b.zDepth;
      if (a.kind !== b.kind) return a.kind === "WATER" ? -1 : 1;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.id - b.id;
    });

    return projected;
  }, [worldGeometry, project, brightness]);

  // ===== VECTORS (CORRIGIDO: DISTRIBUI EM ALTURA (y) E LARGURA (z)) =====
  const vectors = useMemo(() => {
    if (!showVectors) return [];

    const vecs: any[] = [];

    const isInside = (p: { x: number; y: number }) =>
      p.x >= 10 && p.x <= SVG_W - 10 && p.y >= 10 && p.y <= SVG_H - 10;

    // ✅ agora recebe z
    const pushArrow = (
      x: number,
      y: number,
      z: number,
      nx: number,
      ny: number,
      magWorld: number,
      color: string,
      isResultant: boolean,
      val?: string
    ) => {
      let finalMag = magWorld;

      const pEnd = project({ x, y, z });
      let pStart = project({ x: x - nx * finalMag, y: y - ny * finalMag, z });

      if (!isInside(pStart)) {
        for (let f of [0.8, 0.6, 0.4, 0.2, 0.1, 0.05]) {
          const testMag = magWorld * f;
          const testStart = project({ x: x - nx * testMag, y: y - ny * testMag, z });
          if (isInside(testStart)) {
            finalMag = testMag;
            pStart = testStart;
            break;
          }
        }
      }

      vecs.push({
        start: pStart,
        end: pEnd,
        color,
        isResultant,
        val: val || "",
        opacity: isResultant ? 1 : 0.40,
        strokeWidth: isResultant ? 3.5 : 1.35,
      });
    };

    const localNormal = (y: number, side: "UPSTREAM" | "DOWNSTREAM") => {
      const dy = 0.05;
      const y1 = Math.max(0, y - dy);
      const y2 = Math.min(damHeight, y + dy);
      const x1 = getDamXAtY(y1, side);
      const x2 = getDamXAtY(y2, side);
      const dx = x2 - x1;
      const dY = y2 - y1;

      let nx = -dY;
      let ny = dx;

      if (side === "UPSTREAM") {
        if (nx < 0) { nx = -nx; ny = -ny; }
      } else {
        if (nx > 0) { nx = -nx; ny = -ny; }
      }

      const m = Math.sqrt(nx * nx + ny * ny) || 1;
      return { nx: nx / m, ny: ny / m };
    };

    // ===== grade de amostragem =====
    // mais pontos em y (altura) e z (largura do canal)
    const Ny = 40; // altura (linhas)
    const Nz = is3D ? 20 : 1; // largura (colunas) - no 2D fica 1

    const zMin = -CHANNEL_WIDTH / 2;
    const zMax = CHANNEL_WIDTH / 2;
    const zAt = (j: number) => (Nz === 1 ? 0 : zMin + (j / (Nz - 1)) * (zMax - zMin));

    const contactXWorld = (y: number, side: "UPSTREAM" | "DOWNSTREAM", z: number) => {
      const base = getDamXAtY(y, side);
      const off = archOffsetFn ? archOffsetFn(z) : 0;
      return toWorldX(base + off);
    };

    // 1) Pressão distribuída - Montante (vermelho)
    if (upstreamLevel > 0) {
      for (let i = 0; i < Ny; i++) {
        const d = (i / (Ny - 1)) * upstreamLevel;   // profundidade (0 topo -> H fundo)
        const y = upstreamLevel - d;

        const { nx, ny } = localNormal(y, "UPSTREAM");

        // comprimento proporcional à profundidade (triângulo)
        const Lpx = 10 + (72 - 10) * (d / Math.max(1e-9, upstreamLevel));
        const Lw = Lpx / SCALE;

        for (let j = 0; j < Nz; j++) {
          const z = zAt(j);
          const x = contactXWorld(y, "UPSTREAM", z);
          pushArrow(x, y, z, nx, ny, Lw, "#ef4444", false);
        }
      }
    }

    // 1) Pressão distribuída - Jusante (azul)
    if (downstreamLevel > 0) {
      for (let i = 0; i < Ny; i++) {
        const d = (i / (Ny - 1)) * downstreamLevel;
        const y = downstreamLevel - d;

        const { nx, ny } = localNormal(y, "DOWNSTREAM");

        const Lpx = 10 + (72 - 10) * (d / Math.max(1e-9, downstreamLevel));
        const Lw = Lpx / SCALE;

        for (let j = 0; j < Nz; j++) {
          const z = zAt(j);
          const x = contactXWorld(y, "DOWNSTREAM", z);
          pushArrow(x, y, z, nx, ny, Lw, "#3b82f6", false);
        }
      }
    }

    // 2) Resultantes (mantém no centro z=0 para ficar “limpo”)
    if (up && up.FR > 1e-6) {
      const ycp = up.y_cp;
      const z = 0;
      const xcp = contactXWorld(ycp, "UPSTREAM", z);
      const { nx, ny } = localNormal(ycp, "UPSTREAM");

      const FR_kN = up.FR / 1000;
      const arrowPx = clamp(25 + FR_kN * 0.05, 30, 85);
      pushArrow(xcp, ycp, z, nx, ny, arrowPx / SCALE, "#b91c1c", true, `${FR_kN.toFixed(1)} kN/m`);
    }

    if (down && down.FR > 1e-6) {
      const ycp = down.y_cp;
      const z = 0;
      const xcp = contactXWorld(ycp, "DOWNSTREAM", z);
      const { nx, ny } = localNormal(ycp, "DOWNSTREAM");

      const FR_kN = down.FR / 1000;
      const arrowPx = clamp(25 + FR_kN * 0.05, 30, 85);
      pushArrow(xcp, ycp, z, nx, ny, arrowPx / SCALE, "#1d4ed8", true, `${FR_kN.toFixed(1)} kN/m`);
    }

    return vecs;
  }, [
    showVectors,
    is3D,
    upstreamLevel,
    downstreamLevel,
    up,
    down,
    damHeight,
    getDamXAtY,
    project,
    toWorldX,
    SCALE,
    archOffsetFn,
  ]);

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
      {/* halos estilo TankScene */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full blur-[120px] opacity-40"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.18), transparent 60%)" }}
        />
        <div
          className="absolute -bottom-28 -right-28 w-[520px] h-[520px] rounded-full blur-[140px] opacity-40"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.18), transparent 60%)" }}
        />
      </div>

      {/* barra de controles */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/85 p-1.5 rounded-full shadow-xl border border-blue-100/70 backdrop-blur-md z-30 transition-all hover:scale-[1.03]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            setIs3D((v) => !v);
          }}
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

      {/* botão analisar/reiniciar */}
      <div
        className="absolute bottom-20 right-6 z-30"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={isAnalyzed ? onReset : onCalculate}
          className={`
            flex items-center gap-2
            px-5 py-2.5 rounded-full
            shadow-lg
            font-black text-xs tracking-wide uppercase
            transition-all active:scale-95
            ${isAnalyzed
              ? "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-slate-200/50"
              : "bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-600 text-white shadow-blue-500/20"}
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

      {/* dica de interação */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-slate-400 bg-white/80 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest pointer-events-none backdrop-blur select-none animate-in fade-in transition-opacity z-20"
        style={{ opacity: isDraggingRef.current ? 0.55 : 1 }}
      >
        <span className="flex items-center gap-1">
          <MousePointer2 className="w-3 h-3" /> {is3D ? "Girar" : "Mover"}
        </span>
        <span className="w-px h-3 bg-slate-300" />
        <span className="flex items-center gap-1">
          <span className="font-black">Shift</span> + arrastar: pan
        </span>
      </div>

      {/* reset câmera */}
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

      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="flex-1 touch-none"
      >
        <defs>
          {/* Água */}
          <linearGradient id="fluidDepthA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="fluidDepthB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.78" />
          </linearGradient>
          <linearGradient id="surfaceGradientA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="surfaceGradientB" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
          </linearGradient>

          {/* Concreto */}
          <pattern id="concretePattern" width="50" height="50" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="12" r="1.2" fill="#475569" opacity="0.35" />
            <circle cx="32" cy="20" r="1.6" fill="#475569" opacity="0.28" />
            <circle cx="18" cy="38" r="1.1" fill="#475569" opacity="0.32" />
            <circle cx="42" cy="42" r="1.3" fill="#475569" opacity="0.26" />
            <circle cx="25" cy="28" r="0.9" fill="#475569" opacity="0.25" />
          </pattern>

          {/* Terra */}
          <pattern id="earthHatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="10" stroke="#4a3018" strokeWidth="1" opacity="0.22" />
          </pattern>

          <marker id="arrowhead-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#ef4444" />
          </marker>
          <marker id="arrowhead-darkred" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#b91c1c" />
          </marker>
          <marker id="arrowhead-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#3b82f6" />
          </marker>
          <marker id="arrowhead-darkblue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#1d4ed8" />
          </marker>
        </defs>

        {/* Faces */}
        {rendered.map((f) => {
          if (f.pts.length < 3) return null;
          const d = `M ${f.pts.map((p) => `${p.x},${p.y}`).join(" L ")} Z`;

          const style: React.CSSProperties = { transition: "none" };

          if (f.kind === "DAM" && f.fill.startsWith("url")) {
            const overlayColor = f.brightness && f.brightness < 1 ? "#000" : "#fff";
            const overlayOpacity = f.brightness ? Math.abs(1 - f.brightness) * 0.15 : 0;

            return (
              <g key={f.id}>
                <path d={d} fill={f.fill} opacity={f.opacity} stroke={f.stroke} strokeWidth={f.strokeWidth} strokeLinejoin="round" style={style} />
                <path d={d} fill={overlayColor} opacity={overlayOpacity} style={{ mixBlendMode: f.brightness && f.brightness < 1 ? "multiply" : "overlay" }} />
                {f.hatchPattern && <path d={d} fill={f.hatchPattern} opacity={1} stroke="none" />}
              </g>
            );
          }

          return (
            <g key={f.id}>
              <path d={d} fill={f.fill} opacity={f.opacity} stroke={f.stroke} strokeWidth={f.strokeWidth} strokeLinejoin="round" style={style} />
              {f.hatchPattern && <path d={d} fill={f.hatchPattern} opacity={1} stroke="none" />}
            </g>
          );
        })}

        {/* Vectors */}
        {vectors.map((v: any, i: number) => {
          const color = v.color as string;
          const marker =
            color === "#ef4444"
              ? "url(#arrowhead-red)"
              : color === "#b91c1c"
              ? "url(#arrowhead-darkred)"
              : color === "#3b82f6"
              ? "url(#arrowhead-blue)"
              : "url(#arrowhead-darkblue)";

          const dx = v.end.x - v.start.x;
          const dy = v.end.y - v.start.y;
          const mag = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = -dy / mag;
          const ny = dx / mag;

          const labelX = v.start.x + dx * 0.5 + nx * 16;
          const labelY = v.start.y + dy * 0.5 + ny * 16;

          return (
            <g key={`vec-${i}`}>
              <line
                x1={v.start.x}
                y1={v.start.y}
                x2={v.end.x}
                y2={v.end.y}
                stroke={color}
                strokeWidth={v.strokeWidth}
                markerEnd={marker}
                opacity={v.opacity}
              />
              <circle cx={v.end.x} cy={v.end.y} r={v.isResultant ? 3 : 1.6} fill={color} />

              {v.val && (
                <g transform={`translate(${labelX}, ${labelY})`}>
                  <rect x="-42" y="-12" width="84" height="24" rx="6" fill="#0f172a" opacity="0.78" />
                  <text x="0" y="0" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="10" fontWeight="bold" fontFamily="monospace">
                    {v.val}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};