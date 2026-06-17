'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { safeDataQuality } from '../../../lib/mock';
import { ShieldAlert, CheckCircle, CheckCircle2, AlertCircle } from 'lucide-react';

function DataQualityContent() {
  const searchParams = useSearchParams();
  const scenario = searchParams.get('scenario') || 'Base';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    safeDataQuality(scenario)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [scenario]);

  if (loading) return <div className="space-y-6"><div className="h-64 bg-white rounded-2xl animate-pulse" /></div>;
  if (!data) return <div className="bg-white rounded-2xl p-8 text-center text-slate-400 font-medium text-sm">Data tidak tersedia.</div>;

  return (
    <div className="space-y-6">
      {/* Quality Grade Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Skor Kualitas Data</h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Metrik kualitas untuk CSV dataset penjualan.</p>
          <div className="flex items-center gap-4 mt-4">
            <div>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Score</span>
              <p className="text-3xl font-black text-slate-800 mt-1">{data.quality_score}%</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider font-bold">Grade</span>
              <p className="text-3xl font-black text-[#185FA5] mt-1">{data.grade}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
            <span className="text-[10px] text-emerald-600 font-bold block">PASSED</span>
            <span className="text-xl font-black text-emerald-700 mt-1 block">{data.summary?.pass}</span>
          </div>
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-center">
            <span className="text-[10px] text-amber-600 font-bold block">WARNINGS</span>
            <span className="text-xl font-black text-amber-700 mt-1 block">{data.summary?.warning}</span>
          </div>
        </div>
      </div>

      {/* Dataset Info */}
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Jumlah Baris Data', value: data.row_count },
          { label: 'Jumlah Kolom Data', value: data.column_count },
          { label: 'Jumlah Produk Berbeda', value: data.product_count },
        ].map((item, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-[11px] font-semibold text-slate-500 mb-1">{item.label}</p>
            <p className="text-2xl font-black text-slate-800">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Quality Checks Details */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Laporan Hasil Validasi</h3>
        <div className="space-y-3">
          {data.checks?.map((chk: any, idx: number) => {
            const isPass = chk.status === 'pass';
            const isFail = chk.status === 'fail';
            return (
              <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  {isPass ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className={`w-5 h-5 shrink-0 ${isFail ? 'text-red-500' : 'text-amber-500'}`} />
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-800">{chk.check}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{chk.detail}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${isPass ? 'bg-emerald-50 text-emerald-600' : isFail ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                  {chk.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DataQualityPage() {
  return (<Suspense fallback={<div>Loading Data Quality...</div>}><DataQualityContent /></Suspense>);
}
