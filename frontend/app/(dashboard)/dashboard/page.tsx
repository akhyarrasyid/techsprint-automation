'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardSummary, fetchForecast } from '../../../lib/api';
import { MetricCard } from '../../../components/metric-card';
import { ForecastChart } from '../../../components/charts/forecast-chart';
import { AIInsightCard } from '../../../components/cards/ai-insight-card';
import { ExecutiveSummaryCard } from '../../../components/cards/executive-summary-card';
import { MetricCardSkeleton } from '../../../components/skeletons/metric-card-skeleton';
import { ChartSkeleton } from '../../../components/skeletons/chart-skeleton';
import ErrorBanner from '../../../components/error-banner';
import EmptyState from '../../../components/empty-state';
import {
  TrendingUp,
  DollarSign,
  PiggyBank,
  Percent,
  AlertTriangle,
  Package,
} from 'lucide-react';

function DashboardContent() {
  const searchParams = useSearchParams();
  const scenario = searchParams.get('scenario') || 'Base';

  const {
    data: summary,
    isLoading: loadingSummary,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['dashboardSummary', scenario],
    queryFn: () => fetchDashboardSummary(scenario),
  });

  const {
    data: forecast,
    isLoading: loadingForecast,
    error: forecastError,
    refetch: refetchForecast,
  } = useQuery({
    queryKey: ['forecast', scenario],
    queryFn: () => fetchForecast(scenario),
  });

  const formatIDR = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const isLoading = loadingSummary || loadingForecast;
  const error = summaryError || forecastError;

  if (!isLoading && error) {
    return (
      <ErrorBanner
        message={(error as Error).message || 'Tidak dapat terhubung ke server backend.'}
        onRetry={() => { refetchSummary(); refetchForecast(); }}
      />
    );
  }

  if (!isLoading && !summary && !error) {
    return (
      <EmptyState
        title="Pipeline belum dijalankan"
        description="Upload file sales history dan jalankan pipeline untuk melihat data dashboard."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, idx) => <MetricCardSkeleton key={idx} />)
        ) : (
          <>
            <MetricCard
              title="Forecast Demand"
              value={`${summary?.total_forecast_demand.toLocaleString('id-ID')} unit`}
              icon={TrendingUp}
              description="Total proyeksi permintaan minggu depan"
              trend={{ value: 8.3, isPositive: true }}
            />
            <MetricCard
              title="Estimasi Pendapatan"
              value={formatIDR(summary?.expected_revenue || 0)}
              icon={DollarSign}
              description="Nilai penjualan proyeksi berdasarkan forecast"
              trend={{ value: 5.2, isPositive: true }}
            />
            <MetricCard
              title="Estimasi Profit"
              value={formatIDR(summary?.expected_profit || 0)}
              icon={PiggyBank}
              description="Kontribusi margin kotor yang diperkirakan"
              trend={{ value: 6.8, isPositive: true }}
            />
            <MetricCard
              title="Profit Margin"
              value={`${summary?.profit_margin ?? 0}%`}
              icon={Percent}
              description="Rasio margin keuntungan bersih bisnis"
            />
            <MetricCard
              title="Risiko Kehabisan Stok"
              value={`${summary?.stockout_risk_count ?? 0} Bahan Baku`}
              icon={AlertTriangle}
              description="Bahan di bawah safety stock / titik reorder"
              trend={
                (summary?.stockout_risk_count ?? 0) > 0
                  ? { value: summary!.stockout_risk_count, isPositive: false }
                  : undefined
              }
            />
            <MetricCard
              title="Purchase Order Dibutuhkan"
              value={`${summary?.purchase_orders_needed ?? 0} Pesanan`}
              icon={Package}
              description="Rekomendasi pengisian stok dari supplier"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          {isLoading ? <ChartSkeleton /> : <ForecastChart data={forecast || []} />}
        </div>
        <div className="space-y-6">
          <AIInsightCard />
          <ExecutiveSummaryCard />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 text-xs font-semibold">Memuat Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
