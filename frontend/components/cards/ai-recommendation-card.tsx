import React from 'react';
import { Sparkles, Info, ShoppingCart, AlertTriangle, Lightbulb } from 'lucide-react';

export const AIRecommendationCard: React.FC = () => {
  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-[#185FA5]/10 text-[#185FA5] rounded-lg animate-pulse">
          <Sparkles className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-slate-800 text-sm tracking-tight">
          AI Recommendation Panel
        </h3>
      </div>

      <div className="space-y-4">
        {/* Recommendation 1 */}
        <div className="flex gap-3">
          <div className="p-2 bg-[#185FA5]/5 text-[#185FA5] rounded-lg h-9 w-9 flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700">Estimasi Permintaan Naik</span>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed font-medium">
              Permintaan untuk Tepung Protein diproyeksikan tumbuh sebesar 8.3% pada minggu mendatang berdasarkan tren musiman.
            </p>
          </div>
        </div>

        {/* Recommendation 2 */}
        <div className="flex gap-3">
          <div className="p-2 bg-[#1D9E75]/5 text-[#1D9E75] rounded-lg h-9 w-9 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700">Rekomendasi Purchase Order (MRP)</span>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed font-medium">
              Beli sebanyak <strong className="text-[#1D9E75] font-bold">1.090 unit</strong> gandum tambahan minggu ini untuk menjaga kelancaran produksi Tepung Protein Tinggi.
            </p>
          </div>
        </div>

        {/* Recommendation 3 */}
        <div className="flex gap-3">
          <div className="p-2 bg-[#A32D2D]/5 text-[#A32D2D] rounded-lg h-9 w-9 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700">Analisis Risiko Skenario Supply</span>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed font-medium">
              Keterlambatan pasokan supplier selama 5 hari dapat menurunkan tingkat pelayanan pemenuhan pesanan dari 98% menjadi 82%.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-[9px] font-bold text-slate-500">
          Disarankan untuk mengirim Purchase Order 2 hari lebih awal dari ROP.
        </span>
      </div>
    </div>
  );
};
