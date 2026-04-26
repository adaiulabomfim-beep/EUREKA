import { Point3D, WorldFace } from './motor3DComportas';

export const criarFace = (
  pts3: Point3D[],
  fill: string,
  opacity: number,
  stroke = "none",
  strokeWidth = 1,
  normal?: Point3D,
  kind: "DAM" | "WATER" | "GATE" = "DAM",
  hatchPattern?: string,
  priority: number = 0,
  holes3?: Point3D[][]
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
  holes3,
});

export const criarTubo = (
  holeFront: Point3D[],
  holeBack: Point3D[],
  matColor: string,
  matStroke: string,
  matPattern?: string,
  priority: number = 2
): WorldFace[] => {
  const faces: WorldFace[] = [];
  if (!holeFront || !holeBack || holeFront.length !== holeBack.length || holeFront.length < 3) return faces;

  for (let i = 0; i < holeFront.length; i++) {
    const nextI = (i + 1) % holeFront.length;
    const p1F = holeFront[i];
    const p2F = holeFront[nextI];
    const p1B = holeBack[i];
    const p2B = holeBack[nextI];

    // Calcula a normal apontando para "dentro" do túnel
    const dx1 = p2F.x - p1F.x;
    const dy1 = p2F.y - p1F.y;
    const dz1 = p2F.z - p1F.z;
    const dx2 = p1B.x - p1F.x;
    const dy2 = p1B.y - p1F.y;
    const dz2 = p1B.z - p1F.z;
    let nx = dy1 * dz2 - dz1 * dy2;
    let ny = dz1 * dx2 - dx1 * dz2;
    let nz = dx1 * dy2 - dy1 * dx2;
    const len = Math.hypot(nx, ny, nz);
    if (len > 0) { nx /= len; ny /= len; nz /= len; }

    faces.push(criarFace(
      [p1F, p2F, p2B, p1B],
      matColor, 1, matStroke, 1, { x: nx, y: ny, z: nz }, 'DAM', matPattern, priority
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
  strokeWidth = 1.2,
  kind: "DAM" | "WATER" | "GATE" = "DAM",
  xOffsetFn?: (z: number) => number,
  zOffset: number = 0,
  hatchPattern?: string,
  toWorldX: (x: number) => number = (x) => x,
  priority?: number,
  stepsZ?: number,
  stepsY: number = 1
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

  faces.push(
    criarFace(
      profile.map((pt) => mapPt(pt, zF)).reverse(),
      fill,
      opacity,
      stroke,
      strokeWidth,
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
      stroke,
      strokeWidth,
      { x: 0, y: 0, z: -1 },
      kind,
      hatchPattern,
      p
    )
  );

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
            stroke, 
            strokeWidth,
            { x: nx, y: ny, z: 0 },
            kind,
            hatchPattern,
            p
          )
        );
      }
    }
  }

  return faces;
};

