import React, { useState } from 'react';
import { Slider } from './Slider';

export const MohrModule: React.FC = () => {
  const [sx, setSx] = useState(50); // Sigma X
  const [sy, setSy] = useState(10); // Sigma Y
  const [txy, setTxy] = useState(20); // Tau XY

  // Calculations
  const center = (sx + sy) / 2;
  const radius = Math.sqrt(Math.pow((sx - sy) / 2, 2) + Math.pow(txy, 2));
  const s1 = center + radius;
  const s2 = center - radius;
  const maxShear = radius;

  // Visualization Config
  const WIDTH = 500;
  const HEIGHT = 500;
  const ORIGIN_X = WIDTH / 2;
  const ORIGIN_Y = HEIGHT / 2;
  const SCALE = 2.5; 

  const toSvgX = (val: number) => ORIGIN_X + val * SCALE;
  const toSvgY = (val: number) => ORIGIN_Y - val * SCALE; 

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col items-center justify-center">
         <h3 className="text-lg font-semibold text-slate-800 mb-4 w-full text-left px-4">应力莫尔圆 (Mohr's Circle)</h3>
         
         <div className="flex gap-8">
            {/* SVG Plot */}
            <svg width={WIDTH} height={HEIGHT} className="bg-slate-50 rounded border border-slate-100">
                <defs>
                    <marker id="arrow-axis" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
                    </marker>
                </defs>
                
                {/* Axes */}
                <line x1="20" y1={ORIGIN_Y} x2={WIDTH-20} y2={ORIGIN_Y} stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#arrow-axis)"/>
                <line x1={ORIGIN_X} y1={HEIGHT-20} x2={ORIGIN_X} y2={20} stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#arrow-axis)"/>
                <text x={WIDTH-40} y={ORIGIN_Y - 10} className="text-xs fill-slate-500 font-bold">σ</text>
                <text x={ORIGIN_X + 10} y={30} className="text-xs fill-slate-500 font-bold">τ</text>

                {/* The Circle */}
                <circle 
                    cx={toSvgX(center)} 
                    cy={toSvgY(0)} 
                    r={radius * SCALE} 
                    fill="rgba(59, 130, 246, 0.1)" 
                    stroke="#3b82f6" 
                    strokeWidth="2" 
                />

                {/* Points X and Y */}
                <line x1={toSvgX(sx)} y1={toSvgY(txy)} x2={toSvgX(sy)} y2={toSvgY(-txy)} stroke="#94a3b8" strokeDasharray="4,4" />
                
                <circle cx={toSvgX(sx)} cy={toSvgY(txy)} r="4" fill="#ef4444" />
                <text x={toSvgX(sx)+5} y={toSvgY(txy)-5} className="text-xs font-bold fill-red-600">X</text>
                
                <circle cx={toSvgX(sy)} cy={toSvgY(-txy)} r="4" fill="#ef4444" />
                <text x={toSvgX(sy)+5} y={toSvgY(-txy)-5} className="text-xs font-bold fill-red-600">Y</text>

                {/* Principal Stresses */}
                <circle cx={toSvgX(s1)} cy={ORIGIN_Y} r="3" fill="#10b981" />
                <text x={toSvgX(s1)+5} y={ORIGIN_Y+15} className="text-xs fill-green-600 font-bold">σ1</text>
                
                <circle cx={toSvgX(s2)} cy={ORIGIN_Y} r="3" fill="#10b981" />
                <text x={toSvgX(s2)-15} y={ORIGIN_Y+15} className="text-xs fill-green-600 font-bold">σ2</text>

            </svg>
         </div>
      </div>

      <div className="w-full lg:w-80 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
        <h2 className="text-xl font-bold text-slate-800 mb-6">应力状态 inputs</h2>
        <Slider label="σx (Normal X)" value={sx} min={-100} max={100} unit="MPa" onChange={setSx} />
        <Slider label="σy (Normal Y)" value={sy} min={-100} max={100} unit="MPa" onChange={setSy} />
        <Slider label="τxy (Shear)" value={txy} min={-50} max={50} unit="MPa" onChange={setTxy} />

        <div className="mt-6 p-4 bg-slate-50 rounded border border-slate-200 shadow-inner">
           <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">理论公式 (Formulas)</h4>
           <div className="text-sm text-slate-700 space-y-4 font-serif bg-white p-3 rounded border border-slate-100">
              <div className="flex items-center gap-2">
                 <span className="font-serif italic">σ<sub>avg</sub> =</span>
                 <div className="flex flex-col items-center"><div className="border-b border-slate-800 leading-none pb-0.5">σ<sub>x</sub> + σ<sub>y</sub></div><div className="leading-none pt-0.5">2</div></div>
              </div>
              <div className="flex items-center gap-2">
                 <span className="font-serif italic">R =</span>
                 <span className="font-serif">√[ ((σ<sub>x</sub>-σ<sub>y</sub>)/2)<sup>2</sup> + τ<sub>xy</sub><sup>2</sup> ]</span>
              </div>
              <div className="flex items-center gap-2">
                 <span className="font-serif italic">σ<sub>1,2</sub> =</span>
                 <span className="font-serif">σ<sub>avg</sub> ± R</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};