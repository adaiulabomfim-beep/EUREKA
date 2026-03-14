import React from 'react';

export const NumberInput = ({ label, value, onChange, min, max, step }: any) => {
  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-slate-500 uppercase">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
      />
    </div>
  );
};
