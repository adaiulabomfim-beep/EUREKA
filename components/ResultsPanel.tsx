import React from 'react';
import { LucideIcon, Info } from 'lucide-react';

export type CardTheme = 'red' | 'green' | 'blue' | 'purple' | 'amber' | 'cyan' | 'slate';

export interface ResultsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  theme?: CardTheme;
  badge?: string;
  secondaryValue?: string;
  highlight?: boolean;
}

export const ResultsCard: React.FC<ResultsCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  theme = 'blue',
  badge,
  secondaryValue,
  highlight = false,
}) => {

  const themeStyles = {
    red: { border: 'border-l-red-500', text: 'text-red-500', title: 'text-slate-400' },
    green: { border: 'border-l-emerald-500', text: 'text-emerald-500', title: 'text-slate-400' },
    blue: { border: 'border-l-blue-600', text: 'text-blue-600', title: 'text-blue-600' },
    purple: { border: 'border-l-purple-400', text: 'text-purple-600', title: 'text-purple-400' },
    amber: { border: 'border-l-amber-500', text: 'text-amber-600', title: 'text-slate-400' },
    cyan: { border: 'border-l-cyan-500', text: 'text-cyan-500', title: 'text-blue-500' },
    slate: { border: 'border-l-slate-400', text: 'text-slate-500', title: 'text-slate-400' },
  };

  const currentTheme = themeStyles[theme];

  // CARD HIGHLIGHT (Estado do objeto)
  if (highlight) {
    return (
      <div className="rounded-lg border border-purple-100 bg-purple-50/50 py-2 px-3 text-center shadow-sm">
        <div className="text-[8px] font-bold uppercase tracking-widest text-purple-400/70">
          {title}
        </div>

        <div className="text-[12px] font-black text-purple-600 uppercase tracking-wide">
          {value}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        relative rounded-lg border border-slate-100 bg-white py-2.5 px-3
        shadow-sm border-l-[4px] ${currentTheme.border}
      `}
    >

      {badge && (
        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-md uppercase">
          {badge}
        </div>
      )}

      <div className={`text-[9px] font-bold uppercase tracking-tight ${currentTheme.title}`}>
        {title}
      </div>

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-baseline">
          <span className="text-[18px] font-bold text-slate-800 leading-none">
            {value}
          </span>

          {unit && (
            <span className="text-[10px] font-bold text-slate-700 ml-1">
              {unit}
            </span>
          )}
        </div>

        {Icon && (
          <Icon className={`w-4 h-4 ${currentTheme.text}`} />
        )}
      </div>

      {secondaryValue && (
        <div className="text-[9px] mt-1 text-blue-500 flex flex-wrap gap-x-2">
          {secondaryValue.split('|').map((val, idx) => (
            <span key={idx}>{val.trim()}</span>
          ))}
        </div>
      )}
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
              w-full py-2.5 rounded-lg font-bold text-[11px]
              flex items-center justify-center gap-2 uppercase tracking-wide transition-all
              ${footerButton.disabled
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow'}
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