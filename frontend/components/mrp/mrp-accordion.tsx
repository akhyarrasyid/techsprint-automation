'use client';

import React, { useState } from 'react';
import { ProductMRP } from '../../lib/types';
import { ChevronDown, ChevronUp, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface MRPAccordionProps {
  data: ProductMRP[];
}

export const MRPAccordion: React.FC<MRPAccordionProps> = ({ data }) => {
  const [openProductId, setOpenProductId] = useState<string | null>(null);

  const toggleProduct = (id: string) => {
    setOpenProductId(openProductId === id ? null : id);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight">
          Bill of Materials (BOM) Explosion
        </h3>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
          Detail kebutuhan bahan baku berdasarkan kuantitas target produksi produk jadi
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {data.map((prod) => {
          const isOpen = openProductId === prod.product_id;
          const hasShortage = prod.materials.some(m => m.shortage > 0);

          return (
            <div key={prod.product_id} className="transition-colors duration-150">
              {/* Accordion Trigger Header */}
              <button
                onClick={() => toggleProduct(prod.product_id)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${hasShortage ? 'bg-[#A32D2D]/10 text-[#A32D2D]' : 'bg-[#1D9E75]/10 text-[#1D9E75]'}`}>
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800">{prod.product_name}</span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      Target Produksi: {prod.recommended_order.toLocaleString('id-ID')} unit
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {hasShortage ? (
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-[#A32D2D]/10 text-[#A32D2D] rounded-md flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Shortage
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-[#1D9E75]/10 text-[#1D9E75] rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Materials Ready
                    </span>
                  )}
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {/* Accordion Expandable Panel */}
              {isOpen && (
                <div className="px-6 pb-5 pt-1 bg-slate-50/30 border-t border-slate-50/50 space-y-3">
                  {prod.materials.map((mat) => {
                    const matShortage = mat.shortage > 0;
                    return (
                      <div
                        key={mat.material_id}
                        className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">{mat.material_name}</span>
                          <span className="text-[9px] text-slate-400 font-semibold mt-0.5">{mat.material_id}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-6 text-right md:min-w-[300px]">
                          <div className="flex flex-col">
                            <span className="text-[8px] text-slate-400 font-bold uppercase">Needed</span>
                            <span className="text-xs font-bold text-slate-700 mt-0.5">
                              {mat.qty_required.toLocaleString('id-ID')} {mat.unit}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] text-slate-400 font-bold uppercase">Stock</span>
                            <span className="text-xs font-semibold text-slate-500 mt-0.5">
                              {mat.current_stock.toLocaleString('id-ID')} {mat.unit}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] text-slate-400 font-bold uppercase">Shortage</span>
                            <span className={`text-xs font-extrabold mt-0.5 ${matShortage ? 'text-[#A32D2D]' : 'text-[#1D9E75]'}`}>
                              {mat.shortage.toLocaleString('id-ID')} {mat.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
