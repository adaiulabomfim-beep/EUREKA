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

type Point2D = {
  x: number;
  y: number;
};

type RenderedFace = {
  id?: string | number;
  pts?: Point2D[];
  fill?: string;
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
  brightness?: number;
  kind?: 'DAM' | 'WATER' | string;
  hatchPattern?: string;
};

type VectorItem = {
  start: Point2D;
  end: Point2D;
  color?: string;
  strokeWidth?: number;
  opacity?: number;
  isResultant?: boolean;
  val?: string | number;
};

interface SceneContainerProps {
  is3D: boolean;
  setIs3D: (v: boolean) => void;
  showVectors: boolean;
  setShowVectors: (v: boolean) => void;
  isAnalyzed: boolean;
  onCalculate: () => void;
  onReset: () => void;
  resetView: () => void;
  handlers?: React.HTMLAttributes<HTMLDivElement>;
  renderedFaces: RenderedFace[];
  vectors: VectorItem[];
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
        transition-colors select-none
      "
      {...handlers}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full opacity-40 blur-[120px]"
          style={{
            background:
              'radial-gradient(circle, rgba(59,130,246,0.18), transparent 60%)',
          }}
        />
        <div
          className="absolute -bottom-28 -right-28 h-[520px] w-[520px] rounded-full opacity-40 blur-[140px]"
          style={{
            background:
              'radial-gradient(circle, rgba(34,211,238,0.18), transparent 60%)',
          }}
        />
      </div>

