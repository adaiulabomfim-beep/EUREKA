import { Point3D, Face, WorldFace } from "./motorCena3D";
export type { WorldFace, Point3D };

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
      "#977347",
      1,
      "#4a2a0e",
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

      // Normal compartilhada por todas as fatias da mesma extensão longitudinal para não gerar "listras" de shading (esconde o fatiamento)
      const midZ1 = zStart + (zWidth / 2) - 0.01;
      const midZ2 = zStart + (zWidth / 2) + 0.01;
      const refFace: Point3D[] = [
        mapPt(subP1, midZ1),
        mapPt(subP1, midZ2),
        mapPt(subP2, midZ2),
        mapPt(subP2, midZ1)
      ];
      const sharedNormal = computeFaceNormal(profileIsCW ? refFace : refFace.reverse());

      const facePts: Point3D[] = [];
      for (let s = 0; s <= steps; s++) {
        const sz = zStart + s * dz;
        facePts.push(mapPt(subP1, sz));
      }
      for (let s = steps; s >= 0; s--) {
        const sz = zStart + s * dz;
        facePts.push(mapPt(subP2, sz));
      }

      const isMainWaterFace = !(kind.startsWith("WATER") && i !== 1);

      const finalPts = profileIsCW ? facePts : facePts.reverse();

      faces.push(
        criarFace(
          finalPts,
          fill,
          opacity,
          "none",
          0,
          sharedNormal,
          kind,
          isMainWaterFace ? hatchPattern : undefined,
          p,
        ),
      );
    }
  }

  // Bordas da barragem (segmentadas por steps para acompanhar curvas)
  // Desativado internamente para usar stroke nas próprias faces
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
  yStart: number = 0,
  fillOverride?: string,
): WorldFace[] => {
  const y0 = Math.max(0, yStart);
  const y1 = Math.max(y0, waterLevelY);
  if (y1 - y0 <= 1e-6) return [];

  const getWaterProfile = (): { x: number; y: number }[] => {
    const xDamBottom = getDamXAtY(y0, damFaceSide);
    const xDamTop = getDamXAtY(y1, damFaceSide);

    if (damFaceSide === "UPSTREAM") {
      return [
        { x: farX, y: y0 },
        { x: farX, y: y1 },
        { x: xDamTop, y: y1 },
        { x: xDamBottom, y: y0 },
      ];
    } else {
      return [
        { x: xDamBottom, y: y0 },
        { x: xDamTop, y: y1 },
        { x: farX, y: y1 },
        { x: farX, y: y0 },
      ];
    }
  };

  const fill = fillOverride || (fillId === "A" ? "url(#fluidDepthA)" : "url(#fluidDepthB)");
  const ripplePattern = fillOverride ? undefined : "url(#ripplePattern)";

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
    stepsZ || 1, // Z (largura do canal) - passos no extruir
    1, // stepsY
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

  // Omit the ripplePattern face to keep the 2D water clean and prevent visual artifacts.

  return faces;
};


export interface VetorHidrostática2D {
  start: { x: number; y: number };
  end: { x: number; y: number };
  color: string;
  isResultant: boolean;
  val: string;
  opacity: number;
  strokeWidth: number;
}

export interface GerarVetores2DParams {
  showVectors: boolean;
  isAnalyzed: boolean;
  upstreamLevel: number;
  downstreamLevel: number;
  damHeight: number;
  force: number;
  forceH?: number;
  forceV?: number;
  y_cp: number;
  up?: { FR: number };
  getDamXAtY: (y: number, side: "UPSTREAM" | "DOWNSTREAM") => number;
  toWorldX: (x: number) => number;
  project: (p: Point3D) => { x: number; y: number; zDepth: number };
  SCALE: number;
  SVG_W: number;
  SVG_H: number;
  distributionOpacity?: number;
  hasMudLayer?: boolean;
  mudHeight?: number;
  mudDensity?: number;
  density?: number;
}

