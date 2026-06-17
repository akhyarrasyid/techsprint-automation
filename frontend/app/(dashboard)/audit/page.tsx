'use client';
import React, { useState, useEffect } from 'react';
import { safeAuditTrail } from '../../../lib/mock';
import { ClipboardList, User, Shield, Terminal, Zap } from 'lucide-react';

export default function AuditTrailPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    safeAuditTrail(50)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4">{Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}</div>;
  if (!data) return <div className="bg-white rounded-2xl p-8 text-center text-slate-400 font-medium text-sm">Audit trail logs kosong atau tidak tersedia.</div>;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-[11px] font-semibold text-slate-500 mb-1">Total Audit Logs</p>
          <p className="text-3xl font-black text-slate-800">{data.stats?.total_entries}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-[11px] font-semibold text-slate-500 mb-1">Kategori Teraktif</p>
          <p className="text-xl font-bold text-slate-700 capitalize mt-1.5">
            {Object.keys(data.stats?.categories || {})[0] || 'system'}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-[11px] font-semibold text-slate-500 mb-1">Latest Event Time</p>
          <p className="text-[11px] font-bold text-slate-700 mt-2">
            {data.entries?.[0] ? new Date(data.entries[0].timestamp).toLocaleString('id-ID') : 'N/A'}
          </p>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Activity Logs</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="py-2.5 px-4 font-bold text-slate-500">Timestamp</th>
                <th className="py-2.5 px-4 font-bold text-slate-500">Operator</th>
                <th className="py-2.5 px-4 font-bold text-slate-500">Kategori</th>
                <th className="py-2.5 px-4 font-bold text-slate-500">Aksi</th>
                <th className="py-2.5 px-4 font-bold text-slate-500">Detail</th>
              </tr>
            </thead>
            <tbody>
              {data.entries?.map((e: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-semibold text-slate-400">
                    {new Date(e.timestamp).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short' })}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                      <User className="w-3 h-3 text-slate-400" />
                      {e.user}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#185FA5]/5 text-[#185FA5]">
                      {e.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-800">{e.action}</td>
                  <td className="py-2.5 px-4 text-slate-500 font-semibold max-w-xs truncate" title={JSON.stringify(e.details)}>
                    {JSON.stringify(e.details)}
                  </td>
                </tr>
              ))}
              {(!data.entries || data.entries.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">Belum ada aktivitas audit terekam.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
