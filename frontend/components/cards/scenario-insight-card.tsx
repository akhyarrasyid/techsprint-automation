import React from 'react';
import { AIInsight } from '../../lib/types';
import { AlertTriangle, ShieldAlert, Lightbulb, Zap } from 'lucide-react';

interface ScenarioInsightCardProps {
  insights: AIInsight[];
}

export const ScenarioInsightCard: React.FC<ScenarioInsightCardProps> = ({ insights }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'risk': return <ShieldAlert className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'opportunity': return <Lightbulb className="w-4 h-4" />;
      case 'action': return <Zap className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getStyle = (type: string) => {
    switch (type) {
      case 'risk': return { bg: 'bg-[#A32D2D]/5', border: 'border-[#A32D2D]/10', icon: 'text-[#A32D2D]', title: 'text-[#A32D2D]' };
      case 'warning': return { bg: 'bg-[#BA7517]/5', border: 'border-[#BA7517]/10', icon: 'text-[#BA7517]', title: 'text-[#BA7517]' };
      case 'opportunity': return { bg: 'bg-[#1D9E75]/5', border: 'border-[#1D9E75]/10', icon: 'text-[#1D9E75]', title: 'text-[#1D9E75]' };
      case 'action': return { bg: 'bg-[#185FA5]/5', border: 'border-[#185FA5]/10', icon: 'text-[#185FA5]', title: 'text-[#185FA5]' };
      default: return { bg: 'bg-slate-50', border: 'border-slate-100', icon: 'text-slate-500', title: 'text-slate-700' };
    }
  };

  // Show top 5 insights max for the card
  const topInsights = insights.slice(0, 5);

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full">
      <div className="mb-4">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight">AI Scenario Intelligence</h3>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
          Rekomendasi otomatis dari analisis multi-skenario bisnis
        </p>
      </div>

      <div className="space-y-3 flex-1">
        {topInsights.map((insight, idx) => {
          const style = getStyle(insight.type);
          return (
            <div
              key={idx}
              className={`p-3 ${style.bg} border ${style.border} rounded-xl flex items-start gap-2.5 transition-all duration-150 hover:scale-[1.01]`}
            >
              <div className={`${style.icon} shrink-0 mt-0.5`}>{getIcon(insight.type)}</div>
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${style.title}`}>{insight.title}</span>
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">
                  {insight.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {insights.length > 5 && (
        <div className="mt-4 pt-3 border-t border-slate-50 text-center">
          <span className="text-[9px] text-slate-400 font-bold">
            +{insights.length - 5} more insights available
          </span>
        </div>
      )}
    </div>
  );
};
