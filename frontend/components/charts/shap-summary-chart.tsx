'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SHAPValue } from '../../lib/types';

interface SHAPSummaryChartProps {
  data: SHAPValue[];
}

export const SHAPSummaryChart: React.FC<SHAPSummaryChartProps> = ({ data }) => {
  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="mb-6">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight">SHAP Feature Impact Summary</h3>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
          Arah pengaruh (+/-) dari setiap parameter terhadap estimasi volume demand
        </p>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          layout="vertical"
          data={data}
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
            formatter={(val: number) => [val > 0 ? `+${val}` : `${val}`, 'SHAP Impact Value']}
            contentStyle={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              fontSize: 11,
              fontWeight: 600
            }}
          />
          <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1.5} />
          <Bar dataKey="shap_value" maxBarSize={20}>
            {data.map((entry, idx) => (
              <rect
                key={idx}
                fill={entry.shap_value >= 0 ? '#1D9E75' : '#A32D2D'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
