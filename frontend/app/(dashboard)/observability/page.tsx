'use client';
import React, { useState, useEffect } from 'react';
import { safeObservability } from '../../../lib/mock';
import { Cpu, HardDrive, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function ObservabilityPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    safeObservability()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div className="space-y-6"><div className="h-64 bg-white rounded-2xl animate-pulse" /></div>;
  if (!data) return <div className="bg-white rounded-2xl p-8 text-center text-slate-400 font-medium text-sm">Data tidak tersedia.</div>;

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">CPU Usage</span>
            <p className="text-3xl font-black text-slate-800 mt-1">{data.system?.cpu_percent}%</p>
          </div>
          <Cpu className="w-8 h-8 text-[#185FA5]" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">RAM Usage</span>
            <p className="text-3xl font-black text-slate-800 mt-1">{data.system?.memory_percent}%</p>
            <span className="text-[9px] text-slate-400 font-semibold mt-1 block">
              {data.system?.memory_used_mb}MB / {data.system?.memory_total_mb}MB
            </span>
          </div>
          <HardDrive className="w-8 h-8 text-[#185FA5]" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">API Health</span>
            <p className="text-3xl font-black text-slate-800 mt-1">{data.endpoint_summary?.health_pct}%</p>
            <span className="text-[9px] text-slate-400 font-semibold mt-1 block">
              {data.endpoint_summary?.operational} / {data.endpoint_summary?.total} endpoints active
            </span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
      </div>

      {/* Services status */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">Operational Dependencies</h3>
          <button onClick={loadData} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { name: 'Groq LLM Client', status: data.services?.groq_llm, ok: data.services?.groq_llm === 'configured' },
            { name: 'Hugging Face Space', status: data.services?.hf_space, ok: true },
            { name: 'Model Inference Pipeline', status: data.services?.pipeline, ok: data.services?.pipeline === 'loaded' },
            { name: 'FAISS Knowledge Index', status: data.services?.faiss_index, ok: true },
          ].map((srv, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700">{srv.name}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 capitalize">{srv.status}</p>
              </div>
              {srv.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Endpoint Table */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Endpoints Performance Checks</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="py-2.5 px-4 font-bold text-slate-500">HTTP Method</th>
                <th className="py-2.5 px-4 font-bold text-slate-500">Endpoint Path</th>
                <th className="py-2.5 px-4 font-bold text-slate-500 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.endpoints?.map((e: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-bold text-[#185FA5]">{e.method}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-700">{e.path}</td>
                  <td className="py-2.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
