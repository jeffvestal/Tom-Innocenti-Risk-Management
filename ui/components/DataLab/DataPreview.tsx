'use client';

import { Database, ExternalLink, FileText } from 'lucide-react';
import { JinaLogo, ElasticLogo } from '../JinaBadge';
import type { SampleArticle } from '@/types';

interface DataPreviewProps {
  samples: SampleArticle[];
  totalDocs: number;
  enCount: number;
  deCount: number;
  indexName: string;
  isLoading: boolean;
}

export function DataPreview({
  samples,
  totalDocs,
  enCount,
  deCount,
  indexName,
  isLoading,
}: DataPreviewProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-stone-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 shadow-sm dark:shadow-none p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-stone-200 dark:bg-slate-700/50 rounded w-1/3" />
          <div className="h-20 bg-stone-100 dark:bg-slate-700/30 rounded" />
          <div className="h-20 bg-stone-100 dark:bg-slate-700/30 rounded" />
        </div>
      </div>
    );
  }

  if (totalDocs === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300/60 dark:border-slate-700/50 bg-stone-50 dark:bg-slate-800/30 p-8 text-center">
        <Database className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-sm text-slate-500">
          No data indexed yet. Run the pipeline above to load the EU AI Act.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 shadow-sm dark:shadow-none p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Indexed Data
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Index: <code className="text-slate-600 dark:text-slate-400">{indexName}</code>
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <StatBadge label="Total Documents" value={totalDocs} />
        <StatBadge label="English" value={enCount} />
        <StatBadge label="German" value={deCount} />
      </div>

      {/* Jina embedding callout */}
      <div className="flex items-center justify-center gap-2 mb-5 py-2 px-3 rounded-lg bg-teal-500/5 border border-teal-500/15">
        <JinaLogo className="w-8 h-3.5 shrink-0" />
        <span className="text-[11px] text-teal-700/80 dark:text-teal-400/80 inline-flex items-center gap-1 flex-wrap justify-center">
          Each document embedded with <span className="font-semibold text-teal-700 dark:text-teal-400">.jina-embeddings-v5-text-small</span> via <ElasticLogo className="w-3.5 h-3.5 inline" /> Elasticsearch Inference API
        </span>
      </div>

      {/* Sample articles */}
      <div className="space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
          Sample Articles
        </p>
        <div className="grid gap-2">
          {samples.map(article => (
            <div
              key={article.id}
              className="rounded-lg border border-stone-200/60 dark:border-slate-700/40
                         bg-stone-50/50 dark:bg-slate-900/40 p-4
                         hover:border-stone-300/80 dark:hover:border-slate-600/60 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      Article {article.article_number}: {article.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {article.text.slice(0, 200)}
                    {article.text.length > 200 ? '...' : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase
                                    ${article.language === 'en'
                                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                      : 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30'
                                    }`}>
                    {article.language}
                  </span>
                  {article.url && (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-stone-200/60 dark:border-slate-700/40 bg-stone-50/50 dark:bg-slate-900/40 px-4 py-3 text-center">
      <p className="text-xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">
        {value.toLocaleString()}
      </p>
      <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
