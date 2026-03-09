import React, { useMemo, useCallback } from 'react';
import { DamRendererProps } from '../../../core/interfaces/DamRendererProps';
import { useGravityDamSimulation } from '../hooks/useGravityDamSimulation';
import { useSceneEngine } from '../../../core/shared/useSceneEngine';
import { SceneContainer } from '../../../core/components/SceneContainer';
import { face, prism, waterBox3D } from '../../../core/shared/geometryUtils';

type GravityDam2DViewProps = DamRendererProps & {
  is3D: boolean;
  setIs3D: React.Dispatch<React.SetStateAction<boolean>>;
  showVectors: boolean;
  setShowVectors: React.Dispatch<React.SetStateAction<boolean>>;
};

export const GravityDam2DView: React.FC<GravityDam2DViewProps> = (props) => {
  const {
    damHeight,
    damBaseWidth,
    damCrestWidth,
    inclinationAngle,
    upstreamLevel,
    downstreamLevel = 0,
    force,
    s_cp,
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

  const { worldGeometry, getDamXAtY, profile, hydrostatics, stability } = useGravityDamSimulation(
    {
      damHeight,
      damBaseWidth,
      damCrestWidth,
      inclinationAngle,
      upstreamLevel,
      downstreamLevel,
      face,
      prism,
      waterBox3D,
      toWorldX,
      CHANNEL_WIDTH,
    },
    false
  );

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

  const { renderedFaces, project, SCALE, handlers, resetView } = useSceneEngine(
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
      let pStart = project({ x: x - nx * finalMag, y: y - ny * finalMag, z });

      if (!isInside(pStart)) {
        for (const f of [0.8, 0.6, 0.4, 0.2, 0.1, 0.05]) {
          const testMag = magWorld * f;
          const testStart = project({
            x: x - nx * testMag,
            y: y - ny * testMag,
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
        if (nx < 0) {
          nx = -nx;
          ny = -ny;
        }
      } else {
        if (nx > 0) {
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

        const z = 0;
        const base = getDamXAtY(y, 'UPSTREAM');
        const x = toWorldX(base);
        pushArrow(x, y, z, nx, ny, Lw, '#1e40af', false);
      }
    }

    if (downstreamLevel > 0) {
      for (let i = 0; i < Ny; i++) {
        const d = (i / (Ny - 1)) * downstreamLevel;
        const y = downstreamLevel - d;
        const { nx, ny } = localNormal(y, 'DOWNSTREAM');
        const Lpx = 10 + (72 - 10) * (d / Math.max(1e-9, downstreamLevel));
        const Lw = Lpx / SCALE;

        const z = 0;
        const base = getDamXAtY(y, 'DOWNSTREAM');
        const x = toWorldX(base);
        pushArrow(x, y, z, nx, ny, Lw, '#3b82f6', false);
      }
    }

    if (up && force !== 0) {
      const zCenter = 0;
      const { nx, ny } = localNormal(props.y_cp, 'UPSTREAM');
      const base = getDamXAtY(props.y_cp, 'UPSTREAM');
      const x = toWorldX(base);
      pushArrow(x, props.y_cp, zCenter, nx, ny, 120 / SCALE, '#1e40af', true, 'FR');
    }

    return vecs;
  }, [
    showVectors,
    isAnalyzed,
    upstreamLevel,
    downstreamLevel,
    force,
    props.y_cp,
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

    const dims = [];

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
        <g key={key} stroke="#475569" strokeWidth="1.5" fill="none" opacity="0.8">
          <line x1={p1.x} y1={p1.y} x2={p1Off.x} y2={p1Off.y} strokeDasharray="3 3" opacity="0.5" />
          <line x1={p2.x} y1={p2.y} x2={p2Off.x} y2={p2Off.y} strokeDasharray="3 3" opacity="0.5" />
          
          <line 
            x1={p1Off.x} y1={p1Off.y} 
            x2={p2Off.x} y2={p2Off.y} 
            markerStart="url(#arrow)" 
            markerEnd="url(#arrow)" 
          />
          
          <text
            x={(p1Off.x + p2Off.x) / 2 + textOffsetPx.x}
            y={(p1Off.y + p2Off.y) / 2 + textOffsetPx.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#334155"
            fontSize="12"
            fontWeight="bold"
            stroke="none"
          >
            {text}
          </text>
        </g>
      );
    };

    // Altura da Barragem
    dims.push(
      drawDim(
        'damHeight',
        { x: toWorldX(getDamXAtY(0, 'DOWNSTREAM')), y: 0 },
        { x: toWorldX(getDamXAtY(damHeight, 'DOWNSTREAM')), y: damHeight },
        `${damHeight.toFixed(1)}m`,
        { x: 60, y: 0 },
        { x: 30, y: 0 }
      )
    );

    // Largura da Base
    dims.push(
      drawDim(
        'damBase',
        { x: toWorldX(getDamXAtY(0, 'UPSTREAM')), y: 0 },
        { x: toWorldX(getDamXAtY(0, 'DOWNSTREAM')), y: 0 },
        `${damBaseWidth.toFixed(1)}m`,
        { x: 0, y: 40 },
        { x: 0, y: 15 }
      )
    );

    // Largura da Crista
    if (damCrestWidth > 0) {
      dims.push(
        drawDim(
          'damCrest',
          { x: toWorldX(getDamXAtY(damHeight, 'UPSTREAM')), y: damHeight },
          { x: toWorldX(getDamXAtY(damHeight, 'DOWNSTREAM')), y: damHeight },
          `${damCrestWidth.toFixed(1)}m`,
          { x: 0, y: -40 },
          { x: 0, y: -15 }
        )
      );
    }

    // Nível de Água a Montante
    if (upstreamLevel > 0) {
      const xBase = toWorldX(getDamXAtY(0, 'UPSTREAM'));
      dims.push(
        drawDim(
          'upstreamLevel',
          { x: xBase, y: 0 },
          { x: xBase, y: upstreamLevel },
          `NA=${upstreamLevel.toFixed(1)}m`,
          { x: -60, y: 0 },
          { x: -35, y: 0 }
        )
      );
    }

    // Nível de Água a Jusante
    if (downstreamLevel > 0) {
      const xBase = toWorldX(getDamXAtY(0, 'DOWNSTREAM'));
      dims.push(
        drawDim(
          'downstreamLevel',
          { x: xBase, y: 0 },
          { x: xBase, y: downstreamLevel },
          `NA=${downstreamLevel.toFixed(1)}m`,
          { x: 60, y: 0 },
          { x: 35, y: 0 }
        )
      );
    }

    // Yp (Ponto de Aplicação)
    if (isAnalyzed && force !== 0 && props.y_cp > 0) {
      const xBase = toWorldX(getDamXAtY(0, 'UPSTREAM'));
      dims.push(
        drawDim(
          'yp',
          { x: xBase, y: 0 },
          { x: xBase, y: props.y_cp },
          `Yp=${props.y_cp.toFixed(2)}m`,
          { x: -120, y: 0 },
          { x: -40, y: 0 }
        )
      );
    }

    return dims;
  };

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
    >
      {renderDimensions()}
    </SceneContainer>
  );
};