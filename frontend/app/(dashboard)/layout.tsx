'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/sidebar';
import { Topbar } from '../../components/topbar';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [scenario, setScenarioState] = useState('Base');

  // Read query params safely inside useEffect (client-only) to avoid SSR searchParam bails
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const scen = params.get('scenario') || 'Base';
      setScenarioState(scen);
    }
  }, [pathname]);

  // Determine active tab from pathname
  const activeTab = pathname.split('/').pop() || 'dashboard';

  const handleTabChange = (tab: string) => {
    router.push(`/${tab}?scenario=${encodeURIComponent(scenario)}`);
  };

  const setScenario = (scen: string) => {
    setScenarioState(scen);
    router.push(`${pathname}?scenario=${encodeURIComponent(scen)}`);
  };

  const titles: Record<string, string> = {
    'dashboard': 'Executive Dashboard',
    'forecast': 'Demand Forecasting',
    'inventory': 'Inventory Planning',
    'mrp': 'Material Requirements Planning',
    'profit': 'Profitability Analysis',
    'upload': 'Upload Sales History',
    'copilot': 'AI Copilot',
    'digital-twin': 'Digital Twin Simulator',
    'explainability': 'Explainable AI',
    'kpi': 'KPI Engine',
    'anomalies': 'Anomaly Detection',
    'command-center': 'Executive Command Center',
    'model-monitoring': 'Model Monitoring',
    'observability': 'Enterprise Observability',
    'export': 'Export Center',
    'audit': 'Audit Trail',
    'data-quality': 'Data Quality Center',
    'mlops': 'MLOps Foundation',
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Main Content Pane */}
      <div className="pl-[220px] flex flex-col min-h-screen">
        <Topbar title={titles[activeTab] || 'Business Planning System'} scenario={scenario} setScenario={setScenario} />
        <main className="p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
