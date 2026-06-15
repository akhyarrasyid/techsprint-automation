import React from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

export type PipelineStageStatus = 'idle' | 'active' | 'done';

export interface PipelineStage {
  id: number;
  label: string;
  description: string;
}

interface PipelineVisualProps {
  currentStageId: number; // 0 (idle), 1-8 (stages), 9 (complete)
  stages: PipelineStage[];
}

export const PipelineVisual: React.FC<PipelineVisualProps> = ({ currentStageId, stages }) => {
  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <h3 className="font-bold text-slate-800 text-sm tracking-tight mb-4">Pipeline Execution Visualizer</h3>
      
      <div className="relative pl-6 space-y-4">
        {/* Vertical connector line */}
        <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-100"></div>

        {stages.map((stage) => {
          let status: PipelineStageStatus = 'idle';
          if (currentStageId > stage.id) {
            status = 'done';
          } else if (currentStageId === stage.id) {
            status = 'active';
          }

          return (
            <div 
              key={stage.id} 
              className={`relative flex items-start gap-4 p-3 rounded-xl transition-all duration-300 border ${
                status === 'done'
                  ? 'bg-[#1D9E75]/5 border-[#1D9E75]/10 text-slate-700'
                  : status === 'active'
                  ? 'bg-[#185FA5]/5 border-[#185FA5]/25 shadow-sm text-slate-800'
                  : 'bg-transparent border-transparent text-slate-400'
              }`}
            >
              {/* Node Icon */}
              <div className="absolute -left-6 top-3.5 -translate-x-1/2 z-10 bg-white p-0.5">
                {status === 'done' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#1D9E75]" />
                ) : status === 'active' ? (
                  <Loader2 className="w-4 h-4 text-[#185FA5] animate-spin" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-200 fill-slate-50" />
                )}
              </div>

              <div className="flex flex-col">
                <span className={`text-xs font-bold ${
                  status === 'done'
                    ? 'text-[#1D9E75]'
                    : status === 'active'
                    ? 'text-[#185FA5]'
                    : 'text-slate-400'
                }`}>
                  Stage {stage.id}: {stage.label}
                </span>
                <span className="text-[10px] font-medium text-slate-400 mt-0.5">
                  {stage.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
