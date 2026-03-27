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
  priority?: number,
  stepsZ?: number,
  stepsY: number = 1
): WorldFace[] => {
  const faces: WorldFace[] = [];

  // Reduzido para minimizar facetamento visual excessivo, mas mantido em 24 para DAM para z-sorting
  const steps = stepsZ !== undefined ? stepsZ : (xOffsetFn || kind === 'DAM' ? 24 : 1);
  const dz = zWidth / steps;
  const zStart = zOffset - zWidth / 2;
  const p = priority !== undefined ? priority : (kind === "DAM" ? 2 : 1);

  const mapPt = (pt: { x: number; y: number }, z: number) => {
    const off = xOffsetFn ? xOffsetFn(z) : 0;
    return { x: toWorldX(pt.x + off), y: pt.y, z };
  };

  const zF = zOffset + zWidth / 2;
  const zB = zOffset - zWidth / 2;

  // Caps sem contorno (usarão seamStroke)
  const capStroke = "none";
  const capStrokeWidth = 0;

  faces.push(
    criarFace(
      profile.map((pt) => mapPt(pt, zF)).reverse(),
      fill,
      opacity,
      capStroke,
      capStrokeWidth,
      { x: 0, y: 0, z: 1 },
      kind,
      hatchPattern,
      p
    )
  );

  faces.push(
    criarFace(
      profile.map((pt) => mapPt(pt, zB)),
      fill,
      opacity,
      capStroke,
      capStrokeWidth,
      { x: 0, y: 0, z: -1 },
      kind,
      hatchPattern,
      p
    )
  );

  // Faces laterais com stroke para definir as arestas
  const latStroke = "none";
  const latStrokeWidth = 0;

  for (let s = 0; s < steps; s++) {
    const sz1 = zStart + s * dz;
    const sz2 = zStart + (s + 1) * dz;

    for (let i = 0; i < profile.length; i++) {
      const p1 = profile[i];
      const p2 = profile[(i + 1) % profile.length];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const mag = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / mag;
      const ny = dx / mag;

      for (let j = 0; j < stepsY; j++) {
        const t1 = j / stepsY;
        const t2 = (j + 1) / stepsY;

        const subP1 = { x: p1.x + t1 * dx, y: p1.y + t1 * dy };
        const subP2 = { x: p1.x + t2 * dx, y: p1.y + t2 * dy };

        const p1_z1 = mapPt(subP1, sz1);
        const p2_z1 = mapPt(subP2, sz1);
        const p2_z2 = mapPt(subP2, sz2);
        const p1_z2 = mapPt(subP1, sz2);

        faces.push(
          criarFace(
            [p1_z1, p2_z1, p2_z2, p1_z2],
            fill,
            opacity,
            latStroke,
            latStrokeWidth,
            { x: nx, y: ny, z: 0 },
            kind,
            hatchPattern,
            p
          )
        );
      }
    }
  }

  // Desenha as arestas longitudinais e dos caps
  if (stroke !== "none" && strokeWidth > 0) {
    for (let i = 0; i < profile.length; i++) {
      const pt = profile[i];
      
      // Segmenta a linha longitudinal para garantir z-sorting correto com as faces laterais
      for (let s = 0; s < steps; s++) {
        const sz1 = zStart + s * dz;
        const sz2 = zStart + (s + 1) * dz;
        
        const p_z1 = mapPt(pt, sz1);
        const p_z2 = mapPt(pt, sz2);
        
        faces.push(
          criarFace(
            [p_z1, p_z2],
            "none",
            1,
            stroke,
            strokeWidth,
            { x: 0, y: 1, z: 0 }, // Normal arbitrária
            kind,
            undefined,
            p + 1 // Prioridade ligeiramente maior para desenhar sobre a face
          )
        );
      }
    }

    // Desenha as arestas dos caps (linhas do perfil)
    for (let i = 0; i < profile.length; i++) {
      const p1 = profile[i];
      const p2 = profile[(i + 1) % profile.length];
      
      // Cap frontal
      faces.push(
        criarFace(
          [mapPt(p1, zF), mapPt(p2, zF)],
          "none",
          1,
          stroke,
          strokeWidth,
          { x: 0, y: 0, z: 1 },
          kind,
          undefined,
          p + 1
        )
      );
      
      // Cap traseiro
      faces.push(
        criarFace(
          [mapPt(p1, zB), mapPt(p2, zB)],
          "none",
          1,
          stroke,
          strokeWidth,
          { x: 0, y: 0, z: -1 },
          kind,
          undefined,
          p + 1
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

  faces.push(
    criarFace(
      ripplePoly,
      "none",
      1,
      "none",
      0,
      { x: 0, y: 0, z: 1 },
      "WATER",
      "url(#ripplePattern)",
      1
    )
  );

  const linePts =
    damFaceSide === "UPSTREAM"
      ? [{ x: farWorldX, y: waterLevelY, z: 0 }, { x: xC, y: waterLevelY, z: 0 }]
      : [{ x: xC, y: waterLevelY, z: 0 }, { x: farWorldX, y: waterLevelY, z: 0 }];

  faces.push(
    criarFace(
      linePts,
      "none",
      1,
      "rgba(255,255,255,0.5)",
      1,
      { x: 0, y: 0, z: 1 },
      "WATER",
      undefined,
      2
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
  fillId: "A" | "B" = "A",
  stepsZ?: number
): WorldFace[] => {
  const faces: WorldFace[] = [];

  // Usar o mesmo número de passos da barragem (24) para evitar desalinhamento e vazamento visual
  const steps = stepsZ !== undefined ? stepsZ : (offsetFn ? 24 : 1);
  const dz = depth / steps;
  const zStart = -depth / 2;

  const farWorldX = toWorldX(farX);
  const fill = fillId === "A" ? "url(#fluidDepthA)" : "url(#fluidDepthB)";
  
  // Cores sólidas para topo e base para evitar artefatos de repetição de gradiente em malhas segmentadas
  const surfColor = "none";
  const surfOpacity = 1;
  const botColor = fillId === "A" ? "#2563eb" : "#1d4ed8";
  const botOpacity = 0.8;
  const ripplePattern = "url(#ripplePattern)";

  const numProfileSteps = 12;
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

      const offset = damFaceSide === "UPSTREAM" ? -0.05 : 0.05;

      const contactWallPts =
        damFaceSide === "UPSTREAM"
          ? [
              { x: xC1_y1 + offset, y: y1, z: z1 },
              { x: xC1_y2 + offset, y: y2, z: z1 },
              { x: xC2_y2 + offset, y: y2, z: z2 },
              { x: xC2_y1 + offset, y: y1, z: z2 },
            ]
          : [
              { x: xC2_y1 + offset, y: y1, z: z2 },
              { x: xC2_y2 + offset, y: y2, z: z2 },
              { x: xC1_y2 + offset, y: y2, z: z1 },
              { x: xC1_y1 + offset, y: y1, z: z1 },
            ];

      const dx = xC1_y2 - xC1_y1;
      const dy = y2 - y1;
      const mag = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = damFaceSide === "UPSTREAM" ? dy / mag : -dy / mag;
      const ny = damFaceSide === "UPSTREAM" ? -dx / mag : dx / mag;

      const contactColor = fillId === "A" ? "#3b82f6" : "#2563eb";
      const contactOpacity = 0.6;

      faces.push(
        criarFace(contactWallPts, contactColor, contactOpacity, "none", 0, { x: nx, y: ny, z: 0 }, "WATER", undefined, -1)
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
    for (let s = 0; s < steps; s++) {
      const z1 = zStart + s * dz;
      const z2 = zStart + (s + 1) * dz;
      
      const cx1 = getContactX(waterLevelY, z1);
      const cx2 = getContactX(waterLevelY, z2);

      const pts = damFaceSide === "UPSTREAM"
        ? [
            { x: farWorldX, y: waterLevelY, z: z1 },
            { x: cx1, y: waterLevelY, z: z1 },
            { x: cx2, y: waterLevelY, z: z2 },
            { x: farWorldX, y: waterLevelY, z: z2 },
          ]
        : [
            { x: farWorldX, y: waterLevelY, z: z2 },
            { x: cx2, y: waterLevelY, z: z2 },
            { x: cx1, y: waterLevelY, z: z1 },
            { x: farWorldX, y: waterLevelY, z: z1 },
          ];

      faces.push(
        criarFace(pts, surfColor, surfOpacity, "none", 0, { x: 0, y: 1, z: 0 }, "WATER", ripplePattern, -1)
      );
    }

    // Arestas da superfície superior
    faces.push(
      criarFace([{ x: farWorldX, y: waterLevelY, z: zStart }, { x: farWorldX, y: waterLevelY, z: zStart + depth }], "none", 1, "rgba(255,255,255,0.5)", 1, undefined, "WATER", undefined, 0)
    );
    faces.push(
      criarFace([{ x: farWorldX, y: waterLevelY, z: zStart }, { x: getContactX(waterLevelY, zStart), y: waterLevelY, z: zStart }], "none", 1, "rgba(255,255,255,0.5)", 1, undefined, "WATER", undefined, 0)
    );
    faces.push(
      criarFace([{ x: farWorldX, y: waterLevelY, z: zStart + depth }, { x: getContactX(waterLevelY, zStart + depth), y: waterLevelY, z: zStart + depth }], "none", 1, "rgba(255,255,255,0.5)", 1, undefined, "WATER", undefined, 0)
    );
    for (let s = 0; s < steps; s++) {
      const z1 = zStart + s * dz;
      const z2 = zStart + (s + 1) * dz;
      faces.push(
        criarFace([{ x: getContactX(waterLevelY, z1), y: waterLevelY, z: z1 }, { x: getContactX(waterLevelY, z2), y: waterLevelY, z: z2 }], "none", 1, "rgba(255,255,255,0.5)", 1, undefined, "WATER", undefined, 0)
      );
    }
  }

  // 5) Base inferior (segmentada apenas em Z para Z-sorting correto)
  {
    for (let s = 0; s < steps; s++) {
      const z1 = zStart + s * dz;
      const z2 = zStart + (s + 1) * dz;
      
      const cx1 = getContactX(0, z1);
      const cx2 = getContactX(0, z2);

      const pts = damFaceSide === "UPSTREAM"
        ? [
            { x: farWorldX, y: 0, z: z2 },
            { x: cx2, y: 0, z: z2 },
            { x: cx1, y: 0, z: z1 },
            { x: farWorldX, y: 0, z: z1 },
          ]
        : [
            { x: farWorldX, y: 0, z: z1 },
            { x: cx1, y: 0, z: z1 },
            { x: cx2, y: 0, z: z2 },
            { x: farWorldX, y: 0, z: z2 },
          ];

      faces.push(
        criarFace(pts, botColor, botOpacity, "none", 0, { x: 0, y: -1, z: 0 }, "WATER", undefined, -1)
      );
    }
  }

  // 6) Parede distante (segmentada em Z para consistência)
  {
    for (let s = 0; s < steps; s++) {
      const z1 = zStart + s * dz;
      const z2 = zStart + (s + 1) * dz;

      const farWallPts =
        damFaceSide === "UPSTREAM"
          ? [
              { x: farWorldX, y: 0, z: z2 },
              { x: farWorldX, y: waterLevelY, z: z2 },
              { x: farWorldX, y: waterLevelY, z: z1 },
              { x: farWorldX, y: 0, z: z1 },
            ]
          : [
              { x: farWorldX, y: 0, z: z1 },
              { x: farWorldX, y: waterLevelY, z: z1 },
              { x: farWorldX, y: waterLevelY, z: z2 },
              { x: farWorldX, y: 0, z: z2 },
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
  }

  return faces;
};
