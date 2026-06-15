'use client';

import React, { useState } from 'react';
import { ProductForecast } from '../../lib/types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface ForecastChartProps {
  data: ProductForecast[];
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ data }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    data[0]?.product_id || ''
  );

  const activeProduct =
    data.find((p) => p.product_id === selectedProductId) || data[0];

  if (!activeProduct) {
    return (
      <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm flex items-center justify-center h-[350px]">
        <span className="text-slate-400 text-xs font-semibold">Tidak ada data ramalan</span>
      </div>
    );
  }

  // Format data for Recharts: 5 weeks projections
  const chartData = [
    {
      name: 'W1 (Depan)',
      Forecast: activeProduct.forecast_next_week,
      'Confidence Low': activeProduct.confidence_interval_low,
      'Confidence High': activeProduct.confidence_interval_high,
    },
    {
      name: 'W25',
      Forecast: activeProduct.forecast_w25,
      'Confidence Low': Math.round(activeProduct.forecast_w25 * 0.90),
      'Confidence High': Math.round(activeProduct.forecast_w25 * 1.10),
    },
    {
      name: 'W26',
      Forecast: activeProduct.forecast_w26,
      'Confidence Low': Math.round(activeProduct.forecast_w26 * 0.88),
      'Confidence High': Math.round(activeProduct.forecast_w26 * 1.12),
    },
    {
      name: 'W27',
      Forecast: activeProduct.forecast_w27,
      'Confidence Low': Math.round(activeProduct.forecast_w27 * 0.86),
      'Confidence High': Math.round(activeProduct.forecast_w27 * 1.14),
    },
    {
      name: 'W28',
      Forecast: activeProduct.forecast_w28,
      'Confidence Low': Math.round(activeProduct.forecast_w28 * 0.85),
      'Confidence High': Math.round(activeProduct.forecast_w28 * 1.15),
    },
  ];

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-[380px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-slate-800 text-sm tracking-tight">
            Proyeksi Permintaan 5 Minggu
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Model: Mock/Deterministik (Trend: {activeProduct.trend_pct}%)
          </p>
        </div>

        {/* Product selector dropdown */}
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-[#185FA5] cursor-pointer"
        >
          {data.map((prod) => (
            <option key={prod.product_id} value={prod.product_id}>
              {prod.product_name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            <Line
              type="monotone"
              dataKey="Forecast"
              stroke="#185FA5"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 1 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="Confidence Low"
              stroke="#BA7517"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Confidence High"
              stroke="#1D9E75"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
