import React, { useState, useRef, useCallback } from 'react';
import { ContainerComportas } from './ContainerComportas';
import {
  FormaComporta,
  PosicaoDobradica,
  FLUIDOS_PREDEFINIDOS,
  SistemaUnidades,
  ModoPosicionamentoComporta,
} from '../dominio/tipos';

interface Vista2DProps {
  upstreamLevel: number;
  downstreamLevel: number;
  upstreamFluidKey: string;
  downstreamFluidKey: string;
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
  const SVG_W = 750;
  const SVG_H = 500;

  // View toggles
  const [showFrontalView, setShowFrontalView] = useState<boolean>(true);
  const [showExerciseDims, setShowExerciseDims] = useState<boolean>(true);

  // Pan and Zoom Navigation Engine (Interatividade idêntica ao módulo de Barragens)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number; dist?: number }>({ x: 0, y: 0 });

  // Tooltips interativos de pontos notáveis
  const [hoveredItem, setHoveredItem] = useState<'CG' | 'CP' | 'PRISM' | null>(null);

  const resetView = useCallback(() => {
    setIsResetting(true);
    setPan({ x: 0, y: 0 });
    setZoom(1);
    const timer = setTimeout(() => setIsResetting(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(2.8, +(z * 1.2).toFixed(2)));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.4, +(z / 1.2).toFixed(2)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      setIsDragging(true);
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.max(0.4, Math.min(2.8, +(prev * factor).toFixed(3))));
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = { x: 0, y: 0, dist };
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - touchStartRef.current.x;
        const dy = e.touches[0].clientY - touchStartRef.current.y;
        setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2 && touchStartRef.current.dist) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / touchStartRef.current.dist;
        setZoom((prev) => Math.max(0.4, Math.min(2.8, +(prev * factor).toFixed(3))));
        touchStartRef.current.dist = dist;
      }
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    touchStartRef.current = { x: 0, y: 0 };
  }, []);

  const interactionHandlers = {
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp,
    onWheel: handleWheel,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onDoubleClick: resetView,
    style: { cursor: isDragging ? 'grabbing' : 'grab' },
  };

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

  // Posicionamento: Modo Y_CG direto vs Modo Padrão (h1)
  let h_top = Math.max(0, props.gateDepthFromCrest);
  let Y_CG = 0;
  let Y_top = 0;

  if (
    props.modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO &&
    props.y_cg_direto !== undefined &&
    props.y_cg_direto > 0
  ) {
    Y_CG = props.y_cg_direto;
    const h_CG_nominal = Y_CG * sinTheta;
    h_top = Math.max(0, h_CG_nominal - y_cg_rel * sinTheta);
    Y_top = Y_CG - y_cg_rel;
  } else {
    Y_top = h_top / sinTheta;
    Y_CG = Y_top + y_cg_rel;
  }

  const h_CG = Y_CG * sinTheta;

  // Eccentricity along the incline: delta_y = Ixx / (A * Y_CG)
  const delta_y = Area > 0 && Y_CG > 0 ? Ixx / (Area * Y_CG) : 0;
  const Y_CP = Y_CG + delta_y;
  const h_CP = Y_CP * sinTheta;
  const h_bot = h_top + H * sinTheta;

  // Fluid properties
  const fluidInfo = FLUIDOS_PREDEFINIDOS[props.upstreamFluidKey] || FLUIDOS_PREDEFINIDOS.agua;
  const rho = fluidInfo.densidade || 1000;
  const g = 9.81;
  const gamma_N = rho * g; // N/m³
  const gamma_kgf = rho; // kgf/m³

  // Pressões no topo e na base da comporta
  const p_top_Pa = gamma_N * Math.max(0, h_top);
  const p_bot_Pa = gamma_N * Math.max(0, h_bot);
  const p_cg_Pa = gamma_N * Math.max(0, h_CG);

  // Força resultante teórica ou analisada
  const F_resultant_N = props.isAnalyzed && props.force > 0 ? props.force : p_cg_Pa * Area;
  const F_resultant_kN = F_resultant_N / 1000;
  const F_resultant_kgf = F_resultant_N / g;

  // Pressões formatadas conforme sistema de unidades
  const p_top_disp = isKgf ? (p_top_Pa / g).toFixed(0) : (p_top_Pa / 1000).toFixed(1);
  const p_bot_disp = isKgf ? (p_bot_Pa / g).toFixed(0) : (p_bot_Pa / 1000).toFixed(1);
  const p_unit = isKgf ? 'kgf/m²' : 'kPa';
  const force_disp = isKgf ? `${Math.round(F_resultant_kgf).toLocaleString('pt-BR')} kgf` : `${F_resultant_kN.toFixed(1)} kN`;

  // --- RESPONSIVE SCREEN COORDINATES & SCALING ---
  const H_span = (Y_top + H) * sinTheta + 1.25;
  const maxMeters = Math.max(props.upstreamLevel, H_span, 3.0);
  const SCALE = Math.min((SVG_H * 0.58) / Math.max(2.4, H_span), 102);

  // Position of water surface line and slope intersection
  const waterSurfaceY = 135;
  const surfX = Math.min(435, SVG_W * 0.58);
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
  const Y_crest_above = 0.65 / sinTheta;
  const P_crest = {
    x: P_surf.x - u_down.x * (Y_crest_above * SCALE),
    y: P_surf.y - u_down.y * (Y_crest_above * SCALE),
  };

  // Incline extension below gate to canal bed
  const Y_bed_below = (Y_top + H) + 0.65 / sinTheta;
  const P_bed_inc = getInclinePt(Y_bed_below);
  const P_bed_left = { x: P_bed_inc.x - 70, y: P_bed_inc.y };

  const wallThick = 26; // px

  // --- SVG GEOMETRIC MESH / POLYGONS ---
  const renderedFaces: any[] = [];

  // 1. Foundation Bed (Earth / Concrete bottom)
  renderedFaces.push({
    id: 'canal-bed-base',
    kind: 'DAM',
    pts: [
      { x: 20, y: P_bed_inc.y + 24 },
      { x: P_bed_inc.x + n_out.x * wallThick + 40, y: P_bed_inc.y + 24 },
      { x: P_bed_inc.x + n_out.x * wallThick + 40, y: P_bed_inc.y + 55 },
      { x: 20, y: P_bed_inc.y + 55 },
    ],
    fill: '#a16207',
    stroke: '#713f12',
    strokeWidth: 1.2,
    hatchPattern: 'url(#earthPattern)',
    opacity: 1,
  });

  // 2. Upper Masonry Wall (from crest down to top of gate)
  renderedFaces.push({
    id: 'wall-upper-masonry',
    kind: 'DAM',
    pts: [
      P_crest,
      { x: P_crest.x + n_out.x * wallThick, y: P_crest.y + n_out.y * wallThick },
      { x: P_top.x + n_out.x * wallThick, y: P_top.y + n_out.y * wallThick },
      P_top,
    ],
    fill: 'url(#brickPattern)',
    stroke: '#475569',
    strokeWidth: 1.2,
    opacity: 1,
  });

  // 3. Lower Masonry Wall & Stepped Base (from bottom of gate to canal bed)
  renderedFaces.push({
    id: 'wall-lower-masonry',
    kind: 'DAM',
    pts: [
      P_bot,
      { x: P_bot.x + n_out.x * wallThick, y: P_bot.y + n_out.y * wallThick },
      { x: P_bed_inc.x + n_out.x * wallThick, y: P_bed_inc.y + n_out.y * wallThick },
      { x: P_bed_inc.x + n_out.x * wallThick, y: P_bed_inc.y + 24 },
      { x: P_bed_left.x - 30, y: P_bed_inc.y + 24 },
      { x: P_bed_left.x - 30, y: P_bed_inc.y },
      P_bed_left,
      P_bed_inc,
    ],
    fill: 'url(#brickPattern)',
    stroke: '#475569',
    strokeWidth: 1.2,
    opacity: 1,
  });

  // 4. Reservoir Water Body (Montante / Upstream side on left)
  renderedFaces.push({
    id: 'water-upstream-body',
    kind: 'WATER_UP',
    pts: [
      { x: 30, y: waterSurfaceY },
      P_surf,
      P_top,
      props.hasGate ? P_bot : P_top,
      P_bed_inc,
      P_bed_left,
      { x: P_bed_left.x - 30, y: P_bed_inc.y },
      { x: 30, y: P_bed_inc.y },
    ],
    fill: 'url(#fluidDepthA)',
    stroke: 'none',
    strokeWidth: 0,
    opacity: 0.95,
  });

  // 5. Downstream water body (if active)
  if (props.downstreamLevel > 0) {
    const downDepthY = waterSurfaceY + (props.upstreamLevel - props.downstreamLevel) * SCALE;
    renderedFaces.push({
      id: 'water-downstream-body',
      kind: 'WATER_DOWN',
      pts: [
        { x: P_bot.x + n_out.x * wallThick, y: P_bot.y + n_out.y * wallThick },
        { x: SVG_W - 40, y: downDepthY },
        { x: SVG_W - 40, y: P_bed_inc.y + 24 },
        { x: P_bed_inc.x + n_out.x * wallThick, y: P_bed_inc.y + 24 },
      ],
      fill: 'url(#fluidDepthB)',
      stroke: 'none',
      strokeWidth: 0,
      opacity: 0.85,
    });
  }

  // 6. Gate Plate on the Incline
  const gatePlateThick = 9; // px
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
    const liftDist = (H * 0.9) * SCALE;
    renderedFaces.push({
      id: 'gate-incline-raised',
      kind: 'GATE',
      pts: [
        { x: P_top.x - u_down.x * liftDist, y: P_top.y - u_down.y * liftDist },
        { x: P_top.x - u_down.x * liftDist + n_out.x * gatePlateThick, y: P_top.y - u_down.y * liftDist + n_out.y * gatePlateThick },
        { x: P_bot.x - u_down.x * liftDist + n_out.x * gatePlateThick, y: P_bot.y - u_down.y * liftDist + n_out.y * gatePlateThick },
        { x: P_bot.x - u_down.x * liftDist, y: P_bot.y - u_down.y * liftDist },
      ],
      fill: 'url(#metalLinear)',
      stroke: '#0f172a',
      strokeWidth: 1.5,
      opacity: 0.9,
    });
  }

  // --- VECTORS ---
  const vectors: any[] = [];
  if (props.hasGate && props.showVectors) {
    if (props.isAnalyzed) {
      // Hydrostatic pressure vectors along gate face
      const numRays = 5;
      for (let i = 0; i <= numRays; i++) {
        const t = i / numRays;
        const pt = {
          x: P_top.x + u_down.x * (t * H * SCALE),
          y: P_top.y + u_down.y * (t * H * SCALE),
        };
        const depth_i = (pt.y - waterSurfaceY) / SCALE;
        if (depth_i > 0) {
          const len_ray = Math.min(45, (depth_i / maxMeters) * 50);
          vectors.push({
            start: { x: pt.x - n_out.x * len_ray, y: pt.y - n_out.y * len_ray },
            end: { x: pt.x, y: pt.y },
            color: '#0284c7',
            strokeWidth: 1.6,
            opacity: 0.65,
            isResultant: false,
          });
        }
      }
    }
  }

  // --- OVERLAY ELEMENTS (ONDAS DINÂMICAS, FLUXO, DOBRADIÇA, TIRANTES) ---
  const overlayElements: React.ReactNode[] = [];

  // 1. Água Montante: Ondas de superfície dinâmicas, reflexos de luz e bolhas de ar
  overlayElements.push(
    <g key="upstream-surface-waves" pointerEvents="none">
      {/* Ondas fluidas móveis cobrindo a camada superficial */}
      <rect
        x={30}
        y={waterSurfaceY - 12}
        width={surfX - 30}
        height={24}
        fill="url(#waveSurfacePattern)"
      />
      {/* Reflexos de luz e caústicas em deslocamento constante */}
      <rect
        x={30}
        y={waterSurfaceY - 4}
        width={surfX - 30}
        height={32}
        fill="url(#ripplePattern)"
        opacity={0.65}
      />
      {/* Linha cintilante da crista da onda */}
      <line
        x1={30}
        y1={waterSurfaceY}
        x2={surfX}
        y2={waterSurfaceY}
        stroke="#ffffff"
        strokeWidth={2}
        opacity={0.85}
      />
      <line
        x1={30}
        y1={waterSurfaceY + 1.2}
        x2={surfX}
        y2={waterSurfaceY + 1.2}
        stroke="#38bdf8"
        strokeWidth={1.5}
        opacity={0.9}
      />
      {/* Bolhas ambientais flutuantes no reservatório de montante */}
      {[
        { cx: 75, cy: P_bed_inc.y - 35, r: 2.2, dur: '5.2s', delay: '0s' },
        { cx: 155, cy: P_bed_inc.y - 75, r: 3.0, dur: '4.8s', delay: '1.2s' },
        { cx: 220, cy: P_bed_inc.y - 45, r: 2.0, dur: '6.0s', delay: '2.5s' },
        { cx: 285, cy: P_bed_inc.y - 95, r: 2.6, dur: '5.0s', delay: '0.7s' },
      ].map((b, i) => (
        <circle key={`bubble-${i}`} cx={b.cx} cy={b.cy} r={b.r} fill="#ffffff" opacity={0.35}>
          <animate
            attributeName="cy"
            values={`${b.cy}; ${waterSurfaceY + 8}`}
            dur={b.dur}
            begin={b.delay}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.1; 0.55; 0.55; 0"
            dur={b.dur}
            begin={b.delay}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </g>
  );

  // 2. Água Jusante (se ativada): Ondas móveis
  if (props.downstreamLevel > 0) {
    const downDepthY = waterSurfaceY + (props.upstreamLevel - props.downstreamLevel) * SCALE;
    const downStartX = P_bot.x + n_out.x * wallThick;
    overlayElements.push(
      <g key="downstream-surface-waves" pointerEvents="none">
        <rect
          x={downStartX}
          y={downDepthY - 10}
          width={SVG_W - downStartX - 40}
          height={20}
          fill="url(#waveSurfacePattern)"
        />
        <line
          x1={downStartX}
          y1={downDepthY}
          x2={SVG_W - 40}
          y2={downDepthY}
          stroke="#ffffff"
          strokeWidth={1.8}
          opacity={0.8}
        />
      </g>
    );
  }

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

  // --- DIAGRAMA DE PRESSÃO TRAPEZOIDAL SOBRE A COMPORTA (ITEM 4) ---
  const renderPressurePrism = () => {
    if (!props.hasGate || !props.isAnalyzed || !props.showVectors) return null;

    // Largura do diagrama proporcional à pressão em cada ponto
    const maxP = Math.max(1, p_bot_Pa);
    const maxDiagWidth = 65; // px
    const w_top = (p_top_Pa / maxP) * maxDiagWidth;
    const w_bot = maxDiagWidth;

    // Vértices do prisma de pressão na face montante (direção -n_out)
    const ptTopOuter = { x: P_top.x - n_out.x * w_top, y: P_top.y - n_out.y * w_top };
    const ptBotOuter = { x: P_bot.x - n_out.x * w_bot, y: P_bot.y - n_out.y * w_bot };

    const prismPath = `M ${P_top.x},${P_top.y} L ${ptTopOuter.x},${ptTopOuter.y} L ${ptBotOuter.x},${ptBotOuter.y} L ${P_bot.x},${P_bot.y} Z`;

    // Ponto de início da seta F_R / E no diagrama
    const eStart = {
      x: P_CP.x - n_out.x * (maxDiagWidth + 40),
      y: P_CP.y - n_out.y * (maxDiagWidth + 40),
    };

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
          stroke="#2563eb"
          strokeWidth={hoveredItem === 'PRISM' ? 2.2 : 1.5}
          strokeLinejoin="round"
          opacity={hoveredItem === 'PRISM' ? 0.95 : 0.85}
        />

        {/* Linhas internas de variação de pressão (hachuras de carga) */}
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
              stroke="#60a5fa"
              strokeWidth={1}
              strokeDasharray="3 2"
              opacity={0.7}
            />
          );
        })}

        {/* Label p_topo */}
        <g transform={`translate(${ptTopOuter.x - n_out.x * 12}, ${ptTopOuter.y - n_out.y * 6})`}>
          <rect
            x={-44}
            y={-9}
            width={88}
            height={18}
            rx={3}
            fill="white"
            className="dark:fill-slate-900"
            stroke="none"
          />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#475569"
            className="dark:fill-slate-200"
            fontSize="11"
            fontWeight="700"
            stroke="none"
          >
            p<tspan baselineShift="sub" fontSize="7.5">topo</tspan> = {p_top_disp} {p_unit}
          </text>
        </g>

        {/* Label p_base */}
        <g transform={`translate(${ptBotOuter.x - n_out.x * 12}, ${ptBotOuter.y - n_out.y * 6})`}>
          <rect
            x={-44}
            y={-9}
            width={88}
            height={18}
            rx={3}
            fill="white"
            className="dark:fill-slate-900"
            stroke="none"
          />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#475569"
            className="dark:fill-slate-200"
            fontSize="11"
            fontWeight="700"
            stroke="none"
          >
            p<tspan baselineShift="sub" fontSize="7.5">base</tspan> = {p_bot_disp} {p_unit}
          </text>
        </g>

        {/* Seta de F_R / E apontando do diagrama diretamente para o Ponto E (CP) */}
        <line
          x1={eStart.x}
          y1={eStart.y}
          x2={P_CP.x}
          y2={P_CP.y}
          stroke="#0f172a"
          strokeWidth={hoveredItem === 'CP' ? 4.5 : 3.5}
          markerEnd="url(#arrow-thrust)"
          className="transition-all"
        />

        {/* Badge da Força Resultante E com Efeito Glow */}
        <g
          transform={`translate(${eStart.x - n_out.x * 10 - u_down.x * 10}, ${eStart.y - n_out.y * 10 - u_down.y * 10})`}
          filter="url(#glowResultant)"
          onMouseEnter={() => setHoveredItem('CP')}
          onMouseLeave={() => setHoveredItem(null)}
          style={{ cursor: 'pointer' }}
        >
          <rect
            x={-42}
            y={-14}
            width={84}
            height={28}
            rx={6}
            fill="#0f172a"
            stroke={hoveredItem === 'CP' ? '#f87171' : '#ffffff'}
            strokeWidth={hoveredItem === 'CP' ? 2 : 1.5}
          />
          <text
            x={0}
            y={-2}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#ffffff"
            fontSize="11"
            fontWeight="bold"
          >
            E = {force_disp}
          </text>
          <text
            x={0}
            y={8}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#94a3b8"
            fontSize="8"
            fontWeight="bold"
          >
            ({isKgf ? `${F_resultant_kN.toFixed(1)} kN` : `${Math.round(F_resultant_kgf).toLocaleString('pt-BR')} kgf`})
          </text>
        </g>
      </g>
    );
  };

  // --- RENDER FRONT VIEW (VISTA FRONTAL REBATIDA DA COMPORTA - ITEM 3) ---
  const renderFrontalView = () => {
    if (!showFrontalView || !props.hasGate) return null;

    const D_proj = 190;
    const R_px = (H * SCALE) / 2;
    const W_px = W * SCALE;

    // Center of the projected face (aligned with centroid CG)
    const C_proj = {
      x: P_CG.x + n_out.x * D_proj,
      y: P_CG.y + n_out.y * D_proj,
    };

    // Projection Lines extending perpendicular from the gate on the incline
    const projLineExtra = 40;
    const P_top_proj_end = {
      x: P_top.x + n_out.x * (D_proj + R_px + projLineExtra),
      y: P_top.y + n_out.y * (D_proj + R_px + projLineExtra),
    };
    const P_bot_proj_end = {
      x: P_bot.x + n_out.x * (D_proj + R_px + projLineExtra),
      y: P_bot.y + n_out.y * (D_proj + R_px + projLineExtra),
    };

    // Position of CP on the frontal view (eccentricity along longitudinal axis u_down)
    const CP_proj = {
      x: C_proj.x + u_down.x * (delta_y * SCALE),
      y: C_proj.y + u_down.y * (delta_y * SCALE),
    };

    // Dimension line across the frontal face
    const dimOffset = R_px + 28;
    const dimP1 = {
      x: C_proj.x - u_down.x * R_px + n_out.x * dimOffset,
      y: C_proj.y - u_down.y * R_px + n_out.y * dimOffset,
    };
    const dimP2 = {
      x: C_proj.x + u_down.x * R_px + n_out.x * dimOffset,
      y: C_proj.y + u_down.y * R_px + n_out.y * dimOffset,
    };

    const dimLabel = `${H.toFixed(2)} m (${(H * 100).toFixed(0)} cm)`;

    return (
      <g key="frontal-view-projection" className="animate-in fade-in duration-300">
        {/* Orthogonal Projection Lines (Linhas de Chamada tracejadas finas) */}
        <line
          x1={P_top.x}
          y1={P_top.y}
          x2={P_top_proj_end.x}
          y2={P_top_proj_end.y}
          stroke="#94a3b8"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />
        <line
          x1={P_bot.x}
          y1={P_bot.y}
          x2={P_bot_proj_end.x}
          y2={P_bot_proj_end.y}
          stroke="#94a3b8"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />

        {/* Dimension extension ticks to frontal dimension */}
        <line
          x1={C_proj.x - u_down.x * R_px}
          y1={C_proj.y - u_down.y * R_px}
          x2={dimP1.x}
          y2={dimP1.y}
          stroke="#64748b"
          strokeWidth="1.6"
          strokeDasharray="3 3"
          opacity="0.45"
        />
        <line
          x1={C_proj.x + u_down.x * R_px}
          y1={C_proj.y + u_down.y * R_px}
          x2={dimP2.x}
          y2={dimP2.y}
          stroke="#64748b"
          strokeWidth="1.6"
          strokeDasharray="3 3"
          opacity="0.45"
        />

        {/* Dimension line with arrows for gate size/diameter */}
        <line
          x1={dimP1.x}
          y1={dimP1.y}
          x2={dimP2.x}
          y2={dimP2.y}
          stroke="#64748b"
          strokeWidth="1.6"
          markerStart="url(#arrow)"
          markerEnd="url(#arrow)"
        />
        {/* Dimension Label */}
        {(() => {
          const cx = (dimP1.x + dimP2.x) / 2 + n_out.x * 14;
          const cy = (dimP1.y + dimP2.y) / 2 + n_out.y * 14;
          const textW = dimLabel.length * 7 + 10;
          return (
            <g>
              <rect
                x={cx - textW / 2}
                y={cy - 9}
                width={textW}
                height={18}
                fill="white"
                className="dark:fill-slate-900"
                stroke="none"
                rx={3}
              />
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#475569"
                className="dark:fill-slate-200"
                fontSize="12"
                fontWeight="700"
                stroke="none"
              >
                {dimLabel}
              </text>
            </g>
          );
        })()}

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

            {/* Symmetry crosshairs (eixos de simetria) */}
            <line
              x1={C_proj.x - u_down.x * (R_px + 12)}
              y1={C_proj.y - u_down.y * (R_px + 12)}
              x2={C_proj.x + u_down.x * (R_px + 12)}
              y2={C_proj.y + u_down.y * (R_px + 12)}
              stroke="#64748b"
              strokeWidth="1"
              strokeDasharray="7 3 2 3"
            />
            <line
              x1={C_proj.x - n_out.x * (R_px + 12)}
              y1={C_proj.y - n_out.y * (R_px + 12)}
              x2={C_proj.x + n_out.x * (R_px + 12)}
              y2={C_proj.y + n_out.y * (R_px + 12)}
              stroke="#64748b"
              strokeWidth="1"
              strokeDasharray="7 3 2 3"
            />
          </g>
        )}

        {shape === FormaComporta.RETANGULAR && (
          <g>
            {(() => {
              const halfH = (H * SCALE) / 2;
              const halfW = (W * SCALE) / 2;
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
                    stroke="#64748b"
                    strokeWidth="1"
                    strokeDasharray="7 3 2 3"
                  />
                  <line
                    x1={C_proj.x - n_out.x * (halfW + 12)}
                    y1={C_proj.y - n_out.y * (halfW + 12)}
                    x2={C_proj.x + n_out.x * (halfW + 12)}
                    y2={C_proj.y + n_out.y * (halfW + 12)}
                    stroke="#64748b"
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
              x1={C_proj.x - u_down.x * (R_px + 10)}
              y1={C_proj.y - u_down.y * (R_px + 10)}
              x2={C_proj.x + u_down.x * (R_px + 10)}
              y2={C_proj.y + u_down.y * (R_px + 10)}
              stroke="#64748b"
              strokeWidth="1"
              strokeDasharray="7 3 2 3"
            />
          </g>
        )}

        {/* --- CENTROID (CG) NA VISTA FRONTAL --- */}
        <g>
          <circle cx={C_proj.x} cy={C_proj.y} r={4.5} fill="#ffffff" stroke="#0f172a" strokeWidth={2} />
          <circle cx={C_proj.x} cy={C_proj.y} r={1.5} fill="#0f172a" />
          <text
            x={C_proj.x - n_out.x * 12 + u_down.x * 6}
            y={C_proj.y - n_out.y * 12 + u_down.y * 6}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#0f172a"
            fontSize="12"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            CG
          </text>
        </g>

        {/* --- CENTER OF PRESSURE (CP) NA VISTA FRONTAL --- */}
        <g>
          <circle cx={CP_proj.x} cy={CP_proj.y} r={4.5} fill="#ef4444" stroke="#ffffff" strokeWidth={1.8} />
          <text
            x={CP_proj.x - n_out.x * 14}
            y={CP_proj.y - n_out.y * 14}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#b91c1c"
            fontSize="12"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            CP
          </text>

          {delta_y * SCALE > 2 && (
            <line
              x1={C_proj.x}
              y1={C_proj.y}
              x2={CP_proj.x}
              y2={CP_proj.y}
              stroke="#ef4444"
              strokeWidth={1.5}
              markerEnd="url(#arrow-red)"
            />
          )}
        </g>
      </g>
    );
  };

  // --- RENDER TEXTBOOK ENGINEERING DIMENSIONS (COTAGENS DIDÁTICAS) ---
  // Estilo padronizado idêntico ao módulo de Barragens
  const renderDimensions = () => {
    if (!showExerciseDims) return null;

    const dims: React.ReactNode[] = [];

    // Helper para cotas ortogonais (estilo Barragens)
    const drawDim = (
      key: string,
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      labelNode: React.ReactNode,
      approxCharLen: number,
      offsetPx: { x: number; y: number } = { x: 0, y: 0 },
      textOffsetPx: { x: number; y: number } = { x: 0, y: 0 }
    ) => {
      const p1Off = { x: p1.x + offsetPx.x, y: p1.y + offsetPx.y };
      const p2Off = { x: p2.x + offsetPx.x, y: p2.y + offsetPx.y };

      const cx = (p1Off.x + p2Off.x) / 2 + textOffsetPx.x;
      const cy = (p1Off.y + p2Off.y) / 2 + textOffsetPx.y;

      const textW = approxCharLen * 7 + 10;
      const textH = 18;

      return (
        <g key={key} stroke="#64748b" strokeWidth="1.6" fill="none" opacity="0.95">
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
          <rect
            x={cx - textW / 2}
            y={cy - textH / 2}
            width={textW}
            height={textH}
            fill="white"
            className="dark:fill-slate-900"
            rx={3}
            stroke="none"
          />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#475569"
            className="dark:fill-slate-200"
            fontSize="12"
            fontWeight="700"
            stroke="none"
          >
            {labelNode}
          </text>
        </g>
      );
    };

    // Helper para cotas inclinadas paralelas à superfície (estilo Barragens)
    const drawSlantedDim = (
      key: string,
      p1Orig: { x: number; y: number },
      p2Orig: { x: number; y: number },
      p1Off: { x: number; y: number },
      p2Off: { x: number; y: number },
      labelNode: React.ReactNode,
      approxCharLen: number,
      textOffsetPx: { x: number; y: number } = { x: 0, y: 0 }
    ) => {
      const cx = (p1Off.x + p2Off.x) / 2 + textOffsetPx.x;
      const cy = (p1Off.y + p2Off.y) / 2 + textOffsetPx.y;

      const textW = approxCharLen * 7 + 10;
      const textH = 18;

      return (
        <g key={key} stroke="#64748b" strokeWidth="1.6" fill="none" opacity="0.95">
          <line
            x1={p1Orig.x}
            y1={p1Orig.y}
            x2={p1Off.x}
            y2={p1Off.y}
            strokeDasharray="3 3"
            opacity="0.45"
          />
          <line
            x1={p2Orig.x}
            y1={p2Orig.y}
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
          <rect
            x={cx - textW / 2}
            y={cy - textH / 2}
            width={textW}
            height={textH}
            fill="white"
            className="dark:fill-slate-900"
            rx={3}
            stroke="none"
          />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#475569"
            className="dark:fill-slate-200"
            fontSize="12"
            fontWeight="700"
            stroke="none"
          >
            {labelNode}
          </text>
        </g>
      );
    };

    // Helper para símbolo de nível d'água (NA) idêntico ao padrão de Barragens
    const drawLevelSymbol = (
      key: string,
      x: number,
      y: number,
      text: string,
      flipX: boolean = true
    ) => {
      const dir = flipX ? -1 : 1;
      return (
        <g key={key} stroke="#475569" strokeWidth="1.2" opacity="0.95">
          <polygon points={`${x},${y} ${x - 7},${y - 14} ${x},${y - 14}`} fill="none" />
          <polygon points={`${x},${y} ${x},${y - 14} ${x + 7},${y - 14}`} fill="#475569" />
          <polyline points={`${x},${y - 14} ${x},${y - 30} ${x + dir * 52},${y - 30}`} fill="none" />
          <text
            x={x + dir * 26}
            y={y - 34}
            textAnchor="middle"
            dominantBaseline="alphabetic"
            fill="#334155"
            className="dark:fill-slate-200"
            fontSize="11"
            fontWeight="bold"
            stroke="none"
          >
            {text}
          </text>
        </g>
      );
    };

    // 1. Símbolo de Nível da Água Montante (NA) posicionado junto à parede, com haste voltada para a esquerda
    const naX = P_surf.x - 18;
    const naText = `NA=${(props.upstreamLevel || 0).toFixed(2)}`;
    dims.push(drawLevelSymbol('na-level-symbol', naX, waterSurfaceY, naText, true));

    // Nível da Água Jusante (se ativo)
    if (props.downstreamLevel > 0) {
      const downDepthY = waterSurfaceY + (props.upstreamLevel - props.downstreamLevel) * SCALE;
      const naDownX = P_bot.x + 35;
      dims.push(drawLevelSymbol('na-downstream-symbol', naDownX, downDepthY, `NA=${props.downstreamLevel.toFixed(2)}`, false));
    }

    // 2. Indicador do Peso Específico (γ) na massa d'água (limpo e sem bordas pesadas)
    dims.push(
      <g key="water-gamma-badge" transform={`translate(95, ${waterSurfaceY + 115})`}>
        <rect
          x={-55}
          y={-18}
          width={110}
          height={36}
          rx={3}
          fill="white"
          className="dark:fill-slate-900"
          stroke="none"
          opacity={0.92}
        />
        <text
          x={0}
          y={-5}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#1e3a8a"
          className="dark:fill-blue-300"
          fontSize="11"
          fontWeight="700"
        >
          γ = {gamma_kgf} kgf/m³
        </text>
        <text
          x={0}
          y={10}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#475569"
          className="dark:fill-slate-400"
          fontSize="9"
          fontWeight="600"
        >
          ({(gamma_N / 1000).toFixed(2)} kN/m³)
        </text>
      </g>
    );

    // 3. Profundidade vertical até o topo da comporta: h_topo
    dims.push(
      drawDim(
        'dim-h-top',
        { x: P_top.x, y: waterSurfaceY },
        { x: P_top.x, y: P_top.y },
        <>
          h<tspan baselineShift="sub" fontSize="8.5">topo</tspan> = {h_top.toFixed(2)} m
        </>,
        14,
        { x: -35, y: 0 },
        { x: 0, y: 0 }
      )
    );

    // 4. Profundidade vertical do centróide: h_CG (espaçada horizontalmente e texto posicionado sem sobreposição)
    const dimX_cg_off = -95;
    const cgDepth = Math.max(20, P_CG.y - waterSurfaceY);
    dims.push(
      drawDim(
        'dim-h-cg',
        { x: P_CG.x, y: waterSurfaceY },
        { x: P_CG.x, y: P_CG.y },
        <>
          h<tspan baselineShift="sub" fontSize="8.5">CG</tspan> = {h_CG.toFixed(2)} m
        </>,
        13,
        { x: dimX_cg_off, y: 0 },
        { x: 0, y: -cgDepth * 0.22 }
      )
    );

    // 5. Profundidade vertical do centro de pressão: h_CP (somente após análise, posicionado sem colidir com h_CG nem com o empuxo)
    if (props.isAnalyzed) {
      const dimX_cp_off = -160;
      const cpDepth = Math.max(20, P_CP.y - waterSurfaceY);
      dims.push(
        drawDim(
          'dim-h-cp',
          { x: P_CP.x, y: waterSurfaceY },
          { x: P_CP.x, y: P_CP.y },
          <>
            h<tspan baselineShift="sub" fontSize="8.5">CP</tspan> = {h_CP.toFixed(2)} m
          </>,
          13,
          { x: dimX_cp_off, y: 0 },
          { x: 0, y: -cpDepth * 0.38 }
        )
      );
    }

    // 6. Ângulo de Inclinação (θ) na superfície d'água
    const arcR = 48;
    const arcEndX = P_surf.x - u_down.x * arcR;
    const arcEndY = P_surf.y - u_down.y * arcR;
    dims.push(
      <g key="angle-arc-indicator" stroke="#64748b" strokeWidth="1.6" fill="none">
        <line
          x1={P_surf.x}
          y1={waterSurfaceY}
          x2={P_surf.x + 75}
          y2={waterSurfaceY}
          strokeDasharray="3 3"
          opacity="0.45"
        />
        <path
          d={`M ${P_surf.x + arcR},${waterSurfaceY} A ${arcR} ${arcR} 0 0 0 ${arcEndX},${arcEndY}`}
        />
        <g transform={`translate(${P_surf.x + arcR + 14}, ${waterSurfaceY - 14})`}>
          <rect
            x={-18}
            y={-9}
            width={36}
            height={18}
            rx={3}
            fill="white"
            className="dark:fill-slate-900"
            stroke="none"
          />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#475569"
            className="dark:fill-slate-200"
            fontSize="12"
            fontWeight="700"
            stroke="none"
          >
            {thetaDeg}°
          </text>
        </g>
      </g>
    );

    // 7. Distâncias inclinadas ao longo do plano da comporta: y_CG e y_CP (com subíndices perfeitos e sem underscores)
    const D_slanted_cg = 55;
    const ref_surf_cg = { x: P_surf.x + n_out.x * D_slanted_cg, y: P_surf.y + n_out.y * D_slanted_cg };
    const ref_cg_off = { x: P_CG.x + n_out.x * D_slanted_cg, y: P_CG.y + n_out.y * D_slanted_cg };

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
        13
      )
    );

    // Cota inclinada y_CP: afastada para fora (D_slanted_cp = 98) para evitar qualquer sobreposição
    if (props.isAnalyzed) {
      const D_slanted_cp = 98;
      const ref_surf_cp = { x: P_surf.x + n_out.x * D_slanted_cp, y: P_surf.y + n_out.y * D_slanted_cp };
      const ref_cp_off = { x: P_CP.x + n_out.x * D_slanted_cp, y: P_CP.y + n_out.y * D_slanted_cp };

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
          13
        )
      );
    }

    // 8. PONTO CG e PONTO E NA COMPORTA (ITEM 3 - COM ANIMAÇÃO E INTERATIVIDADE)
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
                stroke="#2563eb"
                strokeWidth={1.8}
                opacity={0.8}
              />
            )}
            <circle
              cx={P_CG.x}
              cy={P_CG.y}
              r={hoveredItem === 'CG' ? 6.5 : 5.5}
              fill="#ffffff"
              stroke="#0f172a"
              strokeWidth={2}
            />
            <text
              x={P_CG.x + n_out.x * 14 - u_down.x * 4}
              y={P_CG.y + n_out.y * 14 - u_down.y * 4}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#0f172a"
              fontSize="10"
              fontWeight="black"
              fontFamily="sans-serif"
            >
              CG
            </text>
          </g>

          {/* Ponto E: Centro de Pressão (Empuxo Resultante) - somente após análise */}
          {props.isAnalyzed && (
            <g
              className="cursor-pointer transition-transform"
              onMouseEnter={() => setHoveredItem('CP')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* Anel de pulso vivo e dinâmico */}
              <circle
                cx={P_CP.x}
                cy={P_CP.y}
                r={7}
                fill="none"
                stroke="#ef4444"
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
                fill="#ef4444"
                stroke="#ffffff"
                strokeWidth={1.8}
              />
              <text
                x={P_CP.x + n_out.x * 14 + u_down.x * 4}
                y={P_CP.y + n_out.y * 14 + u_down.y * 4}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#b91c1c"
                fontSize="10"
                fontWeight="black"
                fontFamily="sans-serif"
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
        resetView={resetView}
        handlers={interactionHandlers}
        renderedFaces={renderedFaces}
        vectors={vectors}
        SVG_W={SVG_W}
        SVG_H={SVG_H}
        ORIGIN_X={surfX}
        ORIGIN_Y={P_bed_inc.y}
        pan={pan}
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        isResetting={isResetting}
        upstreamFluidKey={props.upstreamFluidKey}
        downstreamFluidKey={props.downstreamFluidKey}
      >
        {/* Diagrama Trapezoidal de Pressão Hidrostática */}
        {renderPressurePrism()}

        {/* Vista Frontal Rebatida da Comporta */}
        {renderFrontalView()}

        {/* Cotagens Didáticas Completas */}
        {renderDimensions()}

        {/* Elementos Adicionais (ondas dinâmicas, bolhas, apoios, tirantes) */}
        {overlayElements}

        {/* Tooltip Dinâmico ao passar o mouse em CG, CP ou Prisma */}
        {renderInteractiveTooltip()}
      </ContainerComportas>
    </div>
  );
};
