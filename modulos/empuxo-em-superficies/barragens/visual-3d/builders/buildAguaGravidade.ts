import * as THREE from 'three';
import { construirGeometria } from '../../tipos/gravidade/geometria';
import { getHorizontalExtension3D, interpolateX } from '../utils/geometryUtils';

export function buildAguaGravidade(
  damHeight: number,
  damBaseWidth: number,
  damCrestWidth: number,
  inclinationAngle: number,
  channelWidth: number,
  waterLevelY: number,
  side: "UPSTREAM" | "DOWNSTREAM",
  yStart: number = 0
): THREE.BufferGeometry | null {
  const y0 = Math.max(0, yStart);
  const y1 = Math.max(y0, waterLevelY);
  if (y1 - y0 <= 1e-6) return null;

  const { profile, actualBaseWidth } = construirGeometria(
    damHeight,
    damBaseWidth,
    damCrestWidth,
    inclinationAngle
  );

  const shape = new THREE.Shape();
  const offset = actualBaseWidth / 2;
  const farExtension = getHorizontalExtension3D(damHeight, actualBaseWidth);

  if (side === 'UPSTREAM') {
    const farX = profile[0].x - farExtension;
    const damXAtBottom = interpolateX(y0, profile[0], profile[1]);
    const damXAtTop = interpolateX(y1, profile[0], profile[1]);

    shape.moveTo(farX, y0);
    shape.lineTo(farX, y1);
    shape.lineTo(damXAtTop, y1);
    shape.lineTo(damXAtBottom, y0);
    shape.lineTo(farX, y0);
  } else {
    const farX = profile[3].x + farExtension;
    const damXAtBottom = interpolateX(y0, profile[3], profile[2]);
    const damXAtTop = interpolateX(y1, profile[3], profile[2]);

    shape.moveTo(damXAtBottom, y0);
    shape.lineTo(damXAtTop, y1);
    shape.lineTo(farX, y1);
    shape.lineTo(farX, y0);
    shape.lineTo(damXAtBottom, y0);
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
