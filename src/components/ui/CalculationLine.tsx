import React from 'react';

export type CalculationTheme =
  | 'slate'
  | 'blue'
  | 'cyan'
  | 'emerald'
  | 'amber'
  | 'red'
  | 'purple'
  | 'indigo';

export interface CalculationLineProps {
  label: string | React.ReactNode;
  symbol: string | React.ReactNode;
  formula?: string | React.ReactNode;
  substitution?: string | React.ReactNode;
  result?: string | React.ReactNode;
  unit?: string | React.ReactNode;
  isSubHeader?: boolean;
  theme?: CalculationTheme;
}

const THEME_MAP: Record<
  CalculationTheme,
  {
    text: string;
    bg: string;
    border: string;
    subBg: string;
    unitText: string;
    unitSub: string;
    subHeaderWrap: string;
  }
> = {
  slate: {
    text: 'text-slate-600 dark:text-slate-300',
    bg: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100',
    border: 'border-slate-100 dark:border-slate-800',
    subBg: 'bg-slate-700 dark:bg-slate-700 text-white',
    unitText: 'text-slate-500 dark:text-slate-400',
    unitSub: 'text-slate-200',
    subHeaderWrap: 'bg-slate-50/80 dark:bg-slate-800/60',
  },
  blue: {
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200',
    border: 'border-blue-50 dark:border-slate-800',
    subBg: 'bg-blue-600 dark:bg-blue-600 text-white',
    unitText: 'text-blue-500 dark:text-blue-400',
    unitSub: 'text-blue-200',
    subHeaderWrap: 'bg-blue-50/50 dark:bg-blue-950/40',
  },
  cyan: {
    text: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-200',
    border: 'border-cyan-50 dark:border-slate-800',
    subBg: 'bg-cyan-600 dark:bg-cyan-600 text-white',
    unitText: 'text-cyan-500 dark:text-cyan-400',
    unitSub: 'text-cyan-200',
    subHeaderWrap: 'bg-cyan-50/50 dark:bg-cyan-950/40',
  },
  emerald: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200',
    border: 'border-emerald-50 dark:border-slate-800',
    subBg: 'bg-emerald-600 dark:bg-emerald-600 text-white',
    unitText: 'text-emerald-500 dark:text-emerald-400',
    unitSub: 'text-emerald-200',
    subHeaderWrap: 'bg-emerald-50/50 dark:bg-emerald-950/40',
  },
  amber: {
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200',
    border: 'border-amber-50 dark:border-slate-800',
    subBg: 'bg-amber-500 dark:bg-amber-600 text-white',
    unitText: 'text-amber-500 dark:text-amber-400',
    unitSub: 'text-amber-100',
    subHeaderWrap: 'bg-amber-50/50 dark:bg-amber-950/40',
  },
  red: {
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-200',
    border: 'border-red-50 dark:border-slate-800',
    subBg: 'bg-red-600 dark:bg-red-600 text-white',
    unitText: 'text-red-500 dark:text-red-400',
    unitSub: 'text-red-200',
    subHeaderWrap: 'bg-red-50/50 dark:bg-red-950/40',
  },
  purple: {
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200',
    border: 'border-purple-50 dark:border-slate-800',
    subBg: 'bg-purple-600 dark:bg-purple-600 text-white',
    unitText: 'text-purple-500 dark:text-purple-400',
    unitSub: 'text-purple-200',
    subHeaderWrap: 'bg-purple-50/50 dark:bg-purple-950/40',
  },
  indigo: {
    text: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200',
    border: 'border-indigo-50 dark:border-slate-800',
    subBg: 'bg-indigo-600 dark:bg-indigo-600 text-white',
    unitText: 'text-indigo-500 dark:text-indigo-400',
    unitSub: 'text-indigo-200',
    subHeaderWrap: 'bg-indigo-50/50 dark:bg-indigo-950/40',
  },
};

export const CalculationLine: React.FC<CalculationLineProps> = ({
  label,
  symbol,
  formula,
  substitution,
  result,
  unit,
  isSubHeader,
  theme = 'blue',
}) => {
  const t = THEME_MAP[theme];
  const hasResult = result !== undefined && result !== null && result !== '';

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b ${t.border} last:border-0 ${
        isSubHeader
          ? `${t.subHeaderWrap} -mx-6 px-6 font-bold text-slate-800 dark:text-slate-100 mt-4 mb-2 py-4 shadow-sm rounded-xl`
          : ''
      }`}
    >
      <div
        className={`font-bold uppercase tracking-widest ${
          isSubHeader
            ? 'text-sm text-slate-700 dark:text-slate-200'
            : 'text-xs text-slate-500 dark:text-slate-400'
        }`}
      >
        {label}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 text-[13px] sm:text-sm text-slate-700 dark:text-slate-300 mt-2 sm:mt-0">
        <span className={`font-semibold ${t.text}`}>{symbol}</span>
        {formula && (
          <span className="text-slate-400 dark:text-slate-500 hidden lg:inline-flex items-center gap-1.5">
            <span>=</span>
            <span>{formula}</span>
          </span>
        )}
        {substitution && (
          <span className="text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5">
            <span>=</span>
            <span>{substitution}</span>
          </span>
        )}
        {hasResult && (
          <span
            className={`font-bold px-3 py-1.5 rounded-lg ml-auto inline-flex items-center gap-1.5 ${
              isSubHeader ? t.subBg : t.bg
            }`}
          >
            <span>=</span>
            <span>{result}</span>
            {unit && (
              <span
                className={`text-[11px] font-sans font-semibold ${
                  isSubHeader ? t.unitSub : t.unitText
                }`}
              >
                {unit}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
};
