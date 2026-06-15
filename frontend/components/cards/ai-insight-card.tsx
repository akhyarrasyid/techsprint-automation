import React from 'react';
import { Sparkles, ArrowRight, Info } from 'lucide-react';

export const AIInsightCard: React.FC = () => {
  const insights = [
    {
      text: "Demand for Tepung Protein is expected to increase by 8.3%.",
      type: "info"
    },
    {
      text: "PRD004 has a potential stockout risk within the next 7 days.",
      type: "warning"
    },
    {
      text: "Supplier delay scenarios reduce service level from 98% to 82%.",
      type: "danger"
    },
    {
      text: "Consider placing purchase orders earlier to maintain fill rate.",
      type: "success"
    }
  ];

  const borderStyles = {
    info: 'border-l-4 border-l-[#185FA5]',
    warning: 'border-l-4 border-l-[#BA7517]',
    danger: 'border-l-4 border-l-[#A32D2D]',
    success: 'border-l-4 border-l-[#1D9E75]',
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-[#185FA5]/10 text-[#185FA5] rounded-lg animate-pulse">
          <Sparkles className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-slate-800 text-sm tracking-tight">
          AI Supply Chain Insights
        </h3>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <div 
            key={idx}
            className={`p-3 bg-slate-50/50 rounded-r-lg ${borderStyles[insight.type as keyof typeof borderStyles]} flex items-start gap-2.5`}
          >
            <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-slate-600 text-xs font-medium leading-relaxed">
              {insight.text}
            </p>
          </div>
        ))}
      </div>

      <button className="w-full flex items-center justify-center gap-1.5 mt-4 text-xs font-semibold text-[#185FA5] hover:text-[#185FA5]/80 transition-colors py-2 border border-slate-100 hover:border-slate-200 rounded-lg bg-slate-50/30">
        Run Scenario Analysis <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
