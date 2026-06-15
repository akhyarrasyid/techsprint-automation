import React from 'react';
import { ProductMRP, RawMaterialRequirement } from '../../lib/types';
import { Calendar } from 'lucide-react';

interface OrderScheduleTimelineProps {
  mrpData: ProductMRP[];
}

export const OrderScheduleTimeline: React.FC<OrderScheduleTimelineProps> = ({ mrpData }) => {
  // Consolidate unique materials and sort by lead time
  const materialMap: Record<string, RawMaterialRequirement> = {};
  mrpData.forEach((prod) => {
    prod.materials.forEach((mat) => {
      if (!materialMap[mat.material_id] || mat.lead_time < materialMap[mat.material_id].lead_time) {
        materialMap[mat.material_id] = mat;
      }
    });
  });

  const sortedMaterials = Object.values(materialMap).sort((a, b) => a.lead_time - b.lead_time);

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="mb-6">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-[#185FA5]" />
          Jadwal Estimasi Kedatangan Bahan Baku (ETA Timeline)
        </h3>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
          Alur waktu kedatangan pasokan raw material ke gudang berdasarkan lead time supplier
        </p>
      </div>

      <div className="relative pl-6 space-y-6">
        {/* Vertical timeline connector */}
        <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-100"></div>

        {/* Today Node */}
        <div className="relative flex items-center gap-3">
          <div className="absolute -left-6 top-1.5 -translate-x-1/2 z-10 w-2.5 h-2.5 rounded-full bg-[#185FA5] ring-4 ring-[#185FA5]/10"></div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-[#185FA5]">Today (Order Released)</span>
            <span className="text-[9px] text-slate-400 font-bold">15 June 2026</span>
          </div>
        </div>

        {/* Material Arrival Nodes */}
        {sortedMaterials.map((mat) => {
          return (
            <div key={mat.material_id} className="relative flex items-center justify-between gap-4 p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-2 h-2 rounded-full bg-slate-300 ring-4 ring-slate-100"></div>
              
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">{mat.material_name}</span>
                <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Supplier: {mat.supplier}</span>
              </div>

              <div className="text-right flex flex-col shrink-0">
                <span className="text-xs font-extrabold text-[#1D9E75]">{mat.expected_arrival}</span>
                <span className="text-[9px] text-slate-400 font-bold mt-0.5">({mat.lead_time} hari lead time)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
