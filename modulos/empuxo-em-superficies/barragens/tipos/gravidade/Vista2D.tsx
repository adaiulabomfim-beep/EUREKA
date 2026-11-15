import React, { useMemo, useState } from 'react';
import { renderizarCotasHPeYP2D, renderizarEstabilidade2D } from '../../visual/overlayEstabilidade';
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
    hasMudLayer = false,
    mudHeight = 0,
    mudDensity = 1500,
    force,
    forceH,
    forceV,
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

  const [visibleXBounds, setVisibleXBounds] = useState<{ leftScreenX: number; rightScreenX: number }>({
    leftScreenX: -800,
    rightScreenX: 1800,
  });

  const { profile, actualBaseWidth, toWorldX, getDamXAtY } = useMemo(() => {
    const { profile, actualBaseWidth } = construirGeometria(
      damHeight,
      damBaseWidth,
      damCrestWidth,
      inclinationAngle
    );
    const toWorldX = (x: number) => x - actualBaseWidth / 2;
    const getDamXAtY = (y: number, side: 'UPSTREAM' | 'DOWNSTREAM') => {
      return getDamXAtYGeneric(profile, y, side);
    };
    return { profile, actualBaseWidth, toWorldX, getDamXAtY };
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
  }, [autoFitParams, visibleXBounds.leftScreenX, visibleXBounds.rightScreenX, ORIGIN_X, getDamXAtY, actualBaseWidth, damHeight]);

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

  const isTriangularABCMode = Boolean(
    props.showTriangularMode || (damCrestWidth <= 0.01 && (props.damWidth ?? 1) > 1.001)
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
        distributionOpacity: 0.85,
        hasMudLayer,
        mudHeight,
        mudDensity,
      }).map((v) => (isTriangularABCMode && v.isResultant ? { ...v, val: '' } : v)),
    [
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
      hasMudLayer,
      mudHeight,
      mudDensity,
      isTriangularABCMode,
    ]
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
      const xLeft = project({ x: toWorldX(getDamXAtY(downstreamLevel, 'DOWNSTREAM')), y: downstreamLevel, z: 0 }).x;
      const xRight = project({ x: toWorldX(farRight), y: downstreamLevel, z: 0 }).x;
      const yTop = project({ x: toWorldX(farRight), y: downstreamLevel, z: 0 }).y;
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

      const cx = (p1Off.x + p2Off.x) / 2 + textOffsetPx.x;
      const cy = (p1Off.y + p2Off.y) / 2 + textOffsetPx.y;

      const textW = text.length * 7 + 8;
      const textH = 18;

      return (
        <g key={key} stroke="#64748b" strokeWidth="1.6" fill="none" opacity="0.9">
          <line x1={p1.x} y1={p1.y} x2={p1Off.x} y2={p1Off.y} strokeDasharray="3 3" opacity="0.45" />
          <line x1={p2.x} y1={p2.y} x2={p2Off.x} y2={p2Off.y} strokeDasharray="3 3" opacity="0.45" />
          <line
            x1={p1Off.x}
            y1={p1Off.y}
            x2={p2Off.x}
            y2={p2Off.y}
            markerStart="url(#arrow)"
            markerEnd="url(#arrow)"
          />
          <rect x={cx - textW / 2} y={cy - textH / 2} width={textW} height={textH} fill="white" rx="3" stroke="none" />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
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
          <text
            x={p.x + dir * 28}
            y={p.y - 34}
            textAnchor="middle"
            dominantBaseline="alphabetic"
            fill="#334155"
            fontSize="11"
            fontWeight="bold"
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
        { x: toWorldX(getDamXAtY(0, 'DOWNSTREAM')), y: damHeight },
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
        `${actualBaseWidth.toFixed(1)}m`,
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
      const xBase = toWorldX(getDamXAtY(upstreamLevel, 'UPSTREAM')) - 1;
      dims.push(drawLevelSymbol('upstreamLevel', xBase, upstreamLevel, `NA=${upstreamLevel.toFixed(2)}`, true, 82));
    }

    const effMud = hasMudLayer && mudHeight > 0 ? Math.min(mudHeight, upstreamLevel) : 0;
    if (effMud > 0) {
      const pL = project({ x: toWorldX(farLeft), y: effMud, z: 0 });
      const pR = project({ x: toWorldX(getDamXAtY(effMud, 'UPSTREAM')), y: effMud, z: 0 });
      const mudLabelX = Math.max(pL.x + 8, Math.min(pR.x - 165, 28));
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
            y={pL.y - 5}
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

    if (downstreamLevel > 0) {
      const xBase = toWorldX(getDamXAtY(downstreamLevel, 'DOWNSTREAM')) + 1;
      dims.push(drawLevelSymbol('downstreamLevel', xBase, downstreamLevel, `NA=${downstreamLevel.toFixed(2)}`, true, SVG_W - 28));
    }

    dims.push(
      ...renderizarCotasHPeYP2D({
        isAnalyzed,
        upstreamLevel,
        inclinationAngle,
        up,
        getDamXAtY,
        toWorldX,
        project,
      })
    );

    const isTriangularABC = Boolean(
      props.showTriangularMode || (damCrestWidth <= 0.01 && (props.damWidth ?? 1) > 1.001)
    );

    if (isTriangularABC) {
      const ptB = project({ x: toWorldX(0), y: 0, z: 0 });
      const ptC = project({ x: toWorldX(actualBaseWidth), y: 0, z: 0 });
      const ptA = project({ x: toWorldX(actualBaseWidth), y: damHeight, z: 0 });
      const L_AB = Math.hypot(actualBaseWidth, damHeight);
      const bLong = props.damWidth ?? props.stability?.damWidth ?? 30;
      const dConc = props.stability?.concreteSpecificGravity ?? 2.4;

      // Cota inclinada AB = 100 m ao longo da face de montante
      const midAB = { x: (ptA.x + ptB.x) / 2 - 36, y: (ptA.y + ptB.y) / 2 - 22 };
      const abLabel = `AB = ${L_AB.toFixed(1)} m (${inclinationAngle.toFixed(2)}°)`;
      const abBoxW = abLabel.length * 6.3 + 14;

      dims.push(
        <g key="abc-labels-and-dims" pointerEvents="none">
          {/* Cota do comprimento inclinado AB */}
          <rect
            x={midAB.x - abBoxW / 2}
            y={midAB.y - 10}
            width={abBoxW}
            height={20}
            rx={6}
            fill="white"
            stroke="#2563eb"
            strokeWidth="1.2"
            opacity="0.95"
          />
          <text
            x={midAB.x}
            y={midAB.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="11"
            fontWeight="800"
            fill="#1d4ed8"
          >
            {abLabel}
          </text>

          {/* Vértice A (Topo) */}
          <g transform={`translate(${ptA.x + 14}, ${ptA.y - 14})`}>
            <circle cx={0} cy={0} r={11} fill="#0f172a" stroke="white" strokeWidth="2" />
            <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="900" fill="white">
              A
            </text>
          </g>

          {/* Vértice B (Pé de Montante) */}
          <g transform={`translate(${ptB.x - 16}, ${ptB.y + 16})`}>
            <circle cx={0} cy={0} r={11} fill="#0f172a" stroke="white" strokeWidth="2" />
            <text x={0} cy={0} y={0} textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="900" fill="white">
              B
            </text>
          </g>

          {/* Vértice C (Pé de Jusante / Ponto de Referência de Momento) */}
          <circle cx={ptC.x} cy={ptC.y} r={6} fill="#ea580c" stroke="white" strokeWidth="2" />
          <g transform={`translate(${ptC.x + 18}, ${ptC.y + 16})`}>
            <circle cx={0} cy={0} r={12} fill="#ea580c" stroke="white" strokeWidth="2" />
            <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="900" fill="white">
              C
            </text>
          </g>

          {/* Etiqueta informativa de Largura Longitudinal b e Concreto d */}
          <g transform={`translate(${SVG_W / 2}, ${ptA.y - 34})`}>
            <rect
              x={-135}
              y={-11}
              width={270}
              height={22}
              rx={8}
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth="1.2"
              opacity="0.95"
            />
            <text
              x={0}
              y={0}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="10.5"
              fontWeight="800"
              fill="#334155"
            >
              {`Largura b = ${bLong.toFixed(1)} m  |  Concreto d = ${dConc.toFixed(1)}`}
            </text>
          </g>

          {/* Marcador do Centro de Pressão (CP), Componentes FH e FV e Braço de Momento em C */}
          {isAnalyzed && up && up.FR > 0 && (
            (() => {
              const xCpWorld = toWorldX(getDamXAtY(up.y_cp, 'UPSTREAM'));
              const ptCP = project({ x: xCpWorld, y: up.y_cp, z: 0 });
              const fTotalN = (up.FR * bLong).toLocaleString('pt-BR', {
                maximumFractionDigits: 0,
              });
              const fhTotalN = (up.FH * bLong).toLocaleString('pt-BR', {
                maximumFractionDigits: 0,
              });
              const fvTotalN = (up.FV * bLong).toLocaleString('pt-BR', {
                maximumFractionDigits: 0,
              });
              const cpBadgeText = `CP (s=${up.s_cp.toFixed(2)}m) | FR = ${fTotalN} N (b=${bLong.toFixed(0)}m)`;
              const cpBoxW = cpBadgeText.length * 5.6 + 14;

              // Projeção perpendicular D de C sobre AB (AD = 64 m a partir de A => x_D = 21.6 m, y_D = 28.8 m)
              const sinT = damHeight / Math.max(1e-6, L_AB);
              const cosT = actualBaseWidth / Math.max(1e-6, L_AB);
              const s_D = damHeight * sinT;
              const xD_local = actualBaseWidth - s_D * cosT;
              const yD_local = damHeight - s_D * sinT;
              const ptD = project({ x: toWorldX(xD_local), y: yD_local, z: 0 });

              // Pé da perpendicular baixada de C sobre a linha de ação de FR
              const dPerp = Math.abs(up.s_cp - s_D);
              const xP_local = actualBaseWidth - (up.s_cp - s_D) * cosT;
              const yP_local = -(up.s_cp - s_D) * sinT;
              const ptFootC = project({ x: toWorldX(xP_local), y: yP_local, z: 0 });

              // Componentes FH (horizontal para a direita) e FV (vertical para baixo) a partir do CP
              const fhLenPx = 46;
              const fvLenPx = 36;
              const ptFH_end = { x: ptCP.x + fhLenPx, y: ptCP.y };
              const ptFV_end = { x: ptCP.x, y: ptCP.y + fvLenPx };

              const mC_val = props.stability?.analisePontoC
                ? Math.abs(props.stability.analisePontoC.M_hidro_C_total)
                : up.FR * bLong * dPerp;
              const mCFormatted = mC_val.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
              const mCLabel = `Braço d_⊥,C = ${dPerp.toFixed(2)} m | M_C = ${mCFormatted} N·m (↺)`;
              const mCBoxW = mCLabel.length * 5.4 + 14;

              return (
                <g key="cp-marker-ab">
                  {showVectors && (
                    <>
                      {/* Linha de ação de FR até a perpendicular em C e referência DC */}
                      <line
                        x1={ptD.x}
                        y1={ptD.y}
                        x2={ptC.x}
                        y2={ptC.y}
                        stroke="#64748b"
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                        opacity="0.65"
                      />
                      <line
                        x1={ptCP.x}
                        y1={ptCP.y}
                        x2={ptFootC.x}
                        y2={ptFootC.y}
                        stroke="#1d4ed8"
                        strokeWidth="1.5"
                        strokeDasharray="5 3"
                        opacity="0.85"
                      />
                      {/* Segmento do braço de momento perpendicular d_⊥,C junto a C */}
                      <line
                        x1={ptC.x}
                        y1={ptC.y}
                        x2={ptFootC.x}
                        y2={ptFootC.y}
                        stroke="#ea580c"
                        strokeWidth="2.8"
                      />

                      {/* Decomposição retangular FH e FV no CP */}
                      <line
                        x1={ptFH_end.x}
                        y1={ptFH_end.y}
                        x2={ptFH_end.x}
                        y2={ptFV_end.y}
                        stroke="#0f766e"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        opacity="0.6"
                      />
                      <line
                        x1={ptFV_end.x}
                        y1={ptFV_end.y}
                        x2={ptFH_end.x}
                        y2={ptFV_end.y}
                        stroke="#0369a1"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        opacity="0.6"
                      />

                      {/* Vetor Componente Horizontal FH */}
                      <line
                        x1={ptCP.x}
                        y1={ptCP.y}
                        x2={ptFH_end.x - 6}
                        y2={ptFH_end.y}
                        stroke="#0284c7"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                      />
                      <polygon
                        points={`${ptFH_end.x},${ptFH_end.y} ${ptFH_end.x - 8},${ptFH_end.y - 4.5} ${ptFH_end.x - 8},${ptFH_end.y + 4.5}`}
                        fill="#0284c7"
                      />
                      <rect
                        x={ptCP.x + 4}
                        y={ptCP.y - 22}
                        width={120}
                        height={15}
                        rx={4}
                        fill="white"
                        stroke="#0284c7"
                        strokeWidth="1"
                        opacity="0.95"
                      />
                      <text
                        x={ptCP.x + 64}
                        y={ptCP.y - 14.5}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="9"
                        fontWeight="800"
                        fill="#0369a1"
                      >
                        {`FH = ${fhTotalN} N →`}
                      </text>

                      {/* Vetor Componente Vertical FV (para baixo) */}
                      <line
                        x1={ptCP.x}
                        y1={ptCP.y}
                        x2={ptFV_end.x}
                        y2={ptFV_end.y - 6}
                        stroke="#0d9488"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                      />
                      <polygon
                        points={`${ptFV_end.x},${ptFV_end.y} ${ptFV_end.x - 4.5},${ptFV_end.y - 8} ${ptFV_end.x + 4.5},${ptFV_end.y - 8}`}
                        fill="#0d9488"
                      />
                      <rect
                        x={ptFV_end.x - 126}
                        y={ptFV_end.y - 6}
                        width={122}
                        height={15}
                        rx={4}
                        fill="white"
                        stroke="#0d9488"
                        strokeWidth="1"
                        opacity="0.95"
                      />
                      <text
                        x={ptFV_end.x - 65}
                        y={ptFV_end.y + 1.5}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="9"
                        fontWeight="800"
                        fill="#0f766e"
                      >
                        {`FV = ${fvTotalN} N ↓`}
                      </text>

                      {/* Etiqueta do Braço de Momento e Momento Anti-horário em C */}
                      <rect
                        x={ptC.x + 34}
                        y={ptC.y - 10}
                        width={mCBoxW}
                        height={18}
                        rx={5}
                        fill="#fff7ed"
                        stroke="#ea580c"
                        strokeWidth="1.2"
                        opacity="0.96"
                      />
                      <text
                        x={ptC.x + 34 + mCBoxW / 2}
                        y={ptC.y - 1}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="9.5"
                        fontWeight="800"
                        fill="#c2410c"
                      >
                        {mCLabel}
                      </text>
                    </>
                  )}

                  <circle cx={ptCP.x} cy={ptCP.y} r={5} fill="#2563eb" stroke="white" strokeWidth="1.8" />
                  <rect
                    x={ptCP.x - cpBoxW - 10}
                    y={ptCP.y - 24}
                    width={cpBoxW}
                    height={19}
                    rx={5}
                    fill="#eff6ff"
                    stroke="#3b82f6"
                    strokeWidth="1.2"
                    opacity="0.96"
                  />
                  <text
                    x={ptCP.x - cpBoxW / 2 - 10}
                    y={ptCP.y - 14.5}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="10"
                    fontWeight="800"
                    fill="#1e40af"
                  >
                    {cpBadgeText}
                  </text>
                </g>
              );
            })()
          )}
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
        forceH: forceH ?? force,
        showTriangularMode: isTriangularABC,
      })
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
      vectors={vectors}
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
