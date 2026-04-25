import { Point3D, WorldFace } from "./motorCena3D";

// Calcula a normal de uma face a partir de seus vértices (regra da mão direita).
// Assume que os vértices estão em ordem CCW quando vistos do lado de fora.
const computeFaceNormal = (pts: Point3D[]): Point3D => {
  if (pts.length < 3) return { x: 0, y: 0, z: 1 };
  const a = {
    x: pts[1].x - pts[0].x,
    y: pts[1].y - pts[0].y,
    z: pts[1].z - pts[0].z,
  };
  const b = {
    x: pts[2].x - pts[0].x,
    y: pts[2].y - pts[0].y,
    z: pts[2].z - pts[0].z,
  };
  const nx = a.y * b.z - a.z * b.y;
  const ny = a.z * b.x - a.x * b.z;
  const nz = a.x * b.y - a.y * b.x;
  const mag = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  return { x: nx / mag, y: ny / mag, z: nz / mag };
};

export const criarFace = (
  pts3: Point3D[],
  fill: string,
  opacity: number,
  stroke = "none",
  strokeWidth = 1,
  normal?: Point3D,
  kind: "DAM" | "WATER_UP" | "WATER_DOWN" | "EARTH" = "DAM",
  hatchPattern?: string,
  priority: number = 0,
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
  side: "UPSTREAM" | "DOWNSTREAM",
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
  zOffset: number = 0,
): WorldFace[] => {
  const earthDepth = maxH * 0.2;
  const faces: WorldFace[] = [];

  const earthProfileFull = [
    { x: farLeft, y: 0 },
    { x: farRight, y: 0 },
    { x: farRight, y: -earthDepth },
    { x: farLeft, y: -earthDepth },
  ];

  faces.push(
    ...criarPrisma(
      earthProfileFull,
      zWidth,
      "#a16207",
      1,
      "#713f12",
      1.2,
      "DAM",
      undefined,
      zOffset,
      "url(#earthPattern)",
      toWorldX,
      0,
      1,
      1,
      true,
    ),
  );

  return faces;
};

