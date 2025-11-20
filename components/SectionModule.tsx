import React, { useState } from 'react';
import { Slider } from './Slider';

type SectionType = 'rect' | 'i-beam';

export const SectionModule: React.FC = () => {
  const [sectionType, setSectionType] = useState<SectionType>('rect');
  const [moment, setMoment] = useState(50); // kNm
  
  // Dimensions (mm)
  const [height, setHeight] = useState(400); 
  const [width, setWidth] = useState(200);
  const [tf, setTf] = useState(20); // Flange thickness
  const [tw, setTw] = useState(10); // Web thickness

  // Calculations
  let I = 0;
  if (sectionType === 'rect') {
    I = (width * Math.pow(height, 3)) / 12;
  } else {
    const I_outer = (width * Math.pow(height, 3)) / 12;
    const I_inner = ((width - tw) * Math.pow(height - 2 * tf, 3)) / 12;
    I = I_outer - I_inner;
  }

  // Max Stress (at y = h/2)
  const yMax = height / 2;
  const M_Nmm = moment * 1000000;
  const sigmaMax = (M_Nmm * yMax) / I;

  // Viz
  const SVG_SIZE = 500;
  const CENTER = SVG_SIZE / 2;
  const SCALE = 0.8; // Visual scaling to fit box

  // Generate Path for I-Beam
  const generateIBeamPath = () => {
    const w = width * SCALE;
    const h = height * SCALE;
    const t_f = tf * SCALE;
    const t_w = tw * SCALE;
    
    const x = CENTER - w/2;
    const y = CENTER - h/2;
    
    // SVG Path commands: H = Horizontal line, V = Vertical line
    let d = `M ${x},${y}`; // Top Left
    d += ` H ${x+w}`; // Top Edge
    d += ` V ${y+t_f}`; // Top Flange Right Edge
    d += ` H ${CENTER + t_w/2}`; // In to Web
    d += ` V ${y+h-t_f}`; // Down Web
    d += ` H ${x+w}`; // Out to Bot Flange Right
    d += ` V ${y+h}`; // Bot Flange Right Edge
    d += ` H ${x}`; // Bot Edge
    d += ` V ${y+h-t_f}`; // Bot Flange Left Edge
    d += ` H ${CENTER - t_w/2}`; // In to Web
    d += ` V ${y+t_f}`; // Up Web
    d += ` H ${x}`; // Out to Top Flange Left
    d += ` Z`; // Close
    return d;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col items-center justify-center relative">
         <h3 className="text-lg font-semibold text-slate-800 mb-4 w-full text-left px-4">截面分析 (Section Analysis)</h3>
         
         <div className="flex gap-8 items-center justify-center w-full h-full">
            {/* Cross Section */}
            <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="bg-slate-50 rounded border border-slate-100">
                <defs>
                    <pattern id="hatch-section" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <line x1="0" y1="0" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="2"/>
                    </pattern>
                    <marker id="arrow-dim" markerWidth="8" markerHeight="6" refX="4" refY="3" orient="auto">
                        <path d="M 0 0 L 8 3 L 0 6 Z" fill="#64748b" />
                    </marker>
                </defs>

                {/* The Section Shape */}
                {sectionType === 'rect' ? (
                    <rect 
                        x={CENTER - (width*SCALE)/2} 
                        y={CENTER - (height*SCALE)/2} 
                        width={width*SCALE} 
                        height={height*SCALE} 
                        fill="url(#hatch-section)" 
                        stroke="#334155" 
                        strokeWidth="3"
                    />
                ) : (
                    <path 
                        d={generateIBeamPath()} 
                        fill="url(#hatch-section)" 
                        stroke="#334155" 
                        strokeWidth="3"
                    />
                )}

                {/* Neutral Axis */}
                <line x1="50" y1={CENTER} x2={450} y2={CENTER} stroke="#ef4444" strokeDasharray="10,5" strokeWidth="2" />
                <text x="460" y={CENTER+5} className="text-sm fill-red-500 font-bold">N.A.</text>

                {/* Stress Distribution Diagram (Overlay) */}
                <g transform={`translate(${CENTER + (width*SCALE)/2 + 40}, ${CENTER})`}>
                    <line x1="0" y1={-(height*SCALE)/2} x2="0" y2={(height*SCALE)/2} stroke="#94a3b8" />
                    <line x1="0" y1="0" x2="60" y2={-(height*SCALE)/2} stroke="#ef4444" strokeWidth="2" />
                    <line x1="0" y1="0" x2="-60" y2={(height*SCALE)/2} stroke="#3b82f6" strokeWidth="2" />
                    <path d={`M 0,${-(height*SCALE)/2} L 60,${-(height*SCALE)/2} L 0,0 Z`} fill="rgba(239,68,68,0.2)" />
                    <path d={`M 0,${(height*SCALE)/2} L -60,${(height*SCALE)/2} L 0,0 Z`} fill="rgba(59,130,246,0.2)" />
                    <text x="10" y={-(height*SCALE)/2 - 10} className="text-xs fill-red-600">σ_comp</text>
                    <text x="-40" y={(height*SCALE)/2 + 20} className="text-xs fill-blue-600">σ_tens</text>
                </g>
            </svg>
         </div>
      </div>

      <div className="w-full lg:w-80 bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-y-auto flex flex-col">
         <h2 className="text-xl font-bold text-slate-800 mb-4">截面类型</h2>
         <div className="flex gap-2 mb-6">
             <button 
                onClick={() => setSectionType('rect')}
                className={`flex-1 py-2 rounded border text-sm font-bold ${sectionType==='rect' ? 'bg-blue-50 border-blue-300 text-blue-700':'bg-white border-slate-200 text-slate-600'}`}
             >
                矩形 (Rect)
             </button>
             <button 
                onClick={() => setSectionType('i-beam')}
                className={`flex-1 py-2 rounded border text-sm font-bold ${sectionType==='i-beam' ? 'bg-blue-50 border-blue-300 text-blue-700':'bg-white border-slate-200 text-slate-600'}`}
             >
                工字钢 (I-Beam)
             </button>
         </div>

         <h2 className="text-xl font-bold text-slate-800 mb-4">几何尺寸 (mm)</h2>
         <Slider label="高度 (h)" value={height} min={100} max={500} unit="mm" onChange={setHeight} />
         <Slider label="宽度 (b)" value={width} min={50} max={300} unit="mm" onChange={setWidth} />
         
         {sectionType === 'i-beam' && (
             <>
                <Slider label="翼缘厚 (tf)" value={tf} min={5} max={40} unit="mm" onChange={setTf} />
                <Slider label="腹板厚 (tw)" value={tw} min={5} max={30} unit="mm" onChange={setTw} />
             </>
         )}

         <hr className="my-4 border-slate-100"/>
         <Slider label="弯矩 (M)" value={moment} min={10} max={500} unit="kNm" onChange={setMoment} />

         <div className="mt-4 space-y-3">
             <div className="flex justify-between p-2 bg-slate-50 rounded border border-slate-100">
                 <span className="text-sm text-slate-600">惯性矩 I:</span>
                 <span className="font-mono font-bold text-slate-800">{(I/10000).toFixed(0)}×10⁴ mm⁴</span>
             </div>
             <div className="flex justify-between p-2 bg-slate-50 rounded border border-slate-100">
                 <span className="text-sm text-slate-600">最大应力 σ:</span>
                 <span className="font-mono font-bold text-blue-600">{sigmaMax.toFixed(1)} MPa</span>
             </div>
         </div>

         <div className="mt-6 p-4 bg-slate-50 rounded border border-slate-200 shadow-inner">
            <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">理论公式 (Formulas)</h4>
            <div className="text-sm text-slate-700 space-y-4 bg-white p-3 rounded border border-slate-100">
                {/* Bending Stress Formula */}
                <div className="flex items-center justify-start gap-2">
                    <span className="font-serif italic font-bold">σ</span>
                    <span>=</span>
                    <div className="flex flex-col items-center">
                        <div className="border-b border-slate-800 px-1 pb-0.5 leading-none text-center">
                            <span className="font-serif italic">M</span> · <span className="font-serif italic">y</span>
                        </div>
                        <div className="pt-0.5 leading-none font-serif italic">I</div>
                    </div>
                </div>

                {/* Moment of Inertia Formula */}
                <div>
                    <div className="text-xs text-slate-500 mb-1">惯性矩 (Moment of Inertia):</div>
                    {sectionType === 'rect' ? (
                        <div className="flex items-center justify-start gap-2">
                            <span className="font-serif italic font-bold">I</span>
                            <span>=</span>
                            <div className="flex flex-col items-center">
                                <div className="border-b border-slate-800 px-1 pb-0.5 leading-none">
                                    <span className="font-serif italic">b</span> · <span className="font-serif italic">h</span><sup>3</sup>
                                </div>
                                <div className="pt-0.5 leading-none">12</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs font-mono text-slate-600">
                            I = I<sub>outer</sub> - I<sub>inner</sub>
                        </div>
                    )}
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};