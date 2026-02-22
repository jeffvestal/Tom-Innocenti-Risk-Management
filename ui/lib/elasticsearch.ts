/**
 * Elasticsearch Client & Search Functions
 * 
 * Provides a singleton client and search functions for:
 * - Naive semantic search (vector similarity only)
 * - Reranked search (using retrievers API with text_similarity_reranker)
 */

import { Client } from '@elastic/elasticsearch';
import type { SearchResult } from '@/types';

// Configuration
const INDEX_NAME = 'search-eu-ai-act-demo';
const RERANKER_ID = 'jina-reranker-v3-demo';

// Singleton client instance
let client: Client | null = null;

/**
 * Get or create the Elasticsearch client singleton
 */
export function getClient(): Client {
  if (client) return client;

  const apiKey = process.env.ELASTIC_API_KEY;
  const url = process.env.ELASTICSEARCH_URL;
  const cloudId = process.env.ELASTIC_CLOUD_ID;

  if (!apiKey || (!url && !cloudId)) {
    throw new Error(
      'Missing ELASTIC_API_KEY and one of ELASTICSEARCH_URL or ELASTIC_CLOUD_ID'
    );
  }

  client = url
    ? new Client({ node: url, auth: { apiKey } })
    : new Client({ cloud: { id: cloudId! }, auth: { apiKey } });

  return client;
}

/**
 * Transform Elasticsearch hit to SearchResult
 */
function hitToResult(hit: Record<string, unknown>): SearchResult {
  const source = hit._source as Record<string, unknown>;
  
  // Handle semantic_text structure - text might be an object with a text property
  let textContent = source.text as string;
  if (typeof source.text === 'object' && source.text !== null) {
    const textObj = source.text as { text?: string };
    textContent = textObj.text || JSON.stringify(source.text);
  }

  return {
    id: hit._id as string,
    article_number: source.article_number as string,
    title: source.title as string,
    text: textContent,
    score: hit._score as number,
    language: source.language as string,
    url: source.url as string,
  };
}

/**
 * Perform naive semantic search (vector similarity only)
 */
export async function searchNaive(query: string, language = 'en', size = 10): Promise<SearchResult[]> {
  const es = getClient();

  const response = await es.search({
    index: INDEX_NAME,
    body: {
      query: {
        bool: {
          must: [{ semantic: { field: 'text', query } }],
          filter: [{ term: { language } }],
        },
      },
      size,
      _source: ['article_number', 'title', 'text', 'language', 'url'],
    },
  });

  return response.hits.hits.map(hit => hitToResult(hit as Record<string, unknown>));
}

/**
 * Perform semantic search with reranking via retrievers API
 * 
 * Uses text_similarity_reranker to apply Jina Reranker v3's
 * listwise attention mechanism for improved precision.
 */
export async function searchWithReranker(
  query: string,
  language = 'en',
  initialSize = 50,
  finalSize = 10
): Promise<SearchResult[]> {
  const es = getClient();

  const response = await es.search({
    index: INDEX_NAME,
    body: {
      retriever: {
        text_similarity_reranker: {
          retriever: {
            standard: {
              query: {
                bool: {
                  must: [{ semantic: { field: 'text', query } }],
                  filter: [{ term: { language } }],
                },
              },
            },
          },
          field: 'text',
          inference_id: RERANKER_ID,
          inference_text: query,
          rank_window_size: initialSize,
        },
      },
      size: finalSize,
      _source: ['article_number', 'title', 'text', 'language', 'url'],
    },
  });

  return response.hits.hits.map(hit => hitToResult(hit as Record<string, unknown>));
}

/**
 * Check if the demo index exists and has documents
 */
export async function checkIndexHealth(): Promise<{ exists: boolean; count: number }> {
  const es = getClient();

  try {
    const exists = await es.indices.exists({ index: INDEX_NAME });
    if (!exists) {
      return { exists: false, count: 0 };
    }

    const countResponse = await es.count({ index: INDEX_NAME });
    return { exists: true, count: countResponse.count };
  } catch {
    return { exists: false, count: 0 };
  }
}
