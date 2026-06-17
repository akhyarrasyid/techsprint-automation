'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { safeCommandCenter } from '../../../lib/mock';
import { Command, Target, AlertTriangle, Lightbulb, ArrowRight, ShieldCheck, TrendingUp, DollarSign } from 'lucide-react';

function CommandCenterContent() {
  const searchParams = useSearchParams();
  const scenario = searchParams.get('scenario') || 'Base';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    safeCommandCenter(scenario).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [scenario]);

  if (loading) return <div className="space-y-6"><div className="grid grid-cols-3 gap-4">{Array(6).fill(0).map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}</div></div>;
  if (!data) return <div className="bg-white rounded-2xl p-8 text-center text-slate-400 font-medium text-sm">Data belum tersedia.</div>;

  const statusColors: Record<string, string> = { good: '#059669', warning: '#F59E0B', critical: '#DC2626' };

  return (
    <div className="space-y-6">
      {/* Global KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {data.global_kpis?.map((kpi: any) => (
          <div key={kpi.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-slate-500">{kpi.label}</p>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColors[kpi.status] || '#94A3B8' }} />
            </div>
            <p className="text-2xl font-black text-slate-800">{kpi.value}<span className="text-sm font-bold text-slate-400 ml-1">{kpi.unit}</span></p>
            <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
              <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (kpi.value / kpi.target) * 100)}%`, backgroundColor: statusColors[kpi.status] }} />
            </div>
            <p className="text-[9px] text-slate-400 font-bold mt-1">Target: {kpi.target}{kpi.unit}</p>
          </div>
        ))}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: data.financial_summary?.total_revenue, icon: DollarSign, color: '#185FA5' },
          { label: 'Total COGS', value: data.financial_summary?.total_cogs, icon: DollarSign, color: '#DC2626' },
          { label: 'Gross Margin', value: `${data.financial_summary?.gross_margin}%`, icon: TrendingUp, color: '#059669', raw: true },
          { label: 'Net Margin', value: `${data.financial_summary?.net_margin}%`, icon: TrendingUp, color: '#7C3AED', raw: true },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${item.color}10` }}><Icon className="w-3.5 h-3.5" style={{ color: item.color }} /></div>
                <p className="text-[11px] font-semibold text-slate-500">{item.label}</p>
              </div>
              <p className="text-xl font-black text-slate-800">{item.raw ? item.value : `Rp ${Number(item.value).toLocaleString('id-ID')}`}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Risk Map */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" />Risk Map ({data.risk_map?.length})</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data.risk_map?.map((r: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${r.severity === 'high' ? 'bg-red-500' : r.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  <p className="text-xs font-bold text-slate-700">{r.title}</p>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">{r.description.slice(0, 120)}...</p>
              </div>
            ))}
            {(!data.risk_map || data.risk_map.length === 0) && <p className="text-xs text-slate-400 text-center py-4">Tidak ada risiko terdeteksi.</p>}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" />Rekomendasi</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data.recommendations?.map((r: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <ArrowRight className="w-4 h-4 text-[#185FA5] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-700">{r.title}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">{r.description}</p>
                  <div className="flex gap-2 mt-1.5">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${r.impact === 'high' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>Impact: {r.impact}</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">Effort: {r.effort}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Priority Actions */}
      {data.priority_actions?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" />Priority Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            {data.priority_actions.map((a: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white ${a.severity === 'high' ? 'bg-red-500' : 'bg-amber-500'}`}>{idx + 1}</div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-700">{a.title}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{a.description.slice(0, 150)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommandCenterPage() {
  return (<Suspense fallback={<div className="grid grid-cols-3 gap-4">{Array(6).fill(0).map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}</div>}><CommandCenterContent /></Suspense>);
}
