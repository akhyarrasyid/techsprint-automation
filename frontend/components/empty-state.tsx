'use client';

import { useRouter } from 'next/navigation';
import { UploadCloud } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title = 'Belum ada data',
  description = 'Jalankan pipeline terlebih dahulu untuk mengisi halaman ini.',
  actionLabel = 'Upload & Jalankan Pipeline',
  onAction,
}: EmptyStateProps) {
  const router = useRouter();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      router.push('/upload');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <UploadCloud className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-700">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      <button
        onClick={handleAction}
        className="mt-6 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
      >
        {actionLabel}
      </button>
    </div>
  );
}
