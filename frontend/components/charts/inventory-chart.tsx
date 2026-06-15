'use client';

import React from 'react';
import { ProductInventory } from '../../lib/types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface InventoryChartProps {
  data: ProductInventory[];
}

export const InventoryChart: React.FC<InventoryChartProps> = ({ data }) => {
  const chartData = data.map((item) => ({
    name: item.product_name.length > 15 ? item.product_name.substring(0, 15) + '...' : item.product_name,
    'Current Stock': item.current_stock,
    'Safety Stock': item.safety_stock,
    'Reorder Point': item.reorder_point,
    'Recommended Order': item.recommended_order_qty || item.recommended_order,
  }));

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-[380px]">
      <div className="mb-6">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight">
          Perbandingan Level Inventaris & Batas Reorder (ROP)
        </h3>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
          Tingkat stok aktual vs batas aman keselamatan & saran pemesanan baru
        </p>
      </div>

      <div className="flex-1 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis 
              dataKey="name" 
              stroke="#94A3B8" 
              fontSize={10} 
              tickLine={false} 
            />
            <YAxis 
              stroke="#94A3B8" 
              fontSize={10} 
              tickLine={false}
              axisLine={false} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#FFF', 
                border: '1px solid #E2E8F0', 
                borderRadius: '8px',
                fontSize: '11px',
                color: '#334155'
              }} 
            />
            <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" />
            <Bar dataKey="Current Stock" fill="#185FA5" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Safety Stock" fill="#1D9E75" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Reorder Point" fill="#BA7517" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Recommended Order" fill="#A32D2D" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
