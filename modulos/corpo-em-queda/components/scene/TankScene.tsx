import React, { useRef, useState } from "react";
import { ObjectShape, FLUIDS, MATERIALS } from "../../types";
import {
  CheckCircle2,
  Play,
  RotateCcw,
  Cuboid,
  MoveHorizontal,
  MousePointer2,
  Maximize,
  Box,
} from "lucide-react";

interface TankSceneProps {
  // Scene Config
  svgWidth: number;
  svgHeight: number;
  tankWidth: number;
  tankHeight: number;
  tankBottomY: number;
  tankOffsetX: number;
  currentTankW: number;
  currentTankH: number;

  // Object Config
  shape: ObjectShape;
  visualWidth: number;
  visualHeight: number;
  selectedMaterial: string;

  // Simulation State
  blockY: number;
  fluidSurfaceY: number;
  originalFluidSurfaceY: number;
  depthA: number;
  depthB: number;
  hA_px: number;
  effectiveHB_px: number;
  h_sub_actual: number;
  deltaH_cm: number;

  // Physics / Results (for vectors)
  objectWeight: number;
  buoyancyForce: number;
  showFBD: boolean;
  centerOfBuoyancyY_visual: number;

  // Fluids
  selectedFluid: string;
  selectedFluidB: string;
  enableTwoFluids: boolean;

  // Interactions
  isSimulating: boolean;
  onToggleSimulate: () => void;
  onToggleFBD: () => void;
  toastMsg: string | null;

  // Camera / 3D
  is3D: boolean;
  onToggle3D: () => void;
  showCenterOfBuoyancy: boolean;
  onToggleCenterOfBuoyancy: () => void;
}

