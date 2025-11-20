import React, { useState, useMemo } from 'react';
import { Slider } from './Slider';
import { Point } from '../types';

type BeamType = 'simple' | 'cantilever';
type LoadType = 'point' | 'udl';

export const BeamModule: React.FC = () => {
  const [beamType, setBeamType] = useState<BeamType>('simple');
  const [loadType, setLoadType] = useState<LoadType>('point');
  const [loadPos, setLoadPos] = useState(50); // %
  const [loadMag, setLoadMag] = useState(50); // kN or kN/m
  const [beamLength, setBeamLength] = useState(10); // m

  // Viz Constants
  const SVG_W = 800;
  const SVG_H = 500;
  const BEAM_Y = 150;
  const MARGIN_X = 80;
  const DRAW_W = SVG_W - 2 * MARGIN_X;

  // Physics Calculation
  const L = beamLength;
  const P = loadMag;
  const a_ratio = loadPos / 100; 
  const a = a_ratio * L; // dist from left
  const b = L - a;

  // Calculate Reactions & Diagrams based on Type
  const { ra, rb, ma, mb, sfdPoints, bmdPoints, deflPath, maxM, maxV } = useMemo(() => {
    let ra = 0, rb = 0, ma = 0, mb = 0; // ma is moment at left support (CCW positive)
    let sfd: Point[] = [];
    let bmd: Point[] = [];
    let defl: string = "";
    let maxV = 0, maxM = 0;

    const numPoints = 100;
    const dx = DRAW_W / numPoints; // visual dx
    const dxReal = L / numPoints;  // real dx

    if (beamType === 'simple') {
      if (loadType === 'point') {
        // Simple Support, Point Load
        rb = (P * a) / L;
        ra = P - rb;
        maxV = Math.max(ra, rb);
        maxM = (P * a * b) / L;
        
        // SFD
        sfd = [
          {x: 0, y: ra}, 
          {x: a_ratio * DRAW_W, y: ra}, 
          {x: a_ratio * DRAW_W, y: -rb}, 
          {x: DRAW_W, y: -rb}
        ];
        
        // BMD (Triangle)
        bmd = [
          {x: 0, y: 0},
          {x: a_ratio * DRAW_W, y: maxM},
          {x: DRAW_W, y: 0}
        ];

        // Deflection (Simple quadratic viz approximation)
        defl = `M ${MARGIN_X},${BEAM_Y} Q ${MARGIN_X + a_ratio*DRAW_W},${BEAM_Y + P*1.5} ${MARGIN_X + DRAW_W},${BEAM_Y}`;
      } else {
        // Simple Support, UDL
        const W = P * L; // Total load
        ra = W / 2;
        rb = W / 2;
        maxV = ra;
        maxM = (P * L * L) / 8;

        // SFD (Linear)
        sfd = [{x: 0, y: ra}, {x: DRAW_W, y: -rb}];
        
        // BMD (Parabola)
        for (let i = 0; i <= numPoints; i++) {
          const x = i * dxReal; // real x
          const mx = (ra * x) - (P * x * x / 2);
          bmd.push({ x: i * dx, y: mx });
        }
        
        defl = `M ${MARGIN_X},${BEAM_Y} Q ${MARGIN_X + DRAW_W/2},${BEAM_Y + P*1.5} ${MARGIN_X + DRAW_W},${BEAM_Y}`;
      }
    } else {
      // Cantilever (Fixed at Left)
      if (loadType === 'point') {
        // Point load at position 'a'
        ra = P;
        ma = -P * a; // Reaction moment (CCW is positive, so this resists the CW load moment)
        // Actually internal moment M(x). At x=0, M = -Pa.
        maxV = P;
        maxM = Math.abs(ma);

        // SFD: Constant P up to load, then 0
        sfd = [
          {x: 0, y: P}, 
          {x: a_ratio * DRAW_W, y: P}, 
          {x: a_ratio * DRAW_W, y: 0}, 
          {x: DRAW_W, y: 0}
        ];

        // BMD: Linear from -Pa to 0
        bmd = [
          {x: 0, y: ma}, // Plot negative
          {x: a_ratio * DRAW_W, y: 0},
          {x: DRAW_W, y: 0}
        ];
        
        // Deflection: Cubic
        defl = `M ${MARGIN_X},${BEAM_Y} Q ${MARGIN_X + a_ratio*DRAW_W*0.5},${BEAM_Y + 5} ${MARGIN_X + a_ratio*DRAW_W},${BEAM_Y + P*1.5} L ${MARGIN_X + DRAW_W},${BEAM_Y + P*1.5 + (beamLength-a)*(P*0.05)}`; // simplified
      } else {
        // Cantilever, UDL
        const W = P * L;
        ra = W;
        ma = -(P * L * L) / 2;
        maxV = W;
        maxM = Math.abs(ma);

        // SFD: Linear decrease from wL to 0
        sfd = [{x: 0, y: ra}, {x: DRAW_W, y: 0}];

        // BMD: Parabolic from -wL^2/2 to 0
        for (let i = 0; i <= numPoints; i++) {
          const x = i * dxReal;
          // Moment at x from left. M(x) = R*x + M_A - w*x^2/2  Wait, standard cantilever logic: 
          // Take x from free end is easier, but let's stick to x from fix.
          // M(x) = - (w * (L-x)^2) / 2
          const mx = - (P * Math.pow(L - x, 2)) / 2;
          bmd.push({ x: i * dx, y: mx });
        }

        defl = `M ${MARGIN_X},${BEAM_Y} Q ${MARGIN_X + DRAW_W*0.6},${BEAM_Y + 10} ${MARGIN_X + DRAW_W},${BEAM_Y + P*2}`;
      }
    }

    return { ra, rb, ma, mb, sfdPoints: sfd, bmdPoints: bmd, deflPath: defl, maxM, maxV };
  }, [beamType, loadType, loadPos, loadMag, beamLength]);

  // Path Generators
  const generatePolygon = (points: Point[], yBase: number, scale: number) => {
    if (points.length === 0) return "";
    let d = `M ${MARGIN_X + points[0].x},${yBase} `; // Start at axis
    d += `L ${MARGIN_X + points[0].x},${yBase - points[0].y * scale} `; // Go to first val
    
    for (let i = 1; i < points.length; i++) {
      d += `L ${MARGIN_X + points[i].x},${yBase - points[i].y * scale} `;
    }
    d += `L ${MARGIN_X + points[points.length-1].x},${yBase} Z`; // Close to axis
    return d;
  };

  const sfdScale = maxV ? 60 / maxV : 1;
  const bmdScale = maxM ? 60 / maxM : 1;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col relative overflow-auto">
        <div className="absolute top-4 right-4 flex gap-2 bg-slate-100 p-1 rounded-lg z-10">
           <button onClick={() => setBeamType('simple')} className={`px-3 py-1 text-xs font-bold rounded ${beamType==='simple' ? 'bg-white shadow text-blue-600':'text-slate-500'}`}>简支梁</button>
           <button onClick={() => setBeamType('cantilever')} className={`px-3 py-1 text-xs font-bold rounded ${beamType==='cantilever' ? 'bg-white shadow text-blue-600':'text-slate-500'}`}>悬臂梁</button>
        </div>
        <div className="absolute top-4 left-4 flex gap-2 bg-slate-100 p-1 rounded-lg z-10">
           <button onClick={() => setLoadType('point')} className={`px-3 py-1 text-xs font-bold rounded ${loadType==='point' ? 'bg-white shadow text-red-600':'text-slate-500'}`}>集中力</button>
           <button onClick={() => setLoadType('udl')} className={`px-3 py-1 text-xs font-bold rounded ${loadType==='udl' ? 'bg-white shadow text-red-600':'text-slate-500'}`}>均布载荷</button>
        </div>

        <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="mt-8">
          <defs>
            <marker id="arrow-red" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
            </marker>
            <marker id="arrow-blue" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
            </marker>
          </defs>

          {/* BEAM VIZ */}
          {/* Support Left */}
          {beamType === 'simple' ? (
            <path d={`M ${MARGIN_X},${BEAM_Y+10} l -10,15 h 20 z`} fill="#94a3b8" />
          ) : (
            <rect x={MARGIN_X-10} y={BEAM_Y-40} width="10" height="80" fill="url(#grid)" stroke="#64748b" />
          )}
          
          {/* Support Right (Simple only) */}
          {beamType === 'simple' && (
            <circle cx={MARGIN_X + DRAW_W} cy={BEAM_Y+15} r="6" fill="#94a3b8" />
          )}

          {/* Beam Line */}
          <line x1={MARGIN_X} y1={BEAM_Y} x2={MARGIN_X + DRAW_W} y2={BEAM_Y} stroke="#cbd5e1" strokeWidth="4" strokeDasharray="5,5"/>
          <path d={deflPath} fill="none" stroke="#334155" strokeWidth="6" strokeLinecap="round" />

          {/* Load Visualization */}
          {loadType === 'point' ? (
            <>
              <line 
                x1={MARGIN_X + (loadPos/100)*DRAW_W} y1={BEAM_Y - 60} 
                x2={MARGIN_X + (loadPos/100)*DRAW_W} y2={BEAM_Y - 10} 
                stroke="#ef4444" strokeWidth="4" markerEnd="url(#arrow-red)" 
              />
              <text x={MARGIN_X + (loadPos/100)*DRAW_W + 10} y={BEAM_Y - 40} className="text-sm font-bold fill-red-500">P={loadMag}kN</text>
            </>
          ) : (
            <g>
              {/* UDL Arrows */}
              {Array.from({length: 11}).map((_, i) => (
                <line 
                  key={i}
                  x1={MARGIN_X + i*(DRAW_W/10)} y1={BEAM_Y - 40} 
                  x2={MARGIN_X + i*(DRAW_W/10)} y2={BEAM_Y - 10} 
                  stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrow-red)" 
                />
              ))}
              <rect x={MARGIN_X} y={BEAM_Y-42} width={DRAW_W} height="4" fill="#ef4444" />
              <text x={MARGIN_X + DRAW_W/2} y={BEAM_Y - 50} className="text-sm font-bold fill-red-500" textAnchor="middle">q = {loadMag} kN/m</text>
            </g>
          )}

          {/* Reactions */}
          <line x1={MARGIN_X} y1={BEAM_Y+50} x2={MARGIN_X} y2={BEAM_Y+10} stroke="#3b82f6" strokeWidth="3" markerEnd="url(#arrow-blue)"/>
          <text x={MARGIN_X-30} y={BEAM_Y+40} className="text-xs fill-blue-600 font-bold">{ra.toFixed(1)}</text>
          
          {ma !== 0 && (
             <g transform={`translate(${MARGIN_X-20}, ${BEAM_Y})`}>
               <path d="M 0,20 A 20,20 0 0,1 0,-20" fill="none" stroke="#3b82f6" strokeWidth="3" markerEnd="url(#arrow-blue)" />
               <text x="-40" y="0" className="text-xs fill-blue-600 font-bold">{Math.abs(ma).toFixed(1)} kNm</text>
             </g>
          )}

          {beamType === 'simple' && (
             <>
                <line x1={MARGIN_X+DRAW_W} y1={BEAM_Y+50} x2={MARGIN_X+DRAW_W} y2={BEAM_Y+10} stroke="#3b82f6" strokeWidth="3" markerEnd="url(#arrow-blue)"/>
                <text x={MARGIN_X+DRAW_W+10} y={BEAM_Y+40} className="text-xs fill-blue-600 font-bold">{rb.toFixed(1)}</text>
             </>
          )}


          {/* SFD */}
          <g transform="translate(0, 280)">
             <text x={20} y="-20" className="text-sm font-bold fill-slate-600">剪力图 (SFD)</text>
             <line x1={MARGIN_X} y1="0" x2={MARGIN_X+DRAW_W} y2="0" stroke="#94a3b8" />
             <path d={generatePolygon(sfdPoints, 0, sfdScale)} fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth="2" />
             {/* Max V label */}
             <text x={MARGIN_X + DRAW_W + 10} y="5" className="text-xs fill-blue-500">V_max = {maxV.toFixed(1)}</text>
          </g>

          {/* BMD */}
          <g transform="translate(0, 420)">
             <text x={20} y="-20" className="text-sm font-bold fill-slate-600">弯矩图 (BMD)</text>
             <line x1={MARGIN_X} y1="0" x2={MARGIN_X+DRAW_W} y2="0" stroke="#94a3b8" />
             <path d={generatePolygon(bmdPoints, 0, -bmdScale)} fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="2" />
             <text x={MARGIN_X + DRAW_W + 10} y="5" className="text-xs fill-red-500">|M_max| = {maxM.toFixed(1)}</text>
          </g>

        </svg>
      </div>

      <div className="w-full lg:w-80 bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-y-auto flex flex-col">
        <h2 className="text-xl font-bold text-slate-800 mb-6">参数设置</h2>
        
        <Slider label="跨度 (Length)" value={beamLength} min={2} max={20} unit="m" onChange={setBeamLength} />
        <Slider label={`载荷大小 (${loadType === 'udl' ? 'q' : 'P'})`} value={loadMag} min={10} max={100} unit={loadType === 'udl'?'kN/m':'kN'} onChange={setLoadMag} />
        
        {loadType === 'point' && (
          <Slider label="载荷位置 (Position)" value={loadPos} min={0} max={100} unit="%" onChange={setLoadPos} />
        )}

        <div className="mt-6 p-4 bg-slate-50 rounded border border-slate-200 shadow-inner">
           <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">理论公式 (Formulas)</h4>
           <div className="text-sm text-slate-700 space-y-4 bg-white p-3 rounded border border-slate-100">
             {beamType === 'simple' && loadType === 'point' && (
               <>
                <div className="flex items-center gap-2">
                   <span className="font-serif">R<sub>A</sub> =</span>
                   <div className="flex flex-col items-center"><div className="border-b border-slate-800 leading-none pb-0.5">Pb</div><div className="leading-none pt-0.5">L</div></div>
                </div>
                <div className="flex items-center gap-2">
                   <span className="font-serif">M<sub>max</sub> =</span>
                   <div className="flex flex-col items-center"><div className="border-b border-slate-800 leading-none pb-0.5">Pab</div><div className="leading-none pt-0.5">L</div></div>
                </div>
               </>
             )}
             {beamType === 'simple' && loadType === 'udl' && (
               <>
                 <div className="flex items-center gap-2">
                   <span className="font-serif">R =</span>
                   <div className="flex flex-col items-center"><div className="border-b border-slate-800 leading-none pb-0.5">qL</div><div className="leading-none pt-0.5">2</div></div>
                </div>
                <div className="flex items-center gap-2">
                   <span className="font-serif">M<sub>max</sub> =</span>
                   <div className="flex flex-col items-center"><div className="border-b border-slate-800 leading-none pb-0.5">qL<sup>2</sup></div><div className="leading-none pt-0.5">8</div></div>
                </div>
                <div className="flex items-center gap-2">
                   <span className="font-serif">δ<sub>max</sub> =</span>
                   <div className="flex flex-col items-center"><div className="border-b border-slate-800 leading-none pb-0.5">5qL<sup>4</sup></div><div className="leading-none pt-0.5">384EI</div></div>
                </div>
               </>
             )}
             {beamType === 'cantilever' && loadType === 'point' && (
               <>
                 <div className="flex items-center gap-2"><span className="font-serif">R<sub>A</sub> = P</span></div>
                 <div className="flex items-center gap-2"><span className="font-serif">M<sub>A</sub> = -Pa</span></div>
                 <div className="flex items-center gap-2">
                   <span className="font-serif">δ =</span>
                   <div className="flex flex-col items-center"><div className="border-b border-slate-800 leading-none pb-0.5">Pa<sup>3</sup></div><div className="leading-none pt-0.5">3EI</div></div>
                </div>
               </>
             )}
             {beamType === 'cantilever' && loadType === 'udl' && (
               <>
                 <div className="flex items-center gap-2"><span className="font-serif">R<sub>A</sub> = qL</span></div>
                 <div className="flex items-center gap-2">
                    <span className="font-serif">M<sub>A</sub> = -</span>
                    <div className="flex flex-col items-center"><div className="border-b border-slate-800 leading-none pb-0.5">qL<sup>2</sup></div><div className="leading-none pt-0.5">2</div></div>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="font-serif">δ =</span>
                    <div className="flex flex-col items-center"><div className="border-b border-slate-800 leading-none pb-0.5">qL<sup>4</sup></div><div className="leading-none pt-0.5">8EI</div></div>
                 </div>
               </>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};