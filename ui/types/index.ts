/**
 * Innocenti Risk Management - Type Definitions
 */

// Search result from Elasticsearch
export interface SearchResult {
  id: string;
  article_number: string;
  title: string;
  text: string;
  score: number;
  language?: string;
  url?: string;
}

// API request body
export interface SearchRequest {
  query: string;
  rerank: boolean;
  language?: string;
}

// API response
export interface SearchResponse {
  results: SearchResult[];
  query: string;
  reranked: boolean;
  took?: number;
}

// Movement indicator for comparison view
export interface RankMovement {
  articleNumber: string;
  naiveRank: number | null;
  rerankedRank: number;
  delta: number | null;
  indicator: 'up' | 'down' | 'same' | 'new';
}

// Vision API response
export interface VisionResponse {
  analysis: string;
}

export interface VisionErrorResponse {
  error: string;
  coldStart?: boolean;
}

export interface AuditError {
  message: string;
  detail?: string;
}

// ---------------------------------------------------------------------------
// Data Lab / Ingest pipeline types
// ---------------------------------------------------------------------------

export type PipelineStepId = 'fetch' | 'parse' | 'inference' | 'index' | 'complete';
export type PipelineStepStatus = 'idle' | 'running' | 'done' | 'error';

export interface PipelineStep {
  id: PipelineStepId;
  label: string;
  description: string;
  status: PipelineStepStatus;
  message?: string;
  detail?: Record<string, unknown>;
}

export interface IngestStatusResponse {
  hasServerKey: boolean;
  indexName: string;
  indexExists: boolean;
  totalDocs: number;
  enCount: number;
  deCount: number;
  samples: SampleArticle[];
}

export interface SampleArticle {
  id: string;
  article_number: string;
  title: string;
  text: string;
  language: string;
  url: string;
}

export interface IngestProgressEvent {
  step: PipelineStepId;
  status: 'start' | 'progress' | 'done' | 'error';
  message: string;
  detail?: Record<string, unknown>;
}

// Search state for the main page
export interface SearchState {
  query: string;
  naiveResults: SearchResult[];
  rerankedResults: SearchResult[];
  isSearching: boolean;
  isReranking: boolean;
  hasSearched: boolean;
  showComparison: boolean;
  isAuditing: boolean;
  vlmAnalysis: string | null;
  auditError: AuditError | null;
}
