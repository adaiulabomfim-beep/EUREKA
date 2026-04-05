import React, { useMemo, useCallback } from 'react';
import { RenderizadorBarragensProps } from '../../dominio/tipos';
import { construirGeometria } from './geometria';
import {
  getDamXAtYGeneric,
  criarPrisma,
  caixaAgua3D,
  criarBaseTerra,
} from '../../visual/auxiliaresGeometriaCena';
import { useSceneEngine } from '../../visual/motorCena3D';
import { SceneContainer } from '../../visual/ContainerCena';

type SceneVector = {
  start: { x: number; y: number };
  end: { x: number; y: number };
  color: string;
  isResultant: boolean;
  val: string;
  opacity: number;
  strokeWidth: number;
};

export const Vista3D: React.FC<
  RenderizadorBarragensProps & {
    is3D: boolean;
    setIs3D: (v: boolean) => void;
    showVectors: boolean;
    setShowVectors: (v: boolean) => void;
  }
> = (props) => {
  const {
    damHeight,
    damBaseWidth,
    damCrestWidth,
    inclinationAngle,
    upstreamLevel,
    downstreamLevel = 0,
    force,
    y_cp,
    up,
    isAnalyzed,
    onCalculate,
    onReset,
    is3D,
    setIs3D,
    showVectors,
    setShowVectors,
  } = props;

  const SVG_W = 900;
  const SVG_H = 520;

  const ORIGIN_X = SVG_W * 0.52;
  const ORIGIN_Y = SVG_H * 0.82;

  // Levemente menor para reduzir excesso de fatias visíveis
  const CHANNEL_WIDTH = 32;

  const toWorldX = useCallback(
    (x: number) => x - damBaseWidth / 2,
    [damBaseWidth]
  );

  // Raio maior + curvatura mais suave = leitura mais monolítica
  const archRadius = useMemo(() => {
    return Math.max(CHANNEL_WIDTH * 2.2, damBaseWidth * 4.5);
  }, [damBaseWidth, CHANNEL_WIDTH]);

  const archOffsetFn = useMemo(() => {
    return (z: number) => {
      const rr = archRadius * archRadius;
      const zz = z * z;
      const baseCurve = archRadius - Math.sqrt(Math.max(0, rr - zz));
      return baseCurve * 1.08;
    };
  }, [archRadius]);

  const { worldGeometry, getDamXAtY, profile } = useMemo(() => {
    const { profile } = construirGeometria(
      damHeight,
      damBaseWidth,
      damCrestWidth,
      inclinationAngle
    );

    const getDamXAtY = (
      y: number,
      side: 'UPSTREAM' | 'DOWNSTREAM'
    ) => {
      return getDamXAtYGeneric(profile, y, side);
    };

    const maxH = Math.max(damHeight, upstreamLevel, downstreamLevel);
    const farLeft = getDamXAtY(0, 'UPSTREAM') - damHeight * 1.5;
    const farRight = getDamXAtY(0, 'DOWNSTREAM') + damHeight * 1.5;

    const geometry = [
      ...criarBaseTerra(maxH, farLeft, farRight, CHANNEL_WIDTH * 1.5, toWorldX),
      ...criarPrisma(
        profile,
        CHANNEL_WIDTH,
        '#9ca3af',
        1,
        '#6b7280',
        1,
        'DAM',
        archOffsetFn,
        0,
        'url(#concretePattern)',
        toWorldX,
        2,
        24,
        12,
        true
      ),
    ];

    if (upstreamLevel > 0) {
      geometry.push(
        ...caixaAgua3D(
          upstreamLevel,
          CHANNEL_WIDTH,
          getDamXAtY(0, 'UPSTREAM') - damHeight * 1.25,
          'UPSTREAM',
          getDamXAtY,
          toWorldX,
          archOffsetFn,
          'A',
          24
        )
      );
    }

    if (downstreamLevel > 0) {
      geometry.push(
        ...caixaAgua3D(
          downstreamLevel,
          CHANNEL_WIDTH,
          getDamXAtY(0, 'DOWNSTREAM') + damHeight * 1.25,
          'DOWNSTREAM',
          getDamXAtY,
          toWorldX,
          archOffsetFn,
          'B',
          24
        )
      );
    }

    return {
      worldGeometry: geometry,
      getDamXAtY,
      profile,
    };
  }, [
    damHeight,
    damBaseWidth,
    damCrestWidth,
    inclinationAngle,
    upstreamLevel,
    downstreamLevel,
    toWorldX,
    archOffsetFn,
  ]);

  const autoFitParams = useMemo(() => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    const zs = [-CHANNEL_WIDTH / 2, CHANNEL_WIDTH / 2];

    profile.forEach((p: { x: number; y: number }) => {
      zs.forEach((z) => {
        const wx = toWorldX(p.x);
        minX = Math.min(minX, wx);
        maxX = Math.max(maxX, wx);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
        minZ = Math.min(minZ, z);
        maxZ = Math.max(maxZ, z);
      });
    });

    return { minX, maxX, minY, maxY, minZ, maxZ };
  }, [profile, toWorldX]);

  const {
    renderedFaces,
    project,
    rotate,
    SCALE,
    handlers,
    resetView,
  } = useSceneEngine(
    is3D,
    worldGeometry,
    SVG_W,
    SVG_H,
    ORIGIN_X,
    ORIGIN_Y,
    autoFitParams
  );

  const vectors = useMemo(() => {
    if (!showVectors || !is3D || !isAnalyzed) return [];

    const vecs: SceneVector[] = [];

    const isInside = (p: { x: number; y: number }) =>
      p.x >= 10 && p.x <= SVG_W - 10 && p.y >= 10 && p.y <= SVG_H - 10;

    const pushArrow = (
      x: number,
      y: number,
      z: number,
      nx: number,
      ny: number,
      nz: number,
      magWorld: number,
      color: string,
      isResultant: boolean,
      val?: string
    ) => {
      const rotatedNormal = rotate({ x: nx, y: ny, z: nz });

      if (rotatedNormal.z < 0.08) return;

      const visibilityFactor = Math.max(0.45, rotatedNormal.z);

      let finalMag = magWorld;
      const pEnd = project({ x, y, z });
      let pStart = project({
        x: x + nx * finalMag,
        y: y + ny * finalMag,
        z: z + nz * finalMag,
      });

      if (!isInside(pStart)) {
        for (const f of [0.8, 0.6, 0.4, 0.25, 0.12]) {
          const testMag = magWorld * f;
          const testStart = project({
            x: x + nx * testMag,
            y: y + ny * testMag,
            z: z + nz * testMag,
          });

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
        val: val || '',
        opacity: (isResultant ? 1 : 0.82) * visibilityFactor,
        strokeWidth: isResultant ? 3.2 : 1.15,
      });
    };

    const localNormal = (
      y: number,
      side: 'UPSTREAM' | 'DOWNSTREAM'
    ) => {
      const dy = 0.05;
      const y1 = Math.max(0, y - dy);
      const y2 = Math.min(damHeight, y + dy);

      const x1 = getDamXAtY(y1, side);
      const x2 = getDamXAtY(y2, side);

      const dx = x2 - x1;
      const dY = y2 - y1;

      let nx = -dY;
      let ny = dx;
      let nz = 0;

      if (side === 'UPSTREAM') {
        if (nx > 0) {
          nx = -nx;
          ny = -ny;
        }
      } else {
        if (nx < 0) {
          nx = -nx;
          ny = -ny;
        }
      }

      const mag = Math.sqrt(nx * nx + ny * ny) || 1;

      return {
        nx: nx / mag,
        ny: ny / mag,
        nz,
      };
    };

    // Menor densidade para não poluir
    const Ny = 22;
    const Nz = 8;

    const zMin = -CHANNEL_WIDTH / 2;
    const zMax = CHANNEL_WIDTH / 2;

    if (isAnalyzed && upstreamLevel > 0) {
      for (let i = 0; i < Ny; i++) {
        const d = (i / Math.max(1, Ny - 1)) * upstreamLevel;
        const y = upstreamLevel - d;

        const { nx, ny, nz } = localNormal(y, 'UPSTREAM');
        const Lpx = 10 + (52 - 10) * (d / Math.max(1e-9, upstreamLevel));
        const Lw = Lpx / SCALE;

        for (let j = 0; j < Nz; j++) {
          const z = zMin + (j / Math.max(1, Nz - 1)) * (zMax - zMin);
          const base = getDamXAtY(y, 'UPSTREAM');
          const off = archOffsetFn(z);
          const x = toWorldX(base + off);

          pushArrow(x, y, z, nx, ny, nz, Lw, '#2563eb', false);
        }
      }
    }

    if (isAnalyzed && downstreamLevel > 0) {
      for (let i = 0; i < Ny; i++) {
        const d = (i / Math.max(1, Ny - 1)) * downstreamLevel;
        const y = downstreamLevel - d;

        const { nx, ny, nz } = localNormal(y, 'DOWNSTREAM');
        const Lpx = 10 + (52 - 10) * (d / Math.max(1e-9, downstreamLevel));
        const Lw = Lpx / SCALE;

        for (let j = 0; j < Nz; j++) {
          const z = zMin + (j / Math.max(1, Nz - 1)) * (zMax - zMin);
          const base = getDamXAtY(y, 'DOWNSTREAM');
          const off = archOffsetFn(z);
          const x = toWorldX(base + off);

          pushArrow(x, y, z, nx, ny, nz, Lw, '#3b82f6', false);
        }
      }
    }

    if (isAnalyzed && up && force !== 0) {
      const zCenter = 0;
      const { nx, ny, nz } = localNormal(y_cp, 'UPSTREAM');
      const base = getDamXAtY(y_cp, 'UPSTREAM');
      const off = archOffsetFn(zCenter);
      const x = toWorldX(base + off);

      pushArrow(x, y_cp, zCenter, nx, ny, nz, 110 / SCALE, '#2563eb', true, 'FR');
    }

    return vecs;
  }, [
    showVectors,
    is3D,
    upstreamLevel,
    downstreamLevel,
    isAnalyzed,
    force,
    y_cp,
    up,
    damHeight,
    getDamXAtY,
    toWorldX,
    project,
    rotate,
    SCALE,
    archOffsetFn,
    CHANNEL_WIDTH,
  ]);

  const originProj = project({ x: 0, y: 0, z: 0 });

  return (
    <SceneContainer
      is3D={is3D}
      setIs3D={setIs3D}
      showVectors={showVectors}
      setShowVectors={setShowVectors}
      isAnalyzed={isAnalyzed}
      onCalculate={onCalculate}
      onReset={onReset}
      resetView={resetView}
      handlers={handlers}
      renderedFaces={renderedFaces}
      vectors={vectors}
      SVG_W={SVG_W}
      SVG_H={SVG_H}
      ORIGIN_X={originProj.x}
      ORIGIN_Y={originProj.y}
    />
  );
};