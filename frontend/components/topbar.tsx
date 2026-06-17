import React, { useEffect, useState } from 'react';
import { fetchHealth } from '../lib/api';
import { HealthStatus } from '../lib/types';
import { ShieldCheck, AlertTriangle, RefreshCw, Moon, Sun } from 'lucide-react';
import { useTheme } from '../providers/theme-provider';

interface TopbarProps {
  title: string;
  scenario: string;
  setScenario: (scen: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ title, scenario, setScenario }) => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const { theme, toggle } = useTheme();

  const checkHealth = async () => {
    setLoadingHealth(true);
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (e) {
      setHealth({
        status: 'error',
        pipeline: 'offline',
        environment: 'development',
        model: 'unknown'
      });
    }
    setLoadingHealth(false);
  };

  useEffect(() => {
    checkHealth();
    // Poll health status every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const scenarios = [
    'Base',
    'High Demand +20%',
    'Supplier Delay +5 hari',
    'Raw Material +10%'
  ];

  return (
    <header className="h-16 border-b border-slate-100 bg-white px-8 flex items-center justify-between sticky top-0 z-20">
      <h1 className="text-lg font-bold text-slate-800 capitalize">{title}</h1>

      <div className="flex items-center gap-6">
        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4 text-amber-400" />
            : <Moon className="w-4 h-4 text-slate-400" />
          }
        </button>

        {/* Scenario Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Simulation:</span>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-[#185FA5] cursor-pointer"
          >
            {scenarios.map((scen) => (
              <option key={scen} value={scen}>
                {scen}
              </option>
            ))}
          </select>
        </div>

        {/* API Connection / Health Status */}
        <div 
          onClick={checkHealth}
          className="flex items-center gap-2 border border-slate-100 px-3 py-1.5 rounded-lg bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors duration-150"
        >
          {loadingHealth ? (
            <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
          ) : health?.status === 'ok' ? (
            <ShieldCheck className="w-3.5 h-3.5 text-[#1D9E75]" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-[#A32D2D]" />
          )}
          <span className="text-xs font-semibold text-slate-600">
            {health?.status === 'ok' ? 'API Online' : 'API Offline'}
          </span>
          {health?.status === 'ok' && (
            <span className="text-[10px] bg-[#185FA5]/10 text-[#185FA5] px-1.5 py-0.5 rounded font-mono uppercase">
              {health.model}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
