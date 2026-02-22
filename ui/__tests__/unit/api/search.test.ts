import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockSearchNaive = vi.fn();
const mockSearchWithReranker = vi.fn();

vi.mock('@/lib/elasticsearch', () => ({
  searchNaive: (...args: unknown[]) => mockSearchNaive(...args),
  searchWithReranker: (...args: unknown[]) => mockSearchWithReranker(...args),
}));

import { POST, GET } from '@/app/api/search/route';

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/search', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  mockSearchNaive.mockReset();
  mockSearchWithReranker.mockReset();
});

describe('POST /api/search', () => {
  it('returns 400 when query is missing', async () => {
    const resp = await POST(makeRequest({ rerank: false }));
    expect(resp.status).toBe(400);
    const data = await resp.json();
    expect(data.error).toMatch(/missing/i);
  });

  it('returns 400 when query is empty string', async () => {
    const resp = await POST(makeRequest({ query: '   ', rerank: false }));
    expect(resp.status).toBe(400);
    const data = await resp.json();
    expect(data.error).toMatch(/empty/i);
  });

  it('calls searchNaive when rerank is false', async () => {
    mockSearchNaive.mockResolvedValue([{ id: '1', title: 'Test' }]);

    const resp = await POST(makeRequest({ query: 'test query', rerank: false }));
    expect(resp.status).toBe(200);

    const data = await resp.json();
    expect(data.reranked).toBe(false);
    expect(data.query).toBe('test query');
    expect(data.results).toEqual([{ id: '1', title: 'Test' }]);

    expect(mockSearchNaive).toHaveBeenCalledWith('test query', 'en');
    expect(mockSearchWithReranker).not.toHaveBeenCalled();
  });

  it('calls searchWithReranker when rerank is true', async () => {
    mockSearchWithReranker.mockResolvedValue([]);

    const resp = await POST(makeRequest({ query: 'test', rerank: true }));
    expect(resp.status).toBe(200);

    const data = await resp.json();
    expect(data.reranked).toBe(true);
    expect(mockSearchWithReranker).toHaveBeenCalledWith('test', 'en');
  });

  it('passes language parameter to search functions', async () => {
    mockSearchNaive.mockResolvedValue([]);
    await POST(makeRequest({ query: 'test', rerank: false, language: 'de' }));
    expect(mockSearchNaive).toHaveBeenCalledWith('test', 'de');
  });

  it('includes took timing in response', async () => {
    mockSearchNaive.mockResolvedValue([]);
    const resp = await POST(makeRequest({ query: 'test', rerank: false }));
    const data = await resp.json();
    expect(typeof data.took).toBe('number');
    expect(data.took).toBeGreaterThanOrEqual(0);
  });

  it('returns 503 for config errors', async () => {
    mockSearchNaive.mockRejectedValue(new Error('Missing ELASTIC_API_KEY and one of ELASTICSEARCH_URL or ELASTIC_CLOUD_ID'));

    const resp = await POST(makeRequest({ query: 'test', rerank: false }));
    expect(resp.status).toBe(503);
    const data = await resp.json();
    expect(data.error).toMatch(/not configured/i);
  });

  it('returns 503 for index_not_found', async () => {
    mockSearchNaive.mockRejectedValue(new Error('index_not_found_exception'));

    const resp = await POST(makeRequest({ query: 'test', rerank: false }));
    expect(resp.status).toBe(503);
  });

  it('returns 500 for generic errors', async () => {
    mockSearchNaive.mockRejectedValue(new Error('something broke'));

    const resp = await POST(makeRequest({ query: 'test', rerank: false }));
    expect(resp.status).toBe(500);
  });
});

describe('GET /api/search', () => {
  it('returns 405 Method Not Allowed', async () => {
    const resp = await GET();
    expect(resp.status).toBe(405);
  });
});
