import * as THREE from 'three';
import { construirGeometria } from '../../tipos/arco/geometria';

export function buildBarragemArcoGeometry(
  damHeight: number,
  damBaseWidth: number,
  damCrestWidth: number,
  inclinationAngle: number,
  archRadius: number,
  channelWidth: number,
  segmentsZ: number = 32
): THREE.BufferGeometry {
  const { profile } = construirGeometria(
    damHeight,
    damBaseWidth,
    damCrestWidth,
    inclinationAngle
  );

  // Use pure polar coordinates for a true architectural arch instead of X-axis offset deformation.
  // Center of curvature is at X = archRadius.
  // Upstream toe (X=0) has radius R = archRadius.
  // Angle spans from -thetaMax/2 to +thetaMax/2.
  const thetaMax = channelWidth / archRadius;
  const startAngle = -thetaMax / 2;
  const endAngle = thetaMax / 2;

  const offsetBase = damBaseWidth / 2;

  const pts = profile.length;
  const vertices = [];
  const indices = [];

  // Generate discrete face strips for each segment of the profile to ensure sharp corners
  let vertexOffset = 0;

  for (let i = 0; i < pts - 1; i++) {
    // For each segment of the profile (upstream face, crest, downstream face)
    const p1 = profile[i];
    const p2 = profile[i + 1];

    for (let s = 0; s <= segmentsZ; s++) {
      const t = s / segmentsZ;
      const theta = startAngle + t * (endAngle - startAngle);
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      // Point 1
      const r1 = archRadius - (p1.x - offsetBase);
      vertices.push(archRadius - r1 * cosT, p1.y, r1 * sinT);

      // Point 2
      const r2 = archRadius - (p2.x - offsetBase);
      vertices.push(archRadius - r2 * cosT, p2.y, r2 * sinT);
    }

    // Generate indices for this strip
    for (let s = 0; s < segmentsZ; s++) {
      const v1 = vertexOffset + s * 2;
      const v2 = vertexOffset + s * 2 + 1;
      const v3 = vertexOffset + (s + 1) * 2;
      const v4 = vertexOffset + (s + 1) * 2 + 1;

      // Triangle winding
      indices.push(v1, v3, v2);
      indices.push(v2, v3, v4);
    }
    
    vertexOffset += (segmentsZ + 1) * 2;
  }

  // Add Caps (Sides)
  const addCap = (isStart: boolean) => {
    const capStartIdx = vertexOffset;
    const theta = isStart ? startAngle : endAngle;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    for (let i = 0; i < pts; i++) {
      const r = archRadius - (profile[i].x - offsetBase);
      vertices.push(archRadius - r * cosT, profile[i].y, r * sinT);
    }

    for (let i = 1; i < pts - 1; i++) {
      if (isStart) {
        indices.push(capStartIdx, capStartIdx + i, capStartIdx + i + 1);
      } else {
        indices.push(capStartIdx, capStartIdx + i + 1, capStartIdx + i);
      }
    }
    vertexOffset += pts;
  };

  addCap(true);
  addCap(false);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}
