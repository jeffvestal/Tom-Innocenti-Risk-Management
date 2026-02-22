import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSearch = vi.fn();
const mockIndicesExists = vi.fn();
const mockCount = vi.fn();

vi.mock('@elastic/elasticsearch', () => {
  return {
    Client: class MockClient {
      search = mockSearch;
      indices = { exists: mockIndicesExists };
      count = mockCount;
    },
  };
});

let getClient: typeof import('@/lib/elasticsearch').getClient;
let searchNaive: typeof import('@/lib/elasticsearch').searchNaive;
let searchWithReranker: typeof import('@/lib/elasticsearch').searchWithReranker;
let checkIndexHealth: typeof import('@/lib/elasticsearch').checkIndexHealth;

beforeEach(async () => {
  vi.stubEnv('ELASTIC_API_KEY', 'test-key');
  vi.stubEnv('ELASTICSEARCH_URL', 'https://test.es.cloud:443');
  delete process.env.ELASTIC_CLOUD_ID;
  mockSearch.mockReset();
  mockIndicesExists.mockReset();
  mockCount.mockReset();

  vi.resetModules();
  const mod = await import('@/lib/elasticsearch');
  getClient = mod.getClient;
  searchNaive = mod.searchNaive;
  searchWithReranker = mod.searchWithReranker;
  checkIndexHealth = mod.checkIndexHealth;
});

describe('getClient', () => {
  it('creates a client when ELASTICSEARCH_URL is set', () => {
    const client = getClient();
    expect(client).toBeDefined();
    expect(client.search).toBeDefined();
  });

  it('throws when credentials are missing', async () => {
    vi.stubEnv('ELASTIC_API_KEY', '');
    vi.resetModules();
    const mod = await import('@/lib/elasticsearch');
    expect(() => mod.getClient()).toThrow('Missing ELASTIC_API_KEY');
  });
});

describe('searchNaive', () => {
  it('builds correct query with language filter', async () => {
    mockSearch.mockResolvedValue({
      hits: {
        hits: [
          {
            _id: 'en_art_5',
            _score: 0.95,
            _source: {
              article_number: '5',
              title: 'Prohibited Practices',
              text: 'Some article text',
              language: 'en',
              url: 'https://example.com/art5',
            },
          },
        ],
      },
    });

    const results = await searchNaive('facial recognition', 'en', 10);

    expect(mockSearch).toHaveBeenCalledWith({
      index: 'search-eu-ai-act-demo',
      body: {
        query: {
          bool: {
            must: [{ semantic: { field: 'text', query: 'facial recognition' } }],
            filter: [{ term: { language: 'en' } }],
          },
        },
        size: 10,
        _source: ['article_number', 'title', 'text', 'language', 'url'],
      },
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      id: 'en_art_5',
      article_number: '5',
      title: 'Prohibited Practices',
      text: 'Some article text',
      score: 0.95,
      language: 'en',
      url: 'https://example.com/art5',
    });
  });

  it('passes German language filter when language is de', async () => {
    mockSearch.mockResolvedValue({ hits: { hits: [] } });
    await searchNaive('Gesichtserkennung', 'de');

    const call = mockSearch.mock.calls[0][0];
    expect(call.body.query.bool.filter).toEqual([{ term: { language: 'de' } }]);
  });

  it('handles semantic_text object structure', async () => {
    mockSearch.mockResolvedValue({
      hits: {
        hits: [
          {
            _id: 'art_1',
            _score: 0.8,
            _source: {
              article_number: '1',
              title: 'Subject',
              text: { text: 'Nested text content' },
              language: 'en',
            },
          },
        ],
      },
    });

    const results = await searchNaive('test');
    expect(results[0].text).toBe('Nested text content');
  });
});

describe('searchWithReranker', () => {
  it('builds retriever query with reranker', async () => {
    mockSearch.mockResolvedValue({ hits: { hits: [] } });
    await searchWithReranker('test query', 'en', 50, 10);

    const call = mockSearch.mock.calls[0][0];
    expect(call.body.retriever.text_similarity_reranker).toBeDefined();
    expect(call.body.retriever.text_similarity_reranker.inference_id).toBe('jina-reranker-v3-demo');
    expect(call.body.retriever.text_similarity_reranker.inference_text).toBe('test query');
    expect(call.body.retriever.text_similarity_reranker.rank_window_size).toBe(50);
    expect(call.body.size).toBe(10);
  });

  it('includes language filter in nested standard retriever', async () => {
    mockSearch.mockResolvedValue({ hits: { hits: [] } });
    await searchWithReranker('test', 'de');

    const call = mockSearch.mock.calls[0][0];
    const standardQuery = call.body.retriever.text_similarity_reranker.retriever.standard.query;
    expect(standardQuery.bool.filter).toEqual([{ term: { language: 'de' } }]);
  });
});

describe('checkIndexHealth', () => {
  it('returns exists: true with count when index exists', async () => {
    mockIndicesExists.mockResolvedValue(true);
    mockCount.mockResolvedValue({ count: 100 });

    const result = await checkIndexHealth();
    expect(result).toEqual({ exists: true, count: 100 });
  });

  it('returns exists: false when index does not exist', async () => {
    mockIndicesExists.mockResolvedValue(false);

    const result = await checkIndexHealth();
    expect(result).toEqual({ exists: false, count: 0 });
  });

  it('returns exists: false on error', async () => {
    mockIndicesExists.mockRejectedValue(new Error('connection refused'));

    const result = await checkIndexHealth();
    expect(result).toEqual({ exists: false, count: 0 });
  });
});
