'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Download, AlertCircle } from 'lucide-react';

interface CSVUploadCardProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

export const CSVUploadCard: React.FC<CSVUploadCardProps> = ({ onFileSelected, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        setSelectedFileName(file.name);
        onFileSelected(file);
      } else {
        alert('Hanya file CSV yang diperbolehkan.');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFileName(file.name);
      onFileSelected(file);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full min-h-[320px]">
      <h3 className="font-bold text-slate-800 text-sm tracking-tight mb-1">Unggah Riwayat Penjualan</h3>
      <p className="text-[10px] text-slate-400 font-semibold mb-4">Pastikan struktur berkas sesuai format SAP/BPAS</p>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-200 ${
          dragActive 
            ? 'border-[#185FA5] bg-[#185FA5]/5' 
            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
        }`}
        onClick={onButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".csv"
          onChange={handleChange}
          disabled={isLoading}
        />
        
        {selectedFileName ? (
          <div className="flex flex-col items-center">
            <div className="p-3 bg-[#1D9E75]/10 text-[#1D9E75] rounded-xl mb-3">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <span className="text-xs font-semibold text-slate-700 max-w-[200px] truncate">{selectedFileName}</span>
            <span className="text-[10px] text-[#1D9E75] font-bold mt-1">Siap untuk Validasi</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="p-3 bg-[#185FA5]/10 text-[#185FA5] rounded-xl mb-3 animate-pulse">
              <UploadCloud className="w-8 h-8" />
            </div>
            <span className="text-xs font-semibold text-slate-700">Drop CSV file here</span>
            <span className="text-[10px] text-slate-400 font-medium mt-1">atau cari di komputer Anda</span>
          </div>
        )}
      </div>

      {/* Download Template Footer */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Maksimal ukuran berkas 10MB</span>
        </div>
        
        <a 
          href="/templates/business_planning_template.csv" 
          download
          className="flex items-center gap-1 text-[10px] font-bold text-[#185FA5] hover:text-[#185FA5]/80 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Template CSV
        </a>
      </div>
    </div>
  );
};
