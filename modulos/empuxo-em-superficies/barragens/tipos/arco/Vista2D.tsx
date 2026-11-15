import React, { useMemo, useState } from 'react';
import { RenderizadorBarragensProps } from '../../dominio/tipos';
import { construirGeometria } from './geometria';
import {
  getDamXAtYGeneric,
  criarPrisma,
  caixaAgua3D,
  criarAguaMontanteComLama,
  criarBaseTerra,
} from '../../visual/auxiliaresGeometriaCena';
import { calcularEscala2D, useSceneEngine } from '../../visual/motorCena3D';
import { SceneContainer as ContainerCena } from '../../visual/ContainerCena';

type ArchDam2DProps = RenderizadorBarragensProps & {
  is3D: boolean;
  setIs3D: React.Dispatch<React.SetStateAction<boolean>>;
  showVectors: boolean;
  setShowVectors: React.Dispatch<React.SetStateAction<boolean>>;
};

export const Vista2D: React.FC<ArchDam2DProps> = (props) => {
  const {
    damHeight,
    damBaseWidth,
    damCrestWidth,
    inclinationAngle,
    upstreamLevel,
    downstreamLevel = 0,
    hasMudLayer = false,
    mudHeight = 0,
    mudDensity = 1500,
    unitSystem = 'SI',
    gravity = 9.81,
    force,
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

  const [visibleXBounds, setVisibleXBounds] = useState<{ leftScreenX: number; rightScreenX: number }>({
    leftScreenX: -800,
    rightScreenX: 1800,
  });

  const archRadius = useMemo(() => props.archRadius || 30, [props.archRadius]);

  const { profile, actualBaseWidth, toWorldX, getDamXAtY } = useMemo(() => {
    const { profile: builtProfile, actualBaseWidth: builtBaseWidth } = construirGeometria(
      damHeight,
      damBaseWidth,
      damCrestWidth,
      inclinationAngle
    );
    const mapWorldX = (x: number) => x - builtBaseWidth / 2;
    const damXAtY = (y: number, side: 'UPSTREAM' | 'DOWNSTREAM') =>
      getDamXAtYGeneric(builtProfile, y, side);
    return {
      profile: builtProfile,
      actualBaseWidth: builtBaseWidth,
      toWorldX: mapWorldX,
      getDamXAtY: damXAtY,
    };
  }, [damHeight, damBaseWidth, damCrestWidth, inclinationAngle]);

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
  }, [
    autoFitParams,
    visibleXBounds.leftScreenX,
    visibleXBounds.rightScreenX,
    ORIGIN_X,
    getDamXAtY,
    actualBaseWidth,
    damHeight,
  ]);

  const worldGeometry = useMemo(() => {
    const maxH = Math.max(damHeight, upstreamLevel, downstreamLevel);

    const faces = [
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
  }, [
    damHeight,
    upstreamLevel,
    downstreamLevel,
    hasMudLayer,
    mudHeight,
    farLeft,
    farRight,
    profile,
    getDamXAtY,
    toWorldX,
  ]);

  const { renderedFaces, project, SCALE, pan, handlers, resetView } = useSceneEngine(
    false,
    worldGeometry,
    SVG_W,
    SVG_H,
    ORIGIN_X,
    ORIGIN_Y,
    autoFitParams
  );

  const originProj = project({ x: 0, y: 0, z: 0 });

  const isKgf = unitSystem === 'TECNICO_KGF';
  const fmtBr = (val: number, dec = 2) =>
    val.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  const fmtForceText = (valN: number) =>
    isKgf ? `${fmtBr(valN / gravity, 1)} kgf/m` : `${fmtBr(valN / 1000, 2)} kN/m`;

  const fmtPressureText = (valPa: number) =>
    isKgf ? `${fmtBr(valPa / gravity, 0)} kgf/m²` : `${fmtBr(valPa / 1000, 2)} kPa`;

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
    } else if (nx < 0) {
      nx = -nx;
      ny = -ny;
    }

    const mag = Math.hypot(nx, ny) || 1;
    return { nx: nx / mag, ny: ny / mag };
  };

  const renderDimensions = () => {
    if (is3D) return null;

    const dims: React.ReactNode[] = [];

    const pUpBase = project({ x: toWorldX(getDamXAtY(0, 'UPSTREAM')), y: 0, z: 0 });
    const pUpCrest = project({ x: toWorldX(getDamXAtY(damHeight, 'UPSTREAM')), y: damHeight, z: 0 });
    const pDownCrest = project({ x: toWorldX(getDamXAtY(damHeight, 'DOWNSTREAM')), y: damHeight, z: 0 });
    const pDownBase = project({ x: toWorldX(getDamXAtY(0, 'DOWNSTREAM')), y: 0, z: 0 });
    const pUpWater =
      upstreamLevel > 0
        ? project({ x: toWorldX(getDamXAtY(upstreamLevel, 'UPSTREAM')), y: upstreamLevel, z: 0 })
        : pUpBase;
    const pDownWater =
      downstreamLevel > 0
        ? project({ x: toWorldX(getDamXAtY(downstreamLevel, 'DOWNSTREAM')), y: downstreamLevel, z: 0 })
        : pDownBase;

    const effMud = hasMudLayer && mudHeight > 0 ? Math.min(mudHeight, upstreamLevel) : 0;
    const mudRatio = Math.max(0.1, mudDensity / 1000);
    const maxUpHead = effMud > 0 ? upstreamLevel - effMud + mudRatio * effMud : upstreamLevel;
    const maxHeadRef = Math.max(maxUpHead, downstreamLevel, 1e-9);

    // 1. Ondulação superficial de montante e jusante
    if (upstreamLevel > 0) {
      const xLeft = project({ x: toWorldX(farLeft), y: upstreamLevel, z: 0 }).x;
      const xRight = pUpWater.x;
      const yTop = pUpWater.y;
      const rippleHeight = Math.min(30, upstreamLevel * SCALE);

      dims.push(
        <g key="ripple-up">
          <rect
            x={xLeft}
            y={yTop}
            width={Math.max(0, xRight - xLeft)}
            height={rippleHeight}
            fill="url(#ripplePattern)"
            pointerEvents="none"
          />
          <line
            x1={xLeft}
            y1={yTop}
            x2={xRight}
            y2={yTop}
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1.2"
            pointerEvents="none"
          />
        </g>
      );
    }

    if (downstreamLevel > 0) {
      const xLeft = pDownWater.x;
      const xRight = project({ x: toWorldX(farRight), y: downstreamLevel, z: 0 }).x;
      const yTop = pDownWater.y;
      const rippleHeight = Math.min(30, downstreamLevel * SCALE);

      dims.push(
        <g key="ripple-down">
          <rect
            x={xLeft}
            y={yTop}
            width={Math.max(0, xRight - xLeft)}
            height={rippleHeight}
            fill="url(#ripplePattern)"
            pointerEvents="none"
          />
          <line
            x1={xLeft}
            y1={yTop}
            x2={xRight}
            y2={yTop}
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1.2"
            pointerEvents="none"
          />
        </g>
      );
    }

    // 2. Distribuição hidrostática de pressão na face molhada (proporcional à profundidade, normal à face)
    const MAX_PRES_PX = 76;
    let xMinPresPx = Math.min(pUpBase.x, pUpWater.x);
    let xBasePresTipPx = pUpBase.x;

    if (isAnalyzed && showVectors && upstreamLevel > 0 && up && up.FR > 0) {
      const sampleCount = 12;
      const sampleYs: number[] = [];
      for (let i = 0; i <= sampleCount; i++) {
        sampleYs.push(upstreamLevel * (1 - i / sampleCount));
      }
      if (effMud > 1e-4 && effMud < upstreamLevel - 1e-4 && !sampleYs.some((v) => Math.abs(v - effMud) < 1e-3)) {
        sampleYs.push(effMud);
        sampleYs.sort((a, b) => b - a);
      }

      const faceScreenPts: { x: number; y: number }[] = [];
      const envScreenPts: { x: number; y: number }[] = [];
      const arrowItems: { start: { x: number; y: number }; end: { x: number; y: number }; inMud: boolean }[] = [];

      sampleYs.forEach((yVal, idx) => {
        const inMud = effMud > 0 && yVal < effMud - 1e-4;
        const effDepth = inMud
          ? upstreamLevel - effMud + mudRatio * (effMud - yVal)
          : Math.max(0, upstreamLevel - yVal);
        const { nx, ny } = localNormal(yVal, 'UPSTREAM');
        const Lpx = MAX_PRES_PX * (effDepth / maxHeadRef);
        const Lw = Lpx / SCALE;
        const xFaceWorld = toWorldX(getDamXAtY(yVal, 'UPSTREAM'));

        const pFace = project({ x: xFaceWorld, y: yVal, z: 0 });
        const pEnv = project({ x: xFaceWorld + nx * Lw, y: yVal + ny * Lw, z: 0 });

        faceScreenPts.push(pFace);
        envScreenPts.push(pEnv);
        xMinPresPx = Math.min(xMinPresPx, pEnv.x);

        if (idx === sampleYs.length - 1) {
          xBasePresTipPx = pEnv.x;
        }

        if (Lpx >= 6) {
          arrowItems.push({ start: pEnv, end: pFace, inMud });
        }
      });

      const polyPoints = [
        ...faceScreenPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
        ...[...envScreenPts].reverse().map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
      ].join(' ');

      dims.push(
        <g key="pressure-distribution-up" pointerEvents="none">
          <polygon
            points={polyPoints}
            fill={effMud > 0 ? 'rgba(217, 119, 6, 0.14)' : 'rgba(37, 99, 235, 0.14)'}
            stroke={effMud > 0 ? '#b45309' : '#2563eb'}
            strokeWidth="1.4"
            strokeDasharray="4 2"
          />
          {arrowItems.map((arr, idx) => (
            <line
              key={`p-arr-up-${idx}`}
              x1={arr.start.x}
              y1={arr.start.y}
              x2={arr.end.x}
              y2={arr.end.y}
              stroke={arr.inMud ? '#b45309' : '#2563eb'}
              strokeWidth="1.5"
              opacity="0.82"
              markerEnd="url(#arrow)"
            />
          ))}
        </g>
      );
    }

    // Distribuição de pressão a jusante quando houver lâmina d'água a jusante
    if (isAnalyzed && showVectors && downstreamLevel > 0) {
      const nDown = 8;
      const downFacePts: { x: number; y: number }[] = [];
      const downEnvPts: { x: number; y: number }[] = [];
      const downArrows: { start: { x: number; y: number }; end: { x: number; y: number } }[] = [];

      for (let i = 0; i <= nDown; i++) {
        const yVal = downstreamLevel * (1 - i / nDown);
        const depth = Math.max(0, downstreamLevel - yVal);
        const { nx, ny } = localNormal(yVal, 'DOWNSTREAM');
        const Lpx = MAX_PRES_PX * (depth / maxHeadRef);
        const Lw = Lpx / SCALE;
        const xFaceWorld = toWorldX(getDamXAtY(yVal, 'DOWNSTREAM'));

        const pFace = project({ x: xFaceWorld, y: yVal, z: 0 });
        const pEnv = project({ x: xFaceWorld + nx * Lw, y: yVal + ny * Lw, z: 0 });
        downFacePts.push(pFace);
        downEnvPts.push(pEnv);
        if (Lpx >= 6) {
          downArrows.push({ start: pEnv, end: pFace });
        }
      }

      const downPoly = [
        ...downFacePts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
        ...[...downEnvPts].reverse().map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
      ].join(' ');

      dims.push(
        <g key="pressure-distribution-down" pointerEvents="none">
          <polygon
            points={downPoly}
            fill="rgba(59, 130, 246, 0.14)"
            stroke="#3b82f6"
            strokeWidth="1.3"
            strokeDasharray="4 2"
          />
          {downArrows.map((arr, idx) => (
            <line
              key={`p-arr-down-${idx}`}
              x1={arr.start.x}
              y1={arr.start.y}
              x2={arr.end.x}
              y2={arr.end.y}
              stroke="#3b82f6"
              strokeWidth="1.4"
              opacity="0.8"
              markerEnd="url(#arrow)"
            />
          ))}
        </g>
      );
    }

    // 3. Centro de Pressão (CP) e Vetor da Força Hidrostática Resultante (FR)
    const pCP =
      isAnalyzed && up && upstreamLevel > 0 && up.FR > 0
        ? project({ x: toWorldX(getDamXAtY(up.y_cp, 'UPSTREAM')), y: up.y_cp, z: 0 })
        : null;

    let frTailX = pUpBase.x;
    if (pCP && up && up.FR > 0) {
      const fH = up.FH;
      const fV = up.FV;
      const fMag = Math.hypot(fH, fV) || up.FR;
      const arrowLenPx = 94;
      const pTail = {
        x: pCP.x - (fH / fMag) * arrowLenPx,
        y: pCP.y - (fV / fMag) * arrowLenPx,
      };
      frTailX = pTail.x;

      if (showVectors) {
        const displayForceN = Math.abs(force) > 1e-3 ? Math.abs(force) : up.FR;
        const frLabel = `F_R = ${fmtForceText(displayForceN)}`;
        const badgeW = Math.max(108, frLabel.length * 6.5 + 18);
        const badgeH = 22;
        const placeLeft = pTail.x - badgeW - 10 >= 198;
        const badgeCx = placeLeft
          ? pTail.x - badgeW / 2 - 10
          : Math.max(198 + badgeW / 2, pTail.x - 10);
        const badgeCy = placeLeft
          ? pTail.y
          : Math.max(162, pTail.y - 22);

        dims.push(
          <g key="resultant-force-vector" pointerEvents="none">
            <line
              x1={pTail.x}
              y1={pTail.y}
              x2={pCP.x}
              y2={pCP.y}
              stroke="#dc2626"
              strokeWidth="3.2"
              strokeLinecap="round"
              markerEnd="url(#arrow-red)"
            />
            <rect
              x={badgeCx - badgeW / 2}
              y={badgeCy - badgeH / 2}
              width={badgeW}
              height={badgeH}
              rx={11}
              fill="#ffffff"
              opacity="0.96"
              stroke="#fca5a5"
              strokeWidth="1.4"
            />
            <text
              x={badgeCx}
              y={badgeCy}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#b91c1c"
              fontSize="11"
              fontWeight="800"
            >
              {frLabel}
            </text>
          </g>
        );
      }

      // Marcador e identificação do Centro de Pressão (CP)
      const cpRightEdge = Math.max(pDownBase.x, pDownCrest.x);
      dims.push(
        <g key="cp-marker-tag" pointerEvents="none">
          <circle
            cx={pCP.x}
            cy={pCP.y}
            r={4.5}
            fill="#dc2626"
            stroke="#ffffff"
            strokeWidth="1.8"
          />
          <line
            x1={pCP.x + 5}
            y1={pCP.y}
            x2={cpRightEdge + 36}
            y2={pCP.y}
            stroke="#dc2626"
            strokeWidth="1.1"
            strokeDasharray="3 3"
            opacity="0.7"
          />
          <rect
            x={cpRightEdge + 8}
            y={pCP.y - 18}
            width={24}
            height={15}
            rx={4}
            fill="#fef2f2"
            stroke="#fca5a5"
            strokeWidth="1"
          />
          <text
            x={cpRightEdge + 20}
            y={pCP.y - 10.5}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#b91c1c"
            fontSize="9.5"
            fontWeight="800"
          >
            CP
          </text>
        </g>
      );
    }

    // 4. Pressão máxima na base (p_máx) com linha de chamada sem sobreposição
    if (isAnalyzed && upstreamLevel > 0 && up && up.p_bot > 0) {
      const pMaxLabel = `p_máx = ${fmtPressureText(up.p_bot)}`;
      const pMaxW = Math.max(114, pMaxLabel.length * 6.4 + 16);
      const pMaxH = 21;
      const anchorX = showVectors ? xBasePresTipPx : pUpBase.x;
      const anchorY = pUpBase.y;
      const badgeCx = Math.max(
        196 + pMaxW / 2,
        Math.min(pUpBase.x - 24 - pMaxW / 2, anchorX - 42)
      );
      const badgeCy = anchorY + 32;

      dims.push(
        <g key="p-max-base-callout" pointerEvents="none">
          <circle
            cx={anchorX}
            cy={anchorY}
            r={3.8}
            fill="#1d4ed8"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <polyline
            points={`${anchorX},${anchorY + 3} ${anchorX - 12},${badgeCy} ${badgeCx + pMaxW / 2},${badgeCy}`}
            fill="none"
            stroke="#1d4ed8"
            strokeWidth="1.3"
            strokeDasharray="3 2"
          />
          <rect
            x={badgeCx - pMaxW / 2}
            y={badgeCy - pMaxH / 2}
            width={pMaxW}
            height={pMaxH}
            rx={6}
            fill="#eff6ff"
            stroke="#93c5fd"
            strokeWidth="1.3"
          />
          <text
            x={badgeCx}
            y={badgeCy}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#1e40af"
            fontSize="10.5"
            fontWeight="800"
          >
            {pMaxLabel}
          </text>
        </g>
      );
    }

    // 5. Auxiliar de cota linear limpa (sem sobrepor texto às linhas)
    const drawDim = (
      key: string,
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      text: string,
      offsetPx: { x: number; y: number },
      textOffsetPx: { x: number; y: number } = { x: 0, y: 0 },
      accentColor = '#475569'
    ) => {
      const p1Off = { x: p1.x + offsetPx.x, y: p1.y + offsetPx.y };
      const p2Off = { x: p2.x + offsetPx.x, y: p2.y + offsetPx.y };

      const cx = (p1Off.x + p2Off.x) / 2 + textOffsetPx.x;
      const cy = (p1Off.y + p2Off.y) / 2 + textOffsetPx.y;

      const textW = Math.max(42, text.length * 6.4 + 12);
      const textH = 17;

      return (
        <g key={key} stroke={accentColor} strokeWidth="1.4" fill="none" opacity="0.95" pointerEvents="none">
          <line x1={p1.x} y1={p1.y} x2={p1Off.x} y2={p1Off.y} strokeDasharray="3 3" opacity="0.45" />
          <line x1={p2.x} y1={p2.y} x2={p2Off.x} y2={p2Off.y} strokeDasharray="3 3" opacity="0.45" />
          <line x1={p1Off.x} y1={p1Off.y} x2={p2Off.x} y2={p2Off.y} markerStart="url(#arrow)" markerEnd="url(#arrow)" />
          <rect x={cx - textW / 2} y={cy - textH / 2} width={textW} height={textH} fill="#ffffff" rx="4" stroke="none" opacity="0.95" />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fill={accentColor}
            fontSize="11"
            fontWeight="800"
            stroke="none"
          >
            {text}
          </text>
        </g>
      );
    };

    const drawLevelSymbol = (
      key: string,
      pSurf: { x: number; y: number },
      text: string,
      screenX: number,
      flipX = false
    ) => {
      const dir = flipX ? -1 : 1;
      return (
        <g key={key} stroke="#1d4ed8" strokeWidth="1.2" opacity="0.92" pointerEvents="none">
          <polygon points={`${screenX},${pSurf.y} ${screenX - 6},${pSurf.y - 12} ${screenX},${pSurf.y - 12}`} fill="none" />
          <polygon points={`${screenX},${pSurf.y} ${screenX},${pSurf.y - 12} ${screenX + 6},${pSurf.y - 12}`} fill="#1d4ed8" />
          <polyline
            points={`${screenX},${pSurf.y - 12} ${screenX},${pSurf.y - 26} ${screenX + dir * 68},${pSurf.y - 26}`}
            fill="none"
          />
          <text
            x={screenX + dir * 34}
            y={pSurf.y - 30}
            textAnchor="middle"
            dominantBaseline="alphabetic"
            fill="#1e3a8a"
            fontSize="10.5"
            fontWeight="800"
            stroke="none"
          >
            {text}
          </text>
        </g>
      );
    };

    // 6. Cotas geométricas e hidráulicas em pistas dedicadas sem sobreposição
    // 6a. Base (B) e Crista (b_c)
    dims.push(
      drawDim(
        'damBase',
        pUpBase,
        pDownBase,
        `B = ${fmtBr(actualBaseWidth, 1)} m`,
        { x: 0, y: 34 },
        { x: 0, y: 15 }
      )
    );

    if (damCrestWidth > 0) {
      dims.push(
        drawDim(
          'damCrest',
          pUpCrest,
          pDownCrest,
          `b = ${fmtBr(damCrestWidth, 1)} m`,
          { x: 0, y: -26 },
          { x: 0, y: -14 }
        )
      );
    }

    // 6b. Pista esquerda: altura do reservatório h_mont (limpa à esquerda da faixa de F_R e fora do inset)
    if (upstreamLevel > 0) {
      const xHMont = Math.max(198, Math.min(xMinPresPx - 140, frTailX - 135));
      const hMontText = `h_mont = ${fmtBr(upstreamLevel, 2)} m`;
      const hMontW = Math.max(96, hMontText.length * 6.2 + 12);
      const yTop = pUpWater.y;
      const yBot = pUpBase.y;
      const labelY = Math.max(168, yTop + (yBot - yTop) * 0.34);

      dims.push(
        <g key="dim-h-mont" stroke="#0369a1" strokeWidth="1.4" fill="none" opacity="0.95" pointerEvents="none">
          <line x1={pUpWater.x} y1={yTop} x2={xHMont} y2={yTop} strokeDasharray="3 3" opacity="0.4" />
          <line x1={pUpBase.x} y1={yBot} x2={xHMont} y2={yBot} strokeDasharray="3 3" opacity="0.4" />
          <line x1={xHMont} y1={yTop} x2={xHMont} y2={yBot} markerStart="url(#arrow)" markerEnd="url(#arrow)" />
          <rect
            x={xHMont - hMontW / 2}
            y={labelY - 9}
            width={hMontW}
            height={18}
            rx="4"
            fill="#ffffff"
            stroke="#bae6fd"
            strokeWidth="1"
          />
          <text
            x={xHMont}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#0369a1"
            fontSize="10.5"
            fontWeight="800"
            stroke="none"
          >
            {hMontText}
          </text>
        </g>
      );

      // Símbolo de nível d'água (NA) em área livre à direita do inset superior
      const xNA = Math.max(230, Math.min(pUpWater.x - 86, 320));
      dims.push(
        drawLevelSymbol('upstreamLevel', pUpWater, `NA = ${fmtBr(upstreamLevel, 2)} m`, xNA, false)
      );
    }

    // 6c. Pistas direitas: interna para cotas do CP (h_p e y_CP), externa para altura da barragem (H)
    const rightDamEdgeX = Math.max(pDownBase.x, pDownCrest.x);
    const xRightInner = rightDamEdgeX + (downstreamLevel > 0 ? 104 : 42);
    const hasCpDims = Boolean(pCP && isAnalyzed && up && upstreamLevel > 0);
    const xRightOuter = xRightInner + (hasCpDims ? 116 : 44);

    if (pCP && up && upstreamLevel > 0) {
      const hpText = `h_p = ${fmtBr(up.h_cp, 2)} m`;
      const ycpText = `y_CP = ${fmtBr(up.y_cp, 2)} m`;
      const hpOffX = xRightInner - pUpWater.x;
      const ycpOffX = xRightInner - pCP.x;
      const ySpanHp = Math.abs(pCP.y - pUpWater.y);
      const ySpanYcp = Math.abs(pUpBase.y - pCP.y);

      if (ySpanHp >= 18) {
        dims.push(
          drawDim(
            'dim-hp-cp',
            { x: pUpWater.x, y: pUpWater.y },
            { x: pUpWater.x, y: pCP.y },
            hpText,
            { x: hpOffX, y: 0 },
            { x: 52, y: 0 },
            '#0e7490'
          )
        );
      }
      if (ySpanYcp >= 14) {
        dims.push(
          drawDim(
            'dim-ycp-base',
            { x: pCP.x, y: pCP.y },
            { x: pCP.x, y: pUpBase.y },
            ycpText,
            { x: ycpOffX, y: 0 },
            { x: 52, y: ySpanYcp < 26 ? 12 : 0 },
            '#b91c1c'
          )
        );
      }
    }

    dims.push(
      drawDim(
        'damHeight',
        { x: pDownBase.x, y: pDownBase.y },
        { x: pDownBase.x, y: pDownCrest.y },
        `H = ${fmtBr(damHeight, 1)} m`,
        { x: xRightOuter - pDownBase.x, y: 0 },
        { x: 42, y: 0 },
        '#334155'
      )
    );

    if (downstreamLevel > 0) {
      const xNADown = Math.min(SVG_W - 88, Math.max(pDownWater.x + 28, xRightOuter + 44));
      dims.push(
        drawLevelSymbol('downstreamLevel', pDownWater, `NA = ${fmtBr(downstreamLevel, 2)} m`, xNADown, false)
      );
    }

    // 6d. Indicação da camada de lama quando habilitada
    if (effMud > 0) {
      const pL = project({ x: toWorldX(farLeft), y: effMud, z: 0 });
      const pR = project({ x: toWorldX(getDamXAtY(effMud, 'UPSTREAM')), y: effMud, z: 0 });
      const mudLabelX = Math.max(pL.x + 8, Math.min(pR.x - 165, 212));
      dims.push(
        <g key="mud-interface" pointerEvents="none">
          <line
            x1={pL.x}
            y1={pL.y}
            x2={pR.x}
            y2={pR.y}
            stroke="#fbbf24"
            strokeWidth="1.3"
            strokeDasharray="5 3"
            opacity="0.85"
          />
          <text
            x={mudLabelX}
            y={pL.y - 6}
            fill="#fef3c7"
            fontSize="10"
            fontWeight="bold"
            stroke="#78350f"
            strokeWidth="2.5"
            paintOrder="stroke"
          >
            Lama = {effMud.toFixed(2)}m (d={(mudDensity / 1000).toFixed(2)})
          </text>
        </g>
      );
    }

    // 6e. Ângulo de inclinação da face molhada AB
    const actualAngleRad = (inclinationAngle * Math.PI) / 180;
    const actualAngleDeg = inclinationAngle;
    if (actualAngleDeg > 0 && actualAngleDeg <= 90) {
      const pToeWorld = { x: toWorldX(getDamXAtY(0, 'UPSTREAM')), y: 0 };
      const rWorld = Math.min(damHeight, actualBaseWidth) * 0.22;
      const r = rWorld * SCALE;

      if (Math.abs(actualAngleDeg - 90) < 0.1) {
        const p1 = project({ x: pToeWorld.x + rWorld * 0.65, y: 0, z: 0 });
        const p2 = project({ x: pToeWorld.x + rWorld * 0.65, y: rWorld * 0.65, z: 0 });
        const p3 = project({ x: pToeWorld.x, y: rWorld * 0.65, z: 0 });
        dims.push(
          <g key="angle" stroke="#475569" strokeWidth="1.4" fill="none" opacity="0.85" pointerEvents="none">
            <path d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}`} />
            <circle
              cx={project({ x: pToeWorld.x + rWorld * 0.32, y: rWorld * 0.32, z: 0 }).x}
              cy={project({ x: pToeWorld.x + rWorld * 0.32, y: rWorld * 0.32, z: 0 }).y}
              r="1.4"
              fill="#475569"
              stroke="none"
            />
          </g>
        );
      } else {
        const pHoriz = project({ x: pToeWorld.x + rWorld, y: 0, z: 0 });
        const pFace = project({
          x: pToeWorld.x + rWorld * Math.cos(actualAngleRad),
          y: rWorld * Math.sin(actualAngleRad),
          z: 0,
        });
        const pathData = `M ${pHoriz.x} ${pHoriz.y} A ${r} ${r} 0 0 0 ${pFace.x} ${pFace.y}`;
        const textRad = actualAngleRad / 2;
        const pText = project({
          x: pToeWorld.x + rWorld * 1.65 * Math.cos(textRad),
          y: rWorld * 1.65 * Math.sin(textRad),
          z: 0,
        });

        dims.push(
          <g key="angle" stroke="#475569" strokeWidth="1.4" fill="none" opacity="0.85" pointerEvents="none">
            <path d={pathData} />
            <text
              x={pText.x}
              y={pText.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#334155"
              fontSize="11"
              fontWeight="bold"
              stroke="none"
            >
              {actualAngleDeg.toFixed(0)}°
            </text>
          </g>
        );
      }
    }

    // 7. Identificação explícita das regiões de MONTANTE e JUSANTE na cena 2D
    const montanteCx = Math.max(245, Math.min(pUpWater.x - 105, 310));
    const montanteCy = Math.max(176, Math.min(pUpWater.y + 42, 225));
    const jusanteCx = Math.min(SVG_W - 65, Math.max(xRightOuter + 125, 765));
    const jusanteCy = montanteCy;

    dims.push(
      <g key="region-labels" pointerEvents="none">
        <g transform={`translate(${montanteCx}, ${montanteCy})`}>
          <rect
            x={-44}
            y={-10}
            width={88}
            height={20}
            rx={6}
            fill="#eff6ff"
            opacity="0.92"
            stroke="#93c5fd"
            strokeWidth="1"
          />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="9.5"
            fontWeight="800"
            letterSpacing="0.8"
            fill="#1d4ed8"
          >
            MONTANTE
          </text>
        </g>

        <g transform={`translate(${jusanteCx}, ${jusanteCy})`}>
          <rect
            x={-40}
            y={-10}
            width={80}
            height={20}
            rx={6}
            fill="#f8fafc"
            opacity="0.92"
            stroke="#cbd5e1"
            strokeWidth="1"
          />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="9.5"
            fontWeight="800"
            letterSpacing="0.8"
            fill="#475569"
          >
            JUSANTE
          </text>
        </g>
      </g>
    );

    // 8. Vista Superior esquemática do Arco no Vale Estreito (com raio R dinâmico)
    const boxW = 166;
    const boxH = 132;
    const x0 = 14;
    const y0 = 14;
    const centerX = x0 + boxW / 2;
    const centerY = y0 + boxH - 30;
    const r = 56;
    const bow = Math.max(10, Math.min(54, 60 * (30 / Math.max(5, archRadius))));

    dims.push(
      <g key="topViewInset" pointerEvents="none">
        <rect x={x0} y={y0} width={boxW} height={boxH} fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.8" rx="8" />
        <text x={centerX} y={y0 + 18} textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#64748b" letterSpacing="0.8">
          VISTA SUPERIOR
        </text>

        <path
          d={`M ${centerX - r} ${centerY} Q ${centerX} ${centerY - bow} ${centerX + r} ${centerY} L ${centerX + r} ${y0 + 28} L ${centerX - r} ${y0 + 28} Z`}
          fill="#dbeafe"
          opacity="0.85"
        />
        <text x={centerX} y={y0 + 39} textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#2563eb" opacity="0.8">
          MONTANTE
        </text>

        <path
          d={`M ${centerX - r} ${centerY} Q ${centerX} ${centerY - bow} ${centerX + r} ${centerY}`}
          fill="none"
          stroke="#64748b"
          strokeWidth={Math.max(4, Math.min(10, damCrestWidth * 1.4))}
          strokeLinecap="round"
        />

        <path
          d={`M ${centerX - r + 2} ${centerY - 2} L ${centerX - r - 8} ${centerY + 8} M ${centerX + r - 2} ${centerY - 2} L ${centerX + r + 8} ${centerY + 8}`}
          fill="none"
          stroke="#78350f"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.9"
        />
        <text x={centerX} y={centerY + 13} textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#78350f" opacity="0.85">
          ENCAIXES NA ROCHA
        </text>
        <text x={centerX} y={centerY + 24} textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#1e40af">
          R = {fmtBr(archRadius, 1)} m
        </text>
      </g>
    );

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
      vectors={[]}
      SVG_W={SVG_W}
      SVG_H={SVG_H}
      ORIGIN_X={originProj.x}
      ORIGIN_Y={originProj.y}
      pan={pan}
      onVisibleXBoundsChange={setVisibleXBounds}
    >
      {renderDimensions()}
    </ContainerCena>
  );
};
