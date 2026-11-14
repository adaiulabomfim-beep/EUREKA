import React, { useState } from 'react';
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
  gateShape: FormaComporta;
  gateWidth: number;
  gateHeight: number;
  gateDepthFromCrest: number;
  gateInclination: number;
  force: number;
  s_cp: number;
  hingePosition: PosicaoDobradica;
  hasTieRod: boolean;
  tieRodPosRel: number;
  tieRodAngle: number;
  gateWeight?: number;
  gateWeightEnabled?: boolean;
  isAnalyzed: boolean;
  onCalculate: () => void;
  onReset: () => void;
  is3D: boolean;
  setIs3D: (v: boolean) => void;
  showVectors: boolean;
  setShowVectors: (v: boolean) => void;
  wallDims: { height: number; thickness: number; width: number };
  sistemaUnidades?: SistemaUnidades;
  modoPosicionamento?: ModoPosicionamentoComporta;
  y_cg_direto?: number;
}

export const Vista2D: React.FC<Vista2DProps> = (props) => {
  const { SVG_W, SVG_H } = DIMENSOES_CENA_2D;

  // View toggles
  const [showFrontalView, setShowFrontalView] = useState<boolean>(true);
  const [showExerciseDims, setShowExerciseDims] = useState<boolean>(true);

  // Navegação 2D (zoom no cursor, pan com botão do meio ou Espaço + esquerdo, touch e Home)
  const nav = useSvgPanZoom({
    svgWidth: SVG_W,
    svgHeight: SVG_H,
    minZoom: 0.45,
    maxZoom: 4.0,
  });

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
  const force_disp = isKgf ? `${Math.round(F_resultant_kgf).toLocaleString('pt-BR')} kgf` : `${F_resultant_kN.toFixed(1)} kN`;

  // --- RESPONSIVE SCREEN COORDINATES & PROPORTIONAL AUTO-FIT SCALING (900x520) ---
  const tanTheta = Math.tan(thetaRad);
  const totalWaterDepth = Math.max(h_bot, props.upstreamLevel || 0, 0.8);
  const bedMarginM = Math.max(0.28, Math.min(0.75, totalWaterDepth * 0.14));
  const bedDepthM = Math.max(h_bot + bedMarginM, props.upstreamLevel || 0);
  const crestAboveM = Math.max(0.38, Math.min(0.95, totalWaterDepth * 0.18));

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

  const slopeRunM = bedDepthM / Math.max(0.15, tanTheta);
  const crestRightM = crestAboveM / Math.max(0.15, tanTheta) + wallThickM / sinTheta;
  const frontalRightM = showFrontalView
    ? Math.max(0, 2 * shapeExtentM * sinTheta + (H / 2) * cosTheta - Y_CG * cosTheta)
    : 0;
  const rightExtentM = Math.max(
    crestRightM + (props.downstreamLevel > 0 ? 1.5 : 0.4),
    frontalRightM
  );

  const topPadPx = 88;
  const botPadPx = 38;
  const baseProjClear = props.isAnalyzed ? 148 : 102;

  const bottomDepthM = bedDepthM + slabThickM + soilThickM;
  const scaleY1 = (SVG_H - topPadPx - botPadPx) / Math.max(1.2, topReachM + bottomDepthM);

  const frontalBotM = showFrontalView && props.hasGate ? h_bot + 2 * shapeExtentM * cosTheta : 0;
  const frontalBotFixedPx = showFrontalView && props.hasGate ? (baseProjClear + 36) * cosTheta : 0;
  const scaleY2 =
    showFrontalView && props.hasGate && cosTheta > 0.01
      ? (SVG_H - topPadPx - 24 - frontalBotFixedPx) / Math.max(0.5, topReachM + frontalBotM)
      : Infinity;
  const scaleY = Math.min(scaleY1, scaleY2);

  const leftPadPx = showExerciseDims
    ? props.isAnalyzed
      ? 235
      : 135
    : props.isAnalyzed && props.showVectors
    ? 145
    : 95;
  const rightFixedPx = showFrontalView
    ? props.isAnalyzed
      ? 205
      : 155
    : props.isAnalyzed
    ? 140
    : 85;
  const horizSpanM = slopeRunM + rightExtentM;
  const scaleX =
    (SVG_W - 44 - leftPadPx - rightFixedPx) / Math.max(0.8, horizSpanM);

  const SCALE = Math.max(12, Math.min(scaleY, scaleX, 118));
  const maxMeters = Math.max(props.upstreamLevel, bedDepthM, 3.0);

  const usedBotPx = Math.max(
    (topReachM + bottomDepthM) * SCALE + botPadPx,
    showFrontalView && props.hasGate
      ? (topReachM + frontalBotM) * SCALE + frontalBotFixedPx + 24
      : 0
  );
  const extraY = Math.max(0, (SVG_H - topPadPx - usedBotPx) / 2);
  const waterSurfaceY = topPadPx + extraY + topReachM * SCALE;

  const leftHalfPx = leftPadPx + slopeRunM * SCALE;
  const rightHalfPx = rightFixedPx + rightExtentM * SCALE;
  const extraX = Math.max(0, (SVG_W - 44 - leftHalfPx - rightHalfPx) / 2);
  const surfX = 22 + leftHalfPx + extraX;
  const P_surf = { x: surfX, y: waterSurfaceY };

  // Helper for points on the inclined plane at distance Y along incline from water surface
  const getInclinePt = (Y_dist: number) => ({
    x: P_surf.x + u_down.x * (Y_dist * SCALE),
    y: P_surf.y + u_down.y * (Y_dist * SCALE),
  });

  const P_top = getInclinePt(Y_top);
  const P_bot = getInclinePt(Y_top + H);
  const P_CG = getInclinePt(Y_CG);
  const P_CP = getInclinePt(Y_CP);

  // Incline extension above water surface (crest of wall)
  const Y_crest_above = crestAboveM / sinTheta;
  const P_crest = {
    x: P_surf.x - u_down.x * (Y_crest_above * SCALE),
    y: P_surf.y - u_down.y * (Y_crest_above * SCALE),
  };

  // Incline extension down to canal bed
  const Y_bed_below = bedDepthM / sinTheta;
  const P_bed_inc = getInclinePt(Y_bed_below);

  const wallThick = Math.max(15, Math.min(34, wallThickM * SCALE));
  const slabThickPx = Math.max(14, Math.min(28, slabThickM * SCALE));
  const soilThickPx = Math.max(26, Math.min(68, soilThickM * SCALE));
  const wallHorizThick = wallThick / sinTheta;

  const leftBoundX = 22;
  const rightBoundX = SVG_W - 22;
  const rightSlabX =
    props.downstreamLevel > 0
      ? rightBoundX
      : Math.min(rightBoundX, P_bed_inc.x + wallHorizThick);
  const rightSoilX =
    props.downstreamLevel > 0
      ? rightBoundX
      : Math.min(rightBoundX, P_bed_inc.x + wallHorizThick + Math.max(38, soilThickPx * 1.1));

  // --- SVG GEOMETRIC MESH / POLYGONS ---
  const renderedFaces: any[] = [];

  // 1. Foundation Bed (Earth block — padrão exato Barragens)
  const soilTopY = P_bed_inc.y + slabThickPx;
  const soilBottomY = soilTopY + soilThickPx;
  renderedFaces.push({
    id: 'canal-bed-base',
    kind: 'DAM',
    pts: [
      { x: leftBoundX, y: soilTopY },
      { x: rightSoilX, y: soilTopY },
      { x: rightSoilX, y: soilBottomY },
      { x: leftBoundX, y: soilBottomY },
    ],
    fill: CORES_MATERIAIS.terraFill,
    stroke: CORES_MATERIAIS.terraStroke,
    strokeWidth: CORES_MATERIAIS.terraStrokeWidth,
    hatchPattern: CORES_MATERIAIS.terraHatch,
    opacity: 1,
  });

  // 2. Continuous Concrete Wall (Concreto padronizado com hachura Barragens)
  renderedFaces.push({
    id: 'wall-full-masonry',
    kind: 'DAM',
    pts: [
      P_crest,
      { x: P_crest.x + wallHorizThick, y: P_crest.y },
      { x: P_bed_inc.x + wallHorizThick, y: P_bed_inc.y },
      { x: rightSlabX, y: P_bed_inc.y },
      { x: rightSlabX, y: soilTopY },
      { x: leftBoundX, y: soilTopY },
      { x: leftBoundX, y: P_bed_inc.y },
      P_bed_inc,
    ],
    fill: CORES_MATERIAIS.concretoFill,
    stroke: CORES_MATERIAIS.concretoStroke,
    strokeWidth: CORES_MATERIAIS.concretoStrokeWidth,
    hatchPattern: CORES_MATERIAIS.concretoHatch,
    opacity: 1,
  });

  // 4. Reservoir Water Body (Montante / Upstream side on left — gradiente idêntico ao módulo Barragens)
  renderedFaces.push({
    id: 'water-upstream-body',
    kind: 'WATER_UP',
    pts: [
      { x: leftBoundX, y: waterSurfaceY },
      P_surf,
      P_top,
      props.hasGate ? P_bot : P_top,
      P_bed_inc,
      { x: leftBoundX, y: P_bed_inc.y },
    ],
    fill: 'url(#fluidDepthA)',
    stroke: 'none',
    strokeWidth: 0,
    opacity: 1,
  });

  // Helper para cota visual de jusante proporcional ao fundo do canal (y = P_bed_inc.y)
  const canalBedSurfaceY = P_bed_inc.y;
  const downRatio =
    props.upstreamLevel > 0
      ? Math.min(1.12, Math.max(0, props.downstreamLevel / props.upstreamLevel))
      : 0;
  const downRawY = canalBedSurfaceY - downRatio * (canalBedSurfaceY - waterSurfaceY);
  const downDepthY = Math.min(canalBedSurfaceY, Math.max(downRawY, P_crest.y + 6));
  const downStartX =
    P_surf.x + (u_down.x / u_down.y) * (downDepthY - waterSurfaceY) + wallHorizThick;
  const downBottomLeftX = P_bed_inc.x + wallHorizThick;

  // 5. Downstream water body (if active — gradiente idêntico ao módulo Barragens)
  if (props.downstreamLevel > 0) {
    renderedFaces.push({
      id: 'water-downstream-body',
      kind: 'WATER_DOWN',
      pts: [
        { x: downStartX, y: downDepthY },
        { x: rightBoundX, y: downDepthY },
        { x: rightBoundX, y: canalBedSurfaceY },
        { x: downBottomLeftX, y: canalBedSurfaceY },
      ],
      fill: 'url(#fluidDepthB)',
      stroke: 'none',
      strokeWidth: 0,
      opacity: 1,
    });
  }

  // 6. Gate Plate on the Incline
  const gatePlateThick = Math.max(6, Math.min(10, wallThick * 0.36));
  if (props.hasGate) {
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
    // Raised/open gate
    const liftDist = H * 0.9 * SCALE;
    renderedFaces.push({
      id: 'gate-incline-raised',
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
      opacity: 0.9,
    });
  }

  // --- VECTORS (paleta oficial Barragens) ---
  const vectors: any[] = [];
  if (props.hasGate && props.showVectors) {
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

  // --- OVERLAY ELEMENTS (FLUXO, DOBRADIÇA, TIRANTES) ---
  const overlayElements: React.ReactNode[] = [];

  // 3. Jato e turbilhonamento quando comporta está levantada/aberta (!hasGate)
  if (!props.hasGate) {
    overlayElements.push(
      <g key="gate-open-flow-discharge" pointerEvents="none">
        {[0.2, 0.5, 0.8].map((t, idx) => {
          const ptStart = {
            x: P_top.x + u_down.x * (t * H * SCALE),
            y: P_top.y + u_down.y * (t * H * SCALE),
          };
          const ptEnd = {
            x: ptStart.x + n_out.x * 130,
            y: ptStart.y + n_out.y * 65 + 15,
          };
          return (
            <path
              key={`streamline-${idx}`}
              d={`M ${ptStart.x - 25},${ptStart.y} Q ${ptStart.x + 10},${ptStart.y} ${ptEnd.x},${ptEnd.y}`}
              fill="none"
              stroke="#38bdf8"
              strokeWidth={3}
              strokeDasharray="10 8"
              opacity={0.85}
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-36"
                dur="0.6s"
                repeatCount="indefinite"
              />
            </path>
          );
        })}
      </g>
    );
  }

  // Hinge if configured
  if (props.hasGate && props.hingePosition !== PosicaoDobradica.NONE) {
    const hingePt = props.hingePosition === PosicaoDobradica.TOP ? P_top : P_bot;
    overlayElements.push(
      <g key="hinge-indicator">
        <circle cx={hingePt.x} cy={hingePt.y} r={7} fill="#f59e0b" stroke="#78350f" strokeWidth={2} />
        <circle cx={hingePt.x} cy={hingePt.y} r={2.5} fill="#ffffff" />
      </g>
    );
  }

  // Tie rod if configured
  if (props.hasGate && props.hasTieRod) {
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
    if (!props.hasGate || !props.isAnalyzed || !props.showVectors) return null;

    const maxP = Math.max(1, p_bot_Pa);
    const maxDiagWidth = 54; // px
    const w_top = (p_top_Pa / maxP) * maxDiagWidth;
    const w_bot = maxDiagWidth;

    const ptTopOuter = { x: P_top.x - n_out.x * w_top, y: P_top.y - n_out.y * w_top };
    const ptBotOuter = { x: P_bot.x - n_out.x * w_bot, y: P_bot.y - n_out.y * w_bot };

    const prismPath = `M ${P_top.x},${P_top.y} L ${ptTopOuter.x},${ptTopOuter.y} L ${ptBotOuter.x},${ptBotOuter.y} L ${P_bot.x},${P_bot.y} Z`;

    const eStart = {
      x: P_CP.x - n_out.x * (maxDiagWidth + 36),
      y: P_CP.y - n_out.y * (maxDiagWidth + 36),
    };

    const forceText = `E = ${force_disp}`;
    const pillW = Math.max(76, forceText.length * 6.5 + 18);

    return (
      <g
        key="pressure-trapezoidal-diagram"
        className="animate-in fade-in duration-300 transition-opacity"
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setHoveredItem('PRISM')}
        onMouseLeave={() => setHoveredItem(null)}
      >
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

        {/* Label p_topo (com contorno branco suave para nitidez sobre a água) */}
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
          p<tspan baselineShift="sub" fontSize="7.5">topo</tspan> = {p_top_disp} {p_unit}
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

        {/* Seta da Força Resultante E (padrão Barragens: azul #2563eb com ponta #1e40af) */}
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

        {/* Pílula branca com borda suave da Força Resultante E (idêntica a Barragens) */}
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
            {forceText}
          </text>
        </g>
      </g>
    );
  };

  // --- RENDER FRONT VIEW (VISTA FRONTAL REBATIDA DA COMPORTA) ---
  const renderFrontalView = () => {
    if (!showFrontalView || !props.hasGate) return null;

    const R_px = (H * SCALE) / 2;
    const W_px = Math.min(W * SCALE, H * SCALE * 3.6);
    const shapeExtentOut =
      shape === FormaComporta.RETANGULAR
        ? W_px / 2
        : shape === FormaComporta.SEMI_CIRCULAR
        ? H * SCALE
        : R_px;

    // Mantém afastamento limpo em relação às cotas inclinadas y_CG e y_CP
    const baseProjClear = props.isAnalyzed ? 148 : 102;
    const D_proj = baseProjClear + shapeExtentOut;

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

    const P_top_proj = {
      x: P_top.x + n_out.x * D_proj,
      y: P_top.y + n_out.y * D_proj,
    };
    const P_bot_proj = {
      x: P_bot.x + n_out.x * D_proj,
      y: P_bot.y + n_out.y * D_proj,
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

    const dimLabel = `${H.toFixed(2)} m (${(H * 100).toFixed(0)} cm)`;

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

        {/* --- TRUE FRONTAL GATE SHAPE --- */}
        {shape === FormaComporta.CIRCULAR && (
          <g>
            <circle
              cx={C_proj.x}
              cy={C_proj.y}
              r={R_px}
              fill="#f8fafc"
              stroke="#0f172a"
              strokeWidth="2"
            />
            <circle
              cx={C_proj.x}
              cy={C_proj.y}
              r={R_px}
              fill="url(#gateHatchPattern)"
              stroke="none"
            />

            <line
              x1={C_proj.x - u_down.x * (R_px + 12)}
              y1={C_proj.y - u_down.y * (R_px + 12)}
              x2={C_proj.x + u_down.x * (R_px + 12)}
              y2={C_proj.y + u_down.y * (R_px + 12)}
              stroke={CORES_MATERIAIS.cotaLinha}
              strokeWidth="1"
              strokeDasharray="7 3 2 3"
            />
            <line
              x1={C_proj.x - n_out.x * (R_px + 12)}
              y1={C_proj.y - n_out.y * (R_px + 12)}
              x2={C_proj.x + n_out.x * (R_px + 12)}
              y2={C_proj.y + n_out.y * (R_px + 12)}
              stroke={CORES_MATERIAIS.cotaLinha}
              strokeWidth="1"
              strokeDasharray="7 3 2 3"
            />
          </g>
        )}

        {shape === FormaComporta.RETANGULAR && (
          <g>
            {(() => {
              const halfH = (H * SCALE) / 2;
              const halfW = W_px / 2;
              const p1 = { x: C_proj.x - u_down.x * halfH - n_out.x * halfW, y: C_proj.y - u_down.y * halfH - n_out.y * halfW };
              const p2 = { x: C_proj.x - u_down.x * halfH + n_out.x * halfW, y: C_proj.y - u_down.y * halfH + n_out.y * halfW };
              const p3 = { x: C_proj.x + u_down.x * halfH + n_out.x * halfW, y: C_proj.y + u_down.y * halfH + n_out.y * halfW };
              const p4 = { x: C_proj.x + u_down.x * halfH - n_out.x * halfW, y: C_proj.y + u_down.y * halfH - n_out.y * halfW };
              const d = `M ${p1.x},${p1.y} L ${p2.x},${p2.y} L ${p3.x},${p3.y} L ${p4.x},${p4.y} Z`;

              return (
                <>
                  <path d={d} fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
                  <path d={d} fill="url(#gateHatchPattern)" stroke="none" />
                  <line
                    x1={C_proj.x - u_down.x * (halfH + 12)}
                    y1={C_proj.y - u_down.y * (halfH + 12)}
                    x2={C_proj.x + u_down.x * (halfH + 12)}
                    y2={C_proj.y + u_down.y * (halfH + 12)}
                    stroke={CORES_MATERIAIS.cotaLinha}
                    strokeWidth="1"
                    strokeDasharray="7 3 2 3"
                  />
                  <line
                    x1={C_proj.x - n_out.x * (halfW + 12)}
                    y1={C_proj.y - n_out.y * (halfW + 12)}
                    x2={C_proj.x + n_out.x * (halfW + 12)}
                    y2={C_proj.y + n_out.y * (halfW + 12)}
                    stroke={CORES_MATERIAIS.cotaLinha}
                    strokeWidth="1"
                    strokeDasharray="7 3 2 3"
                  />
                </>
              );
            })()}
          </g>
        )}

        {shape === FormaComporta.SEMI_CIRCULAR && (
          <g>
            {(() => {
              const H_px = H * SCALE;
              const R_semi = H_px;
              const steps = 32;
              const pts: string[] = [];
              for (let i = 0; i <= steps; i++) {
                const a = (i / steps) * Math.PI;
                const s = Math.sin(a) * H_px;
                const c = Math.cos(a) * R_semi;
                const px = P_bot_proj.x - u_down.x * s + n_out.x * c;
                const py = P_bot_proj.y - u_down.y * s + n_out.y * c;
                pts.push(`${px.toFixed(2)},${py.toFixed(2)}`);
              }
              const dSemi = `M ${pts.join(' L ')} Z`;
              return (
                <>
                  <path d={dSemi} fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
                  <path d={dSemi} fill="url(#gateHatchPattern)" stroke="none" />
                  <line
                    x1={P_top_proj.x - u_down.x * 10}
                    y1={P_top_proj.y - u_down.y * 10}
                    x2={P_bot_proj.x + u_down.x * 10}
                    y2={P_bot_proj.y + u_down.y * 10}
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

        {/* --- CENTER OF PRESSURE (CP) NA VISTA FRONTAL --- */}
        {props.isAnalyzed && (
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
    const gammaLabel = `γ = ${gamma_kgf} kgf/m³ (${(gamma_N / 1000).toFixed(2)} kN/m³)`;
    const gammaBoxW = gammaLabel.length * 6.4 + 14;
    dims.push(
      <g key="water-gamma-badge" transform={`translate(${leftBoundX + 12}, ${P_bed_inc.y - 20})`}>
        <rect
          x={0}
          y={-10}
          width={gammaBoxW}
          height={20}
          rx={4}
          fill="#ffffff"
          fillOpacity={0.9}
          stroke="#cbd5e1"
          strokeWidth={0.8}
        />
        <text
          x={7}
          y={0}
          textAnchor="start"
          dominantBaseline="central"
          fill={CORES_MATERIAIS.cotaNivelTexto}
          fontSize="11"
          fontWeight="700"
          stroke="none"
        >
          {gammaLabel}
        </text>
      </g>
    );

    // 3, 4 e 5. Colunas verticais de profundidade (h_topo, h_CG, h_CP) à esquerda do prisma de pressão
    const isDirectYcgMode = props.modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO;
    const prismClearX =
      props.isAnalyzed && props.showVectors
        ? Math.min(P_bot.x - n_out.x * 62, P_CP.x - n_out.x * 96) - 44
        : Math.min(P_top.x, P_bot.x) - 38;

    const colTopX = Math.max(leftBoundX + 145, Math.min(P_surf.x - 45, prismClearX));
    const colCgX = Math.max(leftBoundX + 78, colTopX - 66);
    const colCpX = Math.max(leftBoundX + 14, colCgX - 66);

    if (!isDirectYcgMode || props.isAnalyzed) {
      const hTopPlain = `htopo = ${h_top.toFixed(2)} m`;
      dims.push(
        drawVerticalDimAtX(
          'dim-h-top',
          { x: P_top.x, y: waterSurfaceY },
          { x: P_top.x, y: P_top.y },
          colTopX,
          <>
            h<tspan baselineShift="sub" fontSize="8.5">topo</tspan> = {h_top.toFixed(2)} m
          </>,
          hTopPlain.length,
          0.36
        )
      );
    }

    if (props.isAnalyzed) {
      const hCgPlain = `hCG = ${h_CG.toFixed(2)} m`;
      dims.push(
        drawVerticalDimAtX(
          'dim-h-cg',
          { x: P_CG.x, y: waterSurfaceY },
          { x: P_CG.x, y: P_CG.y },
          colCgX,
          <>
            h<tspan baselineShift="sub" fontSize="8.5">CG</tspan> = {h_CG.toFixed(2)} m
          </>,
          hCgPlain.length,
          0.52
        )
      );

      const hCpPlain = `hCP = ${h_CP.toFixed(2)} m`;
      dims.push(
        drawVerticalDimAtX(
          'dim-h-cp',
          { x: P_CP.x, y: waterSurfaceY },
          { x: P_CP.x, y: P_CP.y },
          colCpX,
          <>
            h<tspan baselineShift="sub" fontSize="8.5">CP</tspan> = {h_CP.toFixed(2)} m
          </>,
          hCpPlain.length,
          0.68
        )
      );
    }

    // 6. Ângulo de Inclinação (θ) na superfície d'água (padrão Barragens)
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

    // 8. PONTO CG (⊕ padrão Barragens) e PONTO E / CP NA COMPORTA
    if (props.hasGate) {
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

          {/* Ponto E: Centro de Pressão (Empuxo Resultante) - somente após análise */}
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
                E
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
        showFrontalView={showFrontalView}
        setShowFrontalView={setShowFrontalView}
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
                xLeft={leftBoundX}
                xRightTop={P_surf.x}
                xRightBottom={upRippleBotX}
                xLeftBottom={leftBoundX}
                yTop={waterSurfaceY}
                heightPx={rippleUpH}
              />
              <FaixaOndulacaoAgua2D
                xLeft={downStartX}
                xRightTop={rightBoundX}
                xRightBottom={rightBoundX}
                xLeftBottom={downRippleBotX}
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
