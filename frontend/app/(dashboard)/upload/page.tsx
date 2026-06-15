'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { CSVUploadCard } from '../../../components/csv-upload-card';
import { PipelineVisual, PipelineStage } from '../../../components/pipeline-visual';
import { ValidationSummaryCard } from '../../../components/validation-summary-card';
import { ProcessingDialog } from '../../../components/processing-dialog';
import { PipelineResultCard } from '../../../components/cards/pipeline-result-card';
import { AIRecommendationCard } from '../../../components/cards/ai-recommendation-card';
import { safeUploadCSV, safeRunPipeline } from '../../../lib/mock';
import { ValidationReport, PipelineResults } from '../../../lib/types';

const PIPELINE_STAGES: PipelineStage[] = [
  { id: 1, label: 'Upload CSV', description: 'Menerima dan membaca berkas penjualan eksternal.' },
  { id: 2, label: 'Validation', description: 'Memverifikasi kelengkapan kolom dan tipe data.' },
  { id: 3, label: 'Feature Engineering', description: 'Membuat lag features, rolling mean, dan calendar index.' },
  { id: 4, label: 'Forecasting', description: 'Menghitung ramalan permintaan 5 minggu ke depan.' },
  { id: 5, label: 'Inventory Planning', description: 'Menghitung Safety Stock, Target Stock, dan Reorder Point.' },
  { id: 6, label: 'MRP', description: 'Melakukan ledakan bahan baku (BOM) berdasarkan rekomendasi order.' },
  { id: 7, label: 'Profitability', description: 'Menghitung estimasi pendapatan, COGS, dan gross margin.' },
  { id: 8, label: 'Dashboard', description: 'Melakukan agregasi metrik untuk visualisasi eksekutif.' }
];

const STAGE_DESCRIPTIONS = [
  'Mengunggah berkas CSV...',
  'Memvalidasi integritas data & tipe kolom...',
  'Mengekstrak fitur deret waktu (lag, rolling statistics)...',
  'Melakukan inferensi model peramalan permintaan...',
  'Menghitung parameter inventaris (Safety Stock & ROP)...',
  'Mengevaluasi ledakan kebutuhan material (BOM)...',
  'Menganalisis margin keuntungan operasional...',
  'Menyusun ringkasan metrik eksekutif...'
];

function UploadContent() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  
  // Pipeline running states
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineFinished, setPipelineFinished] = useState(false);
  const [currentStageId, setCurrentStageId] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [pipelineResults, setPipelineResults] = useState<PipelineResults | null>(null);

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setUploading(true);
    setCurrentStageId(1); // Active on stage 1 (upload)
    
    // Simulate upload and initial validation delay
    setTimeout(async () => {
      const report = await safeUploadCSV(selectedFile);
      setValidationReport(report);
      setUploading(false);
      setCurrentStageId(3); // Stage 1 and 2 done
    }, 1000);
  };

  const handleRunPipeline = () => {
    setPipelineRunning(true);
    let stage = 3;
    setCurrentStageId(3);
    setProgressPercent(25);

    // Simulate 600ms per stage (stages 3 to 8)
    const interval = setInterval(() => {
      stage += 1;
      if (stage <= 8) {
        setCurrentStageId(stage);
        setProgressPercent(Math.round((stage / 8) * 100));
      } else {
        clearInterval(interval);
        // Completed
        setTimeout(async () => {
          const results = await safeRunPipeline('Base');
          setPipelineResults(results);
          setPipelineRunning(false);
          setPipelineFinished(true);
          setCurrentStageId(9); // All stages completed successfully
        }, 300);
      }
    }, 600);
  };

  const handleOpenDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Data Integration Pipeline</h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">Unggah data penjualan untuk menghitung inventaris dan rencana pembelian otomatis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column (40%): Upload Area / Report Card */}
        <div className="lg:col-span-2 space-y-6">
          {!validationReport && !pipelineFinished && (
            <CSVUploadCard 
              onFileSelected={handleFileSelected} 
              isLoading={uploading} 
            />
          )}

          {validationReport && !pipelineFinished && (
            <ValidationSummaryCard
              report={validationReport}
              onRunPipeline={handleRunPipeline}
              isLoading={pipelineRunning}
            />
          )}

          {pipelineFinished && pipelineResults && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
              <PipelineResultCard
                processingTimeSeconds={4.2}
                productsForecasted={pipelineResults.validation.product_count}
                expectedRevenue={pipelineResults.dashboard_summary.expected_revenue}
                expectedProfit={pipelineResults.dashboard_summary.expected_profit}
                onOpenDashboard={handleOpenDashboard}
              />
              <AIRecommendationCard />
            </div>
          )}
        </div>

        {/* Right Column (60%): Execution Visualizer */}
        <div className="lg:col-span-3">
          <PipelineVisual 
            currentStageId={currentStageId} 
            stages={PIPELINE_STAGES} 
          />
        </div>
      </div>

      {/* Processing Loader Modal */}
      <ProcessingDialog
        isOpen={pipelineRunning}
        stageName={currentStageId > 0 && currentStageId <= 8 ? STAGE_DESCRIPTIONS[currentStageId - 1] : ''}
        progressPercent={progressPercent}
      />
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 text-xs font-semibold">Memuat Pipeline...</div>}>
      <UploadContent />
    </Suspense>
  );
}
