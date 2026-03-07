import { useMemo, useCallback } from 'react';
import { DamViewProps } from '../../../core/interfaces';
import { buildButtressDam } from '../physics/geometry';

const CONCRETE_FILL = "#9ca3af";
const CONCRETE_STROKE = "#334155";
const WATER_LINE_COLOR = "#38bdf8";

export const useButtressDamSimulation = (props: DamViewProps, is3D: boolean) => {
  const {
    damHeight, damBaseWidth, damCrestWidth,
    upstreamLevel, downstreamLevel,
    face, prism, waterBox3D, toWorldX, CHANNEL_WIDTH
  } = props;

  const { wallProfile, buttressProfile } = useMemo(() => buildButtressDam(damHeight, damBaseWidth, damCrestWidth), [damHeight, damBaseWidth, damCrestWidth]);

  const getDamXAtY = useCallback((y: number, side: "UPSTREAM" | "DOWNSTREAM") => {
    if (side === "UPSTREAM") return 0;
    return damBaseWidth;
  }, [damBaseWidth]);

  const worldGeometry = useMemo(() => {
    const damFaces = [];
    const waterFaces = [];

    if (is3D) {
      damFaces.push(...prism(wallProfile, CHANNEL_WIDTH, CONCRETE_FILL, 1, CONCRETE_STROKE, 2, "DAM", undefined, 0, "url(#concretePattern)", toWorldX, 2));

      const numButtresses = 5;
      const spacing = CHANNEL_WIDTH / numButtresses;
      const buttressThick = spacing * 0.38;
      for (let i = 0; i < numButtresses; i++) {
        const zCenter = -CHANNEL_WIDTH / 2 + spacing / 2 + i * spacing;
        damFaces.push(...prism(buttressProfile, buttressThick, CONCRETE_FILL, 1, CONCRETE_STROKE, 2, "DAM", undefined, zCenter, "url(#concretePattern)", toWorldX, 3));
      }
    } else {
      damFaces.push(face(wallProfile.map((p) => ({ x: toWorldX(p.x), y: p.y, z: 0 })), CONCRETE_FILL, 1, CONCRETE_STROKE, 2.5, { x: 0, y: 0, z: 1 }, "DAM", "url(#concretePattern)", 2));
      damFaces.push(face(buttressProfile.map((p) => ({ x: toWorldX(p.x), y: p.y, z: 0 })), CONCRETE_FILL, 1, CONCRETE_STROKE, 2.5, { x: 0, y: 0, z: 1 }, "DAM", "url(#concretePattern)", 2));
    }

    if (upstreamLevel > 0) {
      const farX = -80;
      if (is3D) {
        waterFaces.push(...waterBox3D(upstreamLevel, CHANNEL_WIDTH, farX, "UPSTREAM", getDamXAtY, toWorldX, undefined, "A"));
      } else {
        const xC = getDamXAtY(upstreamLevel, "UPSTREAM");
        const poly = [
          { x: toWorldX(farX), y: 0, z: 0 },
          { x: toWorldX(getDamXAtY(0, "UPSTREAM")), y: 0, z: 0 },
          { x: toWorldX(xC), y: upstreamLevel, z: 0 },
          { x: toWorldX(farX), y: upstreamLevel, z: 0 },
        ];
        waterFaces.push(face(poly, "url(#fluidDepthA)", 1, "none", 0, { x: 0, y: 0, z: 1 }, "WATER", undefined, 0));
        waterFaces.push(face([{ x: toWorldX(farX), y: upstreamLevel, z: 0 }, { x: toWorldX(xC), y: upstreamLevel, z: 0 }], "none", 1, WATER_LINE_COLOR, 2, { x: 0, y: 0, z: 1 }, "WATER"));
      }
    }

    if (downstreamLevel > 0) {
      const farX = 80;
      if (is3D) {
        waterFaces.push(...waterBox3D(downstreamLevel, CHANNEL_WIDTH, farX, "DOWNSTREAM", getDamXAtY, toWorldX, undefined, "B"));
      } else {
        const xC = getDamXAtY(downstreamLevel, "DOWNSTREAM");
        const poly = [
          { x: toWorldX(getDamXAtY(0, "DOWNSTREAM")), y: 0, z: 0 },
          { x: toWorldX(farX), y: 0, z: 0 },
          { x: toWorldX(farX), y: downstreamLevel, z: 0 },
          { x: toWorldX(xC), y: downstreamLevel, z: 0 },
        ];
        waterFaces.push(face(poly, "url(#fluidDepthB)", 1, "none", 0, { x: 0, y: 0, z: 1 }, "WATER", undefined, 0));
        waterFaces.push(face([{ x: toWorldX(xC), y: downstreamLevel, z: 0 }, { x: toWorldX(farX), y: downstreamLevel, z: 0 }], "none", 1, WATER_LINE_COLOR, 2, { x: 0, y: 0, z: 1 }, "WATER"));
      }
    }

    return [...waterFaces, ...damFaces];
  }, [wallProfile, buttressProfile, is3D, upstreamLevel, downstreamLevel, CHANNEL_WIDTH, face, prism, waterBox3D, toWorldX, getDamXAtY]);

  return { worldGeometry, getDamXAtY, profile: [...wallProfile, ...buttressProfile] };
};
