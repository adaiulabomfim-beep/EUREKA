import { Point3D, WorldFace } from './motorCena3D';

export const criarFace = (
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
    const p1 = profile[0]; // upstream bottom
    const p2 = profile[1]; // upstream top
    const t = (y - p1.y) / Math.max(1e-9, p2.y - p1.y);
    return p1.x + t * (p2.x - p1.x);
  } else {
    const p1 = profile[3]; // downstream bottom
    const p2 = profile[2]; // downstream top
    const t = (y - p1.y) / Math.max(1e-9, p2.y - p1.y);
    return p1.x + t * (p2.x - p1.x);
  }
};
export const criarPrisma = (
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
  faces.push(criarFace(profile.map((p) => mapPt(p, zF)), fill, opacity, stroke, strokeWidth, { x: 0, y: 0, z: 1 }, kind, hatchPattern, p));
  faces.push(criarFace(profile.map((p) => mapPt(p, zB)).reverse(), fill, opacity, stroke, strokeWidth, { x: 0, y: 0, z: -1 }, kind, hatchPattern, p));

  // Crest edge (top of profile)
  const crestPts = [profile[profile.length - 1], profile[0]];
  faces.push(criarFace(crestPts.map((p) => mapPt(p, zF)), "none", 1, stroke, strokeWidth * 1.5, { x: 0, y: 1, z: 0 }, kind, undefined, p + 1));
  faces.push(criarFace(crestPts.map((p) => mapPt(p, zB)).reverse(), "none", 1, stroke, strokeWidth * 1.5, { x: 0, y: 1, z: 0 }, kind, undefined, p + 1));

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
      const nx = -dy / mag;
      const ny = dx / mag;

      faces.push(criarFace([p1_z1, p2_z1, p2_z2, p1_z2], fill, opacity, stroke, strokeWidth, { x: nx, y: ny, z: 0 }, kind, hatchPattern, p));

      // Draw longitudinal edges for the crest
      if (i === profile.length - 1) {
        faces.push(criarFace([p1_z1, p1_z2], "none", 1, stroke, strokeWidth, { x: nx, y: ny, z: 0 }, kind, undefined, p + 1));
        faces.push(criarFace([p2_z1, p2_z2], "none", 1, stroke, strokeWidth, { x: nx, y: ny, z: 0 }, kind, undefined, p + 1));
      }
    }
  }

  return faces;
};

export const poligonoAgua2D = (
  waterLevelY: number,
  farX: number,
  damFaceSide: "UPSTREAM" | "DOWNSTREAM",
  getDamXAtY: (y: number, side: "UPSTREAM" | "DOWNSTREAM") => number,
  toWorldX: (x: number) => number,
  fillId: "A" | "B" = "A"
): WorldFace[] => {
  const faces: WorldFace[] = [];
  const farWorldX = toWorldX(farX);
  const fill = fillId === "A" ? "url(#fluidDepthA)" : "url(#fluidDepthB)";
  const WATER_LINE_COLOR = "#38bdf8";

  const numProfileSteps = 10;
  const profileYs: number[] = [];
  for (let i = 0; i <= numProfileSteps; i++) {
    profileYs.push((i / numProfileSteps) * waterLevelY);
  }

  const poly = [{ x: farWorldX, y: 0, z: 0 }];
  for (let i = 0; i <= numProfileSteps; i++) {
    poly.push({ x: toWorldX(getDamXAtY(profileYs[i], damFaceSide)), y: profileYs[i], z: 0 });
  }
  poly.push({ x: farWorldX, y: waterLevelY, z: 0 });

  if (damFaceSide === "UPSTREAM") {
    poly.reverse();
  }

  faces.push(criarFace(poly, fill, 1, "none", 0, { x: 0, y: 0, z: 1 }, "WATER", undefined, 0));

  const xC = toWorldX(getDamXAtY(waterLevelY, damFaceSide));
  const linePts = damFaceSide === "UPSTREAM"
    ? [{ x: farWorldX, y: waterLevelY, z: 0 }, { x: xC, y: waterLevelY, z: 0 }]
    : [{ x: xC, y: waterLevelY, z: 0 }, { x: farWorldX, y: waterLevelY, z: 0 }];
  
  faces.push(criarFace(linePts, "none", 1, WATER_LINE_COLOR, 2, { x: 0, y: 0, z: 1 }, "WATER"));

  return faces;
};

