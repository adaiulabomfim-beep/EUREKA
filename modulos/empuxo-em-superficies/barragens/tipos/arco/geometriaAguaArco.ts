/**
 * Geometria de água dedicada para a Barragem em Arco.
 *
 * Usa fatias Z idênticas às da barragem (24) para que cada fatia d'água
 * tenha centroide coincidente com sua fatia correspondente da barragem.
 * Micro-sobreposição entre fatias elimina gaps de anti-aliasing (sem malha visível).
 * A face de contato (encostada na barragem) NÃO é renderizada, eliminando Z-fighting.
 */

import { Point3D, WorldFace } from '../../visual/motorCena3D';

const face = (
  pts3: Point3D[], fill: string, opacity: number,
  stroke = 'none', strokeWidth = 0, normal?: Point3D,
  kind: 'DAM' | 'WATER_UP' | 'WATER_DOWN' | 'EARTH' = 'WATER_UP', hatch?: string, priority = 1
): WorldFace => ({ pts3, fill, opacity, stroke, strokeWidth, normal, kind, hatchPattern: hatch, priority });

export const caixaAguaArco3D = (
  waterLevelY: number,
  channelWidth: number,
  farX: number,
  side: 'UPSTREAM' | 'DOWNSTREAM',
  getDamXAtY: (y: number, side: 'UPSTREAM' | 'DOWNSTREAM') => number,
  toWorldX: (x: number) => number,
  archOffsetFn: (z: number, x?: number) => number,
  fillId: 'A' | 'B' = 'A',
  slices: number = 24
): WorldFace[] => {
  const faces: WorldFace[] = [];
  const up = side === 'UPSTREAM';
  const halfW = channelWidth / 2;
  const dz = channelWidth / slices;
  const wL = waterLevelY;
  const fX = toWorldX(farX);
  const waterKind = up ? 'WATER_UP' : 'WATER_DOWN';

  const fill = fillId === 'A' ? 'url(#fluidDepthA)' : 'url(#fluidDepthB)';
  const surf = fillId === 'A' ? 'url(#surfaceGradientA)' : 'url(#surfaceGradientB)';
  const ripple = 'url(#ripplePattern)';

  const cx = (y: number, z: number) => {
    return toWorldX(getDamXAtY(y, side) + archOffsetFn(z));
  };

  for (let s = 0; s < slices; s++) {
    const z1 = -halfW + s * dz;
    const z2 = -halfW + (s + 1) * dz;

    // SUPERFÍCIE (y=waterLevel)
    faces.push(face(
      up
        ? [{ x: fX, y: wL, z: z1 }, { x: fX, y: wL, z: z2 },
           { x: cx(wL, z2), y: wL, z: z2 }, { x: cx(wL, z1), y: wL, z: z1 }]
        : [{ x: cx(wL, z1), y: wL, z: z1 }, { x: cx(wL, z2), y: wL, z: z2 },
           { x: fX, y: wL, z: z2 }, { x: fX, y: wL, z: z1 }],
      surf, 0.95, 'none', 0, { x: 0, y: 1, z: 0 }, waterKind, ripple, 1
    ));
  }

  // PAREDE DISTANTE (único polígono massivo, x=fX, elimina listras verticais)
  const fnx = up ? -1 : 1;
  const backWallPts: Point3D[] = up
    ? [{ x: fX, y: 0, z: -halfW }, { x: fX, y: 0, z: halfW }, { x: fX, y: wL, z: halfW }, { x: fX, y: wL, z: -halfW }]
    : [{ x: fX, y: 0, z: halfW }, { x: fX, y: 0, z: -halfW }, { x: fX, y: wL, z: -halfW }, { x: fX, y: wL, z: halfW }];

  faces.push(face(
    backWallPts,
    fill, 0.95, 'none', 0, { x: fnx, y: 0, z: 0 }, waterKind, undefined, 1
  ));

  // FACES Z (frente e trás, z=+halfW e z=-halfW)
  faces.push(face(
    up
      ? [{ x: fX, y: 0, z: halfW }, { x: cx(0, halfW), y: 0, z: halfW },
         { x: cx(wL, halfW), y: wL, z: halfW }, { x: fX, y: wL, z: halfW }]
      : [{ x: cx(0, halfW), y: 0, z: halfW }, { x: fX, y: 0, z: halfW },
         { x: fX, y: wL, z: halfW }, { x: cx(wL, halfW), y: wL, z: halfW }],
    fill, 0.95, 'none', 0, { x: 0, y: 0, z: 1 }, waterKind, undefined, 1
  ));

  faces.push(face(
    up
      ? [{ x: cx(0, -halfW), y: 0, z: -halfW }, { x: fX, y: 0, z: -halfW },
         { x: fX, y: wL, z: -halfW }, { x: cx(wL, -halfW), y: wL, z: -halfW }]
      : [{ x: fX, y: 0, z: -halfW }, { x: cx(0, -halfW), y: 0, z: -halfW },
         { x: cx(wL, -halfW), y: wL, z: -halfW }, { x: fX, y: wL, z: -halfW }],
    fill, 0.95, 'none', 0, { x: 0, y: 0, z: -1 }, waterKind, undefined, 1
  ));

  return faces;
};
