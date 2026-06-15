import React from 'react';
import { FileText, Calendar, TrendingUp } from 'lucide-react';

export const ExecutiveSummaryCard: React.FC = () => {
  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-[#185FA5]/10 text-[#185FA5] rounded-lg">
          <FileText className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-slate-800 text-sm tracking-tight">
          Executive Summary Report
        </h3>
      </div>
      
      <p className="text-slate-500 text-xs font-normal leading-relaxed mb-4">
        Sistem Perencanaan Bisnis Terautomasi (BPAS) saat ini sedang beroperasi dalam mode simulasi 
        dengan parameter pasokan yang stabil. Unggah data transaksi penjualan terbaru untuk menghitung ulang 
        kebutuhan material secara presisi.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase">Periode Aktif</span>
          </div>
          <span className="text-xs font-bold text-slate-700">Juni 2026</span>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase">Tingkat Layanan</span>
          </div>
          <span className="text-xs font-bold text-[#1D9E75]">98.4% (Tinggi)</span>
        </div>
      </div>

      <div className="bg-[#185FA5]/5 text-[#185FA5] text-[11px] p-3 rounded-xl border border-[#185FA5]/10 font-medium leading-relaxed">
        * Rekomendasi pembelian otomatis (MRP) didasarkan pada target lead-time supplier 7 hari kerja.
      </div>
    </div>
  );
};
