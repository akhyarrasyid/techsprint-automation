import React from 'react';
import { ValidationReport } from '../lib/types';
import { CheckCircle2, AlertTriangle, Play } from 'lucide-react';

interface ValidationSummaryCardProps {
  report: ValidationReport;
  onRunPipeline: () => void;
  isLoading: boolean;
}

export const ValidationSummaryCard: React.FC<ValidationSummaryCardProps> = ({ 
  report, 
  onRunPipeline,
  isLoading
}) => {
  const hasWarnings = report.warnings.length > 0;

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-[#1D9E75]/10 text-[#1D9E75] rounded-lg">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-slate-800 text-sm tracking-tight">
          CSV Validation Report
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex flex-col">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Baris Data</span>
          <span className="text-sm font-bold text-slate-700 mt-1">{report.row_count} baris</span>
        </div>

        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex flex-col">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Jumlah Produk</span>
          <span className="text-sm font-bold text-slate-700 mt-1">{report.product_count} produk</span>
        </div>

        <div className="col-span-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex flex-col">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Rentang Tanggal Penjualan</span>
          <span className="text-xs font-bold text-slate-700 mt-1">
            {report.date_range.start} s/d {report.date_range.end}
          </span>
        </div>

        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex flex-col">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Nilai Kosong</span>
          <span className={`text-sm font-bold mt-1 ${report.missing_values > 0 ? 'text-[#A32D2D]' : 'text-[#1D9E75]'}`}>
            {report.missing_values} cell
          </span>
        </div>

        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex flex-col">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Status Integritas</span>
          <span className="text-xs font-bold text-[#1D9E75] mt-1">Lolos Validasi</span>
        </div>
      </div>

      {hasWarnings && (
        <div className="mb-4 bg-[#BA7517]/5 border border-[#BA7517]/10 p-3 rounded-xl flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#BA7517] mt-0.5 shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#BA7517]">Peringatan Validasi ({report.warnings.length})</span>
            <ul className="list-disc list-inside text-[10px] text-[#BA7517] mt-1 space-y-0.5 font-medium">
              {report.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <button
        onClick={onRunPipeline}
        disabled={isLoading}
        className="w-full bg-[#185FA5] text-white hover:bg-[#185FA5]/90 transition-colors text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-[#185FA5]/25 disabled:opacity-50"
      >
        <Play className="w-4 h-4" />
        Run Automation Pipeline
      </button>
    </div>
  );
};