export const caixaAgua3D = (
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
  const steps = offsetFn ? 32 : 1;
  const dz = depth / steps;
  const zStart = -depth / 2;
  const farWorldX = toWorldX(farX);
  const fill = fillId === "A" ? "url(#fluidDepthA)" : "url(#fluidDepthB)";
  const surf = fillId === "A" ? "url(#surfaceGradientA)" : "url(#surfaceGradientB)";

  // We need to sample the dam face profile from y=0 to y=waterLevelY
  const numProfileSteps = 10; // To handle curves or segments
  const profileYs: number[] = [];
  for (let i = 0; i <= numProfileSteps; i++) {
    profileYs.push((i / numProfileSteps) * waterLevelY);
  }

  for (let s = 0; s < steps; s++) {
    const z1 = zStart + s * dz;
    const z2 = zStart + (s + 1) * dz;

    const getContactX = (y: number, z: number) => {
      const base = getDamXAtY(y, damFaceSide);
      const off = offsetFn ? offsetFn(z) : 0;
      return toWorldX(base + off);
    };

    // Build the contact face by iterating over profileYs
    for (let i = 0; i < profileYs.length - 1; i++) {
      const y1 = profileYs[i];
      const y2 = profileYs[i + 1];

      const xC1_y1 = getContactX(y1, z1);
      const xC1_y2 = getContactX(y2, z1);
      const xC2_y1 = getContactX(y1, z2);
      const xC2_y2 = getContactX(y2, z2);

      const contactWallPts = damFaceSide === "UPSTREAM"
        ? [{ x: xC1_y1, y: y1, z: z1 }, { x: xC1_y2, y: y2, z: z1 }, { x: xC2_y2, y: y2, z: z2 }, { x: xC2_y1, y: y1, z: z2 }]
        : [{ x: xC2_y1, y: y1, z: z2 }, { x: xC2_y2, y: y2, z: z2 }, { x: xC1_y2, y: y2, z: z1 }, { x: xC1_y1, y: y1, z: z1 }];
      
      // Calculate normal for the contact face
      const dx = xC1_y2 - xC1_y1;
      const dy = y2 - y1;
      const mag = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = damFaceSide === "UPSTREAM" ? dy / mag : -dy / mag;
      const ny = damFaceSide === "UPSTREAM" ? -dx / mag : dx / mag;

      faces.push(criarFace(contactWallPts, fill, 1, "none", 0, { x: nx, y: ny, z: 0 }, "WATER"));
    }

    const xC1_bot = getContactX(0, z1);
    const xC1_top = getContactX(waterLevelY, z1);
    const xC2_bot = getContactX(0, z2);
    const xC2_top = getContactX(waterLevelY, z2);

    // Back face (z1)
    if (s === 0) {
      const backPts = [{ x: farWorldX, y: 0, z: z1 }];
      for (let i = 0; i <= numProfileSteps; i++) {
        backPts.push({ x: getContactX(profileYs[i], z1), y: profileYs[i], z: z1 });
      }
      backPts.push({ x: farWorldX, y: waterLevelY, z: z1 });
      
      if (damFaceSide === "UPSTREAM") {
        backPts.reverse();
      }
      faces.push(criarFace(backPts, fill, 1, "none", 0, { x: 0, y: 0, z: -1 }, "WATER"));
    }

    // Front face (z2)
    if (s === steps - 1) {
      const frontPts = [{ x: farWorldX, y: 0, z: z2 }];
      for (let i = 0; i <= numProfileSteps; i++) {
        frontPts.push({ x: getContactX(profileYs[i], z2), y: profileYs[i], z: z2 });
      }
      frontPts.push({ x: farWorldX, y: waterLevelY, z: z2 });

      if (damFaceSide === "DOWNSTREAM") {
        frontPts.reverse();
      }
      faces.push(criarFace(frontPts, fill, 1, "none", 0, { x: 0, y: 0, z: 1 }, "WATER"));
    }

    const topPts = damFaceSide === "UPSTREAM"
      ? [{ x: farWorldX, y: waterLevelY, z: z2 }, { x: xC2_top, y: waterLevelY, z: z2 }, { x: xC1_top, y: waterLevelY, z: z1 }, { x: farWorldX, y: waterLevelY, z: z1 }]
      : [{ x: xC1_top, y: waterLevelY, z: z1 }, { x: xC2_top, y: waterLevelY, z: z2 }, { x: farWorldX, y: waterLevelY, z: z2 }, { x: farWorldX, y: waterLevelY, z: z1 }];
    faces.push(criarFace(topPts, surf, 1, "none", 0, { x: 0, y: 1, z: 0 }, "WATER"));

    const botPts = damFaceSide === "UPSTREAM"
      ? [{ x: farWorldX, y: 0, z: z1 }, { x: xC1_bot, y: 0, z: z1 }, { x: xC2_bot, y: 0, z: z2 }, { x: farWorldX, y: 0, z: z2 }]
      : [{ x: xC2_bot, y: 0, z: z2 }, { x: farWorldX, y: 0, z: z2 }, { x: farWorldX, y: 0, z: z1 }, { x: xC1_bot, y: 0, z: z1 }];
    faces.push(criarFace(botPts, fill, 1, "none", 0, { x: 0, y: -1, z: 0 }, "WATER"));

    const farWallPts = damFaceSide === "UPSTREAM"
      ? [{ x: farWorldX, y: 0, z: z2 }, { x: farWorldX, y: waterLevelY, z: z2 }, { x: farWorldX, y: waterLevelY, z: z1 }, { x: farWorldX, y: 0, z: z1 }]
      : [{ x: farWorldX, y: 0, z: z1 }, { x: farWorldX, y: waterLevelY, z: z1 }, { x: farWorldX, y: waterLevelY, z: z2 }, { x: farWorldX, y: 0, z: z2 }];
    faces.push(criarFace(farWallPts, fill, 1, "none", 0, { x: damFaceSide === "UPSTREAM" ? -1 : 1, y: 0, z: 0 }, "WATER"));
  }

  return faces;
};
