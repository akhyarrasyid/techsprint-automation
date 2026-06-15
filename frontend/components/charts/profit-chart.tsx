'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ProductProfit } from '../../lib/types';

interface ProfitChartProps {
  data: ProductProfit[];
}

export const ProfitChart: React.FC<ProfitChartProps> = ({ data }) => {
  const sortedData = [...data].sort((a, b) => b.gross_profit - a.gross_profit);

  const formatIDR = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}rb`;
    return val.toString();
  };

  const COLORS = ['#185FA5', '#1D6FBB', '#2180D1', '#3A93DE', '#5BA7E8'];

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="mb-6">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight">Gross Profit by Product</h3>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
          Komparasi laba kotor per lini produk jadi (Base Scenario)
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sortedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="product_name"
            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={-15}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tickFormatter={formatIDR}
            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip
            formatter={(val: number) => [`Rp ${val.toLocaleString('id-ID')}`, 'Gross Profit']}
            contentStyle={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              fontSize: 11,
              fontWeight: 600
            }}
          />
          <Bar dataKey="gross_profit" radius={[8, 8, 0, 0]} maxBarSize={48}>
            {sortedData.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Margin annotation strip */}
      <div className="mt-4 flex gap-2 overflow-x-auto">
        {sortedData.map((item) => (
          <div key={item.product_id} className="shrink-0 px-3 py-2 bg-slate-50 rounded-lg text-center">
            <span className="text-[9px] text-slate-400 font-bold block">{item.product_name.split(' ').slice(-1)[0]}</span>
            <span className="text-xs font-black text-[#185FA5]">{item.margin_pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
