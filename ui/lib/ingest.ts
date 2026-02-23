/**
 * Shared ingestion logic for Jina Reader pipeline.
 *
 * Used by both the CLI setup script (scripts/setup-demo-index.ts)
 * and the /api/ingest SSE route.
 */

import { Client } from '@elastic/elasticsearch';

export const INDEX_NAME = 'search-eu-ai-act-demo';
export const EMBEDDING_ID = '.jina-embeddings-v5-text-small';
export const RERANKER_ID = 'jina-reranker-v3-demo';

export const PDF_URLS: Record<string, string> = {
  en: 'https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32024R1689',
  de: 'https://eur-lex.europa.eu/legal-content/DE/TXT/PDF/?uri=CELEX:32024R1689',
};

export type SupportedLang = 'en' | 'de';

export interface Article {
  id: string;
  article_number: string;
  title: string;
  text: string;
  language: string;
  url: string;
}

export interface BulkIndexResult {
  total: number;
  success: number;
  errors: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Elasticsearch Client
// ---------------------------------------------------------------------------

export function getElasticsearchClient(): Client {
  const apiKey = process.env.ELASTIC_API_KEY;
  const url = process.env.ELASTICSEARCH_URL;
  const cloudId = process.env.ELASTIC_CLOUD_ID;

  if (!apiKey || (!url && !cloudId)) {
    throw new Error(
      'Missing ELASTIC_API_KEY and one of ELASTICSEARCH_URL or ELASTIC_CLOUD_ID'
    );
  }

  return url
    ? new Client({ node: url, auth: { apiKey } })
    : new Client({ cloud: { id: cloudId! }, auth: { apiKey } });
}

// ---------------------------------------------------------------------------
// Jina Reader -- fetch PDF as markdown
// ---------------------------------------------------------------------------

export async function fetchWithJinaReader(
  url: string,
  jinaKey: string,
  maxRetries = 3,
): Promise<string> {
  const readerUrl = `https://r.jina.ai/${url}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(readerUrl, {
        headers: {
          Authorization: `Bearer ${jinaKey}`,
          'x-respond-with': 'markdown',
          Accept: 'text/plain',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();

      if (content.trim().length > 100) {
        return content;
      }

      if (attempt < maxRetries) {
        const waitTime = attempt * 5;
        await sleep(waitTime * 1000);
      }
    } catch (error) {
      if (attempt < maxRetries) {
        const waitTime = attempt * 5;
        await sleep(waitTime * 1000);
      } else {
        throw error;
      }
    }
  }

  throw new Error('Failed to fetch PDF after multiple retries');
}

// ---------------------------------------------------------------------------
// Parse markdown into articles
// ---------------------------------------------------------------------------

export function parseArticles(markdown: string, language: SupportedLang): Article[] {
  const articles: Article[] = [];

  const keyword = language === 'de' ? 'Artikel' : 'Article';
  const articlePattern = new RegExp(`^(?:#+ )?${keyword}\\s+(\\d+)\\s*\\n+([^\\n]+)?`, 'm');
  const splitPattern = new RegExp(`(?=^(?:#+ )?${keyword}\\s+\\d+)`, 'm');

  const langUpper = language.toUpperCase();
  const chunks = markdown.split(splitPattern);

  for (const chunk of chunks) {
    if (!chunk.trim()) continue;

    const match = chunk.match(articlePattern);
    if (!match) continue;

    const articleNum = match[1];
    const titleCandidate = match[2]?.trim() || '';
    const title = titleCandidate || `${keyword} ${articleNum}`;

    const bodyStart = match.index! + match[0].length;
    let body = chunk.slice(bodyStart).trim();
    body = body.replace(/\n{3,}/g, '\n\n').trim();

    if (body) {
      articles.push({
        id: `${language}_art_${articleNum}`,
        article_number: articleNum,
        title,
        text: body,
        language,
        url: `https://eur-lex.europa.eu/legal-content/${langUpper}/TXT/?uri=CELEX:32024R1689#Art${articleNum}`,
      });
    }
  }

  return articles;
}

// ---------------------------------------------------------------------------
// Inference endpoints (idempotent)
// ---------------------------------------------------------------------------

async function inferenceExists(es: Client, inferenceId: string): Promise<boolean> {
  try {
    await es.inference.get({ inference_id: inferenceId });
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifies the built-in embedding endpoint exists on Serverless.
 * `.jina-embeddings-v5-text-small` is pre-configured -- no creation needed.
 */
export async function verifyEmbeddingEndpoint(
  es: Client,
  inferenceId: string,
): Promise<boolean> {
  return inferenceExists(es, inferenceId);
}

export async function createRerankerInference(
  es: Client,
  inferenceId: string,
  jinaKey: string,
): Promise<boolean> {
  if (await inferenceExists(es, inferenceId)) return false;

  await es.inference.put({
    inference_id: inferenceId,
    task_type: 'rerank',
    inference_config: {
      service: 'jinaai',
      service_settings: {
        model_id: 'jina-reranker-v2-base-multilingual',
        api_key: jinaKey,
      },
    },
  });
  return true;
}

// ---------------------------------------------------------------------------
// Index creation (idempotent)
// ---------------------------------------------------------------------------

export async function createIndexIfNeeded(
  es: Client,
  indexName: string,
  embeddingId: string,
): Promise<boolean> {
  const exists = await es.indices.exists({ index: indexName });
  if (exists) return false;

  await es.indices.create({
    index: indexName,
    body: {
      mappings: {
        properties: {
          article_number: { type: 'keyword' },
          title: {
            type: 'text',
            fields: { keyword: { type: 'keyword' } },
          },
          text: {
            type: 'semantic_text',
            inference_id: embeddingId,
          },
          language: { type: 'keyword' },
          url: { type: 'keyword' },
        },
      },
    },
  });
  return true;
}

// ---------------------------------------------------------------------------
// Bulk indexing
// ---------------------------------------------------------------------------

export async function bulkIndexArticles(
  es: Client,
  indexName: string,
  articles: Article[],
): Promise<BulkIndexResult> {
  const operations = articles.flatMap(article => [
    { index: { _index: indexName, _id: article.id } },
    {
      article_number: article.article_number,
      title: article.title,
      text: article.text,
      language: article.language,
      url: article.url,
    },
  ]);

  const result = await es.bulk({ operations, refresh: true });

  const errorCount = result.items.filter(item => item.index?.error).length;
  const successCount = result.items.filter(item => !item.index?.error).length;

  return { total: articles.length, success: successCount, errors: errorCount };
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

export async function countByLanguage(es: Client, lang: string): Promise<number> {
  try {
    const result = await es.count({
      index: INDEX_NAME,
      body: { query: { term: { language: lang } } },
    });
    return result.count;
  } catch {
    return 0;
  }
}

export async function getSampleArticles(
  es: Client,
  size = 6,
): Promise<Article[]> {
  try {
    const response = await es.search({
      index: INDEX_NAME,
      body: {
        query: { match_all: {} },
        size,
        sort: [{ article_number: 'asc' }, { language: 'asc' }],
        _source: ['article_number', 'title', 'text', 'language', 'url'],
      },
    });

    return response.hits.hits.map(hit => {
      const src = hit._source as Record<string, unknown>;
      let textContent = src.text as string;
      if (typeof src.text === 'object' && src.text !== null) {
        const textObj = src.text as { text?: string };
        textContent = textObj.text || '';
      }
      return {
        id: hit._id as string,
        article_number: src.article_number as string,
        title: src.title as string,
        text: textContent,
        language: src.language as string,
        url: src.url as string,
      };
    });
  } catch {
    return [];
  }
}
