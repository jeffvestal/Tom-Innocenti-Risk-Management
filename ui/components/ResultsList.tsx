'use client';

import { useMemo } from 'react';
import { ResultCard } from './ResultCard';
import type { SearchResult, RankMovement } from '@/types';

interface ResultsListProps {
  naiveResults: SearchResult[];
  rerankedResults: SearchResult[];
  showComparison: boolean;
  isLoading?: boolean;
}

export function ResultsList({ 
  naiveResults, 
  rerankedResults, 
  showComparison,
  isLoading 
}: ResultsListProps) {
  // Calculate movement indicators when showing comparison
  const movements = useMemo(() => {
    if (!showComparison || rerankedResults.length === 0) return new Map();

    const naiveRanks = new Map(
      naiveResults.map((r, i) => [r.article_number, i + 1])
    );

    const movementMap = new Map<string, RankMovement>();

    rerankedResults.forEach((result, i) => {
      const rerankedRank = i + 1;
      const naiveRank = naiveRanks.get(result.article_number) || null;

      let indicator: 'up' | 'down' | 'same' | 'new';
      let delta: number | null = null;

      if (naiveRank === null) {
        indicator = 'new';
      } else {
        delta = naiveRank - rerankedRank;
        if (delta > 0) {
          indicator = 'up';
        } else if (delta < 0) {
          indicator = 'down';
        } else {
          indicator = 'same';
        }
      }

      movementMap.set(result.article_number, {
        articleNumber: result.article_number,
        naiveRank,
        rerankedRank,
        delta,
        indicator,
      });
    });

    return movementMap;
  }, [naiveResults, rerankedResults, showComparison]);

  // Determine which results to display
  const displayResults = showComparison ? rerankedResults : naiveResults;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card animate-shimmer h-40" />
        ))}
      </div>
    );
  }

  if (displayResults.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No results found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comparison Header */}
      {showComparison && (
        <div className="flex items-center justify-between mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-amber-400 font-medium">
              Deep Analysis Complete
            </span>
          </div>
          <div className="text-sm text-slate-400">
            Results reranked using Jina Reranker v3 (Listwise Attention)
          </div>
        </div>
      )}

      {/* Results */}
      {displayResults.map((result, index) => {
        const movement = showComparison 
          ? movements.get(result.article_number)
          : undefined;

        return (
          <ResultCard
            key={result.id || result.article_number}
            result={result}
            rank={index + 1}
            movement={movement ? {
              delta: movement.delta,
              indicator: movement.indicator,
              naiveRank: movement.naiveRank,
            } : undefined}
            animationDelay={showComparison ? index * 50 : 0}
          />
        );
      })}

      {/* Stats */}
      {showComparison && (
        <div className="mt-8 p-4 bg-slate-800/30 rounded-xl">
          <h4 className="text-sm font-medium text-slate-400 mb-3">
            Reranking Impact
          </h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-semibold text-emerald-400">
                {[...movements.values()].filter(m => m.indicator === 'up').length}
              </div>
              <div className="text-xs text-slate-500">Moved Up</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-red-400">
                {[...movements.values()].filter(m => m.indicator === 'down').length}
              </div>
              <div className="text-xs text-slate-500">Moved Down</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-amber-400">
                {[...movements.values()].filter(m => m.indicator === 'new').length}
              </div>
              <div className="text-xs text-slate-500">New in Top 10</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
