'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { safeInventory } from '../../../lib/mock';
import { MetricCard } from '../../../components/metric-card';
import { InventoryChart } from '../../../components/charts/inventory-chart';
import { StockRiskHeatmap } from '../../../components/charts/stock-risk-heatmap';
import { PurchaseOrderTable } from '../../../components/tables/purchase-order-table';
import { InventoryInsightCard } from '../../../components/cards/inventory-insight-card';
import { MetricCardSkeleton } from '../../../components/skeletons/metric-card-skeleton';
import { ChartSkeleton } from '../../../components/skeletons/chart-skeleton';
import {
  Boxes,
  Shield,
  ArrowDownToLine,
  TriangleAlert,
  ShoppingCart,
  DollarSign
} from 'lucide-react';

function InventoryContent() {
  const searchParams = useSearchParams();
  const scenario = searchParams.get('scenario') || 'Base';

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', scenario],
    queryFn: () => safeInventory(scenario),
  });

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Aggregated KPIs
  const totalInventory = inventory ? inventory.reduce((sum, item) => sum + item.current_stock, 0) : 0;
  const totalSafetyStock = inventory ? inventory.reduce((sum, item) => sum + item.safety_stock, 0) : 0;
  const totalROP = inventory ? inventory.reduce((sum, item) => sum + item.reorder_point, 0) : 0;
  const criticalItems = inventory ? inventory.filter(item => item.status.toLowerCase() === 'critical').length : 0;
  const purchaseOrders = inventory ? inventory.filter(item => (item.recommended_order_qty || item.recommended_order) > 0).length : 0;
  const estimatedCost = inventory ? inventory.reduce((sum, item) => sum + (item.estimated_cost || 0), 0) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Inventory Planning</h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">Pantau kecukupan stok, batas pemesanan ulang, dan biaya pembelian bahan baku</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <MetricCardSkeleton key={idx} />
          ))
        ) : (
          <>
            <MetricCard
              title="Total Inventory"
              value={`${totalInventory.toLocaleString('id-ID')} unit`}
              icon={Boxes}
              description="Jumlah total stok produk jadi di gudang"
            />
            <MetricCard
              title="Safety Stock"
              value={`${totalSafetyStock.toLocaleString('id-ID')} unit`}
              icon={Shield}
              description="Batas minimum persediaan pengaman agregat"
            />
            <MetricCard
              title="Reorder Point"
              value={`${totalROP.toLocaleString('id-ID')} unit`}
              icon={ArrowDownToLine}
              description="Titik pemesanan ulang kritis kumulatif"
            />
            <MetricCard
              title="Critical Items"
              value={`${criticalItems} Produk`}
              icon={TriangleAlert}
              description="Produk di bawah stok keselamatan"
              trend={criticalItems > 0 ? { value: criticalItems, isPositive: false } : undefined}
            />
            <MetricCard
              title="Purchase Orders"
              value={`${purchaseOrders} Rekomendasi`}
              icon={ShoppingCart}
              description="Produk yang memerlukan PO baru"
            />
            <MetricCard
              title="Estimated Purchase Cost"
              value={formatIDR(estimatedCost)}
              icon={DollarSign}
              description="Estimasi total dana pengadaan inventaris"
              trend={estimatedCost > 0 ? { value: 12.5, isPositive: false } : undefined}
            />
          </>
        )}
      </div>

      {/* Heatmap & Chart Grid */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <>
            <InventoryChart data={inventory || []} />
            <StockRiskHeatmap data={inventory || []} />
          </>
        )}
      </div>

      {/* PO Table & Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          {isLoading ? (
            <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm h-[200px] animate-pulse"></div>
          ) : (
            <PurchaseOrderTable data={inventory || []} />
          )}
        </div>
        <div>
          <InventoryInsightCard />
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 text-xs font-semibold">Memuat Inventaris...</div>}>
      <InventoryContent />
    </Suspense>
  );
}
