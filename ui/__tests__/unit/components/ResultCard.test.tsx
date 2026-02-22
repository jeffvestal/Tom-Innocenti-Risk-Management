import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultCard } from '@/components/ResultCard';
import type { SearchResult } from '@/types';

const baseResult: SearchResult = {
  id: 'en_art_5',
  article_number: '5',
  title: 'Prohibited Practices',
  text: 'A'.repeat(400),
  score: 0.9542,
  language: 'en',
  url: 'https://eur-lex.europa.eu/art5',
};

describe('ResultCard', () => {
  it('renders rank, article number, title, and score', () => {
    render(<ResultCard result={baseResult} rank={1} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Art. 5')).toBeInTheDocument();
    expect(screen.getByText('Prohibited Practices')).toBeInTheDocument();
    expect(screen.getByText('0.9542')).toBeInTheDocument();
  });

  it('truncates long text and shows "Show more" button', () => {
    render(<ResultCard result={baseResult} rank={1} />);
    expect(screen.getByText('Show more')).toBeInTheDocument();
  });

  it('expands text when "Show more" is clicked', async () => {
    const user = userEvent.setup();
    render(<ResultCard result={baseResult} rank={1} />);

    await user.click(screen.getByText('Show more'));
    expect(screen.getByText('Show less')).toBeInTheDocument();
    expect(screen.queryByText('Show more')).toBeNull();
  });

  it('does not show "Show more" for short text', () => {
    const shortResult = { ...baseResult, text: 'Short text' };
    render(<ResultCard result={shortResult} rank={1} />);
    expect(screen.queryByText('Show more')).toBeNull();
  });

  it('renders source link when url is provided', () => {
    render(<ResultCard result={baseResult} rank={1} />);
    const link = screen.getByText('View source');
    expect(link.closest('a')).toHaveAttribute('href', baseResult.url);
    expect(link.closest('a')).toHaveAttribute('target', '_blank');
  });

  it('does not render source link when url is missing', () => {
    const noUrlResult = { ...baseResult, url: undefined };
    render(<ResultCard result={noUrlResult} rank={1} />);
    expect(screen.queryByText('View source')).toBeNull();
  });

  it('renders movement indicator for "up"', () => {
    render(
      <ResultCard
        result={baseResult}
        rank={1}
        movement={{ delta: 3, indicator: 'up', naiveRank: 4 }}
      />,
    );
    expect(screen.getByText('+3')).toBeInTheDocument();
    expect(screen.getByText('(was #4)')).toBeInTheDocument();
  });

  it('renders movement indicator for "new"', () => {
    render(
      <ResultCard
        result={baseResult}
        rank={1}
        movement={{ delta: null, indicator: 'new', naiveRank: null }}
      />,
    );
    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it('renders movement indicator for "same"', () => {
    render(
      <ResultCard
        result={baseResult}
        rank={1}
        movement={{ delta: 0, indicator: 'same', naiveRank: 1 }}
      />,
    );
    expect(screen.getByText('=')).toBeInTheDocument();
  });

  it('handles semantic_text object structure', () => {
    const objTextResult = {
      ...baseResult,
      text: { text: 'Nested content here' } as unknown as string,
    };
    render(<ResultCard result={objTextResult} rank={1} />);
    expect(screen.getByText('Nested content here')).toBeInTheDocument();
  });
});