      <div
        className="absolute top-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-blue-100/70 bg-white/85 p-1.5 shadow-xl backdrop-blur-md transition-all hover:scale-[1.03]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => {
            setIs3D(!is3D);
            resetView();
          }}
          className={`
            flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition-colors
            ${
              is3D
                ? 'border border-blue-100 bg-blue-50 text-blue-700'
                : 'border border-transparent text-slate-600 hover:bg-white/70'
            }
          `}
          title={is3D ? 'Mudar para 2D' : 'Mudar para 3D'}
          aria-label={is3D ? 'Mudar para 2D' : 'Mudar para 3D'}
        >
          <Cuboid className="h-4 w-4" />
          {is3D ? '3D' : '2D'}
        </button>

        <button
          type="button"
          onClick={() => setShowVectors(!showVectors)}
          className={`
            flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition-colors
            ${
              showVectors
                ? 'border border-blue-100 bg-blue-50 text-blue-700'
                : 'border border-transparent text-slate-600 hover:bg-white/70'
            }
          `}
          title={showVectors ? 'Ocultar vetores' : 'Mostrar vetores'}
          aria-label={showVectors ? 'Ocultar vetores' : 'Mostrar vetores'}
        >
          <Target className="h-4 w-4" />
          Vetores
        </button>

        <div className="mx-1 h-6 w-px bg-slate-200" />

        <button
          type="button"
          onClick={resetView}
          className="flex items-center gap-2 rounded-full border border-transparent px-4 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-white/70"
          title="Resetar câmera"
          aria-label="Resetar câmera"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>

      <div
        className="absolute bottom-20 right-6 z-30"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {!isAnalyzed ? (
          <button
            type="button"
            onClick={onCalculate}
            className="
              flex items-center gap-2 rounded-full
              bg-gradient-to-br from-blue-600 to-cyan-600
              px-5 py-2.5 text-xs font-black uppercase tracking-wide text-white
              shadow-lg shadow-blue-500/20
              transition-transform active:scale-95
              hover:from-blue-700 hover:to-cyan-600
            "
            title="Analisar"
            aria-label="Analisar"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Analisar
          </button>
        ) : (
          <button
            type="button"
            onClick={onReset}
            className="
              flex items-center gap-2 rounded-full
              border border-slate-200 bg-white px-5 py-2.5
              text-xs font-black uppercase tracking-wide text-slate-700
              shadow-lg shadow-slate-200/50
              transition-all active:scale-95
              hover:bg-slate-50
            "
            title="Reiniciar"
            aria-label="Reiniciar"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reiniciar
          </button>
        )}
      </div>

      {is3D && (
        <>
          <div className="animate-in fade-in pointer-events-none absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 select-none items-center gap-4 rounded-full bg-white/80 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 backdrop-blur transition-opacity">
            <span className="flex items-center gap-1">
              <MousePointer2 className="h-3 w-3" />
              Girar
            </span>
            <span className="h-3 w-px bg-slate-300" />
            <span className="flex items-center gap-1">
              <Maximize className="h-3 w-3" />
              Pan (direito)
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              resetView();
            }}
            className="group absolute bottom-6 right-6 z-30 rounded-full border border-blue-100/70 bg-white/90 p-2.5 text-slate-500 shadow-lg transition-all hover:scale-110 hover:text-blue-600"
            title="Resetar câmera"
            aria-label="Resetar câmera"
          >
            <RotateCcw className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-180" />
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

        <g opacity="0.12">
          <line
            x1={ORIGIN_X - 420}
            y1={ORIGIN_Y}
            x2={ORIGIN_X + 420}
            y2={ORIGIN_Y}
            stroke="#0f172a"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <line
            x1={ORIGIN_X}
            y1={ORIGIN_Y + 120}
            x2={ORIGIN_X}
            y2={ORIGIN_Y - 420}
            stroke="#0f172a"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        </g>

        {renderedFaces.map((f, index) => {
          if (!f.pts || f.pts.length < 3) return null;

          const d = `M ${f.pts.map((p) => `${p.x},${p.y}`).join(' L ')} Z`;

          const isDam = f.kind === 'DAM';
          const isWater = f.kind === 'WATER';

          const baseFill = f.fill ?? 'none';
          const baseOpacity = f.opacity ?? 1;

          // stroke técnico para esconder seams do SVG entre faces adjacentes
          const seamStroke =
            isDam && baseFill !== 'none'
              ? baseFill
              : (f.stroke ?? 'none');

          const seamStrokeWidth =
            isDam && baseFill !== 'none'
              ? Math.max(1.15, f.strokeWidth ?? 0)
              : (f.strokeWidth ?? 0);

          // reduz fortemente a segmentação visual causada por overlay por face
          const overlayOpacity =
            isWater || isDam
              ? 0
              : typeof f.brightness === 'number'
                ? f.brightness < 1
                  ? (1 - f.brightness) * 0.45
                  : (f.brightness - 1) * 0.18
                : 0;

          const overlayBlend: React.CSSProperties['mixBlendMode'] =
            typeof f.brightness === 'number' && f.brightness < 1
              ? 'multiply'
              : 'overlay';

          const key =
            f.id ??
            `face-${index}-${f.kind ?? 'generic'}-${f.pts
              .map((p) => `${p.x.toFixed(2)}-${p.y.toFixed(2)}`)
              .join('_')}`;

          return (
            <g key={key}>
              <path
                d={d}
                fill={baseFill}
                opacity={baseOpacity}
                stroke={seamStroke}
                strokeWidth={seamStrokeWidth}
                vectorEffect="non-scaling-stroke"
                shapeRendering="geometricPrecision"
                strokeLinejoin="round"
                strokeLinecap="round"
                paintOrder="stroke fill"
              />

              {overlayOpacity > 0 && (
                <path
                  d={d}
                  fill="#000000"
                  opacity={overlayOpacity}
                  stroke="none"
                  style={{ mixBlendMode: overlayBlend }}
                  pointerEvents="none"
                  shapeRendering="geometricPrecision"
                />
              )}

              {f.hatchPattern && (
                <path
                  d={d}
                  fill={f.hatchPattern}
                  opacity={1}
                  stroke="none"
                  pointerEvents="none"
                  shapeRendering="geometricPrecision"
                />
              )}
            </g>
          );
        })}

        {showVectors &&
          vectors.map((v, i) => {
            const labelX = v.start.x;
            const labelY = v.start.y - 15;

            return (
              <g key={`vec-${i}`} pointerEvents="none">
                <line
                  x1={v.start.x}
                  y1={v.start.y}
                  x2={v.end.x}
                  y2={v.end.y}
                  stroke={v.color ?? '#ef4444'}
                  strokeWidth={v.strokeWidth ?? 2}
                  opacity={v.opacity ?? 1}
                  markerEnd="url(#arrow-red)"
                  vectorEffect="non-scaling-stroke"
                />

                {v.isResultant && (
                  <circle
                    cx={v.end.x}
                    cy={v.end.y}
                    r={4}
                    fill={v.color ?? '#ef4444'}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                  />
                )}

                {v.val !== undefined && v.val !== null && v.val !== '' && (
                  <g transform={`translate(${labelX}, ${labelY})`}>
                    <rect
                      x={-32}
                      y={-11}
                      width={64}
                      height={22}
                      rx={6}
                      fill="#0f172a"
                      opacity={0.8}
                    />
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#ffffff"
                      fontSize={10}
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {String(v.val)}
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