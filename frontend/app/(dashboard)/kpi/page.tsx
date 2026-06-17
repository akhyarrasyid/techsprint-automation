'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { safeKPI } from '../../../lib/mock';
import { Gauge, TrendingUp, Package, Target, Truck, DollarSign, BarChart3, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

function KPIContent() {
  const searchParams = useSearchParams();
  const scenario = searchParams.get('scenario') || 'Base';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    safeKPI(scenario).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [scenario]);

  const kpiCards = data ? [
    { label: 'Service Level', value: data.service_level, unit: '%', target: 95, icon: Target, color: '#185FA5' },
    { label: 'Fill Rate', value: data.fill_rate, unit: '%', target: 97, icon: Package, color: '#1D9E75' },
    { label: 'Forecast Accuracy', value: data.forecast_accuracy, unit: '%', target: 85, icon: BarChart3, color: '#7C3AED' },
    { label: 'Inventory Turnover', value: data.inventory_turnover, unit: 'x', target: 8, icon: TrendingUp, color: '#E67E22' },
    { label: 'Supplier Reliability', value: data.supplier_reliability, unit: '%', target: 90, icon: Truck, color: '#2563EB' },
    { label: 'Gross Margin', value: data.gross_margin, unit: '%', target: 30, icon: DollarSign, color: '#059669' },
    { label: 'Net Margin', value: data.net_margin, unit: '%', target: 10, icon: DollarSign, color: '#DC2626' },
    { label: 'Stockout Probability', value: (data.stockout_probability * 100).toFixed(1), unit: '%', target: 5, icon: AlertTriangle, color: '#F59E0B', inverse: true },
  ] : [];

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">{Array(8).fill(0).map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}</div>
      <div className="h-64 bg-white rounded-2xl animate-pulse" />
    </div>
  );
  if (!data) return <div className="bg-white rounded-2xl p-8 text-center text-slate-400 font-medium text-sm">Tidak ada data KPI tersedia.</div>;

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          const val = typeof kpi.value === 'string' ? parseFloat(kpi.value) : kpi.value;
          const isGood = kpi.inverse ? val <= kpi.target : val >= kpi.target;
          return (
            <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl" style={{ backgroundColor: `${kpi.color}10` }}>
                  <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${isGood ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {isGood ? 'ON TARGET' : 'BELOW TARGET'}
                </span>
              </div>
              <p className="text-2xl font-black text-slate-800">{typeof kpi.value === 'number' ? kpi.value.toFixed(1) : kpi.value}<span className="text-sm font-bold text-slate-400 ml-1">{kpi.unit}</span></p>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">{kpi.label}</p>
              <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5">
                <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (val / kpi.target) * 100)}%`, backgroundColor: isGood ? '#059669' : '#F59E0B' }} />
              </div>
              <p className="text-[9px] text-slate-400 font-bold mt-1">Target: {kpi.target}{kpi.unit}</p>
            </div>
          );
        })}
      </div>

      {/* Product KPIs Table */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Gauge className="w-4 h-4 text-[#185FA5]" />KPI Per Produk</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left py-3 px-4 font-bold text-slate-500">Produk</th>
              <th className="text-right py-3 px-4 font-bold text-slate-500">Service Level</th>
              <th className="text-right py-3 px-4 font-bold text-slate-500">Stockout Prob.</th>
              <th className="text-right py-3 px-4 font-bold text-slate-500">Days Coverage</th>
              <th className="text-right py-3 px-4 font-bold text-slate-500">Margin</th>
              <th className="text-right py-3 px-4 font-bold text-slate-500">Trend</th>
            </tr></thead>
            <tbody>
              {data.product_kpis?.map((p: any) => (
                <tr key={p.product_id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-700">{p.product_name}</td>
                  <td className="py-3 px-4 text-right font-bold" style={{ color: p.service_level >= 95 ? '#059669' : '#F59E0B' }}>{p.service_level}%</td>
                  <td className="py-3 px-4 text-right font-bold" style={{ color: p.stockout_probability > 0.15 ? '#DC2626' : '#059669' }}>{(p.stockout_probability * 100).toFixed(0)}%</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-600">{p.days_coverage} hari</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-700">{p.margin_pct}%</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`inline-flex items-center gap-0.5 font-bold ${p.trend_pct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {p.trend_pct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{Math.abs(p.trend_pct)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function KPIPage() {
  return (<Suspense fallback={<div className="grid grid-cols-4 gap-4">{Array(8).fill(0).map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}</div>}><KPIContent /></Suspense>);
}
