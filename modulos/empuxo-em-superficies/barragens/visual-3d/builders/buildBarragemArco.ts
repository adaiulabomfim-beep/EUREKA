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

  // Generate vertices
  for (let s = 0; s <= segmentsZ; s++) {
    const t = s / segmentsZ;
    const theta = startAngle + t * (endAngle - startAngle);
    
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    for (let i = 0; i < pts; i++) {
        // Radius for this profile point
        const r = archRadius - (profile[i].x - offsetBase);
        
        // Convert polar back to cartesian relative to the scene center
        // Center of curvature is at X = archRadius
        const x = archRadius - r * cosT;
        const z = r * sinT;
        const y = profile[i].y;
        
        vertices.push(x, y, z);
    }
  }

  // Generate indices
  for (let s = 0; s < segmentsZ; s++) {
    for (let i = 0; i < pts; i++) {
        const nextI = (i + 1) % pts; 
        
        const v1 = s * pts + i;
        const v2 = s * pts + nextI;
        const v3 = (s + 1) * pts + i;
        const v4 = (s + 1) * pts + nextI;

        // Triangle winding
        indices.push(v1, v3, v2);
        indices.push(v2, v3, v4);
    }
  }

  // Add caps
  for(let i=1; i < pts - 1; i++) {
      indices.push(0, i, i + 1);
  }

  const endBase = segmentsZ * pts;
  for(let i=1; i < pts - 1; i++) {
      indices.push(endBase, endBase + i + 1, endBase + i);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}
