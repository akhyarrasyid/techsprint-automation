'use client';

import React from 'react';
import { ArrowUp, ArrowDown, ShieldAlert } from 'lucide-react';
import { WaterfallItem } from '../../lib/types';

interface WaterfallChartProps {
  data: WaterfallItem[];
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="mb-6">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight font-black flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-[#185FA5]" />
          Model Decision Waterfall (SHAP Attribution)
        </h3>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
          Konstruksi nilai prediksi akhir (Final Forecast) dari baseline rata-rata histori
        </p>
      </div>

      <div className="space-y-4">
        {data.map((item, idx) => {
          let color = 'bg-[#185FA5]'; // base / total
          let icon = null;
          let textClass = 'text-slate-800 font-bold';

          if (item.type === 'positive') {
            color = 'bg-[#1D9E75]';
            icon = <ArrowUp className="w-3 h-3 text-[#1D9E75]" />;
            textClass = 'text-[#1D9E75] font-black';
          } else if (item.type === 'negative') {
            color = 'bg-[#A32D2D]';
            icon = <ArrowDown className="w-3 h-3 text-[#A32D2D]" />;
            textClass = 'text-[#A32D2D] font-black';
          }

          const pct = Math.max(15, (item.value / maxValue) * 100);

          return (
            <div key={idx} className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1">
                  {icon}
                  {item.name}
                </span>
                <span className={textClass}>
                  {item.value >= 0 ? `+${item.value}` : item.value} unit
                </span>
              </div>
              <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${pct}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${color}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
