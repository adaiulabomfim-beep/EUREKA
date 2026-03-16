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

  // Reduzido para minimizar facetamento visual excessivo
  const steps = xOffsetFn ? 24 : 1;
  const dz = zWidth / steps;
  const zStart = zOffset - zWidth / 2;
  const p = priority !== undefined ? priority : (kind === "DAM" ? 2 : 1);

  const mapPt = (pt: { x: number; y: number }, z: number) => {
    const off = xOffsetFn ? xOffsetFn(z) : 0;
    return { x: toWorldX(pt.x + off), y: pt.y, z };
  };

  const zF = zOffset + zWidth / 2;
  const zB = zOffset - zWidth / 2;

  // Caps sem contorno para evitar marcação das divisões
  faces.push(
    criarFace(
      profile.map((pt) => mapPt(pt, zF)),
      fill,
      opacity,
      "none",
      0,
      { x: 0, y: 0, z: 1 },
      kind,
      hatchPattern,
      p
    )
  );

  faces.push(
    criarFace(
      profile.map((pt) => mapPt(pt, zB)).reverse(),
      fill,
      opacity,
      "none",
      0,
      { x: 0, y: 0, z: -1 },
      kind,
      hatchPattern,
      p
    )
  );

  // Mantém apenas a leitura da crista
  const crestPts = [profile[profile.length - 1], profile[0]];

  if (stroke !== "none" && strokeWidth > 0) {
    faces.push(
      criarFace(
        crestPts.map((pt) => mapPt(pt, zF)),
        "none",
        1,
        stroke,
        strokeWidth * 1.5,
        { x: 0, y: 1, z: 0 },
        kind,
        undefined,
        p + 1
      )
    );

    faces.push(
      criarFace(
        crestPts.map((pt) => mapPt(pt, zB)).reverse(),
        "none",
        1,
        stroke,
        strokeWidth * 1.5,
        { x: 0, y: 1, z: 0 },
        kind,
        undefined,
        p + 1
      )
    );
  }

  // Faces laterais sem stroke para não denunciar a segmentação
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

      faces.push(
        criarFace(
          [p1_z1, p2_z1, p2_z2, p1_z2],
          fill,
          opacity,
          "none",
          0,
          { x: nx, y: ny, z: 0 },
          kind,
          hatchPattern,
          p
        )
      );
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
  const WATER_LINE_COLOR = "#3b82f6";

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

  faces.push(
    criarFace(
      poly,
      fill,
      1,
      "none",
      0,
      { x: 0, y: 0, z: 1 },
      "WATER",
      undefined,
      0
    )
  );

  const xC = toWorldX(getDamXAtY(waterLevelY, damFaceSide));
  const linePts =
    damFaceSide === "UPSTREAM"
      ? [{ x: farWorldX, y: waterLevelY, z: 0 }, { x: xC, y: waterLevelY, z: 0 }]
      : [{ x: xC, y: waterLevelY, z: 0 }, { x: farWorldX, y: waterLevelY, z: 0 }];

  faces.push(
    criarFace(
      linePts,
      "none",
      1,
      WATER_LINE_COLOR,
      2,
      { x: 0, y: 0, z: 1 },
      "WATER"
    )
  );

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

  // Poucos segmentos para não reaparecerem linhas, mas suficientes para seguir a curvatura
  const steps = offsetFn ? 8 : 1;
  const dz = depth / steps;
  const zStart = -depth / 2;

  const farWorldX = toWorldX(farX);
  const fill = fillId === "A" ? "url(#fluidDepthA)" : "url(#fluidDepthB)";
  const surf = fillId === "A" ? "url(#surfaceGradientA)" : "url(#surfaceGradientB)";

  const numProfileSteps = 10;
  const profileYs: number[] = [];
  for (let i = 0; i <= numProfileSteps; i++) {
    profileYs.push((i / numProfileSteps) * waterLevelY);
  }

