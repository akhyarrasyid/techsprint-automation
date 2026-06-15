import React from 'react';
import { ArrowRight, CheckCircle2, Clock, BarChart3, TrendingUp, PiggyBank } from 'lucide-react';

interface PipelineResultCardProps {
  processingTimeSeconds: number;
  productsForecasted: number;
  expectedRevenue: number;
  expectedProfit: number;
  onOpenDashboard: () => void;
}

export const PipelineResultCard: React.FC<PipelineResultCardProps> = ({
  processingTimeSeconds,
  productsForecasted,
  expectedRevenue,
  expectedProfit,
  onOpenDashboard,
}) => {
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-[#1D9E75]/10 text-[#1D9E75] rounded-lg">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-slate-800 text-sm tracking-tight">
          Pipeline Completed Successfully
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
          <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-semibold uppercase">Processing Time</span>
            <span className="text-xs font-bold text-slate-700">{processingTimeSeconds} detik</span>
          </div>
        </div>

        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
          <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-semibold uppercase">Products Forecasted</span>
            <span className="text-xs font-bold text-slate-700">{productsForecasted} produk</span>
          </div>
        </div>

        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
          <div className="p-2 bg-[#185FA5]/10 text-[#185FA5] rounded-lg">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-semibold uppercase">Expected Revenue</span>
            <span className="text-xs font-bold text-[#185FA5]">{formatIDR(expectedRevenue)}</span>
          </div>
        </div>

        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
          <div className="p-2 bg-[#1D9E75]/10 text-[#1D9E75] rounded-lg">
            <PiggyBank className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-semibold uppercase">Expected Profit</span>
            <span className="text-xs font-bold text-[#1D9E75]">{formatIDR(expectedProfit)}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onOpenDashboard}
        className="w-full bg-[#1D9E75] text-white hover:bg-[#1D9E75]/90 transition-colors text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-[#1D9E75]/25"
      >
        Open Executive Dashboard <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
