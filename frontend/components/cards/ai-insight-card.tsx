'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, AlertTriangle, TrendingUp, Lightbulb, Zap } from 'lucide-react';
import { fetchInsights } from '../../lib/api';
import type { AIInsight } from '../../lib/types';

const SEVERITY_STYLES: Record<string, string> = {
  high: 'border-l-4 border-l-[#A32D2D]',
  medium: 'border-l-4 border-l-[#BA7517]',
  low: 'border-l-4 border-l-[#185FA5]',
};

const TYPE_ICON: Record<string, React.ElementType> = {
  risk: AlertTriangle,
  warning: Zap,
  opportunity: TrendingUp,
  action: Lightbulb,
};

function InsightList({ scenario }: { scenario: string }) {
  const { data: insights, isLoading } = useQuery({
    queryKey: ['insights', scenario],
    queryFn: () => fetchInsights(scenario),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 bg-slate-50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!insights?.length) {
    return (
      <p className="text-xs text-slate-400 text-center py-4">
        Jalankan pipeline untuk melihat insights.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {insights.slice(0, 4).map((insight: AIInsight, idx: number) => {
        const Icon = TYPE_ICON[insight.type] ?? Lightbulb;
        return (
          <div
            key={idx}
            className={`p-3 bg-slate-50/50 rounded-r-lg ${SEVERITY_STYLES[insight.severity] ?? SEVERITY_STYLES.low} flex items-start gap-2.5`}
          >
            <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-slate-700 text-xs font-bold leading-tight">{insight.title}</p>
              <p className="text-slate-500 text-[10px] font-medium leading-relaxed mt-0.5">
                {insight.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AIInsightCardInner() {
  const searchParams = useSearchParams();
  const scenario = searchParams.get('scenario') || 'Base';

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-[#185FA5]/10 text-[#185FA5] rounded-lg">
          <Sparkles className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-slate-800 text-sm tracking-tight">AI Supply Chain Insights</h3>
      </div>
      <InsightList scenario={scenario} />
    </div>
  );
}

export const AIInsightCard: React.FC = () => (
  <Suspense
    fallback={
      <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 bg-slate-50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    }
  >
    <AIInsightCardInner />
  </Suspense>
);
