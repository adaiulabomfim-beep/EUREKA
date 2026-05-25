import * as THREE from 'three';
import { construirGeometria } from '../../tipos/gravidade/geometria';

export function buildBarragemGravidade(
  damHeight: number,
  damBaseWidth: number,
  damCrestWidth: number,
  inclinationAngle: number,
  channelWidth: number
): THREE.BufferGeometry {
  const { profile, actualBaseWidth } = construirGeometria(
    damHeight,
    damBaseWidth,
    damCrestWidth,
    inclinationAngle
  );

  const shape = new THREE.Shape();
  if (profile.length > 0) {
    shape.moveTo(profile[0].x, profile[0].y);
    for (let i = 1; i < profile.length; i++) {
        shape.lineTo(profile[i].x, profile[i].y);
    }
    shape.lineTo(profile[0].x, profile[0].y);
  }

  const offset = actualBaseWidth / 2;

  const extrudeSettings = {
    steps: 1,
    depth: channelWidth,
    bevelEnabled: false,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  
  // Center Z around 0, and offset X to center the base
  geometry.translate(-offset, 0, -channelWidth / 2);

  return geometry;
}
