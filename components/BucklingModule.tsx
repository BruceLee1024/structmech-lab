import React, { useState } from 'react';
import { Slider } from './Slider';

type BoundaryType = 'pinned-pinned' | 'fixed-free' | 'fixed-fixed' | 'fixed-pinned';

const BOUNDARIES: Record<BoundaryType, { k: number; label: string; description: string }> = {
  'pinned-pinned': { k: 1.0, label: '两端铰支 (Pinned-Pinned)', description: '最基础模型，K=1.0' },
  'fixed-free': { k: 2.0, label: '一端固定一端自由 (Fixed-Free)', description: '如旗杆，最易失稳，K=2.0' },
  'fixed-fixed': { k: 0.5, label: '两端固定 (Fixed-Fixed)', description: '约束最强，稳定性最好，K=0.5' },
  'fixed-pinned': { k: 0.7, label: '一端固定一端铰支 (Fixed-Pinned)', description: '介于两者之间，K≈0.7' }
};

export const BucklingModule: React.FC = () => {
  const [bc, setBc] = useState<BoundaryType>('pinned-pinned');
  const [length, setLength] = useState(5); // m
  const [load, setLoad] = useState(100); // kN
  const [ei, setEi] = useState(2000); // kN*m^2 (Flexural Rigidity)

  // Euler Critical Load Calculation
  // Pcr = (π^2 * EI) / (K * L)^2
  const k = BOUNDARIES[bc].k;
  const pCr = (Math.PI * Math.PI * ei) / Math.pow(k * length, 2);
  
  const isBuckled = load > pCr;
  const safetyFactor = pCr / load;
  
  // Visualization Logic
  const SVG_H = 400;
  const SVG_W = 300;
  const COL_X = SVG_W / 2;
  const MARGIN_TOP = 50;
  const COL_H = 300; // Visual height
  
  // Generate Curve Path
  const maxDeflection = isBuckled ? Math.min((load - pCr) / pCr * 50, 60) : 0;
  
  const generateColumnPath = () => {
    const points = [];
    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps; // 0 to 1
      const y = MARGIN_TOP + t * COL_H;
      let xOffset = 0;

      // Shape functions based on Boundary Conditions
      if (maxDeflection > 0) {
        switch (bc) {
          case 'pinned-pinned':
            xOffset = maxDeflection * Math.sin(Math.PI * t);
            break;
          case 'fixed-free':
            xOffset = maxDeflection * (1 - Math.cos((Math.PI * t) / 2));
            break;
          case 'fixed-fixed':
            xOffset = maxDeflection * 0.5 * (1 - Math.cos(2 * Math.PI * t));
            break;
          case 'fixed-pinned':
            xOffset = maxDeflection * (Math.sin(Math.PI * t) - 0.5 * Math.sin(2 * Math.PI * t)); // Rough viz
            break;
        }
      }
      points.push(`${COL_X + xOffset},${y}`);
    }
    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col items-center justify-center relative overflow-hidden">
         <h3 className="text-lg font-semibold text-slate-800 mb-4 w-full text-left px-4">压杆稳定 (Column Stability)</h3>
         
         <div className="flex items-center justify-center w-full h-full relative">
            {/* Background Grid */}
            <div className="absolute inset-0 pointer-events-none" 
                 style={{backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.3}}>
            </div>

            <svg width={SVG_W} height={SVG_H} className="z-10">
                <defs>
                    <marker id="arrow-load" markerWidth="12" markerHeight="8" refX="6" refY="8" orient="auto">
                        <path d="M 6 8 L 0 0 L 12 0 Z" fill="#ef4444" />
                    </marker>
                    <pattern id="hatch-buckle" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <line x1="0" y1="0" x2="0" y2="4" stroke="#94a3b8" strokeWidth="1"/>
                    </pattern>
                </defs>

                {/* Floor */}
                <rect x={COL_X - 40} y={MARGIN_TOP + COL_H} width="80" height="10" fill="url(#hatch-buckle)" stroke="#64748b"/>

                {/* Top Ceiling (if fixed or pinned top) */}
                {bc !== 'fixed-free' && (
                   <rect x={COL_X - 40} y={MARGIN_TOP - 10} width="80" height="10" fill="url(#hatch-buckle)" stroke="#64748b"/>
                )}

                {/* The Column */}
                <path 
                    d={generateColumnPath()} 
                    fill="none" 
                    stroke={isBuckled ? "#ef4444" : "#3b82f6"} 
                    strokeWidth="8" 
                    strokeLinecap="round"
                />
                
                {/* Load Arrow */}
                <line 
                   x1={COL_X} y1={MARGIN_TOP - 60} 
                   x2={COL_X} y2={MARGIN_TOP - 10} 
                   stroke="#ef4444" strokeWidth="4" markerEnd="url(#arrow-load)" 
                   transform={`translate(${isBuckled && bc === 'fixed-free' ? maxDeflection : 0}, 0)`}
                />
                <text 
                  x={COL_X + 15} y={MARGIN_TOP - 30} 
                  className="text-sm font-bold fill-red-600"
                  transform={`translate(${isBuckled && bc === 'fixed-free' ? maxDeflection : 0}, 0)`}
                >
                    P={load}kN
                </text>

                {/* Support Symbols */}
                {bc === 'pinned-pinned' && <circle cx={COL_X} cy={MARGIN_TOP} r="5" fill="white" stroke="#334155" strokeWidth="2"/>}
                {bc === 'fixed-pinned' && <circle cx={COL_X} cy={MARGIN_TOP} r="5" fill="white" stroke="#334155" strokeWidth="2"/>}
                
                {bc === 'pinned-pinned' ? (
                     <circle cx={COL_X} cy={MARGIN_TOP + COL_H} r="5" fill="white" stroke="#334155" strokeWidth="2"/>
                ) : (
                     <rect x={COL_X-10} y={MARGIN_TOP+COL_H-5} width="20" height="5" fill="#334155" />
                )}

            </svg>

            {/* Result Overlay */}
            <div className={`absolute top-10 right-10 p-4 rounded-lg border shadow-sm backdrop-blur-sm ${isBuckled ? 'bg-red-50/90 border-red-200' : 'bg-green-50/90 border-green-200'}`}>
                <div className="text-sm font-bold text-slate-500 mb-1">状态 (Status)</div>
                <div className={`text-2xl font-bold ${isBuckled ? 'text-red-600' : 'text-green-600'}`}>
                    {isBuckled ? '失稳 (BUCKLED)' : '稳定 (STABLE)'}
                </div>
                <div className="mt-2 text-sm">
                    <div>P_cr = <span className="font-mono font-bold">{pCr.toFixed(1)} kN</span></div>
                    <div>安全系数 n = <span className="font-mono font-bold">{safetyFactor.toFixed(2)}</span></div>
                </div>
            </div>
         </div>
      </div>

      <div className="w-full lg:w-80 bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-y-auto flex flex-col">
         <h2 className="text-xl font-bold text-slate-800 mb-4">边界条件</h2>
         <div className="flex flex-col gap-2 mb-6">
            {(Object.keys(BOUNDARIES) as BoundaryType[]).map((key) => (
                <button
                    key={key}
                    onClick={() => setBc(key)}
                    className={`text-left px-4 py-3 rounded-lg border transition-all ${
                        bc === key 
                        ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' 
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    <div className={`font-bold text-sm ${bc===key?'text-blue-700':'text-slate-700'}`}>{BOUNDARIES[key].label}</div>
                    <div className="text-xs text-slate-500 mt-1">K = {BOUNDARIES[key].k} | {BOUNDARIES[key].description}</div>
                </button>
            ))}
         </div>

         <h2 className="text-xl font-bold text-slate-800 mb-4">参数设置</h2>
         <Slider label="载荷 (P)" value={load} min={10} max={500} unit="kN" onChange={setLoad} />
         <Slider label="杆长 (L)" value={length} min={2} max={10} unit="m" onChange={setLength} />
         <Slider label="抗弯刚度 (EI)" value={ei} min={500} max={5000} step={100} unit="kNm²" onChange={setEi} />

         <div className="mt-6 p-4 bg-slate-50 rounded border border-slate-200 shadow-inner">
            <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">理论公式 (Formulas)</h4>
            <div className="text-sm text-slate-700 space-y-3 font-serif bg-white p-3 rounded border border-slate-100">
                <div className="flex items-center justify-center text-lg text-slate-800">
                  <span className="italic font-bold mr-2 font-serif">P<sub>cr</sub></span>
                  <span className="mr-2">=</span>
                  <div className="flex flex-col items-center mx-1">
                    <div className="border-b border-slate-800 px-2 pb-0.5 leading-none font-serif">π<sup>2</sup> EI</div>
                    <div className="pt-0.5 leading-none font-serif">(KL)<sup>2</sup></div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-3 leading-relaxed font-sans border-t border-slate-100 pt-2">
                   <strong>欧拉临界力 (Euler's Critical Load):</strong> 
                   当轴向压力达到此值时，细长压杆保持直线平衡状态的稳定性丧失。
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};