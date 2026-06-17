'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { safeAnomalies } from '../../../lib/mock';
import { AlertTriangle, TrendingUp, TrendingDown, Zap, Truck, Package, ShieldAlert } from 'lucide-react';

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  demand_spike: { icon: TrendingUp, color: '#DC2626', bg: '#FEF2F2', label: 'Demand Spike' },
  demand_collapse: { icon: TrendingDown, color: '#7C3AED', bg: '#F5F3FF', label: 'Demand Collapse' },
  outlier_demand: { icon: Zap, color: '#F59E0B', bg: '#FFFBEB', label: 'Outlier Demand' },
  stock_critical: { icon: Package, color: '#DC2626', bg: '#FEF2F2', label: 'Critical Stock' },
  supplier_anomaly: { icon: Truck, color: '#E67E22', bg: '#FFF7ED', label: 'Supplier Anomaly' },
};

function AnomalyContent() {
  const searchParams = useSearchParams();
  const scenario = searchParams.get('scenario') || 'Base';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    safeAnomalies(scenario).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [scenario]);

  if (loading) return <div className="space-y-4">{Array(4).fill(0).map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}</div>;
  if (!data) return <div className="bg-white rounded-2xl p-8 text-center text-slate-400 font-medium text-sm">Tidak ada data tersedia.</div>;

  const summary = data.summary;
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-[11px] font-semibold text-slate-500 mb-1">Total Anomalies</p>
          <p className="text-3xl font-black text-slate-800">{summary.total_anomalies}</p>
        </div>
        <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
          <p className="text-[11px] font-semibold text-red-500 mb-1">High Severity</p>
          <p className="text-3xl font-black text-red-600">{summary.high_severity}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
          <p className="text-[11px] font-semibold text-amber-600 mb-1">Medium Severity</p>
          <p className="text-3xl font-black text-amber-600">{summary.medium_severity}</p>
        </div>
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
          <p className="text-[11px] font-semibold text-blue-500 mb-1">Low Severity</p>
          <p className="text-3xl font-black text-blue-600">{summary.low_severity}</p>
        </div>
      </div>

      {/* Anomaly List */}
      <div className="space-y-3">
        {data.anomalies.length === 0 ? (
          <div className="bg-emerald-50 rounded-2xl p-8 text-center">
            <ShieldAlert className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-emerald-700">Tidak ada anomali terdeteksi</p>
            <p className="text-xs text-emerald-600 mt-1">Semua metrik dalam kondisi normal.</p>
          </div>
        ) : (
          data.anomalies.map((a: any, idx: number) => {
            const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.outlier_demand;
            const Icon = cfg.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: cfg.bg }}>
                    <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-800">{a.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${a.severity === 'high' ? 'bg-red-100 text-red-600' : a.severity === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>{a.severity}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500">{cfg.label}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{a.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[10px] font-bold text-slate-400">Z-Score: {a.z_score}</span>
                      <span className="text-[10px] font-bold text-slate-400">Confidence: {(a.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function AnomaliesPage() {
  return (<Suspense fallback={<div className="space-y-4">{Array(4).fill(0).map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}</div>}><AnomalyContent /></Suspense>);
}
