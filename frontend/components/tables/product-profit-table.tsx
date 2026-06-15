import React from 'react';
import { ProductProfit } from '../../lib/types';
import { TrendingUp } from 'lucide-react';

interface ProductProfitTableProps {
  data: ProductProfit[];
}

export const ProductProfitTable: React.FC<ProductProfitTableProps> = ({ data }) => {
  // Sort by gross profit descending
  const sorted = [...data].sort((a, b) => b.gross_profit - a.gross_profit);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
      <div className="p-6 border-b border-slate-100 flex items-center gap-2">
        <div className="p-1.5 bg-[#1D9E75]/10 text-[#1D9E75] rounded-lg">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm tracking-tight">
            Product Profitability Breakdown
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Revenue, COGS, dan margin kotor per lini produk — diurutkan berdasarkan gross profit tertinggi
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <th className="py-3.5 px-6">#</th>
              <th className="py-3.5 px-4">Product</th>
              <th className="py-3.5 px-4 text-right">Revenue</th>
              <th className="py-3.5 px-4 text-right">COGS</th>
              <th className="py-3.5 px-4 text-right">Gross Profit</th>
              <th className="py-3.5 px-6 text-right">Margin %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {sorted.map((item, idx) => (
              <tr
                key={item.product_id}
                className="hover:bg-slate-50/50 transition-colors duration-150"
              >
                <td className="py-4 px-6">
                  <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-black ${
                    idx === 0 ? 'bg-[#185FA5] text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {idx + 1}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-col">
                    <span className="text-slate-900 font-bold">{item.product_name}</span>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">{item.product_id}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right text-slate-600">
                  {formatIDR(item.revenue)}
                </td>
                <td className="py-4 px-4 text-right text-slate-500 font-medium">
                  {formatIDR(item.cogs)}
                </td>
                <td className="py-4 px-4 text-right font-black text-[#1D9E75]">
                  {formatIDR(item.gross_profit)}
                </td>
                <td className="py-4 px-6 text-right">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                    item.margin_pct >= 35
                      ? 'bg-[#1D9E75]/10 text-[#1D9E75]'
                      : item.margin_pct >= 30
                      ? 'bg-[#BA7517]/10 text-[#BA7517]'
                      : 'bg-[#A32D2D]/10 text-[#A32D2D]'
                  }`}>
                    {item.margin_pct.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
