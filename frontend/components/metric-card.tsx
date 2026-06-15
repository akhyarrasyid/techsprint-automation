import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
          <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="h-8 w-32 bg-slate-200 rounded mb-2"></div>
        <div className="h-3 w-40 bg-slate-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 group">
      <div className="flex justify-between items-start mb-4">
        <span className="text-slate-500 text-sm font-medium">{title}</span>
        <div className="p-2.5 bg-slate-50 rounded-lg group-hover:bg-[#185FA5]/10 group-hover:text-[#185FA5] text-slate-400 transition-colors duration-200">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
          {value}
        </span>
        {trend && (
          <span className={`text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-full ${
            trend.isPositive 
              ? 'text-[#1D9E75] bg-[#1D9E75]/10' 
              : 'text-[#A32D2D] bg-[#A32D2D]/10'
          }`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>

      {description && (
        <p className="text-slate-400 text-xs font-normal">
          {description}
        </p>
      )}
    </div>
  );
};
