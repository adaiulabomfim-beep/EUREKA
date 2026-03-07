import { useMemo, useCallback } from 'react';
import { DamViewProps } from '../../../core/interfaces';
import { buildEarthDam } from '../physics/geometry';
import { getDamXAtYGeneric } from '../../../core/shared/geometryUtils';

const EARTH_FILL = "#8B5A2B";
const EARTH_STROKE = "#334155";
const WATER_LINE_COLOR = "#38bdf8";

export const useEarthRockfillDamSimulation = (props: DamViewProps, is3D: boolean) => {
  const {
    damHeight, damBaseWidth, damCrestWidth, inclinationAngle,
    upstreamLevel, downstreamLevel,
    face, prism, waterBox3D, toWorldX, CHANNEL_WIDTH
  } = props;

  const { profile } = useMemo(() => buildEarthDam(damHeight, damBaseWidth, damCrestWidth, inclinationAngle), [damHeight, damBaseWidth, damCrestWidth, inclinationAngle]);

  const getDamXAtY = useCallback((y: number, side: "UPSTREAM" | "DOWNSTREAM") => {
    return getDamXAtYGeneric(profile, y, side);
  }, [profile]);

  const worldGeometry = useMemo(() => {
    const damFaces = [];
    const waterFaces = [];

    if (is3D) {
      damFaces.push(...prism(profile, CHANNEL_WIDTH, EARTH_FILL, 1, EARTH_STROKE, 2, "DAM", undefined, 0, "url(#earthHatch)", toWorldX, 2));
    } else {
      damFaces.push(face(profile.map((p) => ({ x: toWorldX(p.x), y: p.y, z: 0 })), EARTH_FILL, 1, EARTH_STROKE, 2.5, { x: 0, y: 0, z: 1 }, "DAM", "url(#earthHatch)", 2));
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
  }, [profile, is3D, upstreamLevel, downstreamLevel, CHANNEL_WIDTH, face, prism, waterBox3D, toWorldX, getDamXAtY]);

  return { worldGeometry, getDamXAtY, profile };
};
