import * as THREE from 'three';
import { FormaComporta } from '../dominio/tipos';

export interface BuildFlowGeometryParams {
  gateShape: FormaComporta;
  W: number;
  H: number;
  channelWidth: number;
  openFraction: number;
  P_mid: { x: number; y: number };
  P_bot: { x: number; y: number };
  cosTheta: number;
  sinTheta: number;
  wallHorizThick: number;
  waterSurfaceY: number;
  Y_top: number;
  Y_crest_above: number;
  Y_bed_dist: number;
  downstreamLevel: number;
  downSurfaceY: number;
  downStartX: number;
  canalBedSurfaceY: number;
  baseSlabThick: number;
  rightBoundaryX: number;
}

interface PointUV {
  u: number;
  v: number;
}

interface RingPoint {
  u: number;
  v: number;
  eta: number;
  xExit: number;
  yExit: number;
  zExit: number;
}

function clampV(vVal: number, vBot: number, vTop: number): number {
  return Math.max(vBot + 0.04, Math.min(vTop - 0.04, vVal));
}

function sampleSegmentUV(
  a: PointUV,
  b: PointUV,
  subdivs: number,
  out: PointUV[]
) {
  for (let i = 0; i < subdivs; i++) {
    const t = i / subdivs;
    out.push({
      u: a.u + (b.u - a.u) * t,
      v: a.v + (b.v - a.v) * t,
    });
  }
}

/**
 * Calcula o contorno 2D exato (no plano da comporta em coordenadas locais u, v)
 * correspondente à área efetivamente livre da abertura (retangular, circular,
 * semicircular ou qualquer estágio de abertura parcial).
 * Retorna os pontos em ordem anti-horária (CCW) no plano (u, v).
 */
