import { buildBarragemArcoGeometry } from './modulos/empuxo-em-superficies/barragens/visual-3d/builders/buildBarragemArco.ts';
import { buildAguaArcoGeometry } from './modulos/empuxo-em-superficies/barragens/visual-3d/builders/buildAguaArco.ts';
import * as THREE from 'three';

try {
  // @ts-ignore
  const damGeom = buildBarragemArcoGeometry(15, 3.75, 1.5, undefined, 30, 40, 64);
  console.log("damGeom vertices:", damGeom.attributes.position.count);
  for (let i = 0; i < damGeom.attributes.position.array.length; i++) {
    if (isNaN(damGeom.attributes.position.array[i])) {
      console.log("NaN found in damGeom at", i);
      break;
    }
  }

  const edges = new THREE.EdgesGeometry(damGeom, 15);
  console.log("Edges created!");
} catch (e) {
  console.log("ERROR:", e);
}
