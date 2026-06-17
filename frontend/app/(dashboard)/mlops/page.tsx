'use client';
import React, { useState, useEffect } from 'react';
import { safeMLOps } from '../../../lib/mock';
import { Layers, Database, Star, Clock, Activity } from 'lucide-react';

export default function MLOpsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    safeMLOps()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-6"><div className="h-64 bg-white rounded-2xl animate-pulse" /></div>;
  if (!data) return <div className="bg-white rounded-2xl p-8 text-center text-slate-400 font-medium text-sm">Data MLOps tidak tersedia.</div>;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-[11px] font-semibold text-slate-500 mb-1">Model Terdaftar</p>
          <p className="text-3xl font-black text-slate-800">{data.summary?.total_models}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-[11px] font-semibold text-slate-500 mb-1">Total Eksperimen</p>
          <p className="text-3xl font-black text-slate-800">{data.summary?.total_experiments}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-[11px] font-semibold text-slate-500 mb-1">MAPE Terbaik</p>
          <p className="text-3xl font-black text-emerald-600">{data.summary?.best_mape}%</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-[11px] font-semibold text-slate-500 mb-1">Terakhir Training</p>
          <p className="text-[10px] font-bold text-slate-700 mt-2">
            {new Date(data.summary?.last_training).toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Model Registry List */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Database className="w-4 h-4 text-[#185FA5]" />Model Registry</h3>
          <div className="space-y-3">
            {data.model_registry?.map((model: any) => {
              const isChamp = model.status === 'champion';
              return (
                <div key={model.model_id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-800">{model.name}</p>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${isChamp ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-150 text-slate-500'}`}>
                        {model.status}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold">Version: {model.version}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold mb-3">Framework: {model.framework}</p>
                  <div className="grid grid-cols-3 gap-2 text-[10px] bg-white p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block font-bold">MAPE</span>
                      <span className="font-extrabold text-slate-700">{model.metrics?.mape}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold">R² Score</span>
                      <span className="font-extrabold text-slate-700">{model.metrics?.r2}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold">Training Samples</span>
                      <span className="font-extrabold text-slate-700">{model.training_samples}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Experiment History */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Clock className="w-4 h-4 text-[#185FA5]" />Experiment Log</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.experiments?.map((exp: any) => (
              <div key={exp.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{exp.name}</p>
                  <span className="text-[9px] font-black text-emerald-600 uppercase">{exp.mape}% MAPE</span>
                </div>
                <div className="flex justify-between items-center mt-2 text-[9px] text-slate-400 font-semibold">
                  <span>{exp.model}</span>
                  <span>{exp.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
