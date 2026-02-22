'use client';

import { useState } from 'react';
import { Eye, EyeOff, ExternalLink, ShieldCheck } from 'lucide-react';

type LangChoice = 'en' | 'de' | 'both';

const LANG_OPTIONS: { id: LangChoice; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'de', label: 'DE' },
  { id: 'both', label: 'Both' },
];

interface ApiKeyInputProps {
  value: string;
  onChange: (key: string) => void;
  hasServerKey: boolean;
  langChoice: LangChoice;
  onLangChange: (lang: LangChoice) => void;
  disabled?: boolean;
}

export function ApiKeyInput({
  value,
  onChange,
  hasServerKey,
  langChoice,
  onLangChange,
  disabled,
}: ApiKeyInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="rounded-xl border border-stone-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 shadow-sm dark:shadow-none p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Jina API Key</h3>

        {hasServerKey && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                           text-xs font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400
                           border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3" />
            Server key configured
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        {hasServerKey
          ? 'A Jina API key is already configured on the server. You can override it below or leave this empty to use the server key.'
          : 'Enter your Jina API key to use Jina Reader for PDF-to-markdown conversion, embeddings, and reranking.'}
      </p>

      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={hasServerKey ? 'Using server key (optional override)' : 'jina_...'}
          disabled={disabled}
          className="w-full px-4 py-2.5 pr-10 rounded-lg text-sm
                     bg-stone-50 dark:bg-slate-900/70 border border-stone-300/60 dark:border-slate-600/50
                     text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500
                     focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200"
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500
                     hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          tabIndex={-1}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <a
        href="https://jina.ai/api-dashboard/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 mt-3 text-xs text-amber-600 dark:text-amber-400
                   hover:text-amber-500 dark:hover:text-amber-300 transition-colors"
      >
        Get a free API key from Jina <ExternalLink className="w-3 h-3" />
      </a>

      {/* Language toggle */}
      <div className="mt-4 pt-4 border-t border-stone-200/60 dark:border-slate-700/40 flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Language(s) to Import</span>
          <p className="text-[11px] text-slate-500 mt-0.5">The EU AI Act PDF will be fetched and parsed per language</p>
        </div>
        <div className="inline-flex rounded-lg bg-stone-100 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-700/50 p-1">
          {LANG_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onLangChange(id)}
              disabled={disabled}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                          disabled:opacity-50 disabled:cursor-not-allowed
                          ${langChoice === id
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent'
                          }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
