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

export const getDamXAtYGeneric = (
  profile: { x: number; y: number }[],
  y: number,
  side: "UPSTREAM" | "DOWNSTREAM"
) => {
  if (side === "UPSTREAM") {
    const p1 = profile[0];
    const p2 = profile[1];
    const t = (y - p1.y) / Math.max(1e-9, p2.y - p1.y);
    return p1.x + t * (p2.x - p1.x);
  } else {
    const p1 = profile[3];
    const p2 = profile[2];
    const t = (y - p1.y) / Math.max(1e-9, p2.y - p1.y);
    return p1.x + t * (p2.x - p1.x);
  }
};

export const criarBaseTerra = (
  maxH: number,
  farLeft: number,
  farRight: number,
  zWidth: number,
  toWorldX: (x: number) => number,
  zOffset: number = 0
): WorldFace[] => {
  const earthDepth = maxH * 0.2;
  const faces: WorldFace[] = [];

  // Subdividir em pedaços menores (ex: 5 pedaços para cada lado) para melhorar o Z-sorting
  const numSplits = 5;
  const leftStep = Math.abs(farLeft) / numSplits;
  const rightStep = Math.abs(farRight) / numSplits;

  for (let i = 0; i < numSplits; i++) {
    const x1 = farLeft + i * leftStep;
    const x2 = farLeft + (i + 1) * leftStep;
    const earthProfile = [
      { x: x1, y: 0 },
      { x: x2, y: 0 },
      { x: x2, y: -earthDepth },
      { x: x1, y: -earthDepth }
    ];
    faces.push(...criarPrisma(
      earthProfile,
      zWidth,
      '#78350f',
      1,
      'none',
      0,
      'DAM',
      undefined,
      zOffset,
      'url(#earthPattern)',
      toWorldX,
      0,
      1,
      1,
      false
    ));
  }

  for (let i = 0; i < numSplits; i++) {
    const x1 = i * rightStep;
    const x2 = (i + 1) * rightStep;
    const earthProfile = [
      { x: x1, y: 0 },
      { x: x2, y: 0 },
      { x: x2, y: -earthDepth },
      { x: x1, y: -earthDepth }
    ];
    faces.push(...criarPrisma(
      earthProfile,
      zWidth,
      '#78350f',
      1,
      'none',
      0,
      'DAM',
      undefined,
      zOffset,
      'url(#earthPattern)',
      toWorldX,
      0,
      1,
      1,
      false
    ));
  }

  return faces;
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
  priority?: number,
  stepsZ?: number,
  stepsY: number = 1,
  showEdges: boolean = false
): WorldFace[] => {
  const faces: WorldFace[] = [];
  const steps = stepsZ !== undefined ? stepsZ : 1;
  const dz = zWidth / steps;
  const zStart = zOffset - zWidth / 2;
  const p = priority !== undefined ? priority : (kind === "DAM" ? 2 : 1);

  const mapPt = (pt: { x: number; y: number }, z: number) => {
    const off = xOffsetFn ? xOffsetFn(z) : 0;
    return { x: toWorldX(pt.x + off), y: pt.y, z };
  };

  const zF = zOffset + zWidth / 2;
  const zB = zOffset - zWidth / 2;

  // Capa frontal (z maior)
  const frontPts = profile.map((pt) => mapPt(pt, zF)).reverse();
  faces.push(criarFace(frontPts, fill, opacity, "none", 0, { x: 0, y: 0, z: 1 }, kind, hatchPattern, p));

  // Capa traseira (z menor)
  const backPts = profile.map((pt) => mapPt(pt, zB));
  faces.push(criarFace(backPts, fill, opacity, "none", 0, { x: 0, y: 0, z: -1 }, kind, hatchPattern, p));

  // Laterais (subdivididas)
  for (let s = 0; s < steps; s++) {
    const sz1 = zStart + s * dz;
    const sz2 = zStart + (s + 1) * dz;

    for (let i = 0; i < profile.length; i++) {
      const p1 = profile[i];
      const p2 = profile[(i + 1) % profile.length];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;

      for (let j = 0; j < stepsY; j++) {
        const t1 = j / stepsY;
        const t2 = (j + 1) / stepsY;

        const subP1 = { x: p1.x + t1 * dx, y: p1.y + t1 * dy };
        const subP2 = { x: p1.x + t2 * dx, y: p1.y + t2 * dy };

        const p1_z1 = mapPt(subP1, sz1);
        const p2_z1 = mapPt(subP2, sz1);
        const p2_z2 = mapPt(subP2, sz2);
        const p1_z2 = mapPt(subP1, sz2);

        // Produto vetorial B x A para normal externa (perfil horário)
        const ax = p2_z1.x - p1_z1.x;
        const ay = p2_z1.y - p1_z1.y;
        const az = p2_z1.z - p1_z1.z;

        const bx = p2_z2.x - p2_z1.x;
        const by = p2_z2.y - p2_z1.y;
        const bz = p2_z2.z - p2_z1.z;

        const nx = by * az - bz * ay;
        const ny = bz * ax - bx * az;
        const nz = bx * ay - by * ax;

        const nmag = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        const trueNormal = { x: nx / nmag, y: ny / nmag, z: nz / nmag };

        faces.push(criarFace(
          [p1_z1, p2_z1, p2_z2, p1_z2],
          fill,
          opacity,
          "none",
          0,
          trueNormal,
          kind,
          hatchPattern,
          p
        ));
      }
    }
  }

  // Bordas externas (apenas se showEdges e stroke definido)
  if (showEdges && stroke !== "none" && strokeWidth > 0) {
    for (let i = 0; i < profile.length; i++) {
      const pt = profile[i];
      const p_z1 = mapPt(pt, zStart);
      const p_z2 = mapPt(pt, zStart + zWidth);
      const edgeFace = criarFace([p_z1, p_z2], "none", 1, stroke, strokeWidth, undefined, kind, undefined, p + 1);
      faces.push(edgeFace);
    }

    for (let i = 0; i < profile.length; i++) {
      const p1 = profile[i];
      const p2 = profile[(i + 1) % profile.length];
      const topEdge = criarFace([mapPt(p1, zF), mapPt(p2, zF)], "none", 1, stroke, strokeWidth, undefined, kind, undefined, p + 1);
      const bottomEdge = criarFace([mapPt(p1, zB), mapPt(p2, zB)], "none", 1, stroke, strokeWidth, undefined, kind, undefined, p + 1);
      faces.push(topEdge);
      faces.push(bottomEdge);
    }
  }

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
  fillId: "A" | "B" = "A",
  stepsZ?: number
): WorldFace[] => {
  const getWaterProfile = (): { x: number; y: number }[] => {
    const xDamBottom = getDamXAtY(0, damFaceSide);
    const xDamTop = getDamXAtY(waterLevelY, damFaceSide);
    
    if (damFaceSide === "UPSTREAM") {
      return [
        { x: farX, y: 0 },
        { x: farX, y: waterLevelY },
        { x: xDamTop, y: waterLevelY },
        { x: xDamBottom, y: 0 }
      ];
    } else {
      return [
        { x: xDamBottom, y: 0 },
        { x: xDamTop, y: waterLevelY },
        { x: farX, y: waterLevelY },
        { x: farX, y: 0 }
      ];
    }
  };

  const fill = fillId === "A" ? "url(#fluidDepthA)" : "url(#fluidDepthB)";
  const ripplePattern = "url(#ripplePattern)";

  const waterFaces = criarPrisma(
    getWaterProfile(),
    depth,
    fill,
    0.95,
    "none",
    0,
    "WATER",
    offsetFn,
    0,
    ripplePattern,
    toWorldX,
    1,
    stepsZ || 1,
    1,
    false
  );

  return waterFaces;
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

  const numProfileSteps = 1;
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
  const rippleHeight = Math.min(30, waterLevelY);
  const ripplePoly = damFaceSide === "UPSTREAM"
    ? [
        { x: farWorldX, y: waterLevelY, z: 0 },
        { x: xC, y: waterLevelY, z: 0 },
        { x: toWorldX(getDamXAtY(waterLevelY - rippleHeight, damFaceSide)), y: waterLevelY - rippleHeight, z: 0 },
        { x: farWorldX, y: waterLevelY - rippleHeight, z: 0 }
      ]
    : [
        { x: xC, y: waterLevelY, z: 0 },
        { x: farWorldX, y: waterLevelY, z: 0 },
        { x: farWorldX, y: waterLevelY - rippleHeight, z: 0 },
        { x: toWorldX(getDamXAtY(waterLevelY - rippleHeight, damFaceSide)), y: waterLevelY - rippleHeight, z: 0 }
      ];

  faces.push(criarFace(ripplePoly, "none", 1, "none", 0, { x: 0, y: 0, z: 1 }, "WATER", "url(#ripplePattern)", 1));

  return faces;
};