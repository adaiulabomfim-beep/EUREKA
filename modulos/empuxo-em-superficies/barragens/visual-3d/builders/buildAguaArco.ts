import * as THREE from 'three';
import { construirGeometria } from '../../tipos/arco/geometria';
import { interpolateX } from '../utils/geometryUtils';

export function buildAguaArcoGeometry(
  damHeight: number,
  damBaseWidth: number,
  damCrestWidth: number,
  inclinationAngle: number,
  archRadius: number,
  channelWidth: number,
  waterLevelY: number,
  side: "UPSTREAM" | "DOWNSTREAM",
  segmentsZ: number = 64
): THREE.BufferGeometry | null {
  if (waterLevelY <= 0) return null;

  const { profile } = construirGeometria(
    damHeight, damBaseWidth, damCrestWidth, inclinationAngle
  );

  const farExtension = damHeight * 1.5;
  let farX: number, X_front_base: number, X_front_top: number;

  if (side === 'UPSTREAM') {
    farX = profile[0].x - farExtension;
    X_front_base = profile[0].x;
    X_front_top = interpolateX(waterLevelY, profile[0], profile[1]);
  } else {
    farX = profile[3].x + farExtension;
    X_front_base = profile[3].x;
    X_front_top = interpolateX(waterLevelY, profile[3], profile[2]);
  }

  const thetaMax = channelWidth / archRadius;
  const startAngle = -thetaMax / 2;
  const endAngle = thetaMax / 2;
  const offsetBase = damBaseWidth / 2;

  const frontBasePts: THREE.Vector3[] = [];
  const frontTopPts: THREE.Vector3[] = [];
  const backBasePts: THREE.Vector3[] = [];
  const backTopPts: THREE.Vector3[] = [];

  for (let s = 0; s <= segmentsZ; s++) {
    const t = s / segmentsZ;
    const theta = startAngle + t * (endAngle - startAngle);
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    const r0 = archRadius - (X_front_base - offsetBase);
    const x0 = archRadius - r0 * cosT;
    const z0 = r0 * sinT;
    frontBasePts.push(new THREE.Vector3(x0, 0, z0));

    const rH = archRadius - (X_front_top - offsetBase);
    const xH = archRadius - rH * cosT;
    const zH = rH * sinT;
    frontTopPts.push(new THREE.Vector3(xH, waterLevelY, zH));
  }

  // Back face points: flat along X, interpolando Z para acompanhar os limites
  for (let s = 0; s <= segmentsZ; s++) {
    // Usando o mesmo Z da frente mas flat no X
    backBasePts.push(new THREE.Vector3(farX, 0, frontBasePts[s].z));
    backTopPts.push(new THREE.Vector3(farX, waterLevelY, frontTopPts[s].z));
  }

  const vertices: number[] = [];
  const indices: number[] = [];
  let indexOffset = 0;

  // 1. Frente curva (vértices compartilhados para shading suave)
  const frontStartIndex = indexOffset;
  for (let s = 0; s <= segmentsZ; s++) {
    vertices.push(frontBasePts[s].x, frontBasePts[s].y, frontBasePts[s].z);
    vertices.push(frontTopPts[s].x, frontTopPts[s].y, frontTopPts[s].z);
    indexOffset += 2;
  }
  
  for (let s = 0; s < segmentsZ; s++) {
    const b0 = frontStartIndex + s * 2;
    const t0 = frontStartIndex + s * 2 + 1;
    const b1 = frontStartIndex + (s + 1) * 2;
    const t1 = frontStartIndex + (s + 1) * 2 + 1;
    
    if (side === 'UPSTREAM') {
      indices.push(b0, t0, b1);
      indices.push(b1, t0, t1);
    } else {
      indices.push(b0, b1, t0);
      indices.push(b1, t1, t0);
    }
  }

  // Helper para quad não compartilhado
  const addQuad = (v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3, v4: THREE.Vector3) => {
    vertices.push(v1.x, v1.y, v1.z);
    vertices.push(v2.x, v2.y, v2.z);
    vertices.push(v3.x, v3.y, v3.z);
    vertices.push(v4.x, v4.y, v4.z);
    
    indices.push(indexOffset, indexOffset + 1, indexOffset + 2);
    indices.push(indexOffset, indexOffset + 2, indexOffset + 3);
    
    indexOffset += 4;
  };

  // 2. Elementos Flat
  for (let s = 0; s < segmentsZ; s++) {
    const fBs = frontBasePts[s];
    const fBs1 = frontBasePts[s+1];
    const fTs = frontTopPts[s];
    const fTs1 = frontTopPts[s+1];
    const bBs = backBasePts[s];
    const bBs1 = backBasePts[s+1];
    const bTs = backTopPts[s];
    const bTs1 = backTopPts[s+1];

    if (side === 'UPSTREAM') {
      addQuad(bBs, bBs1, bTs1, bTs);   // Costas
      addQuad(fTs, bTs, bTs1, fTs1);   // Topo
      addQuad(fBs, fBs1, bBs1, bBs);   // Fundo
    } else {
      addQuad(bBs, bTs, bTs1, bBs1);   // Costas
      addQuad(fTs, fTs1, bTs1, bTs);   // Topo
      addQuad(fBs, bBs, bBs1, fBs1);   // Fundo
    }
  }

  // 3. Tampas
  if (side === 'UPSTREAM') {
    addQuad(frontBasePts[0], backBasePts[0], backTopPts[0], frontTopPts[0]); // Esquerda
    addQuad(frontBasePts[segmentsZ], frontTopPts[segmentsZ], backTopPts[segmentsZ], backBasePts[segmentsZ]); // Direita
  } else {
    addQuad(frontBasePts[0], frontTopPts[0], backTopPts[0], backBasePts[0]); // Esquerda
    addQuad(frontBasePts[segmentsZ], backBasePts[segmentsZ], backTopPts[segmentsZ], frontTopPts[segmentsZ]); // Direita
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}
