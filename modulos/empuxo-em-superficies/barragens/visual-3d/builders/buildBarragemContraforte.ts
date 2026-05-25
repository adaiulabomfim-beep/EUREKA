import * as THREE from 'three';
import { construirGeometria } from '../../tipos/contraforte/geometria';

export function getContraforteShapes(
  damHeight: number,
  damBaseWidth: number,
  damCrestWidth: number,
  inclinationAngle: number,
  buttressAngle: number
) {
  const { wallProfile, buttressProfile3D, actualBaseWidth } = construirGeometria(
    damHeight,
    damBaseWidth,
    damCrestWidth,
    inclinationAngle,
    buttressAngle
  );

  const toWorldX = (x: number) => x - actualBaseWidth / 2;

  // Main Wall Shape
  const wallShape = new THREE.Shape();
  wallShape.moveTo(toWorldX(wallProfile[0].x), wallProfile[0].y);
  wallShape.lineTo(toWorldX(wallProfile[1].x), wallProfile[1].y);
  wallShape.lineTo(toWorldX(wallProfile[2].x), wallProfile[2].y);
  wallShape.lineTo(toWorldX(wallProfile[3].x), wallProfile[3].y);
  wallShape.lineTo(toWorldX(wallProfile[0].x), wallProfile[0].y);

  // Buttress Shape
  const buttressShape = new THREE.Shape();
  // To avoid floating-point gaps and z-fighting, we slightly overlap the buttress into the wall
  const overlap = 0.05; 
  buttressShape.moveTo(toWorldX(buttressProfile3D[0].x) - overlap, buttressProfile3D[0].y);
  buttressShape.lineTo(toWorldX(buttressProfile3D[1].x) - overlap, buttressProfile3D[1].y);
  buttressShape.lineTo(toWorldX(buttressProfile3D[2].x), buttressProfile3D[2].y);
  buttressShape.lineTo(toWorldX(buttressProfile3D[0].x) - overlap, buttressProfile3D[0].y);

  return { wallShape, buttressShape };
}
