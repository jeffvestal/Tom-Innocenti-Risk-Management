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
const PDF_URL = 'https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32024R1689';

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
  const cloudId = process.env.ELASTIC_CLOUD_ID;
  const apiKey = process.env.ELASTIC_API_KEY;

  if (!cloudId || !apiKey) {
    console.error('❌ Missing required environment variables:');
    if (!cloudId) console.error('   - ELASTIC_CLOUD_ID');
    if (!apiKey) console.error('   - ELASTIC_API_KEY');
    console.error('\nPlease copy .env.local.example to .env.local and fill in your credentials.');
    process.exit(1);
  }

  return new Client({
    cloud: { id: cloudId },
    auth: { apiKey },
  });
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

function parseArticles(markdown: string): Article[] {
  const articles: Article[] = [];

  // Pattern to match article headers: "Article 1", "## Article 10", etc.
  const articlePattern = /^(?:#+ )?Article\s+(\d+)\s*\n+([^\n]+)?/m;

  // Split by article boundaries
  const chunks = markdown.split(/(?=^(?:#+ )?Article\s+\d+)/m);

  for (const chunk of chunks) {
    if (!chunk.trim()) continue;

    const match = chunk.match(articlePattern);
    if (!match) continue;

    const articleNum = match[1];
    const titleCandidate = match[2]?.trim() || '';
    const title = titleCandidate || `Article ${articleNum}`;

    // Get body text (everything after the header)
    const bodyStart = match.index! + match[0].length;
    let body = chunk.slice(bodyStart).trim();

    // Clean up: collapse multiple newlines
    body = body.replace(/\n{3,}/g, '\n\n').trim();

    if (body) {
      articles.push({
        id: `en_art_${articleNum}`,
        article_number: articleNum,
        title,
        text: body,
        language: 'en',
        url: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689#Art${articleNum}`,
      });
    }
  }

  return articles;
}

// ============================================================================
// Create Inference Endpoints (Idempotent)
// ============================================================================

async function createEmbeddingInference(es: Client, inferenceId: string): Promise<void> {
  try {
    await es.inference.put({
      inference_id: inferenceId,
      task_type: 'text_embedding',
      inference_config: {
        service: 'jinaai',
        service_settings: {
          model_id: 'jina-embeddings-v3',
        },
        task_settings: {
          task: 'retrieval.passage',
        },
      },
    });
    console.log(`✓ Created embedding endpoint: ${inferenceId}`);
  } catch (error: unknown) {
    const errorStr = String(error).toLowerCase();
    if (errorStr.includes('resource_already_exists') || errorStr.includes('already exists')) {
      console.log(`✓ Embedding endpoint already exists: ${inferenceId}`);
    } else {
      throw error;
    }
  }
}

async function createRerankerInference(es: Client, inferenceId: string): Promise<void> {
  try {
    await es.inference.put({
      inference_id: inferenceId,
      task_type: 'rerank',
      inference_config: {
        service: 'jinaai',
        service_settings: {
          model_id: 'jina-reranker-v2-base-multilingual',
        },
      },
    });
    console.log(`✓ Created reranker endpoint: ${inferenceId}`);
  } catch (error: unknown) {
    const errorStr = String(error).toLowerCase();
    if (errorStr.includes('resource_already_exists') || errorStr.includes('already exists')) {
      console.log(`✓ Reranker endpoint already exists: ${inferenceId}`);
    } else {
      throw error;
    }
  }
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

async function main(): Promise<void> {
  console.log('');
  console.log('═'.repeat(60));
  console.log('  Innocenti Risk Management - Demo Setup');
  console.log('═'.repeat(60));
  console.log('');

  // Initialize Elasticsearch client
  const es = getElasticsearchClient();

  // Test connection
  try {
    const info = await es.info();
    console.log(`✓ Connected to Elasticsearch ${info.version.number}`);
  } catch (error) {
    console.error('❌ Failed to connect to Elasticsearch');
    console.error(`   ${error}`);
    process.exit(1);
  }

  // Check if index already exists and has documents
  try {
    const exists = await es.indices.exists({ index: INDEX_NAME });
    if (exists) {
      const count = await es.count({ index: INDEX_NAME });
      if (count.count > 0) {
        console.log('');
        console.log(`✓ Index "${INDEX_NAME}" already exists with ${count.count} documents`);
        console.log('  Setup is complete - no action needed.');
        console.log('');
        console.log('  Run "npm run dev" to start the application.');
        console.log('');
        return;
      }
    }
  } catch {
    // Index doesn't exist, continue with setup
  }

  console.log('');
  console.log('Setting up demo environment...');
  console.log('');

  // Step 1: Fetch PDF via Jina Reader
  const markdown = await fetchWithJinaReader(PDF_URL);

  // Step 2: Parse into articles
  console.log('');
  const articles = parseArticles(markdown);
  console.log(`✓ Parsed ${articles.length} articles from EU AI Act`);

  // Step 3: Create inference endpoints
  console.log('');
  await createEmbeddingInference(es, EMBEDDING_ID);
  await createRerankerInference(es, RERANKER_ID);

  // Step 4: Create index
  console.log('');
  await createIndex(es, INDEX_NAME, EMBEDDING_ID);

  // Step 5: Bulk index articles
  console.log('');
  await bulkIndexArticles(es, INDEX_NAME, articles);

  // Done!
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
