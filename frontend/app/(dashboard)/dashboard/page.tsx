'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { safeDashboardSummary, safeForecast } from '../../../lib/mock';
import { MetricCard } from '../../../components/metric-card';
import { ForecastChart } from '../../../components/charts/forecast-chart';
import { AIInsightCard } from '../../../components/cards/ai-insight-card';
import { ExecutiveSummaryCard } from '../../../components/cards/executive-summary-card';
import { MetricCardSkeleton } from '../../../components/skeletons/metric-card-skeleton';
import { ChartSkeleton } from '../../../components/skeletons/chart-skeleton';
import {
  TrendingUp,
  DollarSign,
  PiggyBank,
  Percent,
  AlertTriangle,
  Package
} from 'lucide-react';

function DashboardContent() {
  const searchParams = useSearchParams();
  const scenario = searchParams.get('scenario') || 'Base';

  // React Query with mock fallbacks implemented in safe query fetchers
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboardSummary', scenario],
    queryFn: () => safeDashboardSummary(scenario),
  });

  const { data: forecast, isLoading: loadingForecast } = useQuery({
    queryKey: ['forecast', scenario],
    queryFn: () => safeForecast(scenario),
  });

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const isLoading = loadingSummary || loadingForecast;

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <MetricCardSkeleton key={idx} />
          ))
        ) : (
          <>
            <MetricCard
              title="Forecast Demand"
              value={`${summary?.total_forecast_demand.toLocaleString('id-ID')} unit`}
              icon={TrendingUp}
              description="Total projected demand for next 5 weeks"
              trend={{ value: 8.3, isPositive: true }}
            />
            <MetricCard
              title="Expected Revenue"
              value={formatIDR(summary?.expected_revenue || 0)}
              icon={DollarSign}
              description="Projected sales value based on forecast"
              trend={{ value: 5.2, isPositive: true }}
            />
            <MetricCard
              title="Expected Profit"
              value={formatIDR(summary?.expected_profit || 0)}
              icon={PiggyBank}
              description="Estimated gross margin contribution"
              trend={{ value: 6.8, isPositive: true }}
            />
            <MetricCard
              title="Profit Margin"
              value={`${summary?.profit_margin}%`}
              icon={Percent}
              description="Net business profit margin ratio"
            />
            <MetricCard
              title="Stockout Risk"
              value={`${summary?.stockout_risk_count} Produk`}
              icon={AlertTriangle}
              description="Products below safety stock / ROP levels"
              trend={
                summary?.stockout_risk_count && summary.stockout_risk_count > 0 
                  ? { value: summary.stockout_risk_count, isPositive: false } 
                  : undefined
              }
            />
            <MetricCard
              title="Purchase Orders Needed"
              value={`${summary?.purchase_orders_needed} Pesanan`}
              icon={Package}
              description="Supply replenishment orders recommended"
            />
          </>
        )}
      </div>

      {/* Main Analytics Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Forecast Chart Card */}
        <div className="xl:col-span-2">
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <ForecastChart data={forecast || []} />
          )}
        </div>

        {/* Action / Insight Cards */}
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
