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
  kind: 'DAM' | 'WATER' = 'WATER', hatch?: string, priority = 1
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
  const wL = waterLevelY;
  const fX = toWorldX(farX);

  const fill = fillId === 'A' ? 'url(#fluidDepthA)' : 'url(#fluidDepthB)';
  const surf = fillId === 'A' ? 'url(#surfaceGradientA)' : 'url(#surfaceGradientB)';
  const ripple = 'url(#ripplePattern)';

  const cx = (y: number, z: number) => {
    const nudge = up ? -0.2 : 0.2;
    return toWorldX(getDamXAtY(y, side) + archOffsetFn(z)) + nudge;
  };

  // Montar array de pontos da margem curva
  const curvePtsTop: Point3D[] = [];
  const curvePtsBottom: Point3D[] = [];
  for (let s = 0; s <= slices; s++) {
    const z = -halfW + s * (channelWidth / slices);
    curvePtsTop.push({ x: cx(wL, z), y: wL, z });
    curvePtsBottom.push({ x: cx(0, z), y: 0, z });
  }

  // Se for montante, esquerda para direita é -z para +z, o que afeta a orientação
  // SUPERFÍCIE (1 polígono gigante)
  const surfPts: Point3D[] = [
    { x: fX, y: wL, z: -halfW },
    ...curvePtsTop,
    { x: fX, y: wL, z: halfW }
  ];
  if (!up) surfPts.reverse(); // Garante normal correta

  faces.push(face(
    surfPts,
    surf, 0.95, 'none', 0, { x: 0, y: 1, z: 0 }, 'WATER', ripple, 1
  ));

  // PAREDE DISTANTE (1 polígono gigante x=fX)
  const fnx = up ? -1 : 1;
  const backWallPts: Point3D[] = up
    ? [{ x: fX, y: 0, z: -halfW }, { x: fX, y: 0, z: halfW }, { x: fX, y: wL, z: halfW }, { x: fX, y: wL, z: -halfW }]
    : [{ x: fX, y: 0, z: halfW }, { x: fX, y: 0, z: -halfW }, { x: fX, y: wL, z: -halfW }, { x: fX, y: wL, z: halfW }];

  faces.push(face(
    backWallPts,
    fill, 0.95, 'none', 0, { x: fnx, y: 0, z: 0 }, 'WATER', undefined, 1
  ));

  // FACES Z (frente e trás, z=+halfW e z=-halfW)
  faces.push(face(
    up
      ? [{ x: fX, y: 0, z: halfW }, { x: cx(0, halfW), y: 0, z: halfW },
         { x: cx(wL, halfW), y: wL, z: halfW }, { x: fX, y: wL, z: halfW }]
      : [{ x: cx(0, halfW), y: 0, z: halfW }, { x: fX, y: 0, z: halfW },
         { x: fX, y: wL, z: halfW }, { x: cx(wL, halfW), y: wL, z: halfW }],
    fill, 0.95, 'none', 0, { x: 0, y: 0, z: 1 }, 'WATER', undefined, 1
  ));

  faces.push(face(
    up
      ? [{ x: cx(0, -halfW), y: 0, z: -halfW }, { x: fX, y: 0, z: -halfW },
         { x: fX, y: wL, z: -halfW }, { x: cx(wL, -halfW), y: wL, z: -halfW }]
      : [{ x: fX, y: 0, z: -halfW }, { x: cx(0, -halfW), y: 0, z: -halfW },
         { x: cx(wL, -halfW), y: wL, z: -halfW }, { x: fX, y: wL, z: -halfW }],
    fill, 0.95, 'none', 0, { x: 0, y: 0, z: -1 }, 'WATER', undefined, 1
  ));

  return faces;
};
