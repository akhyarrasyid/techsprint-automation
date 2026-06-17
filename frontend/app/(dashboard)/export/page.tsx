'use client';
import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchExport } from '../../../lib/api';
import { Download, FileSpreadsheet, FileJson, FileText, CheckCircle2, Loader2 } from 'lucide-react';

function ExportContent() {
  const searchParams = useSearchParams();
  const scenario = searchParams.get('scenario') || 'Base';
  const [downloading, setDownloading] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleExport = async (format: string) => {
    setDownloading(format);
    setStatus(null);
    try {
      const res = await fetchExport(format, scenario);
      const disposition = res.headers.get('content-disposition');
      let filename = `bpas_report_${scenario}.${format === 'excel' ? 'xlsx' : format}`;
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatus(`Laporan format ${format.toUpperCase()} berhasil diunduh!`);
    } catch {
      setStatus('Ekspor gagal. Silakan coba kembali.');
    } finally {
      setDownloading(null);
    }
  };

  const formats = [
    { id: 'csv', name: 'Microsoft Excel / CSV', desc: 'Ekspor data mentah peramalan, stok, dan profitabilitas.', icon: FileSpreadsheet, color: '#107C41' },
    { id: 'excel', name: 'Excel Worksheet (.xlsx)', desc: 'Ekspor multi-sheet terstruktur lengkap dengan headers.', icon: FileSpreadsheet, color: '#185FA5' },
    { id: 'json', name: 'JSON Schema Dataset', desc: 'Format standard data terstruktur untuk integrasi pihak ketiga.', icon: FileJson, color: '#7C3AED' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-2">Export Data Workspace</h3>
        <p className="text-xs text-slate-500 font-semibold mb-6">
          Pilih format file pengeksporan laporan bisnis untuk skenario aktif saat ini: <span className="font-bold text-[#185FA5] bg-[#185FA5]/5 px-2 py-0.5 rounded-full">{scenario}</span>.
        </p>

        {status && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2.5 text-xs text-emerald-700 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {status}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {formats.map((fmt) => {
            const Icon = fmt.icon;
            const isWorking = downloading === fmt.id;
            return (
              <div key={fmt.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-white shadow-sm shrink-0">
                    <Icon className="w-6 h-6" style={{ color: fmt.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{fmt.name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{fmt.desc}</p>
                  </div>
                </div>
                <button
                  disabled={downloading !== null}
                  onClick={() => handleExport(fmt.id)}
                  className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {isWorking ? 'Processing...' : 'Download'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ExportPage() {
  return (<Suspense fallback={<div>Loading Export...</div>}><ExportContent /></Suspense>);
}
