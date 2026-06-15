'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { safeProfitabilityReport, safeDashboardSummary } from '../../../lib/mock';
import { MetricCard } from '../../../components/metric-card';
import {
  DollarSign,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Percent,
  BarChart3,
  SlidersHorizontal
} from 'lucide-react';

interface SliderConfig {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit: string;
  formatValue: (v: number) => string;
}

const SLIDERS: SliderConfig[] = [
  {
    id: 'demand',
    label: 'Demand Adjustment',
    min: -50,
    max: 50,
    step: 5,
    defaultValue: 0,
    unit: '%',
    formatValue: (v) => v >= 0 ? `+${v}%` : `${v}%`
  },
  {
    id: 'leadTime',
    label: 'Supplier Lead Time',
    min: 1,
    max: 14,
    step: 1,
    defaultValue: 4,
    unit: 'hari',
    formatValue: (v) => `${v} hari`
  },
  {
    id: 'materialCost',
    label: 'Raw Material Cost',
    min: -20,
    max: 20,
    step: 2,
    defaultValue: 0,
    unit: '%',
    formatValue: (v) => v >= 0 ? `+${v}%` : `${v}%`
  },
  {
    id: 'sellingPrice',
    label: 'Selling Price',
    min: -20,
    max: 20,
    step: 2,
    defaultValue: 0,
    unit: '%',
    formatValue: (v) => v >= 0 ? `+${v}%` : `${v}%`
  }
];

