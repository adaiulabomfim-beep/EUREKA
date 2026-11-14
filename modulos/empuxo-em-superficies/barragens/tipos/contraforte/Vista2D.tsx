import React, { useMemo, useState } from 'react';
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
import { calcularEscala2D, useSceneEngine } from '../../visual/motorCena3D';
import { SceneContainer } from '../../visual/ContainerCena';

export const Vista2D: React.FC<RenderizadorBarragensProps & { is3D: boolean, setIs3D: any, showVectors: boolean, setShowVectors: any }> = (props) => {
  const {
    damHeight, damBaseWidth, damCrestWidth, inclinationAngle, buttressAngle,
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

  const [visibleXBounds, setVisibleXBounds] = useState<{ leftScreenX: number; rightScreenX: number }>({
    leftScreenX: -800,
    rightScreenX: 1800,
  });

  const { wallProfile, buttressProfile2D, profile, actualBaseWidth, toWorldX, getDamXAtY } = useMemo(() => {
    const { wallProfile, buttressProfile2D, actualBaseWidth } = construirGeometria(damHeight, damBaseWidth, damCrestWidth, inclinationAngle, buttressAngle);
    const profile = wallProfile;
    const toWorldX = (x: number) => x - actualBaseWidth / 2;
    const getDamXAtY = (y: number, side: 'UPSTREAM' | 'DOWNSTREAM') => {
      return getDamXAtYGeneric(wallProfile, y, side);
    };
    return { wallProfile, buttressProfile2D, profile, actualBaseWidth, toWorldX, getDamXAtY };
  }, [damHeight, damBaseWidth, damCrestWidth, inclinationAngle, buttressAngle]);

  const autoFitParams = useMemo(() => {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    const zs = [-CHANNEL_WIDTH / 2, CHANNEL_WIDTH / 2];
    const fullProfile = [...profile, { x: actualBaseWidth, y: 0 }];
    fullProfile.forEach((p: any) => {
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
  }, [profile, actualBaseWidth, toWorldX]);

  const { farLeft, farRight } = useMemo(() => {
    const scale2D = calcularEscala2D(autoFitParams, SVG_W, SVG_H);
    const worldLeftEdge = (visibleXBounds.leftScreenX - ORIGIN_X) / scale2D;
    const worldRightEdge = (visibleXBounds.rightScreenX - ORIGIN_X) / scale2D;
    const damUpstreamToe = getDamXAtY(0, 'UPSTREAM');
    const damDownstreamToe = Math.max(getDamXAtY(0, 'DOWNSTREAM'), actualBaseWidth);
    return {
      farLeft: Math.min(damUpstreamToe - damHeight * 1.5, worldLeftEdge + actualBaseWidth / 2),
      farRight: Math.max(damDownstreamToe + damHeight * 1.5, worldRightEdge + actualBaseWidth / 2),
    };
  }, [autoFitParams, visibleXBounds.leftScreenX, visibleXBounds.rightScreenX, ORIGIN_X, getDamXAtY, actualBaseWidth, damHeight]);

  const worldGeometry = useMemo(() => {
    const maxH = Math.max(damHeight, upstreamLevel, downstreamLevel);

    const faces = [
      ...criarBaseTerra(maxH, farLeft, farRight, CHANNEL_WIDTH * 1.5, toWorldX),
      ...criarPrisma(
        wallProfile,
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
      ...criarPrisma(
        buttressProfile2D,
        CHANNEL_WIDTH,
        '#9ca3af',
        0.8,
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
      faces.push(
        ...criarAguaMontanteComLama({
          upstreamLevel,
          hasMudLayer,
          mudHeight,
          channelWidth: CHANNEL_WIDTH,
          farLeft,
          getDamXAtY,
          toWorldX,
        })
      );
    }

    if (downstreamLevel > 0) {
      faces.push(
        ...caixaAgua3D(
          downstreamLevel,
          CHANNEL_WIDTH,
          farRight,
          'DOWNSTREAM',
          getDamXAtY,
          toWorldX,
          undefined,
          'B'
        )
      );
    }

    return faces;
  }, [damHeight, upstreamLevel, downstreamLevel, hasMudLayer, mudHeight, farLeft, farRight, wallProfile, buttressProfile2D, getDamXAtY, toWorldX]);

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
      const xLeft = project({ x: toWorldX(farLeft), y: upstreamLevel, z: 0 }).x;
      const xRight = project({ x: toWorldX(getDamXAtY(upstreamLevel, 'UPSTREAM')), y: upstreamLevel, z: 0 }).x;
      const yTop = project({ x: toWorldX(farLeft), y: upstreamLevel, z: 0 }).y;
      const rippleHeight = Math.min(30, upstreamLevel * SCALE);

      dims.push(
        <g key="ripple-up">
          <rect x={xLeft} y={yTop} width={xRight - xLeft} height={rippleHeight} fill="url(#ripplePattern)" pointerEvents="none" />
          <line x1={xLeft} y1={yTop} x2={xRight} y2={yTop} stroke="rgba(255,255,255,0.5)" strokeWidth="1" pointerEvents="none" />
        </g>
      );
    }

    if (downstreamLevel > 0) {
      const xLeft = project({ x: toWorldX(getDamXAtY(downstreamLevel, 'DOWNSTREAM')), y: downstreamLevel, z: 0 }).x;
      const xRight = project({ x: toWorldX(farRight), y: downstreamLevel, z: 0 }).x;
      const yTop = project({ x: toWorldX(farRight), y: downstreamLevel, z: 0 }).y;
      const rippleHeight = Math.min(30, downstreamLevel * SCALE);

      dims.push(
        <g key="ripple-down">
          <rect x={xLeft} y={yTop} width={xRight - xLeft} height={rippleHeight} fill="url(#ripplePattern)" pointerEvents="none" />
          <line x1={xLeft} y1={yTop} x2={xRight} y2={yTop} stroke="rgba(255,255,255,0.5)" strokeWidth="1" pointerEvents="none" />
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

    dims.push(
      drawDim(
        'damHeight',
        { x: toWorldX(actualBaseWidth), y: 0 },
        { x: toWorldX(actualBaseWidth), y: damHeight },
        `${damHeight.toFixed(1)}m`,
        { x: 60, y: 0 },
        { x: 30, y: 0 }
      )
    );

    dims.push(
      drawDim(
        'damBase',
        { x: toWorldX(getDamXAtY(0, 'UPSTREAM')), y: 0 },
        { x: toWorldX(actualBaseWidth), y: 0 },
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

    if (isAnalyzed && up && up.FR > 0) {
      const xTop = getDamXAtY(upstreamLevel, 'UPSTREAM');
      const xCP = getDamXAtY(up.y_cp, 'UPSTREAM');
      const isVertical = Math.abs(inclinationAngle - 90) < 0.1;

      dims.push(
        drawDim(
          'hp',
          { x: xTop, y: upstreamLevel },
          { x: xTop, y: up.y_cp },
          `HP = ${up.h_cp.toFixed(2)}m`,
          { x: -120, y: 0 },
          { x: -40, y: 0 }
        )
      );

      if (!isVertical) {
        dims.push(
          drawDim(
            'yp',
            { x: xTop, y: upstreamLevel },
            { x: xCP, y: up.y_cp },
            `YP = ${up.s_cp.toFixed(2)}m`,
            { x: -55, y: 0 },
            { x: -40, y: 0 }
          )
        );
      }

      dims.push(
        drawDim(
          'distFundo',
          { x: xTop - 2, y: 0 },
          { x: xTop - 2, y: up.y_cp },
          `Fundo = ${up.y_cp.toFixed(2)}m`,
          { x: -180, y: 0 },
          { x: -40, y: 0 }
        )
      );
    }

    if (inclinationAngle > 0 && inclinationAngle <= 90) {
      const pToeWorld = { x: toWorldX(getDamXAtY(0, 'UPSTREAM')), y: 0 };
      const rWorld = Math.min(damHeight, actualBaseWidth) * 0.15;
      const r = rWorld * SCALE;

      if (inclinationAngle === 90) {
        const p1 = project({ x: pToeWorld.x + rWorld * 0.5, y: 0, z: 0 });
        const p2 = project({ x: pToeWorld.x + rWorld * 0.5, y: rWorld * 0.5, z: 0 });
        const p3 = project({ x: pToeWorld.x, y: rWorld * 0.5, z: 0 });
        dims.push(
          <g key="angle" stroke="#475569" strokeWidth="1.5" fill="none" opacity="0.8">
            <path d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}`} />
            <circle cx={project({ x: pToeWorld.x + rWorld * 0.25, y: rWorld * 0.25, z: 0 }).x} cy={project({ x: pToeWorld.x + rWorld * 0.25, y: rWorld * 0.25, z: 0 }).y} r="1.5" fill="#475569" stroke="none" />
          </g>
        );
      } else {
        const pHorizWorld = { x: pToeWorld.x + rWorld, y: 0 };
        const pHoriz = project({ ...pHorizWorld, z: 0 });

        const rad = inclinationAngle * Math.PI / 180;
        const pFaceWorld = { x: pToeWorld.x + rWorld * Math.cos(rad), y: rWorld * Math.sin(rad) };
        const pFace = project({ ...pFaceWorld, z: 0 });

        const pathData = `M ${pHoriz.x} ${pHoriz.y} A ${r} ${r} 0 0 0 ${pFace.x} ${pFace.y}`;

        const textRad = rad / 2;
        const pTextWorld = { x: pToeWorld.x + (rWorld * 1.4) * Math.cos(textRad), y: (rWorld * 1.4) * Math.sin(textRad) };
        const pText = project({ ...pTextWorld, z: 0 });

        dims.push(
          <g key="angle" stroke="#475569" strokeWidth="1.5" fill="none" opacity="0.8">
            <path d={pathData} />
            <text x={pText.x} y={pText.y} textAnchor="middle" dominantBaseline="middle" fill="#334155" fontSize="12" fontWeight="bold" stroke="none">
              {inclinationAngle.toFixed(0)}°
            </text>
          </g>
        );
      }
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
        forceH: forceH ?? force,
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
      onVisibleXBoundsChange={setVisibleXBounds}
    >
      {renderDimensions()}
    </SceneContainer>
  );
};
