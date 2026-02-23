import { NextRequest, NextResponse } from 'next/server';
import {
  INDEX_NAME,
  EMBEDDING_ID,
  RERANKER_ID,
  PDF_URLS,
  type SupportedLang,
  getElasticsearchClient,
  fetchWithJinaReader,
  parseArticles,
  verifyEmbeddingEndpoint,
  createRerankerInference,
  createIndexIfNeeded,
  bulkIndexArticles,
  countByLanguage,
  getSampleArticles,
} from '@/lib/ingest';

type StepId = 'fetch' | 'parse' | 'inference' | 'index' | 'complete';

interface ProgressEvent {
  step: StepId;
  status: 'start' | 'progress' | 'done' | 'error';
  message: string;
  detail?: Record<string, unknown>;
}

function ssePayload(event: ProgressEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * GET /api/ingest -- return current index status and whether a server-side
 * Jina key is configured (without exposing the key itself).
 */
export async function GET() {
  try {
    const es = getElasticsearchClient();

    const hasServerKey = !!process.env.JINA_API_KEY;

    let indexExists = false;
    let totalDocs = 0;
    let enCount = 0;
    let deCount = 0;
    let samples: unknown[] = [];

    try {
      const exists = await es.indices.exists({ index: INDEX_NAME });
      indexExists = !!exists;

      if (indexExists) {
        [enCount, deCount, samples] = await Promise.all([
          countByLanguage(es, 'en'),
          countByLanguage(es, 'de'),
          getSampleArticles(es, 6),
        ]);
        totalDocs = enCount + deCount;
      }
    } catch {
      // index doesn't exist yet -- that's fine
    }

    return NextResponse.json({
      hasServerKey,
      indexName: INDEX_NAME,
      indexExists,
      totalDocs,
      enCount,
      deCount,
      samples,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}

/**
 * POST /api/ingest -- run the full ingestion pipeline, streaming progress
 * back to the client via SSE.
 *
 * Body: { jinaKey?: string, languages?: ("en" | "de")[] }
 * Defaults to both languages when omitted.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const jinaKey = body.jinaKey || process.env.JINA_API_KEY;

    const VALID_LANGS: SupportedLang[] = ['en', 'de'];
    const languages: SupportedLang[] = Array.isArray(body.languages)
      ? body.languages.filter((l: string) => VALID_LANGS.includes(l as SupportedLang))
      : VALID_LANGS;

    if (languages.length === 0) {
      return NextResponse.json(
        { error: 'No valid languages specified. Use "en", "de", or both.' },
        { status: 400 },
      );
    }

    if (!jinaKey) {
      return NextResponse.json(
        { error: 'No Jina API key provided and no server key configured.' },
        { status: 400 },
      );
    }

    const es = getElasticsearchClient();
    const langLabel = languages.map(l => l.toUpperCase()).join(' + ');

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const emit = (event: ProgressEvent) => {
          controller.enqueue(encoder.encode(ssePayload(event)));
        };

        try {
          // Step 1 & 2: Fetch + parse for each language
          const allArticles: Awaited<ReturnType<typeof parseArticles>> = [];

          for (const lang of languages) {
            const tag = lang.toUpperCase();
            const pdfUrl = PDF_URLS[lang];

            emit({
              step: 'fetch',
              status: languages.indexOf(lang) === 0 ? 'start' : 'progress',
              message: `Fetching ${tag} PDF via Jina Reader (r.jina.ai)...`,
              detail: { url: pdfUrl, language: lang },
            });

            const markdown = await fetchWithJinaReader(pdfUrl, jinaKey);

            emit({
              step: 'fetch',
              status: languages.indexOf(lang) === languages.length - 1 ? 'done' : 'progress',
              message: `${tag}: received ${markdown.length.toLocaleString()} characters`,
              detail: { charCount: markdown.length, language: lang },
            });

            emit({
              step: 'parse',
              status: languages.indexOf(lang) === 0 ? 'start' : 'progress',
              message: `Splitting ${tag} markdown into articles...`,
            });

            const articles = parseArticles(markdown, lang);
            allArticles.push(...articles);

            emit({
              step: 'parse',
              status: languages.indexOf(lang) === languages.length - 1 ? 'done' : 'progress',
              message: `${tag}: parsed ${articles.length} articles`,
              detail: {
                articleCount: articles.length,
                language: lang,
                sampleTitles: articles.slice(0, 3).map(a => `Art. ${a.article_number}: ${a.title}`),
              },
            });
          }

          // Step 3: Verify/create inference endpoints (language-agnostic, runs once)
          emit({
            step: 'inference',
            status: 'start',
            message: 'Setting up Jina inference endpoints in Elasticsearch...',
          });

          await verifyEmbeddingEndpoint(es, EMBEDDING_ID);
          emit({
            step: 'inference',
            status: 'progress',
            message: `Using built-in embedding endpoint: ${EMBEDDING_ID}`,
            detail: { endpoint: EMBEDDING_ID, builtIn: true },
          });

          const rerankerCreated = await createRerankerInference(es, RERANKER_ID, jinaKey);
          emit({
            step: 'inference',
            status: 'progress',
            message: rerankerCreated
              ? `Created reranker endpoint: ${RERANKER_ID}`
              : `Reranker endpoint already exists: ${RERANKER_ID}`,
            detail: { endpoint: RERANKER_ID, created: rerankerCreated },
          });

          const indexCreated = await createIndexIfNeeded(es, INDEX_NAME, EMBEDDING_ID);
          emit({
            step: 'inference',
            status: 'done',
            message: indexCreated
              ? `Created index: ${INDEX_NAME}`
              : `Index already exists: ${INDEX_NAME}`,
            detail: { index: INDEX_NAME, created: indexCreated },
          });

          // Step 4: Bulk index all articles
          emit({
            step: 'index',
            status: 'start',
            message: `Indexing ${allArticles.length} ${langLabel} articles with auto-embedding...`,
            detail: { articleCount: allArticles.length },
          });

          const result = await bulkIndexArticles(es, INDEX_NAME, allArticles);

          emit({
            step: 'index',
            status: 'done',
            message: `Indexed ${result.success}/${result.total} documents`,
            detail: { ...result },
          });

          // Step 5: Complete
          const samples = await getSampleArticles(es, 6);
          const enCount = await countByLanguage(es, 'en');
          const deCount = await countByLanguage(es, 'de');

          emit({
            step: 'complete',
            status: 'done',
            message: 'Pipeline complete — data is ready for search',
            detail: {
              totalDocs: enCount + deCount,
              enCount,
              deCount,
              samples,
            },
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          emit({ step: 'fetch', status: 'error', message: msg });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
