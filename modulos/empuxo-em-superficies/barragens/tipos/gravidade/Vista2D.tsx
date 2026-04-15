import React, { useMemo, useCallback } from 'react';
import { RenderizadorBarragensProps } from '../../dominio/tipos';
import { construirGeometria } from './geometria';
import { calcularHidrostatica, calcularEstabilidade } from './calculos';
import {
  getDamXAtYGeneric,
  criarPrisma,
  caixaAgua3D,
  criarBaseTerra,
} from '../../visual/auxiliaresGeometriaCena';
import { useSceneEngine } from '../../visual/motorCena3D';
import { SceneContainer as ContainerCena } from '../../visual/ContainerCena';

type GravityDam2DViewProps = RenderizadorBarragensProps & {
  is3D: boolean;
  setIs3D: React.Dispatch<React.SetStateAction<boolean>>;
  showVectors: boolean;
  setShowVectors: React.Dispatch<React.SetStateAction<boolean>>;
};

export const Vista2D: React.FC<GravityDam2DViewProps> = (props) => {
  const {
    damHeight,
    damBaseWidth,
    damCrestWidth,
    inclinationAngle,
    upstreamLevel,
    downstreamLevel = 0,
    force,
    s_cp,
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
  const CHANNEL_WIDTH = 40;

  const toWorldX = useCallback(
    (x: number) => x - damBaseWidth / 2,
    [damBaseWidth]
  );

  const { worldGeometry, getDamXAtY, profile } = useMemo(() => {
    const { profile } = construirGeometria(
      damHeight,
      damBaseWidth,
      damCrestWidth,
      inclinationAngle
    );

    const getDamXAtY = (y: number, side: 'UPSTREAM' | 'DOWNSTREAM') => {
      return getDamXAtYGeneric(profile, y, side);
    };

    const maxH = Math.max(damHeight, upstreamLevel, downstreamLevel);
    const farLeft = getDamXAtY(0, 'UPSTREAM') - damHeight * 1.5;
    const farRight = getDamXAtY(0, 'DOWNSTREAM') + damHeight * 1.5;

    const worldGeometry = [
      ...criarBaseTerra(maxH, farLeft, farRight, CHANNEL_WIDTH * 1.5, toWorldX),
      ...criarPrisma(
        profile,
        CHANNEL_WIDTH,
        '#9ca3af',
        1,
        '#6b7280',
        1.2,
        'DAM',
        undefined,
        0,
        'url(#concretePattern)',
        toWorldX
      ),
    ];

    if (upstreamLevel > 0) {
      worldGeometry.push(
        ...caixaAgua3D(
          upstreamLevel,
          CHANNEL_WIDTH,
          getDamXAtY(0, 'UPSTREAM') - damHeight * 1.5,
          'UPSTREAM',
          getDamXAtY,
          toWorldX,
          undefined,
          'A'
        )
      );
    }

    if (downstreamLevel > 0) {
      worldGeometry.push(
        ...caixaAgua3D(
          downstreamLevel,
          CHANNEL_WIDTH,
          getDamXAtY(0, 'DOWNSTREAM') + damHeight * 1.5,
          'DOWNSTREAM',
          getDamXAtY,
          toWorldX,
          undefined,
          'B'
        )
      );
    }

    calcularHidrostatica(
      damHeight,
      inclinationAngle,
      upstreamLevel,
      downstreamLevel,
      1000 * 9.81
    );

    calcularEstabilidade(
      damHeight,
      damBaseWidth,
      damCrestWidth,
      upstreamLevel,
      downstreamLevel,
      force,
      y_cp
    );

    return { worldGeometry, getDamXAtY, profile };
  }, [
    damHeight,
    damBaseWidth,
    damCrestWidth,
    inclinationAngle,
    upstreamLevel,
    downstreamLevel,
    toWorldX,
    force,
    y_cp,
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

  const { renderedFaces, project, SCALE, pan, handlers, resetView } = useSceneEngine(
    false,
    worldGeometry,
    SVG_W,
    SVG_H,
    ORIGIN_X,
    ORIGIN_Y,
    autoFitParams
  );

  const vectors = useMemo(() => {
    if (!showVectors || !isAnalyzed) return [];

    const vecs: Array<{
      start: { x: number; y: number };
      end: { x: number; y: number };
      color: string;
      isResultant: boolean;
      val: string;
      opacity: number;
      strokeWidth: number;
    }> = [];

    const isInside = (p: { x: number; y: number }) =>
      p.x >= 10 && p.x <= SVG_W - 10 && p.y >= 10 && p.y <= SVG_H - 10;

    const pushArrow = (
      x: number,
      y: number,
      z: number,
      nx: number,
      ny: number,
      magWorld: number,
      color: string,
      isResultant: boolean,
      val?: string
    ) => {
      let finalMag = magWorld;
      const pEnd = project({ x, y, z });
      let pStart = project({ x: x + nx * finalMag, y: y + ny * finalMag, z });

      if (!isInside(pStart)) {
        for (const f of [0.8, 0.6, 0.4, 0.2, 0.1, 0.05]) {
          const testMag = magWorld * f;
          const testStart = project({
            x: x + nx * testMag,
            y: y + ny * testMag,
            z,
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
        opacity: isResultant ? 1 : 0.85,
        strokeWidth: isResultant ? 4 : 1.5,
      });
    };

    const localNormal = (y: number, side: 'UPSTREAM' | 'DOWNSTREAM') => {
      const dy = 0.05;
      const y1 = Math.max(0, y - dy);
      const y2 = Math.min(damHeight, y + dy);
      const x1 = getDamXAtY(y1, side);
      const x2 = getDamXAtY(y2, side);
      const dx = x2 - x1;
      const dY = y2 - y1;

      let nx = -dY;
      let ny = dx;

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
      return { nx: nx / mag, ny: ny / mag };
    };

    const Ny = 40;

    if (upstreamLevel > 0) {
      for (let i = 0; i < Ny; i++) {
        const d = (i / (Ny - 1)) * upstreamLevel;
        const y = upstreamLevel - d;
        const { nx, ny } = localNormal(y, 'UPSTREAM');
        const Lpx = 10 + (72 - 10) * (d / Math.max(1e-9, upstreamLevel));
        const Lw = Lpx / SCALE;

        const base = getDamXAtY(y, 'UPSTREAM');
        const x = toWorldX(base);
        pushArrow(x, y, 0, nx, ny, Lw, '#2563eb', false);
      }
    }

    if (downstreamLevel > 0) {
      for (let i = 0; i < Ny; i++) {
        const d = (i / (Ny - 1)) * downstreamLevel;
        const y = downstreamLevel - d;
        const { nx, ny } = localNormal(y, 'DOWNSTREAM');
        const Lpx = 10 + (72 - 10) * (d / Math.max(1e-9, downstreamLevel));
        const Lw = Lpx / SCALE;

        const base = getDamXAtY(y, 'DOWNSTREAM');
        const x = toWorldX(base);
        pushArrow(x, y, 0, nx, ny, Lw, '#3b82f6', false);
      }
    }

    if (up && force !== 0 && y_cp > 0) {
      const { nx, ny } = localNormal(y_cp, 'UPSTREAM');
      const base = getDamXAtY(y_cp, 'UPSTREAM');
      const x = toWorldX(base);
      pushArrow(x, y_cp, 0, nx, ny, 120 / SCALE, '#2563eb', true, 'FR');
    }

    return vecs;
  }, [
    showVectors,
    isAnalyzed,
    upstreamLevel,
    downstreamLevel,
    force,
    y_cp,
    up,
    damHeight,
    getDamXAtY,
    toWorldX,
    project,
    SCALE,
  ]);

  const originProj = project({ x: 0, y: 0, z: 0 });

  const renderDimensions = () => {
    if (is3D) return null;

    const dims: React.ReactNode[] = [];

    if (upstreamLevel > 0) {
      const farX = getDamXAtY(0, 'UPSTREAM') - damHeight * 1.5;
      const xLeft = project({ x: toWorldX(farX), y: upstreamLevel, z: 0 }).x;
      const xRight = project({ x: toWorldX(getDamXAtY(upstreamLevel, 'UPSTREAM')), y: upstreamLevel, z: 0 }).x;
      const yTop = project({ x: toWorldX(farX), y: upstreamLevel, z: 0 }).y;
      const rippleHeight = Math.min(30, upstreamLevel * SCALE);
      
      dims.push(
        <g key="ripple-up">
          <rect
            x={xLeft}
            y={yTop}
            width={xRight - xLeft}
            height={rippleHeight}
            fill="url(#ripplePattern)"
            pointerEvents="none"
          />
          <line
            x1={xLeft}
            y1={yTop}
            x2={xRight}
            y2={yTop}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1"
            pointerEvents="none"
          />
        </g>
      );
    }

    if (downstreamLevel > 0) {
      const farX = getDamXAtY(0, 'DOWNSTREAM') + damHeight * 1.5;
      const xLeft = project({ x: toWorldX(getDamXAtY(downstreamLevel, 'DOWNSTREAM')), y: downstreamLevel, z: 0 }).x;
      const xRight = project({ x: toWorldX(farX), y: downstreamLevel, z: 0 }).x;
      const yTop = project({ x: toWorldX(farX), y: downstreamLevel, z: 0 }).y;
      const rippleHeight = Math.min(30, downstreamLevel * SCALE);
      
      dims.push(
        <g key="ripple-down">
          <rect
            x={xLeft}
            y={yTop}
            width={xRight - xLeft}
            height={rippleHeight}
            fill="url(#ripplePattern)"
            pointerEvents="none"
          />
          <line
            x1={xLeft}
            y1={yTop}
            x2={xRight}
            y2={yTop}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1"
            pointerEvents="none"
          />
        </g>
      );
    }

    const drawDim = (
      key: string,
      p1World: { x: number; y: number },
      p2World: { x: number; y: number },
      text: string,
      offsetPx: { x: number; y: number },
      textOffsetPx: { x: number; y: number } = { x: 0, y: 0 }
    ) => {
      const p1 = project({ x: p1World.x, y: p1World.y, z: 0 });
      const p2 = project({ x: p2World.x, y: p2World.y, z: 0 });
      const p1Off = { x: p1.x + offsetPx.x, y: p1.y + offsetPx.y };
      const p2Off = { x: p2.x + offsetPx.x, y: p2.y + offsetPx.y };

      return (
        <g key={key} stroke="#64748b" strokeWidth="1.6" fill="none" opacity="0.9">
          <line
            x1={p1.x}
            y1={p1.y}
            x2={p1Off.x}
            y2={p1Off.y}
            strokeDasharray="3 3"
            opacity="0.45"
          />
          <line
            x1={p2.x}
            y1={p2.y}
            x2={p2Off.x}
            y2={p2Off.y}
            strokeDasharray="3 3"
            opacity="0.45"
          />
          <line
            x1={p1Off.x}
            y1={p1Off.y}
            x2={p2Off.x}
            y2={p2Off.y}
            markerStart="url(#arrow)"
            markerEnd="url(#arrow)"
          />
          <text
            x={(p1Off.x + p2Off.x) / 2 + textOffsetPx.x}
            y={(p1Off.y + p2Off.y) / 2 + textOffsetPx.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#475569"
            fontSize="12"
            fontWeight="700"
            stroke="none"
          >
            {text}
          </text>
        </g>
      );
    };

    dims.push(
      drawDim(
        'damHeight',
        { x: toWorldX(getDamXAtY(0, 'DOWNSTREAM')), y: 0 },
        { x: toWorldX(getDamXAtY(damHeight, 'DOWNSTREAM')), y: damHeight },
        `${damHeight.toFixed(1)}m`,
        { x: 58, y: 0 },
        { x: 28, y: 0 }
      )
    );

    dims.push(
      drawDim(
        'damBase',
        { x: toWorldX(getDamXAtY(0, 'UPSTREAM')), y: 0 },
        { x: toWorldX(getDamXAtY(0, 'DOWNSTREAM')), y: 0 },
        `${damBaseWidth.toFixed(1)}m`,
        { x: 0, y: 38 },
        { x: 0, y: 14 }
      )
    );

    if (damCrestWidth > 0) {
      dims.push(
        drawDim(
          'damCrest',
          { x: toWorldX(getDamXAtY(damHeight, 'UPSTREAM')), y: damHeight },
          { x: toWorldX(getDamXAtY(damHeight, 'DOWNSTREAM')), y: damHeight },
          `${damCrestWidth.toFixed(1)}m`,
          { x: 0, y: -38 },
          { x: 0, y: -14 }
        )
      );
    }

    if (upstreamLevel > 0) {
      const xBase = toWorldX(getDamXAtY(0, 'UPSTREAM'));
      dims.push(
        drawDim(
          'upstreamLevel',
          { x: xBase, y: 0 },
          { x: xBase, y: upstreamLevel },
          `NA=${upstreamLevel.toFixed(1)}m`,
          { x: -58, y: 0 },
          { x: -34, y: 0 }
        )
      );
    }

    if (downstreamLevel > 0) {
      const xBase = toWorldX(getDamXAtY(0, 'DOWNSTREAM'));
      dims.push(
        drawDim(
          'downstreamLevel',
          { x: xBase, y: 0 },
          { x: xBase, y: downstreamLevel },
          `NA=${downstreamLevel.toFixed(1)}m`,
          { x: 58, y: 0 },
          { x: 34, y: 0 }
        )
      );
    }

    if (isAnalyzed && force !== 0 && y_cp > 0) {
      const xBase = toWorldX(getDamXAtY(0, 'UPSTREAM'));
      dims.push(
        drawDim(
          'yp',
          { x: xBase, y: 0 },
          { x: xBase, y: y_cp },
          `Yp=${y_cp.toFixed(2)}m`,
          { x: -118, y: 0 },
          { x: -40, y: 0 }
        )
      );
    }

    return dims;
  };

  return (
    <ContainerCena
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
      pan={pan}
    >
      {renderDimensions()}
    </ContainerCena>
  );
};