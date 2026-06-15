import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingDialogProps {
  isOpen: boolean;
  stageName: string;
  progressPercent: number;
}

export const ProcessingDialog: React.FC<ProcessingDialogProps> = ({ isOpen, stageName, progressPercent }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-100 rounded-[24px] p-8 shadow-2xl max-w-md w-full flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
        <div className="p-4 bg-[#185FA5]/10 text-[#185FA5] rounded-full mb-4">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        
        <h4 className="font-bold text-slate-800 text-sm tracking-tight mb-1">
          Processing Supply Chain Data
        </h4>
        <p className="text-[10px] text-slate-400 font-semibold mb-6">
          Calculating Safety Stocks, ROP, forecasts, and MRP requirements...
        </p>

        {/* Current Stage Display */}
        <div className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl mb-4 text-xs font-bold text-[#185FA5] min-h-[42px] flex items-center justify-center">
          {stageName}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
          <div 
            className="bg-[#185FA5] h-full transition-all duration-300 rounded-full" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        <span className="text-[10px] text-slate-400 font-bold">
          {progressPercent}% Completed
        </span>
      </div>
    </div>
  );
};
