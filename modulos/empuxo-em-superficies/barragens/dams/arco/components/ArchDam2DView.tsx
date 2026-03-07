import React, { useMemo, useCallback } from 'react';
import { DamRendererProps } from '../../../core/interfaces/DamRendererProps';
import { useArchDamSimulation } from '../hooks/useArchDamSimulation';
import { useSceneEngine } from '../../../core/shared/useSceneEngine';
import { SceneContainer } from '../../../core/components/SceneContainer';
import { face, prism, waterBox3D } from '../../../core/shared/geometryUtils';

export const ArchDam2DView: React.FC<DamRendererProps & { is3D: boolean, setIs3D: any, showVectors: boolean, setShowVectors: any }> = (props) => {
  const {
    damHeight, damBaseWidth, damCrestWidth, inclinationAngle,
    upstreamLevel, downstreamLevel = 0,
    force, s_cp, up, isAnalyzed, onCalculate, onReset,
    is3D, setIs3D, showVectors, setShowVectors
  } = props;

  const SVG_W = 900;
  const SVG_H = 520;
  const ORIGIN_X = SVG_W * 0.52;
  const ORIGIN_Y = SVG_H * 0.82;
  const CHANNEL_WIDTH = 40;

  const toWorldX = useCallback((x: number) => x - damBaseWidth / 2, [damBaseWidth]);

  const archRadius = useMemo(() => Math.max(CHANNEL_WIDTH * 0.6, damBaseWidth * 1.5), [damBaseWidth]);
  const archOffsetFn = useMemo(() => {
    return (z: number) => {
      const rr = archRadius * archRadius;
      const zz = z * z;
      return archRadius - Math.sqrt(Math.max(0, rr - zz));
    };
  }, [archRadius]);

  const { worldGeometry, getDamXAtY, profile } = useArchDamSimulation({
    damHeight, damBaseWidth, damCrestWidth, inclinationAngle,
    upstreamLevel, downstreamLevel,
    face, prism, waterBox3D, toWorldX, CHANNEL_WIDTH, archOffsetFn
  }, false);

  const autoFitParams = useMemo(() => {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    const zs = [-CHANNEL_WIDTH / 2, CHANNEL_WIDTH / 2];
    profile.forEach((p: any) => {
      zs.forEach((z) => {
        const off = archOffsetFn ? archOffsetFn(z) : 0;
        const wx = toWorldX(p.x + off);
        minX = Math.min(minX, wx);
        maxX = Math.max(maxX, wx);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
        minZ = Math.min(minZ, z);
        maxZ = Math.max(maxZ, z);
      });
    });

    return { minX, maxX, minY, maxY, minZ, maxZ };
  }, [profile, archOffsetFn, toWorldX]);

  const { renderedFaces, project, SCALE, handlers, resetView } = useSceneEngine(
    false, worldGeometry, SVG_W, SVG_H, ORIGIN_X, ORIGIN_Y, autoFitParams
  );

  const vectors = useMemo(() => {
    if (!showVectors) return [];

    const vecs: any[] = [];
    const isInside = (p: { x: number; y: number }) => p.x >= 10 && p.x <= SVG_W - 10 && p.y >= 10 && p.y <= SVG_H - 10;

    const pushArrow = (x: number, y: number, z: number, nx: number, ny: number, magWorld: number, color: string, isResultant: boolean, val?: string) => {
      let finalMag = magWorld;
      const pEnd = project({ x, y, z });
      let pStart = project({ x: x - nx * finalMag, y: y - ny * finalMag, z });

      if (!isInside(pStart)) {
        for (let f of [0.8, 0.6, 0.4, 0.2, 0.1, 0.05]) {
          const testMag = magWorld * f;
          const testStart = project({ x: x - nx * testMag, y: y - ny * testMag, z });
          if (isInside(testStart)) {
            finalMag = testMag;
            pStart = testStart;
            break;
          }
        }
      }

      vecs.push({
        start: pStart,
        end: pEnd,
        color,
        isResultant,
        val: val || "",
        opacity: isResultant ? 1 : 0.40,
        strokeWidth: isResultant ? 3.5 : 1.35,
      });
    };

    const localNormal = (y: number, side: "UPSTREAM" | "DOWNSTREAM") => {
      const dy = 0.05;
      const y1 = Math.max(0, y - dy);
      const y2 = Math.min(damHeight, y + dy);
      const x1 = getDamXAtY(y1, side);
      const x2 = getDamXAtY(y2, side);
      const dx = x2 - x1;
      const dY = y2 - y1;

      let nx = -dY;
      let ny = dx;

      if (side === "UPSTREAM") {
        if (nx < 0) { nx = -nx; ny = -ny; }
      } else {
        if (nx > 0) { nx = -nx; ny = -ny; }
      }

      const mag = Math.sqrt(nx * nx + ny * ny) || 1;
      return { nx: nx / mag, ny: ny / mag };
    };

    const Ny = 40;
    const Nz = 1;
    const zMin = -CHANNEL_WIDTH / 2;
    const zMax = CHANNEL_WIDTH / 2;

    if (upstreamLevel > 0) {
      for (let i = 0; i < Ny; i++) {
        const d = (i / (Ny - 1)) * upstreamLevel;
        const y = upstreamLevel - d;
        const { nx, ny } = localNormal(y, "UPSTREAM");
        const Lpx = 10 + (72 - 10) * (d / Math.max(1e-9, upstreamLevel));
        const Lw = Lpx / SCALE;

        for (let j = 0; j < Nz; j++) {
          const z = 0;
          const base = getDamXAtY(y, "UPSTREAM");
          const off = archOffsetFn ? archOffsetFn(z) : 0;
          const x = toWorldX(base + off);
          pushArrow(x, y, z, nx, ny, Lw, "#1e40af", false);
        }
      }
    }

    if (downstreamLevel > 0) {
      for (let i = 0; i < Ny; i++) {
        const d = (i / (Ny - 1)) * downstreamLevel;
        const y = downstreamLevel - d;
        const { nx, ny } = localNormal(y, "DOWNSTREAM");
        const Lpx = 10 + (72 - 10) * (d / Math.max(1e-9, downstreamLevel));
        const Lw = Lpx / SCALE;

        for (let j = 0; j < Nz; j++) {
          const z = 0;
          const base = getDamXAtY(y, "DOWNSTREAM");
          const off = archOffsetFn ? archOffsetFn(z) : 0;
          const x = toWorldX(base + off);
          pushArrow(x, y, z, nx, ny, Lw, "#3b82f6", false);
        }
      }
    }

    if (isAnalyzed) {
      const zCenter = 0;
      if (up && force !== 0) {
        const { nx, ny } = localNormal(s_cp, "UPSTREAM");
        const base = getDamXAtY(s_cp, "UPSTREAM");
        const off = archOffsetFn ? archOffsetFn(zCenter) : 0;
        const x = toWorldX(base + off);
        pushArrow(x, s_cp, zCenter, nx, ny, 120 / SCALE, "#1e40af", true, "FR");
      }
    }

    return vecs;
  }, [showVectors, upstreamLevel, downstreamLevel, isAnalyzed, force, s_cp, up, damHeight, getDamXAtY, toWorldX, project, SCALE, archOffsetFn]);

  const originProj = project({ x: 0, y: 0, z: 0 });

  return (
    <SceneContainer
      is3D={is3D} setIs3D={setIs3D}
      showVectors={showVectors} setShowVectors={setShowVectors}
      isAnalyzed={isAnalyzed} onCalculate={onCalculate} onReset={onReset}
      resetView={resetView} handlers={handlers}
      renderedFaces={renderedFaces} vectors={vectors}
      SVG_W={SVG_W} SVG_H={SVG_H} ORIGIN_X={originProj.x} ORIGIN_Y={originProj.y}
    />
  );
};
