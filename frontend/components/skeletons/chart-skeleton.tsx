import React from 'react';

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm animate-pulse flex flex-col justify-between h-[350px]">
      <div className="space-y-2">
        <div className="h-5 w-48 bg-slate-200 rounded"></div>
        <div className="h-3 w-32 bg-slate-100 rounded"></div>
      </div>
      <div className="flex-1 w-full bg-slate-50/50 rounded-lg mt-6 flex items-end p-4 gap-4 justify-around">
        <div className="h-[20%] w-8 bg-slate-200/50 rounded-t"></div>
        <div className="h-[40%] w-8 bg-slate-200/50 rounded-t"></div>
        <div className="h-[30%] w-8 bg-slate-200/50 rounded-t"></div>
        <div className="h-[60%] w-8 bg-slate-200/50 rounded-t"></div>
        <div className="h-[80%] w-8 bg-slate-200/50 rounded-t"></div>
        <div className="h-[50%] w-8 bg-slate-200/50 rounded-t"></div>
      </div>
    </div>
  );
};
