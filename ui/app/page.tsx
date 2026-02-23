'use client';

import { useState, useCallback, useRef } from 'react';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { ResultsList } from '@/components/ResultsList';
import { DeepAnalysisButton } from '@/components/DeepAnalysisButton';
import { VlmAuditPanel } from '@/components/VlmAuditPanel';
import { ModeToggle, type AppMode } from '@/components/ModeToggle';
import { AgentChat } from '@/components/AgentChat';
import { DataLab } from '@/components/DataLab';
import { VlmWarmupModal } from '@/components/VlmWarmupModal';
import type { Language } from '@/components/LanguageToggle';
import { JinaBadge, JinaInline, ElasticLogo } from '@/components/JinaBadge';
import type { SearchState, VisionErrorResponse, AuditError } from '@/types';

const VLM_RETRY_MAX = 5;
const VLM_RETRY_DELAY_MS = 10_000;

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
  const [errorExpanded, setErrorExpanded] = useState(false);
  const [vlmWarming, setVlmWarming] = useState(false);
  const [vlmAttempt, setVlmAttempt] = useState(0);

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

  const vlmAbortRef = useRef<AbortController | null>(null);

  const callVisionApi = async (formData: FormData, signal?: AbortSignal): Promise<Response> => {
    return fetch('/api/vision', { method: 'POST', body: formData, signal });
  };

  const handleImageUpload = useCallback(async (file: File) => {
    vlmAbortRef.current?.abort();
    const controller = new AbortController();
    vlmAbortRef.current = controller;

    setErrorExpanded(false);
    setVlmWarming(false);
    setVlmAttempt(0);
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

      let visionResponse = await callVisionApi(formData, controller.signal);

      if (!visionResponse.ok) {
        const errorData: VisionErrorResponse = await visionResponse.json().catch(() => ({
          error: 'Vision analysis failed.',
        }));

        if (errorData.coldStart) {
          setVlmWarming(true);

          for (let attempt = 1; attempt <= VLM_RETRY_MAX; attempt++) {
            setVlmAttempt(attempt);
            await new Promise<void>((resolve, reject) => {
              const timer = setTimeout(resolve, VLM_RETRY_DELAY_MS);
              controller.signal.addEventListener('abort', () => {
                clearTimeout(timer);
                reject(new DOMException('Aborted', 'AbortError'));
              }, { once: true });
            });

            const retryForm = new FormData();
            retryForm.append('image', file);
            visionResponse = await callVisionApi(retryForm, controller.signal);

            if (visionResponse.ok) break;

            const retryData: VisionErrorResponse = await visionResponse.json().catch(() => ({
              error: 'Vision analysis failed.',
            }));

            if (!retryData.coldStart) {
              setVlmWarming(false);
              setState(prev => ({
                ...prev,
                isAuditing: false,
                auditError: {
                  message: retryData.error || 'Vision analysis failed.',
                  detail: `Status: ${visionResponse.status}\n${JSON.stringify(retryData, null, 2)}`,
                },
              }));
              return;
            }
          }

          setVlmWarming(false);

          if (!visionResponse.ok) {
            setState(prev => ({
              ...prev,
              isAuditing: false,
              auditError: {
                message: 'The Vision AI service did not respond after multiple retries. Please try again shortly.',
                detail: `Exhausted ${VLM_RETRY_MAX} retries over ${(VLM_RETRY_MAX * VLM_RETRY_DELAY_MS) / 1000}s`,
              },
            }));
            return;
          }
        } else {
          setState(prev => ({
            ...prev,
            isAuditing: false,
            auditError: {
              message: errorData.error || 'Vision analysis failed.',
              detail: `Status: ${visionResponse.status}\n${JSON.stringify(errorData, null, 2)}`,
            },
          }));
          return;
        }
      }

      const { analysis } = await visionResponse.json();

      setState(prev => ({
        ...prev,
        isAuditing: false,
        vlmAnalysis: analysis,
      }));

      await handleSearch(analysis);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setState(prev => ({ ...prev, isAuditing: false }));
        return;
      }
      console.error('Image upload error:', error);
      setVlmWarming(false);
      setState(prev => ({
        ...prev,
        isAuditing: false,
        auditError: {
          message: 'An unexpected error occurred. Please try again.',
          detail: error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : String(error),
        },
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

        {mode === 'search' && (
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
              <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl
                              text-sm animate-slide-in overflow-hidden">
                <div className="p-4 text-amber-300 text-center">
                  {state.auditError.message}
                </div>
                {state.auditError.detail && (
                  <>
                    <button
                      onClick={() => setErrorExpanded(prev => !prev)}
                      className="w-full py-1.5 text-xs text-red-400 hover:text-red-300
                                 border-t border-amber-500/20 transition-colors"
                    >
                      {errorExpanded ? 'hide details' : 'expand for details'}
                    </button>
                    {errorExpanded && (
                      <pre className="px-4 pb-4 text-xs text-slate-400 font-mono whitespace-pre-wrap break-all
                                      border-t border-amber-500/20 bg-slate-900/50">
                        {state.auditError.detail}
                      </pre>
                    )}
                  </>
                )}
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
              <div className="mb-4 text-sm text-center space-y-2">
                {state.vlmAnalysis ? (
                  <>
                    <p className="text-slate-500">
                      Your architecture diagram was analyzed by <JinaInline service="vlm" /> <span className="font-mono text-slate-500 dark:text-slate-600 text-xs">(jina-vlm)</span>.<br />
                      The analysis was embedded using <JinaInline service="embeddings" /> <span className="font-mono text-slate-500 dark:text-slate-600 text-xs">(.jina-embeddings-v5-text-small)</span> to find relevant compliance articles.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <JinaBadge service="vlm" showModel={false} size="sm" />
                      <span className="text-slate-700">+</span>
                      <JinaBadge service="embeddings" showModel={false} size="sm" />
                    </div>
                  </>
                ) : (
                  <p className="text-slate-500">
                    Results ranked by semantic similarity using <JinaInline service="embeddings" /> <span className="font-mono text-slate-500 dark:text-slate-600 text-xs">(.jina-embeddings-v5-text-small)</span> via <ElasticLogo className="w-3.5 h-3.5 inline align-text-bottom" /> Elasticsearch.
                  </p>
                )}
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
                                 bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700
                                 text-slate-600 dark:text-slate-300
                                 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-300
                                 transition-all duration-200"
                    >
                      {pair[language]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {mode === 'agent' && <AgentChat language={language} />}

        {mode === 'data' && <DataLab />}
      </div>

      <VlmWarmupModal isOpen={vlmWarming} attempt={vlmAttempt} maxAttempts={VLM_RETRY_MAX} />
    </main>
  );
}
