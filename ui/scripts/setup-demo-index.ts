/**
 * Innocenti Risk Management - Demo Index Setup Script
 * 
 * This script creates a self-contained demo environment:
 * 1. Checks if the demo index already exists (idempotent)
 * 2. Fetches EU AI Act PDF via Jina Reader API
 * 3. Parses the markdown into article chunks
 * 4. Creates inference endpoints (embeddings + reranker)
 * 5. Creates the index with semantic_text mapping
 * 6. Bulk indexes all articles
 * 
 * Usage: npm run setup
 * Requires: ELASTIC_CLOUD_ID, ELASTIC_API_KEY, JINA_API_KEY in .env.local
 */

import { Client } from '@elastic/elasticsearch';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Configuration
const INDEX_NAME = 'search-eu-ai-act-demo';
const EMBEDDING_ID = 'jina-embeddings-v3-demo';
const RERANKER_ID = 'jina-reranker-v3-demo';

const PDF_URLS: Record<string, string> = {
  en: 'https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32024R1689',
  de: 'https://eur-lex.europa.eu/legal-content/DE/TXT/PDF/?uri=CELEX:32024R1689',
};

type SupportedLang = 'en' | 'de';

function parseCLIFlags(): { langs: SupportedLang[]; force: boolean } {
  const args = process.argv.slice(2);
  const langArg = args.find(a => a.startsWith('--lang='));
  const force = args.includes('--force');

  if (langArg) {
    const val = langArg.split('=')[1] as SupportedLang;
    if (val !== 'en' && val !== 'de') {
      console.error(`❌ Invalid --lang value: "${val}". Use "en" or "de".`);
      process.exit(1);
    }
    return { langs: [val], force };
  }

  return { langs: ['en', 'de'], force };
}

// Article structure
interface Article {
  id: string;
  article_number: string;
  title: string;
  text: string;
  language: string;
  url: string;
}

// ============================================================================
// Elasticsearch Client
// ============================================================================

function getElasticsearchClient(): Client {
  const apiKey = process.env.ELASTIC_API_KEY;
  const url = process.env.ELASTICSEARCH_URL;
  const cloudId = process.env.ELASTIC_CLOUD_ID;

  if (!apiKey || (!url && !cloudId)) {
    console.error('❌ Missing required environment variables:');
    if (!apiKey) console.error('   - ELASTIC_API_KEY');
    if (!url && !cloudId) console.error('   - ELASTICSEARCH_URL (or ELASTIC_CLOUD_ID)');
    console.error('\nPlease copy .env.local.example to .env.local and fill in your credentials.');
    process.exit(1);
  }

  return url
    ? new Client({ node: url, auth: { apiKey } })
    : new Client({ cloud: { id: cloudId! }, auth: { apiKey } });
}

// ============================================================================
// Jina Reader - Fetch PDF as Markdown
// ============================================================================

