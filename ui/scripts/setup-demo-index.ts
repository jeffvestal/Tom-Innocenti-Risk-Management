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

import { config } from 'dotenv';
import { resolve } from 'path';
import {
  INDEX_NAME,
  EMBEDDING_ID,
  RERANKER_ID,
  PDF_URLS,
  type SupportedLang,
  getElasticsearchClient,
  fetchWithJinaReader,
  parseArticles,
  createEmbeddingInference,
  createRerankerInference,
  createIndexIfNeeded,
  bulkIndexArticles,
  countByLanguage,
} from '../lib/ingest';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

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

async function main(): Promise<void> {
  const { langs, force } = parseCLIFlags();
  const jinaKey = process.env.JINA_API_KEY;

  if (!jinaKey) {
    console.error('❌ Missing JINA_API_KEY environment variable');
    console.error('   Get your free API key at: https://jina.ai/api-dashboard/');
    process.exit(1);
  }

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

  console.log('');
  const embeddingCreated = await createEmbeddingInference(es, EMBEDDING_ID, jinaKey);
  console.log(embeddingCreated
    ? `✓ Created embedding endpoint: ${EMBEDDING_ID}`
    : `✓ Embedding endpoint already exists: ${EMBEDDING_ID}`);

  const rerankerCreated = await createRerankerInference(es, RERANKER_ID, jinaKey);
  console.log(rerankerCreated
    ? `✓ Created reranker endpoint: ${RERANKER_ID}`
    : `✓ Reranker endpoint already exists: ${RERANKER_ID}`);

  console.log('');
  const indexCreated = await createIndexIfNeeded(es, INDEX_NAME, EMBEDDING_ID);
  console.log(indexCreated
    ? `✓ Created index: ${INDEX_NAME}`
    : `✓ Index already exists: ${INDEX_NAME}`);

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
    console.log('📄 Fetching PDF via Jina Reader...');
    console.log('   (This may take 30-60 seconds for a large document)');
    const markdown = await fetchWithJinaReader(pdfUrl, jinaKey);
    console.log(`✓ Received ${markdown.length.toLocaleString()} characters`);

    console.log('');
    const articles = parseArticles(markdown, lang);
    console.log(`✓ Parsed ${articles.length} ${lang.toUpperCase()} articles from EU AI Act`);

    console.log('');
    console.log(`📥 Indexing ${articles.length} articles...`);
    console.log('   (Embeddings are generated automatically - this may take a minute)');
    const result = await bulkIndexArticles(es, INDEX_NAME, articles);

    if (result.errors > 0) {
      console.error(`⚠ ${result.errors} indexing errors occurred`);
    }
    console.log(`✓ Indexed ${result.success} documents`);
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('  Setup Complete!');
  console.log('═'.repeat(60));
  console.log('');
  console.log('  Run "npm run dev" to start the application.');
  console.log('');
}

main().catch(error => {
  console.error('');
  console.error('❌ Setup failed:', error.message || error);
  process.exit(1);
});
