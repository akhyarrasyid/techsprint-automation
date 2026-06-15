'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { safeProfitabilityReport, safeInsights } from '../../../lib/mock';
import { ProfitChart } from '../../../components/charts/profit-chart';
import { ScenarioComparisonChart } from '../../../components/charts/scenario-comparison-chart';
import { ProductProfitTable } from '../../../components/tables/product-profit-table';
import { ScenarioInsightCard } from '../../../components/cards/scenario-insight-card';
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

  const { data: report, isLoading } = useQuery({
    queryKey: ['profitability-report', scenario],
    queryFn: () => safeProfitabilityReport(scenario),
  });

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['insights', scenario],
    queryFn: () => safeInsights(scenario),
  });

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Derive KPIs from base scenario
  const baseScenario = report?.scenarios?.find(s => s.name === 'Base');
  const totalRevenue = baseScenario?.total_revenue || 0;
  const totalCOGS = baseScenario?.total_cogs || 0;
  const grossProfit = baseScenario?.gross_profit || 0;
  const marginPct = baseScenario?.margin_pct || 0;
  const serviceLevel = baseScenario?.service_level || 0;
  const holdingCost = baseScenario?.holding_cost || 0;

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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {isLoading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <ProfitChart data={report?.by_product || []} />
            <ScenarioComparisonChart scenarios={report?.scenarios || []} />
          </>
        )}
      </div>

      {/* Table & Insights Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          {isLoading ? (
            <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm h-[200px] animate-pulse"></div>
          ) : (
            <ProductProfitTable data={report?.by_product || []} />
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
