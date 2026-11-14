import React, { useEffect, useState } from 'react';
import { ContainerComportas } from './ContainerComportas';
import { useSvgPanZoom } from '../../../../src/hooks/useSvgPanZoom';
import {
  FormaComporta,
  PosicaoDobradica,
  FLUIDOS_PREDEFINIDOS,
  SistemaUnidades,
  ModoPosicionamentoComporta,
} from '../dominio/tipos';
import { ResultadoSimulacaoComporta } from '../dominio/resultado';
import {
  CORES_MATERIAIS,
  DIMENSOES_CENA_2D,
} from '../../visual-compartilhado/identidadeVisual';
import {
  DesenhoCota2D,
  FaixaOndulacaoAgua2D,
  MarcadorCG2D,
  SimboloNivelAgua2D,
} from '../../visual-compartilhado/ElementosTecnicos2D';

interface Vista2DProps {
  upstreamLevel: number;
  downstreamLevel: number;
  upstreamFluidKey: string;
  downstreamFluidKey: string;
  upstreamDensity?: number;
  downstreamDensity?: number;
  gravity?: number;
  liveResults?: ResultadoSimulacaoComporta;
  hasGate: boolean;
  gateOpeningPercent?: number;
  gateShape: FormaComporta;
  gateWidth: number;
  gateHeight: number;
  gateDepthFromCrest: number;
  gateInclination: number;
  force: number;
  s_cp: number;
  hingePosition: PosicaoDobradica;
  hasTieRod: boolean;
  hasSmoothWallSupport?: boolean;
  hasSmoothFloorSupport?: boolean;
  hasVerticalWallHingeA?: boolean;
  tieRodPosRel: number;
  tieRodAngle: number;
  gateWeight?: number;
  gateWeightEnabled?: boolean;
  isAnalyzed: boolean;
  onCalculate: () => void;
  onReset: () => void;
  is3D: boolean;
  setIs3D: (v: boolean) => void;
  isFrontalView?: boolean;
  setIsFrontalView?: (v: boolean) => void;
  showVectors: boolean;
  setShowVectors: (v: boolean) => void;
  wallDims: { height: number; thickness: number; width: number };
  sistemaUnidades?: SistemaUnidades;
  modoPosicionamento?: ModoPosicionamentoComporta;
  y_cg_direto?: number;
}

