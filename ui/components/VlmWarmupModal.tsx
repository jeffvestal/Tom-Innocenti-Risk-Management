'use client';

import { ScanEye, ExternalLink } from 'lucide-react';
import { JinaLogo } from './JinaBadge';

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
          <div className="w-14 h-14 rounded-full bg-teal-500/15 border border-teal-500/30
                          flex items-center justify-center">
            <ScanEye className="w-7 h-7 text-teal-400 animate-pulse" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <JinaLogo className="w-12 h-5" />
            <h2 className="text-lg font-semibold text-slate-100">
              Jina VLM Waking Up
            </h2>
          </div>
          <p className="text-xs font-mono text-slate-500 mb-2">model: jina-vlm</p>
          <p className="text-sm text-slate-400 leading-relaxed">
            The <span className="text-teal-700 dark:text-teal-400 font-semibold">Jina Vision Language Model</span> goes to sleep after idle periods.
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
              className="h-full bg-teal-500/60 rounded-full transition-all duration-500"
              style={{ width: `${(attempt / maxAttempts) * 100}%` }}
            />
          </div>
        </div>

        <a
          href="https://jina.ai/reader#vlm"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-teal-700 dark:text-teal-400 hover:text-teal-600 dark:hover:text-teal-300 transition-colors font-medium"
        >
          Learn about Jina VLM <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
