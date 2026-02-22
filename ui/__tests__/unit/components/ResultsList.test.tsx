import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultsList } from '@/components/ResultsList';
import type { SearchResult } from '@/types';

const makeResult = (num: string, score: number): SearchResult => ({
  id: `art_${num}`,
  article_number: num,
  title: `Article ${num}`,
  text: 'Article text content',
  score,
  language: 'en',
});

const naiveResults = [makeResult('5', 0.9), makeResult('9', 0.85), makeResult('3', 0.8)];
const rerankedResults = [makeResult('9', 0.95), makeResult('5', 0.9), makeResult('6', 0.85)];

describe('ResultsList', () => {
  it('renders naive results when not in comparison mode', () => {
    render(
      <ResultsList
        naiveResults={naiveResults}
        rerankedResults={[]}
        showComparison={false}
      />,
    );
    expect(screen.getByText('Art. 5')).toBeInTheDocument();
    expect(screen.getByText('Art. 9')).toBeInTheDocument();
    expect(screen.getByText('Art. 3')).toBeInTheDocument();
  });

  it('shows loading shimmer skeletons when isLoading', () => {
    const { container } = render(
      <ResultsList
        naiveResults={[]}
        rerankedResults={[]}
        showComparison={false}
        isLoading
      />,
    );
    expect(container.querySelectorAll('.animate-shimmer')).toHaveLength(5);
  });

  it('shows "No results found" for empty results', () => {
    render(
      <ResultsList
        naiveResults={[]}
        rerankedResults={[]}
        showComparison={false}
      />,
    );
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('shows comparison header when showComparison is true', () => {
    render(
      <ResultsList
        naiveResults={naiveResults}
        rerankedResults={rerankedResults}
        showComparison
      />,
    );
    expect(screen.getByText('Deep Analysis Complete')).toBeInTheDocument();
    expect(screen.getByText(/Jina Reranker/)).toBeInTheDocument();
  });

  it('shows reranked results in comparison mode', () => {
    render(
      <ResultsList
        naiveResults={naiveResults}
        rerankedResults={rerankedResults}
        showComparison
      />,
    );
    expect(screen.getByText('Art. 6')).toBeInTheDocument();
  });

  it('shows reranking impact stats in comparison mode', () => {
    render(
      <ResultsList
        naiveResults={naiveResults}
        rerankedResults={rerankedResults}
        showComparison
      />,
    );
    expect(screen.getByText('Reranking Impact')).toBeInTheDocument();
    expect(screen.getByText('Moved Up')).toBeInTheDocument();
    expect(screen.getByText('Moved Down')).toBeInTheDocument();
    expect(screen.getByText('New in Top 10')).toBeInTheDocument();
  });
});
