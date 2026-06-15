import React from 'react';
import { ProductInventory } from '../../lib/types';
import { AlertCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface StockRiskHeatmapProps {
  data: ProductInventory[];
}

export const StockRiskHeatmap: React.FC<StockRiskHeatmapProps> = ({ data }) => {
  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
      <div className="mb-4">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight">
          Peta Risiko Ketersediaan Stok (Stockout Heatmap)
        </h3>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
          Identifikasi visual tingkat keparahan risiko kehabisan stok per produk
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {data.map((item) => {
          const isCritical = item.status === 'critical';
          const isWarning = item.status === 'warning';
          
          let cardBg = 'bg-[#1D9E75]/10 border-[#1D9E75]/20 text-[#1D9E75]';
          let badgeText = 'Low Risk';
          let Icon = ShieldCheck;

          if (isCritical) {
            cardBg = 'bg-[#A32D2D]/10 border-[#A32D2D]/20 text-[#A32D2D]';
            badgeText = 'High Risk';
            Icon = AlertCircle;
          } else if (isWarning) {
            cardBg = 'bg-[#BA7517]/10 border-[#BA7517]/20 text-[#BA7517]';
            badgeText = 'Medium Risk';
            Icon = AlertTriangle;
          }

          return (
            <div 
              key={item.product_id}
              className={`p-4 rounded-xl border flex flex-col justify-between h-28 transition-all duration-150 ${cardBg}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase opacity-80">{item.product_id}</span>
                  <span className="text-xs font-bold mt-0.5 truncate max-w-[120px]">{item.product_name}</span>
                </div>
                <Icon className="w-4 h-4 shrink-0" />
              </div>

              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[8px] opacity-75 font-semibold">Stok Aktual</span>
                  <span className="text-xs font-black">{item.current_stock.toLocaleString('id-ID')}</span>
                </div>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-white/40 rounded">
                  {badgeText}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
