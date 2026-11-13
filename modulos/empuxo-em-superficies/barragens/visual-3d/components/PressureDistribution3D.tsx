import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Cylinder, Cone } from '@react-three/drei';

interface PressureDistributionProps {
  level: number;
  maxPressureLevel?: number;
  inclinationAngle: number;
  downstreamFaceAngle?: number;
  downstreamToeX?: number;
  actualBaseWidth: number;
  offsetX: number;
  isUpstream: boolean;
  color?: string;
  channelWidth?: number;
  zSlices?: number;
  arrowCount?: number;
  archRadius?: number;
  damHeight?: number;
  damCrestWidth?: number;
  mudHeight?: number;
  mudDensityRatio?: number;
}

export const PressureDistribution3D: React.FC<PressureDistributionProps> = ({
  level,
  maxPressureLevel,
  inclinationAngle,
  downstreamFaceAngle,
  downstreamToeX,
  actualBaseWidth,
  offsetX,
  isUpstream,
  color = '#1e3a8a',
  channelWidth = 40,
  zSlices = 13,
  arrowCount = 14,
  archRadius,
  damHeight,
  damCrestWidth,
  mudHeight = 0,
  mudDensityRatio = 1.5,
}) => {
  const { material, mudMaterial } = useMemo(() => {
    const mk = (c: string) =>
      new THREE.MeshStandardMaterial({
        color: c,
        emissive: c,
        emissiveIntensity: 0.8,
        depthTest: true,
        depthWrite: true,
        transparent: false,
        opacity: 1.0,
      });
    return {
      material: mk(color),
      mudMaterial: mk('#b45309'),
    };
  }, [color]);

  if (level <= 0) return null;

  const angleRad = (inclinationAngle * Math.PI) / 180;
  const effectiveDownToe = downstreamToeX ?? actualBaseWidth;
  const dxUpstream = Math.abs(inclinationAngle - 90) < 1e-4 ? 0 : (damHeight !== undefined ? damHeight / Math.tan(angleRad) : 0);

  let downAngleRad = Math.PI / 2;
  if (downstreamFaceAngle !== undefined) {
    downAngleRad = (downstreamFaceAngle * Math.PI) / 180;
  } else if (damHeight !== undefined && damCrestWidth !== undefined) {
    const deltaX = effectiveDownToe - (dxUpstream + damCrestWidth);
    if (deltaX > 1e-4) {
      downAngleRad = Math.atan2(damHeight, deltaX);
    }
  }

  let baseForceDir = new THREE.Vector3();
  let baseFaceOutwardNormal = new THREE.Vector3();

  if (isUpstream) {
    baseForceDir = new THREE.Vector3(Math.sin(angleRad), -Math.cos(angleRad), 0).normalize();
    baseFaceOutwardNormal = baseForceDir.clone().negate();
  } else {
    baseForceDir = new THREE.Vector3(-Math.sin(downAngleRad), -Math.cos(downAngleRad), 0).normalize();
    baseFaceOutwardNormal = baseForceDir.clone().negate();
  }

  const arrows = [];
  const effMud = isUpstream && mudHeight > 0 ? Math.min(mudHeight, level) : 0;
  const effMaxUp = effMud > 0 ? (level - effMud) + mudDensityRatio * effMud : level;
  const scaleMaxLevel = Math.max(effMaxUp, maxPressureLevel ?? level, 1e-6);
  const maxArrowLength = Math.max(1.5, Math.min(8, scaleMaxLevel * 0.4));
  const faceOffset = 0.5;

  for (let zIndex = 0; zIndex < zSlices; zIndex++) {
    const margin = channelWidth * 0.1;
    const usableWidth = channelWidth - 2 * margin;

    let currentZ = 0;
    let currentTheta = 0;

    if (archRadius && archRadius > 0) {
      const thetaMax = channelWidth / archRadius;
      const angleSpacing = thetaMax * 0.8;
      const startAngle = -angleSpacing / 2;
      currentTheta = (zSlices > 1)
        ? startAngle + (angleSpacing / (zSlices - 1)) * zIndex
        : 0;
    } else {
      currentZ = (zSlices > 1)
        ? -channelWidth / 2 + margin + (usableWidth / (zSlices - 1)) * zIndex
        : 0;
    }

    for (let i = 1; i <= arrowCount; i++) {
      const y = (level / arrowCount) * i - (level / arrowCount / 2);
      const inMud = effMud > 0 && y < effMud - 1e-6;
      const depth = inMud
        ? (level - effMud) + mudDensityRatio * (effMud - y)
        : level - y;
      const lengthRatio = depth / scaleMaxLevel;
      const arrowLength = maxArrowLength * lengthRatio;
      const activeMat = inMud ? mudMaterial : material;

      if (arrowLength < 0.3) continue;

      let x_3d = 0;
      if (isUpstream) {
        const dx = Math.abs(inclinationAngle - 90) < 1e-4 ? 0 : y / Math.tan(angleRad);
        x_3d = dx - offsetX;
      } else {
        const dx = Math.abs(downAngleRad - Math.PI / 2) < 1e-4
          ? effectiveDownToe
          : effectiveDownToe - y / Math.tan(downAngleRad);
        x_3d = dx - offsetX;
      }

      let facePoint: THREE.Vector3;
      const forceDir = baseForceDir.clone();
      const faceOutwardNormal = baseFaceOutwardNormal.clone();

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
        facePoint = new THREE.Vector3(x_3d, y, currentZ);
      }

      const quaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        forceDir
      );

      const tipPoint = facePoint.clone().add(faceOutwardNormal.clone().multiplyScalar(faceOffset));

      const headLength = Math.max(0.3, Math.min(0.9, arrowLength * 0.25));
      const headRadius = 0.20;
      const shaftRadius = 0.08;
      const shaftLength = arrowLength - headLength;

      if (shaftLength <= 0) continue;

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
            material={activeMat}
          />
          <Cone
            args={[headRadius, headLength, 8]}
            position={midHead}
            quaternion={quaternion}
            material={activeMat}
          />
        </group>
      );
    }
  }

  return <group>{arrows}</group>;
};
