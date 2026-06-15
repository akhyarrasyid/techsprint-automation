'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FeatureImportance } from '../../lib/types';

interface FeatureImportanceChartProps {
  data: FeatureImportance[];
}

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({ data }) => {
  const COLORS = ['#185FA5', '#1D6FBB', '#2180D1', '#3A93DE', '#5BA7E8'];

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="mb-6">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight">Global Feature Importance (LightGBM)</h3>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
          Kontribusi relatif fitur terhadap akurasi model peramalan demand
        </p>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="feature"
            type="category"
            tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip
            formatter={(val: number) => [`${val}%`, 'Relative Importance']}
            contentStyle={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              fontSize: 11,
              fontWeight: 600
            }}
          />
          <Bar dataKey="importance" radius={[0, 6, 6, 0]} maxBarSize={20}>
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
