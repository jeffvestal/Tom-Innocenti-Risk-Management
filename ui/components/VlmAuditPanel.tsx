'use client';

import { useState } from 'react';
import { ScanEye, ChevronDown, ChevronUp } from 'lucide-react';

interface VlmAuditPanelProps {
  analysis: string;
}

export function VlmAuditPanel({ analysis }: VlmAuditPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl overflow-hidden animate-slide-in">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left
                   hover:bg-amber-500/5 transition-colors duration-150"
      >
        <div className="flex items-center gap-3">
          <ScanEye className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-amber-300 font-semibold text-sm tracking-wide uppercase">
            VLM Audit Report
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-400 shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="px-5 pb-5">
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
            {analysis}
          </p>
        </div>
      )}
    </div>
  );
}