export function gerarVetoresBarragem2D({
  showVectors,
  isAnalyzed,
  upstreamLevel,
  downstreamLevel,
  damHeight,
  force,
  forceH,
  forceV,
  y_cp,
  up,
  getDamXAtY,
  toWorldX,
  project,
  SCALE,
  SVG_W,
  SVG_H,
  distributionOpacity = 0.4,
  hasMudLayer = false,
  mudHeight = 0,
  mudDensity = 1500,
  density = 1000,
}: GerarVetores2DParams): VetorHidrostática2D[] {
  if (!showVectors || !isAnalyzed) return [];

  const vecs: VetorHidrostática2D[] = [];
  const isInside = (p: { x: number; y: number }) =>
    p.x >= 10 && p.x <= SVG_W - 10 && p.y >= 10 && p.y <= SVG_H - 10;

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
    let pStart = project({ x: x + nx * finalMag, y: y + ny * finalMag, z });

    if (!isInside(pStart)) {
      for (const f of [0.8, 0.6, 0.4, 0.2, 0.1, 0.05]) {
        const testMag = magWorld * f;
        const testStart = project({ x: x + nx * testMag, y: y + ny * testMag, z });
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
      opacity: isResultant ? 1 : distributionOpacity,
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
      if (nx > 0) {
        nx = -nx;
        ny = -ny;
      }
    } else {
      if (nx < 0) {
        nx = -nx;
        ny = -ny;
      }
    }

    const mag = Math.sqrt(nx * nx + ny * ny) || 1;
    return { nx: nx / mag, ny: ny / mag };
  };

  const Ny = 40;
  const effMud = hasMudLayer && mudHeight > 0 ? Math.min(mudHeight, upstreamLevel) : 0;
  const mudRatio = Math.max(0.1, mudDensity / Math.max(1e-6, density));
  const maxUpEffHead = effMud > 0 ? (upstreamLevel - effMud) + mudRatio * effMud : upstreamLevel;
  // Escala comum entre montante (incluindo lama) e jusante proporcional à pressão máxima real
  const maxHead = Math.max(maxUpEffHead, downstreamLevel, 1e-9);

  if (upstreamLevel > 0) {
    for (let i = 0; i < Ny; i++) {
      const y = upstreamLevel - (i / (Ny - 1)) * upstreamLevel;
      const inMud = effMud > 0 && y < effMud - 1e-6;
      const effDepth = inMud
        ? (upstreamLevel - effMud) + mudRatio * (effMud - y)
        : upstreamLevel - y;
      const { nx, ny } = localNormal(y, "UPSTREAM");
      const Lpx = 10 + (72 - 10) * (effDepth / maxHead);
      const Lw = Lpx / SCALE;

      const base = getDamXAtY(y, "UPSTREAM");
      const x = toWorldX(base);
      pushArrow(x, y, 0, nx, ny, Lw, inMud ? "#b45309" : "#2563eb", false);
    }
  }

  if (downstreamLevel > 0) {
    for (let i = 0; i < Ny; i++) {
      const d = (i / (Ny - 1)) * downstreamLevel;
      const y = downstreamLevel - d;
      const { nx, ny } = localNormal(y, "DOWNSTREAM");
      const Lpx = 10 + (72 - 10) * (d / maxHead);
      const Lw = Lpx / SCALE;

      const base = getDamXAtY(y, "DOWNSTREAM");
      const x = toWorldX(base);
      pushArrow(x, y, 0, nx, ny, Lw, "#3b82f6", false);
    }
  }

  if (up && Math.abs(force) > 1e-3) {
    const fH = forceH !== undefined ? forceH : force;
    const fV = forceV !== undefined ? forceV : 0;
    const isUpDominant = fH >= 0;
    const yPos = Math.max(0, Math.min(damHeight, y_cp > 0 ? y_cp : 0));
    const side = isUpDominant ? "UPSTREAM" : "DOWNSTREAM";
    const base = getDamXAtY(yPos, side);
    const x = toWorldX(base);

    const vecMag = Math.hypot(fH, fV);
    let nx: number;
    let ny: number;
    if (vecMag > 1e-6) {
      // Seta aponta para (+fH, -fV), portanto a origem (tail) fica na direção (-fH, +fV)
      nx = -fH / vecMag;
      ny = fV / vecMag;
    } else {
      const normal = localNormal(yPos, side);
      nx = normal.nx;
      ny = normal.ny;
    }

    pushArrow(
      x,
      yPos,
      0,
      nx,
      ny,
      120 / SCALE,
      isUpDominant ? "#2563eb" : "#f59e0b",
      true,
      "FR"
    );
  }

  return vecs;
}

export const criarAguaMontanteComLama = ({
  upstreamLevel,
  hasMudLayer = false,
  mudHeight = 0,
  channelWidth,
  farLeft,
  getDamXAtY,
  toWorldX,
}: {
  upstreamLevel: number;
  hasMudLayer?: boolean;
  mudHeight?: number;
  channelWidth: number;
  farLeft: number;
  getDamXAtY: (y: number, side: "UPSTREAM" | "DOWNSTREAM") => number;
  toWorldX: (x: number) => number;
}): WorldFace[] => {
  if (upstreamLevel <= 0) return [];
  const effMud = hasMudLayer && mudHeight > 0 ? Math.min(mudHeight, upstreamLevel) : 0;
  const faces: WorldFace[] = [];

  if (effMud > 1e-6) {
    faces.push(
      ...caixaAgua3D(
        effMud,
        channelWidth,
        farLeft,
        "UPSTREAM",
        getDamXAtY,
        toWorldX,
        undefined,
        "A",
        undefined,
        0,
        "url(#mudPattern)",
      ),
    );
  }
  if (upstreamLevel - effMud > 1e-6) {
    faces.push(
      ...caixaAgua3D(
        upstreamLevel,
        channelWidth,
        farLeft,
        "UPSTREAM",
        getDamXAtY,
        toWorldX,
        undefined,
        "A",
        undefined,
        effMud,
      ),
    );
  }
  return faces;
};
