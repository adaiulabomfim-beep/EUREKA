import * as THREE from 'three';
import { construirGeometria } from '../../tipos/gravidade/geometria';
import { interpolateX } from '../utils/geometryUtils';

export function buildAguaGravidade(
  damHeight: number,
  damBaseWidth: number,
  damCrestWidth: number,
  inclinationAngle: number,
  channelWidth: number,
  waterLevelY: number,
  side: "UPSTREAM" | "DOWNSTREAM"
): THREE.BufferGeometry | null {
  if (waterLevelY <= 0) return null;

  const { profile, actualBaseWidth } = construirGeometria(
    damHeight,
    damBaseWidth,
    damCrestWidth,
    inclinationAngle
  );

  const shape = new THREE.Shape();
  const offset = actualBaseWidth / 2;

  // Assuming profile indices are:
  // 0: upstream toe
  // 1: upstream crest
  // 2: downstream crest
  // 3: downstream toe

  if (side === 'UPSTREAM') {
    const farX = profile[0].x - damHeight * 1.5; // matching Vista3D farLeft scaling idea
    const damXAtWater = interpolateX(waterLevelY, profile[0], profile[1]);
    
    shape.moveTo(farX, 0);
    shape.lineTo(farX, waterLevelY);
    shape.lineTo(damXAtWater, waterLevelY);
    shape.lineTo(profile[0].x, 0);
    shape.lineTo(farX, 0);
  } else {
    const farX = profile[3].x + damHeight * 1.5;
    const damXAtWater = interpolateX(waterLevelY, profile[3], profile[2]);

    shape.moveTo(profile[3].x, 0);
    shape.lineTo(damXAtWater, waterLevelY);
    shape.lineTo(farX, waterLevelY);
    shape.lineTo(farX, 0);
    shape.lineTo(profile[3].x, 0);
  }

  const extrudeSettings = {
    steps: 1,
    depth: channelWidth,
    bevelEnabled: false,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.translate(-offset, 0, -channelWidth / 2);

  return geometry;
}
