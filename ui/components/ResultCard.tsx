'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, ArrowUp, ArrowDown, Minus, Star } from 'lucide-react';
import type { SearchResult } from '@/types';

interface ResultCardProps {
  result: SearchResult;
  rank: number;
  movement?: {
    delta: number | null;
    indicator: 'up' | 'down' | 'same' | 'new';
    naiveRank: number | null;
  };
  animationDelay?: number;
}

export function ResultCard({ result, rank, movement, animationDelay = 0 }: ResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get text content - handle semantic_text structure
  const textContent = typeof result.text === 'object' 
    ? (result.text as { text?: string }).text || JSON.stringify(result.text)
    : result.text;

  const previewText = textContent.slice(0, 300);
  const hasMore = textContent.length > 300;

  const getMovementIcon = () => {
    if (!movement) return null;
    
    switch (movement.indicator) {
      case 'up':
        return <ArrowUp className="w-4 h-4" />;
      case 'down':
        return <ArrowDown className="w-4 h-4" />;
      case 'same':
        return <Minus className="w-4 h-4" />;
      case 'new':
        return <Star className="w-4 h-4" />;
    }
  };

  const getMovementClass = () => {
    if (!movement) return '';
    
    switch (movement.indicator) {
      case 'up':
        return 'movement-up';
      case 'down':
        return 'movement-down';
      case 'same':
        return 'movement-same';
      case 'new':
        return 'movement-new';
    }
  };

  const getMovementText = () => {
    if (!movement) return '';
    
    switch (movement.indicator) {
      case 'up':
        return `+${movement.delta}`;
      case 'down':
        return `${movement.delta}`;
      case 'same':
        return '=';
      case 'new':
        return 'NEW';
    }
  };

  return (
    <div 
      className="card card-hover animate-slide-in"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {/* Rank Badge */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full 
                          bg-slate-700 text-slate-300 font-semibold text-sm">
            {rank}
          </div>
          
          {/* Article Badge */}
          <span className="article-badge">
            Art. {result.article_number}
          </span>
          
          {/* Movement Indicator */}
          {movement && (
            <div className={`flex items-center gap-1 ${getMovementClass()}`}>
              {getMovementIcon()}
              <span className="text-sm font-mono">{getMovementText()}</span>
              {movement.naiveRank && movement.indicator !== 'same' && (
                <span className="text-xs text-slate-500 ml-1">
                  (was #{movement.naiveRank})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Score Badge */}
        <div className="score-badge">
          <span>Score:</span>
          <span className="text-slate-300">{result.score.toFixed(4)}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-medium text-slate-200 mb-3">
        {result.title}
      </h3>

      {/* Text Preview */}
      <div className="text-slate-400 text-sm leading-relaxed">
        <p>
          {isExpanded ? textContent : previewText}
          {!isExpanded && hasMore && '...'}
        </p>
      </div>

      {/* Expand/Collapse & Link */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-400 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show more
              </>
            )}
          </button>
        )}

        {result.url && (
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-amber-500 hover:text-amber-400 transition-colors ml-auto"
          >
            <span>View source</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
