import React, { useState } from 'react';
import { ModuleType } from './types';
import { BeamModule } from './components/BeamModule';
import { TrussModule } from './components/TrussModule';
import { VibrationModule } from './components/VibrationModule';
import { MohrModule } from './components/MohrModule';
import { FrameModule } from './components/FrameModule';
import { BucklingModule } from './components/BucklingModule';
import { SectionModule } from './components/SectionModule';
import { ConcreteModule } from './components/ConcreteModule';
import { Beaker, Activity, Triangle, Circle, Menu, Square, ArrowDownToLine, Layers, Cuboid } from 'lucide-react';

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.BEAM);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const renderModule = () => {
    switch (activeModule) {
      case ModuleType.BEAM: return <BeamModule />;
      case ModuleType.TRUSS: return <TrussModule />;
      case ModuleType.FRAME: return <FrameModule />;
      case ModuleType.VIBRATION: return <VibrationModule />;
      case ModuleType.MOHR: return <MohrModule />;
      case ModuleType.BUCKLING: return <BucklingModule />;
      case ModuleType.SECTION: return <SectionModule />;
      case ModuleType.CONCRETE: return <ConcreteModule />;
      default: return <BeamModule />;
    }
  };

  const navItems = [
    { id: ModuleType.BEAM, label: '梁理论 (Beams)', icon: <Activity size={20} /> },
    { id: ModuleType.TRUSS, label: '桁架 (Trusses)', icon: <Triangle size={20} /> },
    { id: ModuleType.FRAME, label: '刚架 (Frames)', icon: <Square size={20} /> },
    { id: ModuleType.BUCKLING, label: '压杆稳定 (Stability)', icon: <ArrowDownToLine size={20} /> },
    { id: ModuleType.SECTION, label: '截面分析 (Sections)', icon: <Layers size={20} /> },
    { id: ModuleType.CONCRETE, label: 'RC梁破坏 (RC Beam)', icon: <Cuboid size={20} /> },
    { id: ModuleType.VIBRATION, label: '动力学 (Dynamics)', icon: <Activity size={20} className="rotate-90" /> }, 
    { id: ModuleType.MOHR, label: '应力圆 (Mohr)', icon: <Circle size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200 shadow-lg z-10">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Beaker size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-slate-900">StructLab</h1>
            <p className="text-xs text-slate-500">结构力学可视化</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeModule === item.id 
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded text-xs text-slate-500 leading-relaxed">
            <strong>Version 2.2</strong> <br/>
            Added Concrete Beam Failure Modes.
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center px-4 z-20 justify-between">
         <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded text-white"><Beaker size={20} /></div>
            <span className="font-bold text-slate-900">StructLab</span>
         </div>
         <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 bg-slate-100 rounded">
            <Menu size={20} />
         </button>
      </div>

      {/* Mobile Nav Dropdown */}
      {isSidebarOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-white border-b border-slate-200 shadow-xl z-20 p-4">
           <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveModule(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                  activeModule === item.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden pt-16 md:pt-0">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center px-8 justify-between shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">
            {navItems.find(i => i.id === activeModule)?.label}
          </h2>
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             Physics Engine: Active
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {renderModule()}
        </div>
      </main>
    </div>
  );
};

export default App;