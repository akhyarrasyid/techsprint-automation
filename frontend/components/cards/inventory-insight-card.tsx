import React from 'react';
import { PackageSearch, AlertTriangle, ShieldCheck, ShoppingCart } from 'lucide-react';

export const InventoryInsightCard: React.FC = () => {
  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-[#185FA5]/10 text-[#185FA5] rounded-lg">
          <PackageSearch className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-slate-800 text-sm tracking-tight">
          Inventory Intelligence & Insights
        </h3>
      </div>

      <div className="space-y-3">
        {/* Insight 1 */}
        <div className="p-3 bg-[#A32D2D]/5 border-l-4 border-l-[#A32D2D] rounded-r-lg flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#A32D2D] mt-0.5 shrink-0" />
          <p className="text-slate-600 text-xs font-semibold leading-relaxed">
            <strong className="text-slate-700">PRD001</strong> berada di bawah batas Reorder Point (critical).
          </p>
        </div>

        {/* Insight 2 */}
        <div className="p-3 bg-[#185FA5]/5 border-l-4 border-l-[#185FA5] rounded-r-lg flex items-start gap-2.5">
          <ShoppingCart className="w-4 h-4 text-[#185FA5] mt-0.5 shrink-0" />
          <p className="text-slate-600 text-xs font-semibold leading-relaxed">
            Jumlah pembelian yang disarankan untuk memulihkan stok pengaman adalah sebanyak <strong className="text-slate-700">1.090 unit</strong>.
          </p>
        </div>

        {/* Insight 3 */}
        <div className="p-3 bg-[#BA7517]/5 border-l-4 border-l-[#BA7517] rounded-r-lg flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#BA7517] mt-0.5 shrink-0" />
          <p className="text-slate-600 text-xs font-semibold leading-relaxed">
            <strong className="text-slate-700">PRD004</strong> berisiko mengalami stockout dalam waktu 7 hari jika tidak ada pengiriman pasokan masuk.
          </p>
        </div>

        {/* Insight 4 */}
        <div className="p-3 bg-[#1D9E75]/5 border-l-4 border-l-[#1D9E75] rounded-r-lg flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#1D9E75] mt-0.5 shrink-0" />
          <p className="text-slate-600 text-xs font-semibold leading-relaxed">
            Tingkat pemenuhan pesanan (service level) secara keseluruhan saat ini masih terjaga di atas <strong className="text-slate-700">98%</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
