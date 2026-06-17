import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Package, 
  Layers, 
  DollarSign, 
  UploadCloud,
  Sparkles,
  SlidersHorizontal,
  Brain,
  Gauge,
  AlertTriangle,
  Command,
  Activity,
  Eye,
  Download,
  ClipboardList,
  ShieldCheck,
  FlaskConical,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuSections = [
    {
      title: 'Core Planning',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'forecast', label: 'Forecast', icon: TrendingUp },
        { id: 'inventory', label: 'Inventory', icon: Package },
        { id: 'mrp', label: 'MRP', icon: Layers },
        { id: 'profit', label: 'Profitability', icon: DollarSign },
      ],
    },
    {
      title: 'Intelligence & Simulation',
      items: [
        { id: 'copilot', label: 'AI Copilot', icon: Sparkles },
        { id: 'command-center', label: 'Command Center', icon: Command },
        { id: 'digital-twin', label: 'Digital Twin', icon: SlidersHorizontal },
        { id: 'explainability', label: 'Explainable AI', icon: Brain },
        { id: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle },
        { id: 'kpi', label: 'KPI Engine', icon: Gauge },
      ],
    },
  ];

  return (
    <aside className="w-[220px] bg-white border-r border-slate-100 h-screen fixed left-0 top-0 flex flex-col z-30 overflow-y-auto">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-50 flex items-center gap-2.5 shrink-0">
        <div className="p-1.5 bg-[#185FA5] rounded-lg text-white">
          <Activity className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 text-sm tracking-tight leading-none">BPAS</span>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5">Automation</span>
        </div>
      </div>

      {/* Nav Menu with Sections */}
      <nav className="flex-1 px-3 py-3 space-y-3 overflow-y-auto">
        {menuSections.map((section) => (
          <div key={section.title}>
            <p className="px-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.15em] mb-1">{section.title}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 rounded-lg text-[11px] font-semibold transition-all duration-150 text-left ${
                      isActive 
                        ? 'bg-[#185FA5]/10 text-[#185FA5]' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#185FA5]' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-50 shrink-0">
        <div className="bg-slate-50 rounded-lg p-2.5 text-center">
          <span className="text-[9px] text-slate-400 block font-medium">TechSprint Track</span>
          <span className="text-[10px] font-bold text-slate-700 mt-0.5 block">Data Automation</span>
        </div>
      </div>
    </aside>
  );
};
