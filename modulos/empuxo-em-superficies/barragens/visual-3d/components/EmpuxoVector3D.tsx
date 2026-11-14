import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Sphere, Html, Cylinder, Cone } from '@react-three/drei';

interface EmpuxoVectorProps {
  force: number;
  forceH?: number;
  forceV?: number;
  y_cp: number;
  s_cp?: number;
  inclinationAngle: number;
  downstreamAngle?: number;
  damHeight: number;
  offsetX: number;
  color?: string;
  label?: string;
  actualBaseWidth?: number;
  isUpstream?: boolean;
  zOffset?: number;
  unitSystem?: 'SI' | 'TECNICO_KGF';
  gravity?: number;
  damWidth?: number;
  showTriangularMode?: boolean;
}

export const EmpuxoVector3D: React.FC<EmpuxoVectorProps> = ({
  force,
  forceH,
  forceV,
  y_cp,
  inclinationAngle,
  downstreamAngle = 90,
  offsetX,
  color = '#ef4444',
  label,
  actualBaseWidth = 0,
  isUpstream = true,
  zOffset = 0,
  unitSystem = 'SI',
  gravity = 9.81,
  damWidth = 1,
  showTriangularMode = false,
}) => {
  const { arrowMat, markerMat } = useMemo(() => {
    return {
      arrowMat: new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 1.2,
        depthTest: true,
        depthWrite: true,
        transparent: false,
        opacity: 1.0,
      }),
      markerMat: new THREE.MeshStandardMaterial({
        color: color,
        emissive: '#ffffff',
        emissiveIntensity: 0.8,
        depthTest: true,
        depthWrite: true,
        transparent: false,
        opacity: 1.0,
      })
    };
  }, [color]);

  if (Math.abs(force) <= 1e-3) return null;

  const absForce = Math.abs(force);
  const angleRad = (inclinationAngle * Math.PI) / 180;
  const downRad = (downstreamAngle * Math.PI) / 180;

  let x_3d = 0;
  let faceOutwardNormal = new THREE.Vector3();

  if (isUpstream) {
    const dx = Math.abs(inclinationAngle - 90) < 1e-4 ? 0 : y_cp / Math.tan(angleRad);
    x_3d = dx - offsetX;
    faceOutwardNormal = new THREE.Vector3(-Math.sin(angleRad), Math.cos(angleRad), 0).normalize();
  } else {
    const dx = Math.abs(downstreamAngle - 90) < 1e-4
      ? actualBaseWidth
      : actualBaseWidth - y_cp / Math.tan(downRad);
    x_3d = dx - offsetX;
    faceOutwardNormal = new THREE.Vector3(Math.sin(downRad), Math.cos(downRad), 0).normalize();
  }

  let forceDir = faceOutwardNormal.clone().negate();
  if (forceH !== undefined && forceV !== undefined && (Math.abs(forceH) > 1e-6 || Math.abs(forceV) > 1e-6)) {
    forceDir = new THREE.Vector3(forceH, -forceV, 0).normalize();
  }

  const facePoint = new THREE.Vector3(x_3d, y_cp, zOffset);
  const faceOffset = 0.8;
  const cpPosition = facePoint.clone().add(faceOutwardNormal.clone().multiplyScalar(faceOffset));

  const visualLength = Math.max(6, Math.min(15, Math.log10(absForce) * 1.8));
  const headLength = 1.4;
  const headRadius = 0.40;
  const shaftRadius = 0.16;
  const shaftLength = Math.max(0.5, visualLength - headLength);

  const arrowOrigin = cpPosition.clone().sub(forceDir.clone().multiplyScalar(visualLength));
  const arrowHeadStart = cpPosition.clone().sub(forceDir.clone().multiplyScalar(headLength));

  const midShaft = arrowOrigin.clone().add(arrowHeadStart).multiplyScalar(0.5);
  const midHead = arrowHeadStart.clone().add(forceDir.clone().multiplyScalar(headLength / 2));

  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    forceDir
  );

  const isTotalMode = Boolean(showTriangularMode || damWidth > 1.001);
  const formattedForce = isTotalMode
    ? unitSystem === 'TECNICO_KGF'
      ? `FR = ${((absForce * damWidth) / gravity).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kgf`
      : `FR = ${((absForce * damWidth) / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kN`
    : unitSystem === 'TECNICO_KGF'
    ? `E = ${(absForce / gravity).toFixed(0)} kgf/m`
    : `E = ${(absForce / 1000).toFixed(1)} kN/m`;

  return (
    <group>
      <Sphere args={[0.25, 16, 16]} position={cpPosition} material={markerMat} />

      <Cylinder
        args={[shaftRadius, shaftRadius, shaftLength, 12]}
        position={midShaft}
        quaternion={quaternion}
        material={arrowMat}
      />

      <Cone
        args={[headRadius, headLength, 12]}
        position={midHead}
        quaternion={quaternion}
        material={arrowMat}
      />

      {label && (
        <Html position={arrowOrigin.clone().add(new THREE.Vector3(0, 0.8, 0))} center style={{ pointerEvents: 'none' }}>
          <div
            className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm border whitespace-nowrap"
            style={{ color, borderColor: `${color}55` }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
            <span>{formattedForce}</span>
          </div>
        </Html>
      )}
    </group>
  );
};
