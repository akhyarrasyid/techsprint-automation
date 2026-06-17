'use client';

import React, { useState, useRef, useCallback, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { uploadDataFile, fetchPipelineStatus } from '../../../lib/api';
import type { UploadResponse } from '../../../lib/types';
import {
  UploadCloud,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
  ChevronRight,
  Clock,
  Database,
  BarChart3,
  Package,
  TrendingUp,
  Brain,
} from 'lucide-react';
import Link from 'next/link';

const PIPELINE_STAGES = [
  'Memvalidasi file CSV...',
  'Memuat data transaksi & BOM...',
  'Menghitung forecast 5 minggu...',
  'Menganalisis stok & MRP...',
  'Menghitung profitabilitas & KPI...',
  'Menyimpan hasil pipeline...',
];

function UploadContent() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: pipelineStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['pipeline-status'],
    queryFn: fetchPipelineStatus,
    refetchInterval: result ? false : 30_000,
  });

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv')) {
      setUploadError('Hanya file CSV yang diizinkan.');
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 50 MB.');
      return;
    }
    setUploadError(null);
    setResult(null);
    setFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const startStageAnimation = () => {
    setStageIdx(0);
    let idx = 0;
    stageTimerRef.current = setInterval(() => {
      idx += 1;
      if (idx < PIPELINE_STAGES.length) {
        setStageIdx(idx);
      } else {
        clearInterval(stageTimerRef.current!);
      }
    }, 1200);
  };

  const handleRun = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    setResult(null);
    startStageAnimation();

    try {
      const res = await uploadDataFile(file);
      setResult(res);
      refetchStatus();
    } catch (err: any) {
      setUploadError(err.message ?? 'Terjadi kesalahan saat upload.');
    } finally {
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
      setIsUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return 'Belum pernah';
    return new Date(iso).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const NAV_LINKS = [
    { label: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { label: 'Forecast', href: '/forecast', icon: TrendingUp },
    { label: 'Inventory', href: '/inventory', icon: Package },
    { label: 'Profitabilitas', href: '/profit', icon: Database },
    { label: 'AI Copilot', href: '/copilot', icon: Brain },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Upload Data & Jalankan Pipeline</h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Upload file CSV transaksi penjualan, lalu pipeline akan menghitung forecast, inventaris, MRP, dan profitabilitas secara otomatis.
        </p>
      </div>

      {/* Pipeline Status */}
      <div className="bg-white border border-slate-100 rounded-[20px] p-5 shadow-sm flex items-center gap-4">
        <div className={`w-3 h-3 rounded-full shrink-0 ${pipelineStatus?.ready ? 'bg-emerald-500' : 'bg-amber-400'}`} />
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-700">
            {pipelineStatus?.ready ? 'Pipeline siap — data tersedia' : 'Pipeline belum dijalankan'}
          </p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Terakhir dijalankan: {formatDate(pipelineStatus?.last_run ?? null)}
          </p>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-[20px] border-2 border-dashed p-10 text-center transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : file
            ? 'border-emerald-400 bg-emerald-50/30'
            : 'border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
        />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-10 h-10 text-emerald-500" />
            <p className="font-bold text-slate-800 text-sm">{file.name}</p>
            <p className="text-xs text-slate-500">{formatSize(file.size)} — Klik untuk ganti file</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <UploadCloud className="w-12 h-12 text-slate-300" />
            <div>
              <p className="font-bold text-slate-700 text-sm">Seret & lepas file CSV di sini</p>
              <p className="text-xs text-slate-400 mt-1">atau klik untuk memilih file (maks. 50 MB)</p>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold px-4 py-2 bg-white rounded-lg border border-slate-100">
              Format: sales_history (Competitors).csv
            </p>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 font-medium">{uploadError}</p>
        </div>
      )}

      {/* Run Button */}
      <button
        onClick={handleRun}
        disabled={!file || isUploading}
        className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all
          bg-[#185FA5] hover:bg-[#1D6FBB] disabled:opacity-40 disabled:cursor-not-allowed
          flex items-center justify-center gap-2"
      >
        {isUploading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Menjalankan Pipeline...
          </>
        ) : (
          <>
            <UploadCloud className="w-4 h-4" />
            Upload & Jalankan Pipeline
          </>
        )}
      </button>

      {/* Pipeline Progress */}
      {isUploading && (
        <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-800">Progress Pipeline</h3>
          {PIPELINE_STAGES.map((stage, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                i < stageIdx ? 'bg-emerald-500' : i === stageIdx ? 'bg-blue-500 animate-pulse' : 'bg-slate-100'
              }`}>
                {i < stageIdx && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className={`text-xs font-semibold ${
                i < stageIdx ? 'text-emerald-600' : i === stageIdx ? 'text-blue-600' : 'text-slate-400'
              }`}>{stage}</span>
            </div>
          ))}
        </div>
      )}

      {/* Success Panel */}
      {result && result.status === 'success' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-[20px] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h3 className="font-bold text-emerald-800 text-sm">Pipeline berhasil dijalankan!</h3>
              <p className="text-xs text-emerald-600 mt-0.5">
                {result.row_count.toLocaleString('id-ID')} baris data diproses dalam {result.duration_seconds.toFixed(2)}s
                {result.date_range ? ` | Rentang: ${result.date_range}` : ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-emerald-100 p-4">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Forecast Menus</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{result.pipeline_summary.forecast_menus}</p>
            </div>
            <div className="bg-white rounded-xl border border-emerald-100 p-4">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Inventory Items</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{result.pipeline_summary.inventory_items}</p>
            </div>
            <div className="bg-white rounded-xl border border-emerald-100 p-4">
              <p className="text-[10px] text-slate-500 font-bold uppercase">MRP Rows</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{result.pipeline_summary.mrp_rows}</p>
            </div>
            <div className="bg-white rounded-xl border border-emerald-100 p-4">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Action Report</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{result.pipeline_summary.action_report_rows}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-emerald-700 mb-2">Navigasi ke modul:</p>
            <div className="flex flex-wrap gap-2">
              {NAV_LINKS.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-emerald-50 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 text-[#185FA5]" />
                  {label}
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {result && result.status === 'error' && (
        <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-[20px]">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-700 text-sm">Pipeline gagal</p>
            <p className="text-xs text-red-600 mt-1">{result.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 text-xs font-semibold">Memuat halaman upload...</div>}>
      <UploadContent />
    </Suspense>
  );
}
