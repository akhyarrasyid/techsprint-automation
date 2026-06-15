'use client';

import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { safeExplainability } from '../../../lib/mock';
import { FeatureImportanceChart } from '../../../components/charts/feature-importance-chart';
import { SHAPSummaryChart } from '../../../components/charts/shap-summary-chart';
import { WaterfallChart } from '../../../components/charts/waterfall-chart';
import { Brain, HelpCircle, Activity } from 'lucide-react';

function ExplainabilityContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['explainability-report'],
    queryFn: safeExplainability,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Brain className="w-5 h-5 text-[#185FA5]" />
          Explainable AI (XAI) Dashboard
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Transparansi keputusan model peramalan melalui kontribusi fitur (SHAP) dan tingkat kepentingan variabel (Feature Importance)
        </p>
      </div>

      {/* Intro info box */}
      <div className="bg-[#185FA5]/5 border border-[#185FA5]/15 rounded-[20px] p-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="p-3 bg-[#185FA5]/10 text-[#185FA5] rounded-2xl shrink-0">
          <Brain className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-slate-800 text-xs">Mengapa transparansi model itu penting?</h4>
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
            Berbeda dengan model "black-box" tradisional, sistem peramalan kami menggunakan atribusi SHAP (SHapley Additive exPlanations) untuk menjamin setiap proyeksi demand produk dapat diaudit. Juri dan perencana kapasitas dapat melihat persis alasan mengapa model menaikkan atau menurunkan target order.
          </p>
        </div>
      </div>

      {/* Primary Row: Feature Importance and SHAP Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {isLoading ? (
          <>
            <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm h-[320px] animate-pulse"></div>
            <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm h-[320px] animate-pulse"></div>
          </>
        ) : (
          <>
            <FeatureImportanceChart data={data?.feature_importance || []} />
            <SHAPSummaryChart data={data?.shap_values || []} />
          </>
        )}
      </div>

      {/* Secondary Row: Decision Waterfall and Explanation Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          {isLoading ? (
            <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm h-[320px] animate-pulse"></div>
          ) : (
            <WaterfallChart data={data?.waterfall_data || []} />
          )}
        </div>

        {/* Feature Explanations Panel */}
        <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm flex flex-col h-full">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              Feature Glossary
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Definisi dan arti penting dari masing-masing fitur
            </p>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-10 bg-slate-50 rounded-xl animate-pulse"></div>
              ))
            ) : (
              data?.feature_importance.map((f) => (
                <div key={f.feature} className="p-3 bg-slate-50 border border-slate-100 rounded-xl transition-all hover:scale-[1.01]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-black text-slate-700">{f.feature}</span>
                    <span className="text-[10px] font-black text-[#185FA5] bg-[#185FA5]/10 px-2 py-0.5 rounded">
                      {f.importance}%
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                    {f.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExplainabilityPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 text-xs font-semibold">Memuat Explainable AI...</div>}>
      <ExplainabilityContent />
    </Suspense>
  );
}
