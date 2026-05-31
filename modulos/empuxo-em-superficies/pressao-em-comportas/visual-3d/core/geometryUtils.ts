import * as THREE from 'three';
import { WorldFace, Point3D } from '../../visual/motor3DComportas';

export function createGeometryFromFace(face: WorldFace): THREE.BufferGeometry {
  if (face.pts3.length < 3) {
    return new THREE.BufferGeometry();
  }

  // 1. Establish local coordinate system
  const p0 = new THREE.Vector3(face.pts3[0].x, face.pts3[0].y, face.pts3[0].z);
  const p1 = new THREE.Vector3(face.pts3[1].x, face.pts3[1].y, face.pts3[1].z);
  
  // Calculate normal
  let normal = new THREE.Vector3();
  if (face.normal) {
    normal.set(face.normal.x, face.normal.y, face.normal.z).normalize();
  } else {
    const p2 = new THREE.Vector3(face.pts3[2].x, face.pts3[2].y, face.pts3[2].z);
    const v1 = new THREE.Vector3().subVectors(p1, p0);
    const v2 = new THREE.Vector3().subVectors(p2, p0);
    normal.crossVectors(v1, v2).normalize();
  }

  // Local X axis
  const xAxis = new THREE.Vector3().subVectors(p1, p0).normalize();
  if (xAxis.lengthSq() < 0.0001) {
    // Fallback if p1 is too close to p0
    const p2 = new THREE.Vector3(face.pts3[2].x, face.pts3[2].y, face.pts3[2].z);
    xAxis.subVectors(p2, p0).normalize();
  }

  // Local Y axis
  const yAxis = new THREE.Vector3().crossVectors(normal, xAxis).normalize();

  // Create a transformation matrix from Local 2D to World 3D
  const localToWorld = new THREE.Matrix4().makeBasis(xAxis, yAxis, normal);
  localToWorld.setPosition(p0);

  // Inverse matrix to go from World 3D to Local 2D
  const worldToLocal = new THREE.Matrix4().copy(localToWorld).invert();

  // Helper to project 3D point to 2D shape coordinate
  const projectTo2D = (pt3: Point3D): THREE.Vector2 => {
    const vec = new THREE.Vector3(pt3.x, pt3.y, pt3.z);
    vec.applyMatrix4(worldToLocal);
    return new THREE.Vector2(vec.x, vec.y);
  };

  // 2. Create the outer shape
  const outerPts2D = face.pts3.map(projectTo2D);
  const shape = new THREE.Shape(outerPts2D);

  // 3. Add holes if any
  if (face.holes3 && face.holes3.length > 0) {
    for (const hole3 of face.holes3) {
      if (hole3.length >= 3) {
        const holePts2D = hole3.map(projectTo2D);
        const holePath = new THREE.Path(holePts2D);
        shape.holes.push(holePath);
      }
    }
  }

  // 4. Generate geometry
  const geometry = new THREE.ShapeGeometry(shape);

  // 5. Transform vertices back to world space
  geometry.applyMatrix4(localToWorld);

  // 6. Set normals properly
  geometry.computeVertexNormals();

  return geometry;
}
