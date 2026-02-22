'use client';

import { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { ResultsList } from '@/components/ResultsList';
import { DeepAnalysisButton } from '@/components/DeepAnalysisButton';
import { VlmAuditPanel } from '@/components/VlmAuditPanel';
import { ModeToggle, type AppMode } from '@/components/ModeToggle';
import { AgentChat } from '@/components/AgentChat';
import type { Language } from '@/components/LanguageToggle';
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
  const [mode, setMode] = useState<AppMode>('search');
  const [state, setState] = useState<SearchState>(initialState);
  const [language, setLanguage] = useState<Language>('en');

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
        body: JSON.stringify({ query, rerank: false, language }),
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
  }, [language]);

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
        body: JSON.stringify({ query: state.query, rerank: true, language }),
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
  }, [state.query, state.naiveResults, language]);

  const handleReset = useCallback(() => {
    setState(prev => ({
      ...prev,
      showComparison: false,
      rerankedResults: [],
    }));
  }, []);

  const handlePageReset = useCallback(() => {
    setState(initialState);
    setMode('search');
  }, []);

  return (
    <main className="min-h-screen">
      <Header onReset={handlePageReset} language={language} onLanguageChange={setLanguage} />
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        <ModeToggle mode={mode} onChange={setMode} />

        {mode === 'search' ? (
          <>
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

            {/* Results Explainer */}
            {state.hasSearched && state.naiveResults.length > 0 && (
              <p className="mb-4 text-slate-500 text-sm text-center">
                {state.vlmAnalysis
                  ? 'Your architecture diagram was analyzed by Jina VLM. The analysis was used to search for relevant EU AI Act compliance articles below.'
                  : 'Showing EU AI Act articles most semantically relevant to your query, ranked by meaning similarity.'}
              </p>
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
              <div className="text-center py-16">
                <p className="text-slate-500 text-lg mb-6">
                  {language === 'de'
                    ? 'Durchsuchen Sie das EU-KI-Gesetz nach Compliance-Richtlinien'
                    : 'Search the EU AI Act for compliance guidance'}
                </p>
                <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
                  {([
                    { en: 'Can law enforcement use facial recognition?', de: 'Darf die Polizei Gesichtserkennung einsetzen?' },
                    { en: 'biometric identification systems', de: 'Biometrische Identifikationssysteme' },
                    { en: 'AI system risk categories', de: 'Risikokategorien von KI-Systemen' },
                    { en: 'high-risk AI transparency requirements', de: 'Transparenzanforderungen für Hochrisiko-KI' },
                    { en: 'penalties for non-compliance', de: 'Strafen bei Nichteinhaltung' },
                  ] as const).map((pair) => (
                    <button
                      key={pair.en}
                      onClick={() => handleSearch(pair[language])}
                      title={language === 'de' ? pair.en : undefined}
                      className="px-4 py-2 rounded-full text-sm
                                 bg-slate-800 border border-slate-700 text-slate-300
                                 hover:border-amber-500/50 hover:text-amber-300
                                 transition-all duration-200"
                    >
                      {pair[language]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <AgentChat language={language} />
        )}
      </div>
    </main>
  );
}
