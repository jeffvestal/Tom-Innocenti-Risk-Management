'use client';

import { useState } from 'react';
import { ScanEye, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { JinaLogo } from './JinaBadge';

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
          <div className="flex items-center gap-2">
            <JinaLogo className="w-10 h-4 shrink-0" />
            <span className="text-teal-700 dark:text-teal-300 font-semibold text-sm tracking-wide uppercase">
              Jina VLM Audit Report
            </span>
            <span className="text-slate-500 dark:text-slate-500 font-mono text-[10px]">(jina-vlm)</span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-400 shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="px-5 pb-5">
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
            {analysis}
          </p>
          <a
            href="https://jina.ai/reader#vlm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-xs text-teal-700 dark:text-teal-400 hover:text-teal-600 dark:hover:text-teal-300 transition-colors font-medium"
          >
            Learn about Jina VLM <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