export function buildFreeOpeningContourUV(
  params: Pick<
    BuildFlowGeometryParams,
    | 'gateShape'
    | 'W'
    | 'H'
    | 'channelWidth'
    | 'openFraction'
    | 'P_mid'
    | 'sinTheta'
    | 'waterSurfaceY'
    | 'Y_top'
    | 'Y_crest_above'
    | 'Y_bed_dist'
  >
): PointUV[] {
  const {
    gateShape,
    W,
    H,
    channelWidth,
    openFraction,
    P_mid,
    sinTheta,
    waterSurfaceY,
    Y_top,
    Y_crest_above,
    Y_bed_dist,
  } = params;

  const halfCW = channelWidth / 2;
  const wClamped = Math.min(W, channelWidth * 0.92);
  const halfW = wClamped / 2;
  const halfH = H / 2;

  const vWallTop = Y_top + H / 2 + Y_crest_above;
  const vWallBot = Y_top + H / 2 - Y_bed_dist;
  const liftDist = Math.max(0, Math.min(1, openFraction)) * H;
  const vWaterMax = (waterSurfaceY - P_mid.y) / Math.max(1e-4, sinTheta);

  if (liftDist <= 1e-4) return [];

  if (gateShape === FormaComporta.CIRCULAR) {
    const r = Math.min(halfH, halfCW * 0.92);
    const vMaxAllowed = Math.min(r, vWaterMax);

    // Abertura total e totalmente submersa -> seção circular perfeita
    if (openFraction >= 0.999 && vMaxAllowed >= r - 1e-4) {
      const steps = 36;
      const pts: PointUV[] = [];
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        pts.push({
          u: r * Math.cos(a),
          v: clampV(r * Math.sin(a), vWallBot, vWallTop),
        });
      }
      return pts;
    }

    // Abertura parcialmente obstruída pela comporta circular elevada (ou pelo nível d'água)
    // Região livre para cada u: v_bot(u) = -sqrt(r² - u²),
    // v_top(u) = min(+sqrt(r² - u²), liftDist - sqrt(r² - u²), vWaterMax)
    let uLimit = r;
    if (vMaxAllowed < 0) {
      uLimit = Math.sqrt(Math.max(0, r * r - vMaxAllowed * vMaxAllowed));
    }
    if (uLimit <= 1e-4) return [];

    const samples = 20;
    const pts: PointUV[] = [];

    // Arco inferior (esquerda -> direita)
    for (let i = 0; i <= samples; i++) {
      const a = Math.PI - (i / samples) * Math.PI; // pi .. 0 -> u: -uLimit .. +uLimit
      const u = uLimit * Math.cos(a);
      const yCircle = Math.sqrt(Math.max(0, r * r - u * u));
      const vBot = -yCircle;
      pts.push({
        u,
        v: clampV(vBot, vWallBot, vWallTop),
      });
    }

    // Arco superior (direita -> esquerda, excluindo vértices degenerados nas pontas)
    for (let i = 1; i < samples; i++) {
      const a = (i / samples) * Math.PI; // 0 .. pi -> u: +uLimit .. -uLimit
      const u = uLimit * Math.cos(a);
      const yCircle = Math.sqrt(Math.max(0, r * r - u * u));
      const vBot = -yCircle;
      const vPlateBot = liftDist - yCircle;
      const vTop = Math.min(yCircle, vPlateBot, vMaxAllowed);
      if (vTop > vBot + 1e-4) {
        pts.push({
          u,
          v: clampV(vTop, vWallBot, vWallTop),
        });
      }
    }

    return pts.length >= 3 ? pts : [];
  }

  if (gateShape === FormaComporta.SEMI_CIRCULAR) {
    const vBotFlat = clampV(-halfH, vWallBot, vWallTop);
    const vCeil = Math.min(-halfH + liftDist, vWaterMax);
    if (vCeil <= -halfH + 1e-4) return [];

    const steps = 24;
    const pts: PointUV[] = [];

    // Base reta horizontal (esquerda -> direita)
    const baseSubdivs = 8;
    for (let i = 0; i <= baseSubdivs; i++) {
      const t = i / baseSubdivs;
      const u = -halfW + 2 * halfW * t;
      pts.push({ u, v: vBotFlat });
    }

    // Arco semicircular superior (ou recortado pela borda inferior da comporta parcialmente aberta)
    for (let i = 1; i < steps; i++) {
      const a = (i / steps) * Math.PI; // 0 .. pi -> u: +halfW .. -halfW
      const u = halfW * Math.cos(a);
      const vArch = -halfH + H * Math.sin(a);
      const vTop = Math.min(vArch, vCeil);
      if (vTop > -halfH + 1e-4) {
        pts.push({
          u,
          v: clampV(vTop, vWallBot, vWallTop),
        });
      }
    }

    return pts.length >= 3 ? pts : [];
  }

  // RETANGULAR
  const vMin = clampV(-halfH, vWallBot, vWallTop);
  const vMaxRaw = Math.min(halfH, -halfH + liftDist, vWaterMax);
  const vMax = clampV(vMaxRaw, vWallBot, vWallTop);
  if (vMax <= vMin + 1e-4) return [];

  const corners: PointUV[] = [
    { u: -halfW, v: vMin },
    { u: halfW, v: vMin },
    { u: halfW, v: vMax },
    { u: -halfW, v: vMax },
  ];
  const pts: PointUV[] = [];
  sampleSegmentUV(corners[0], corners[1], 4, pts);
  sampleSegmentUV(corners[1], corners[2], 3, pts);
  sampleSegmentUV(corners[2], corners[3], 4, pts);
  sampleSegmentUV(corners[3], corners[0], 3, pts);
  return pts;
}

/**
 * Constrói a malha 3D contínua de escoamento a partir do contorno real da
 * abertura desobstruída da comporta.
 */
