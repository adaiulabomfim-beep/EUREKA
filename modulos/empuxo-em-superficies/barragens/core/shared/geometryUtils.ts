import { Point3D, WorldFace } from './useSceneEngine';

export const face = (
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
});

export const getDamXAtYGeneric = (profile: { x: number; y: number }[], y: number, side: "UPSTREAM" | "DOWNSTREAM") => {
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
};
export const prism = (
  profile: { x: number; y: number }[],
  zWidth: number,
  fill: string,
  opacity: number,
  stroke = "none",
  strokeWidth = 1,
  kind: "DAM" | "WATER" = "DAM",
  xOffsetFn?: (z: number) => number,
  zOffset: number = 0,
  hatchPattern?: string,
  toWorldX: (x: number) => number = (x) => x,
  priority?: number
): WorldFace[] => {
  const faces: WorldFace[] = [];
  const steps = xOffsetFn ? 16 : 1;
  const dz = zWidth / steps;
  const zStart = zOffset - zWidth / 2;
  const p = priority !== undefined ? priority : (kind === "DAM" ? 2 : 1);

  const mapPt = (p: { x: number; y: number }, z: number) => {
    const off = xOffsetFn ? xOffsetFn(z) : 0;
    return { x: toWorldX(p.x + off), y: p.y, z };
  };

  // Caps
  const zF = zOffset + zWidth / 2;
  const zB = zOffset - zWidth / 2;
  faces.push(face(profile.map((p) => mapPt(p, zF)), fill, opacity, stroke, strokeWidth, { x: 0, y: 0, z: 1 }, kind, hatchPattern, p));
  faces.push(face(profile.map((p) => mapPt(p, zB)).reverse(), fill, opacity, stroke, strokeWidth, { x: 0, y: 0, z: -1 }, kind, hatchPattern, p));

  // Crest edge (top of profile)
  const crestPts = [profile[profile.length - 1], profile[0]];
  faces.push(face(crestPts.map((p) => mapPt(p, zF)), "none", 1, stroke, strokeWidth * 1.5, { x: 0, y: 1, z: 0 }, kind, undefined, p + 1));
  faces.push(face(crestPts.map((p) => mapPt(p, zB)).reverse(), "none", 1, stroke, strokeWidth * 1.5, { x: 0, y: 1, z: 0 }, kind, undefined, p + 1));

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

      faces.push(face([p1_z1, p2_z1, p2_z2, p1_z2], fill, opacity, stroke, strokeWidth, { x: nx, y: ny, z: 0 }, kind, hatchPattern, p));

      // Draw longitudinal edges for the crest
      if (i === profile.length - 1) {
        faces.push(face([p1_z1, p1_z2], "none", 1, stroke, strokeWidth, { x: nx, y: ny, z: 0 }, kind, undefined, p + 1));
        faces.push(face([p2_z1, p2_z2], "none", 1, stroke, strokeWidth, { x: nx, y: ny, z: 0 }, kind, undefined, p + 1));
      }
    }
  }

  return faces;
};

export const waterBox3D = (
  waterLevelY: number,
  depth: number,
  farX: number,
  damFaceSide: "UPSTREAM" | "DOWNSTREAM",
  getDamXAtY: (y: number, side: "UPSTREAM" | "DOWNSTREAM") => number,
  toWorldX: (x: number) => number,
  offsetFn?: (z: number) => number,
  fillId: "A" | "B" = "A"
): WorldFace[] => {
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
      faces.push(face(backPts, fill, 1, "none", 0, { x: 0, y: 0, z: -1 }, "WATER"));
    }
    if (s === steps - 1) {
      const frontPts = damFaceSide === "UPSTREAM"
        ? [{ x: farWorldX, y: 0, z: z2 }, { x: xC2_bot, y: 0, z: z2 }, { x: xC2_top, y: waterLevelY, z: z2 }, { x: farWorldX, y: waterLevelY, z: z2 }]
        : [{ x: xC2_bot, y: 0, z: z2 }, { x: farWorldX, y: 0, z: z2 }, { x: farWorldX, y: waterLevelY, z: z2 }, { x: xC2_top, y: waterLevelY, z: z2 }];
      faces.push(face(frontPts, fill, 1, "none", 0, { x: 0, y: 0, z: 1 }, "WATER"));
    }

    const topPts = damFaceSide === "UPSTREAM"
      ? [{ x: farWorldX, y: waterLevelY, z: z2 }, { x: xC2_top, y: waterLevelY, z: z2 }, { x: xC1_top, y: waterLevelY, z: z1 }, { x: farWorldX, y: waterLevelY, z: z1 }]
      : [{ x: xC1_top, y: waterLevelY, z: z1 }, { x: xC2_top, y: waterLevelY, z: z2 }, { x: farWorldX, y: waterLevelY, z: z2 }, { x: farWorldX, y: waterLevelY, z: z1 }];
    faces.push(face(topPts, surf, 1, "none", 0, { x: 0, y: 1, z: 0 }, "WATER"));

    const botPts = damFaceSide === "UPSTREAM"
      ? [{ x: farWorldX, y: 0, z: z1 }, { x: xC1_bot, y: 0, z: z1 }, { x: xC2_bot, y: 0, z: z2 }, { x: farWorldX, y: 0, z: z2 }]
      : [{ x: xC2_bot, y: 0, z: z2 }, { x: farWorldX, y: 0, z: z2 }, { x: farWorldX, y: 0, z: z1 }, { x: xC1_bot, y: 0, z: z1 }];
    faces.push(face(botPts, fill, 1, "none", 0, { x: 0, y: -1, z: 0 }, "WATER"));

    const farWallPts = damFaceSide === "UPSTREAM"
      ? [{ x: farWorldX, y: 0, z: z2 }, { x: farWorldX, y: waterLevelY, z: z2 }, { x: farWorldX, y: waterLevelY, z: z1 }, { x: farWorldX, y: 0, z: z1 }]
      : [{ x: farWorldX, y: 0, z: z1 }, { x: farWorldX, y: waterLevelY, z: z1 }, { x: farWorldX, y: waterLevelY, z: z2 }, { x: farWorldX, y: 0, z: z2 }];
    faces.push(face(farWallPts, fill, 1, "none", 0, { x: damFaceSide === "UPSTREAM" ? -1 : 1, y: 0, z: 0 }, "WATER"));

    const contactWallPts = damFaceSide === "UPSTREAM"
      ? [{ x: xC1_bot, y: 0, z: z1 }, { x: xC1_top, y: waterLevelY, z: z1 }, { x: xC2_top, y: waterLevelY, z: z2 }, { x: xC2_bot, y: 0, z: z2 }]
      : [{ x: xC2_bot, y: 0, z: z2 }, { x: xC2_top, y: waterLevelY, z: z2 }, { x: xC1_top, y: waterLevelY, z: z1 }, { x: xC1_bot, y: 0, z: z1 }];
    faces.push(face(contactWallPts, fill, 1, "none", 0, { x: damFaceSide === "UPSTREAM" ? 1 : -1, y: 0, z: 0 }, "WATER"));
  }

  return faces;
};
