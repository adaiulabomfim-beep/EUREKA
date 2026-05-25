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
}

export const PressureDistribution3D: React.FC<PressureDistributionProps> = ({
  level,
  inclinationAngle,
  actualBaseWidth,
  offsetX,
  isUpstream,
  color = '#1e3a8a', // default dark blue matching water but contrasting
  channelWidth = 40,
  zSlices = 5,
  arrowCount = 12
}) => {
  if (level <= 0) return null;

  const angleRad = (inclinationAngle * Math.PI) / 180;
  
  // Base materials
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.6,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.9,
    });
  }, [color]);

  let forceDir = new THREE.Vector3();
  if (isUpstream) {
    forceDir = new THREE.Vector3(Math.sin(angleRad), -Math.cos(angleRad), 0).normalize();
  } else {
    forceDir = new THREE.Vector3(-1, 0, 0); // Simplified downstream pointing left
  }

  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0), // Default cylinder/cone points UP (+Y)
    forceDir
  );

  const arrows = [];
  // Calculate maximum visual length based on water height
  const maxArrowLength = Math.max(1.5, Math.min(8, level * 0.4)); 
  
  for (let zIndex = 0; zIndex < zSlices; zIndex++) {
    // Distribute from inside to the front, slightly avoiding the exact edge
    // Use an offset so they don't clip through the wall.
    // Z ranges roughly from -channelWidth/2 to +channelWidth/2.
    // Let's make it go from -channelWidth/2 + margin to channelWidth/2 - margin
    const margin = channelWidth * 0.15;
    const usableWidth = channelWidth - 2 * margin;
    const currentZ = (zSlices > 1) 
      ? -channelWidth/2 + margin + (usableWidth / (zSlices - 1)) * zIndex
      : 0;

    for (let i = 1; i <= arrowCount; i++) {
      // Generate y from bottom to top
      const y = (level / arrowCount) * i - (level / arrowCount / 2); 
      
      // Depth at this y (pressure is proportional to depth)
      const depth = level - y;
      const lengthRatio = depth / level;
      
      const arrowLength = maxArrowLength * lengthRatio;
      
      // Skip tiny arrows
      if (arrowLength < 0.3) continue;
      
      let x_3d = 0;
      if (isUpstream) {
        const dx = inclinationAngle === 90 ? 0 : y / Math.tan(angleRad);
        x_3d = dx - offsetX;
      } else {
        const dx = actualBaseWidth; // Simplified downstream
        x_3d = dx - offsetX;
      }

      const facePoint = new THREE.Vector3(x_3d, y, currentZ);
      
      const headLength = Math.max(0.3, Math.min(0.8, arrowLength * 0.25));
      const headRadius = 0.18;
      const shaftRadius = 0.08;
      const shaftLength = arrowLength - headLength;
      
      if (shaftLength <= 0) continue;

      const arrowOrigin = facePoint.clone().sub(forceDir.clone().multiplyScalar(arrowLength));
      const arrowHeadStart = facePoint.clone().sub(forceDir.clone().multiplyScalar(headLength));
      
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

  return <group renderOrder={998}>{arrows}</group>;
};
