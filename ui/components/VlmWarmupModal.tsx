'use client';

import { ScanEye } from 'lucide-react';

interface VlmWarmupModalProps {
  isOpen: boolean;
  attempt: number;
  maxAttempts: number;
}

export function VlmWarmupModal({ isOpen, attempt, maxAttempts }: VlmWarmupModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4
                    bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl
                      animate-slide-in p-8 text-center space-y-4">
        <div className="flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/30
                          flex items-center justify-center">
            <ScanEye className="w-7 h-7 text-amber-400 animate-pulse" />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            VLM Service Waking Up
          </h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            The Vision AI model goes to sleep after idle periods.
            It typically takes 30-60 seconds to warm up.
          </p>
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-center gap-2 text-sm text-amber-300">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            Retrying&hellip; attempt {attempt} of {maxAttempts}
          </div>

          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-amber-500/60 rounded-full transition-all duration-500"
              style={{ width: `${(attempt / maxAttempts) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
