import React from 'react';
import { LucideIcon, Info } from 'lucide-react';

export type CardTheme = 'red' | 'green' | 'blue' | 'purple' | 'amber' | 'cyan' | 'slate';

export interface ResultsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon; // Keeps backwards compatibility as rightIcon
  leftIcon?: LucideIcon;
  theme?: CardTheme;
  badge?: string;
  secondaryValue?: string;
  highlight?: boolean;
}

export const ResultsCard: React.FC<ResultsCardProps> = ({
  title,
  value,
  unit,
  icon: RightIcon,
  leftIcon: LeftIcon,
  theme = 'blue',
  badge,
  secondaryValue,
  highlight = false,
}) => {

  const themeStyles = {
    red: { border: 'border-l-red-500', text: 'text-red-500', title: 'text-slate-400', bg: 'bg-red-50' },
    green: { border: 'border-l-emerald-500', text: 'text-emerald-500', title: 'text-slate-400', bg: 'bg-emerald-50' },
    blue: { border: 'border-l-blue-600', text: 'text-blue-600', title: 'text-blue-600', bg: 'bg-blue-50' },
    purple: { border: 'border-l-purple-400', text: 'text-purple-600', title: 'text-purple-400', bg: 'bg-purple-50' },
    amber: { border: 'border-l-amber-500', text: 'text-amber-600', title: 'text-slate-400', bg: 'bg-amber-50' },
    cyan: { border: 'border-l-cyan-500', text: 'text-cyan-500', title: 'text-blue-500', bg: 'bg-cyan-50' },
    slate: { border: 'border-l-slate-400', text: 'text-slate-500', title: 'text-slate-400', bg: 'bg-slate-50' },
  };

  const currentTheme = themeStyles[theme];

  // CARD HIGHLIGHT (Estado do objeto)
  if (highlight) {
    return (
      <div className="rounded-xl border border-purple-100 bg-purple-50/50 py-3 px-3 flex flex-col items-center justify-center shadow-sm">
        {LeftIcon && (
          <div className="w-10 h-10 rounded-full bg-purple-100 mb-2 flex items-center justify-center">
            <LeftIcon className="w-5 h-5 text-purple-600" strokeWidth={2.5} />
          </div>
        )}
        <div className="text-[10px] font-bold uppercase tracking-widest text-purple-500/80">
          {title}
        </div>
        <div className="text-[16px] font-black text-purple-600 uppercase tracking-wide mt-0.5">
          {value}
        </div>
        {secondaryValue && (
          <div className="text-[10px] mt-1 text-purple-500 font-bold">
            {secondaryValue}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`
        relative rounded-xl border border-slate-100 bg-white py-3 px-3.5
        shadow-sm flex items-center gap-3.5 border-l-[4px] ${currentTheme.border}
      `}
    >
      {/* Left Icon (Colored Circle) */}
      {LeftIcon && (
        <div className={`w-10 h-10 rounded-full ${currentTheme.bg} flex items-center justify-center shrink-0`}>
          <LeftIcon className={`w-5 h-5 ${currentTheme.text}`} strokeWidth={2} />
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        <div className={`text-[10px] font-bold uppercase tracking-tight truncate ${currentTheme.title}`}>
          {title}
        </div>

        <div className="flex items-baseline mt-0.5">
          <span className="text-[18px] font-bold text-slate-800 leading-none truncate">
            {value}
          </span>
          {unit && (
            <span className="text-[11px] font-bold text-slate-600 ml-1 shrink-0">
              {unit}
            </span>
          )}
        </div>

        {secondaryValue && (
          <div className="text-[10px] mt-1 text-blue-500 flex flex-wrap gap-x-2 truncate">
            {secondaryValue.split('|').map((val, idx) => (
              <span key={idx}>{val.trim()}</span>
            ))}
          </div>
        )}
      </div>

      {/* Right Side (Badge or Right Icon) */}
      <div className="shrink-0 flex items-center justify-end">
        {badge ? (
          <div className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1.5 rounded-md uppercase tracking-wider">
            {badge}
          </div>
        ) : RightIcon ? (
          <RightIcon className={`w-4 h-4 ${currentTheme.text}`} strokeWidth={2.5} />
        ) : null}
      </div>

    </div>
  );
};


export interface ResultsPanelProps {
  title?: string;
  children: React.ReactNode;
  footerButton?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    disabled?: boolean;
  };
}


export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  title = "PAINEL DE RESULTADOS",
  children,
  footerButton,
}) => {

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full min-h-[480px]">

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-slate-100">

        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Info className="w-3.5 h-3.5 text-indigo-500" />
        </div>

        <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
          {title}
        </h3>

      </div>


      {/* Cards */}
      <div className="p-3 space-y-2.5 flex-1 overflow-y-auto custom-scrollbar">
        {children}
      </div>


      {/* Footer Button */}
      {footerButton && (
        <div className="p-3">

          <button
            onClick={footerButton.onClick}
            disabled={footerButton.disabled}
            className={`
              w-full py-2.5 rounded-full font-black text-xs tracking-wide uppercase
              flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg
              ${footerButton.disabled
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-600 text-white shadow-blue-500/20'}
            `}
          >

            {footerButton.icon && (
              <footerButton.icon className="w-3.5 h-3.5" />
            )}

            {footerButton.label}

          </button>

        </div>
      )}

    </div>
  );
};