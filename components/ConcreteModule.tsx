import React, { useState } from 'react';
import { Slider } from './Slider';

export const ConcreteModule: React.FC = () => {
  // Material Properties
  const [fc, setFc] = useState(30); // MPa (Concrete Strength)
  const [fy, setFy] = useState(400); // MPa (Steel Yield Strength)
  
  // Section Geometry (mm)
  const [b, setB] = useState(250);
  const [h, setH] = useState(500);
  const as = 40; // concrete cover
  const h0 = h - as; // Effective depth (d)

  // Reinforcement Area (mm^2)
  const [As, setAs] = useState(1000); 

  // Constants
  const Es = 200000; // MPa (Steel Modulus)
  const alpha1 = 1.0; // Simplified block factor
  const beta1 = 0.8; 
  const eps_cu = 0.0033; // Ultimate concrete strain
  const eps_y = fy / Es; // Yield strain of steel

  // 1. Calculate Balanced Reinforcement Ratio (Rho_b) & Area (As_b)
  const xi_b = eps_cu / (eps_cu + eps_y);
  const As_bal = (alpha1 * fc * b * (xi_b * h0)) / fy;
  
  // Minimum Reinforcement (Simplified 0.2%)
  const As_min = 0.002 * b * h;

  // 2. Actual Analysis
  let x = (fy * As) / (alpha1 * fc * b);
  let xi = x / h0; // Relative neutral axis depth
  
  // Check failure mode
  let mode: 'under' | 'balanced' | 'over' | 'min' = 'under';
  let eps_s = 0; // Actual steel strain
  let sigma_s = 0; // Actual steel stress

  if (As < As_min) {
    mode = 'min';
    eps_s = eps_cu * (h0 - x) / x;
    sigma_s = Math.min(eps_s * Es, fy);
  } else if (As <= As_bal) {
    // Under-reinforced
    mode = As > As_bal * 0.95 ? 'balanced' : 'under'; 
    eps_s = eps_cu * (h0 - x) / x; 
    sigma_s = fy;
  } else {
    // Over-reinforced
    mode = 'over';
    // Solve quadratic for x
    const A_quad = alpha1 * fc * b;
    const B_quad = Es * eps_cu * As;
    const C_quad = -Es * eps_cu * As * h0;
    x = (-B_quad + Math.sqrt(B_quad*B_quad - 4*A_quad*C_quad)) / (2*A_quad);
    xi = x / h0;
    eps_s = eps_cu * (h0 - x) / x; 
    sigma_s = eps_s * Es;
  }

  // Mn calculation (Nominal Moment)
  const Mn = alpha1 * fc * b * x * (h0 - x/2) / 1000000; // kNm

  // Visual Config
  const SVG_W = 600;
  const SVG_H = 650; // Increased height to fit both views
  
  // Layout Constants
  const LONG_Y_BASE = 60;
  const SECTION_Y_BASE = 320;
  const SECTION_SCALE = 0.55; // Slightly smaller to fit
  const SECTION_X = 50;
  
  const DIAGRAM_X = SECTION_X + b*SECTION_SCALE + 60;

  const colorMap = {
    'under': '#10b981', // Green
    'balanced': '#f59e0b', // Orange
    'over': '#ef4444', // Red
    'min': '#64748b' // Slate
  };

  const labelMap = {
    'under': '适筋破坏 (Ductile)',
    'balanced': '界限破坏 (Balanced)',
    'over': '超筋破坏 (Brittle)',
    'min': '少筋破坏 (Minimum)'
  };

  const descMap = {
    'under': '钢筋先屈服。特征：挠度大，裂缝宽且高，有明显预兆。',
    'balanced': '钢筋屈服同时混凝土压碎。',
    'over': '钢筋不屈服，混凝土先压碎。特征：挠度小，裂缝短而细，脆性破坏，无预兆。',
    'min': '一裂即坏，类似素混凝土梁。'
  };

  // --- Longitudinal Visualization Helpers ---
  const renderLongitudinalView = () => {
    const L_beam = 500;
    const H_beam = 80; // visual height relative to L
    const Y_base = LONG_Y_BASE;
    const X_start = 50;
    const X_end = X_start + L_beam;

    // Deflection amount based on mode
    let deflection = 0;
    if (mode === 'under') deflection = 60;
    else if (mode === 'balanced') deflection = 40;
    else if (mode === 'over') deflection = 15; // Stiff, brittle
    else deflection = 5; // Min

    const midX = X_start + L_beam / 2;
    const midY_top = Y_base + deflection; 
    const midY_bot = Y_base + H_beam + deflection;

    // Beam Path (Simple bending shape)
    const beamPath = `
      M ${X_start},${Y_base} 
      Q ${midX},${Y_base + deflection * 2} ${X_end},${Y_base}
      L ${X_end},${Y_base + H_beam}
      Q ${midX},${Y_base + H_beam + deflection * 2} ${X_start},${Y_base + H_beam}
      Z
    `;

    // Rebar Path (dashed line near bottom)
    const rebarOffset = H_beam * 0.8;
    const rebarPath = `
      M ${X_start + 10},${Y_base + rebarOffset}
      Q ${midX},${Y_base + rebarOffset + deflection * 2} ${X_end - 10},${Y_base + rebarOffset}
    `;

    // Cracks
    const cracks = [];
    const numCracks = mode === 'under' ? 12 : (mode === 'balanced' ? 8 : 5);
    const crackHeightScale = mode === 'under' ? 0.7 : (mode === 'balanced' ? 0.5 : 0.3); 
    
    for(let i=1; i<numCracks; i++) {
        const relPos = i / numCracks; 
        const xPos = X_start + (0.1 + 0.8 * relPos) * L_beam;
        
        // Calculate local Y on bottom curve (parabolic approx)
        const t = (0.1 + 0.8 * relPos); 
        const localDefl = deflection * 2 * (4 * (t - 0.5) * -(t - 0.5) + 1); 
        const startY = Y_base + H_beam + localDefl * 0.9; 
        
        const hCrack = H_beam * crackHeightScale * (0.8 + Math.random()*0.4); 
        const crackPath = `M ${xPos},${startY} l -2,-5 l 4,-5 l -2,-${hCrack}`;
        
        cracks.push(
            <path key={i} d={crackPath} fill="none" stroke="#475569" strokeWidth={mode === 'under' ? 2 : 1} opacity="0.7" />
        );
    }

    // Crushing Zone
    const crushingOpacity = mode === 'over' ? 0.9 : (mode === 'balanced' ? 0.6 : 0.2);
    const crushingWidth = mode === 'over' ? 120 : 60;
    const crushingPath = `
        M ${midX - crushingWidth/2},${Y_base + deflection*2} 
        Q ${midX},${Y_base + deflection*2 + 10} ${midX + crushingWidth/2},${Y_base + deflection*2}
        L ${midX + crushingWidth/2 - 10},${Y_base + deflection*2 + 15}
        Q ${midX},${Y_base + deflection*2 + 25} ${midX - crushingWidth/2 + 10},${Y_base + deflection*2 + 15}
        Z
    `;

    return (
        <g>
            <text x="15" y="20" className="text-sm font-bold fill-slate-400">LONGITUDINAL VIEW</text>
            
            {/* Supports */}
            <path d={`M ${X_start},${Y_base+H_beam+10} l -10,15 h 20 z`} fill="#94a3b8" />
            <circle cx={X_end} cy={Y_base+H_beam+15} r="8" fill="#94a3b8" />
            <rect x={X_start-20} y={Y_base+H_beam+25} width={L_beam+40} height={4} fill="#e2e8f0"/>

            {/* Beam Body */}
            <path d={beamPath} fill="url(#concrete-long)" stroke="#64748b" strokeWidth="2" />
            
            {/* Crushing Zone */}
            <path d={crushingPath} fill="#ef4444" fillOpacity={crushingOpacity} stroke="none" />
            
            {/* Rebar */}
            <path d={rebarPath} fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="8,4" />

            {/* Cracks */}
            {cracks}

            {/* Labels */}
            <line x1={midX} y1={Y_base + H_beam + deflection*2} x2={midX} y2={Y_base + H_beam + 40} stroke="#3b82f6" markerEnd="url(#arrow-strain)"/>
            <text x={midX} y={Y_base + H_beam + 55} textAnchor="middle" className="text-xs fill-blue-600 font-bold">
                f = {deflection.toFixed(0)} (Relative)
            </text>

            {/* Connection Line to Section View */}
            <line x1={midX} y1={Y_base + H_beam + 60} x2={SECTION_X + b*SECTION_SCALE/2} y2={SECTION_Y_BASE} stroke="#cbd5e1" strokeDasharray="4,4" />
        </g>
    );
  };

  // --- Section Visualization Helpers ---
  const renderSectionView = () => {
      const Y = SECTION_Y_BASE;
      return (
          <>
            <text x="15" y={Y - 20} className="text-sm font-bold fill-slate-400">SECTION ANALYSIS</text>

            <g transform={`translate(${SECTION_X}, ${Y})`}>
                <rect x="0" y="0" width={b*SECTION_SCALE} height={h*SECTION_SCALE} fill="url(#concrete-pat)" stroke="#94a3b8" strokeWidth="2"/>
                <circle cx={b*SECTION_SCALE/2} cy={h0*SECTION_SCALE} r={Math.sqrt(As)/4} fill="#ef4444" stroke="#b91c1c" strokeWidth="2"/>
                <text x={b*SECTION_SCALE/2 + 10} y={h0*SECTION_SCALE + 5} className="text-xs fill-red-600 font-bold">As</text>
                
                {/* Dimension Labels */}
                <line x1="-10" y1="0" x2="-10" y2={h*SECTION_SCALE} stroke="#cbd5e1" markerStart="url(#arrow-strain)" markerEnd="url(#arrow-strain)"/>
                <text x="-25" y={h*SECTION_SCALE/2} className="text-xs fill-slate-500 text-right">h</text>
                <line x1="0" y1={h*SECTION_SCALE+10} x2={b*SECTION_SCALE} y2={h*SECTION_SCALE+10} stroke="#cbd5e1" markerStart="url(#arrow-strain)" markerEnd="url(#arrow-strain)"/>
                <text x={b*SECTION_SCALE/2} y={h*SECTION_SCALE+25} className="text-xs fill-slate-500 text-center">b</text>
             </g>

             {/* Strain Diagram */}
             <g transform={`translate(${DIAGRAM_X + 20}, ${Y})`}>
                <text x="0" y="-5" textAnchor="middle" className="font-bold text-xs fill-slate-500">Strain (ε)</text>
                <line x1="0" y1="0" x2="0" y2={h*SECTION_SCALE} stroke="#cbd5e1" strokeDasharray="4,4"/>
                <line x1={-100} y1={x*SECTION_SCALE} x2={280} y2={x*SECTION_SCALE} stroke="#3b82f6" strokeDasharray="4,4" opacity="0.4"/>
                <text x="-10" y={x*SECTION_SCALE - 5} className="text-[10px] fill-blue-500 font-bold" textAnchor="end">N.A.</text>
                
                {/* Diagram Lines */}
                <path d={`M -60,0 L 0,${x*SECTION_SCALE} L ${Math.min(eps_s * 20000, 120)},${h0*SECTION_SCALE}`} fill="none" stroke={colorMap[mode]} strokeWidth="3"/>
                <line x1="0" y1="0" x2="-60" y2="0" stroke={colorMap[mode]} strokeWidth="1"/>
                <text x="-65" y="4" className="text-xs fill-slate-600" textAnchor="end">ε_cu</text>
                <line x1="0" y1={h0*SECTION_SCALE} x2={Math.min(eps_s * 20000, 120)} y2={h0*SECTION_SCALE} stroke={colorMap[mode]} strokeWidth="1"/>
                <text x={Math.min(eps_s * 20000, 120) + 5} y={h0*SECTION_SCALE+4} className="text-xs fill-slate-600">ε_s</text>
             </g>

             {/* Stress Diagram */}
             <g transform={`translate(${DIAGRAM_X + 200}, ${Y})`}>
                <text x="20" y="-5" textAnchor="middle" className="font-bold text-xs fill-slate-500">Stress (σ)</text>
                <line x1="0" y1="0" x2="0" y2={h*SECTION_SCALE} stroke="#cbd5e1" strokeDasharray="4,4"/>
                
                {/* Compression Block */}
                <rect x="-40" y="0" width="40" height={beta1 * x * SECTION_SCALE} fill="rgba(148, 163, 184, 0.3)" stroke="#64748b" />
                <line x1="-20" y1={(beta1 * x * SECTION_SCALE)/2 + 20} x2="-20" y2={(beta1 * x * SECTION_SCALE)/2 - 10} stroke="#3b82f6" strokeWidth="3" markerEnd="url(#arrow-strain)"/>
                <text x="-50" y={(beta1 * x * SECTION_SCALE)/2 + 4} className="text-xs fill-blue-600 font-bold">C</text>
                
                {/* Tension Arrow */}
                <line x1="20" y1={h0*SECTION_SCALE - 20} x2="20" y2={h0*SECTION_SCALE + 10} stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrow-strain)"/>
                <text x="30" y={h0*SECTION_SCALE+4} className="text-xs fill-red-600 font-bold">T</text>
             </g>
          </>
      )
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col relative">
        
        {/* Status Badge */}
        <div className="absolute top-4 left-4 z-10">
           <div className={`px-3 py-1.5 rounded shadow-sm border flex items-center gap-2 bg-white/90 backdrop-blur`} style={{borderColor: colorMap[mode]}}>
              <div className={`w-2.5 h-2.5 rounded-full`} style={{backgroundColor: colorMap[mode]}}></div>
              <span className="font-bold text-xs" style={{color: colorMap[mode]}}>{labelMap[mode]}</span>
           </div>
        </div>

        <div className="absolute top-4 right-4 z-10 bg-slate-50/90 p-2 rounded border border-slate-200 text-xs font-mono">
            <div>M_n = {Mn.toFixed(1)} kNm</div>
            <div>ξ = {xi.toFixed(3)}</div>
        </div>

        <div className="flex-1 flex items-center justify-center overflow-auto mt-8">
          <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="xMidYMid meet">
             <defs>
                <marker id="arrow-strain" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M 0 0 L 6 3 L 0 6 Z" fill="#64748b" />
                </marker>
                <pattern id="concrete-pat" width="10" height="10" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="#e2e8f0"/>
                    <path d="M 5,5 L 7,8" stroke="#e2e8f0" strokeWidth="1"/>
                </pattern>
                <pattern id="concrete-long" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="5" cy="5" r="1" fill="#cbd5e1"/>
                    <circle cx="15" cy="12" r="1" fill="#cbd5e1"/>
                 </pattern>
             </defs>
             
             {renderLongitudinalView()}
             
             {/* Separator Line */}
             <line x1="20" y1={SECTION_Y_BASE - 40} x2={SVG_W - 20} y2={SECTION_Y_BASE - 40} stroke="#f1f5f9" strokeWidth="2" />
             
             {renderSectionView()}
          </svg>
        </div>
        
        <div className="mt-2 p-3 bg-slate-50 rounded text-sm text-slate-600 border border-slate-100">
           <strong>{labelMap[mode]}：</strong> {descMap[mode]}
        </div>

      </div>

      <div className="w-full lg:w-80 bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-y-auto flex flex-col">
        <h2 className="text-xl font-bold text-slate-800 mb-4">破坏形态预设</h2>
        <div className="flex flex-col gap-2 mb-6">
            <button onClick={() => setAs(As_bal * 0.5)} className="px-3 py-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 text-left transition-colors">
                <strong>适筋 (Under-reinforced)</strong><br/><span className="text-xs opacity-80">As ≈ 0.5 As_b (延性好)</span>
            </button>
            <button onClick={() => setAs(As_bal)} className="px-3 py-2 text-sm bg-orange-50 text-orange-700 border border-orange-200 rounded hover:bg-orange-100 text-left transition-colors">
                <strong>界限 (Balanced)</strong><br/><span className="text-xs opacity-80">As = As_b (临界状态)</span>
            </button>
            <button onClick={() => setAs(As_bal * 1.5)} className="px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 text-left transition-colors">
                <strong>超筋 (Over-reinforced)</strong><br/><span className="text-xs opacity-80">As = 1.5 As_b (脆性危险)</span>
            </button>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-4">参数微调</h2>
        <Slider label="配筋面积 (As)" value={As} min={200} max={4000} step={50} unit="mm²" onChange={setAs} />
        <Slider label="混凝土强度 (fc)" value={fc} min={20} max={60} unit="MPa" onChange={setFc} />
        
        <div className="mt-2 text-xs text-slate-500 flex justify-between px-1">
           <span>Min: {As_min.toFixed(0)}</span>
           <span>Balanced: {As_bal.toFixed(0)}</span>
        </div>

        <div className="mt-6 p-4 bg-slate-50 rounded border border-slate-200 shadow-inner">
           <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">理论公式 (Formulas)</h4>
           <div className="text-sm text-slate-700 space-y-4 bg-white p-3 rounded border border-slate-100">
              <div className="flex items-center gap-2">
                 <span className="font-serif italic">ξ</span>
                 <span>=</span>
                 <div className="flex flex-col items-center"><div className="border-b border-slate-800 leading-none pb-0.5">x</div><div className="leading-none pt-0.5">h<sub>0</sub></div></div>
              </div>
              <div className="text-xs space-y-1 mt-2 pt-2 border-t border-slate-100">
                 <div className="flex justify-between"><span>ξ &le; ξ<sub>b</sub></span> <span className="text-green-600 font-bold">适筋 (延性)</span></div>
                 <div className="flex justify-between"><span>ξ &gt; ξ<sub>b</sub></span> <span className="text-red-600 font-bold">超筋 (脆性)</span></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};