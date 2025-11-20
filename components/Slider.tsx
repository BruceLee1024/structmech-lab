import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  unit?: string;
}

export const Slider: React.FC<SliderProps> = ({ label, value, min, max, step = 1, onChange, unit = '' }) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          {value.toFixed(step < 0.1 ? 2 : 1)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>
  );
};