const getContactX = (y: number, z: number) => {
  const base = getDamXAtY(y, damFaceSide);
  const off = offsetFn ? offsetFn(z) : 0;
  return toWorldX(base + off);
};

  // 1) Parede curva de contato com a barragem
  for (let s = 0; s < steps; s++) {
    const z1 = zStart + s * dz;
    const z2 = zStart + (s + 1) * dz;

    for (let i = 0; i < profileYs.length - 1; i++) {
      const y1 = profileYs[i];
      const y2 = profileYs[i + 1];

      const xC1_y1 = getContactX(y1, z1);
      const xC1_y2 = getContactX(y2, z1);
      const xC2_y1 = getContactX(y1, z2);
      const xC2_y2 = getContactX(y2, z2);

      const contactWallPts =
        damFaceSide === "UPSTREAM"
          ? [
              { x: xC1_y1, y: y1, z: z1 },
              { x: xC1_y2, y: y2, z: z1 },
              { x: xC2_y2, y: y2, z: z2 },
              { x: xC2_y1, y: y1, z: z2 },
            ]
          : [
              { x: xC2_y1, y: y1, z: z2 },
              { x: xC2_y2, y: y2, z: z2 },
              { x: xC1_y2, y: y2, z: z1 },
              { x: xC1_y1, y: y1, z: z1 },
            ];

      const dx = xC1_y2 - xC1_y1;
      const dy = y2 - y1;
      const mag = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = damFaceSide === "UPSTREAM" ? dy / mag : -dy / mag;
      const ny = damFaceSide === "UPSTREAM" ? -dx / mag : dx / mag;

      faces.push(
        criarFace(contactWallPts, fill, 1, "none", 0, { x: nx, y: ny, z: 0 }, "WATER", undefined, -1)
      );
    }
  }

  // 2) Tampa traseira
  {
    const zBack = zStart;
    const backPts = [{ x: farWorldX, y: 0, z: zBack }];

    for (let i = 0; i <= numProfileSteps; i++) {
      backPts.push({
        x: getContactX(profileYs[i], zBack),
        y: profileYs[i],
        z: zBack,
      });
    }

    backPts.push({ x: farWorldX, y: waterLevelY, z: zBack });

    if (damFaceSide === "UPSTREAM") {
      backPts.reverse();
    }

    faces.push(
      criarFace(backPts, fill, 1, "none", 0, { x: 0, y: 0, z: -1 }, "WATER", undefined, -1)
    );
  }

  // 3) Tampa frontal
  {
    const zFront = zStart + depth;
    const frontPts = [{ x: farWorldX, y: 0, z: zFront }];

    for (let i = 0; i <= numProfileSteps; i++) {
      frontPts.push({
        x: getContactX(profileYs[i], zFront),
        y: profileYs[i],
        z: zFront,
      });
    }

    frontPts.push({ x: farWorldX, y: waterLevelY, z: zFront });

    if (damFaceSide === "DOWNSTREAM") {
      frontPts.reverse();
    }

    faces.push(
      criarFace(frontPts, fill, 1, "none", 0, { x: 0, y: 0, z: 1 }, "WATER", undefined, -1)
    );
  }

  // 4) Superfície superior seguindo a curvatura da barragem
  {
    const topPts: Point3D[] = [];
    const topSamples = Math.max(12, steps * 2);

    if (damFaceSide === "UPSTREAM") {
      for (let i = 0; i <= topSamples; i++) {
        const z = zStart + (i / topSamples) * depth;
        topPts.push({
          x: farWorldX,
          y: waterLevelY,
          z,
        });
      }

      for (let i = topSamples; i >= 0; i--) {
        const z = zStart + (i / topSamples) * depth;
        topPts.push({
          x: getContactX(waterLevelY, z) - 0.1,
          y: waterLevelY,
          z,
        });
      }
    } else {
      for (let i = 0; i <= topSamples; i++) {
        const z = zStart + (i / topSamples) * depth;
        topPts.push({
          x: getContactX(waterLevelY, z) + 0.1,
          y: waterLevelY,
          z,
        });
      }

      for (let i = topSamples; i >= 0; i--) {
        const z = zStart + (i / topSamples) * depth;
        topPts.push({
          x: farWorldX,
          y: waterLevelY,
          z,
        });
      }
    }

    faces.push(
      criarFace(topPts, surf, 1, "none", 0, { x: 0, y: 1, z: 0 }, "WATER", undefined, -1)
    );
  }

  // 5) Base inferior
  {
    const botPts: Point3D[] = [];
    const botSamples = Math.max(12, steps * 2);

    if (damFaceSide === "UPSTREAM") {
      for (let i = 0; i <= botSamples; i++) {
        const z = zStart + (i / botSamples) * depth;
        botPts.push({
          x: farWorldX,
          y: 0,
          z,
        });
      }

      for (let i = botSamples; i >= 0; i--) {
        const z = zStart + (i / botSamples) * depth;
        botPts.push({
          x: getContactX(0, z),
          y: 0,
          z,
        });
      }
    } else {
      for (let i = 0; i <= botSamples; i++) {
        const z = zStart + (i / botSamples) * depth;
        botPts.push({
          x: getContactX(0, z),
          y: 0,
          z,
        });
      }

      for (let i = botSamples; i >= 0; i--) {
        const z = zStart + (i / botSamples) * depth;
        botPts.push({
          x: farWorldX,
          y: 0,
          z,
        });
      }
    }

    faces.push(
      criarFace(botPts, fill, 1, "none", 0, { x: 0, y: -1, z: 0 }, "WATER", undefined, -1)
    );
  }

  // 6) Parede distante
  {
    const farWallPts =
      damFaceSide === "UPSTREAM"
        ? [
            { x: farWorldX, y: 0, z: zStart + depth },
            { x: farWorldX, y: waterLevelY, z: zStart + depth },
            { x: farWorldX, y: waterLevelY, z: zStart },
            { x: farWorldX, y: 0, z: zStart },
          ]
        : [
            { x: farWorldX, y: 0, z: zStart },
            { x: farWorldX, y: waterLevelY, z: zStart },
            { x: farWorldX, y: waterLevelY, z: zStart + depth },
            { x: farWorldX, y: 0, z: zStart + depth },
          ];

    faces.push(
      criarFace(
        farWallPts,
        fill,
        1,
        "none",
        0,
        { x: damFaceSide === "UPSTREAM" ? -1 : 1, y: 0, z: 0 },
        "WATER",
        undefined,
        -1
      )
    );
  }

  return faces;
};
