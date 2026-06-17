'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchMRP, fetchDashboardSummary } from '../../../lib/api';
import ErrorBanner from '../../../components/error-banner';
import EmptyState from '../../../components/empty-state';
import { MRPAccordion } from '../../../components/mrp/mrp-accordion';
import { MaterialShortageTable } from '../../../components/tables/material-shortage-table';
import { OrderScheduleTimeline } from '../../../components/charts/order-schedule-timeline';
import { MRPInsightCard } from '../../../components/cards/mrp-insight-card';
import { MetricCard } from '../../../components/metric-card';
import { MetricCardSkeleton } from '../../../components/skeletons/metric-card-skeleton';
import {
  Boxes,
  FileSpreadsheet,
  DollarSign,
  AlertTriangle,
  Clock,
  TrendingDown
} from 'lucide-react';

function MRPContent() {
  const searchParams = useSearchParams();
  const scenario = searchParams.get('scenario') || 'Base';
  const [delayDays, setDelayDays] = useState(0);

  // Fetch MRP data
  const { data: mrp, isLoading, error, refetch } = useQuery({
    queryKey: ['mrp', scenario],
    queryFn: () => fetchMRP(scenario),
  });

  if (!isLoading && error) {
    return <ErrorBanner message={(error as Error).message} onRetry={refetch} />;
  }
  if (!isLoading && !mrp?.length) {
    return <EmptyState title="Belum ada data MRP" description="Upload file sales history dan jalankan pipeline terlebih dahulu." />;
  }

  // Fetch Dashboard Summary for base profit value
  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary', scenario],
    queryFn: () => fetchDashboardSummary(scenario),
  });

  // Client-side simulation of delay on expected arrival dates & lead times
  const simulatedMrp = mrp?.map((prod) => {
    return {
      ...prod,
      materials: prod.materials.map((mat) => {
        // Adjust lead time
        const newLeadTime = mat.lead_time + delayDays;
        
        // Calculate new expected arrival date based on 15 June 2026 anchor
        const baseDate = new Date(2026, 5, 15); // June is 5 in JS Date
        baseDate.setDate(baseDate.getDate() + newLeadTime);
        
        const day = baseDate.getDate();
        const months = [
          'June', 'July', 'August', 'September', 'October', 'November',
          'December', 'January', 'February', 'March', 'April', 'May'
        ];
        const monthStr = months[baseDate.getMonth() - 5] || 'June';
        const year = baseDate.getFullYear();
        const newArrivalStr = `${day} ${monthStr} ${year}`;

        return {
          ...mat,
          lead_time: newLeadTime,
          expected_arrival: newArrivalStr
        };
      })
    };
  });

  // Calculations
  const totalProductionTarget = mrp ? mrp.reduce((sum, item) => sum + item.recommended_order, 0) : 0;
  
  // Count unique materials
  const uniqueMaterialIds = new Set<string>();
  mrp?.forEach(prod => prod.materials.forEach(m => uniqueMaterialIds.add(m.material_id)));
  const totalMaterialsNeeded = uniqueMaterialIds.size;

  // Total procurement cost
  const rawProcurementCost = mrp 
    ? mrp.reduce((sum, prod) => 
        sum + prod.materials.reduce((mSum, m) => mSum + m.order_cost, 0), 0)
    : 0;

  // Base profit
  const baseProfit = summary ? summary.expected_profit : 27790000;
  // Simulated profit penalty: 2.2% reduction of profit per day of delay
  const simulatedProfit = Math.max(0, baseProfit * (1 - (delayDays * 0.022)));

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Supply chain risk evaluation
  const getRiskDetails = () => {
    if (delayDays === 0) return { label: 'LOW RISK', color: 'text-[#1D9E75] bg-[#1D9E75]/10 border-[#1D9E75]/20' };
    if (delayDays <= 4) return { label: 'MEDIUM RISK', color: 'text-[#BA7517] bg-[#BA7517]/10 border-[#BA7517]/20' };
    return { label: 'HIGH RISK', color: 'text-[#A32D2D] bg-[#A32D2D]/10 border-[#A32D2D]/20' };
  };

  const risk = getRiskDetails();

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Material Requirements Planning (MRP)</h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">Explode Bill of Materials (BOM), kelola shortage bahan baku, dan simulasikan risiko rantai pasok</p>
      </div>

      {/* Supplier Delay Simulation Controls */}
      <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#185FA5]/10 text-[#185FA5] rounded-xl shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Supplier Lead Time Simulator</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Simulasikan dampak keterlambatan pengiriman material ke lini produksi</p>
          </div>
        </div>

        <div className="flex-1 max-w-md flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Keterlambatan Supplier:</span>
            <span className={delayDays > 0 ? 'text-[#A32D2D]' : 'text-[#1D9E75]'}>
              {delayDays === 0 ? 'Tepat Waktu' : `+${delayDays} Hari Delay`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            value={delayDays}
            onChange={(e) => setDelayDays(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#185FA5]"
          />
          <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase">
            <span>0 Hari (On-Time)</span>
            <span>5 Hari</span>
            <span>10 Hari (Max Disruption)</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <MetricCardSkeleton key={idx} />
          ))
        ) : (
          <>
            <MetricCard
              title="Target Produksi"
              value={`${totalProductionTarget.toLocaleString('id-ID')} unit`}
              icon={Boxes}
              description="Jumlah total estimasi PO produk jadi"
            />
            <MetricCard
              title="Kebutuhan Material"
              value={`${totalMaterialsNeeded} Kategori`}
              icon={FileSpreadsheet}
              description="Kategori bahan baku aktif di BOM"
            />
            <MetricCard
              title="Total Nilai Pengadaan"
              value={formatIDR(rawProcurementCost)}
              icon={DollarSign}
              description="Estimasi biaya pembelian material yang shortage"
            />
            <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Simulated Net Profit</span>
                  <span className="text-lg font-black text-slate-800 mt-1">{formatIDR(simulatedProfit)}</span>
                </div>
                <div className="p-2 bg-[#A32D2D]/10 text-[#A32D2D] rounded-xl">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-3">
                <span className="text-[9px] text-slate-400 font-bold">LOGISTICS RISK STATUS</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase ${risk.color}`}>
                  {risk.label}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Nested Accordion & Shortage Table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {isLoading ? (
            <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm h-[200px] animate-pulse"></div>
          ) : (
            <>
              <MRPAccordion data={simulatedMrp || []} />
              <MaterialShortageTable mrpData={simulatedMrp || []} />
            </>
          )}
        </div>

        {/* Timeline & Insights */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm h-[300px] animate-pulse"></div>
          ) : (
            <>
              <OrderScheduleTimeline mrpData={simulatedMrp || []} />
              <MRPInsightCard mrpData={simulatedMrp || []} supplierDelayDays={delayDays} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MRPPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 text-xs font-semibold">Memuat MRP...</div>}>
      <MRPContent />
    </Suspense>
  );
}
