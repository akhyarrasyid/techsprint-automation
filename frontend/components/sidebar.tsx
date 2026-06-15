import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Package, 
  Layers, 
  DollarSign, 
  UploadCloud,
  Activity,
  Sparkles,
  SlidersHorizontal,
  Brain
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'forecast', label: 'Forecast', icon: TrendingUp },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'mrp', label: 'MRP', icon: Layers },
    { id: 'profit', label: 'Profitability', icon: DollarSign },
    { id: 'upload', label: 'Upload Data', icon: UploadCloud },
    { id: 'copilot', label: 'AI Copilot', icon: Sparkles },
    { id: 'digital-twin', label: 'Digital Twin', icon: SlidersHorizontal },
    { id: 'explainability', label: 'Explainable AI', icon: Brain },
  ];

  return (
    <aside className="w-[220px] bg-white border-r border-slate-100 h-screen fixed left-0 top-0 flex flex-col z-30">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-50 flex items-center gap-2.5">
        <div className="p-1.5 bg-[#185FA5] rounded-lg text-white">
          <Activity className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 text-sm tracking-tight leading-none">BPAS</span>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5">Automation</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left ${
                isActive 
                  ? 'bg-[#185FA5]/10 text-[#185FA5]' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#185FA5]' : 'text-slate-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer / Space Tag */}
      <div className="p-4 border-t border-slate-50">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <span className="text-[10px] text-slate-400 block font-medium">TechSprint Track</span>
          <span className="text-xs font-semibold text-slate-700 mt-0.5 block">Data Automation</span>
        </div>
      </div>
    </aside>
  );
};
