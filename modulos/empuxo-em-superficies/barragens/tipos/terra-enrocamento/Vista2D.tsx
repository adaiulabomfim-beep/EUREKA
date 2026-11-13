import React, { useMemo } from 'react';
import { renderizarEstabilidade2D } from '../../visual/overlayEstabilidade';
import { RenderizadorBarragensProps } from '../../dominio/tipos';
import { construirGeometria } from './geometria';
import {
  getDamXAtYGeneric,
  criarPrisma,
  caixaAgua3D,
  criarAguaMontanteComLama,
  criarBaseTerra,
  gerarVetoresBarragem2D,
} from '../../visual/auxiliaresGeometriaCena';
import { useSceneEngine } from '../../visual/motorCena3D';
import { SceneContainer } from '../../visual/ContainerCena';

export const Vista2D: React.FC<RenderizadorBarragensProps & { is3D: boolean, setIs3D: any, showVectors: boolean, setShowVectors: any }> = (props) => {
  const {
    damHeight, damBaseWidth, damCrestWidth, inclinationAngle,
    upstreamLevel, downstreamLevel = 0,
    hasMudLayer = false, mudHeight = 0, mudDensity = 1500,
    force, forceH, forceV, y_cp, up, isAnalyzed, onCalculate, onReset,
    is3D, setIs3D, showVectors, setShowVectors
  } = props;

  const SVG_W = 900;
  const SVG_H = 520;
  const ORIGIN_X = SVG_W * 0.52;
  const ORIGIN_Y = SVG_H * 0.82;
  const CHANNEL_WIDTH = 40;

  const { worldGeometry, getDamXAtY, profile, actualBaseWidth, toWorldX } = useMemo(() => {
    const { profile, actualBaseWidth } = construirGeometria(damHeight, damBaseWidth, damCrestWidth, inclinationAngle);
    const toWorldX = (x: number) => x - actualBaseWidth / 2;

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
        '#AF9981',
        1,
        '#6F4F28',
        1.2,
        'DAM',
        undefined,
        0,
        'url(#earthPattern)',
        toWorldX
      ),
    ];

    if (upstreamLevel > 0) {
      worldGeometry.push(
        ...criarAguaMontanteComLama({
          upstreamLevel,
          hasMudLayer,
          mudHeight,
          channelWidth: CHANNEL_WIDTH,
          farLeft: getDamXAtY(0, 'UPSTREAM') - damHeight * 1.5,
          getDamXAtY,
          toWorldX,
        })
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

    return { worldGeometry, getDamXAtY, profile, actualBaseWidth, toWorldX };
  }, [damHeight, damBaseWidth, damCrestWidth, inclinationAngle, upstreamLevel, downstreamLevel, hasMudLayer, mudHeight]);

  const autoFitParams = useMemo(() => {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    const zs = [-CHANNEL_WIDTH / 2, CHANNEL_WIDTH / 2];
    profile.forEach((p: any) => {
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
    false, worldGeometry, SVG_W, SVG_H, ORIGIN_X, ORIGIN_Y, autoFitParams
  );

  const vectors = useMemo(
    () =>
      gerarVetoresBarragem2D({
        showVectors,
        isAnalyzed,
        upstreamLevel,
        downstreamLevel,
        damHeight,
        force,
        forceH,
        forceV,
        y_cp,
        up,
        getDamXAtY,
        toWorldX,
        project,
        SCALE,
        SVG_W,
        SVG_H,
        distributionOpacity: 0.4,
        hasMudLayer,
        mudHeight,
        mudDensity,
      }),
    [showVectors, isAnalyzed, upstreamLevel, downstreamLevel, damHeight, force, forceH, forceV, y_cp, up, getDamXAtY, toWorldX, project, SCALE, hasMudLayer, mudHeight, mudDensity]
  );

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
          <rect x={xLeft} y={yTop} width={xRight - xLeft} height={rippleHeight} fill="url(#ripplePattern)" pointerEvents="none" />
          <line x1={xLeft} y1={yTop} x2={xRight} y2={yTop} stroke="rgba(255,255,255,0.5)" strokeWidth="1" pointerEvents="none" />
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
          <rect x={xLeft} y={yTop} width={xRight - xLeft} height={rippleHeight} fill="url(#ripplePattern)" pointerEvents="none" />
          <line x1={xLeft} y1={yTop} x2={xRight} y2={yTop} stroke="rgba(255,255,255,0.5)" strokeWidth="1" pointerEvents="none" />
        </g>
      );
    }

    const drawLevelSymbol = (
      key: string,
      xWorld: number,
      yWorld: number,
      text: string,
      flipX: boolean = false,
      screenX?: number
    ) => {
      const p0 = project({ x: xWorld, y: yWorld, z: 0 });
      const p = screenX !== undefined ? { ...p0, x: screenX } : p0;
      const dir = flipX ? -1 : 1;
      return (
        <g key={key} stroke="#475569" strokeWidth="1.2" opacity="0.9">
          <polygon points={`${p.x},${p.y} ${p.x - 7},${p.y - 14} ${p.x},${p.y - 14}`} fill="none" />
          <polygon points={`${p.x},${p.y} ${p.x},${p.y - 14} ${p.x + 7},${p.y - 14}`} fill="#475569" />
          <polyline points={`${p.x},${p.y - 14} ${p.x},${p.y - 30} ${p.x + dir * 56},${p.y - 30}`} fill="none" />
          <text x={p.x + dir * 28} y={p.y - 34} textAnchor="middle" dominantBaseline="alphabetic" fill="#334155" fontSize="11" fontWeight="bold" stroke="none">
            {text}
          </text>
        </g>
      );
    };

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

      const cx = (p1Off.x + p2Off.x) / 2 + textOffsetPx.x;
      const cy = (p1Off.y + p2Off.y) / 2 + textOffsetPx.y;

      const textW = text.length * 6.5 + 8;
      const textH = 16;

      return (
        <g key={key} stroke="#64748b" strokeWidth="1.6" fill="none" opacity="0.9">
          <line x1={p1.x} y1={p1.y} x2={p1Off.x} y2={p1Off.y} strokeDasharray="3 3" opacity="0.45" />
          <line x1={p2.x} y1={p2.y} x2={p2Off.x} y2={p2Off.y} strokeDasharray="3 3" opacity="0.45" />
          <line x1={p1Off.x} y1={p1Off.y} x2={p2Off.x} y2={p2Off.y} markerStart="url(#arrow)" markerEnd="url(#arrow)" />
          <rect x={cx - textW / 2} y={cy - textH / 2} width={textW} height={textH} fill="white" rx="3" stroke="none" />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="#475569" fontSize="12" fontWeight="700" stroke="none">
            {text}
          </text>
        </g>
      );
    };

    dims.push(
      drawDim(
        'damHeight',
        { x: toWorldX(getDamXAtY(0, 'DOWNSTREAM')), y: 0 },
        { x: toWorldX(getDamXAtY(0, 'DOWNSTREAM')), y: damHeight },
        `${damHeight.toFixed(1)}m`,
        { x: 60, y: 0 },
        { x: 30, y: 0 }
      )
    );

    dims.push(
      drawDim(
        'damBase',
        { x: toWorldX(getDamXAtY(0, 'UPSTREAM')), y: 0 },
        { x: toWorldX(getDamXAtY(0, 'DOWNSTREAM')), y: 0 },
        `${actualBaseWidth.toFixed(1)}m`,
        { x: 0, y: 40 },
        { x: 0, y: 15 }
      )
    );

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

    if (upstreamLevel > 0) {
      const xBase = toWorldX(getDamXAtY(upstreamLevel, 'UPSTREAM')) - 1;
      dims.push(drawLevelSymbol('upstreamLevel', xBase, upstreamLevel, `NA=${upstreamLevel.toFixed(2)}`, true, 82));
    }

    if (downstreamLevel > 0) {
      const xBase = toWorldX(getDamXAtY(downstreamLevel, 'DOWNSTREAM')) + 1;
      dims.push(drawLevelSymbol('downstreamLevel', xBase, downstreamLevel, `NA=${downstreamLevel.toFixed(2)}`, true, SVG_W - 28));
    }

    if (isAnalyzed && force !== 0 && y_cp > 0) {
      const xBase = toWorldX(getDamXAtY(0, 'UPSTREAM'));
      dims.push(
        drawDim(
          'yp',
          { x: xBase, y: 0 },
          { x: xBase, y: y_cp },
          `Yp=${y_cp.toFixed(2)}m`,
          { x: -120, y: 0 },
          { x: -40, y: 0 }
        )
      );
    }

    const actualAngleRad = (inclinationAngle * Math.PI) / 180;
    const actualAngleDeg = inclinationAngle;

    if (actualAngleDeg > 0 && actualAngleDeg < 90) {
      const pToeWorld = { x: toWorldX(getDamXAtY(0, 'UPSTREAM')), y: 0 };
      const rWorld = Math.min(damHeight, actualBaseWidth) * 0.15;
      const r = rWorld * SCALE;

      const pHorizWorld = { x: pToeWorld.x + rWorld, y: 0 };
      const pHoriz = project({ ...pHorizWorld, z: 0 });

      const pFaceWorld = { x: pToeWorld.x + rWorld * Math.cos(actualAngleRad), y: rWorld * Math.sin(actualAngleRad) };
      const pFace = project({ ...pFaceWorld, z: 0 });

      const pathData = `M ${pHoriz.x} ${pHoriz.y} A ${r} ${r} 0 0 0 ${pFace.x} ${pFace.y}`;

      const textRad = actualAngleRad / 2;
      const pTextWorld = { x: pToeWorld.x + (rWorld * 1.4) * Math.cos(textRad), y: (rWorld * 1.4) * Math.sin(textRad) };
      const pText = project({ ...pTextWorld, z: 0 });

      dims.push(
        <g key="angle" stroke="#334155" strokeWidth="1.5" fill="none" opacity="1">
          <path d={pathData} />
          <text x={pText.x} y={pText.y} textAnchor="middle" dominantBaseline="middle" fill="#1e293b" fontSize="12" fontWeight="bold" stroke="none">
            {actualAngleDeg.toFixed(0)}°
          </text>
        </g>
      );
    }

    dims.push(
      ...renderizarEstabilidade2D({
        stability: props.stability,
        isAnalyzed: props.isAnalyzed,
        unitSystem: props.unitSystem,
        gravity: props.gravity,
        project,
        xToeWorld: toWorldX(getDamXAtY(0, 'UPSTREAM')),
        svgW: SVG_W,
        showVectors: props.showVectors,
      })
    );

    return dims;
  };

  return (
    <SceneContainer
      is3D={is3D} setIs3D={setIs3D}
      showVectors={showVectors} setShowVectors={setShowVectors}
      isAnalyzed={isAnalyzed} onCalculate={onCalculate} onReset={onReset}
      resetView={resetView} handlers={handlers}
      renderedFaces={renderedFaces} vectors={vectors}
      SVG_W={SVG_W} SVG_H={SVG_H} ORIGIN_X={originProj.x} ORIGIN_Y={originProj.y} pan={pan}
    >
      {renderDimensions()}
    </SceneContainer>
  );
};
