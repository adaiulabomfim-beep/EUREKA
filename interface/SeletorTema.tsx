import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTema } from './gerenciadorTema';

interface SeletorTemaProps {
  className?: string;
  showLabel?: boolean;
}

export const SeletorTema: React.FC<SeletorTemaProps> = ({ className = '', showLabel = false }) => {
  const { isDark, alternarTema } = useTema();

  return (
    <button
      type="button"
      onClick={alternarTema}
      id="btn-seletor-tema"
      title={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
      aria-label={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
      className={`
        relative flex items-center justify-center gap-2 px-3 py-2 rounded-full
        transition-all duration-300 active:scale-95 shadow-sm
        ${
          isDark
            ? 'bg-slate-800/90 hover:bg-slate-700 text-amber-400 border border-slate-700 shadow-slate-900/50'
            : 'bg-white/90 hover:bg-white text-blue-600 border border-blue-200/80 shadow-blue-500/10'
        }
        ${className}
      `}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 rotate-0 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
        ) : (
          <Moon className="w-4 h-4 text-blue-600 rotate-0 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(37,99,235,0.3)]" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-bold uppercase tracking-wider select-none">
          {isDark ? 'Claro' : 'Escuro'}
        </span>
      )}
    </button>
  );
};
