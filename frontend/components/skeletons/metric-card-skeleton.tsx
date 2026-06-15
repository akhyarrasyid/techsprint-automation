import React from 'react';

export const MetricCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="h-4 w-24 bg-slate-200 rounded"></div>
        <div className="w-10 h-10 bg-slate-100 rounded-lg"></div>
      </div>
      <div className="h-8 w-32 bg-slate-200 rounded mb-2"></div>
      <div className="h-3 w-40 bg-slate-100 rounded"></div>
    </div>
  );
};