export const criarPrisma = (
  profile: { x: number; y: number }[],
  zWidth: number,
  fill: string,
  opacity: number,
  stroke = "none",
  strokeWidth = 1.2,
  kind: "DAM" | "WATER_UP" | "WATER_DOWN" | "EARTH" = "DAM",
  xOffsetFn?: (z: number, x: number) => number,
  zOffset: number = 0,
  hatchPattern?: string,
  toWorldX: (x: number) => number = (x) => x,
  priority?: number,
  stepsZ?: number,
  stepsY: number = 1,
  showEdges: boolean = false,
): WorldFace[] => {
  const faces: WorldFace[] = [];
  const steps = stepsZ !== undefined ? stepsZ : 1;
  const dz = zWidth / steps;
  const zStart = zOffset - zWidth / 2;
  const p = priority !== undefined ? priority : kind === "DAM" ? 2 : 1;

  const mapPt = (pt: { x: number; y: number }, z: number) => {
    const off = xOffsetFn ? xOffsetFn(z, pt.x) : 0;
    return { x: toWorldX(pt.x + off), y: pt.y, z };
  };

  const zF = zOffset + zWidth / 2;
  const zB = zOffset - zWidth / 2;

  // --- Determinar orientação do perfil (CW ou CCW no plano XY) ---
  // Calcular área sinalada para determinar se o perfil é CW ou CCW
  let signedArea = 0;
  for (let i = 0; i < profile.length; i++) {
    const p1 = profile[i];
    const p2 = profile[(i + 1) % profile.length];
    signedArea += (p2.x - p1.x) * (p2.y + p1.y);
  }
  // signedArea > 0 => CW (no sistema com Y para cima = CW visual)
  // signedArea < 0 => CCW
  const profileIsCW = signedArea > 0;

  // --- Capa frontal (z maior) ---
  // A normal deve apontar para +Z.
  // Se o perfil é CW (visto de +Z), os pontos já estão em ordem CW,
  // então precisamos reverter para CCW (regra da mão direita -> +Z).
  // Se o perfil é CCW, já está correto.
  const frontPtsRaw = profile.map((pt) => mapPt(pt, zF));
  const frontPts = profileIsCW ? [...frontPtsRaw].reverse() : frontPtsRaw;
  faces.push(
    criarFace(
      frontPts,
      fill,
      opacity,
      "none",
      0,
      { x: 0, y: 0, z: 1 },
      kind,
      kind.startsWith("WATER") ? undefined : hatchPattern,
      p,
    ),
  );

  // --- Capa traseira (z menor) ---
  // A normal deve apontar para -Z.
  // Se o perfil é CW, mantém a ordem (CW visto de -Z = CCW de fora = norma para -Z).
  // Se o perfil é CCW, reverte.
  const backPtsRaw = profile.map((pt) => mapPt(pt, zB));
  const backPts = profileIsCW ? backPtsRaw : [...backPtsRaw].reverse();
  faces.push(
    criarFace(
      backPts,
      fill,
      opacity,
      "none",
      0,
      { x: 0, y: 0, z: -1 },
      kind,
      kind.startsWith("WATER") ? undefined : hatchPattern,
      p,
    ),
  );

  // --- Laterais ---
  for (let s = 0; s < steps; s++) {
    // Overlap para compensar gap de anti-aliasing do SVG
    const isCurved = steps > 1 && xOffsetFn;
    const overlapZ = isCurved ? dz * 0.05 : 0;
    const sz1 = zStart + s * dz - overlapZ;
    const sz2 = zStart + (s + 1) * dz + overlapZ;

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

        const facePts = profileIsCW
          ? [p1_z1, p1_z2, p2_z2, p2_z1]
          : [p1_z1, p2_z1, p2_z2, p1_z2];

        const trueNormal = computeFaceNormal(facePts);
        const isMainWaterFace = !(kind.startsWith("WATER") && i !== 1);

        faces.push(
          criarFace(
            facePts,
            fill,
            opacity,
            "none",
            0,
            trueNormal,
            kind,
            isMainWaterFace ? hatchPattern : undefined,
            p,
          ),
        );
      }
    }
  }

  // Bordas da barragem (segmentadas por steps para acompanhar curvas)
  if (showEdges && stroke !== "none" && strokeWidth > 0) {
    // Arestas longitudinais acompanhando o steps Z (acompanha curvas)
    for (let i = 0; i < profile.length; i++) {
      const pt = profile[i];
      if (!xOffsetFn) {
        // Prisma reto cruzando o Z: uma única linha
        faces.push(
          criarFace(
            [mapPt(pt, zB), mapPt(pt, zF)],
            "none",
            1,
            stroke,
            strokeWidth,
            undefined,
            kind,
            undefined,
            p,
          ),
        );
      } else {
        // Prisma curvo: curva inteira numa única linha
        const edgePts: Point3D[] = [];
        for (let s = 0; s <= steps; s++) {
          const sz = zStart + s * dz;
          edgePts.push(mapPt(pt, sz));
        }
        faces.push(
          criarFace(
            edgePts,
            "none",
            1,
            stroke,
            strokeWidth,
            undefined,
            kind,
            undefined,
            p,
          ),
        );
      }
    }

    // Arestas frontais
    for (let i = 0; i < profile.length; i++) {
      const p1 = profile[i];
      const p2 = profile[(i + 1) % profile.length];
      const topEdge = criarFace(
        [mapPt(p1, zF), mapPt(p2, zF)],
        "none",
        1,
        stroke,
        strokeWidth,
        undefined,
        kind,
        undefined,
        p,
      );
      const bottomEdge = criarFace(
        [mapPt(p1, zB), mapPt(p2, zB)],
        "none",
        1,
        stroke,
        strokeWidth,
        undefined,
        kind,
        undefined,
        p,
      );
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
  offsetFn?: (z: number, x: number) => number,
  fillId: "A" | "B" = "A",
  stepsZ?: number,
): WorldFace[] => {
  const getWaterProfile = (): { x: number; y: number }[] => {
    const xDamBottom = getDamXAtY(0, damFaceSide);
    const xDamTop = getDamXAtY(waterLevelY, damFaceSide);

    if (damFaceSide === "UPSTREAM") {
      return [
        { x: farX, y: 0 },
        { x: farX, y: waterLevelY },
        { x: xDamTop, y: waterLevelY },
        { x: xDamBottom, y: 0 },
      ];
    } else {
      return [
        { x: xDamBottom, y: 0 },
        { x: xDamTop, y: waterLevelY },
        { x: farX, y: waterLevelY },
        { x: farX, y: 0 },
      ];
    }
  };

  const fill = fillId === "A" ? "url(#fluidDepthA)" : "url(#fluidDepthB)";
  const ripplePattern = "url(#ripplePattern)";

  const waterFaces = criarPrisma(
    getWaterProfile(),
    depth,
    fill,
    1,
    "none", // Sem stroke entre faces — elimina linhas de fatiamento
    0,
    damFaceSide === "UPSTREAM" ? "WATER_UP" : "WATER_DOWN",
    offsetFn,
    0,
    ripplePattern,
    toWorldX,
    1,
    stepsZ || 1, // Restaurado para 1, usamos 1 gigante para barragens retas (topologia resolve o z-depth)
    1,
    false,
  );

  return waterFaces;
};

export const poligonoAgua2D = (
  waterLevelY: number,
  farX: number,
  damFaceSide: "UPSTREAM" | "DOWNSTREAM",
  getDamXAtY: (y: number, side: "UPSTREAM" | "DOWNSTREAM") => number,
  toWorldX: (x: number) => number,
  fillId: "A" | "B" = "A",
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
    poly.push({
      x: toWorldX(getDamXAtY(profileYs[i], damFaceSide)),
      y: profileYs[i],
      z: 0,
    });
  }
  poly.push({ x: farWorldX, y: waterLevelY, z: 0 });

  if (damFaceSide === "UPSTREAM") {
    poly.reverse();
  }

  faces.push(
    criarFace(
      poly,
      fill,
      1,
      "none",
      0,
      { x: 0, y: 0, z: 1 },
      damFaceSide === "UPSTREAM" ? "WATER_UP" : "WATER_DOWN",
      undefined,
      0,
    ),
  );

  const xC = toWorldX(getDamXAtY(waterLevelY, damFaceSide));
  const rippleHeight = Math.min(30, waterLevelY);
  const ripplePoly =
    damFaceSide === "UPSTREAM"
      ? [
          { x: farWorldX, y: waterLevelY, z: 0 },
          { x: xC, y: waterLevelY, z: 0 },
          {
            x: toWorldX(getDamXAtY(waterLevelY - rippleHeight, damFaceSide)),
            y: waterLevelY - rippleHeight,
            z: 0,
          },
          { x: farWorldX, y: waterLevelY - rippleHeight, z: 0 },
        ]
      : [
          { x: xC, y: waterLevelY, z: 0 },
          { x: farWorldX, y: waterLevelY, z: 0 },
          { x: farWorldX, y: waterLevelY - rippleHeight, z: 0 },
          {
            x: toWorldX(getDamXAtY(waterLevelY - rippleHeight, damFaceSide)),
            y: waterLevelY - rippleHeight,
            z: 0,
          },
        ];

  faces.push(
    criarFace(
      ripplePoly,
      "none",
      1,
      "none",
      0,
      { x: 0, y: 0, z: 1 },
      damFaceSide === "UPSTREAM" ? "WATER_UP" : "WATER_DOWN",
      "url(#ripplePattern)",
      1,
    ),
  );

  return faces;
};
