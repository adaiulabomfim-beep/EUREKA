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

  if (isUpstream) {
    const dx = inclinationAngle === 90 ? 0 : y_cp / Math.tan(angleRad);
    x_3d = dx - offsetX;
    forceDir = new THREE.Vector3(Math.sin(angleRad), -Math.cos(angleRad), 0).normalize();
  } else {
    // For downstream net force
    const dx = actualBaseWidth;
    x_3d = dx - offsetX;
    forceDir = new THREE.Vector3(-1, 0, 0); // Simplified to point left horizontally
  }

  const cpPosition = new THREE.Vector3(x_3d, y_cp, zOffset);

  // Increase base scale for better visibility in the 3D scene
  const visualLength = Math.max(4, Math.min(10, Math.log10(absForce) * 1.2));
  
  const headLength = 1.0;
  const headRadius = 0.35;
  const shaftRadius = 0.12;
  const shaftLength = Math.max(0.5, visualLength - headLength);
  
  // The line starts far in the water and points into the dam face
  const arrowOrigin = cpPosition.clone().sub(forceDir.clone().multiplyScalar(visualLength));
  const arrowHeadStart = cpPosition.clone().sub(forceDir.clone().multiplyScalar(headLength));
  
  // Center points for the shapes
  const midShaft = arrowOrigin.clone().add(arrowHeadStart).multiplyScalar(0.5);
  // Center of cone in Three.js is at its midpoint
  const midHead = arrowHeadStart.clone().add(forceDir.clone().multiplyScalar(headLength / 2));

  // Rotate cylinder/cone (default pointing UP +Y) to align with forceDir
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    forceDir
  );

  // Use useMemo to avoid recreating materials every frame
  const { arrowMat, markerMat } = useMemo(() => {
    return {
      arrowMat: new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.3,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        opacity: 0.95,
      }),
      markerMat: new THREE.MeshStandardMaterial({
        color: color,
        emissive: '#ffffff',
        emissiveIntensity: 0.4,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        opacity: 1.0,
      })
    };
  }, [color]);

  return (
    <group renderOrder={999}>
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
        <Html position={arrowOrigin.clone().add(new THREE.Vector3(0, 0.8, 0))} center style={{ pointerEvents: 'none' }}>
           <div className="bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded shadow-lg border border-slate-700 font-mono whitespace-nowrap z-50">
            {label}: {(absForce / 1000).toFixed(1)} kN
           </div>
        </Html>
      )}
    </group>
  );
};

