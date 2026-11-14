import React from 'react';
import { ZoomIn, ZoomOut, Home } from 'lucide-react';

interface ControlesNavegacaoCenaProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  zoomPercent?: number;
  canZoomIn?: boolean;
  canZoomOut?: boolean;
  mode?: '2d' | '3d';
  className?: string;
}

export const ControlesNavegacaoCena: React.FC<ControlesNavegacaoCenaProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
  zoomPercent = 100,
  canZoomIn = true,
  canZoomOut = true,
  mode = '2d',
  className = 'bottom-6 left-6',
}) => {
  const stopEvent = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const resetTooltip =
    mode === '3d'
      ? 'Restaurar enquadramento inicial (3D)'
      : 'Restaurar enquadramento inicial';

  const panHint =
    mode === '3d'
      ? 'Navegação 3D: Botão esquerdo gira | Direito ou meio movimenta | Roda do mouse aplica zoom'
      : 'Navegação 2D: Roda do mouse aplica zoom no cursor | Botão do meio ou Espaço + esquerdo movimenta';

  return (
    <div
      data-pdf-hide="true"
      className={`absolute ${className} z-30 flex items-center gap-0.5 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border border-blue-100/70 p-1 select-none`}
      onMouseDown={stopEvent}
      onPointerDown={stopEvent}
      onTouchStart={stopEvent}
      title={panHint}
      role="toolbar"
      aria-label="Controles de navegação da cena"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onZoomOut();
        }}
        disabled={!canZoomOut}
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
          canZoomOut
            ? 'text-slate-600 hover:bg-blue-50 hover:text-blue-600 active:scale-95'
            : 'text-slate-300 cursor-not-allowed'
        }`}
        title="Afastar zoom (Roda do mouse para baixo)"
        aria-label="Afastar zoom"
      >
        <ZoomOut className="h-3.5 w-3.5" />
      </button>

      <span
        className="min-w-[42px] px-1 text-center text-[11px] font-bold tabular-nums text-slate-600"
        title="Nível de zoom atual"
      >
        {zoomPercent}%
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onZoomIn();
        }}
        disabled={!canZoomIn}
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
          canZoomIn
            ? 'text-slate-600 hover:bg-blue-50 hover:text-blue-600 active:scale-95'
            : 'text-slate-300 cursor-not-allowed'
        }`}
        title="Aproximar zoom (Roda do mouse para cima)"
        aria-label="Aproximar zoom"
      >
        <ZoomIn className="h-3.5 w-3.5" />
      </button>

      <span className="mx-0.5 h-4 w-px bg-slate-200" aria-hidden="true" />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onReset();
        }}
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-600 active:scale-95"
        title={resetTooltip}
        aria-label={resetTooltip}
      >
        <Home className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
