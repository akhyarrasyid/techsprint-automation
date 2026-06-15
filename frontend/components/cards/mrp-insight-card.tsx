import React from 'react';
import { ProductMRP } from '../../lib/types';
import { Factory, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface MRPInsightCardProps {
  mrpData: ProductMRP[];
  supplierDelayDays: number;
}

export const MRPInsightCard: React.FC<MRPInsightCardProps> = ({ mrpData, supplierDelayDays }) => {
  // Aggregate gandum shortage
  let gandumShortage = 0;
  let gandumArrival = '19 June 2026';
  
  mrpData.forEach((prod) => {
    prod.materials.forEach((mat) => {
      if (mat.material_name.toLowerCase() === 'gandum') {
        gandumShortage += mat.shortage;
        gandumArrival = mat.expected_arrival;
      }
    });
  });

  const simulatedServiceLevel = supplierDelayDays > 0 ? Math.max(70, 98 - supplierDelayDays * 3.2) : 98;

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-[#185FA5]/10 text-[#185FA5] rounded-lg">
            <Factory className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">MRP Intelligence Insight</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Analisis risiko logistik produksi otomatis</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Gandum shortage alert */}
          <div className="p-3 bg-[#A32D2D]/5 border border-[#A32D2D]/10 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#A32D2D] shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-700">Shortage Gandum Terdeteksi</span>
              <span className="text-[10px] text-[#A32D2D] font-black mt-1">
                Kekurangan: {Math.round(gandumShortage).toLocaleString('id-ID')} kg
              </span>
            </div>
          </div>

          {/* Supplier PO Dispatch notice */}
          <div className="p-3 bg-[#185FA5]/5 border border-[#185FA5]/10 rounded-xl flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#185FA5] shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-700">Rekomendasi Rilis PO</span>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1">
                Supplier <strong className="text-slate-700 font-bold">UD Makmur</strong> harus menerima Purchase Order hari ini demi mengamankan jadwal produksi.
              </p>
            </div>
          </div>

          {/* Arrival Date */}
          <div className="p-3 bg-[#1D9E75]/5 border border-[#1D9E75]/10 rounded-xl flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-[#1D9E75] shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-700">Estimasi Kedatangan (ETA)</span>
              <span className="text-[10px] text-[#1D9E75] font-black mt-1">
                {gandumArrival}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Delay simulation impact */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Simulasi Risiko Keterlambatan</span>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">Simulated Service Level:</span>
          <span className={`text-xs font-black ${simulatedServiceLevel < 85 ? 'text-[#A32D2D]' : 'text-[#1D9E75]'}`}>
            {simulatedServiceLevel.toFixed(0)}%
          </span>
        </div>
        {supplierDelayDays > 0 && (
          <p className="text-[9px] text-[#A32D2D] font-bold">
            ⚠️ Keterlambatan supplier +{supplierDelayDays} hari mereduksi service level ke {simulatedServiceLevel.toFixed(0)}%.
          </p>
        )}
      </div>
    </div>
  );
};
