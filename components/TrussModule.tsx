import React, { useState, useMemo } from 'react';
import { Slider } from './Slider';
import { TrussNode, TrussMember } from '../types';

export const TrussModule: React.FC = () => {
  const [loadX, setLoadX] = useState(50); // 0-100% of span
  const [loadMag, setLoadMag] = useState(100); // kN
  
  const SPAN = 12; // m
  const HEIGHT = 4; // m
  
  const nodes: TrussNode[] = [
    { id: 0, x: 0, y: 0, isFixed: true },
    { id: 1, x: SPAN/2, y: 0 },
    { id: 2, x: SPAN, y: 0, isRoller: true },
    { id: 3, x: SPAN/4, y: HEIGHT },
    { id: 4, x: SPAN*0.75, y: HEIGHT },
  ];

  // Load Position
  const px = (loadX / 100) * SPAN; // Real x position of load

  // 1. Calculate Reactions
  const r2 = (loadMag * px) / SPAN;
  const r0 = loadMag - r2;

  // 2. Solve Member Forces (Method of Joints / Sections Hardcoded for this Geometry)
  const dx = SPAN/4; 
  const dy = HEIGHT;
  const hyp = Math.sqrt(dx*dx + dy*dy);
  const sin = dy/hyp;
  const cos = dx/hyp;

  const calcForces = () => {
     let p0 = 0, p1 = 0, p2 = 0;
     if (px <= SPAN/2) {
        const d = px; 
        const ratio = d / (SPAN/2); // 0 to 1
        p1 = loadMag * ratio;
        p0 = loadMag * (1 - ratio);
     } else {
        const d = px - SPAN/2;
        const ratio = d / (SPAN/2);
        p2 = loadMag * ratio;
        p1 = loadMag * (1 - ratio);
     }
     
     // Joint 0:
     const f03 = (p0 - r0) / sin;
     const f01 = -f03 * cos;

     // Joint 2:
     const f42 = (p2 - r2) / sin;
     const f12 = -f42 * cos;

     // Joint 3:
     const f31 = -f03; 
     const f34 = (f03 - f31) * cos;

     // Joint 4:
     const f14 = -f42;
     
     return [
        { id: 0, nodeA: 0, nodeB: 1, force: f01 }, // Bot Left
        { id: 1, nodeA: 1, nodeB: 2, force: f12 }, // Bot Right
        { id: 2, nodeA: 3, nodeB: 4, force: f34 }, // Top
        { id: 3, nodeA: 0, nodeB: 3, force: f03 }, // D1
        { id: 4, nodeA: 3, nodeB: 1, force: f31 }, // D2
        { id: 5, nodeA: 1, nodeB: 4, force: f14 }, // D3
        { id: 6, nodeA: 4, nodeB: 2, force: f42 }, // D4
     ];
  };

  const members = calcForces();

  // Visual Scaling
  const SVG_W = 700;
  const SVG_H = 350;
  const SCALE = 50;
  const OFF_X = 50;
  const OFF_Y = 300;

  const toSvg = (n: TrussNode) => ({ x: OFF_X + n.x * SCALE, y: OFF_Y - n.y * SCALE });

  const getColor = (f: number) => {
    if (Math.abs(f) < 1) return '#94a3b8'; // Zero member
    return f > 0 ? '#ef4444' : '#3b82f6'; // Red Tens, Blue Comp
  };

  const getWidth = (f: number) => Math.min(Math.max(Math.abs(f)/15, 2), 8);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col items-center justify-center">
         <h3 className="text-lg font-semibold text-slate-800 mb-4 w-full text-left px-4">沃伦桁架与移动载荷 (Moving Load on Warren Truss)</h3>
         
         <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="bg-slate-50 rounded border border-slate-100">
            <defs>
                <marker id="load-arrow" markerWidth="12" markerHeight="8" refX="6" refY="8" orient="auto">
                    <path d="M 6 8 L 0 0 L 12 0 Z" fill="#1e293b" />
                </marker>
            </defs>
            
            {/* Members */}
            {members.map((m, i) => {
                const p1 = toSvg(nodes[m.nodeA]);
                const p2 = toSvg(nodes[m.nodeB]);
                return (
                    <g key={i}>
                        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={getColor(m.force)} strokeWidth={getWidth(m.force)} strokeLinecap="round" />
                        {/* Label if force is large enough */}
                        {Math.abs(m.force) > 10 && (
                            <text x={(p1.x+p2.x)/2} y={(p1.y+p2.y)/2} className="text-[10px] fill-slate-600 font-bold" textAnchor="middle" dy="-5">
                                {Math.abs(m.force).toFixed(0)}
                            </text>
                        )}
                    </g>
                )
            })}

            {/* Nodes */}
            {nodes.map(n => (
                <circle key={n.id} cx={toSvg(n).x} cy={toSvg(n).y} r="5" fill="white" stroke="#334155" strokeWidth="2" />
            ))}

            {/* Supports */}
            <path d={`M ${toSvg(nodes[0]).x-10},${toSvg(nodes[0]).y+5} l 10,-10 l 10,10 z`} fill="#94a3b8"/>
            <circle cx={toSvg(nodes[2]).x} cy={toSvg(nodes[2]).y+5} r="5" fill="#94a3b8"/>
            
            {/* Moving Load (Vehicle) */}
            <g transform={`translate(${OFF_X + px * SCALE}, ${OFF_Y})`}>
               <path d="M -15,-5 L 15,-5 L 15,-25 L -5,-25 L -15,-15 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="2"/>
               <circle cx="-10" cy="-5" r="4" fill="#333"/>
               <circle cx="10" cy="-5" r="4" fill="#333"/>
               <line x1="0" y1="-5" x2="0" y2="0" stroke="#ef4444" strokeWidth="2" />
               <text x="0" y="-35" textAnchor="middle" className="text-xs font-bold fill-amber-700">Load</text>
            </g>

         </svg>

         <div className="flex gap-4 mt-6 text-sm">
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>受拉 (Tension)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>受压 (Compression)</span>
            </div>
         </div>
      </div>

      <div className="w-full lg:w-80 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
         <h2 className="text-xl font-bold text-slate-800 mb-6">载荷控制</h2>
         <Slider label="载荷位置 (x)" value={loadX} min={0} max={100} unit="%" onChange={setLoadX} />
         <Slider label="载荷重量 (P)" value={loadMag} min={50} max={500} unit="kN" onChange={setLoadMag} />

         <div className="mt-6 p-4 bg-slate-50 rounded border border-slate-100 space-y-3">
            <h4 className="font-bold text-slate-700">支座反力 (Reactions)</h4>
            <div className="flex justify-between">
                <span>Ra (Left):</span>
                <span className="font-mono font-bold">{r0.toFixed(1)} kN</span>
            </div>
            <div className="flex justify-between">
                <span>Rb (Right):</span>
                <span className="font-mono font-bold">{r2.toFixed(1)} kN</span>
            </div>
         </div>

         <div className="mt-6 p-4 bg-slate-50 rounded border border-slate-200 shadow-inner">
            <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">理论公式 (Formulas)</h4>
            <div className="text-sm text-slate-700 space-y-4 bg-white p-3 rounded border border-slate-100">
                <div className="flex justify-between items-center">
                  <span>节点平衡:</span> 
                  <span className="font-serif">ΣF<sub>x</sub>=0, ΣF<sub>y</sub>=0</span>
                </div>
                <div className="flex items-center gap-2">
                   <span className="font-serif">R<sub>A</sub> =</span>
                   <div className="flex flex-col items-center"><div className="border-b border-slate-800 leading-none pb-0.5">P(L-x)</div><div className="leading-none pt-0.5">L</div></div>
                </div>
                <div className="flex items-center gap-2">
                   <span className="font-serif">R<sub>B</sub> =</span>
                   <div className="flex flex-col items-center"><div className="border-b border-slate-800 leading-none pb-0.5">Px</div><div className="leading-none pt-0.5">L</div></div>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};