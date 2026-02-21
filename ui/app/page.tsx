'use client';

import { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { ResultsList } from '@/components/ResultsList';
import { DeepAnalysisButton } from '@/components/DeepAnalysisButton';
import { VlmAuditPanel } from '@/components/VlmAuditPanel';
import type { SearchState, VisionErrorResponse } from '@/types';

const initialState: SearchState = {
  query: '',
  naiveResults: [],
  rerankedResults: [],
  isSearching: false,
  isReranking: false,
  hasSearched: false,
  showComparison: false,
  isAuditing: false,
  vlmAnalysis: null,
  auditError: null,
};

export default function Home() {
  const [state, setState] = useState<SearchState>(initialState);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setState(prev => ({
      ...prev,
      query,
      isSearching: true,
      hasSearched: false,
      showComparison: false,
      naiveResults: [],
      rerankedResults: [],
    }));

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, rerank: false }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        naiveResults: data.results,
        isSearching: false,
        hasSearched: true,
      }));
    } catch (error) {
      console.error('Search error:', error);
      setState(prev => ({
        ...prev,
        isSearching: false,
        hasSearched: true,
      }));
    }
  }, []);

  const handleImageUpload = useCallback(async (file: File) => {
    setState(prev => ({
      ...prev,
      isAuditing: true,
      vlmAnalysis: null,
      auditError: null,
      hasSearched: false,
      naiveResults: [],
      rerankedResults: [],
      showComparison: false,
    }));

    try {
      const formData = new FormData();
      formData.append('image', file);

      const visionResponse = await fetch('/api/vision', {
        method: 'POST',
        body: formData,
      });

      if (!visionResponse.ok) {
        const errorData: VisionErrorResponse = await visionResponse.json().catch(() => ({
          error: 'Vision analysis failed.',
        }));

        setState(prev => ({
          ...prev,
          isAuditing: false,
          auditError: errorData.coldStart
            ? 'The Vision AI service is warming up. Please try again in about 30 seconds.'
            : errorData.error || 'Vision analysis failed.',
        }));
        return;
      }

      const { analysis } = await visionResponse.json();

      setState(prev => ({
        ...prev,
        isAuditing: false,
        vlmAnalysis: analysis,
      }));

      await handleSearch(analysis);
    } catch (error) {
      console.error('Image upload error:', error);
      setState(prev => ({
        ...prev,
        isAuditing: false,
        auditError: 'An unexpected error occurred. Please try again.',
      }));
    }
  }, [handleSearch]);

  const handleDeepAnalysis = useCallback(async () => {
    if (!state.query.trim() || state.naiveResults.length === 0) return;

    setState(prev => ({ ...prev, isReranking: true }));

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: state.query, rerank: true }),
      });

      if (!response.ok) {
        throw new Error('Reranking failed');
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        rerankedResults: data.results,
        isReranking: false,
        showComparison: true,
      }));
    } catch (error) {
      console.error('Reranking error:', error);
      setState(prev => ({
        ...prev,
        isReranking: false,
      }));
    }
  }, [state.query, state.naiveResults]);

  const handleReset = useCallback(() => {
    setState(prev => ({
      ...prev,
      showComparison: false,
      rerankedResults: [],
    }));
  }, []);

  return (
    <main className="min-h-screen">
      <Header />
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <SearchBar
            onSearch={handleSearch}
            onImageUpload={handleImageUpload}
            isLoading={state.isSearching}
            isAuditing={state.isAuditing}
            initialQuery={state.query}
          />
        </div>

        {/* Audit Error */}
        {state.auditError && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl
                          text-amber-300 text-sm text-center animate-slide-in">
            {state.auditError}
          </div>
        )}

        {/* VLM Audit Report */}
        {state.vlmAnalysis && (
          <div className="mb-6">
            <VlmAuditPanel analysis={state.vlmAnalysis} />
          </div>
        )}

        {/* Results Section */}
        {state.hasSearched && (
          <div className="space-y-6">
            {/* Deep Analysis Button */}
            {state.naiveResults.length > 0 && !state.showComparison && (
              <div className="flex justify-center">
                <DeepAnalysisButton
                  onClick={handleDeepAnalysis}
                  isLoading={state.isReranking}
                  disabled={state.isReranking}
                />
              </div>
            )}

            {/* Comparison Reset Button */}
            {state.showComparison && (
              <div className="flex justify-center">
                <button
                  onClick={handleReset}
                  className="text-slate-400 hover:text-slate-300 text-sm underline underline-offset-2"
                >
                  Reset to standard results
                </button>
              </div>
            )}

            {/* Results Display */}
            <ResultsList
              naiveResults={state.naiveResults}
              rerankedResults={state.rerankedResults}
              showComparison={state.showComparison}
              isLoading={state.isSearching}
            />
          </div>
        )}

        {/* Empty State */}
        {!state.hasSearched && !state.isSearching && !state.isAuditing && (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">
              Search the EU AI Act for compliance guidance
            </p>
            <p className="text-slate-600 text-sm mt-2">
              Try: &quot;biometric identification&quot; or &quot;law enforcement facial recognition&quot;
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
