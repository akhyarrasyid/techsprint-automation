import React from 'react';
import { ProductMRP, RawMaterialRequirement } from '../../lib/types';
import { Truck } from 'lucide-react';

interface MaterialShortageTableProps {
  mrpData: ProductMRP[];
}

export const MaterialShortageTable: React.FC<MaterialShortageTableProps> = ({ mrpData }) => {
  // Consolidate raw materials across all finished products
  const materialMap: Record<string, RawMaterialRequirement & { finishedProducts: string[] }> = {};

  mrpData.forEach((prod) => {
    prod.materials.forEach((mat) => {
      if (materialMap[mat.material_id]) {
        materialMap[mat.material_id].qty_required += mat.qty_required;
        if (!materialMap[mat.material_id].finishedProducts.includes(prod.product_name)) {
          materialMap[mat.material_id].finishedProducts.push(prod.product_name);
        }
      } else {
        materialMap[mat.material_id] = {
          ...mat,
          finishedProducts: [prod.product_name]
        };
      }
    });
  });

  // Re-calculate shortage and order costs based on consolidated demand
  const consolidatedMaterials = Object.values(materialMap).map((mat) => {
    const shortage = Math.max(0, mat.qty_required - mat.current_stock);
    const order_cost = shortage * mat.unit_cost;
    return {
      ...mat,
      shortage,
      order_cost
    };
  });

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-2">
        <div className="p-1.5 bg-[#A32D2D]/10 text-[#A32D2D] rounded-lg">
          <Truck className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm tracking-tight">
            Consolidated Raw Material Shortage & Procurement
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Konsolidasi kebutuhan bahan baku dari seluruh lini produk dan estimasi kedatangan pasokan supplier
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <th className="py-3.5 px-6">Material</th>
              <th className="py-3.5 px-4 text-right">Consolidated Need</th>
              <th className="py-3.5 px-4 text-right">Current Stock</th>
              <th className="py-3.5 px-4 text-right">Shortage</th>
              <th className="py-3.5 px-4 text-right">Unit Cost</th>
              <th className="py-3.5 px-4 text-right">Order Cost</th>
              <th className="py-3.5 px-4">Supplier</th>
              <th className="py-3.5 px-4 text-right">Lead Time</th>
              <th className="py-3.5 px-6">Expected Arrival</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {consolidatedMaterials.map((mat) => (
              <tr 
                key={mat.material_id}
                className="hover:bg-slate-50/50 transition-colors duration-150"
              >
                <td className="py-4 px-6">
                  <div className="flex flex-col">
                    <span className="text-slate-900 font-bold">{mat.material_name}</span>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">{mat.material_id}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right text-slate-700">
                  {Math.round(mat.qty_required).toLocaleString('id-ID')} {mat.unit}
                </td>
                <td className="py-4 px-4 text-right text-slate-500 font-medium">
                  {Math.round(mat.current_stock).toLocaleString('id-ID')} {mat.unit}
                </td>
                <td className="py-4 px-4 text-right">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                    mat.shortage > 0 
                      ? 'bg-[#A32D2D]/10 text-[#A32D2D]' 
                      : 'bg-[#1D9E75]/10 text-[#1D9E75]'
                  }`}>
                    {Math.round(mat.shortage).toLocaleString('id-ID')} {mat.unit}
                  </span>
                </td>
                <td className="py-4 px-4 text-right text-slate-500 font-medium">
                  {formatIDR(mat.unit_cost)}
                </td>
                <td className="py-4 px-4 text-right text-[#185FA5] font-black">
                  {formatIDR(mat.order_cost)}
                </td>
                <td className="py-4 px-4 text-slate-600 font-bold">
                  {mat.supplier}
                </td>
                <td className="py-4 px-4 text-right text-slate-500 font-medium">
                  {mat.lead_time} hari
                </td>
                <td className="py-4 px-6 text-slate-700 font-extrabold">
                  {mat.expected_arrival}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
