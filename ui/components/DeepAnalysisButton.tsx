'use client';

import { Sparkles, Loader2 } from 'lucide-react';
import { JinaLogo } from './JinaBadge';

interface DeepAnalysisButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function DeepAnalysisButton({ onClick, isLoading, disabled }: DeepAnalysisButtonProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className="group relative flex items-center gap-3 btn-gold text-base
                   hover:scale-[1.02] active:scale-[0.98]"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
        )}

        <span>{isLoading ? 'Reranking with Jina Reranker...' : 'Deep Analysis'}</span>

        {/* Glow effect */}
        <div className="absolute inset-0 rounded-lg bg-amber-400/20 blur-xl opacity-0
                        group-hover:opacity-100 transition-opacity duration-300 -z-10" />
      </button>
      <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-500">
        Powered by <JinaLogo className="w-7 h-3" />
        <span className="text-teal-700 dark:text-teal-400 font-medium">Jina Reranker</span>
        <span className="font-mono text-slate-500 dark:text-slate-600">jina-reranker-v2-base-multilingual</span>
      </span>
    </div>
  );
}
