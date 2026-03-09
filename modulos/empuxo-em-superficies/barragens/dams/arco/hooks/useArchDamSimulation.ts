import { useMemo, useCallback } from 'react';
import { DamViewProps } from '../../../core/interfaces/DamRendererProps';
import { buildArchDam } from '../physics/geometry';

const CONCRETE_FILL = "#9ca3af";
const CONCRETE_STROKE = "#334155";
const WATER_LINE_COLOR = "#38bdf8";

export const useArchDamSimulation = (props: DamViewProps, is3D: boolean) => {
  const {
    damHeight, damBaseWidth, damCrestWidth, inclinationAngle,
    upstreamLevel, downstreamLevel,
    face, prism, waterBox3D, toWorldX, CHANNEL_WIDTH, archOffsetFn
  } = props;

  const { profile } = useMemo(() => buildArchDam(damHeight, damBaseWidth, damCrestWidth, inclinationAngle), [damHeight, damBaseWidth, damCrestWidth, inclinationAngle]);

  const getDamXAtY = useCallback((y: number, side: "UPSTREAM" | "DOWNSTREAM") => {
    const steps = 12; // Must match buildArchDam
    if (side === "UPSTREAM") {
      for (let i = 0; i < steps; i++) {
        const p1 = profile[i];
        const p2 = profile[i + 1];
        if (p1.y <= y && p2.y >= y) {
          const t = (y - p1.y) / Math.max(1e-9, p2.y - p1.y);
          return p1.x + t * (p2.x - p1.x);
        }
      }
      return profile[0].x;
    } else {
      for (let i = steps + 1; i < profile.length - 1; i++) {
        const p1 = profile[i];
        const p2 = profile[i + 1];
        if (p1.y >= y && p2.y <= y) {
          const t = (y - p1.y) / Math.max(1e-9, p2.y - p1.y);
          return p1.x + t * (p2.x - p1.x);
        }
      }
      return profile[profile.length - 1].x;
    }
  }, [profile]);

  const worldGeometry = useMemo(() => {
    const damFaces = [];
    const waterFaces = [];

    if (is3D) {
      damFaces.push(...prism(profile, CHANNEL_WIDTH, CONCRETE_FILL, 1, CONCRETE_STROKE, 2, "DAM", archOffsetFn, 0, "url(#concretePattern)", toWorldX, 2));
    } else {
      damFaces.push(face(profile.map((p) => ({ x: toWorldX(p.x), y: p.y, z: 0 })), CONCRETE_FILL, 1, CONCRETE_STROKE, 2.5, { x: 0, y: 0, z: 1 }, "DAM", "url(#concretePattern)", 2));
    }

    if (upstreamLevel > 0) {
      const farX = -80;
      if (is3D) {
        waterFaces.push(...waterBox3D(upstreamLevel, CHANNEL_WIDTH, farX, "UPSTREAM", getDamXAtY, toWorldX, archOffsetFn, "A"));
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
        waterFaces.push(...waterBox3D(downstreamLevel, CHANNEL_WIDTH, farX, "DOWNSTREAM", getDamXAtY, toWorldX, archOffsetFn, "B"));
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
  }, [profile, is3D, upstreamLevel, downstreamLevel, CHANNEL_WIDTH, face, prism, waterBox3D, toWorldX, getDamXAtY, archOffsetFn]);

  return { worldGeometry, getDamXAtY, profile };
};