export const TankScene: React.FC<TankSceneProps> = (props) => {
  const {
    svgWidth,
    svgHeight,
    tankBottomY,
    tankOffsetX,
    currentTankW,
    currentTankH,
    shape,
    visualWidth,
    visualHeight,
    selectedMaterial,
    blockY,
    fluidSurfaceY,
    originalFluidSurfaceY,
    depthA,
    depthB,
    hA_px,
    effectiveHB_px,
    objectWeight,
    buoyancyForce,
    showFBD,
    centerOfBuoyancyY_visual,
    selectedFluid,
    selectedFluidB,
    enableTwoFluids,
    h_sub_actual,
    deltaH_cm,
    isSimulating,
    onToggleSimulate,
    onToggleFBD,
    toastMsg,
    is3D,
    onToggle3D,
    showCenterOfBuoyancy,
    onToggleCenterOfBuoyancy,
  } = props;

  // --- CAMERA STATE ---
  const [rotX, setRotX] = useState<number>(15);
  const [rotY, setRotY] = useState<number>(0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);

  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const cameraAnimRef = useRef<number | null>(null);

  const animateCameraReset = () => {
    if (cameraAnimRef.current) cancelAnimationFrame(cameraAnimRef.current);

    const startX = rotX;
    const startY = rotY;
    const startPanX = pan.x;
    const startPanY = pan.y;

    const targetX = 15;
    const nearestTargetY =
      startY + ((((0 - startY) % 360) + 540) % 360) - 180;

    const startTime = performance.now();
    const duration = 800;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);

      setRotX(startX + (targetX - startX) * ease);
      setRotY(startY + (nearestTargetY - startY) * ease);
      setPan({
        x: startPanX + (0 - startPanX) * ease,
        y: startPanY + (0 - startPanY) * ease,
      });

      if (progress < 1) {
        cameraAnimRef.current = requestAnimationFrame(step);
      } else {
        setRotY(0);
        cameraAnimRef.current = null;
      }
    };

    cameraAnimRef.current = requestAnimationFrame(step);
  };

  const resetView = () => {
    animateCameraReset();
  };

  // Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (cameraAnimRef.current) cancelAnimationFrame(cameraAnimRef.current);

    if (e.button === 2 || e.shiftKey) {
      setIsPanning(true);
    } else {
      if (!is3D) onToggle3D();
      setIsDragging(true);
    }

    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - lastMouseRef.current.x;
    const deltaY = e.clientY - lastMouseRef.current.y;

    if (isPanning) {
      setPan((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    } else if (isDragging) {
      setRotY((prev) => prev + deltaX * 0.5);
      setRotX((prev) => Math.max(-90, Math.min(90, prev - deltaY * 0.5)));
    }

    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    setIsPanning(false);
  };

  // --- PROJECTION HELPERS ---
  const project = (x: number, y: number, z: number) => {
    const cx0 = tankOffsetX + currentTankW / 2;
    const cy0 = tankBottomY - currentTankH / 2;

    const cx = cx0 + pan.x;
    const cy = cy0 + pan.y;

    const dx = x;
    const dy = y - cy0;
    const dz = z;

    if (!is3D) {
      return { x: cx + x, y: cy + dy, z: 0 };
    }

    const radX = (rotX * Math.PI) / 180;
    const radY = (rotY * Math.PI) / 180;

    const x1 = dx * Math.cos(radY) - dz * Math.sin(radY);
    const z1 = dx * Math.sin(radY) + dz * Math.cos(radY);
    const y2 = dy * Math.cos(radX) - z1 * Math.sin(radX);
    const z2 = dy * Math.sin(radX) + z1 * Math.cos(radX);

    return { x: cx + x1, y: cy + y2, z: z2 };
  };

  const rotateVector = (v: { x: number; y: number; z: number }) => {
    const radX = (rotX * Math.PI) / 180;
    const radY = (rotY * Math.PI) / 180;

    const x1 = v.x * Math.cos(radY) - v.z * Math.sin(radY);
    const z1 = v.x * Math.sin(radY) + v.z * Math.cos(radY);
    const y2 = v.y * Math.cos(radX) - z1 * Math.sin(radX);
    const z2 = v.y * Math.sin(radX) + z1 * Math.cos(radX);

    return { x: x1, y: y2, z: z2 };
  };

  // --- RENDERING CONSTANTS (PALETA LANDING) ---
  const TANK_BORDER_COLOR = "#22d3ee"; // cyan-400
  const OBJECT_BORDER_COLOR = "#0f172a"; // slate-900

  const getFluidColor = (name: string) =>
    FLUIDS.find((f) => f.name === name)?.color || "#60a5fa";

  const colorA = getFluidColor(selectedFluid);
  const colorB = getFluidColor(selectedFluidB);
  const objColor =
    MATERIALS.find((m) => m.name === selectedMaterial)?.color || "#94a3b8";

  // --- RENDER HELPERS ---
  const renderDimensionLine = (
    x: number,
    y1: number,
    y2: number,
    label: React.ReactNode,
    color: string = "#475569"
  ) => {
    const midY = (y1 + y2) / 2;
    const height = Math.abs(y2 - y1);
    if (height < 5) return null;

    return (
      <g>
        <line x1={x} y1={y1} x2={x} y2={y2} stroke={color} strokeWidth="1" />
        <path
          d={`M${x},${y1} L${x - 3},${y1 + 8} L${x + 3},${y1 + 8} Z`}
          fill={color}
        />
        <line
          x1={x - 8}
          y1={y1}
          x2={x + 8}
          y2={y1}
          stroke={color}
          strokeWidth="1"
        />
        <path
          d={`M${x},${y2} L${x - 3},${y2 - 8} L${x + 3},${y2 - 8} Z`}
          fill={color}
        />
        <line
          x1={x - 8}
          y1={y2}
          x2={x + 8}
          y2={y2}
          stroke={color}
          strokeWidth="1"
        />
        <g transform={`translate(${x - 16}, ${midY}) rotate(-90)`}>
          <rect x="-50" y="-10" width="100" height="20" fill="white" opacity="0.8" />
          <text
            x="0"
            y="5"
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill={color}
            fontFamily="monospace"
          >
            {label}
          </text>
        </g>
      </g>
    );
  };

  const drawPoly = (
    pts: { x: number; y: number; z?: number }[],
    fill: string,
    opacity: number = 1,
    stroke: string = "none",
    strokeWidth: number = 0
  ) => {
    const d = `M${pts.map((p) => `${p.x},${p.y}`).join(" L")} Z`;
    return (
      <path
        d={d}
        fill={fill}
        opacity={opacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    );
  };

  const getPoints = (
    x: number,
    y_from_bot: number,
    w: number,
    h: number,
    z: number,
    depth: number
  ) => {
    const x_left = x - w / 2;
    const x_right = x + w / 2;

    const s_y_bot = tankBottomY - y_from_bot;
    const s_y_top = tankBottomY - (y_from_bot + h);

    const z_back = z - depth / 2;
    const z_front = z + depth / 2;

    return {
      p1: project(x_left, s_y_top, z_back),
      p2: project(x_right, s_y_top, z_back),
      p3: project(x_right, s_y_bot, z_back),
      p4: project(x_left, s_y_bot, z_back),
      p5: project(x_left, s_y_top, z_front),
      p6: project(x_right, s_y_top, z_front),
      p7: project(x_right, s_y_bot, z_front),
      p8: project(x_left, s_y_bot, z_front),
    };
  };

  const getMaterialStyle = (matName: string, baseColor: string) => {
    const n = matName.toLowerCase();
    if (
      n.includes("ouro") ||
      n.includes("latão") ||
      n.includes("bronze") ||
      n.includes("cobre")
    )
      return "url(#goldGradient)";
    if (n.includes("madeira") || n.includes("cortiça")) return "url(#woodPattern)";
    if (
      n.includes("concreto") ||
      n.includes("asfalto") ||
      n.includes("granito") ||
      n.includes("pedra")
    )
      return "url(#concretePattern)";
    if (
      n.includes("aço") ||
      n.includes("alumínio") ||
      n.includes("ferro") ||
      n.includes("prata")
    )
      return "url(#metalLinear)";
    return baseColor;
  };

  // --- MAIN RENDER ---
  const tankDepth = currentTankW * 0.75;

  const objBottomY_screen = blockY + visualHeight;
  const objBottomDistFromTankBottom = tankBottomY - objBottomY_screen;

  const objD_visual = is3D ? (shape === ObjectShape.CUBE ? visualWidth : visualWidth) : 0;
  const renderFill = getMaterialStyle(selectedMaterial, objColor);

  return (
    <div
      className={`
        relative flex flex-col items-center justify-center
        min-h-[600px] h-full p-2 overflow-hidden
        rounded-2xl
        bg-white/70 backdrop-blur-md
        border border-blue-100/70
        shadow-2xl shadow-blue-200/25
        transition-colors
        ${is3D ? (isDragging ? (isPanning ? "cursor-move" : "cursor-grabbing") : "cursor-grab") : ""}
      `}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* halo/refração (mesma estética da landing) */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full blur-[120px] opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(59,130,246,0.18), transparent 60%)",
          }}
        />
        <div
          className="absolute -bottom-28 -right-28 w-[520px] h-[520px] rounded-full blur-[140px] opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(34,211,238,0.18), transparent 60%)",
          }}
        />
      </div>

      {/* OVERLAYS */}
      <div
        className="absolute top-4 right-4 flex gap-2 z-30"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {toastMsg && (
          <div className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg animate-in fade-in flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3" /> {toastMsg}
          </div>
        )}

        <button
          onClick={onToggleCenterOfBuoyancy}
          className={`
            bg-white/85 p-2 rounded-full shadow-md
            border border-blue-100/70 backdrop-blur
            ${showCenterOfBuoyancy ? "text-blue-600" : "text-slate-400"}
          `}
          title="Mostrar Centro de Carena"
        >
          <Box className="w-4 h-4" />
        </button>
      </div>

      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/85 p-1.5 rounded-full shadow-xl border border-blue-100/70 backdrop-blur-md z-30 transition-all hover:scale-[1.03]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            onToggle3D();
            resetView();
          }}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs transition-colors
            ${is3D ? "bg-blue-50 text-blue-700 border border-blue-100" : "text-slate-600 hover:bg-white/70 border border-transparent"}
          `}
        >
          <Cuboid className="w-4 h-4" /> 3D {is3D ? "ON" : "OFF"}
        </button>

        <button
          onClick={onToggleFBD}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs transition-colors
            ${showFBD ? "bg-blue-50 text-blue-700 border border-blue-100" : "text-slate-600 hover:bg-white/70 border border-transparent"}
          `}
        >
          <MoveHorizontal className="w-4 h-4" /> VETORES
        </button>
      </div>

      {/* botão soltar bloco / reiniciar no canto inferior direito */}
      <div 
        className="absolute bottom-20 right-6 z-30"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {!isSimulating ? (
          <button
            onClick={onToggleSimulate}
            className="
              flex items-center gap-2
              bg-gradient-to-br from-blue-600 to-cyan-600
              hover:from-blue-700 hover:to-cyan-600
              text-white px-5 py-2.5 rounded-full
              shadow-lg shadow-blue-500/20
              font-black text-xs tracking-wide uppercase
              transition-transform active:scale-95
            "
          >
            <Play className="w-3.5 h-3.5 fill-current" /> SOLTAR BLOCO
          </button>
        ) : (
          <button
            onClick={onToggleSimulate}
            className="
              flex items-center gap-2
              bg-white text-slate-700 px-5 py-2.5 rounded-full
              border border-slate-200 hover:bg-slate-50
              shadow-lg shadow-slate-200/50
              font-black text-xs tracking-wide uppercase
              transition-all active:scale-95
            "
          >
            <RotateCcw className="w-3.5 h-3.5" /> REINICIAR
          </button>
        )}
      </div>

      {is3D && (
        <>
          <div
            className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-slate-400 bg-white/80 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest pointer-events-none backdrop-blur select-none animate-in fade-in transition-opacity ${
              isDragging ? "opacity-50" : "opacity-100"
            }`}
          >
            <span className="flex items-center gap-1">
              <MousePointer2 className="w-3 h-3" /> Girar
            </span>
            <span className="w-px h-3 bg-slate-300"></span>
            <span className="flex items-center gap-1">
              <Maximize className="w-3 h-3" /> Pan (Direito)
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              resetView();
            }}
            className="absolute bottom-6 right-6 bg-white/90 p-2.5 rounded-full shadow-lg border border-blue-100/70 text-slate-500 hover:text-blue-600 hover:scale-110 transition-all z-30 group"
            title="Resetar Câmera"
          >
            <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
          </button>
        </>
      )}

      <svg
        width="100%"
        height={svgHeight}
        className="overflow-visible"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* DEFS (Gradients, Patterns) */}
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="4"
              floodColor="#000"
              floodOpacity="0.2"
            />
          </filter>

          <marker id="arrow-red" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
            <path d="M0,0 L6,2 L0,4 Z" fill="#1e40af" />
          </marker>

          <marker id="arrow-green" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
            <path d="M0,0 L6,2 L0,4 Z" fill="#16a34a" />
          </marker>

          <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="50%" stopColor="white" stopOpacity="0.1" />
            <stop offset="100%" stopColor="white" stopOpacity="0.3" />
          </linearGradient>

          <radialGradient id="sphereGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="black" stopOpacity="0.2" />
          </radialGradient>

          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          <linearGradient id="metalLinear" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          <pattern id="woodPattern" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(10)">
            <rect width="20" height="20" fill="#d97706" />
            <path
              d="M0,5 Q10,2 20,5 M0,15 Q10,18 20,15"
              stroke="#92400e"
              strokeWidth="1"
              fill="none"
              opacity="0.5"
            />
            <path
              d="M5,0 Q2,10 5,20"
              stroke="#b45309"
              strokeWidth="0.5"
              fill="none"
              opacity="0.3"
            />
          </pattern>

          <filter id="concreteNoise">
            <feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="3" stitchTiles="stitch" />
          </filter>

          <pattern id="concretePattern" width="64" height="64" patternUnits="userSpaceOnUse">
            <rect width="64" height="64" fill="#a3a3a3" />
            <rect width="64" height="64" filter="url(#concreteNoise)" opacity="0.25" />
            <path
              d="M10,20 Q15,15 20,20 T30,20"
              stroke="#525252"
              strokeWidth="0.5"
              fill="none"
              opacity="0.3"
            />
            <circle cx="45" cy="50" r="1.5" fill="#525252" opacity="0.4" />
            <circle cx="10" cy="50" r="1" fill="#e5e5e5" opacity="0.4" />
          </pattern>

          <radialGradient id="sphereLight" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="white" stopOpacity="0.7" />
            <stop offset="20%" stopColor="white" stopOpacity="0.2" />
            <stop offset="100%" stopColor="black" stopOpacity="0.4" />
          </radialGradient>

          <clipPath id="clip-under-water">
            <rect x="-2000" y={fluidSurfaceY + pan.y} width="5000" height="5000" />
          </clipPath>

          <clipPath id="clip-above-water">
            <rect x="-2000" y="-2000" width="5000" height={fluidSurfaceY + pan.y + 2000} />
          </clipPath>

          <linearGradient id="fluidDepthA" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colorA} stopOpacity="0.15" />
            <stop offset="100%" stopColor={colorA} stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="fluidDepthB" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colorB} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colorB} stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="surfaceGradientA" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorA} stopOpacity="0.4" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor={colorA} stopOpacity="0.5" />
          </linearGradient>

          <pattern id="ripplePattern" width="120" height="40" patternUnits="userSpaceOnUse">
            <animateTransform attributeName="patternTransform" type="translate" from="0 0" to="120 20" dur="8s" repeatCount="indefinite" />
            <path d="M0,20 Q30,10 60,20 T120,20" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
            <path d="M-60,0 Q-30,-10 0,0 T60,0" fill="none" stroke="white" strokeWidth="0.5" opacity="0.2" />
          </pattern>
        </defs>

        {/* 3D SCENE CONSTRUCTION */}
        {(() => {
          const tankPts = getPoints(0, 0, currentTankW, currentTankH, 0, tankDepth);

          const TankBack = () => (
            <g>
              {drawPoly([tankPts.p3, tankPts.p4, tankPts.p8, tankPts.p7], "#e2e8f0", 1)}
              {drawPoly([tankPts.p1, tankPts.p2, tankPts.p3, tankPts.p4], "#f8fafc", 1)}
              {drawPoly([tankPts.p1, tankPts.p4, tankPts.p8, tankPts.p5], "#f1f5f9", 1)}
              {drawPoly([tankPts.p2, tankPts.p3, tankPts.p7, tankPts.p6], "#f1f5f9", 1)}
            </g>
          );

          const FluidsBack = () => {
            const ptsB = getPoints(0, 0, currentTankW, effectiveHB_px, 0, tankDepth);
            const ptsA_original = getPoints(
              0,
              effectiveHB_px,
              currentTankW,
              tankBottomY - originalFluidSurfaceY - effectiveHB_px,
              0,
              tankDepth
            );
            const ptsA_delta = getPoints(
              0,
              tankBottomY - originalFluidSurfaceY,
              currentTankW,
              originalFluidSurfaceY - fluidSurfaceY,
              0,
              tankDepth
            );

            return (
              <g>
                {enableTwoFluids && (
                  <g>
                    {drawPoly([ptsB.p1, ptsB.p2, ptsB.p3, ptsB.p4], "url(#fluidDepthB)", 1)}
                    {drawPoly([ptsB.p1, ptsB.p5, ptsB.p8, ptsB.p4], "url(#fluidDepthB)", 1)}
                    {drawPoly([ptsB.p2, ptsB.p6, ptsB.p7, ptsB.p3], "url(#fluidDepthB)", 1)}
                  </g>
                )}

                <g>
                  {drawPoly([ptsA_original.p1, ptsA_original.p2, ptsA_original.p3, ptsA_original.p4], "url(#fluidDepthA)", 1)}
                  {drawPoly([ptsA_original.p1, ptsA_original.p5, ptsA_original.p8, ptsA_original.p4], "url(#fluidDepthA)", 1)}
                  {drawPoly([ptsA_original.p2, ptsA_original.p6, ptsA_original.p7, ptsA_original.p3], "url(#fluidDepthA)", 1)}
                </g>
                
                {isSimulating && deltaH_cm > 0.01 && (
                  <g>
                    {drawPoly([ptsA_delta.p1, ptsA_delta.p2, ptsA_delta.p3, ptsA_delta.p4], colorA, 0.4)}
                    {drawPoly([ptsA_delta.p1, ptsA_delta.p5, ptsA_delta.p8, ptsA_delta.p4], colorA, 0.4)}
                    {drawPoly([ptsA_delta.p2, ptsA_delta.p6, ptsA_delta.p7, ptsA_delta.p3], colorA, 0.4)}
                  </g>
                )}
              </g>
            );
          };

          const FluidSurface = () => {
            const ptsA_dynamic = getPoints(0, tankBottomY - fluidSurfaceY, currentTankW, 0, 0, tankDepth);
            return (
              <g>
                {drawPoly([ptsA_dynamic.p1, ptsA_dynamic.p2, ptsA_dynamic.p6, ptsA_dynamic.p5], "url(#surfaceGradientA)", 1, "rgba(255,255,255,0.5)", 1)}
                {drawPoly([ptsA_dynamic.p1, ptsA_dynamic.p2, ptsA_dynamic.p6, ptsA_dynamic.p5], "url(#ripplePattern)", 1)}
              </g>
            );
          };

          const Object3D = () => {
            const center = project(0, tankBottomY - (objBottomDistFromTankBottom + visualHeight / 2), 0);
            const effectiveYBot = objBottomDistFromTankBottom;
            const objPts = getPoints(0, effectiveYBot, visualWidth, visualHeight, 0, objD_visual);

            const faces = [
              { pts: [objPts.p1, objPts.p2, objPts.p3, objPts.p4], n: { x: 0, y: 0, z: -1 } }, // Back
              { pts: [objPts.p5, objPts.p6, objPts.p7, objPts.p8], n: { x: 0, y: 0, z: 1 } }, // Front
              { pts: [objPts.p1, objPts.p2, objPts.p6, objPts.p5], n: { x: 0, y: 1, z: 0 } }, // Top
              { pts: [objPts.p4, objPts.p3, objPts.p7, objPts.p8], n: { x: 0, y: -1, z: 0 } }, // Bot
              { pts: [objPts.p1, objPts.p5, objPts.p8, objPts.p4], n: { x: -1, y: 0, z: 0 } }, // Left
              { pts: [objPts.p2, objPts.p6, objPts.p7, objPts.p3], n: { x: 1, y: 0, z: 0 } }, // Right
            ];

            const sortedFaces = faces
              .map((f) => {
                const z = f.pts.reduce((acc, p) => acc + (p.z || 0), 0) / 4;
                const rn = rotateVector(f.n);

                const lx = -0.5,
                  ly = 0.5,
                  lz = -0.8;
                const mag = Math.sqrt(lx * lx + ly * ly + lz * lz);
                const dot = (rn.x * lx + rn.y * ly + rn.z * lz) / mag;
                const brightness = Math.max(0.1, 0.5 + dot * 0.5);

                return { ...f, z, brightness };
              })
              .sort((a, b) => b.z - a.z);

            return (
              <g>
                {shape === ObjectShape.CUBE ? (
                  sortedFaces.map((f, i) => (
                    <g key={i}>
                      <path
                        d={`M${f.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L")} Z`}
                        fill={renderFill}
                        stroke={OBJECT_BORDER_COLOR}
                        strokeWidth="1"
                        strokeLinejoin="round"
                      />
                      <path
                        d={`M${f.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L")} Z`}
                        fill="black"
                        fillOpacity={1 - f.brightness}
                        stroke="none"
                        pointerEvents="none"
                      />
                    </g>
                  ))
                ) : (
                  <g>
                    <circle
                      cx={center.x}
                      cy={center.y}
                      r={visualWidth / 2}
                      fill={renderFill}
                      stroke={OBJECT_BORDER_COLOR}
                      strokeWidth={3}
                    />
                    <circle
                      cx={center.x}
                      cy={center.y}
                      r={visualWidth / 2}
                      fill="url(#sphereLight)"
                      stroke="none"
                    />
                  </g>
                )}
              </g>
            );
          };

          const FluidsFront = () => {
            const ptsB = getPoints(0, 0, currentTankW, effectiveHB_px, 0, tankDepth);
            const ptsA_original = getPoints(
              0,
              effectiveHB_px,
              currentTankW,
              tankBottomY - originalFluidSurfaceY - effectiveHB_px,
              0,
              tankDepth
            );
            const ptsA_delta = getPoints(
              0,
              tankBottomY - originalFluidSurfaceY,
              currentTankW,
              originalFluidSurfaceY - fluidSurfaceY,
              0,
              tankDepth
            );

            return (
              <g>
                {enableTwoFluids && drawPoly([ptsB.p5, ptsB.p6, ptsB.p7, ptsB.p8], "url(#fluidDepthB)", 1)}
                {drawPoly([ptsA_original.p5, ptsA_original.p6, ptsA_original.p7, ptsA_original.p8], "url(#fluidDepthA)", 1)}
                {isSimulating && deltaH_cm > 0.01 && (
                  drawPoly([ptsA_delta.p5, ptsA_delta.p6, ptsA_delta.p7, ptsA_delta.p8], colorA, 0.4)
                )}
              </g>
            );
          };

          const Vectors = () => {
            if (!showFBD) return null;

            const center = project(0, tankBottomY - (objBottomDistFromTankBottom + visualHeight / 2), 0);
            const centerCB = project(0, centerOfBuoyancyY_visual, 0);

            const arrowLenP = Math.min(120, Math.max(30, objectWeight * 0.005));
            const arrowLenE = Math.min(120, Math.max(30, buoyancyForce * 0.005));

            return (
              <g pointerEvents="none">
                <line
                  x1={center.x}
                  y1={center.y}
                  x2={center.x}
                  y2={center.y + arrowLenP}
                  stroke="#1e40af"
                  strokeWidth="3"
                  markerEnd="url(#arrow-red)"
                />
                <circle cx={center.x} cy={center.y} r={3} fill="#1e40af" />
                <g transform={`translate(${center.x + 10}, ${center.y + arrowLenP / 2})`}>
                  <rect x="0" y="-10" width="24" height="20" fill="white" opacity="0.8" rx="4" />
                  <text x="12" y="4" textAnchor="middle" fill="#1e40af" fontSize="12" fontWeight="bold">
                    P
                  </text>
                </g>

                {isSimulating && h_sub_actual > 0.001 && (
                  <>
                    <line
                      x1={centerCB.x}
                      y1={centerCB.y}
                      x2={centerCB.x}
                      y2={centerCB.y - arrowLenE}
                      stroke="#16a34a"
                      strokeWidth="3"
                      markerEnd="url(#arrow-green)"
                    />
                    <circle cx={centerCB.x} cy={centerCB.y} r={3} fill="#16a34a" />
                    <g transform={`translate(${centerCB.x + 10}, ${centerCB.y - arrowLenE / 2})`}>
                      <rect x="0" y="-10" width="24" height="20" fill="white" opacity="0.8" rx="4" />
                      <text x="12" y="4" textAnchor="middle" fill="#16a34a" fontSize="12" fontWeight="bold">
                        E
                      </text>
                    </g>
                  </>
                )}
              </g>
            );
          };

          const Dimensions = () => {
            const rx = tankOffsetX - 30 + pan.x;
            const hA_dynamic_px = tankBottomY - fluidSurfaceY - effectiveHB_px;
            const hA_original_px = tankBottomY - originalFluidSurfaceY - effectiveHB_px;

            return (
              <g>
                {renderDimensionLine(
                  rx,
                  originalFluidSurfaceY + pan.y,
                  originalFluidSurfaceY + hA_original_px + pan.y,
                  `hA = ${(hA_original_px / (hA_px / depthA)).toFixed(1)}cm`,
                  colorA
                )}
                {isSimulating && deltaH_cm > 0.01 && renderDimensionLine(
                  rx - 40,
                  fluidSurfaceY + pan.y,
                  originalFluidSurfaceY + pan.y,
                  `Δh = ${deltaH_cm.toFixed(1)}cm`,
                  "#1e40af"
                )}
                {enableTwoFluids &&
                  renderDimensionLine(
                    rx,
                    originalFluidSurfaceY + hA_original_px + pan.y,
                    originalFluidSurfaceY + hA_original_px + effectiveHB_px + pan.y,
                    `hB = ${depthB}cm`,
                    colorB
                  )}
              </g>
            );
          };

          const isObjectAboveWater = h_sub_actual <= 0.001;

          // 2D MODE SIMPLE RENDER
          if (!is3D) {
            const cx = tankOffsetX + currentTankW / 2 + pan.x;
            const cy = blockY + pan.y;
            const hA_dynamic_px = tankBottomY - fluidSurfaceY - effectiveHB_px;

            return (
              <>
                {/* Tank Back */}
                <g>
                  {drawPoly([tankPts.p3, tankPts.p4, tankPts.p8, tankPts.p7], "#e2e8f0", 1)}
                  {drawPoly([tankPts.p1, tankPts.p2, tankPts.p3, tankPts.p4], "#f8fafc", 1)}
                </g>

                {/* Reference Line (Original Water Level) */}
                {isSimulating && deltaH_cm > 0.01 && (
                  <line
                    x1={tankOffsetX + pan.x}
                    y1={originalFluidSurfaceY + pan.y}
                    x2={tankOffsetX + currentTankW + pan.x}
                    y2={originalFluidSurfaceY + pan.y}
                    stroke="#64748b"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                    opacity="0.6"
                  />
                )}

                {/* Object Underwater Part */}
                <g clipPath="url(#clip-under-water)">
                  {shape === ObjectShape.SPHERE ? (
                    <circle
                      cx={cx}
                      cy={cy + visualHeight / 2}
                      r={visualWidth / 2}
                      fill={renderFill}
                      stroke={OBJECT_BORDER_COLOR}
                      strokeWidth="1"
                    />
                  ) : (
                    <rect
                      x={cx - visualWidth / 2}
                      y={cy}
                      width={visualWidth}
                      height={visualHeight}
                      fill={renderFill}
                      stroke={OBJECT_BORDER_COLOR}
                      strokeWidth="1"
                    />
                  )}
                </g>

                {/* Object Abovewater Part */}
                <g clipPath="url(#clip-above-water)">
                  {shape === ObjectShape.SPHERE ? (
                    <circle
                      cx={cx}
                      cy={cy + visualHeight / 2}
                      r={visualWidth / 2}
                      fill={renderFill}
                      stroke={OBJECT_BORDER_COLOR}
                      strokeWidth="1"
                    />
                  ) : (
                    <rect
                      x={cx - visualWidth / 2}
                      y={cy}
                      width={visualWidth}
                      height={visualHeight}
                      fill={renderFill}
                      stroke={OBJECT_BORDER_COLOR}
                      strokeWidth="1"
                    />
                  )}
                </g>

                <Vectors />

                {/* Fluids Front (Transparent) */}
                <g pointerEvents="none">
                  {/* Base Fluid A */}
                  <rect
                    x={tankOffsetX + pan.x}
                    y={originalFluidSurfaceY + pan.y}
                    width={currentTankW}
                    height={tankBottomY - originalFluidSurfaceY - effectiveHB_px}
                    fill="url(#fluidDepthA)"
                  />
                  {/* Delta H Fluid A */}
                  {isSimulating && deltaH_cm > 0.01 && (
                    <rect
                      x={tankOffsetX + pan.x}
                      y={fluidSurfaceY + pan.y}
                      width={currentTankW}
                      height={originalFluidSurfaceY - fluidSurfaceY}
                      fill={colorA}
                      opacity="0.4"
                    />
                  )}
                  <rect
                    x={tankOffsetX + pan.x}
                    y={fluidSurfaceY + pan.y}
                    width={currentTankW}
                    height={Math.min(30, hA_dynamic_px)}
                    fill="url(#ripplePattern)"
                  />
                  {enableTwoFluids && (
                    <rect
                      x={tankOffsetX + pan.x}
                      y={fluidSurfaceY + hA_dynamic_px + pan.y}
                      width={currentTankW}
                      height={effectiveHB_px}
                      fill="url(#fluidDepthB)"
                    />
                  )}
                  <rect
                    x={tankOffsetX + pan.x}
                    y={tankBottomY - currentTankH + pan.y}
                    width={currentTankW}
                    height={currentTankH}
                    fill="none"
                    stroke={TANK_BORDER_COLOR}
                    strokeWidth="2"
                  />
                </g>

                <Dimensions />
              </>
            );
          }

          // 3D MODE RENDER
          return (
            <>
              <TankBack />
              <FluidsBack />
              {isObjectAboveWater && <FluidSurface />}
              <Object3D />
              {!isObjectAboveWater && <FluidSurface />}
              <FluidsFront />

              {/* Tank Glass/Wireframe */}
              <g pointerEvents="none">
                {/* Glass Tint on Front Face */}
                {drawPoly([tankPts.p5, tankPts.p6, tankPts.p7, tankPts.p8], "url(#glassGradient)", 0.2)}

                {/* 1. Back Face Edges */}
                <path d={`M${tankPts.p1.x},${tankPts.p1.y} L${tankPts.p2.x},${tankPts.p2.y}`} stroke={TANK_BORDER_COLOR} strokeWidth="1" />
                <path d={`M${tankPts.p2.x},${tankPts.p2.y} L${tankPts.p3.x},${tankPts.p3.y}`} stroke={TANK_BORDER_COLOR} strokeWidth="1" />
                <path d={`M${tankPts.p3.x},${tankPts.p3.y} L${tankPts.p4.x},${tankPts.p4.y}`} stroke={TANK_BORDER_COLOR} strokeWidth="1" />
                <path d={`M${tankPts.p4.x},${tankPts.p4.y} L${tankPts.p1.x},${tankPts.p1.y}`} stroke={TANK_BORDER_COLOR} strokeWidth="1" />

                {/* 2. Depth Connectors */}
                <path d={`M${tankPts.p1.x},${tankPts.p1.y} L${tankPts.p5.x},${tankPts.p5.y}`} stroke={TANK_BORDER_COLOR} strokeWidth="1" />
                <path d={`M${tankPts.p2.x},${tankPts.p2.y} L${tankPts.p6.x},${tankPts.p6.y}`} stroke={TANK_BORDER_COLOR} strokeWidth="1" />
                <path d={`M${tankPts.p3.x},${tankPts.p3.y} L${tankPts.p7.x},${tankPts.p7.y}`} stroke={TANK_BORDER_COLOR} strokeWidth="1" />
                <path d={`M${tankPts.p4.x},${tankPts.p4.y} L${tankPts.p8.x},${tankPts.p8.y}`} stroke={TANK_BORDER_COLOR} strokeWidth="1" />

                {/* 3. Front Face Edges */}
                <path d={`M${tankPts.p5.x},${tankPts.p5.y} L${tankPts.p6.x},${tankPts.p6.y}`} stroke={TANK_BORDER_COLOR} strokeWidth="2" />
                <path d={`M${tankPts.p6.x},${tankPts.p6.y} L${tankPts.p7.x},${tankPts.p7.y}`} stroke={TANK_BORDER_COLOR} strokeWidth="2" />
                <path d={`M${tankPts.p7.x},${tankPts.p7.y} L${tankPts.p8.x},${tankPts.p8.y}`} stroke={TANK_BORDER_COLOR} strokeWidth="2" />
                <path d={`M${tankPts.p8.x},${tankPts.p8.y} L${tankPts.p5.x},${tankPts.p5.y}`} stroke={TANK_BORDER_COLOR} strokeWidth="2" />
              </g>

              <Vectors />
            </>
          );
        })()}
      </svg>
    </div>
  );
};