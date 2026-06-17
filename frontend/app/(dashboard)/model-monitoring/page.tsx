'use client';
import React, { useState, useEffect } from 'react';
import { safeModelMonitoring } from '../../../lib/mock';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, ShieldAlert, Cpu, CheckCircle } from 'lucide-react';

export default function ModelMonitoringPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    safeModelMonitoring()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-6"><div className="h-64 bg-white rounded-2xl animate-pulse" /></div>;
  if (!data) return <div className="bg-white rounded-2xl p-8 text-center text-slate-400 font-medium text-sm">Data model monitoring tidak tersedia.</div>;

  return (
    <div className="space-y-6">
      {/* Overview Status */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Status Model: Sehat</h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Semua model berjalan dalam parameter akurasi yang diizinkan.</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-bold block">Terakhir Diperiksa</span>
          <span className="text-xs font-bold text-slate-700">{new Date(data.last_check).toLocaleString('id-ID')}</span>
        </div>
      </div>

      {/* Model Registry Weightings */}
      <div className="grid grid-cols-3 gap-4">
        {data.models?.map((model: any) => (
          <div key={model.name} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-50 text-blue-600">{model.status}</span>
              <span className="text-[10px] font-bold text-slate-400">v{model.version}</span>
            </div>
            <p className="text-sm font-bold text-slate-800 mb-1">{model.name}</p>
            <div className="flex justify-between items-end mt-4">
              <div>
                <p className="text-[10px] text-slate-400 font-bold">Ensemble Weight</p>
                <p className="text-xl font-black text-slate-800">{(model.weight * 100).toFixed(0)}%</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold">MAPE</p>
                <p className="text-xl font-black text-emerald-600">{model.mape}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Accuracy Trend Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Tren MAPE (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.accuracy_trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="week" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} domain={[10, 16]} />
                <Tooltip />
                <Line type="monotone" dataKey="mape" stroke="#185FA5" strokeWidth={2} dot={{ fill: '#185FA5', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Drift / SHAP Drift */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Penyimpangan SHAP (Feature Drift)</h3>
          <div className="space-y-4">
            {data.shap_drift?.map((f: any) => (
              <div key={f.feature} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">{f.feature}</span>
                  <span className="font-bold text-slate-500">Drift: {f.drift_pct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-[#185FA5] transition-all"
                    style={{ width: `${Math.min(100, f.drift_pct * 5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
