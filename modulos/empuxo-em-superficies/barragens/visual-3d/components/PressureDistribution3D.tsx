import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Cylinder, Cone } from '@react-three/drei';

interface PressureDistributionProps {
  level: number;
  inclinationAngle: number;
  actualBaseWidth: number;
  offsetX: number;
  isUpstream: boolean;
  color?: string;
  channelWidth?: number;
  zSlices?: number;
  arrowCount?: number;
  archRadius?: number; // Optional arch radius for curved dams
  damHeight?: number;
  damCrestWidth?: number;
}

export const PressureDistribution3D: React.FC<PressureDistributionProps> = ({
  level,
  inclinationAngle,
  actualBaseWidth,
  offsetX,
  isUpstream,
  color = '#1e3a8a', // dark blue by default, as requested
  channelWidth = 40,
  zSlices = 13, // more slices for better horizontal distribution
  arrowCount = 14, // balanced vertical count
  archRadius,
  damHeight,
  damCrestWidth
}) => {
  if (level <= 0) return null;

  const angleRad = (inclinationAngle * Math.PI) / 180;
  
  // Material with proper depth testing and bright emissive glow to see clearly through water
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.8, // reduced slightly so it's dark but still visible
      depthTest: true,
      depthWrite: true,
      transparent: false,
      opacity: 1.0,
    });
  }, [color]);

  // Force direction: the hydrostatic force pushes PERPENDICULAR to the face, INTO the dam
  let baseForceDir = new THREE.Vector3();
  // Normal pointing OUTWARD from the dam face (into the water)
  let baseFaceOutwardNormal = new THREE.Vector3();
  
  const dxUpstream = inclinationAngle === 90 ? 0 : (damHeight !== undefined ? damHeight / Math.tan(angleRad) : 0);
  
  if (isUpstream) {
    baseForceDir = new THREE.Vector3(Math.sin(angleRad), -Math.cos(angleRad), 0).normalize();
    // Outward normal from upstream face points into the water (opposite of force)
    baseFaceOutwardNormal = baseForceDir.clone().negate();
  } else {
    let downAngleRad = Math.PI / 2; // Default vertical (90 deg)
    if (damHeight !== undefined && damCrestWidth !== undefined) {
      const deltaX = actualBaseWidth - (dxUpstream + damCrestWidth);
      if (deltaX > 0) {
        downAngleRad = Math.atan2(damHeight, deltaX);
      }
    }
    // For downstream, water pushes LEFT (-X) and DOWN (-Y)
    baseForceDir = new THREE.Vector3(-Math.sin(downAngleRad), -Math.cos(downAngleRad), 0).normalize();
    baseFaceOutwardNormal = baseForceDir.clone().negate();
  }

  const arrows = [];
  const maxArrowLength = Math.max(1.5, Math.min(8, level * 0.4)); 
  
  // Offset distance to push arrows AWAY from the dam face into the water
  const faceOffset = 0.5;
  
  for (let zIndex = 0; zIndex < zSlices; zIndex++) {
    const margin = channelWidth * 0.1;
    const usableWidth = channelWidth - 2 * margin;
    
    let currentZ = 0;
    let currentTheta = 0;
    
    if (archRadius && archRadius > 0) {
        const thetaMax = channelWidth / archRadius;
        const angleSpacing = thetaMax * 0.8; // 80% coverage
        const startAngle = -angleSpacing / 2;
        currentTheta = (zSlices > 1) 
            ? startAngle + (angleSpacing / (zSlices - 1)) * zIndex 
            : 0;
    } else {
        currentZ = (zSlices > 1) 
          ? -channelWidth/2 + margin + (usableWidth / (zSlices - 1)) * zIndex
          : 0;
    }

    for (let i = 1; i <= arrowCount; i++) {
      const y = (level / arrowCount) * i - (level / arrowCount / 2); 
      
      const depth = level - y;
      const lengthRatio = depth / level;
      
      const arrowLength = maxArrowLength * lengthRatio;
      
      if (arrowLength < 0.3) continue;
      
      // Calculate the point ON the dam face in 2D profile
      let x_3d = 0;
      if (isUpstream) {
        const dx = inclinationAngle === 90 ? 0 : y / Math.tan(angleRad);
        x_3d = dx - offsetX;
      } else {
        let dx = actualBaseWidth;
        if (damHeight !== undefined && damCrestWidth !== undefined && damHeight > 0) {
          const deltaX = actualBaseWidth - (dxUpstream + damCrestWidth);
          if (deltaX > 0) {
            dx = actualBaseWidth - (y / damHeight) * deltaX;
          }
        }
        x_3d = dx - offsetX;
      }

      let facePoint: THREE.Vector3;
      let forceDir = baseForceDir.clone();
      let faceOutwardNormal = baseFaceOutwardNormal.clone();
      
      if (archRadius && archRadius > 0) {
          const cosT = Math.cos(currentTheta);
          const sinT = Math.sin(currentTheta);
          
          const r = archRadius - x_3d;
          const archX = archRadius - r * cosT;
          const archZ = r * sinT;
          
          facePoint = new THREE.Vector3(archX, y, archZ);
          
          const rotY = new THREE.Matrix4().makeRotationY(currentTheta);
          forceDir.applyMatrix4(rotY).normalize();
          faceOutwardNormal.applyMatrix4(rotY).normalize();
      } else {
          // Flat dam point
          facePoint = new THREE.Vector3(x_3d, y, currentZ);
      }
      
      const quaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        forceDir
      );
      
      // Offset the ENTIRE arrow outward from the dam face (into the water)
      // So the arrow TIP touches the face, and the shaft extends into the water
      const tipPoint = facePoint.clone().add(faceOutwardNormal.clone().multiplyScalar(faceOffset));
      
      // Elegant, thinner arrow geometry with good proportions
      const headLength = Math.max(0.3, Math.min(0.9, arrowLength * 0.25));
      const headRadius = 0.20; 
      const shaftRadius = 0.08; 
      const shaftLength = arrowLength - headLength;
      
      if (shaftLength <= 0) continue;

      // Arrow goes from water INTO the dam face:
      // origin (in water) → shaft → head → tip (near dam face)
      const arrowOrigin = tipPoint.clone().sub(forceDir.clone().multiplyScalar(arrowLength));
      const arrowHeadStart = tipPoint.clone().sub(forceDir.clone().multiplyScalar(headLength));
      
      const midShaft = arrowOrigin.clone().add(arrowHeadStart).multiplyScalar(0.5);
      const midHead = arrowHeadStart.clone().add(forceDir.clone().multiplyScalar(headLength / 2));

      arrows.push(
        <group key={`pressure-arrow-${zIndex}-${i}`}>
          <Cylinder 
            args={[shaftRadius, shaftRadius, shaftLength, 8]} 
            position={midShaft} 
            quaternion={quaternion}
            material={material}
          />
          <Cone
            args={[headRadius, headLength, 8]}
            position={midHead}
            quaternion={quaternion}
            material={material}
          />
        </group>
      );
    }
  }

  return <group>{arrows}</group>;
};
