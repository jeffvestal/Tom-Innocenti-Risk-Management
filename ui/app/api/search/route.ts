/**
 * Search API Route
 * 
 * POST /api/search
 * Body: { query: string, rerank: boolean }
 * 
 * Proxies search requests to Elasticsearch, supporting:
 * - Naive semantic search (rerank: false)
 * - Reranked search with Jina Reranker v3 (rerank: true)
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchNaive, searchWithReranker } from '@/lib/elasticsearch';
import type { SearchRequest, SearchResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SearchRequest;
    const { query, rerank } = body;

    // Validate request
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "query" field' },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      return NextResponse.json(
        { error: 'Query cannot be empty' },
        { status: 400 }
      );
    }

    // Perform search
    const startTime = Date.now();
    
    const results = rerank
      ? await searchWithReranker(trimmedQuery)
      : await searchNaive(trimmedQuery);

    const took = Date.now() - startTime;

    // Return response
    const response: SearchResponse = {
      results,
      query: trimmedQuery,
      reranked: !!rerank,
      took,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Search error:', error);

    // Check for specific error types
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if it's a connection/config error
    if (errorMessage.includes('ELASTIC_CLOUD_ID') || errorMessage.includes('ELASTIC_API_KEY')) {
      return NextResponse.json(
        { error: 'Elasticsearch not configured. Please run "npm run setup" first.' },
        { status: 503 }
      );
    }

    // Check if it's an index not found error
    if (errorMessage.includes('index_not_found') || errorMessage.includes('no such index')) {
      return NextResponse.json(
        { error: 'Search index not found. Please run "npm run setup" first.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Search failed. Please try again.' },
      { status: 500 }
    );
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}
