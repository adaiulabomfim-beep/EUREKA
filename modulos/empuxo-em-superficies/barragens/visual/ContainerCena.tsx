import React from 'react';
import {
  Target,
  RotateCcw,
  Cuboid,
  MousePointer2,
  Maximize,
  Play,
} from 'lucide-react';
import { SVGDefs } from './DefinicoesSVG';

interface SceneContainerProps {
  is3D: boolean;
  setIs3D: (v: boolean) => void;
  showVectors: boolean;
  setShowVectors: (v: boolean) => void;
  isAnalyzed: boolean;
  onCalculate: () => void;
  onReset: () => void;
  resetView: () => void;
  handlers: any;
  renderedFaces: any[];
  vectors: any[];
  SVG_W: number;
  SVG_H: number;
  ORIGIN_X: number;
  ORIGIN_Y: number;
  children?: React.ReactNode;
}

export const SceneContainer: React.FC<SceneContainerProps> = ({
  is3D,
  setIs3D,
  showVectors,
  setShowVectors,
  isAnalyzed,
  onCalculate,
  onReset,
  resetView,
  handlers,
  renderedFaces,
  vectors,
  SVG_W,
  SVG_H,
  ORIGIN_X,
  ORIGIN_Y,
  children,
}) => {
  return (
    <div
      className="
        relative flex flex-col items-center justify-center
        min-h-[600px] h-full p-2 overflow-hidden
        rounded-2xl
        bg-white/70 backdrop-blur-md
        border border-blue-100/70
        shadow-2xl shadow-blue-200/25
        transition-colors
      "
      {...handlers}
    >
      {/* halo/refração */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full blur-[120px] opacity-40"
          style={{
            background:
              'radial-gradient(circle, rgba(59,130,246,0.18), transparent 60%)',
          }}
        />
        <div
          className="absolute -bottom-28 -right-28 w-[520px] h-[520px] rounded-full blur-[140px] opacity-40"
          style={{
            background:
              'radial-gradient(circle, rgba(34,211,238,0.18), transparent 60%)',
          }}
        />
      </div>

      {/* toolbar superior */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/85 p-1.5 rounded-full shadow-xl border border-blue-100/70 backdrop-blur-md z-30 transition-all hover:scale-[1.03]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            setIs3D(!is3D);
            resetView();
          }}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs transition-colors
            ${
              is3D
                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                : 'text-slate-600 hover:bg-white/70 border border-transparent'
            }
          `}
          title={is3D ? 'Mudar para 2D' : 'Mudar para 3D'}
        >
          <Cuboid className="w-4 h-4" />
          {is3D ? '3D' : '2D'}
        </button>

        <button
          onClick={() => setShowVectors(!showVectors)}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs transition-colors
            ${
              showVectors
                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                : 'text-slate-600 hover:bg-white/70 border border-transparent'
            }
          `}
          title={showVectors ? 'Ocultar Vetores' : 'Mostrar Vetores'}
        >
          <Target className="w-4 h-4" />
          Vetores
        </button>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <button
          onClick={resetView}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs text-slate-600 hover:bg-white/70 border border-transparent transition-colors"
          title="Resetar Câmera"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* botão analisar/reiniciar */}
      <div
        className="absolute bottom-20 right-6 z-30"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {!isAnalyzed ? (
          <button
            onClick={onCalculate}
            className="
              flex items-center gap-2
              bg-gradient-to-br from-blue-600 to-cyan-600
              hover:from-blue-700 hover:to-cyan-600
              text-white px-5 py-2.5 rounded-full
              shadow-lg shadow-blue-500/20
              font-black text-xs tracking-wide uppercase
              transition-transform active:scale-95
            "
            title="Analisar"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Analisar
          </button>
        ) : (
          <button
            onClick={onReset}
            className="
              flex items-center gap-2
              bg-white text-slate-700 px-5 py-2.5 rounded-full
              border border-slate-200 hover:bg-slate-50
              shadow-lg shadow-slate-200/50
              font-black text-xs tracking-wide uppercase
              transition-all active:scale-95
            "
            title="Reiniciar"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar
          </button>
        )}
      </div>

      {/* instruções de câmera */}
      {is3D && (
        <>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-slate-400 bg-white/80 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest pointer-events-none backdrop-blur select-none animate-in fade-in transition-opacity z-30">
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
        height="100%"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="flex-1 touch-none overflow-visible"
      >
        <SVGDefs />

        {/* eixos */}
        <g opacity="0.12">
          <line
            x1={ORIGIN_X - 420}
            y1={ORIGIN_Y}
            x2={ORIGIN_X + 420}
            y2={ORIGIN_Y}
            stroke="#0f172a"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <line
            x1={ORIGIN_X}
            y1={ORIGIN_Y + 120}
            x2={ORIGIN_X}
            y2={ORIGIN_Y - 420}
            stroke="#0f172a"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        </g>

        {/* faces */}
        {renderedFaces.map((f) => {
          if (!f.pts || f.pts.length < 3) return null;

          const d = `M ${f.pts.map((p: any) => `${p.x},${p.y}`).join(' L ')} Z`;

          const overlayColor = f.kind === 'WATER' ? 'transparent' : '#000000';
          const overlayOpacity =
            f.kind === 'WATER' ? 0 : (
              typeof f.brightness === 'number'
                ? f.brightness < 1
                  ? (1 - f.brightness) * 0.45
                  : (f.brightness - 1) * 0.18
                : 0
            );

          const fillStyle = undefined;

          const overlayBlend =
            typeof f.brightness === 'number' && f.brightness < 1
              ? ('multiply' as const)
              : ('overlay' as const);

          return (
            <g key={f.id}>
              <path
                d={d}
                fill={f.fill}
                opacity={f.opacity}
                stroke={f.stroke}
                strokeWidth={f.strokeWidth}
                strokeLinejoin="round"
                style={fillStyle}
              />

              <path
                d={d}
                fill={overlayColor}
                opacity={overlayOpacity}
                stroke="none"
                style={{ mixBlendMode: overlayBlend }}
                pointerEvents="none"
              />

              {f.hatchPattern && (
                <path
                  d={d}
                  fill={f.hatchPattern}
                  opacity={1}
                  stroke="none"
                  pointerEvents="none"
                />
              )}
            </g>
          );
        })}

        {/* vetores */}
        {vectors.map((v, i) => {
          const labelX = v.start.x;
          const labelY = v.start.y - 15;

          return (
            <g key={`vec-${i}`} pointerEvents="none">
              <line
                x1={v.start.x}
                y1={v.start.y}
                x2={v.end.x}
                y2={v.end.y}
                stroke={v.color}
                strokeWidth={v.strokeWidth}
                opacity={v.opacity}
                markerEnd="url(#arrow-red)"
              />
              
              {v.isResultant && (
                <circle
                  cx={v.end.x}
                  cy={v.end.y}
                  r="4"
                  fill={v.color}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              )}

              {v.val && (
                <g transform={`translate(${labelX}, ${labelY})`}>
                  <rect
                    x="-32"
                    y="-11"
                    width="64"
                    height="22"
                    rx="6"
                    fill="#0f172a"
                    opacity="0.8"
                  />
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {v.val}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {children}
      </svg>
    </div>
  );
};