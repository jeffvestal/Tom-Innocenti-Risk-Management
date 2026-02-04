'use client';

import { useState, FormEvent } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  initialQuery?: string;
}

export function SearchBar({ onSearch, isLoading, initialQuery = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-slate-500" />
          )}
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the EU AI Act..."
          className="search-input pl-14 pr-32"
          disabled={isLoading}
        />
        
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
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
      
      <p className="mt-3 text-center text-slate-600 text-sm">
        Powered by Jina AI embeddings & Elasticsearch semantic search
      </p>
    </form>
  );
}
