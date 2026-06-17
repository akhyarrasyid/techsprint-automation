'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-red-700">Gagal memuat data</p>
        <p className="mt-0.5 text-sm text-red-600">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-700 hover:text-red-900"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Coba lagi
          </button>
        )}
      </div>
    </div>
  );
}
