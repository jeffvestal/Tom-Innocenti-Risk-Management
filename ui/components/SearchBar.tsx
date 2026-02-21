'use client';

import { useState, useRef, FormEvent } from 'react';
import { Search, Loader2, ScanEye, ImagePlus } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onImageUpload?: (file: File) => void;
  isLoading?: boolean;
  isAuditing?: boolean;
  initialQuery?: string;
}

export function SearchBar({
  onSearch,
  onImageUpload,
  isLoading,
  isAuditing,
  initialQuery = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const busy = isLoading || isAuditing;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !busy) {
      onSearch(query.trim());
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const leftIcon = isAuditing ? (
    <ScanEye className="w-5 h-5 text-amber-500 animate-pulse" />
  ) : isLoading ? (
    <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
  ) : (
    <Search className="w-5 h-5 text-slate-500" />
  );

  const placeholder = isAuditing
    ? 'Auditing Architecture Diagram...'
    : 'Search the EU AI Act...';

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          {leftIcon}
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="search-input pl-14 pr-44"
          disabled={busy}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload architecture diagram"
        />
        
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
          {onImageUpload && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              title="Upload architecture diagram for VLM audit"
              className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-700/50
                         disabled:text-slate-600 disabled:hover:bg-transparent
                         transition-all duration-200 disabled:cursor-not-allowed"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
          )}
          <button
            type="submit"
            disabled={busy || !query.trim()}
            className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 
                       text-slate-900 disabled:text-slate-500 
                       px-5 py-2 rounded-lg font-medium text-sm
                       transition-all duration-200
                       disabled:cursor-not-allowed"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
      
      {isAuditing && (
        <p className="mt-3 text-center text-amber-500/80 text-sm animate-pulse">
          This may take up to a minute on first use...
        </p>
      )}
      {!isAuditing && (
        <p className="mt-3 text-center text-slate-600 text-sm">
          Powered by Jina AI embeddings & Elasticsearch semantic search
        </p>
      )}
    </form>
  );
}
