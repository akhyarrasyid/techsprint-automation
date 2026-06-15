'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { ScenarioComparison } from '../../lib/types';

interface ScenarioComparisonChartProps {
  scenarios: ScenarioComparison[];
}

export const ScenarioComparisonChart: React.FC<ScenarioComparisonChartProps> = ({ scenarios }) => {
  const chartData = scenarios.map((s) => ({
    name: s.name.length > 18 ? s.name.slice(0, 16) + '…' : s.name,
    fullName: s.name,
    'Gross Profit': s.gross_profit,
    'Margin %': s.margin_pct,
    'Service Level': s.service_level,
  }));

  const formatIDR = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}rb`;
    return val.toString();
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="mb-6">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight">Scenario Comparison Analysis</h3>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
          Perbandingan dampak 4 skenario bisnis terhadap profitabilitas dan service level
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={-10}
            textAnchor="end"
            height={50}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={formatIDR}
            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            width={50}
            domain={[0, 100]}
          />
          <Tooltip
            formatter={(val: number, name: string) => {
              if (name === 'Gross Profit') return [`Rp ${val.toLocaleString('id-ID')}`, name];
              return [`${val}%`, name];
            }}
            contentStyle={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              fontSize: 11,
              fontWeight: 600
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: 10, fontWeight: 700 }}
            iconSize={8}
          />
          <Bar yAxisId="left" dataKey="Gross Profit" fill="#185FA5" radius={[6, 6, 0, 0]} maxBarSize={36} />
          <Bar yAxisId="right" dataKey="Margin %" fill="#1D9E75" radius={[6, 6, 0, 0]} maxBarSize={36} />
          <Bar yAxisId="right" dataKey="Service Level" fill="#BA7517" radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>

      {/* Scenario summary chips */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        {scenarios.map((s) => (
          <div key={s.name} className="px-3 py-2 bg-slate-50 rounded-xl text-center border border-slate-100">
            <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">{s.name}</span>
            <span className="text-xs font-black text-[#185FA5] block mt-0.5">{s.margin_pct}%</span>
            <span className="text-[9px] text-slate-400 font-semibold">margin</span>
          </div>
        ))}
      </div>
    </div>
  );
};