export const caixaAgua3D = (
  waterLevelY: number,
  depth: number,
  farX: number,
  damFaceSide: "UPSTREAM" | "DOWNSTREAM",
  getDamXAtY: (y: number) => number,
  toWorldX: (x: number) => number,
  offsetFn?: (z: number) => number,
  fillId: "A" | "B" = "A",
  stepsZ?: number,
  floorY: number = 0
): WorldFace[] => {
  const faces: WorldFace[] = [];

  if (waterLevelY <= floorY) return faces;

  const steps = stepsZ !== undefined ? stepsZ : 1;
  const dz = depth / steps;
  const zStart = -depth / 2;

  const farWorldX = toWorldX(farX);
  
  // 🔥 RESTAURO VOLUMÉTRICO: Os gradientes originais já possuem alfa (transparência)
  const fill = fillId === "A" ? "url(#fluidDepthA)" : "url(#fluidDepthB)";
  const surfColor = fillId === "A" ? "url(#surfaceGradientA)" : "url(#surfaceGradientB)"; 
  
  // A opacidade volta a ser 1. Deixamos o alpha do SVG Gradient e o Z-Sorting cuidarem de tudo!
  const waterVolumeOpacity = 1; 
  const ripplePattern = "url(#ripplePattern)";

  const getContactX = (y: number, z: number) => {
    const base = getDamXAtY(y);
    const off = offsetFn ? offsetFn(z) : 0;
    return toWorldX(base + off);
  };

  // 1. Face de Contato (Invisível)
  for (let s = 0; s < steps; s++) {
    const z1 = zStart + s * dz;
    const z2 = zStart + (s + 1) * dz;

    const xC1_y0 = getContactX(floorY, z1);
    const xC1_yW = getContactX(waterLevelY, z1);
    const xC2_y0 = getContactX(floorY, z2);
    const xC2_yW = getContactX(waterLevelY, z2);

    const offset = damFaceSide === "UPSTREAM" ? 0.05 : -0.05;

    const contactWallPts = damFaceSide === "UPSTREAM"
        ? [
            { x: xC1_y0 + offset, y: floorY, z: z1 },
            { x: xC1_yW + offset, y: waterLevelY, z: z1 },
            { x: xC2_yW + offset, y: waterLevelY, z: z2 },
            { x: xC2_y0 + offset, y: floorY, z: z2 },
          ]
        : [
            { x: xC2_y0 + offset, y: floorY, z: z2 },
            { x: xC2_yW + offset, y: waterLevelY, z: z2 },
            { x: xC1_yW + offset, y: waterLevelY, z: z1 },
            { x: xC1_y0 + offset, y: floorY, z: z1 },
          ];

    faces.push(
      criarFace(contactWallPts, "none", 0, "none", 0, { x: 0, y: 0, z: 0 }, "WATER", undefined, 0)
    );
  }

  // 2. Fundo (Invisível)
  for (let s = 0; s < steps; s++) {
    const z1 = zStart + s * dz;
    const z2 = zStart + (s + 1) * dz;
    
    const cx1 = getContactX(floorY, z1);
    const cx2 = getContactX(floorY, z2);

    const pts = damFaceSide === "UPSTREAM"
      ? [
          { x: farWorldX, y: floorY, z: z2 },
          { x: cx2, y: floorY, z: z2 },
          { x: cx1, y: floorY, z: z1 },
          { x: farWorldX, y: floorY, z: z1 },
        ]
      : [
          { x: farWorldX, y: floorY, z: z1 },
          { x: cx1, y: floorY, z: z1 },
          { x: cx2, y: floorY, z: z2 },
          { x: farWorldX, y: floorY, z: z2 },
        ];

    faces.push(
      criarFace(pts, "none", 0, "none", 0, { x: 0, y: -1, z: 0 }, "WATER", undefined, 0)
    );
  }

  // 3. Parede Distante
  for (let s = 0; s < steps; s++) {
    const z1 = zStart + s * dz;
    const z2 = zStart + (s + 1) * dz;

    const farWallPts =
      damFaceSide === "UPSTREAM"
        ? [
            { x: farWorldX, y: floorY, z: z2 },
            { x: farWorldX, y: waterLevelY, z: z2 },
            { x: farWorldX, y: waterLevelY, z: z1 },
            { x: farWorldX, y: floorY, z: z1 },
          ]
        : [
            { x: farWorldX, y: floorY, z: z1 },
            { x: farWorldX, y: waterLevelY, z: z1 },
            { x: farWorldX, y: waterLevelY, z: z2 },
            { x: farWorldX, y: floorY, z: z2 },
          ];

    faces.push(
      criarFace(farWallPts, fill, waterVolumeOpacity, "none", 0, { x: damFaceSide === "UPSTREAM" ? -1 : 1, y: 0, z: 0 }, "WATER", undefined, 4)
    );
  }

  // 4. Trás e Frente
  const zBack = zStart;
  const backPts = [
    { x: farWorldX, y: floorY, z: zBack },
    { x: getContactX(floorY, zBack), y: floorY, z: zBack },
    { x: getContactX(waterLevelY, zBack), y: waterLevelY, z: zBack },
    { x: farWorldX, y: waterLevelY, z: zBack }
  ];
  if (damFaceSide === "UPSTREAM") backPts.reverse();
  faces.push(criarFace(backPts, fill, waterVolumeOpacity, "none", 0, { x: 0, y: 0, z: -1 }, "WATER", undefined, 4));

  const zFront = zStart + depth;
  const frontPts = [
    { x: farWorldX, y: floorY, z: zFront },
    { x: getContactX(floorY, zFront), y: floorY, z: zFront },
    { x: getContactX(waterLevelY, zFront), y: waterLevelY, z: zFront },
    { x: farWorldX, y: waterLevelY, z: zFront }
  ];
  if (damFaceSide === "DOWNSTREAM") frontPts.reverse();
  faces.push(criarFace(frontPts, fill, waterVolumeOpacity, "none", 0, { x: 0, y: 0, z: 1 }, "WATER", undefined, 4));

  // 5. Superfície da Água
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
      // Aplicamos a cor da superfície + hatch das ondinhas para padronizar perfeitamente com os corpos imersos!
      criarFace(pts, surfColor, waterVolumeOpacity, "none", 0, { x: 0, y: 1, z: 0 }, "WATER", ripplePattern, 4)
    );
  }

  return faces;
};