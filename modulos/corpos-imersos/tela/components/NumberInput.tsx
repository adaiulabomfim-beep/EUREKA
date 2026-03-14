import React, { useState, useEffect } from 'react';

interface NumberInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: string;
  disabled?: boolean;
}

export const NumberInput: React.FC<NumberInputProps> = ({ value, onChange, min, max, step = "0.1", disabled }) => {
  const [localValue, setLocalValue] = useState<string>(value.toString());

  useEffect(() => {
    const parsed = parseFloat(localValue);
    if (!isNaN(parsed) && parsed === value) return;
    if (localValue === '' && value === 0) return;
    setLocalValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalValue(newVal);
    if (newVal === '') { onChange(0); return; }
    const parsed = parseFloat(newVal);
    if (!isNaN(parsed)) onChange(parsed);
  };

  const handleBlur = () => {
      let parsed = parseFloat(localValue);
      if (isNaN(parsed)) parsed = 0;
      let clamped = parsed;
      if (min !== undefined && clamped < min) clamped = min;
      if (max !== undefined && clamped > max) clamped = max;
      if (clamped !== parsed || localValue === '') {
          setLocalValue(clamped.toString());
          onChange(clamped);
      }
  };

  return (
    <input
      type="number"
      step={step}
      min={min}
      max={max}
      className="w-full h-9 px-3 border border-slate-200 rounded text-xs bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
    />
  );
};