async function fetchWithJinaReader(url: string, maxRetries = 3): Promise<string> {
  const jinaKey = process.env.JINA_API_KEY;

  if (!jinaKey) {
    console.error('❌ Missing JINA_API_KEY environment variable');
    console.error('   Get your free API key at: https://jina.ai/api-dashboard/');
    process.exit(1);
  }

  const readerUrl = `https://r.jina.ai/${url}`;

  console.log('📄 Fetching PDF via Jina Reader...');
  console.log('   (This may take 30-60 seconds for a large document)');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(readerUrl, {
        headers: {
          'Authorization': `Bearer ${jinaKey}`,
          'x-respond-with': 'markdown',
          'Accept': 'text/plain',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();

      // Check if we got actual content
      if (content.trim().length > 100) {
        console.log(`✓ Received ${content.length.toLocaleString()} characters`);
        return content;
      }

      // Empty response - retry
      if (attempt < maxRetries) {
        const waitTime = attempt * 5;
        console.log(`⚠ Empty response (attempt ${attempt}/${maxRetries}). Retrying in ${waitTime}s...`);
        await sleep(waitTime * 1000);
      }
    } catch (error) {
      if (attempt < maxRetries) {
        const waitTime = attempt * 5;
        console.log(`⚠ Error (attempt ${attempt}/${maxRetries}): ${error}. Retrying in ${waitTime}s...`);
        await sleep(waitTime * 1000);
      } else {
        throw error;
      }
    }
  }

  throw new Error('Failed to fetch PDF after multiple retries');
}

// ============================================================================
// Parse Markdown into Articles
// ============================================================================

function parseArticles(markdown: string, language: SupportedLang): Article[] {
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

// ============================================================================
// Create Inference Endpoints (Idempotent)
// ============================================================================

async function inferenceExists(es: Client, inferenceId: string): Promise<boolean> {
  try {
    await es.inference.get({ inference_id: inferenceId });
    return true;
  } catch {
    return false;
  }
}

async function createEmbeddingInference(es: Client, inferenceId: string): Promise<void> {
  if (await inferenceExists(es, inferenceId)) {
    console.log(`✓ Embedding endpoint already exists: ${inferenceId}`);
    return;
  }
  await es.inference.put({
    inference_id: inferenceId,
    task_type: 'text_embedding',
    inference_config: {
      service: 'jinaai',
      service_settings: {
        model_id: 'jina-embeddings-v3',
        api_key: process.env.JINA_API_KEY!,
      },
    },
  });
  console.log(`✓ Created embedding endpoint: ${inferenceId}`);
}

async function createRerankerInference(es: Client, inferenceId: string): Promise<void> {
  if (await inferenceExists(es, inferenceId)) {
    console.log(`✓ Reranker endpoint already exists: ${inferenceId}`);
    return;
  }
  await es.inference.put({
    inference_id: inferenceId,
    task_type: 'rerank',
    inference_config: {
      service: 'jinaai',
      service_settings: {
        model_id: 'jina-reranker-v2-base-multilingual',
        api_key: process.env.JINA_API_KEY!,
      },
    },
  });
  console.log(`✓ Created reranker endpoint: ${inferenceId}`);
}

// ============================================================================
// Create Index with semantic_text Mapping
// ============================================================================

async function createIndex(es: Client, indexName: string, embeddingId: string): Promise<void> {
  // Check if index exists
  const exists = await es.indices.exists({ index: indexName });
  
  if (exists) {
    console.log(`✓ Index already exists: ${indexName}`);
    return;
  }

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

  console.log(`✓ Created index: ${indexName}`);
}

// ============================================================================
// Bulk Index Articles
// ============================================================================

async function bulkIndexArticles(es: Client, indexName: string, articles: Article[]): Promise<void> {
  console.log(`📥 Indexing ${articles.length} articles...`);
  console.log('   (Embeddings are generated automatically - this may take a minute)');

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

  const result = await es.bulk({
    operations,
    refresh: true,
  });

  if (result.errors) {
    const errors = result.items.filter(item => item.index?.error);
    console.error(`⚠ ${errors.length} indexing errors occurred`);
    errors.slice(0, 3).forEach(item => {
      console.error(`   - ${item.index?.error?.reason}`);
    });
  }

  const successCount = result.items.filter(item => !item.index?.error).length;
  console.log(`✓ Indexed ${successCount} documents`);
}

// ============================================================================
// Utility Functions
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Main
// ============================================================================

async function countByLanguage(es: Client, lang: string): Promise<number> {
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

async function main(): Promise<void> {
  const { langs, force } = parseCLIFlags();

  console.log('');
  console.log('═'.repeat(60));
  console.log('  Innocenti Risk Management - Demo Setup');
  console.log('═'.repeat(60));
  console.log(`  Languages: ${langs.map(l => l.toUpperCase()).join(', ')}${force ? ' (force)' : ''}`);
  console.log('');

  const es = getElasticsearchClient();

  try {
    const info = await es.info();
    console.log(`✓ Connected to Elasticsearch ${info.version.number}`);
  } catch (error) {
    console.error('❌ Failed to connect to Elasticsearch');
    console.error(`   ${error}`);
    process.exit(1);
  }

  // Create inference endpoints and index (idempotent)
  console.log('');
  await createEmbeddingInference(es, EMBEDDING_ID);
  await createRerankerInference(es, RERANKER_ID);
  console.log('');
  await createIndex(es, INDEX_NAME, EMBEDDING_ID);

  // Process each requested language
  for (const lang of langs) {
    console.log('');
    console.log(`── ${lang.toUpperCase()} ──`);

    if (!force) {
      const existing = await countByLanguage(es, lang);
      if (existing > 0) {
        console.log(`✓ ${existing} ${lang.toUpperCase()} documents already indexed. Skipping. (use --force to re-index)`);
        continue;
      }
    }

    const pdfUrl = PDF_URLS[lang];
    console.log(`📄 Fetching ${lang.toUpperCase()} PDF...`);
    const markdown = await fetchWithJinaReader(pdfUrl);

    console.log('');
    const articles = parseArticles(markdown, lang);
    console.log(`✓ Parsed ${articles.length} ${lang.toUpperCase()} articles from EU AI Act`);

    console.log('');
    await bulkIndexArticles(es, INDEX_NAME, articles);
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('  Setup Complete!');
  console.log('═'.repeat(60));
  console.log('');
  console.log('  Run "npm run dev" to start the application.');
  console.log('');
}

// Run
main().catch(error => {
  console.error('');
  console.error('❌ Setup failed:', error.message || error);
  process.exit(1);
});
