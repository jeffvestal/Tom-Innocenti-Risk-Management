'use client';

import { FileText, ExternalLink, Globe } from 'lucide-react';

export function DataSourceCard() {
  return (
    <div className="rounded-xl border border-stone-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 shadow-sm dark:shadow-none p-6">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg
                        bg-amber-500/15 border border-amber-500/30 shrink-0">
          <FileText className="w-6 h-6 text-amber-500 dark:text-amber-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            EU AI Act
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            The world&apos;s first comprehensive legal framework regulating
            artificial intelligence. 180+ pages of dense regulatory text
            covering risk classification, prohibited practices, transparency
            obligations, and enforcement penalties.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                             text-xs font-medium bg-stone-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
              <FileText className="w-3 h-3" /> PDF Document
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                             text-xs font-medium bg-stone-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
              <Globe className="w-3 h-3" /> EN + DE
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                             text-xs font-medium bg-stone-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
              113 articles per language
            </span>
          </div>

          <a
            href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-4 text-xs text-amber-600 dark:text-amber-400
                       hover:text-amber-500 dark:hover:text-amber-300 transition-colors"
          >
            View source on EUR-Lex <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
