'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchProfitability, fetchInsights } from '../../../lib/api';
import ErrorBanner from '../../../components/error-banner';
import EmptyState from '../../../components/empty-state';
import { ProfitChart } from '../../../components/charts/profit-chart';
import { ProductProfitTable } from '../../../components/tables/product-profit-table';
import { ScenarioInsightCard } from '../../../components/cards/scenario-insight-card';
import type { ProductProfit } from '../../../lib/types';
import { MetricCard } from '../../../components/metric-card';
import { MetricCardSkeleton } from '../../../components/skeletons/metric-card-skeleton';
import { ChartSkeleton } from '../../../components/skeletons/chart-skeleton';
import {
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Percent,
  Layers,
  BarChart3
} from 'lucide-react';

function ProfitContent() {
  const searchParams = useSearchParams();
  const scenario = searchParams.get('scenario') || 'Base';

  const { data: profitItems, isLoading, error, refetch } = useQuery({
    queryKey: ['profitability', scenario],
    queryFn: () => fetchProfitability(scenario),
  });

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['insights', scenario],
    queryFn: () => fetchInsights(scenario),
  });

  if (!isLoading && error) {
    return <ErrorBanner message={(error as Error).message} onRetry={refetch} />;
  }
  if (!isLoading && !profitItems?.length) {
    return <EmptyState title="Belum ada data profitabilitas" description="Upload file sales history dan jalankan pipeline terlebih dahulu." />;
  }

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Derive KPIs by aggregating across all products
  const totalRevenue = profitItems?.reduce((s, p) => s + p.estimated_revenue, 0) ?? 0;
  const totalCOGS = profitItems?.reduce((s, p) => s + p.estimated_cost, 0) ?? 0;
  const grossProfit = profitItems?.reduce((s, p) => s + p.estimated_profit, 0) ?? 0;
  const marginPct = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 1000) / 10 : 0;
  const serviceLevel = 97.2;
  const holdingCost = Math.round(totalCOGS * 0.15);

  // Map to shape expected by ProfitChart / ProductProfitTable
  const byProduct: ProductProfit[] = (profitItems ?? []).map((p) => ({
    product_id: p.product_id,
    product_name: p.product_name,
    revenue: p.estimated_revenue,
    cogs: p.estimated_cost,
    gross_profit: p.estimated_profit,
    margin_pct: p.selling_price > 0 ? Math.round((p.margin_per_unit / p.selling_price) * 1000) / 10 : 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Profitability & Scenario Engine</h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">Analisis margin kotor, simulasi multi-skenario, dan rekomendasi otomatis AI</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <MetricCardSkeleton key={idx} />
          ))
        ) : (
          <>
            <MetricCard
              title="Total Revenue"
              value={formatIDR(totalRevenue)}
              icon={DollarSign}
              description="Total pendapatan dari seluruh lini produk"
            />
            <MetricCard
              title="Total COGS"
              value={formatIDR(totalCOGS)}
              icon={Layers}
              description="Harga pokok produksi agregat"
            />
            <MetricCard
              title="Gross Profit"
              value={formatIDR(grossProfit)}
              icon={TrendingUp}
              description="Laba kotor setelah dikurangi COGS"
              trend={{ value: marginPct, isPositive: true }}
            />
            <MetricCard
              title="Gross Margin"
              value={`${marginPct}%`}
              icon={Percent}
              description="Rasio laba kotor terhadap pendapatan"
            />
            <MetricCard
              title="Service Level"
              value={`${serviceLevel}%`}
              icon={ShieldCheck}
              description="Tingkat ketersediaan stok produk jadi"
              trend={serviceLevel < 95 ? { value: 98 - serviceLevel, isPositive: false } : undefined}
            />
            <MetricCard
              title="Holding Cost"
              value={formatIDR(holdingCost)}
              icon={BarChart3}
              description="Biaya penyimpanan persediaan (15% annually)"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? <ChartSkeleton /> : <ProfitChart data={byProduct} />}
      </div>

      {/* Table & Insights Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          {isLoading ? (
            <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm h-[200px] animate-pulse"></div>
          ) : (
            <ProductProfitTable data={byProduct} />
          )}
        </div>
        <div>
          {insightsLoading ? (
            <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm h-[300px] animate-pulse"></div>
          ) : (
            <ScenarioInsightCard insights={insights || []} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfitPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 text-xs font-semibold">Memuat Profitabilitas...</div>}>
      <ProfitContent />
    </Suspense>
  );
}
