import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Sphere, Html, Cylinder, Cone } from '@react-three/drei';

interface EmpuxoVectorProps {
  force: number;
  y_cp: number;
  s_cp?: number;
  inclinationAngle: number;
  damHeight: number;
  offsetX: number;
  color?: string;
  label?: string;
  actualBaseWidth?: number;
  isUpstream?: boolean;
  zOffset?: number;
}

export const EmpuxoVector3D: React.FC<EmpuxoVectorProps> = ({
  force,
  y_cp,
  s_cp,
  inclinationAngle,
  damHeight,
  offsetX,
  color = '#ef4444',
  label,
  actualBaseWidth = 0,
  isUpstream = true,
  zOffset = 0
}) => {
  if (Math.abs(force) <= 1e-3) return null;

  const absForce = Math.abs(force);

  const angleRad = (inclinationAngle * Math.PI) / 180;
  
  let x_3d = 0;
  let forceDir = new THREE.Vector3();
  let faceOutwardNormal = new THREE.Vector3();

  if (isUpstream) {
    const dx = inclinationAngle === 90 ? 0 : y_cp / Math.tan(angleRad);
    x_3d = dx - offsetX;
    forceDir = new THREE.Vector3(Math.sin(angleRad), -Math.cos(angleRad), 0).normalize();
    faceOutwardNormal = forceDir.clone().negate();
  } else {
    const dx = actualBaseWidth;
    x_3d = dx - offsetX;
    forceDir = new THREE.Vector3(-1, 0, 0);
    faceOutwardNormal = new THREE.Vector3(1, 0, 0);
  }

  // Point on the dam face
  const facePoint = new THREE.Vector3(x_3d, y_cp, zOffset);
  
  // Offset outward from the dam face (into the water) so the vector is visible
  const faceOffset = 0.8;
  const cpPosition = facePoint.clone().add(faceOutwardNormal.clone().multiplyScalar(faceOffset));

  const visualLength = Math.max(6, Math.min(15, Math.log10(absForce) * 1.8));
  
  const headLength = 1.4;
  const headRadius = 0.40; // reduced from 0.75 for better aesthetics
  const shaftRadius = 0.16; // reduced from 0.30 for better aesthetics
  const shaftLength = Math.max(0.5, visualLength - headLength);
  
  // Arrow goes from water INTO the dam face:
  const arrowOrigin = cpPosition.clone().sub(forceDir.clone().multiplyScalar(visualLength));
  const arrowHeadStart = cpPosition.clone().sub(forceDir.clone().multiplyScalar(headLength));
  
  const midShaft = arrowOrigin.clone().add(arrowHeadStart).multiplyScalar(0.5);
  const midHead = arrowHeadStart.clone().add(forceDir.clone().multiplyScalar(headLength / 2));

  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    forceDir
  );

  // Materials with PROPER depth testing and bright glow
  const { arrowMat, markerMat } = useMemo(() => {
    return {
      arrowMat: new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 1.2, // increased from 0.3 for bright visibility
        depthTest: true,
        depthWrite: true,
        transparent: false,
        opacity: 1.0,
      }),
      markerMat: new THREE.MeshStandardMaterial({
        color: color,
        emissive: '#ffffff',
        emissiveIntensity: 0.8, // increased from 0.4 for glowing center of pressure
        depthTest: true,
        depthWrite: true,
        transparent: false,
        opacity: 1.0,
      })
    };
  }, [color]);

  return (
    <group>
      {/* Center of Pressure Marker on the dam face */}
      <Sphere args={[0.25, 16, 16]} position={cpPosition} material={markerMat} />

      {/* Force Vector Shaft */}
      <Cylinder 
        args={[shaftRadius, shaftRadius, shaftLength, 12]} 
        position={midShaft} 
        quaternion={quaternion}
        material={arrowMat}
      />
      
      {/* Force Vector Arrow Head */}
      <Cone
        args={[headRadius, headLength, 12]}
        position={midHead}
        quaternion={quaternion}
        material={arrowMat}
      />

      {/* Label */}
      {label && (
        <Html position={arrowOrigin.clone().add(new THREE.Vector3(0, 0.8, 0))} center style={{ pointerEvents: 'none' }} occlude>
           <div className="bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded shadow-lg border border-slate-700 font-mono whitespace-nowrap z-50">
            {label}: {(absForce / 1000).toFixed(1)} kN
           </div>
        </Html>
      )}
    </group>
  );
};
