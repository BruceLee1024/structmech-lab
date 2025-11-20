import React, { useState, useEffect, useRef } from 'react';
import { Slider } from './Slider';
import { Play, Pause, RotateCcw } from 'lucide-react';

export const VibrationModule: React.FC = () => {
  const [mass, setMass] = useState(5);    // kg
  const [k, setK] = useState(50);         // N/m
  const [c, setC] = useState(1);          // Ns/m (Damping)
  const [fMag, setFMag] = useState(0);    // Forcing Magnitude
  const [fFreq, setFFreq] = useState(1);  // Forcing Frequency (rad/s)
  
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Simulation State
  const timeRef = useRef(0);
  const posRef = useRef(100); 
  const velRef = useRef(0);
  const requestRef = useRef<number>();
  const [displayPos, setDisplayPos] = useState(100);
  const [forceVal, setForceVal] = useState(0);

  // Physics Loop
  const dt = 0.016;

  const stepPhysics = () => {
    const t = timeRef.current;
    
    // External Force: F(t) = F0 * sin(w*t)
    const F_ext = fMag * 10 * Math.sin(fFreq * t); // Scale magnitude for viz
    setForceVal(F_ext);

    // F = ma => a = (F_ext - kx - cv) / m
    const force = F_ext - k * posRef.current - c * velRef.current;
    const accel = force / mass;
    
    velRef.current += accel * dt;
    posRef.current += velRef.current * dt;
    timeRef.current += dt;

    setDisplayPos(posRef.current);
    requestRef.current = requestAnimationFrame(stepPhysics);
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(stepPhysics);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, k, c, mass, fMag, fFreq]);

  const reset = () => {
    setIsPlaying(false);
    posRef.current = 100;
    velRef.current = 0;
    timeRef.current = 0;
    setDisplayPos(100);
    setForceVal(0);
  };

  // Viz Constants
  const CENTER_X = 250;
  const CEILING_Y = 50;
  const EQUILIBRIUM_Y = 250;
  const BOX_SIZE = 60;
  const currentY = EQUILIBRIUM_Y + displayPos; 

  // Calculation details
  const wn = Math.sqrt(k/mass); // Natural freq
  const zeta = c / (2 * Math.sqrt(k*mass)); 
  const freqRatio = fFreq / wn;
  
  // Theoretical Amplitude (Steady State)
  const dafPoints = [];
  for(let r=0; r<=3; r+=0.05) {
    const val = 1 / Math.sqrt( Math.pow(1-r*r, 2) + Math.pow(2*zeta*r, 2) );
    dafPoints.push({x: r, y: val});
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col items-center justify-center relative">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 w-full text-left px-4">单自由度振动与共振 (Vibration & Resonance)</h3>
        
        <div className="flex w-full gap-4">
          {/* Physics View */}
          <svg width="50%" height="400" viewBox="0 0 400 400" className="bg-slate-50 border border-slate-100 rounded-lg flex-1">
              <defs>
                <pattern id="diag-lines" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="10" stroke="#cbd5e1" strokeWidth="2" />
                </pattern>
              </defs>
              
              {/* Ceiling */}
              <rect x="150" y="30" width="200" height="20" fill="url(#diag-lines)" stroke="#94a3b8"/>
              <line x1="150" y1="50" x2="350" y2="50" stroke="#475569" strokeWidth="3"/>

              {/* Spring (Simplified Line) */}
              <line x1={CENTER_X-20} y1={50} x2={CENTER_X-20} y2={currentY-30} stroke="#334155" strokeWidth="3" strokeDasharray="4,2"/>
              
              {/* Damper */}
              <rect x={CENTER_X+10} y={50} width="20" height={currentY-80} fill="none" stroke="#64748b" />
              <line x1={CENTER_X+20} y1={currentY-80} x2={CENTER_X+20} y2={currentY-30} stroke="#64748b" strokeWidth="2" />

              {/* Mass Block */}
              <g transform={`translate(${CENTER_X}, ${currentY})`}>
                  <rect x={-30} y={-30} width={60} height={60} rx="4" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
                  <text x="0" y="5" textAnchor="middle" fill="white" className="font-bold">m</text>
                  {/* External Force Arrow */}
                  {fMag > 0 && (
                    <g transform={`translate(40, 0)`}>
                      <line x1="0" y1="0" x2="0" y2={forceVal} stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrow)"/></g>
                  )}
              </g>
              
              <line x1="100" y1={EQUILIBRIUM_Y} x2="400" y2={EQUILIBRIUM_Y} stroke="#cbd5e1" strokeDasharray="5,5"/>
          </svg>

          {/* Resonance Graph */}
          <div className="flex-1 h-[400px] bg-slate-50 border border-slate-100 rounded-lg p-4 relative">
             <div className="text-xs font-bold text-slate-500 mb-2 text-center">频率响应曲线 (Frequency Response)</div>
             <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="none">
                {/* Grid */}
                <line x1="0" y1="180" x2="200" y2="180" stroke="#94a3b8" strokeWidth="1"/>
                <line x1="20" y1="0" x2="20" y2="200" stroke="#94a3b8" strokeWidth="1"/>
                
                {/* Curve */}
                <polyline 
                  points={dafPoints.map(p => `${20 + p.x * 50},${180 - Math.min(p.y, 5)*30}`).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />

                {/* Current Operating Point */}
                <circle 
                  cx={20 + freqRatio * 50} 
                  cy={180 - Math.min((1 / Math.sqrt( Math.pow(1-freqRatio**2, 2) + Math.pow(2*zeta*freqRatio, 2) )), 5)*30} 
                  r="6" 
                  fill="#ef4444"
                />
             </svg>
          </div>
        </div>
        
        <div className="flex gap-4 mt-4">
           <button 
             onClick={() => setIsPlaying(!isPlaying)}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${isPlaying ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
           >
             {isPlaying ? <><Pause size={18}/> 暂停</> : <><Play size={18}/> 开始</>}
           </button>
           <button 
             onClick={reset}
             className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-semibold transition-colors"
           >
             <RotateCcw size={18}/> 重置
           </button>
        </div>
      </div>

      <div className="w-full lg:w-80 bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-y-auto flex flex-col">
        <h2 className="text-xl font-bold text-slate-800 mb-4">系统参数</h2>
        <Slider label="质量 (m)" value={mass} min={1} max={20} unit="kg" onChange={setMass} />
        <Slider label="刚度 (k)" value={k} min={10} max={200} unit="N/m" onChange={setK} />
        <Slider label="阻尼 (c)" value={c} min={0} max={10} step={0.1} unit="Ns/m" onChange={setC} />

        <hr className="my-4 border-slate-100"/>
        <Slider label="激励频率 (ω)" value={fFreq} min={0.1} max={10} step={0.1} unit="rad/s" onChange={setFFreq} />

        <div className="mt-6 p-4 bg-slate-50 rounded border border-slate-200 shadow-inner">
           <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">理论公式 (Formulas)</h4>
           <div className="text-sm text-slate-700 space-y-4 font-serif bg-white p-3 rounded border border-slate-100">
              <div>
                 <div className="mb-1 font-sans text-xs text-slate-500">运动微分方程:</div>
                 <div className="font-serif text-center italic">mẍ + cẋ + kx = F(t)</div>
              </div>
              <div className="flex items-center justify-center gap-2">
                 <span className="font-serif italic">ω<sub>n</sub></span>
                 <span>=</span>
                 <span className="font-serif">√(k / m)</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                 <span className="font-serif italic">ζ</span>
                 <span>=</span>
                 <div className="flex flex-col items-center"><div className="border-b border-slate-800 leading-none pb-0.5 font-serif italic">c</div><div className="leading-none pt-0.5 font-serif">2√(mk)</div></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};