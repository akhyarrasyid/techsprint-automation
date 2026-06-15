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

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Executive Dashboard';
      case 'forecast': return 'Demand Forecasting';
      case 'inventory': return 'Inventory Planning';
      case 'mrp': return 'Material Requirements Planning';
      case 'profit': return 'Profitability Analysis';
      case 'upload': return 'Upload Sales History';
      case 'copilot': return 'AI Copilot';
      case 'digital-twin': return 'Digital Twin Simulator';
      default: return 'Business Planning System';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Main Content Pane */}
      <div className="pl-[220px] flex flex-col min-h-screen">
        <Topbar title={getTitle()} scenario={scenario} setScenario={setScenario} />
        <main className="p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
