import React from 'react';
import { Play, RotateCcw, Box, ArrowLeftRight, MousePointer2 } from 'lucide-react';

interface Vista3DUIProps {
  is3D: boolean;
  setIs3D: (v: boolean) => void;
  showVectors: boolean;
  setShowVectors: (v: boolean) => void;
  isAnalyzed: boolean;
  onCalculate: () => void;
  onReset: () => void;
}

export const Vista3DUI: React.FC<Vista3DUIProps> = ({
  is3D,
  setIs3D,
  showVectors,
  setShowVectors,
  isAnalyzed,
  onCalculate,
  onReset,
}) => {
  return (
    <>
      <div
        className="absolute top-6 left-1/2 -translate-x-1/2 flex z-30 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-blue-100/50 p-1"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setIs3D(!is3D)}
          className={`
            flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap
            ${
              is3D
                ? 'bg-blue-100/80 text-blue-700 shadow-inner'
                : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'
            }
          `}
          title={is3D ? 'Mudar para 2D' : 'Mudar para 3D'}
        >
          <Box className="h-3.5 w-3.5" />
          {is3D ? '3D ON' : '3D OFF'}
        </button>

        <button
          type="button"
          onClick={() => setShowVectors(!showVectors)}
          className={`
            flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap
            ${
              showVectors
                ? 'bg-blue-100/80 text-blue-700 shadow-inner'
                : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'
            }
          `}
          title={showVectors ? 'Ocultar vetores' : 'Mostrar vetores'}
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          VETORES
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

      <div className="animate-in fade-in pointer-events-none absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 select-none items-center gap-4 rounded-full bg-white/80 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 backdrop-blur transition-opacity">
        <span className="flex items-center gap-1">
          <MousePointer2 className="h-3 w-3" />
          Girar
        </span>
        <span className="h-3 w-px bg-slate-300" />
        <span className="flex items-center gap-1">
          <MousePointer2 className="h-3 w-3" />
          Pan (direito)
        </span>
      </div>
    </>
  );
};
