import React from 'react';
import { ProductInventory } from '../../lib/types';
import { StatusBadge } from '../status-badge';
import { ShoppingCart } from 'lucide-react';

interface PurchaseOrderTableProps {
  data: ProductInventory[];
}

export const PurchaseOrderTable: React.FC<PurchaseOrderTableProps> = ({ data }) => {
  // Sort critical first, then warning, then healthy
  const sortedData = [...data].sort((a, b) => {
    const statusOrder: Record<string, number> = { critical: 1, warning: 2, healthy: 3 };
    const aOrder = statusOrder[a.status.toLowerCase()] || 99;
    const bOrder = statusOrder[b.status.toLowerCase()] || 99;
    return aOrder - bOrder;
  });

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const renderStatus = (status: string) => {
    const norm = status.toLowerCase();
    if (norm === 'critical') {
      return <StatusBadge label="Critical" type="danger" />;
    } else if (norm === 'warning') {
      return <StatusBadge label="Below ROP" type="warning" />;
    } else {
      return <StatusBadge label="Healthy" type="success" />;
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-2">
        <div className="p-1.5 bg-[#185FA5]/10 text-[#185FA5] rounded-lg">
          <ShoppingCart className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm tracking-tight">
            Purchase Order & Replenishment Planning
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Daftar otomatis rekomendasi kuantitas pembelian gandum/bahan baku dan estimasi nilai transaksi
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <th className="py-3.5 px-6">Product</th>
              <th className="py-3.5 px-4 text-right">Current Stock</th>
              <th className="py-3.5 px-4 text-right">Safety Stock</th>
              <th className="py-3.5 px-4 text-right">ROP</th>
              <th className="py-3.5 px-4 text-right">Recommended Order</th>
              <th className="py-3.5 px-4 text-right">Estimated Cost</th>
              <th className="py-3.5 px-6 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {sortedData.map((item) => (
              <tr 
                key={item.product_id}
                className="hover:bg-slate-50/50 transition-colors duration-150"
              >
                <td className="py-4 px-6">
                  <div className="flex flex-col">
                    <span className="text-slate-900 font-bold">{item.product_name}</span>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">{item.product_id}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right font-bold text-slate-700">
                  {item.current_stock.toLocaleString('id-ID')}
                </td>
                <td className="py-4 px-4 text-right font-medium text-slate-500">
                  {item.safety_stock.toLocaleString('id-ID')}
                </td>
                <td className="py-4 px-4 text-right font-medium text-slate-500">
                  {item.reorder_point.toLocaleString('id-ID')}
                </td>
                <td className="py-4 px-4 text-right font-bold text-[#A32D2D]">
                  {item.recommended_order_qty !== undefined 
                    ? item.recommended_order_qty.toLocaleString('id-ID')
                    : item.recommended_order.toLocaleString('id-ID')}
                </td>
                <td className="py-4 px-4 text-right font-black text-[#185FA5]">
                  {item.estimated_cost !== undefined 
                    ? formatIDR(item.estimated_cost)
                    : formatIDR(item.recommended_order * 9500)}
                </td>
                <td className="py-4 px-6 text-center flex justify-center">
                  {renderStatus(item.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