export function buildFlowGeometry(
  params: BuildFlowGeometryParams
): THREE.BufferGeometry | null {
  const {
    gateShape,
    channelWidth,
    P_mid,
    cosTheta,
    sinTheta,
    wallHorizThick,
    waterSurfaceY,
    downstreamLevel,
    downSurfaceY,
    downStartX,
    canalBedSurfaceY,
    baseSlabThick,
    rightBoundaryX,
  } = params;

  const contour = buildFreeOpeningContourUV(params);
  if (contour.length < 3) return null;

  let vMin = Infinity;
  let vMax = -Infinity;
  let maxAbsU = 0;
  for (const p of contour) {
    if (p.v < vMin) vMin = p.v;
    if (p.v > vMax) vMax = p.v;
    if (Math.abs(p.u) > maxAbsU) maxAbsU = Math.abs(p.u);
  }

  const yMinOpen = P_mid.y + sinTheta * vMin;
  const yMaxOpen = Math.min(waterSurfaceY, P_mid.y + sinTheta * vMax);
  const openHeight = yMaxOpen - yMinOpen;
  if (openHeight <= 0.02 || maxAbsU <= 0.01) return null;

  const xExitBot = P_mid.x + cosTheta * vMin + wallHorizThick;
  const xExitTop = P_mid.x + cosTheta * vMax + wallHorizThick;

  const ringTemplate: RingPoint[] = contour.map((p) => {
    const yW = P_mid.y + sinTheta * p.v;
    const xExit = P_mid.x + cosTheta * p.v + wallHorizThick;
    const eta = Math.max(0, Math.min(1, (yW - yMinOpen) / openHeight));
    return {
      u: p.u,
      v: p.v,
      eta,
      xExit,
      yExit: yW,
      zExit: -p.u,
    };
  });

  // Construção das seções (anéis 3D) ao longo da trajetória hidráulica
  const rings: THREE.Vector3[][] = [];

  // Anel 0: entrada na face de montante da parede
  rings.push(
    ringTemplate.map(
      (rp) => new THREE.Vector3(rp.xExit - wallHorizThick, rp.yExit, rp.zExit)
    )
  );
  // Anel 1: saída na face de jusante da parede (túnel exatamente conforme a abertura)
  rings.push(
    ringTemplate.map((rp) => new THREE.Vector3(rp.xExit, rp.yExit, rp.zExit))
  );

  const hasTailwater = downstreamLevel > 0;
  const isFullySubmerged = hasTailwater && yMaxOpen <= downSurfaceY + 0.04;
  const isPartiallySubmerged =
    hasTailwater && !isFullySubmerged && yMinOpen < downSurfaceY - 0.04;
  const trajSteps = 14;

  if (isFullySubmerged) {
    // Abertura totalmente submersa: transição curta entrando suavemente no nível de jusante
    for (let k = 1; k <= 2; k++) {
      const t = k / 2;
      const dx = 0.24 * t;
      const zScale = 1 + 0.03 * t;
      rings.push(
        ringTemplate.map(
          (rp) =>
            new THREE.Vector3(rp.xExit + dx, rp.yExit, rp.zExit * zScale)
        )
      );
    }
  } else if (isPartiallySubmerged) {
    const openAirH = Math.max(0.08, yMaxOpen - downSurfaceY);
    const dxPlunge = Math.max(0.85, Math.min(2.4, openAirH * 1.15 + 0.65));
    const xTopLanding = Math.max(downStartX + 0.35, xExitTop + dxPlunge);
    const yTopLanding = downSurfaceY;

    for (let k = 1; k <= trajSteps; k++) {
      const t = k / trajSteps;
      const xTopT = xExitTop + (xTopLanding - xExitTop) * t;
      const yTopT = yMaxOpen + (yTopLanding - yMaxOpen) * (t * t);
      const xBotT = xExitBot + (downStartX - xExitBot) * t;
      const yBotT = yMinOpen + (downSurfaceY - yMinOpen) * t;
      const zScale = 1 + 0.06 * t;

      rings.push(
        ringTemplate.map((rp) => {
          const x = xBotT + (xTopT - xBotT) * rp.eta;
          const y = yBotT + (yTopT - yBotT) * rp.eta;
          return new THREE.Vector3(x, y, rp.zExit * zScale);
        })
      );
    }
  } else if (hasTailwater) {
    const drop3D = Math.max(0, yMinOpen - downSurfaceY);
    const jetReachX3D = Math.max(
      1.0,
      Math.min(3.2, 0.9 + drop3D * 0.95 + openHeight * 0.55)
    );
    const xTopLanding = Math.max(downStartX + 0.45, xExitTop + jetReachX3D);
    const xBotLanding = Math.max(
      xExitBot + 0.35,
      xTopLanding - Math.max(0.25, jetReachX3D * 0.24)
    );
    const yTopLanding = downSurfaceY;
    const yBotLanding = Math.max(canalBedSurfaceY, downSurfaceY - 0.04);

    for (let k = 1; k <= trajSteps; k++) {
      const t = k / trajSteps;
      const xTopT = xExitTop + (xTopLanding - xExitTop) * t;
      const yTopT = yMaxOpen + (yTopLanding - yMaxOpen) * (t * t);
      const xBotT = xExitBot + (xBotLanding - xExitBot) * t;
      const yBotT = yMinOpen + (yBotLanding - yMinOpen) * (t * t);
      // Mantém seção circular/semicircular fiel ao formato da abertura durante toda a queda livre
      const zScale = 1 + 0.05 * (t * t);

      rings.push(
        ringTemplate.map((rp) => {
          const x = xBotT + (xTopT - xBotT) * rp.eta;
          const y = yBotT + (yTopT - yBotT) * rp.eta;
          return new THREE.Vector3(x, y, rp.zExit * zScale);
        })
      );
    }
  } else {
    // Descarga livre sem água a jusante: trajetória parabólica mantendo a seção da abertura
    // seguida de escoamento contínuo sobre a soleira até o limite direito da cena
    const downstreamFloorY = canalBedSurfaceY - baseSlabThick;
    const drop3D = Math.max(0, yMinOpen - downstreamFloorY);
    const tailDepth3D = Math.max(0.10, Math.min(openHeight * 0.58, 0.55));
    const jetReachX3D = Math.max(
      1.2,
      Math.min(3.4, 1.1 + drop3D * 0.95 + openHeight * 0.55)
    );

    const xTopLanding = xExitTop + jetReachX3D;
    const xBotLanding = Math.max(
      xExitBot + 0.35,
      xTopLanding - Math.max(0.25, jetReachX3D * 0.24)
    );
    const yTopLanding = downstreamFloorY + tailDepth3D;
    const yBotLanding = downstreamFloorY;

    for (let k = 1; k <= trajSteps; k++) {
      const t = k / trajSteps;
      const xTopT = xExitTop + (xTopLanding - xExitTop) * t;
      const yTopT = yMaxOpen + (yTopLanding - yMaxOpen) * (t * t);
      const xBotT = xExitBot + (xBotLanding - xExitBot) * t;
      const yBotT = yMinOpen + (yBotLanding - yMinOpen) * (t * t);
      const zScale = 1 + 0.06 * (t * t);

      rings.push(
        ringTemplate.map((rp) => {
          const x = xBotT + (xTopT - xBotT) * rp.eta;
          const y = yBotT + (yTopT - yBotT) * rp.eta;
          return new THREE.Vector3(x, y, rp.zExit * zScale);
        })
      );
    }

    // Espalhamento gradual na calha de jusante após o impacto no piso
    const maxSpreadScale = Math.min(1.45, (channelWidth * 0.44) / maxAbsU);
    const runSteps = 4;
    for (let k = 1; k <= runSteps; k++) {
      const t = k / runSteps;
      const xTopR = xTopLanding + (rightBoundaryX - xTopLanding) * t;
      const xBotR = xBotLanding + (rightBoundaryX - xBotLanding) * t;
      const zScale = 1.06 + (maxSpreadScale - 1.06) * Math.sqrt(t);

      rings.push(
        ringTemplate.map((rp) => {
          const x = xBotR + (xTopR - xBotR) * rp.eta;
          const y = yBotLanding + tailDepth3D * rp.eta;
          return new THREE.Vector3(x, y, rp.zExit * zScale);
        })
      );
    }
  }

  // Triangulação da malha fechada (superfície lateral + tampas inicial e final)
  const N = ringTemplate.length;
  const R = rings.length;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let s = 0; s < R; s++) {
    const vCoord = s / Math.max(1, R - 1);
    for (let i = 0; i < N; i++) {
      const p = rings[s][i];
      positions.push(p.x, p.y, p.z);
      uvs.push(i / N, vCoord);
    }
  }

  for (let s = 0; s < R - 1; s++) {
    for (let i = 0; i < N; i++) {
      const iNext = (i + 1) % N;
      const a = s * N + i;
      const b = s * N + iNext;
      const c = (s + 1) * N + i;
      const d = (s + 1) * N + iNext;
      // Orientação verificada: normal externa apontando para fora do tubo
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  // Triangulação das tampas de entrada (s = 0) e saída (s = R - 1) via ShapeUtils
  // Remove vértices estritamente colineares apenas para a triangulação das tampas, evitando triângulos degenerados
  const capIndices: number[] = [];
  for (let i = 0; i < N; i++) {
    const prev = contour[(i - 1 + N) % N];
    const curr = contour[i];
    const next = contour[(i + 1) % N];
    const cross =
      (curr.u - prev.u) * (next.v - curr.v) -
      (curr.v - prev.v) * (next.u - curr.u);
    if (Math.abs(cross) > 1e-6) {
      capIndices.push(i);
    }
  }
  const effectiveCapIndices =
    capIndices.length >= 3 ? capIndices : contour.map((_, i) => i);
  const capContourVec2 = effectiveCapIndices.map(
    (idx) => new THREE.Vector2(contour[idx].u, contour[idx].v)
  );
  const rawCapTris = THREE.ShapeUtils.triangulateShape(capContourVec2, []);
  const capTris = rawCapTris
    .map((tri) => [
      effectiveCapIndices[tri[0]],
      effectiveCapIndices[tri[1]],
      effectiveCapIndices[tri[2]],
    ])
    .filter(([a, b, c]) => {
      const pa = contour[a];
      const pb = contour[b];
      const pc = contour[c];
      const area2 = Math.abs(
        (pb.u - pa.u) * (pc.v - pa.v) - (pb.v - pa.v) * (pc.u - pa.u)
      );
      return area2 > 1e-7;
    });

  // Tampa inicial (s = 0, normal voltada para -X)
  const startBase = positions.length / 3;
  for (let i = 0; i < N; i++) {
    const p = rings[0][i];
    positions.push(p.x, p.y, p.z);
    uvs.push(contour[i].u, contour[i].v);
  }
  for (const tri of capTris) {
    // Reverte para que a normal aponte em -X
    indices.push(startBase + tri[0], startBase + tri[2], startBase + tri[1]);
  }

  // Tampa final (s = R - 1, normal voltada para +X)
  const endBase = positions.length / 3;
  for (let i = 0; i < N; i++) {
    const p = rings[R - 1][i];
    positions.push(p.x, p.y, p.z);
    uvs.push(contour[i].u, contour[i].v);
  }
  for (const tri of capTris) {
    indices.push(endBase + tri[0], endBase + tri[1], endBase + tri[2]);
  }

  let geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);

  // Para abertura retangular, faces planas nítidas; para circular/semicircular, sombreamento suave no tubo
  if (gateShape === FormaComporta.RETANGULAR) {
    const flatGeo = geo.toNonIndexed();
    geo.dispose();
    geo = flatGeo;
  }

  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();

  return geo;
}