export const Vista2D: React.FC<Vista2DProps> = (props) => {
  const { SVG_W, SVG_H } = DIMENSOES_CENA_2D;

  const showFrontalView = Boolean(props.isFrontalView);
  const [showExerciseDims, setShowExerciseDims] = useState<boolean>(true);

  // Navegação 2D (zoom no cursor, pan com botão do meio ou Espaço + esquerdo, touch e Home)
  const nav = useSvgPanZoom({
    svgWidth: SVG_W,
    svgHeight: SVG_H,
    minZoom: 0.45,
    maxZoom: 4.0,
  });

  // Dimensões reais do viewport SVG para estender terreno e água até as extremidades laterais
  const [svgViewport, setSvgViewport] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 600,
  });

  useEffect(() => {
    const targetEl = nav.svgRef.current ?? nav.containerRef.current;
    if (!targetEl) return;

    const updateSize = () => {
      const rect = targetEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSvgViewport((prev) =>
          Math.abs(prev.width - rect.width) > 1 || Math.abs(prev.height - rect.height) > 1
            ? { width: rect.width, height: rect.height }
            : prev
        );
      }
    };

    updateSize();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateSize);
      ro.observe(targetEl);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [nav.svgRef, nav.containerRef]);

  // Tooltips interativos de pontos notáveis
  const [hoveredItem, setHoveredItem] = useState<'CG' | 'CP' | 'PRISM' | null>(null);

  const isKgf = props.sistemaUnidades === SistemaUnidades.TECNICO_KGF;

  // --- PARAMETERS & GEOMETRY (METRIC & HYDRAULIC) ---
  const thetaDeg = Math.max(15, Math.min(90, props.gateInclination || 60));
  const thetaRad = (thetaDeg * Math.PI) / 180;
  const sinTheta = Math.sin(thetaRad);
  const cosTheta = Math.cos(thetaRad);

  // Direction along incline going downwards into the water
  const u_down = { x: -cosTheta, y: sinTheta };
  // Unit normal pointing into downstream/dry side (down-right, perpendicular to incline)
  const n_out = { x: sinTheta, y: cosTheta };

  const H = Math.max(0.1, props.gateHeight); // gate height along incline (m)
  const W = Math.max(0.1, props.gateWidth); // gate width (m)
  const shape = props.gateShape || FormaComporta.CIRCULAR;
  const openPercent =
    typeof props.gateOpeningPercent === 'number'
      ? Math.max(0, Math.min(100, props.gateOpeningPercent))
      : props.hasGate
      ? 0
      : 100;
  const openFraction = openPercent / 100;
  const isGateClosed = openFraction <= 0;

  // Centroid relative to top of gate along the incline
  let y_cg_rel = H / 2;
  let Area = W * H;
  let Ixx = (W * Math.pow(H, 3)) / 12;

  if (shape === FormaComporta.CIRCULAR) {
    const r = H / 2;
    Area = Math.PI * Math.pow(r, 2);
    y_cg_rel = r;
    Ixx = (Math.PI * Math.pow(r, 4)) / 4;
  } else if (shape === FormaComporta.SEMI_CIRCULAR) {
    const r = H;
    Area = (Math.PI * Math.pow(r, 2)) / 2;
    y_cg_rel = (4 * r) / (3 * Math.PI);
    Ixx = Math.pow(r, 4) * (Math.PI / 8 - 8 / (9 * Math.PI));
  }

  // Posicionamento: Modo Y_CG direto vs Modo Padrão (h1) — sincronizado com liveResults
  const upData = props.liveResults?.forceData?.up;
  let h_top = props.liveResults?.h_top_up !== undefined ? props.liveResults.h_top_up : props.gateDepthFromCrest;
  let Y_CG = 0;
  let Y_top = 0;

  if (
    props.modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO &&
    props.y_cg_direto !== undefined &&
    props.y_cg_direto > 0
  ) {
    Y_CG = upData?.Y_CG ?? props.y_cg_direto;
    const h_CG_nominal = props.y_cg_direto * sinTheta;
    h_top = props.liveResults?.h_top_up ?? (h_CG_nominal - y_cg_rel * sinTheta);
    Y_top = h_top / sinTheta;
  } else {
    Y_top = h_top / sinTheta;
    Y_CG = upData?.Y_CG ?? (Y_top + y_cg_rel);
  }

  if (upData && upData.area > 0) {
    Area = upData.area;
    Ixx = upData.Ixx ?? Ixx;
    y_cg_rel = upData.s_cg ?? y_cg_rel;
  }

  const h_CG = upData?.h_cg ?? (Y_CG * sinTheta);

  // Eccentricity along the incline: delta_y = Ixx / (A * Y_CG)
  const delta_y = upData?.delta_y ?? (Area > 0 && Y_CG > 0 ? Ixx / (Area * Y_CG) : 0);
  const Y_CP = upData?.Y_CP ?? (Y_CG + delta_y);
  const h_CP = upData?.h_cp ?? (Y_CP * sinTheta);
  const h_bot = h_top + H * sinTheta;

  // Fluid properties (respeitando densidade customizada)
  const fluidInfo = FLUIDOS_PREDEFINIDOS[props.upstreamFluidKey] || FLUIDOS_PREDEFINIDOS.agua;
  const rho = props.upstreamDensity ?? props.liveResults?.densityUp ?? fluidInfo.densidade ?? 1000;
  const g = props.gravity ?? 9.81;
  const gamma_N = props.liveResults?.gammaUp ?? (rho * g); // N/m³
  const gamma_kgf = rho; // kgf/m³

  // Pressões no topo e na base da comporta
  const p_top_Pa = upData?.p_top ?? (gamma_N * Math.max(0, h_top));
  const p_bot_Pa = upData?.p_bot ?? (gamma_N * Math.max(0, h_bot));
  const p_cg_Pa = upData?.p_cg ?? (gamma_N * Math.max(0, h_CG));

  // Força resultante teórica ou analisada
  const netForceLive = props.liveResults ? Math.abs(props.liveResults.forceData.FR_net) : p_cg_Pa * Area;
  const F_resultant_N = props.isAnalyzed && Math.abs(props.force) > 0 ? Math.abs(props.force) : netForceLive;
  const F_resultant_kN = F_resultant_N / 1000;
  const F_resultant_kgf = F_resultant_N / g;

  // Pressões formatadas conforme sistema de unidades
  const p_top_disp = isKgf ? (p_top_Pa / g).toFixed(0) : (p_top_Pa / 1000).toFixed(1);
  const p_bot_disp = isKgf ? (p_bot_Pa / g).toFixed(0) : (p_bot_Pa / 1000).toFixed(1);
  const p_unit = isKgf ? 'kgf/m²' : 'kPa';
  const force_disp = isKgf
    ? `${Math.round(F_resultant_kgf).toLocaleString('pt-BR')} kgf`
    : `${F_resultant_kN.toFixed(2).replace('.', ',')} kN`;

  // --- RESPONSIVE SCREEN COORDINATES & PROPORTIONAL AUTO-FIT SCALING (900x520) ---
  const hasSmoothWallSupport = Boolean(props.hasSmoothWallSupport);
  const hasSmoothFloorSupport = Boolean(props.hasSmoothFloorSupport);
  const hasVerticalWallHingeA = Boolean(
    props.hasVerticalWallHingeA || props.liveResults?.equilibrium?.articulacaoParedeVerticalA
  );
  const hasVerticalWallAboveA = hasSmoothWallSupport || hasSmoothFloorSupport || hasVerticalWallHingeA;
  const tanTheta = Math.tan(thetaRad);
  const maxFluidLevel = Math.max(
    props.upstreamLevel || 0,
    hasSmoothFloorSupport ? (props.downstreamLevel || 0) : 0
  );
  const totalWaterDepth = Math.max(h_bot, maxFluidLevel, 0.8);
  const bedMarginM = Math.max(0.28, Math.min(0.75, totalWaterDepth * 0.14));
  const bedDepthM = hasVerticalWallAboveA
    ? Math.max(h_bot, props.upstreamLevel || 0)
    : Math.max(h_bot + bedMarginM, props.upstreamLevel || 0);
  const crestExtraAboveMaxFluid = hasSmoothFloorSupport
    ? Math.max(0.38, (props.downstreamLevel - (props.upstreamLevel || 0)) + 0.38)
    : 0;
  const crestAboveM = Math.max(0.38, Math.min(0.95, totalWaterDepth * 0.18), crestExtraAboveMaxFluid);

  const tieHeadroomM =
    props.hasGate && props.hasTieRod && props.tieRodPosRel < 0
      ? Math.max(0, -(Y_top + props.tieRodPosRel * H) * sinTheta) + 0.45
      : 0;
  const topReachM = Math.max(crestAboveM, tieHeadroomM);

  // Espessuras proporcionais à escala física (padrão estrutural do módulo Barragens)
  const wallThickM = Math.max(0.20, totalWaterDepth * 0.085);
  const slabThickM = Math.max(0.18, totalWaterDepth * 0.075);
  const soilThickM = totalWaterDepth * 0.20;

  // Extensão geométrica real da comporta na vista frontal (em metros)
  const shapeExtentM =
    shape === FormaComporta.RETANGULAR
      ? Math.min(W / 2, H * 1.8)
      : shape === FormaComporta.SEMI_CIRCULAR
      ? H
      : H / 2;

  const slopeRunM = hasVerticalWallAboveA
    ? H * cosTheta
    : bedDepthM / Math.max(0.15, tanTheta);
  const crestRightM = hasVerticalWallHingeA
    ? Math.max(wallThickM + 1.55, Y_top * cosTheta + 0.55)
    : hasVerticalWallAboveA
    ? wallThickM + 1.55
    : crestAboveM / Math.max(0.15, tanTheta) + wallThickM / sinTheta;
  // Reservar espaço fixo na diagramação para que ativar/desativar VISTA FRONTAL ou abrir a comporta
  // nunca desloque, redimensione ou altere o enquadramento da cena principal.
  const frontalRightM = Math.max(
    0,
    2 * shapeExtentM * sinTheta + (H / 2) * cosTheta - (hasVerticalWallAboveA ? 0 : Y_CG * cosTheta)
  );
  const rightExtentM = Math.max(
    crestRightM + (props.downstreamLevel > 0 ? 1.5 : 0.4),
    frontalRightM
  );

  const topPadPx = 88;
  const botPadPx = hasVerticalWallAboveA ? 54 : 38;
  // Reservar sempre o afastamento máximo para cotas e vetores, evitando deslocamento da estrutura ao clicar em Analisar
  const baseProjClear = 148;

  const bottomDepthM = bedDepthM + slabThickM + soilThickM;
  const scaleY1 = (SVG_H - topPadPx - botPadPx) / Math.max(1.2, topReachM + bottomDepthM);

  const frontalBotM = h_bot + 2 * shapeExtentM * cosTheta;
  const frontalBotFixedPx = (baseProjClear + 36) * cosTheta;
  const scaleY2 =
    cosTheta > 0.01 && !hasVerticalWallAboveA
      ? (SVG_H - topPadPx - 24 - frontalBotFixedPx) / Math.max(0.5, topReachM + frontalBotM)
      : Infinity;
  const scaleY = Math.min(scaleY1, scaleY2);

  const leftPadPx = showExerciseDims ? 235 : 145;
  const rightFixedPx = hasVerticalWallAboveA ? 210 : 205;
  const horizSpanM = slopeRunM + rightExtentM;
  const scaleX =
    (SVG_W - 44 - leftPadPx - rightFixedPx) / Math.max(0.8, horizSpanM);

  const SCALE = Math.max(12, Math.min(scaleY, scaleX, 118));
  const maxMeters = Math.max(props.upstreamLevel, bedDepthM, props.downstreamLevel, 3.0);

  const usedBotPx = hasVerticalWallAboveA
    ? (topReachM + bottomDepthM) * SCALE + botPadPx
    : Math.max(
        (topReachM + bottomDepthM) * SCALE + botPadPx,
        (topReachM + frontalBotM) * SCALE + frontalBotFixedPx + 24
      );
  const extraY = Math.max(0, (SVG_H - topPadPx - usedBotPx) / 2);
  const waterSurfaceY = topPadPx + extraY + topReachM * SCALE;

  const leftHalfPx = leftPadPx + slopeRunM * SCALE;
  const rightHalfPx = rightFixedPx + rightExtentM * SCALE;
  const extraX = Math.max(0, (SVG_W - 44 - leftHalfPx - rightHalfPx) / 2);
  const surfX = 22 + leftHalfPx + extraX;
  const P_surf = { x: surfX, y: waterSurfaceY };

  // Helper for points on the inclined plane at distance Y along incline from water surface
  const getInclinePt = (Y_dist: number) => {
    if (hasVerticalWallAboveA) {
      const sDist = Y_dist - Y_top;
      return {
        x: P_surf.x + u_down.x * (sDist * SCALE),
        y: waterSurfaceY + h_top * SCALE + u_down.y * (sDist * SCALE),
      };
    }
    return {
      x: P_surf.x + u_down.x * (Y_dist * SCALE),
      y: P_surf.y + u_down.y * (Y_dist * SCALE),
    };
  };

  const P_top = getInclinePt(Y_top);
  const P_bot = getInclinePt(Y_top + H);
  const P_CG = getInclinePt(Y_CG);
  const P_CP = getInclinePt(Y_CP);

  // Incline extension above water surface (crest of wall)
  const Y_crest_above = crestAboveM / sinTheta;
  const P_crest = hasVerticalWallAboveA
    ? { x: P_top.x, y: waterSurfaceY - crestAboveM * SCALE }
    : {
        x: P_surf.x - u_down.x * (Y_crest_above * SCALE),
        y: P_surf.y - u_down.y * (Y_crest_above * SCALE),
      };

  // Incline extension down to canal bed
  const Y_bed_below = bedDepthM / sinTheta;
  const P_bed_inc = hasVerticalWallAboveA
    ? { x: P_bot.x, y: waterSurfaceY + bedDepthM * SCALE }
    : getInclinePt(Y_bed_below);

  const wallThick = Math.max(15, Math.min(34, wallThickM * SCALE));
  const slabThickPx = Math.max(14, Math.min(28, slabThickM * SCALE));
  const soilThickPx = Math.max(26, Math.min(68, soilThickM * SCALE));
  const wallHorizThick = hasVerticalWallAboveA ? wallThick : wallThick / sinTheta;

  // Limites seguros de conteúdo didático (cotas/NA) e extensão responsiva até as bordas da área de desenho
  const leftBoundX = 22;
  const rightBoundX = SVG_W - 22;
  const meetScale = Math.min(
    Math.max(1, svgViewport.width) / SVG_W,
    Math.max(1, svgViewport.height) / SVG_H
  );
  const viewSpanW = Math.max(SVG_W, svgViewport.width / Math.max(1e-4, meetScale));
  const viewMinX = SVG_W / 2 - viewSpanW / 2;
  const viewMaxX = SVG_W / 2 + viewSpanW / 2;
  const safeZoom = Math.max(0.1, nav.zoom);
  const visibleMinX = (viewMinX - nav.pan.x) / safeZoom;
  const visibleMaxX = (viewMaxX - nav.pan.x) / safeZoom;
  const bleedMargin = 220 / Math.max(0.25, safeZoom);

  const leftCanvasX = Math.min(-320, P_bed_inc.x - 120, visibleMinX - bleedMargin);
  const rightCanvasX = Math.max(
    SVG_W + 320,
    P_bed_inc.x + wallHorizThick + 120,
    visibleMaxX + bleedMargin
  );
  const rightSlabX =
    props.downstreamLevel > 0 || hasSmoothFloorSupport
      ? rightCanvasX
      : hasVerticalWallHingeA
      ? P_bot.x + 28
      : hasSmoothWallSupport
      ? P_top.x + wallThick + 34
      : P_bed_inc.x + wallHorizThick;

  // --- SVG GEOMETRIC MESH / POLYGONS (ordem e padrão visual idênticos a Barragens) ---
  const renderedFaces: any[] = [];

  // 1. Foundation Bed (Earth block contínuo por toda a largura — padrão exato Barragens)
  const soilTopY = P_bed_inc.y + slabThickPx;
  const soilBottomY = soilTopY + soilThickPx;
  renderedFaces.push({
    id: 'canal-bed-base',
    kind: 'DAM',
    pts: [
      { x: leftCanvasX, y: soilTopY },
      { x: rightCanvasX, y: soilTopY },
      { x: rightCanvasX, y: soilBottomY },
      { x: leftCanvasX, y: soilBottomY },
    ],
    fill: CORES_MATERIAIS.terraFill,
    stroke: CORES_MATERIAIS.terraStroke,
    strokeWidth: CORES_MATERIAIS.terraStrokeWidth,
    hatchPattern: CORES_MATERIAIS.terraHatch,
    opacity: 1,
  });

  // 2. Reservoir Water Body (Montante — dupla camada idêntica às faces frontal/traseira de caixaAgua3D em Barragens)
  const upstreamWaterPts = hasVerticalWallAboveA
    ? [
        { x: leftCanvasX, y: waterSurfaceY },
        { x: P_top.x, y: waterSurfaceY },
        P_top,
        props.hasGate ? P_bot : P_top,
        { x: P_bot.x, y: P_bed_inc.y },
        { x: leftCanvasX, y: P_bed_inc.y },
      ]
    : [
        { x: leftCanvasX, y: waterSurfaceY },
        P_surf,
        P_top,
        props.hasGate ? P_bot : P_top,
        P_bed_inc,
        { x: leftCanvasX, y: P_bed_inc.y },
      ];
  renderedFaces.push(
    {
      id: 'water-upstream-body-back',
      kind: 'WATER_UP',
      pts: upstreamWaterPts,
      fill: 'url(#fluidDepthA)',
      stroke: 'none',
      strokeWidth: 0,
      opacity: 1,
    },
    {
      id: 'water-upstream-body',
      kind: 'WATER_UP',
      pts: upstreamWaterPts,
      fill: 'url(#fluidDepthA)',
      stroke: 'none',
      strokeWidth: 0,
      opacity: 1,
    }
  );

  // Helper para cota visual de jusante proporcional ao fundo do canal (y = P_bed_inc.y)
  const gatePlateThick = Math.max(6, Math.min(10, wallThick * 0.36));
  const canalBedSurfaceY = P_bed_inc.y;
  const downRatio =
    props.upstreamLevel > 0
      ? hasSmoothFloorSupport
        ? Math.max(0, props.downstreamLevel / props.upstreamLevel)
        : Math.min(1.12, Math.max(0, props.downstreamLevel / props.upstreamLevel))
      : 0;
  const downRawY = canalBedSurfaceY - downRatio * (canalBedSurfaceY - waterSurfaceY);
  const downDepthY = Math.min(canalBedSurfaceY, Math.max(downRawY, P_crest.y + 6));
  const downStartX = hasSmoothFloorSupport
    ? (downDepthY <= P_top.y
        ? P_top.x + wallThick
        : P_top.x + n_out.x * gatePlateThick + ((downDepthY - P_top.y) / Math.max(1e-4, P_bot.y - P_top.y)) * (P_bot.x - P_top.x))
    : P_surf.x + (u_down.x / u_down.y) * (downDepthY - waterSurfaceY) + wallHorizThick;
  const downBottomLeftX = hasSmoothFloorSupport ? P_bot.x : P_bed_inc.x + wallHorizThick;

  // 3. Downstream water body (if active — dupla camada idêntica às faces frontal/traseira de caixaAgua3D em Barragens)
  if (props.downstreamLevel > 0) {
    const downstreamWaterPts = hasSmoothFloorSupport
      ? downDepthY <= P_top.y
        ? [
            { x: P_top.x + wallThick, y: downDepthY },
            { x: rightCanvasX, y: downDepthY },
            { x: rightCanvasX, y: canalBedSurfaceY },
            { x: P_bot.x, y: canalBedSurfaceY },
            P_bot,
            P_top,
            { x: P_top.x + wallThick, y: P_top.y },
          ]
        : [
            { x: downStartX, y: downDepthY },
            { x: rightCanvasX, y: downDepthY },
            { x: rightCanvasX, y: canalBedSurfaceY },
            { x: P_bot.x, y: canalBedSurfaceY },
            P_bot,
          ]
      : [
          { x: downStartX, y: downDepthY },
          { x: rightCanvasX, y: downDepthY },
          { x: rightCanvasX, y: canalBedSurfaceY },
          { x: downBottomLeftX, y: canalBedSurfaceY },
        ];
    renderedFaces.push(
      {
        id: 'water-downstream-body-back',
        kind: 'WATER_DOWN',
        pts: downstreamWaterPts,
        fill: 'url(#fluidDepthB)',
        stroke: 'none',
        strokeWidth: 0,
        opacity: 1,
      },
      {
        id: 'water-downstream-body',
        kind: 'WATER_DOWN',
        pts: downstreamWaterPts,
        fill: 'url(#fluidDepthB)',
        stroke: 'none',
        strokeWidth: 0,
        opacity: 1,
      }
    );
  }

  // 4. Parede de Concreto e Passagem Contínua de Escoamento (padrão Barragens)
  const liftDist = openFraction * H * SCALE;
  const P_open_top = {
    x: P_top.x + u_down.x * ((1 - openFraction) * H * SCALE),
    y: P_top.y + u_down.y * ((1 - openFraction) * H * SCALE),
  };
  const P_open_top_eff =
    P_open_top.y < waterSurfaceY ? P_surf : P_open_top;
  const hasPositiveFlow =
    !isGateClosed &&
    props.upstreamLevel > 0 &&
    h_bot > 0 &&
    props.upstreamLevel > props.downstreamLevel &&
    P_bot.y > P_open_top_eff.y + 1;

  let flowTopCurvePts: Array<{ x: number; y: number }> = [];
  let flowBotCurvePts: Array<{ x: number; y: number }> = [];
  let flowSurfaceTopPts: Array<{ x: number; y: number }> = [];
  let flowSurfaceBotPts: Array<{ x: number; y: number }> = [];
  let flowTailDepthPx = 0;

  if (hasPositiveFlow) {
    const P_open_top_down = {
      x: P_open_top_eff.x + wallHorizThick,
      y: P_open_top_eff.y,
    };
    const P_open_bot_down = {
      x: P_bot.x + wallHorizThick,
      y: P_bot.y,
    };
    const hasTailwater = props.downstreamLevel > 0;
    const isFullySubmerged = hasTailwater && P_open_top_down.y >= downDepthY - 2;
    const isPartiallySubmerged =
      hasTailwater && !isFullySubmerged && P_open_bot_down.y > downDepthY + 2;
    const steps = 16;

    if (isFullySubmerged) {
      // Abertura totalmente submersa: preenche exatamente a passagem hidráulica pela parede conectando montante e jusante
      flowTopCurvePts = [P_open_top_eff, P_open_top_down];
      flowBotCurvePts = [P_bot, P_open_bot_down];
      flowSurfaceTopPts = [];
      flowSurfaceBotPts = [];
    } else if (isPartiallySubmerged) {
      // Abertura parcialmente submersa: lâmina superior cai até o nível de jusante sem criar recorte submerso
      const openAirH = Math.max(4, downDepthY - P_open_top_down.y);
      const dxPlunge = Math.max(42, Math.min(125, openAirH * 1.15 + 32));
      const xTopLanding = Math.max(downStartX + 18, P_open_top_down.x + dxPlunge);
      const yTopLanding = downDepthY;

      flowTopCurvePts = [P_open_top_eff, P_open_top_down];
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        flowTopCurvePts.push({
          x: P_open_top_down.x + (xTopLanding - P_open_top_down.x) * t,
          y: P_open_top_down.y + (yTopLanding - P_open_top_down.y) * (t * t),
        });
      }

      flowBotCurvePts = [P_bot, P_open_bot_down, { x: downStartX, y: downDepthY }];
      flowTailDepthPx = Math.max(6, Math.min(openAirH * 0.6, 18));
      flowSurfaceTopPts = flowTopCurvePts.slice(1);
      flowSurfaceBotPts = flowSurfaceTopPts.map((p, idx) => {
        const t = idx / Math.max(1, flowSurfaceTopPts.length - 1);
        const yFloor = P_open_bot_down.y + (downDepthY + 2 - P_open_bot_down.y) * t;
        return { x: p.x, y: Math.min(yFloor, p.y + flowTailDepthPx) };
      });
    } else if (hasTailwater) {
      // Abertura acima da lâmina d'água de jusante: jato livre mergulha suavemente no reservatório de jusante
      const openHeightPx = Math.max(4, P_open_bot_down.y - P_open_top_down.y);
      const dropPx = Math.max(0, downDepthY - P_open_bot_down.y);
      flowTailDepthPx = Math.max(6, Math.min(openHeightPx * 0.58, 24));
      const jetReachX = Math.max(64, Math.min(185, 54 + dropPx * 1.05 + openHeightPx * 0.55));

      const xTopLanding = Math.max(downStartX + 24, P_open_top_down.x + jetReachX);
      const xBotLanding = Math.max(
        P_open_bot_down.x + 22,
        xTopLanding - Math.max(14, jetReachX * 0.24)
      );
      const yTopLanding = downDepthY;
      const yBotLanding = Math.min(canalBedSurfaceY, downDepthY + 2);

      flowTopCurvePts = [P_open_top_eff, P_open_top_down];
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        flowTopCurvePts.push({
          x: P_open_top_down.x + (xTopLanding - P_open_top_down.x) * t,
          y: P_open_top_down.y + (yTopLanding - P_open_top_down.y) * (t * t),
        });
      }

      flowBotCurvePts = [P_bot, P_open_bot_down];
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        flowBotCurvePts.push({
          x: P_open_bot_down.x + (xBotLanding - P_open_bot_down.x) * t,
          y: P_open_bot_down.y + (yBotLanding - P_open_bot_down.y) * (t * t),
        });
      }

      flowSurfaceTopPts = flowTopCurvePts.slice(1);
      flowSurfaceBotPts = flowSurfaceTopPts.map((p, idx) => {
        const botMatch = flowBotCurvePts[Math.min(idx + 1, flowBotCurvePts.length - 1)];
        const localMaxH = Math.max(2, botMatch.y - p.y);
        return { x: p.x, y: p.y + Math.min(flowTailDepthPx, localMaxH) };
      });
    } else {
      // Descarga livre sem água a jusante: lâmina curva até o solo de fundação e segue contínua até a borda direita
      const downstreamFloorY = soilTopY;
      const openHeightPx = Math.max(4, P_open_bot_down.y - P_open_top_down.y);
      const dropPx = Math.max(0, downstreamFloorY - P_open_bot_down.y);
      flowTailDepthPx = Math.max(6, Math.min(openHeightPx * 0.58, 26));
      const jetReachX = Math.max(
        85,
        Math.min(195, 72 + dropPx * 1.1 + openHeightPx * 0.65)
      );

      const xTopLanding = P_open_top_down.x + jetReachX;
      const xBotLanding = Math.max(
        P_open_bot_down.x + 28,
        xTopLanding - Math.max(16, jetReachX * 0.24)
      );
      const yTopLanding = downstreamFloorY - flowTailDepthPx;
      const yBotLanding = downstreamFloorY;

      flowTopCurvePts = [P_open_top_eff, P_open_top_down];
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        flowTopCurvePts.push({
          x: P_open_top_down.x + (xTopLanding - P_open_top_down.x) * t,
          y: P_open_top_down.y + (yTopLanding - P_open_top_down.y) * (t * t),
        });
      }
      flowTopCurvePts.push({ x: rightCanvasX, y: yTopLanding });

      flowBotCurvePts = [P_bot, P_open_bot_down];
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        flowBotCurvePts.push({
          x: P_open_bot_down.x + (xBotLanding - P_open_bot_down.x) * t,
          y: P_open_bot_down.y + (yBotLanding - P_open_bot_down.y) * (t * t),
        });
      }
      flowBotCurvePts.push({ x: rightCanvasX, y: yBotLanding });

      flowSurfaceTopPts = flowTopCurvePts.slice(1);
      flowSurfaceBotPts = flowSurfaceTopPts.map((p, idx) => {
        const botMatch = flowBotCurvePts[Math.min(idx + 1, flowBotCurvePts.length - 1)];
        const localMaxH = Math.max(2, botMatch.y - p.y);
        return { x: p.x, y: p.y + Math.min(flowTailDepthPx, localMaxH) };
      });
    }

    const flowSheetPts = [...flowTopCurvePts, ...flowBotCurvePts.slice().reverse()];
    renderedFaces.push(
      {
        id: 'gate-open-flow-sheet-back',
        kind: 'WATER_UP',
        pts: flowSheetPts,
        fill: 'url(#fluidDepthA)',
        stroke: 'none',
        strokeWidth: 0,
        opacity: 1,
      },
      {
        id: 'gate-open-flow-sheet',
        kind: 'WATER_UP',
        pts: flowSheetPts,
        fill: 'url(#fluidDepthA)',
        stroke: 'none',
        strokeWidth: 0,
        opacity: 1,
      }
    );
  }

  if (hasSmoothWallSupport) {
    // Parede vertical lisa à direita apoiando o ponto A (comporta inclinada A-B) + laje de fundo horizontal
    const smoothWallBottomY = P_top.y + 16;
    renderedFaces.push({
      id: 'smooth-vertical-wall-right',
      kind: 'DAM',
      pts: [
        { x: P_top.x, y: P_crest.y },
        { x: P_top.x + wallThick, y: P_crest.y },
        { x: P_top.x + wallThick, y: smoothWallBottomY },
        { x: P_top.x, y: smoothWallBottomY },
      ],
      fill: CORES_MATERIAIS.concretoFill,
      stroke: CORES_MATERIAIS.concretoStroke,
      strokeWidth: 1.2,
      hatchPattern: CORES_MATERIAIS.concretoHatch,
      opacity: 1,
    });
    // Laje horizontal de fundo contínuo sob a água e o apoio B
    renderedFaces.push({
      id: 'smooth-wall-floor-slab',
      kind: 'DAM',
      pts: [
        { x: leftCanvasX, y: P_bed_inc.y },
        { x: rightSlabX, y: P_bed_inc.y },
        { x: rightSlabX, y: soilTopY },
        { x: leftCanvasX, y: soilTopY },
      ],
      fill: CORES_MATERIAIS.concretoFill,
      stroke: 'none',
      strokeWidth: 0,
      hatchPattern: CORES_MATERIAIS.concretoHatch,
      opacity: 1,
    });
    // Pedestal sob B se B estiver acima da cota do fundo do reservatório
    if (P_bot.y < P_bed_inc.y - 2) {
      renderedFaces.push({
        id: 'hinge-b-pedestal',
        kind: 'DAM',
        pts: [
          { x: P_bot.x - 14, y: P_bot.y },
          { x: P_bot.x + 14, y: P_bot.y },
          { x: P_bot.x + 14, y: P_bed_inc.y },
          { x: P_bot.x - 14, y: P_bed_inc.y },
        ],
        fill: CORES_MATERIAIS.concretoFill,
        stroke: CORES_MATERIAIS.concretoStroke,
        strokeWidth: 1,
        hatchPattern: CORES_MATERIAIS.concretoHatch,
        opacity: 1,
      });
    }
  } else if (hasSmoothFloorSupport || hasVerticalWallHingeA) {
    // Parede vertical estritamente acima da articulação A
    renderedFaces.push({
      id: 'partition-vertical-wall-above-A',
      kind: 'DAM',
      pts: [
        { x: P_top.x, y: P_crest.y },
        { x: P_top.x + wallThick, y: P_crest.y },
        { x: P_top.x + wallThick, y: P_top.y },
        { x: P_top.x, y: P_top.y },
      ],
      fill: CORES_MATERIAIS.concretoFill,
      stroke: CORES_MATERIAIS.concretoStroke,
      strokeWidth: 1.2,
      hatchPattern: CORES_MATERIAIS.concretoHatch,
      opacity: 1,
    });
    // Laje horizontal de fundo sob o reservatório e a base da comporta
    renderedFaces.push({
      id: 'smooth-floor-slab',
      kind: 'DAM',
      pts: [
        { x: leftCanvasX, y: P_bed_inc.y },
        { x: rightSlabX, y: P_bed_inc.y },
        { x: rightSlabX, y: soilTopY },
        { x: leftCanvasX, y: soilTopY },
      ],
      fill: CORES_MATERIAIS.concretoFill,
      stroke: hasVerticalWallHingeA ? CORES_MATERIAIS.concretoStroke : 'none',
      strokeWidth: hasVerticalWallHingeA ? 1.1 : 0,
      hatchPattern: CORES_MATERIAIS.concretoHatch,
      opacity: 1,
    });
    if (P_bot.y < P_bed_inc.y - 2) {
      renderedFaces.push({
        id: 'floor-b-pedestal',
        kind: 'DAM',
        pts: [
          { x: P_bot.x - 14, y: P_bot.y },
          { x: P_bot.x + 14, y: P_bot.y },
          { x: P_bot.x + 14, y: P_bed_inc.y },
          { x: P_bot.x - 14, y: P_bed_inc.y },
        ],
        fill: CORES_MATERIAIS.concretoFill,
        stroke: CORES_MATERIAIS.concretoStroke,
        strokeWidth: 1,
        hatchPattern: CORES_MATERIAIS.concretoHatch,
        opacity: 1,
      });
    }
  } else if (isGateClosed) {
    renderedFaces.push({
      id: 'wall-full-masonry',
      kind: 'DAM',
      pts: [
        P_crest,
        { x: P_crest.x + wallHorizThick, y: P_crest.y },
        { x: P_bed_inc.x + wallHorizThick, y: P_bed_inc.y },
        { x: rightSlabX, y: P_bed_inc.y },
        { x: rightSlabX, y: soilTopY },
        { x: leftCanvasX, y: soilTopY },
        { x: leftCanvasX, y: P_bed_inc.y },
        P_bed_inc,
      ],
      fill: CORES_MATERIAIS.concretoFill,
      stroke: 'none',
      strokeWidth: 0,
      hatchPattern: CORES_MATERIAIS.concretoHatch,
      opacity: 1,
    });
  } else {
    if (P_top.y > P_crest.y + 1) {
      renderedFaces.push({
        id: 'wall-upper-masonry',
        kind: 'DAM',
        pts: [
          P_crest,
          { x: P_crest.x + wallHorizThick, y: P_crest.y },
          { x: P_top.x + wallHorizThick, y: P_top.y },
          P_top,
        ],
        fill: CORES_MATERIAIS.concretoFill,
        stroke: 'none',
        strokeWidth: 0,
        hatchPattern: CORES_MATERIAIS.concretoHatch,
        opacity: 1,
      });
    }
    const lowerTopPt = P_bot.y <= P_bed_inc.y ? P_bot : P_bed_inc;
    renderedFaces.push({
      id: 'wall-lower-masonry',
      kind: 'DAM',
      pts: [
        lowerTopPt,
        { x: lowerTopPt.x + wallHorizThick, y: lowerTopPt.y },
        { x: P_bed_inc.x + wallHorizThick, y: P_bed_inc.y },
        { x: rightSlabX, y: P_bed_inc.y },
        { x: rightSlabX, y: soilTopY },
        { x: leftCanvasX, y: soilTopY },
        { x: leftCanvasX, y: P_bed_inc.y },
        P_bed_inc,
      ],
      fill: CORES_MATERIAIS.concretoFill,
      stroke: 'none',
      strokeWidth: 0,
      hatchPattern: CORES_MATERIAIS.concretoHatch,
      opacity: 1,
    });
  }

  // 6. Gate Plate on the Incline (Fechada, Parcialmente aberta ou Aberta)
  if (isGateClosed) {
    renderedFaces.push({
      id: 'gate-incline-plate',
      kind: 'GATE',
      pts: [
        P_top,
        { x: P_top.x + n_out.x * gatePlateThick, y: P_top.y + n_out.y * gatePlateThick },
        { x: P_bot.x + n_out.x * gatePlateThick, y: P_bot.y + n_out.y * gatePlateThick },
        P_bot,
      ],
      fill: 'url(#metalLinear)',
      stroke: '#0f172a',
      strokeWidth: 1.5,
      opacity: 1,
    });
  } else {
    // Raised/partially-open or fully-open gate
    renderedFaces.push({
      id: openFraction >= 1 ? 'gate-incline-raised' : 'gate-incline-partial',
      kind: 'GATE',
      pts: [
        { x: P_top.x - u_down.x * liftDist, y: P_top.y - u_down.y * liftDist },
        {
          x: P_top.x - u_down.x * liftDist + n_out.x * gatePlateThick,
          y: P_top.y - u_down.y * liftDist + n_out.y * gatePlateThick,
        },
        {
          x: P_bot.x - u_down.x * liftDist + n_out.x * gatePlateThick,
          y: P_bot.y - u_down.y * liftDist + n_out.y * gatePlateThick,
        },
        { x: P_bot.x - u_down.x * liftDist, y: P_bot.y - u_down.y * liftDist },
      ],
      fill: 'url(#metalLinear)',
      stroke: '#0f172a',
      strokeWidth: 1.5,
      opacity: openFraction >= 1 ? 0.9 : 1,
    });
  }

  // --- VECTORS (paleta oficial Barragens) ---
  const vectors: any[] = [];
  if (isGateClosed && props.showVectors) {
    if (props.isAnalyzed) {
      const numRays = 5;
      for (let i = 0; i <= numRays; i++) {
        const t = i / numRays;
        const pt = {
          x: P_top.x + u_down.x * (t * H * SCALE),
          y: P_top.y + u_down.y * (t * H * SCALE),
        };
        const depth_i = (pt.y - waterSurfaceY) / SCALE;
        if (depth_i > 0) {
          const len_ray = Math.max(10, Math.min(48, (depth_i / maxMeters) * 52));
          vectors.push({
            start: { x: pt.x - n_out.x * len_ray, y: pt.y - n_out.y * len_ray },
            end: { x: pt.x, y: pt.y },
            color: CORES_MATERIAIS.vetorDistribuicaoMontante,
            strokeWidth: 1.35,
            opacity: 0.78,
            isResultant: false,
          });
        }
      }
    }
  }

  // --- OVERLAY ELEMENTS (ONDULAÇÕES DO ESCOAMENTO, DOBRADIÇA, TIRANTES) ---
  const overlayElements: React.ReactNode[] = [];

  // 3. Ondulações e contorno discreto na superfície livre do escoamento contínuo
  if (hasPositiveFlow && flowSurfaceTopPts.length >= 2 && flowSurfaceBotPts.length >= 2) {
    const exitTopPathD = `M ${flowSurfaceTopPts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' L ')}`;
    const rippleBandPtsStr = [...flowSurfaceTopPts, ...flowSurfaceBotPts.slice().reverse()]
      .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ');

    overlayElements.push(
      <g key="gate-open-flow-discharge" pointerEvents="none">
        <polygon points={rippleBandPtsStr} fill="url(#ripplePattern)" opacity={0.85} />
        <path
          d={exitTopPathD}
          fill="none"
          stroke={CORES_MATERIAIS.aguaSuperficie}
          strokeWidth={1.2}
          opacity={0.78}
          strokeLinejoin="round"
        />
        <path
          d={exitTopPathD}
          fill="none"
          stroke={CORES_MATERIAIS.aguaLinhaSuperficie}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      </g>
    );
  }

  // Hinge / Central Rotation Axis if configured
  if (isGateClosed && props.hingePosition !== PosicaoDobradica.NONE) {
    const isCenterAxis = props.hingePosition === PosicaoDobradica.CENTER;
    const hingePt =
      props.hingePosition === PosicaoDobradica.TOP
        ? P_top
        : isCenterAxis
        ? P_CG
        : P_bot;
    const M_axis_N =
      props.liveResults?.equilibrium?.M_abertura_eixo ??
      props.liveResults?.equilibrium?.M_hinge ??
      F_resultant_N * delta_y;
    const M_axis_disp = isKgf
      ? `${Math.round(Math.abs(M_axis_N) / g).toLocaleString('pt-BR')} kgf·m`
      : `${(Math.abs(M_axis_N) / 1000).toFixed(2).replace('.', ',')} kN·m`;

    overlayElements.push(
      <g key="hinge-indicator">
        {hasSmoothWallSupport && (
          <path
            d={`M ${hingePt.x},${hingePt.y} L ${hingePt.x - 10},${hingePt.y + 13} L ${hingePt.x + 10},${hingePt.y + 13} Z`}
            fill="#fef3c7"
            stroke="#78350f"
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        )}
        {hasSmoothFloorSupport && (
          <path
            d={`M ${hingePt.x},${hingePt.y} L ${hingePt.x - 9},${hingePt.y - 13} L ${hingePt.x + 9},${hingePt.y - 13} Z`}
            fill="#fef3c7"
            stroke="#78350f"
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        )}
        {isCenterAxis ? (
          <g>
            {/* Mancal do Eixo de Rotação Central (passando pelo CG / diâmetro horizontal) */}
            <circle cx={hingePt.x} cy={hingePt.y} r={10.5} fill="#e2e8f0" stroke="#334155" strokeWidth={1.8} />
            <circle cx={hingePt.x} cy={hingePt.y} r={7} fill="#f59e0b" stroke="#78350f" strokeWidth={1.8} />
            <circle cx={hingePt.x} cy={hingePt.y} r={2.8} fill="#ffffff" />

            {/* Rótulo do Eixo Central */}
            <g transform={`translate(${hingePt.x + n_out.x * 26 - u_down.x * 22}, ${hingePt.y + n_out.y * 26 - u_down.y * 22})`}>
              <rect
                x={-48}
                y={-9.5}
                width={96}
                height={19}
                rx={9.5}
                fill="#0f172a"
                opacity={0.9}
                stroke="#f59e0b"
                strokeWidth={1.1}
              />
              <text
                x={0}
                y={0.5}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#fef3c7"
                fontSize="9"
                fontWeight="800"
              >
                Eixo Central (CG)
              </text>
            </g>

            {/* Seta Curva do Momento de Abertura M aplicado no Eixo Central (sentido horário) */}
            {props.isAnalyzed && props.showVectors && (() => {
              const rArc = 26;
              // Arco horário em torno de P_CG (de -140° a +30° no sistema SVG onde +Y é para baixo)
              const aStart = (-145 * Math.PI) / 180;
              const aEnd = (25 * Math.PI) / 180;
              const x1 = hingePt.x + rArc * Math.cos(aStart);
              const y1 = hingePt.y + rArc * Math.sin(aStart);
              const x2 = hingePt.x + rArc * Math.cos(aEnd);
              const y2 = hingePt.y + rArc * Math.sin(aEnd);
              const mText = `M = ${M_axis_disp} (↻)`;
              const mPillW = Math.max(114, mText.length * 6.1 + 18);
              const mPillX = hingePt.x + n_out.x * 48 + u_down.x * 36;
              const mPillY = hingePt.y + n_out.y * 48 + u_down.y * 36;
              const eText = `e = ${(delta_y * 100).toFixed(2).replace('.', ',')} cm (${delta_y.toFixed(4).replace('.', ',')} m)`;
              const ePillW = Math.max(134, eText.length * 5.8 + 16);

              return (
                <g key="central-axis-opening-moment">
                  <path
                    d={`M ${x1},${y1} A ${rArc} ${rArc} 0 1 1 ${x2},${y2}`}
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth={2.8}
                    markerEnd="url(#arrow-reaction)"
                  />
                  <g transform={`translate(${mPillX}, ${mPillY})`}>
                    <rect
                      x={-mPillW / 2}
                      y={-11}
                      width={mPillW}
                      height={22}
                      rx={11}
                      fill="#ffffff"
                      opacity={0.96}
                      stroke="#7c3aed"
                      strokeWidth={1.4}
                    />
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#6d28d9"
                      fontSize="10"
                      fontWeight="800"
                    >
                      {mText}
                    </text>
                  </g>
                  <g transform={`translate(${mPillX}, ${mPillY + 23})`}>
                    <rect
                      x={-ePillW / 2}
                      y={-9.5}
                      width={ePillW}
                      height={19}
                      rx={9.5}
                      fill="#f8fafc"
                      opacity={0.95}
                      stroke="#cbd5e1"
                      strokeWidth={1}
                    />
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#334155"
                      fontSize="9.2"
                      fontWeight="700"
                    >
                      {eText}
                    </text>
                  </g>
                </g>
              );
            })()}
          </g>
        ) : (
          <>
            <circle cx={hingePt.x} cy={hingePt.y} r={7} fill="#f59e0b" stroke="#78350f" strokeWidth={2} />
            <circle cx={hingePt.x} cy={hingePt.y} r={2.5} fill="#ffffff" />
            {hasVerticalWallHingeA && (
              <g transform={`translate(${hingePt.x + 16}, ${hingePt.y + 12})`}>
                <circle cx={0} cy={0} r={9.5} fill="#0f172a" stroke="#ffffff" strokeWidth={1.5} />
                <text
                  x={0}
                  y={0.5}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#ffffff"
                  fontSize="10.5"
                  fontWeight="900"
                >
                  A
                </text>
              </g>
            )}
          </>
        )}
      </g>
    );
  }

  // Smooth wall contact symbol at A + A/B node labels + Reaction vectors (P, Bx, By)
  if (hasSmoothWallSupport) {
    const P_apoio_N = props.liveResults?.equilibrium?.P_apoio ?? 0;
    const Bx_N = props.liveResults?.equilibrium?.Rx_hinge ?? 0;
    const By_N = props.liveResults?.equilibrium?.Ry_hinge ?? 0;
    const fmtForceVal = (valN: number) =>
      isKgf
        ? `${Math.round(Math.abs(valN) / g).toLocaleString('pt-BR')} kgf`
        : `${(Math.abs(valN) / 1000).toFixed(2).replace('.', ',')} kN`;

    overlayElements.push(
      <g key="smooth-wall-support-and-labels">
        {/* Linha lisa vertical de contato da parede à direita em A */}
        <line
          x1={P_top.x}
          y1={P_top.y - 12}
          x2={P_top.x}
          y2={P_top.y + 16}
          stroke="#0f766e"
          strokeWidth={2.5}
        />
        {/* Símbolo de apoio liso (rolete vertical sem atrito em A) */}
        <circle cx={P_top.x - 3.5} cy={P_top.y - 4} r={3} fill="#ecfdf5" stroke="#0f766e" strokeWidth={1.4} />
        <circle cx={P_top.x - 3.5} cy={P_top.y + 4} r={3} fill="#ecfdf5" stroke="#0f766e" strokeWidth={1.4} />

        {/* Rótulos nodais A (topo na parede lisa) e B (articulação na base) */}
        <g transform={`translate(${P_top.x - 16}, ${P_top.y - 14})`}>
          <circle cx={0} cy={0} r={9.5} fill="#0f172a" stroke="#ffffff" strokeWidth={1.5} />
          <text
            x={0}
            y={0.5}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#ffffff"
            fontSize="10.5"
            fontWeight="900"
          >
            A
          </text>
        </g>

        <g transform={`translate(${P_bot.x - 18}, ${P_bot.y - 14})`}>
          <circle cx={0} cy={0} r={9.5} fill="#0f172a" stroke="#ffffff" strokeWidth={1.5} />
          <text
            x={0}
            y={0.5}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#ffffff"
            fontSize="10.5"
            fontWeight="900"
          >
            B
          </text>
        </g>

        {/* Vetores de Reação nos Apoios A (P) e B (Bx, By) após análise */}
        {isGateClosed && props.isAnalyzed && props.showVectors && (
          <g key="support-reaction-vectors">
            {/* Reação Horizontal P no apoio A (empurrando para a esquerda contra A) */}
            {Math.abs(P_apoio_N) > 1e-3 && (() => {
              const pDir = P_apoio_N >= 0 ? -1 : 1; // + = para a esquerda (-X)
              const startX = P_top.x + wallThick + 66;
              const endX = P_top.x + 6;
              const pLabel = `P = ${fmtForceVal(P_apoio_N)}`;
              const pillW = Math.max(88, pLabel.length * 6.3 + 16);
              const pillX = P_top.x + wallThick + 50;
              const pillY = P_top.y - 22;
              return (
                <g>
                  <line
                    x1={pDir < 0 ? startX : endX}
                    y1={P_top.y}
                    x2={pDir < 0 ? endX : startX}
                    y2={P_top.y}
                    stroke="#7c3aed"
                    strokeWidth={3}
                    markerEnd="url(#arrow-reaction)"
                  />
                  <g transform={`translate(${pillX}, ${pillY})`}>
                    <rect
                      x={-pillW / 2}
                      y={-11}
                      width={pillW}
                      height={22}
                      rx={11}
                      fill="#ffffff"
                      opacity={0.95}
                      stroke="#7c3aed"
                      strokeWidth={1.3}
                    />
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#6d28d9"
                      fontSize="10.5"
                      fontWeight="bold"
                    >
                      {pLabel}
                    </text>
                  </g>
                </g>
              );
            })()}

            {/* Reação Horizontal Bx na articulação B */}
            {Math.abs(Bx_N) > 1e-3 && (() => {
              const bxRight = Bx_N >= 0;
              const startX = bxRight ? P_bot.x + 10 : P_bot.x - 10;
              const endX = bxRight ? P_bot.x + 76 : P_bot.x - 76;
              const bxLabel = `Bx = ${fmtForceVal(Bx_N)}`;
              const pillW = Math.max(88, bxLabel.length * 6.3 + 16);
              const pillX = bxRight ? P_bot.x + 86 : P_bot.x - 86;
              const pillY = P_bot.y + 18;
              return (
                <g>
                  <line
                    x1={startX}
                    y1={P_bot.y}
                    x2={endX}
                    y2={P_bot.y}
                    stroke="#7c3aed"
                    strokeWidth={2.8}
                    markerEnd="url(#arrow-reaction)"
                  />
                  <g transform={`translate(${pillX}, ${pillY})`}>
                    <rect
                      x={-pillW / 2}
                      y={-10.5}
                      width={pillW}
                      height={21}
                      rx={10.5}
                      fill="#ffffff"
                      opacity={0.95}
                      stroke="#7c3aed"
                      strokeWidth={1.2}
                    />
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#6d28d9"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      B<tspan baselineShift="sub" fontSize="7.5">x</tspan> = {fmtForceVal(Bx_N)}
                    </text>
                  </g>
                </g>
              );
            })()}

            {/* Reação Vertical By na articulação B */}
            {Math.abs(By_N) > 1e-3 && (() => {
              const byUp = By_N >= 0;
              const startY = byUp ? P_bot.y + 66 : P_bot.y - 66;
              const endY = byUp ? P_bot.y + 10 : P_bot.y - 10;
              const byLabel = `By = ${fmtForceVal(By_N)}`;
              const pillW = Math.max(92, byLabel.length * 6.3 + 16);
              const pillX = P_bot.x - 62;
              const pillY = P_bot.y + 44;
              return (
                <g>
                  <line
                    x1={P_bot.x}
                    y1={startY}
                    x2={P_bot.x}
                    y2={endY}
                    stroke="#7c3aed"
                    strokeWidth={2.8}
                    markerEnd="url(#arrow-reaction)"
                  />
                  <g transform={`translate(${pillX}, ${pillY})`}>
                    <rect
                      x={-pillW / 2}
                      y={-10.5}
                      width={pillW}
                      height={21}
                      rx={10.5}
                      fill="#ffffff"
                      opacity={0.95}
                      stroke="#7c3aed"
                      strokeWidth={1.2}
                    />
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#6d28d9"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      B<tspan baselineShift="sub" fontSize="7.5">y</tspan> = {fmtForceVal(By_N)}
                    </text>
                  </g>
                </g>
              );
            })()}
          </g>
        )}
      </g>
    );
  }

  // Tie rod if configured
  if (isGateClosed && props.hasTieRod) {
    const tPt = {
      x: P_top.x + u_down.x * (props.tieRodPosRel * H * SCALE),
      y: P_top.y + u_down.y * (props.tieRodPosRel * H * SCALE),
    };
    const rodAngRad = (props.tieRodAngle * Math.PI) / 180;
    const rodLen = 75;
    const endPt = {
      x: tPt.x + Math.cos(rodAngRad) * rodLen,
      y: tPt.y - Math.sin(rodAngRad) * rodLen,
    };
    overlayElements.push(
      <g key="tierod-indicator">
        <line x1={tPt.x} y1={tPt.y} x2={endPt.x} y2={endPt.y} stroke="#64748b" strokeWidth={3} strokeDasharray="5 3" />
        <rect x={endPt.x - 5} y={endPt.y - 5} width={10} height={10} fill="#334155" rx={2} />
      </g>
    );
  }

  // --- DIAGRAMA DE PRESSÃO TRAPEZOIDAL SOBRE A COMPORTA ---
  const renderPressurePrism = () => {
    if (!isGateClosed || !props.isAnalyzed || !props.showVectors) return null;

    if (hasSmoothFloorSupport) {
      const downData = props.liveResults?.forceData?.down;
      const p_top_g = upData?.p_top ?? p_top_Pa;
      const p_bot_g = upData?.p_bot ?? p_bot_Pa;
      const p_top_a = downData?.p_top ?? 0;
      const p_bot_a = downData?.p_bot ?? 0;
      const maxP_both = Math.max(1, p_bot_g, p_bot_a);
      const maxDiagW = 50;

      const w_top_g = (p_top_g / maxP_both) * maxDiagW;
      const w_bot_g = (p_bot_g / maxP_both) * maxDiagW;
      const ptTopOuterL = { x: P_top.x - n_out.x * w_top_g, y: P_top.y - n_out.y * w_top_g };
      const ptBotOuterL = { x: P_bot.x - n_out.x * w_bot_g, y: P_bot.y - n_out.y * w_bot_g };
      const prismPathL = `M ${P_top.x},${P_top.y} L ${ptTopOuterL.x},${ptTopOuterL.y} L ${ptBotOuterL.x},${ptBotOuterL.y} L ${P_bot.x},${P_bot.y} Z`;

      const Fg_N = upData?.FR ?? F_resultant_N;
      const Fg_disp = isKgf
        ? `${Math.round(Fg_N / g).toLocaleString('pt-BR')} kgf`
        : `${(Fg_N / 1000).toFixed(2).replace('.', ',')} kN`;
      const fgText = `Fg = ${Fg_disp}`;
      const fgPillW = Math.max(84, fgText.length * 6.3 + 18);
      const s_cp_up = upData?.s_cp ?? (Y_CP - Y_top);
      const P_CP_up = {
        x: P_top.x + u_down.x * (s_cp_up * SCALE),
        y: P_top.y + u_down.y * (s_cp_up * SCALE),
      };
      const fgStart = {
        x: P_CP_up.x - n_out.x * (maxDiagW + 34),
        y: P_CP_up.y - n_out.y * (maxDiagW + 34),
      };

      const hasDownPrism = props.downstreamLevel > 0 && (downData?.FR ?? 0) > 1e-2;
      const P_top_right = { x: P_top.x + n_out.x * gatePlateThick, y: P_top.y + n_out.y * gatePlateThick };
      const P_bot_right = { x: P_bot.x + n_out.x * gatePlateThick, y: P_bot.y + n_out.y * gatePlateThick };
      const wetDownLen = Math.min(H, Math.max(0, props.downstreamLevel / sinTheta));
      const P_down_top_right =
        props.downstreamLevel >= H * sinTheta
          ? P_top_right
          : {
              x: P_bot_right.x - u_down.x * (wetDownLen * SCALE),
              y: P_bot_right.y - u_down.y * (wetDownLen * SCALE),
            };
      const w_top_a = (p_top_a / maxP_both) * maxDiagW;
      const w_bot_a = (p_bot_a / maxP_both) * maxDiagW;
      const ptTopOuterR = { x: P_down_top_right.x + n_out.x * w_top_a, y: P_down_top_right.y + n_out.y * w_top_a };
      const ptBotOuterR = { x: P_bot_right.x + n_out.x * w_bot_a, y: P_bot_right.y + n_out.y * w_bot_a };
      const prismPathR = `M ${P_down_top_right.x},${P_down_top_right.y} L ${ptTopOuterR.x},${ptTopOuterR.y} L ${ptBotOuterR.x},${ptBotOuterR.y} L ${P_bot_right.x},${P_bot_right.y} Z`;

      const Fa_N = downData?.FR ?? 0;
      const Fa_disp = isKgf
        ? `${Math.round(Fa_N / g).toLocaleString('pt-BR')} kgf`
        : `${(Fa_N / 1000).toFixed(2).replace('.', ',')} kN`;
      const faText = `Fa = ${Fa_disp}`;
      const faPillW = Math.max(84, faText.length * 6.3 + 18);
      const s_cp_down = downData?.s_cp ?? H * 0.53;
      const P_CP_down = {
        x: P_top_right.x + u_down.x * (s_cp_down * SCALE),
        y: P_top_right.y + u_down.y * (s_cp_down * SCALE),
      };
      const faStart = {
        x: P_CP_down.x + n_out.x * (maxDiagW + 34),
        y: P_CP_down.y + n_out.y * (maxDiagW + 34),
      };

      return (
        <g key="dual-pressure-trapezoidal-diagrams" className="animate-in fade-in duration-300">
          {/* Prisma da Glicerina (esquerda) */}
          <path
            d={prismPathL}
            fill="url(#pressurePrismGlyGrad)"
            stroke="#6d28d9"
            strokeWidth={1.5}
            strokeLinejoin="round"
            opacity={0.88}
          />
          {[0.25, 0.5, 0.75].map((t, idx) => {
            const pIn = { x: P_top.x + u_down.x * (t * H * SCALE), y: P_top.y + u_down.y * (t * H * SCALE) };
            const wt = w_top_g + t * (w_bot_g - w_top_g);
            const pOut = { x: pIn.x - n_out.x * wt, y: pIn.y - n_out.y * wt };
            return (
              <line
                key={`gly-ray-${idx}`}
                x1={pOut.x}
                y1={pOut.y}
                x2={pIn.x}
                y2={pIn.y}
                stroke="#8b5cf6"
                strokeWidth={1}
                strokeDasharray="3 2"
                opacity={0.75}
              />
            );
          })}
          <line
            x1={fgStart.x}
            y1={fgStart.y}
            x2={P_CP_up.x}
            y2={P_CP_up.y}
            stroke="#6d28d9"
            strokeWidth={3.4}
            markerEnd="url(#arrow-glycerin)"
          />
          <g transform={`translate(${fgStart.x - n_out.x * (fgPillW * 0.44)}, ${fgStart.y - 14})`}>
            <rect
              x={-fgPillW / 2}
              y={-11}
              width={fgPillW}
              height={22}
              rx={11}
              fill="#ffffff"
              opacity={0.95}
              stroke="#7c3aed"
              strokeWidth={1.2}
            />
            <text
              x={0}
              y={0}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#5b21b6"
              fontSize="10.5"
              fontWeight="bold"
            >
              F<tspan baselineShift="sub" fontSize="7.5">g</tspan> = {Fg_disp}
            </text>
          </g>

          {/* Prisma da Água a jusante (direita) */}
          {hasDownPrism && (
            <g>
              <path
                d={prismPathR}
                fill="url(#pressurePrismDownGrad)"
                stroke={CORES_MATERIAIS.vetorResultante}
                strokeWidth={1.5}
                strokeLinejoin="round"
                opacity={0.88}
              />
              {[0.25, 0.5, 0.75].map((t, idx) => {
                const pIn = {
                  x: P_down_top_right.x + (P_bot_right.x - P_down_top_right.x) * t,
                  y: P_down_top_right.y + (P_bot_right.y - P_down_top_right.y) * t,
                };
                const wt = w_top_a + t * (w_bot_a - w_top_a);
                const pOut = { x: pIn.x + n_out.x * wt, y: pIn.y + n_out.y * wt };
                return (
                  <line
                    key={`wat-ray-${idx}`}
                    x1={pOut.x}
                    y1={pOut.y}
                    x2={pIn.x}
                    y2={pIn.y}
                    stroke={CORES_MATERIAIS.aguaSuperficie}
                    strokeWidth={1}
                    strokeDasharray="3 2"
                    opacity={0.75}
                  />
                );
              })}
              <line
                x1={faStart.x}
                y1={faStart.y}
                x2={P_CP_down.x}
                y2={P_CP_down.y}
                stroke={CORES_MATERIAIS.vetorResultante}
                strokeWidth={3.4}
                markerEnd="url(#arrow-thrust)"
              />
              <g transform={`translate(${faStart.x + n_out.x * (faPillW * 0.44)}, ${faStart.y - 14})`}>
                <rect
                  x={-faPillW / 2}
                  y={-11}
                  width={faPillW}
                  height={22}
                  rx={11}
                  fill="#ffffff"
                  opacity={0.95}
                  stroke={CORES_MATERIAIS.vetorPillBorda}
                  strokeWidth={1.2}
                />
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={CORES_MATERIAIS.vetorPillTexto}
                  fontSize="10.5"
                  fontWeight="bold"
                >
                  F<tspan baselineShift="sub" fontSize="7.5">a</tspan> = {Fa_disp}
                </text>
              </g>
            </g>
          )}
        </g>
      );
    }

    const maxP = Math.max(1, p_bot_Pa);
    const maxDiagWidth = 54; // px
    const w_top = (p_top_Pa / maxP) * maxDiagWidth;
    const w_bot = maxDiagWidth;

    const ptTopOuter = { x: P_top.x - n_out.x * w_top, y: P_top.y - n_out.y * w_top };
    const ptBotOuter = { x: P_bot.x - n_out.x * w_bot, y: P_bot.y - n_out.y * w_bot };

    // Ponto de interseção do plano inclinado da comporta com a superfície livre (p_man = 0)
    const P_surf_incline = {
      x: P_top.x - u_down.x * (Y_top * SCALE),
      y: waterSurfaceY,
    };

    const prismPath = `M ${P_top.x},${P_top.y} L ${ptTopOuter.x},${ptTopOuter.y} L ${ptBotOuter.x},${ptBotOuter.y} L ${P_bot.x},${P_bot.y} Z`;
    const triangleZeroPath = `M ${P_surf_incline.x},${P_surf_incline.y} L ${ptTopOuter.x},${ptTopOuter.y} L ${P_top.x},${P_top.y} Z`;

    const eStart = {
      x: P_CP.x - n_out.x * (maxDiagWidth + 36),
      y: P_CP.y - n_out.y * (maxDiagWidth + 36),
    };

    const forceText = hasVerticalWallHingeA ? `FR = ${force_disp}` : `E = ${force_disp}`;
    const pillW = Math.max(82, forceText.length * 6.5 + 18);

    return (
      <g
        key="pressure-trapezoidal-diagram"
        className="animate-in fade-in duration-300 transition-opacity"
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setHoveredItem('PRISM')}
        onMouseLeave={() => setHoveredItem(null)}
      >
        {/* Extensão triangular desde a superfície livre (p = 0) até o topo A da comporta (Exemplo 3.5) */}
        {hasVerticalWallHingeA && Y_top > 0.05 && (
          <g pointerEvents="none">
            {/* Prolongamento tracejado da superfície livre até a interseção com o plano inclinado */}
            <line
              x1={P_top.x}
              y1={waterSurfaceY}
              x2={P_surf_incline.x + 18}
              y2={waterSurfaceY}
              stroke="#0284c7"
              strokeWidth={1.2}
              strokeDasharray="4 3"
              opacity={0.75}
            />
            {/* Prolongamento do plano da comporta até a superfície livre (y = 0, p = 0) */}
            <line
              x1={P_top.x}
              y1={P_top.y}
              x2={P_surf_incline.x}
              y2={P_surf_incline.y}
              stroke="#475569"
              strokeWidth={1.2}
              strokeDasharray="4 3"
              opacity={0.75}
            />
            {/* Triângulo tracejado de pressão desde p = 0 na superfície livre até p_A em A */}
            <path
              d={triangleZeroPath}
              fill="url(#pressurePrismGrad)"
              fillOpacity={0.28}
              stroke={CORES_MATERIAIS.vetorResultante}
              strokeWidth={1.2}
              strokeDasharray="4 3"
              opacity={0.75}
            />
            <circle cx={P_surf_incline.x} cy={P_surf_incline.y} r={3} fill="#0284c7" />
            <text
              x={P_surf_incline.x + 6}
              y={P_surf_incline.y - 9}
              textAnchor="start"
              dominantBaseline="central"
              fill="#0369a1"
              fontSize="9.5"
              fontWeight="700"
              stroke="white"
              strokeWidth="2.5"
              paintOrder="stroke"
            >
              p = 0 kPa (NA)
            </text>
          </g>
        )}

        {/* Polígono do Prisma com Gradiente Azul Translúcido */}
        <path
          d={prismPath}
          fill="url(#pressurePrismGrad)"
          stroke={CORES_MATERIAIS.vetorResultante}
          strokeWidth={hoveredItem === 'PRISM' ? 2.2 : 1.5}
          strokeLinejoin="round"
          opacity={hoveredItem === 'PRISM' ? 0.95 : 0.85}
        />

        {/* Linhas internas de variação de pressão */}
        {[0.25, 0.5, 0.75].map((t, idx) => {
          const pInner = {
            x: P_top.x + u_down.x * (t * H * SCALE),
            y: P_top.y + u_down.y * (t * H * SCALE),
          };
          const w_t = w_top + t * (w_bot - w_top);
          const pOuter = {
            x: pInner.x - n_out.x * w_t,
            y: pInner.y - n_out.y * w_t,
          };
          return (
            <line
              key={`diag-ray-${idx}`}
              x1={pOuter.x}
              y1={pOuter.y}
              x2={pInner.x}
              y2={pInner.y}
              stroke={CORES_MATERIAIS.aguaSuperficie}
              strokeWidth={1}
              strokeDasharray="3 2"
              opacity={0.75}
            />
          );
        })}

        {/* Label p_topo / p_A (com contorno branco suave para nitidez sobre a água) */}
        <text
          x={ptTopOuter.x - u_down.x * 8 - n_out.x * 6}
          y={ptTopOuter.y - u_down.y * 8 - n_out.y * 6 - 4}
          textAnchor="end"
          dominantBaseline="central"
          fill={CORES_MATERIAIS.cotaNivelTexto}
          fontSize="11"
          fontWeight="700"
          stroke="white"
          strokeWidth="3"
          paintOrder="stroke"
        >
          p<tspan baselineShift="sub" fontSize="7.5">{hasVerticalWallHingeA ? 'A' : 'topo'}</tspan> = {p_top_disp} {p_unit}
        </text>

        {/* Label p_base (com contorno branco suave para nitidez sobre a água) */}
        <text
          x={ptBotOuter.x + u_down.x * 10 - n_out.x * 6}
          y={ptBotOuter.y + u_down.y * 10 - n_out.y * 6 + 6}
          textAnchor="end"
          dominantBaseline="central"
          fill={CORES_MATERIAIS.cotaNivelTexto}
          fontSize="11"
          fontWeight="700"
          stroke="white"
          strokeWidth="3"
          paintOrder="stroke"
        >
          p<tspan baselineShift="sub" fontSize="7.5">base</tspan> = {p_bot_disp} {p_unit}
        </text>

        {/* Seta da Força Resultante F_R / E (padrão Barragens: azul #2563eb com ponta #1e40af) */}
        <line
          x1={eStart.x}
          y1={eStart.y}
          x2={P_CP.x}
          y2={P_CP.y}
          stroke={CORES_MATERIAIS.vetorResultante}
          strokeWidth={hoveredItem === 'CP' ? 4.2 : 3.5}
          markerEnd="url(#arrow-thrust)"
          className="transition-all"
        />

        {/* Pílula branca com borda suave da Força Resultante */}
        <g
          transform={`translate(${eStart.x - n_out.x * (pillW * 0.42)}, ${eStart.y - n_out.y * 10 - 15})`}
          onMouseEnter={() => setHoveredItem('CP')}
          onMouseLeave={() => setHoveredItem(null)}
          style={{ cursor: 'pointer' }}
        >
          <rect
            x={-pillW / 2}
            y={-11}
            width={pillW}
            height={22}
            rx={11}
            fill="#ffffff"
            opacity={0.94}
            stroke={CORES_MATERIAIS.vetorPillBorda}
            strokeWidth={1.2}
          />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fill={CORES_MATERIAIS.vetorPillTexto}
            fontSize="10.5"
            fontWeight="bold"
            stroke="none"
          >
            {hasVerticalWallHingeA ? (
              <>
                F<tspan baselineShift="sub" fontSize="7.5">R</tspan> = {force_disp}
              </>
            ) : (
              forceText
            )}
          </text>
        </g>
      </g>
    );
  };

  // --- RENDER FRONT VIEW (VISTA FRONTAL ORTOGRÁFICA ADICIONAL DA COMPORTA) ---
  const renderFrontalView = () => {
    if (!showFrontalView) return null;

    const R_px = (H * SCALE) / 2;
    const W_px = Math.min(W * SCALE, H * SCALE * 3.6);
    const shapeExtentOut =
      shape === FormaComporta.RETANGULAR
        ? W_px / 2
        : shape === FormaComporta.SEMI_CIRCULAR
        ? H * SCALE
        : R_px;

    // Mantém afastamento limpo em relação às cotas inclinadas y_CG e y_CP
    const D_proj = baseProjClear + shapeExtentOut;

    const P_top_proj = {
      x: P_top.x + n_out.x * D_proj,
      y: P_top.y + n_out.y * D_proj,
    };
    const P_bot_proj = {
      x: P_bot.x + n_out.x * D_proj,
      y: P_bot.y + n_out.y * D_proj,
    };
    const C_geo_proj = {
      x: (P_top_proj.x + P_bot_proj.x) / 2,
      y: (P_top_proj.y + P_bot_proj.y) / 2,
    };
    const C_proj = {
      x: P_CG.x + n_out.x * D_proj,
      y: P_CG.y + n_out.y * D_proj,
    };

    const projLineExtra = 34;
    const P_top_proj_end = {
      x: P_top.x + n_out.x * (D_proj + shapeExtentOut + projLineExtra),
      y: P_top.y + n_out.y * (D_proj + shapeExtentOut + projLineExtra),
    };
    const P_bot_proj_end = {
      x: P_bot.x + n_out.x * (D_proj + shapeExtentOut + projLineExtra),
      y: P_bot.y + n_out.y * (D_proj + shapeExtentOut + projLineExtra),
    };

    const CP_proj = {
      x: C_proj.x + u_down.x * (delta_y * SCALE),
      y: C_proj.y + u_down.y * (delta_y * SCALE),
    };

    const dimOffset = shapeExtentOut + 30;
    const dimP1 = {
      x: P_top_proj.x + n_out.x * dimOffset,
      y: P_top_proj.y + n_out.y * dimOffset,
    };
    const dimP2 = {
      x: P_bot_proj.x + n_out.x * dimOffset,
      y: P_bot_proj.y + n_out.y * dimOffset,
    };

    const dimLabel =
      shape === FormaComporta.CIRCULAR
        ? `Ø = ${H.toFixed(2)} m`
        : shape === FormaComporta.SEMI_CIRCULAR
        ? `R = ${H.toFixed(2)} m`
        : `${H.toFixed(2)} m (${(H * 100).toFixed(0)} cm)`;

    const liftUpVec = { x: -u_down.x * liftDist, y: -u_down.y * liftDist };

    const buildRectPathAt = (cx: number, cy: number, halfH: number, halfW: number) => {
      const p1 = { x: cx - u_down.x * halfH - n_out.x * halfW, y: cy - u_down.y * halfH - n_out.y * halfW };
      const p2 = { x: cx - u_down.x * halfH + n_out.x * halfW, y: cy - u_down.y * halfH + n_out.y * halfW };
      const p3 = { x: cx + u_down.x * halfH + n_out.x * halfW, y: cy + u_down.y * halfH + n_out.y * halfW };
      const p4 = { x: cx + u_down.x * halfH - n_out.x * halfW, y: cy + u_down.y * halfH - n_out.y * halfW };
      return `M ${p1.x},${p1.y} L ${p2.x},${p2.y} L ${p3.x},${p3.y} L ${p4.x},${p4.y} Z`;
    };

    const buildSemiPathAt = (botCenterX: number, botCenterY: number) => {
      const H_px = H * SCALE;
      const R_semi = H_px;
      const steps = 32;
      const pts: string[] = [];
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI;
        const s = Math.sin(a) * H_px;
        const c = Math.cos(a) * R_semi;
        const px = botCenterX - u_down.x * s + n_out.x * c;
        const py = botCenterY - u_down.y * s + n_out.y * c;
        pts.push(`${px.toFixed(2)},${py.toFixed(2)}`);
      }
      return `M ${pts.join(' L ')} Z`;
    };

    return (
      <g key="frontal-view-projection" className="animate-in fade-in duration-300">
        {/* Linhas de chamada ortogonais padronizadas com Barragens */}
        <line
          x1={P_top.x}
          y1={P_top.y}
          x2={P_top_proj_end.x}
          y2={P_top_proj_end.y}
          stroke={CORES_MATERIAIS.cotaLinha}
          strokeWidth="1.4"
          strokeDasharray="3 3"
          opacity="0.45"
        />
        <line
          x1={P_bot.x}
          y1={P_bot.y}
          x2={P_bot_proj_end.x}
          y2={P_bot_proj_end.y}
          stroke={CORES_MATERIAIS.cotaLinha}
          strokeWidth="1.4"
          strokeDasharray="3 3"
          opacity="0.45"
        />

        {/* --- TRUE FRONTAL GATE SHAPE (ABERTURA + FOLHA DA COMPORTA) --- */}
        {shape === FormaComporta.CIRCULAR && (
          <g>
            {/* Abertura fixa (preenchida com azul de escoamento quando aberta) */}
            {!isGateClosed && (
              <circle
                cx={C_geo_proj.x}
                cy={C_geo_proj.y}
                r={R_px}
                fill="url(#fluidDepthA)"
                fillOpacity={0.78}
                stroke="#0284c7"
                strokeWidth="1.8"
              />
            )}

            {/* Folha metálica da comporta (na posição fechada ou levantada por liftDist) */}
            <circle
              cx={C_geo_proj.x + liftUpVec.x}
              cy={C_geo_proj.y + liftUpVec.y}
              r={R_px}
              fill="#f8fafc"
              fillOpacity={openFraction >= 1 ? 0.9 : 1}
              stroke="#0f172a"
              strokeWidth="2"
            />
            <circle
              cx={C_geo_proj.x + liftUpVec.x}
              cy={C_geo_proj.y + liftUpVec.y}
              r={R_px}
              fill="url(#gateHatchPattern)"
              stroke="none"
            />

            {/* Contorno da abertura livre visível mesmo sob a folha parcialmente aberta */}
            {!isGateClosed && (
              <circle
                cx={C_geo_proj.x}
                cy={C_geo_proj.y}
                r={R_px}
                fill="none"
                stroke="#0f172a"
                strokeWidth="1.4"
                strokeDasharray="4 2"
                opacity={0.75}
              />
            )}

            <line
              x1={C_geo_proj.x - u_down.x * (R_px + 12)}
              y1={C_geo_proj.y - u_down.y * (R_px + 12)}
              x2={C_geo_proj.x + u_down.x * (R_px + 12)}
              y2={C_geo_proj.y + u_down.y * (R_px + 12)}
              stroke={CORES_MATERIAIS.cotaLinha}
              strokeWidth="1"
              strokeDasharray="7 3 2 3"
            />
            <line
              x1={C_geo_proj.x - n_out.x * (R_px + 12)}
              y1={C_geo_proj.y - n_out.y * (R_px + 12)}
              x2={C_geo_proj.x + n_out.x * (R_px + 12)}
              y2={C_geo_proj.y + n_out.y * (R_px + 12)}
              stroke={CORES_MATERIAIS.cotaLinha}
              strokeWidth="1"
              strokeDasharray="7 3 2 3"
            />

            {/* Eixo físico horizontal ao longo do diâmetro horizontal na vista frontal (Exemplo 2.6) */}
            {props.hingePosition === PosicaoDobradica.CENTER && (
              <g key="frontal-horizontal-shaft">
                <line
                  x1={C_geo_proj.x - n_out.x * (R_px + 14)}
                  y1={C_geo_proj.y - n_out.y * (R_px + 14)}
                  x2={C_geo_proj.x + n_out.x * (R_px + 14)}
                  y2={C_geo_proj.y + n_out.y * (R_px + 14)}
                  stroke="#d97706"
                  strokeWidth="4.2"
                  strokeLinecap="round"
                />
                <line
                  x1={C_geo_proj.x - n_out.x * (R_px + 14)}
                  y1={C_geo_proj.y - n_out.y * (R_px + 14)}
                  x2={C_geo_proj.x + n_out.x * (R_px + 14)}
                  y2={C_geo_proj.y + n_out.y * (R_px + 14)}
                  stroke="#fef3c7"
                  strokeWidth="1.4"
                  strokeDasharray="6 3"
                />
                <circle
                  cx={C_geo_proj.x - n_out.x * (R_px + 14)}
                  cy={C_geo_proj.y - n_out.y * (R_px + 14)}
                  r={4.2}
                  fill="#f59e0b"
                  stroke="#78350f"
                  strokeWidth={1.5}
                />
                <circle
                  cx={C_geo_proj.x + n_out.x * (R_px + 14)}
                  cy={C_geo_proj.y + n_out.y * (R_px + 14)}
                  r={4.2}
                  fill="#f59e0b"
                  stroke="#78350f"
                  strokeWidth={1.5}
                />
                {/* Cota do Raio R = 2,00 m na vista circular */}
                <text
                  x={C_geo_proj.x - u_down.x * (R_px + 20)}
                  y={C_geo_proj.y - u_down.y * (R_px + 20)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#0f172a"
                  fontSize="10"
                  fontWeight="800"
                  stroke="#ffffff"
                  strokeWidth="3"
                  paintOrder="stroke"
                >
                  R = {(H / 2).toFixed(2).replace('.', ',')} m | Eixo Central
                </text>
              </g>
            )}
          </g>
        )}

        {shape === FormaComporta.RETANGULAR && (
          <g>
            {(() => {
              const halfH = (H * SCALE) / 2;
              const halfW = W_px / 2;
              const dOpen = buildRectPathAt(C_geo_proj.x, C_geo_proj.y, halfH, halfW);
              const dPlate = buildRectPathAt(
                C_geo_proj.x + liftUpVec.x,
                C_geo_proj.y + liftUpVec.y,
                halfH,
                halfW
              );

              return (
                <>
                  {!isGateClosed && (
                    <path
                      d={dOpen}
                      fill="url(#fluidDepthA)"
                      fillOpacity={0.78}
                      stroke="#0284c7"
                      strokeWidth="1.8"
                    />
                  )}
                  <path
                    d={dPlate}
                    fill="#f8fafc"
                    fillOpacity={openFraction >= 1 ? 0.9 : 1}
                    stroke="#0f172a"
                    strokeWidth="2"
                  />
                  <path d={dPlate} fill="url(#gateHatchPattern)" stroke="none" />
                  {!isGateClosed && (
                    <path
                      d={dOpen}
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="1.4"
                      strokeDasharray="4 2"
                      opacity={0.75}
                    />
                  )}

                  <line
                    x1={C_geo_proj.x - u_down.x * (halfH + 12)}
                    y1={C_geo_proj.y - u_down.y * (halfH + 12)}
                    x2={C_geo_proj.x + u_down.x * (halfH + 12)}
                    y2={C_geo_proj.y + u_down.y * (halfH + 12)}
                    stroke={CORES_MATERIAIS.cotaLinha}
                    strokeWidth="1"
                    strokeDasharray="7 3 2 3"
                  />
                  <line
                    x1={C_geo_proj.x - n_out.x * (halfW + 12)}
                    y1={C_geo_proj.y - n_out.y * (halfW + 12)}
                    x2={C_geo_proj.x + n_out.x * (halfW + 12)}
                    y2={C_geo_proj.y + n_out.y * (halfW + 12)}
                    stroke={CORES_MATERIAIS.cotaLinha}
                    strokeWidth="1"
                    strokeDasharray="7 3 2 3"
                  />

                  {/* Cota da largura b da comporta retangular */}
                  <DesenhoCota2D
                    p1Orig={{
                      x: P_bot_proj.x - n_out.x * halfW,
                      y: P_bot_proj.y - n_out.y * halfW,
                    }}
                    p2Orig={{
                      x: P_bot_proj.x + n_out.x * halfW,
                      y: P_bot_proj.y + n_out.y * halfW,
                    }}
                    p1Off={{
                      x: P_bot_proj.x - n_out.x * halfW + u_down.x * 20,
                      y: P_bot_proj.y - n_out.y * halfW + u_down.y * 20,
                    }}
                    p2Off={{
                      x: P_bot_proj.x + n_out.x * halfW + u_down.x * 20,
                      y: P_bot_proj.y + n_out.y * halfW + u_down.y * 20,
                    }}
                    label={`b = ${W.toFixed(2)} m`}
                    labelCharCount={`b = ${W.toFixed(2)} m`.length}
                  />
                </>
              );
            })()}
          </g>
        )}

        {shape === FormaComporta.SEMI_CIRCULAR && (
          <g>
            {(() => {
              const dOpen = buildSemiPathAt(P_bot_proj.x, P_bot_proj.y);
              const dPlate = buildSemiPathAt(
                P_bot_proj.x + liftUpVec.x,
                P_bot_proj.y + liftUpVec.y
              );
              return (
                <>
                  {!isGateClosed && (
                    <path
                      d={dOpen}
                      fill="url(#fluidDepthA)"
                      fillOpacity={0.78}
                      stroke="#0284c7"
                      strokeWidth="1.8"
                    />
                  )}
                  <path
                    d={dPlate}
                    fill="#f8fafc"
                    fillOpacity={openFraction >= 1 ? 0.9 : 1}
                    stroke="#0f172a"
                    strokeWidth="2"
                  />
                  <path d={dPlate} fill="url(#gateHatchPattern)" stroke="none" />
                  {!isGateClosed && (
                    <path
                      d={dOpen}
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="1.4"
                      strokeDasharray="4 2"
                      opacity={0.75}
                    />
                  )}
                  <line
                    x1={P_top_proj.x - u_down.x * 10}
                    y1={P_top_proj.y - u_down.y * 10}
                    x2={P_bot_proj.x + u_down.x * 10}
                    y2={P_bot_proj.y + u_down.y * 10}
                    stroke={CORES_MATERIAIS.cotaLinha}
                    strokeWidth="1"
                    strokeDasharray="7 3 2 3"
                  />
                  <line
                    x1={P_bot_proj.x - n_out.x * (H * SCALE + 10)}
                    y1={P_bot_proj.y - n_out.y * (H * SCALE + 10)}
                    x2={P_bot_proj.x + n_out.x * (H * SCALE + 10)}
                    y2={P_bot_proj.y + n_out.y * (H * SCALE + 10)}
                    stroke={CORES_MATERIAIS.cotaLinha}
                    strokeWidth="1"
                    strokeDasharray="7 3 2 3"
                  />
                </>
              );
            })()}
          </g>
        )}

        {/* Cota da altura/diâmetro da comporta no padrão oficial Barragens */}
        <DesenhoCota2D
          p1Orig={P_top_proj}
          p2Orig={P_bot_proj}
          p1Off={dimP1}
          p2Off={dimP2}
          label={dimLabel}
          labelCharCount={dimLabel.length}
        />

        {/* --- CENTROID (CG) NA VISTA FRONTAL (padrão Barragens) --- */}
        <MarcadorCG2D
          x={C_proj.x}
          y={C_proj.y}
          radius={5.5}
          labelOffset={{
            x: -n_out.x * 14 - u_down.x * 10,
            y: -n_out.y * 14 - u_down.y * 10,
          }}
        />

        {/* --- CENTER OF PRESSURE (CP) NA VISTA FRONTAL (quando fechada e analisada) --- */}
        {isGateClosed && props.isAnalyzed && (
          <g>
            <circle
              cx={CP_proj.x}
              cy={CP_proj.y}
              r={4.5}
              fill={CORES_MATERIAIS.pontoCP}
              stroke="#ffffff"
              strokeWidth={1.8}
            />
            <text
              x={CP_proj.x + n_out.x * 15 + u_down.x * 12}
              y={CP_proj.y + n_out.y * 15 + u_down.y * 12}
              textAnchor="middle"
              dominantBaseline="central"
              fill={CORES_MATERIAIS.pontoCPTexto}
              fontSize="11"
              fontWeight="800"
              stroke="white"
              strokeWidth="2.5"
              paintOrder="stroke"
            >
              CP
            </text>

            {delta_y * SCALE > 2 && (
              <line
                x1={C_proj.x}
                y1={C_proj.y}
                x2={CP_proj.x}
                y2={CP_proj.y}
                stroke={CORES_MATERIAIS.pontoCP}
                strokeWidth={1.5}
                markerEnd="url(#arrow-red)"
              />
            )}
          </g>
        )}
      </g>
    );
  };

  // --- RENDER TEXTBOOK ENGINEERING DIMENSIONS (COTAGENS PADRONIZADAS BARRAGENS) ---
  const renderDimensions = () => {
    if (!showExerciseDims) return null;

    const dims: React.ReactNode[] = [];

    // Helper para cotas verticais ortogonais no padrão exato de Barragens
    const drawVerticalDimAtX = (
      key: string,
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      dimX: number,
      labelNode: React.ReactNode,
      labelCharCount: number,
      labelRatioY: number = 0.5
    ) => {
      return (
        <DesenhoCota2D
          key={key}
          p1Orig={p1}
          p2Orig={p2}
          p1Off={{ x: dimX, y: p1.y }}
          p2Off={{ x: dimX, y: p2.y }}
          label={labelNode}
          labelCharCount={labelCharCount}
          labelRatio={labelRatioY}
        />
      );
    };

    // Helper para cotas inclinadas paralelas à superfície no padrão exato de Barragens
    const drawSlantedDim = (
      key: string,
      p1Orig: { x: number; y: number },
      p2Orig: { x: number; y: number },
      p1Off: { x: number; y: number },
      p2Off: { x: number; y: number },
      labelNode: React.ReactNode,
      labelCharCount: number,
      labelRatio: number = 0.5
    ) => {
      return (
        <DesenhoCota2D
          key={key}
          p1Orig={p1Orig}
          p2Orig={p2Orig}
          p1Off={p1Off}
          p2Off={p2Off}
          label={labelNode}
          labelCharCount={labelCharCount}
          labelRatio={labelRatio}
        />
      );
    };

    // 1. Símbolo de Nível da Água Montante (NA) idêntico ao padrão de Barragens
    const naX = leftBoundX + 60;
    const naText = `NA=${(props.upstreamLevel || 0).toFixed(2)}`;
    dims.push(
      <SimboloNivelAgua2D
        key="na-level-symbol"
        x={naX}
        y={waterSurfaceY}
        text={naText}
        flipX={true}
      />
    );

    // Nível da Água Jusante (se ativo)
    if (props.downstreamLevel > 0) {
      const naDownX = rightBoundX - 18;
      dims.push(
        <SimboloNivelAgua2D
          key="na-downstream-symbol"
          x={naDownX}
          y={downDepthY}
          text={`NA=${props.downstreamLevel.toFixed(2)}`}
          flipX={true}
        />
      );
    }

    // 2. Indicador do Peso Específico (γ) posicionado de forma limpa no canto inferior esquerdo do reservatório
    const downFluidInfo = FLUIDOS_PREDEFINIDOS[props.downstreamFluidKey] || FLUIDOS_PREDEFINIDOS.agua;
    const rhoDown = props.downstreamDensity ?? props.liveResults?.densityDown ?? downFluidInfo.densidade ?? 1000;
    const gammaDownN = props.liveResults?.gammaDown ?? (rhoDown * g);
    const gammaLabel = hasSmoothFloorSupport
      ? `${fluidInfo.nome} · γg = ${Math.round(gamma_N).toLocaleString('pt-BR')} N/m³`
      : props.hingePosition === PosicaoDobradica.CENTER && !isKgf
      ? `Água · γ = ${(gamma_N / 1000).toFixed(2).replace('.', ',')} kN/m³ (${Math.round(gamma_N).toLocaleString('pt-BR')} N/m³)`
      : hasSmoothWallSupport && !isKgf
      ? `γ = ${Math.round(gamma_N).toLocaleString('pt-BR')} N/m³ (${(gamma_N / 1000).toFixed(2)} kN/m³)`
      : `γ = ${gamma_kgf} kgf/m³ (${(gamma_N / 1000).toFixed(2)} kN/m³)`;
    const gammaBoxW = gammaLabel.length * 6.3 + 16;
    dims.push(
      <g key="water-gamma-badge" transform={`translate(${leftBoundX + 12}, ${P_bed_inc.y - 20})`}>
        <rect
          x={0}
          y={-10}
          width={gammaBoxW}
          height={20}
          rx={4}
          fill="#ffffff"
          fillOpacity={0.92}
          stroke={hasSmoothFloorSupport ? '#c4b5fd' : '#cbd5e1'}
          strokeWidth={0.9}
        />
        <text
          x={8}
          y={0}
          textAnchor="start"
          dominantBaseline="central"
          fill={hasSmoothFloorSupport ? '#5b21b6' : CORES_MATERIAIS.cotaNivelTexto}
          fontSize="10.5"
          fontWeight="700"
          stroke="none"
        >
          {gammaLabel}
        </text>
      </g>
    );

    if (hasSmoothFloorSupport && props.downstreamLevel > 0) {
      const gammaDownLabel = `${downFluidInfo.nome} · γa = ${Math.round(gammaDownN).toLocaleString('pt-BR')} N/m³`;
      const gammaDownW = gammaDownLabel.length * 6.3 + 16;
      dims.push(
        <g key="water-down-gamma-badge" transform={`translate(${rightBoundX - gammaDownW - 10}, ${P_bed_inc.y - 20})`}>
          <rect
            x={0}
            y={-10}
            width={gammaDownW}
            height={20}
            rx={4}
            fill="#ffffff"
            fillOpacity={0.92}
            stroke="#7dd3fc"
            strokeWidth={0.9}
          />
          <text
            x={8}
            y={0}
            textAnchor="start"
            dominantBaseline="central"
            fill="#0369a1"
            fontSize="10.5"
            fontWeight="700"
            stroke="none"
          >
            {gammaDownLabel}
          </text>
        </g>
      );
    }

    // 3, 4 e 5. Colunas verticais de profundidade (h_topo, h_CG, h_CP) à esquerda do prisma de pressão
    const isDirectYcgMode = props.modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO;
    const prismClearX =
      props.isAnalyzed && props.showVectors
        ? Math.min(P_bot.x - n_out.x * 62, P_CP.x - n_out.x * 96) - 44
        : Math.min(P_top.x, P_bot.x) - 38;

    const colTopX = Math.max(leftBoundX + 145, Math.min(P_surf.x - 45, prismClearX));
    const colCgX = Math.max(leftBoundX + 78, colTopX - 66);
    const colCpX = Math.max(leftBoundX + 14, colCgX - 66);

    if ((!isDirectYcgMode || props.isAnalyzed) && !hasVerticalWallHingeA) {
      const hTopPlain = (hasSmoothWallSupport || hasSmoothFloorSupport)
        ? `hA = ${h_top.toFixed(2)} m`
        : `htopo = ${h_top.toFixed(2)} m`;
      dims.push(
        drawVerticalDimAtX(
          'dim-h-top',
          { x: P_top.x, y: waterSurfaceY },
          { x: P_top.x, y: P_top.y },
          colTopX,
          (hasSmoothWallSupport || hasSmoothFloorSupport) ? (
            <>
              h<tspan baselineShift="sub" fontSize="8.5">A</tspan> = {h_top.toFixed(2)} m
            </>
          ) : (
            <>
              h<tspan baselineShift="sub" fontSize="8.5">topo</tspan> = {h_top.toFixed(2)} m
            </>
          ),
          hTopPlain.length,
          0.36
        )
      );
    }

    if (hasSmoothWallSupport || hasSmoothFloorSupport) {
      const hBPlain = hasSmoothFloorSupport
        ? `hg = ${(props.upstreamLevel || 0).toFixed(2)} m`
        : `hB = ${h_bot.toFixed(2)} m`;
      dims.push(
        drawVerticalDimAtX(
          'dim-h-bot-b',
          { x: P_bot.x, y: waterSurfaceY },
          { x: P_bot.x, y: P_bot.y },
          colCgX,
          hasSmoothFloorSupport ? (
            <>
              h<tspan baselineShift="sub" fontSize="8.5">g</tspan> = {(props.upstreamLevel || 0).toFixed(2)} m
            </>
          ) : (
            <>
              h<tspan baselineShift="sub" fontSize="8.5">B</tspan> = {h_bot.toFixed(2)} m
            </>
          ),
          hBPlain.length,
          0.62
        )
      );
    }

    if ((props.isAnalyzed || props.hingePosition === PosicaoDobradica.CENTER) && !hasSmoothWallSupport && !hasSmoothFloorSupport) {
      const hCgPlain =
        props.hingePosition === PosicaoDobradica.CENTER || hasVerticalWallHingeA
          ? `hc = ${h_CG.toFixed(2)} m`
          : `hCG = ${h_CG.toFixed(2)} m`;
      dims.push(
        drawVerticalDimAtX(
          'dim-h-cg',
          { x: P_CG.x, y: waterSurfaceY },
          { x: P_CG.x, y: P_CG.y },
          hasVerticalWallHingeA ? colTopX : colCgX,
          props.hingePosition === PosicaoDobradica.CENTER || hasVerticalWallHingeA ? (
            <>
              h<tspan baselineShift="sub" fontSize="8.5">c</tspan> = {h_CG.toFixed(2)} m
            </>
          ) : (
            <>
              h<tspan baselineShift="sub" fontSize="8.5">CG</tspan> = {h_CG.toFixed(2)} m
            </>
          ),
          hCgPlain.length,
          0.52
        )
      );
    }

    if (props.isAnalyzed) {
      if (!hasSmoothFloorSupport) {
        const hCpPlain = `hCP = ${h_CP.toFixed(3)} m`;
        dims.push(
          drawVerticalDimAtX(
            'dim-h-cp',
            { x: P_CP.x, y: waterSurfaceY },
            { x: P_CP.x, y: P_CP.y },
            hasVerticalWallHingeA ? colCgX : colCpX,
            <>
              h<tspan baselineShift="sub" fontSize="8.5">CP</tspan> = {h_CP.toFixed(3)} m
            </>,
            hCpPlain.length,
            0.68
          )
        );
      }
    }

    // 6. Ângulo de Inclinação (θ) e Cotas da Geometria
    if (hasVerticalWallAboveA) {
      const arcR = 42;
      const arcEndX = P_bot.x + arcR * cosTheta;
      const arcEndY = P_bot.y - arcR * sinTheta;
      const midAng = thetaRad / 2;
      const lblX = P_bot.x + (arcR + 20) * Math.cos(midAng);
      const lblY = P_bot.y - (arcR + 16) * Math.sin(midAng);
      dims.push(
        <g key="angle-arc-indicator-B" stroke={CORES_MATERIAIS.anguloArco} strokeWidth="1.5" fill="none" opacity="0.92">
          <line
            x1={P_bot.x}
            y1={P_bot.y}
            x2={P_bot.x + arcR + 24}
            y2={P_bot.y}
            stroke={CORES_MATERIAIS.cotaLinha}
            strokeDasharray="3 3"
            opacity="0.55"
          />
          <path d={`M ${P_bot.x + arcR},${P_bot.y} A ${arcR} ${arcR} 0 0 0 ${arcEndX},${arcEndY}`} />
          <text
            x={lblX}
            y={lblY}
            textAnchor="middle"
            dominantBaseline="central"
            fill={CORES_MATERIAIS.anguloTexto}
            fontSize="11.5"
            fontWeight="bold"
            stroke="white"
            strokeWidth="2.5"
            paintOrder="stroke"
          >
            {thetaDeg.toFixed(2).replace(/\.00$/, '').replace('.', ',')}°
          </text>
        </g>
      );

      if (hasVerticalWallHingeA) {
        // Cota vertical D = 2,00 m à direita da parede vertical (entre a superfície livre e a articulação A)
        const dimD_X = P_top.x + wallThick + 46;
        const dPlain = `D = ${h_top.toFixed(2)} m`;
        dims.push(
          drawVerticalDimAtX(
            'dim-depth-D-right',
            { x: P_top.x + wallThick, y: waterSurfaceY },
            { x: P_top.x + wallThick, y: P_top.y },
            dimD_X,
            <>D = {h_top.toFixed(2).replace('.', ',')} m</>,
            dPlain.length,
            0.5
          )
        );

        // Cota inclinada L = 4,00 m ao longo da comporta
        const D_len = 46;
        const lenPlain = `L = ${H.toFixed(2)} m`;
        dims.push(
          drawSlantedDim(
            'dim-gate-length-L-ex35',
            P_top,
            P_bot,
            { x: P_top.x + n_out.x * D_len, y: P_top.y + n_out.y * D_len },
            { x: P_bot.x + n_out.x * D_len, y: P_bot.y + n_out.y * D_len },
            <>L = {H.toFixed(2).replace('.', ',')} m</>,
            lenPlain.length,
            0.5
          )
        );

        // Badge da largura w = 5,00 m e ar atmosférico no lado externo da comporta
        const wBadgeX = P_top.x + wallThick + 14;
        const wBadgeY = P_crest.y + 10;
        const wText = `w = ${W.toFixed(2).replace('.', ',')} m · L = ${H.toFixed(2).replace('.', ',')} m`;
        const wBoxW = wText.length * 6.2 + 16;
        dims.push(
          <g key="ex35-width-badge" transform={`translate(${wBadgeX}, ${wBadgeY})`}>
            <rect
              x={0}
              y={-10}
              width={wBoxW}
              height={20}
              rx={5}
              fill="#ffffff"
              fillOpacity={0.94}
              stroke="#cbd5e1"
              strokeWidth={1}
            />
            <text
              x={8}
              y={0}
              textAnchor="start"
              dominantBaseline="central"
              fill="#334155"
              fontSize="10.5"
              fontWeight="700"
            >
              {wText}
            </text>
          </g>
        );

        // Indicador de ar atmosférico (patm) atuando no lado direito/inferior da comporta
        const airX = (P_top.x + P_bot.x) / 2 + n_out.x * 98;
        const airY = (P_top.y + P_bot.y) / 2 + n_out.y * 98;
        dims.push(
          <g key="ex35-air-side-label" transform={`translate(${airX}, ${airY})`}>
            <rect
              x={-58}
              y={-10}
              width={116}
              height={20}
              rx={5}
              fill="#f8fafc"
              fillOpacity={0.92}
              stroke="#cbd5e1"
              strokeWidth={1}
            />
            <text
              x={0}
              y={0}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#475569"
              fontSize="9.5"
              fontWeight="700"
            >
              Ar atmosférico (p<tspan baselineShift="sub" fontSize="7">atm</tspan>)
            </text>
          </g>
        );

        // Após ANALISAR: exibir a distância inclinada da articulação A ao CP (s_CP,A = 2,222 m)
        if (props.isAnalyzed) {
          const s_cp_A = upData?.s_cp ?? (Y_CP - Y_top);
          const D_scp = 86;
          const sCpPlain = `yCP,A = ${s_cp_A.toFixed(3)} m`;
          dims.push(
            drawSlantedDim(
              'dim-scp-from-A-ex35',
              P_top,
              P_CP,
              { x: P_top.x + n_out.x * D_scp, y: P_top.y + n_out.y * D_scp },
              { x: P_CP.x + n_out.x * D_scp, y: P_CP.y + n_out.y * D_scp },
              <>
                y<tspan baselineShift="sub" fontSize="8.5">CP,A</tspan> = {s_cp_A.toFixed(3).replace('.', ',')} m
              </>,
              sCpPlain.length,
              0.52
            )
          );
        }
      } else {
        // Cotas geométricas explícitas: Δx, Δy, L e (para Problema 2.61) h da água + largura b
        const deltaXVal = H * cosTheta;
        const deltaYVal = H * sinTheta;
        const dimFloorY = soilBottomY + 20;
        const dxPlain = `Δx = ${deltaXVal.toFixed(2)} m`;
        dims.push(
          <DesenhoCota2D
            key="dim-delta-x-BA"
            p1Orig={P_bot}
            p2Orig={{ x: P_top.x, y: P_bot.y }}
            p1Off={{ x: P_bot.x, y: dimFloorY }}
            p2Off={{ x: P_top.x, y: dimFloorY }}
            label={<>Δx = {deltaXVal.toFixed(2).replace('.', ',')} m</>}
            labelCharCount={dxPlain.length}
          />
        );

        if (hasSmoothFloorSupport) {
          if (props.downstreamLevel > 0) {
            const hDownPlain = `h = ${props.downstreamLevel.toFixed(3)} m`;
            dims.push(
              drawVerticalDimAtX(
                'dim-h-water-down',
                { x: rightBoundX - 90, y: downDepthY },
                { x: rightBoundX - 90, y: canalBedSurfaceY },
                rightBoundX - 58,
                <>h = {props.downstreamLevel.toFixed(3).replace('.', ',')} m</>,
                hDownPlain.length,
                0.46
              )
            );
          }

          const bBadgeX = P_top.x + wallThick + 16;
          const bBadgeY = P_crest.y + 12;
          const bText = `L = ${H.toFixed(2).replace('.', ',')} m · b = ${W.toFixed(2).replace('.', ',')} m`;
          const bBoxW = bText.length * 6.2 + 16;
          dims.push(
            <g key="gate-width-length-pill" transform={`translate(${bBadgeX}, ${bBadgeY})`}>
              <rect
                x={0}
                y={-10}
                width={bBoxW}
                height={20}
                rx={5}
                fill="#ffffff"
                fillOpacity={0.94}
                stroke="#cbd5e1"
                strokeWidth={1}
              />
              <text
                x={8}
                y={0}
                textAnchor="start"
                dominantBaseline="central"
                fill="#334155"
                fontSize="10.5"
                fontWeight="700"
              >
                {bText}
              </text>
            </g>
          );
        } else {
          const dimRightX = P_top.x + wallThick + 92;
          const dyPlain = `Δy = ${deltaYVal.toFixed(2)} m`;
          dims.push(
            drawVerticalDimAtX(
              'dim-delta-y-BA',
              P_top,
              { x: P_top.x, y: P_bot.y },
              dimRightX,
              <>Δy = {deltaYVal.toFixed(2).replace('.', ',')} m</>,
              dyPlain.length,
              0.54
            )
          );

          const D_len = 54;
          const lenPlain = `L = ${H.toFixed(2)} m`;
          dims.push(
            drawSlantedDim(
              'dim-gate-length-L',
              P_top,
              P_bot,
              { x: P_top.x + n_out.x * D_len, y: P_top.y + n_out.y * D_len },
              { x: P_bot.x + n_out.x * D_len, y: P_bot.y + n_out.y * D_len },
              <>L = {H.toFixed(2).replace('.', ',')} m</>,
              lenPlain.length,
              0.48
            )
          );
        }
      }
    } else {
      const arcR = 44;
      const arcEndX = P_surf.x - u_down.x * arcR;
      const arcEndY = P_surf.y - u_down.y * arcR;
      dims.push(
        <g key="angle-arc-indicator" stroke={CORES_MATERIAIS.anguloArco} strokeWidth="1.5" fill="none" opacity="0.88">
          <line
            x1={P_surf.x}
            y1={waterSurfaceY}
            x2={P_surf.x + 68}
            y2={waterSurfaceY}
            stroke={CORES_MATERIAIS.cotaLinha}
            strokeDasharray="3 3"
            opacity="0.45"
          />
          <path
            d={`M ${P_surf.x + arcR},${waterSurfaceY} A ${arcR} ${arcR} 0 0 0 ${arcEndX},${arcEndY}`}
          />
          <text
            x={P_surf.x + arcR + 15}
            y={waterSurfaceY - 12}
            textAnchor="middle"
            dominantBaseline="central"
            fill={CORES_MATERIAIS.anguloTexto}
            fontSize="12"
            fontWeight="bold"
            stroke="none"
          >
            {thetaDeg}°
          </text>
        </g>
      );

      // 7. Distâncias inclinadas ao longo do plano da comporta: y_CG e y_CP
      const D_slanted_cg = 64;
      const ref_surf_cg = { x: P_surf.x + n_out.x * D_slanted_cg, y: P_surf.y + n_out.y * D_slanted_cg };
      const ref_cg_off = { x: P_CG.x + n_out.x * D_slanted_cg, y: P_CG.y + n_out.y * D_slanted_cg };
      const yCgPlain = `yCG = ${Y_CG.toFixed(2)} m`;

      dims.push(
        drawSlantedDim(
          'dim-ycg-line',
          P_surf,
          P_CG,
          ref_surf_cg,
          ref_cg_off,
          <>
            y<tspan baselineShift="sub" fontSize="8.5">CG</tspan> = {Y_CG.toFixed(2)} m
          </>,
          yCgPlain.length,
          0.42
        )
      );

      if (props.isAnalyzed) {
        const D_slanted_cp = 116;
        const ref_surf_cp = { x: P_surf.x + n_out.x * D_slanted_cp, y: P_surf.y + n_out.y * D_slanted_cp };
        const ref_cp_off = { x: P_CP.x + n_out.x * D_slanted_cp, y: P_CP.y + n_out.y * D_slanted_cp };
        const yCpPlain = `yCP = ${Y_CP.toFixed(2)} m`;

        dims.push(
          drawSlantedDim(
            'dim-ycp-line',
            P_surf,
            P_CP,
            ref_surf_cp,
            ref_cp_off,
            <>
              y<tspan baselineShift="sub" fontSize="8.5">CP</tspan> = {Y_CP.toFixed(2)} m
            </>,
            yCpPlain.length,
            0.66
          )
        );
      }
    }

    // 8. PONTO CG (⊕ padrão Barragens) e PONTO E / CP NA COMPORTA
    if (isGateClosed && (!hasVerticalWallHingeA || props.isAnalyzed)) {
      dims.push(
        <g key="notable-points-on-gate">
          {/* Ponto CG: Centróide da Seção Molhada */}
          <g
            className="cursor-pointer transition-transform"
            onMouseEnter={() => setHoveredItem('CG')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {hoveredItem === 'CG' && (
              <circle
                cx={P_CG.x}
                cy={P_CG.y}
                r={12}
                fill="none"
                stroke={CORES_MATERIAIS.vetorResultante}
                strokeWidth={1.8}
                opacity={0.8}
              />
            )}
            <MarcadorCG2D
              x={P_CG.x}
              y={P_CG.y}
              radius={hoveredItem === 'CG' ? 6.5 : 6}
              labelOffset={{
                x: n_out.x * 16 - u_down.x * 10,
                y: n_out.y * 16 - u_down.y * 10,
              }}
            />
          </g>

          {/* Ponto E / CP: Centro de Pressão (Empuxo Resultante) - somente após análise */}
          {props.isAnalyzed && (
            <g
              className="cursor-pointer transition-transform"
              onMouseEnter={() => setHoveredItem('CP')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <circle
                cx={P_CP.x}
                cy={P_CP.y}
                r={7}
                fill="none"
                stroke={CORES_MATERIAIS.pontoCP}
                strokeWidth={1.6}
                opacity={0.8}
              >
                <animate attributeName="r" values="6;17;6" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.85;0.05;0.85" dur="2.4s" repeatCount="indefinite" />
              </circle>

              <circle
                cx={P_CP.x}
                cy={P_CP.y}
                r={hoveredItem === 'CP' ? 6.5 : 5.5}
                fill={CORES_MATERIAIS.pontoCP}
                stroke="#ffffff"
                strokeWidth={1.8}
              />
              <text
                x={P_CP.x + n_out.x * 18 + u_down.x * 12}
                y={P_CP.y + n_out.y * 18 + u_down.y * 12}
                textAnchor="middle"
                dominantBaseline="central"
                fill={CORES_MATERIAIS.pontoCPTexto}
                fontSize="10"
                fontWeight="800"
                stroke="white"
                strokeWidth="2.5"
                paintOrder="stroke"
              >
                {hasVerticalWallHingeA ? 'CP' : 'E'}
              </text>
            </g>
          )}
        </g>
      );
    }

    return dims;
  };

  // Render do Tooltip Interativo Dinâmico
  const renderInteractiveTooltip = () => {
    if (!hoveredItem) return null;
    if (!props.isAnalyzed && (hoveredItem === 'CP' || hoveredItem === 'PRISM')) return null;

    let tooltipX = 0;
    let tooltipY = 0;
    let title = '';
    let line1: React.ReactNode = '';
    let line2: React.ReactNode = '';
    let color = '#1e293b';

    if (hoveredItem === 'CG') {
      tooltipX = P_CG.x + n_out.x * 55;
      tooltipY = P_CG.y + n_out.y * 20 - 45;
      title = 'Centróide da Seção (CG)';
      line1 = (
        <>
          y<tspan baselineShift="sub" fontSize="7.5">CG</tspan> = {Y_CG.toFixed(3)} m  |  h<tspan baselineShift="sub" fontSize="7.5">CG</tspan> = {h_CG.toFixed(3)} m
        </>
      );
      line2 = `Área molhada = ${Area.toFixed(4)} m²`;
      color = '#0284c7';
    } else if (hoveredItem === 'CP') {
      tooltipX = P_CP.x + n_out.x * 55;
      tooltipY = P_CP.y + n_out.y * 20 - 45;
      title = 'Centro de Pressão (Ponto E / CP)';
      line1 = (
        <>
          y<tspan baselineShift="sub" fontSize="7.5">CP</tspan> = {Y_CP.toFixed(3)} m  (Δy = +{delta_y.toFixed(4)} m)
        </>
      );
      line2 = (
        <>
          h<tspan baselineShift="sub" fontSize="7.5">CP</tspan> = {h_CP.toFixed(3)} m  |  Empuxo = {force_disp}
        </>
      );
      color = '#dc2626';
    } else if (hoveredItem === 'PRISM') {
      tooltipX = P_CG.x - n_out.x * 110;
      tooltipY = P_CG.y - n_out.y * 20 - 45;
      title = 'Prisma de Pressão Hidrostática';
      line1 = (
        <>
          p<tspan baselineShift="sub" fontSize="7.5">topo</tspan> = {p_top_disp} {p_unit}  |  p<tspan baselineShift="sub" fontSize="7.5">base</tspan> = {p_bot_disp} {p_unit}
        </>
      );
      line2 = `Distribuição linear ao longo do plano inclinado (θ = ${thetaDeg}°)`;
      color = '#2563eb';
    }

    return (
      <g
        className="pointer-events-none animate-in fade-in zoom-in-95 duration-200"
        transform={`translate(${tooltipX}, ${tooltipY})`}
      >
        <rect
          x={-130}
          y={-14}
          width={260}
          height={54}
          rx={8}
          fill="#0f172a"
          opacity={0.92}
          stroke={color}
          strokeWidth={1.5}
        />
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#ffffff"
          fontSize="11"
          fontWeight="black"
        >
          {title}
        </text>
        <text
          x={0}
          y={16}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#93c5fd"
          fontSize="9.5"
          fontFamily="monospace"
        >
          {line1}
        </text>
        <text
          x={0}
          y={28}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#cbd5e1"
          fontSize="9"
          fontFamily="monospace"
        >
          {line2}
        </text>
      </g>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <ContainerComportas
        is3D={props.is3D}
        setIs3D={props.setIs3D}
        showVectors={props.showVectors}
        setShowVectors={props.setShowVectors}
        showFrontalView={Boolean(props.isFrontalView)}
        setShowFrontalView={props.setIsFrontalView}
        showExerciseDims={showExerciseDims}
        setShowExerciseDims={setShowExerciseDims}
        isAnalyzed={props.isAnalyzed}
        onCalculate={props.onCalculate}
        onReset={props.onReset}
        resetView={nav.resetView}
        handlers={nav.containerHandlers}
        renderedFaces={renderedFaces}
        vectors={vectors}
        SVG_W={SVG_W}
        SVG_H={SVG_H}
        ORIGIN_X={surfX}
        ORIGIN_Y={P_bed_inc.y}
        pan={nav.pan}
        zoom={nav.zoom}
        zoomPercent={nav.zoomPercent}
        canZoomIn={nav.canZoomIn}
        canZoomOut={nav.canZoomOut}
        onZoomIn={nav.zoomIn}
        onZoomOut={nav.zoomOut}
        isPanning={nav.isPanning}
        isSpacePressed={nav.isSpacePressed}
        containerRef={nav.containerRef}
        svgRef={nav.svgRef}
        upstreamFluidKey={props.upstreamFluidKey}
        downstreamFluidKey={props.downstreamFluidKey}
      >
        {/* Faixa de ondulação apenas na superfície da água (componente compartilhado Barragens 2D) */}
        {(() => {
          const upWaterHeightPx = Math.max(0, P_bed_inc.y - waterSurfaceY);
          const rippleUpH = Math.min(30, upWaterHeightPx);
          const upRippleBotX = P_surf.x + (u_down.x / u_down.y) * rippleUpH;

          const downWaterHeightPx =
            props.downstreamLevel > 0 ? Math.max(0, canalBedSurfaceY - downDepthY) : 0;
          const rippleDownH = Math.min(30, downWaterHeightPx);
          const downRippleBotX = downStartX + (u_down.x / u_down.y) * rippleDownH;

          return (
            <g key="water-surface-ripples-barragens" pointerEvents="none">
              <FaixaOndulacaoAgua2D
                xLeft={leftCanvasX}
                xRightTop={hasVerticalWallAboveA ? P_top.x : P_surf.x}
                xRightBottom={hasVerticalWallAboveA ? P_top.x : upRippleBotX}
                xLeftBottom={leftCanvasX}
                yTop={waterSurfaceY}
                heightPx={rippleUpH}
              />
              <FaixaOndulacaoAgua2D
                xLeft={downStartX}
                xRightTop={rightCanvasX}
                xRightBottom={rightCanvasX}
                xLeftBottom={
                  hasSmoothFloorSupport
                    ? (downDepthY <= P_top.y ? P_top.x + wallThick : downRippleBotX)
                    : downRippleBotX
                }
                yTop={downDepthY}
                heightPx={rippleDownH}
              />
            </g>
          );
        })()}

        {/* Diagrama Trapezoidal de Pressão Hidrostática */}
        {renderPressurePrism()}

        {/* Vista Frontal Rebatida da Comporta */}
        {renderFrontalView()}

        {/* Cotagens Didáticas Completas */}
        {renderDimensions()}

        {/* Elementos Adicionais (apoios, tirantes, fluxo) */}
        {overlayElements}

        {/* Tooltip Dinâmico ao passar o mouse em CG, CP ou Prisma */}
        {renderInteractiveTooltip()}
      </ContainerComportas>
    </div>
  );
};
