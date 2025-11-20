import React, { useState } from 'react';
import { Slider } from './Slider';
import { Point } from '../types';

export const FrameModule: React.FC = () => {
  const [latLoad, setLatLoad] = useState(50); // kN Horizontal
  const [vertLoad, setVertLoad] = useState(50); // kN Vertical
  const [height, setHeight] = useState(6); // m
  const [span, setSpan] = useState(8); // m

  // Geometry
  const SVG_W = 600;
  const SVG_H = 500;
  const ORIGIN_X = 100;
  const ORIGIN_Y = 400;
  const SCALE = 40; // px per meter

  // Analysis (Simplified Stiffness / Moment Distribution Logic)
  // 1. Gravity Load P (Center of CD)
  const M_grav_node = (vertLoad * span / 8) * 0.7; // Approximation
  const M_grav_mid = (vertLoad * span / 4) - M_grav_node; // Sagging in middle

  // 2. Lateral Load H (At C)
  const M_sway_base = (latLoad / 2) * (height / 2);

  const getColAC_BMD = () => {
    const pts = [];
    for(let i=0; i<=10; i++) {
      const y = (i/10)*height;
      const m_sway = M_sway_base * (1 - 2*(y/height)); 
      pts.push({ x: -m_sway, y: y }); 
    }
    return pts;
  };

  const getBeamCD_BMD = () => {
    const pts = [];
    for(let i=0; i<=20; i++) {
      const x = (i/20)*span;
      const m_sway = -M_sway_base * (1 - 2*(x/span)); 
      let m_grav = 0;
      if (x < span/2) m_grav = (vertLoad/2)*x - M_grav_node;
      else m_grav = (vertLoad/2)*(span-x) - M_grav_node;
      pts.push({ x: x, y: m_sway + m_grav });
    }
    return pts;
  };

  const getColBD_BMD = () => {
    const pts = [];
    for(let i=0; i<=10; i++) {
      const y = (i/10)*height;
      const m_sway = M_sway_base * (1 - 2*(y/height));
      pts.push({ x: -m_sway, y: y }); 
    }
    return pts;
  };

  // Helper to gen path
  const makePath = (pts: Point[], offsetX: number, offsetY: number, isVertical: boolean) => {
     const SCALE_M = 0.5; // Scale for moment viz
     let d = `M ${offsetX + pts[0].x * (isVertical?1:SCALE)}, ${offsetY - pts[0].y * (isVertical?SCALE:1)} `;
     pts.forEach(p => {
       if (isVertical) {
         d += `L ${offsetX + p.x * SCALE_M}, ${offsetY - p.y * SCALE} `;
       } else {
         d += `L ${offsetX + p.x * SCALE}, ${offsetY - height*SCALE - p.y * SCALE_M} `;
       }
     });
     if (isVertical) {
        d += `L ${offsetX},${offsetY - height*SCALE} L ${offsetX},${offsetY} Z`;
     } else {
        d += `L ${offsetX + span*SCALE},${offsetY - height*SCALE} L ${offsetX},${offsetY - height*SCALE} Z`;
     }
     return d;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col items-center justify-center">
         <h3 className="text-lg font-semibold text-slate-800 mb-4 w-full text-left px-4">门式刚架分析 (Portal Frame Analysis)</h3>
         
         <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="bg-slate-50 border border-slate-100 rounded">
            <defs>
              <marker id="arrow-force" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
              </marker>
              <pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                 <line x1="0" y1="0" x2="0" y2="4" stroke="#cbd5e1" strokeWidth="1"/>
              </pattern>
            </defs>

            {/* Supports */}
            <rect x={ORIGIN_X - 10} y={ORIGIN_Y} width="20" height="10" fill="url(#hatch)" stroke="#94a3b8"/>
            <rect x={ORIGIN_X + span*SCALE - 10} y={ORIGIN_Y} width="20" height="10" fill="url(#hatch)" stroke="#94a3b8"/>

            {/* Moment Diagrams (Behind Frame) */}
            <path d={makePath(getColAC_BMD(), ORIGIN_X, ORIGIN_Y, true)} fill="rgba(239,68,68,0.15)" stroke="none" />
            <path d={makePath(getBeamCD_BMD(), ORIGIN_X, ORIGIN_Y, false)} fill="rgba(239,68,68,0.15)" stroke="none" />
            <path d={makePath(getColBD_BMD(), ORIGIN_X + span*SCALE, ORIGIN_Y, true)} fill="rgba(239,68,68,0.15)" stroke="none" />

            {/* The Frame Structure */}
            <g stroke="#334155" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round">
               <path d={`M ${ORIGIN_X},${ORIGIN_Y} L ${ORIGIN_X},${ORIGIN_Y - height*SCALE} L ${ORIGIN_X + span*SCALE},${ORIGIN_Y - height*SCALE} L ${ORIGIN_X + span*SCALE},${ORIGIN_Y}`} />
            </g>
            
            {/* Nodes */}
            <circle cx={ORIGIN_X} cy={ORIGIN_Y - height*SCALE} r="6" fill="#fff" stroke="#334155" strokeWidth="2"/>
            <circle cx={ORIGIN_X + span*SCALE} cy={ORIGIN_Y - height*SCALE} r="6" fill="#fff" stroke="#334155" strokeWidth="2"/>

            {/* Loads */}
            {latLoad > 0 && (
              <g>
                <line 
                  x1={ORIGIN_X - 60} y1={ORIGIN_Y - height*SCALE} 
                  x2={ORIGIN_X - 10} y2={ORIGIN_Y - height*SCALE} 
                  stroke="#ef4444" strokeWidth="4" markerEnd="url(#arrow-force)" 
                />
                <text x={ORIGIN_X - 50} y={ORIGIN_Y - height*SCALE - 10} className="text-xs font-bold fill-red-600">H={latLoad}</text>
              </g>
            )}

            {vertLoad > 0 && (
              <g>
                 <line 
                  x1={ORIGIN_X + span*SCALE/2} y1={ORIGIN_Y - height*SCALE - 60} 
                  x2={ORIGIN_X + span*SCALE/2} y2={ORIGIN_Y - height*SCALE - 10} 
                  stroke="#ef4444" strokeWidth="4" markerEnd="url(#arrow-force)" 
                />
                <text x={ORIGIN_X + span*SCALE/2 + 10} y={ORIGIN_Y - height*SCALE - 40} className="text-xs font-bold fill-red-600">P={vertLoad}</text>
              </g>
            )}

            <text x={ORIGIN_X + 20} y={ORIGIN_Y + 40} className="text-xs fill-slate-500">
              红色区域表示弯矩图 (Red area = Bending Moment Diagram)
            </text>

         </svg>
      </div>

      <div className="w-full lg:w-80 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
        <h2 className="text-xl font-bold text-slate-800 mb-6">刚架载荷</h2>
        <Slider label="侧向力 (Wind H)" value={latLoad} min={0} max={100} unit="kN" onChange={setLatLoad} />
        <Slider label="竖向力 (Gravity P)" value={vertLoad} min={0} max={100} unit="kN" onChange={setVertLoad} />
        <Slider label="层高 (Height)" value={height} min={3} max={8} unit="m" onChange={setHeight} />
        <Slider label="跨度 (Span)" value={span} min={4} max={10} unit="m" onChange={setSpan} />

        <div className="mt-6 p-4 bg-slate-50 rounded border border-slate-200 shadow-inner">
           <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">理论公式 (Formulas)</h4>
           <div className="text-sm text-slate-700 space-y-4 font-serif bg-white p-3 rounded border border-slate-100">
             <p className="text-xs text-slate-500 font-sans">侧向载荷 (Sway):</p>
             <div className="flex items-center gap-2">
                 <span className="font-serif">M<sub>base</sub> ≈</span>
                 <div className="flex flex-col items-center"><div className="border-b border-slate-800 leading-none pb-0.5">H · h</div><div className="leading-none pt-0.5">4</div></div>
             </div>
             <div className="h-1 border-t border-slate-50"></div>
             <p className="text-xs text-slate-500 font-sans">竖向载荷 (Gravity):</p>
             <div className="flex items-center gap-2">
                 <span className="font-serif">M<sub>fix</sub> =</span>
                 <div className="flex flex-col items-center"><div className="border-b border-slate-800 leading-none pb-0.5">P · L</div><div className="leading-none pt-0.5">8</div></div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};