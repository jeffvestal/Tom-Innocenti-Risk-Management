'use client';

import { Sparkles, Loader2 } from 'lucide-react';

interface DeepAnalysisButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function DeepAnalysisButton({ onClick, isLoading, disabled }: DeepAnalysisButtonProps) {
  return (
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
      
      <span>{isLoading ? 'Analyzing...' : 'Deep Analysis'}</span>
      
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-lg bg-amber-400/20 blur-xl opacity-0 
                      group-hover:opacity-100 transition-opacity duration-300 -z-10" />
    </button>
  );
}
