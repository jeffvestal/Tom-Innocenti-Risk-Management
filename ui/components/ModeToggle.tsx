'use client';

import { Search, Bot } from 'lucide-react';

export type AppMode = 'search' | 'agent';

interface ModeToggleProps {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex justify-center mb-6">
      <div className="inline-flex rounded-xl bg-slate-800/70 border border-slate-700/50 p-1">
        <button
          onClick={() => onChange('search')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium
                      transition-all duration-200 ${
            mode === 'search'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-300 border border-transparent'
          }`}
        >
          <Search className="w-4 h-4" />
          Search
        </button>
        <button
          onClick={() => onChange('agent')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium
                      transition-all duration-200 ${
            mode === 'agent'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-300 border border-transparent'
          }`}
        >
          <Bot className="w-4 h-4" />
          Agent
        </button>
      </div>
    </div>
  );
}