function DigitalTwinContent() {
  const [params, setParams] = useState<Record<string, number>>({
    demand: 0,
    leadTime: 4,
    materialCost: 0,
    sellingPrice: 0,
  });

  const { data: baseReport } = useQuery({
    queryKey: ['profitability-report', 'Base'],
    queryFn: () => safeProfitabilityReport('Base'),
  });

  const { data: baseSummary } = useQuery({
    queryKey: ['dashboard-summary', 'Base'],
    queryFn: () => safeDashboardSummary('Base'),
  });

  const updateParam = (id: string, value: number) => {
    setParams(prev => ({ ...prev, [id]: value }));
  };

  const resetAll = () => {
    setParams({ demand: 0, leadTime: 4, materialCost: 0, sellingPrice: 0 });
  };

  // ── SIMULATION ENGINE ──
  const simulation = useMemo(() => {
    const base = baseReport?.scenarios?.find(s => s.name === 'Base');
    const summary = baseSummary;

    if (!base || !summary) {
      return {
        revenue: 0, profit: 0, margin: 0, serviceLevel: 98,
        stockoutRisk: 0, holdingCost: 0, delta: { revenue: 0, profit: 0, margin: 0, serviceLevel: 0 }
      };
    }

    const demandMultiplier = 1 + (params.demand / 100);
    const costMultiplier = 1 + (params.materialCost / 100);
    const priceMultiplier = 1 + (params.sellingPrice / 100);

    const revenue = base.total_revenue * demandMultiplier * priceMultiplier;
    const cogs = base.total_cogs * demandMultiplier * costMultiplier;
    const profit = revenue - cogs;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    // Service level: drops with increased lead time and high demand
    const baseSL = 98;
    const leadTimePenalty = Math.max(0, (params.leadTime - 4) * 3.2);
    const demandPenalty = params.demand > 20 ? (params.demand - 20) * 0.5 : 0;
    const serviceLevel = Math.max(50, baseSL - leadTimePenalty - demandPenalty);

    // Stockout risk: increases with high demand and high lead time
    const stockoutRisk = params.demand > 10 && params.leadTime > 5 ? 3
      : params.demand > 10 || params.leadTime > 6 ? 2
      : params.leadTime > 4 ? 1 : 0;

    // Holding cost: increases with lead time
    const holdingCost = base.holding_cost * (1 + (params.leadTime - 4) * 0.12);

    return {
      revenue: Math.round(revenue),
      profit: Math.round(profit),
      margin: Math.round(margin * 10) / 10,
      serviceLevel: Math.round(serviceLevel * 10) / 10,
      stockoutRisk,
      holdingCost: Math.round(holdingCost),
      delta: {
        revenue: Math.round(revenue - base.total_revenue),
        profit: Math.round(profit - base.gross_profit),
        margin: Math.round((margin - base.margin_pct) * 10) / 10,
        serviceLevel: Math.round((serviceLevel - baseSL) * 10) / 10,
      }
    };
  }, [params, baseReport, baseSummary]);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getDeltaColor = (val: number) => val > 0 ? 'text-[#1D9E75]' : val < 0 ? 'text-[#A32D2D]' : 'text-slate-400';
  const getDeltaPrefix = (val: number) => val > 0 ? '+' : '';

  const getRiskLabel = () => {
    if (simulation.serviceLevel >= 95) return { label: 'LOW RISK', color: 'bg-[#1D9E75]/10 text-[#1D9E75] border-[#1D9E75]/20' };
    if (simulation.serviceLevel >= 85) return { label: 'MEDIUM RISK', color: 'bg-[#BA7517]/10 text-[#BA7517] border-[#BA7517]/20' };
    return { label: 'HIGH RISK', color: 'bg-[#A32D2D]/10 text-[#A32D2D] border-[#A32D2D]/20' };
  };

  const risk = getRiskLabel();

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-[#185FA5]" />
          Digital Twin Simulator
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">Simulasikan berbagai skenario bisnis secara real-time — demand, supply, cost, dan price</p>
      </div>

      {/* Slider Controls Panel */}
      <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-slate-800 text-sm tracking-tight">Simulation Controls</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Geser slider untuk melihat dampak real-time terhadap KPI bisnis</p>
          </div>
          <button
            onClick={resetAll}
            className="px-3 py-1.5 text-[10px] font-bold bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Reset All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {SLIDERS.map((slider) => (
            <div key={slider.id} className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700">{slider.label}</span>
                <span className={`text-xs font-black ${
                  params[slider.id] !== slider.defaultValue ? 'text-[#185FA5]' : 'text-slate-400'
                }`}>
                  {slider.formatValue(params[slider.id])}
                </span>
              </div>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={params[slider.id]}
                onChange={(e) => updateParam(slider.id, Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#185FA5]"
              />
              <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                <span>{slider.formatValue(slider.min)}</span>
                <span>{slider.formatValue(slider.max)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Status Banner */}
      <div className={`flex items-center justify-between px-6 py-4 rounded-[20px] border ${risk.color}`}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-wider">{risk.label}</span>
        </div>
        <span className="text-xs font-bold">
          Service Level: {simulation.serviceLevel}% | Stockout Products: {simulation.stockoutRisk}
        </span>
      </div>

      {/* Simulated KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Simulated Revenue</span>
              <p className="text-lg font-black text-slate-800 mt-1">{formatIDR(simulation.revenue)}</p>
            </div>
            <div className="p-2 bg-[#185FA5]/10 text-[#185FA5] rounded-xl"><DollarSign className="w-4 h-4" /></div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-50">
            <span className={`text-xs font-black ${getDeltaColor(simulation.delta.revenue)}`}>
              {getDeltaPrefix(simulation.delta.revenue)}{formatIDR(simulation.delta.revenue)} vs Base
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Simulated Net Profit</span>
              <p className="text-lg font-black text-slate-800 mt-1">{formatIDR(simulation.profit)}</p>
            </div>
            <div className="p-2 bg-[#1D9E75]/10 text-[#1D9E75] rounded-xl"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-50">
            <span className={`text-xs font-black ${getDeltaColor(simulation.delta.profit)}`}>
              {getDeltaPrefix(simulation.delta.profit)}{formatIDR(simulation.delta.profit)} vs Base
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gross Margin</span>
              <p className="text-lg font-black text-slate-800 mt-1">{simulation.margin}%</p>
            </div>
            <div className="p-2 bg-[#BA7517]/10 text-[#BA7517] rounded-xl"><Percent className="w-4 h-4" /></div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-50">
            <span className={`text-xs font-black ${getDeltaColor(simulation.delta.margin)}`}>
              {getDeltaPrefix(simulation.delta.margin)}{simulation.delta.margin}% vs Base
            </span>
          </div>
        </div>

        <MetricCard
          title="Service Level"
          value={`${simulation.serviceLevel}%`}
          icon={ShieldCheck}
          description="Tingkat ketersediaan produk saat ini"
          trend={simulation.delta.serviceLevel !== 0 ? { value: Math.abs(simulation.delta.serviceLevel), isPositive: simulation.delta.serviceLevel > 0 } : undefined}
        />

        <MetricCard
          title="Stockout Risk"
          value={`${simulation.stockoutRisk} Produk`}
          icon={AlertTriangle}
          description="Produk yang berisiko kehabisan stok"
        />

        <MetricCard
          title="Holding Cost"
          value={formatIDR(simulation.holdingCost)}
          icon={BarChart3}
          description="Biaya penyimpanan persediaan (simulated)"
        />
      </div>

      {/* Scenario Impact Summary */}
      <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight mb-4">Impact Analysis Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {simulation.delta.revenue !== 0 && (
            <div className={`p-4 rounded-xl border ${simulation.delta.revenue > 0 ? 'bg-[#1D9E75]/5 border-[#1D9E75]/10' : 'bg-[#A32D2D]/5 border-[#A32D2D]/10'}`}>
              <span className="text-xs font-bold text-slate-700">Revenue Impact</span>
              <p className={`text-[10px] font-semibold mt-1 ${getDeltaColor(simulation.delta.revenue)}`}>
                {simulation.delta.revenue > 0
                  ? `Revenue meningkat ${formatIDR(simulation.delta.revenue)} dari skenario base. Pertumbuhan ini didorong oleh penyesuaian demand dan/atau harga jual.`
                  : `Revenue menurun ${formatIDR(Math.abs(simulation.delta.revenue))} dari skenario base. Penurunan demand dan/atau harga menekan pendapatan.`
                }
              </p>
            </div>
          )}
          {simulation.delta.profit !== 0 && (
            <div className={`p-4 rounded-xl border ${simulation.delta.profit > 0 ? 'bg-[#1D9E75]/5 border-[#1D9E75]/10' : 'bg-[#A32D2D]/5 border-[#A32D2D]/10'}`}>
              <span className="text-xs font-bold text-slate-700">Profit Impact</span>
              <p className={`text-[10px] font-semibold mt-1 ${getDeltaColor(simulation.delta.profit)}`}>
                {simulation.delta.profit > 0
                  ? `Profit naik ${formatIDR(simulation.delta.profit)}. Perbaikan margin dari efisiensi cost atau peningkatan volume penjualan.`
                  : `Profit turun ${formatIDR(Math.abs(simulation.delta.profit))}. Kenaikan biaya bahan baku atau penurunan permintaan menekan profitabilitas.`
                }
              </p>
            </div>
          )}
          {simulation.delta.serviceLevel < 0 && (
            <div className="p-4 bg-[#BA7517]/5 border border-[#BA7517]/10 rounded-xl">
              <span className="text-xs font-bold text-slate-700">Service Level Warning</span>
              <p className="text-[10px] font-semibold mt-1 text-[#BA7517]">
                Service level turun {Math.abs(simulation.delta.serviceLevel)}% akibat peningkatan lead time supplier.
                Disarankan meningkatkan safety stock untuk material dengan lead time &gt;4 hari.
              </p>
            </div>
          )}
          {simulation.delta.revenue === 0 && simulation.delta.profit === 0 && simulation.delta.serviceLevel === 0 && (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl col-span-full text-center">
              <span className="text-xs font-bold text-slate-400">Geser slider untuk melihat dampak perubahan parameter terhadap KPI bisnis</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DigitalTwinPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 text-xs font-semibold">Memuat Digital Twin...</div>}>
      <DigitalTwinContent />
    </Suspense>
  );
}
