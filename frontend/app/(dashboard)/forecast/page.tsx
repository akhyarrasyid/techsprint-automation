'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchForecast } from '../../../lib/api';
import { ForecastChart } from '../../../components/charts/forecast-chart';
import { MetricCard } from '../../../components/metric-card';
import { MetricCardSkeleton } from '../../../components/skeletons/metric-card-skeleton';
import { ChartSkeleton } from '../../../components/skeletons/chart-skeleton';
import ErrorBanner from '../../../components/error-banner';
import EmptyState from '../../../components/empty-state';
import { TrendingUp, TrendingDown, BarChart3, Target, Search } from 'lucide-react';

function ForecastContent() {
  const searchParams = useSearchParams();
  const scenario = searchParams.get('scenario') || 'Base';
  const [search, setSearch] = useState('');

  const { data: forecast, isLoading, error, refetch } = useQuery({
    queryKey: ['forecast', scenario],
    queryFn: () => fetchForecast(scenario),
    staleTime: 30_000,
  });

  if (!isLoading && error) {
    return <ErrorBanner message={(error as Error).message} onRetry={refetch} />;
  }

  if (!isLoading && !forecast?.length) {
    return <EmptyState title="Belum ada data forecast" description="Upload file sales history dan jalankan pipeline terlebih dahulu." />;
  }

  const totalWeeklyDemand = forecast?.reduce((s, p) => s + p.forecast_next_week, 0) ?? 0;
  const topMenu = forecast?.length
    ? forecast.reduce((a, b) => (b.forecast_next_week > a.forecast_next_week ? b : a))
    : null;
  const avgTrend = forecast?.length
    ? Math.round((forecast.reduce((s, p) => s + p.trend_pct, 0) / forecast.length) * 10) / 10
    : 0;
  const positiveTrendCount = forecast?.filter((p) => p.trend_pct > 0).length ?? 0;

  const filtered = (forecast ?? []).filter((p) =>
    p.product_name.toLowerCase().includes(search.toLowerCase())
  );

  const getTrendColor = (v: number) =>
    v > 0 ? 'text-emerald-600' : v < 0 ? 'text-red-500' : 'text-slate-400';

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Demand Forecasting</h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Proyeksi permintaan 5 minggu ke depan — model autoregresif DOW dengan exponential smoothing trend
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          <>
            <MetricCard
              title="Total Demand Mingguan"
              value={`${totalWeeklyDemand.toLocaleString('id-ID')} unit`}
              icon={BarChart3}
              description="Proyeksi permintaan aggregat minggu depan"
            />
            <MetricCard
              title="Menu Teratas"
              value={topMenu?.product_name ?? '-'}
              icon={Target}
              description={`${(topMenu?.forecast_next_week ?? 0).toLocaleString('id-ID')} unit/minggu`}
            />
            <MetricCard
              title="Rata-rata Trend"
              value={`${avgTrend > 0 ? '+' : ''}${avgTrend}%`}
              icon={avgTrend >= 0 ? TrendingUp : TrendingDown}
              description="Rata-rata pertumbuhan seluruh menu"
              trend={avgTrend !== 0 ? { value: Math.abs(avgTrend), isPositive: avgTrend > 0 } : undefined}
            />
            <MetricCard
              title="Menu Tren Positif"
              value={`${positiveTrendCount} dari ${forecast?.length ?? 0}`}
              icon={TrendingUp}
              description="Menu dengan proyeksi pertumbuhan positif"
            />
          </>
        )}
      </div>

      {isLoading ? <ChartSkeleton /> : <ForecastChart data={forecast ?? []} />}

      <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm tracking-tight">Tabel Proyeksi 5 Minggu</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              {forecast?.length ?? 0} menu aktif Kopikita Roastery
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="h-48 animate-pulse bg-slate-50 rounded-xl" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="py-3 px-3 font-bold text-slate-500">Menu</th>
                  <th className="py-3 px-3 font-bold text-slate-500 text-right">W1</th>
                  <th className="py-3 px-3 font-bold text-slate-500 text-right">W2</th>
                  <th className="py-3 px-3 font-bold text-slate-500 text-right">W3</th>
                  <th className="py-3 px-3 font-bold text-slate-500 text-right">W4</th>
                  <th className="py-3 px-3 font-bold text-slate-500 text-right">W5</th>
                  <th className="py-3 px-3 font-bold text-slate-500 text-right">Trend</th>
                  <th className="py-3 px-3 font-bold text-slate-500 text-right">CI Low</th>
                  <th className="py-3 px-3 font-bold text-slate-500 text-right">CI High</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.product_id}
                    className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${
                      p.trend_pct > 0 ? 'bg-emerald-50/20' : p.trend_pct < 0 ? 'bg-red-50/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{p.product_name}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                      {p.forecast_next_week.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{p.forecast_w25.toLocaleString('id-ID')}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{p.forecast_w26.toLocaleString('id-ID')}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{p.forecast_w27.toLocaleString('id-ID')}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{p.forecast_w28.toLocaleString('id-ID')}</td>
                    <td className={`py-2.5 px-3 text-right font-black ${getTrendColor(p.trend_pct)}`}>
                      {p.trend_pct > 0 ? '+' : ''}{p.trend_pct}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {p.confidence_interval_low.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {p.confidence_interval_high.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                      Tidak ada menu yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ForecastPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 text-xs font-semibold">Memuat Forecast...</div>}>
      <ForecastContent />
    </Suspense>
  );
}
