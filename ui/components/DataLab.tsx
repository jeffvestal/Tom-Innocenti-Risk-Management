'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataSourceCard } from './DataLab/DataSourceCard';
import { ApiKeyInput } from './DataLab/ApiKeyInput';
import { PipelineVisualizer } from './DataLab/PipelineVisualizer';
import { DataPreview } from './DataLab/DataPreview';
import type {
  PipelineStep,
  PipelineStepId,
  IngestStatusResponse,
  IngestProgressEvent,
  SampleArticle,
} from '@/types';

const DEFAULT_STEPS: PipelineStep[] = [
  { id: 'fetch', label: 'Jina Reader', description: 'Jina Reader (r.jina.ai) converts PDF to LLM-ready markdown', status: 'idle' },
  { id: 'parse', label: 'Parse Articles', description: 'Split markdown into articles', status: 'idle' },
  { id: 'inference', label: 'Jina Inference', description: '.jina-embeddings-v5-text-small + jina-reranker-v2 via ES Inference API', status: 'idle' },
  { id: 'index', label: 'Index Documents', description: 'Bulk index with Jina Embeddings auto-embedding', status: 'idle' },
  { id: 'complete', label: 'Complete', description: 'Powered by Jina AI — ready to search', status: 'idle' },
];

type LangChoice = 'en' | 'de' | 'both';

export function DataLab() {
  const [jinaKey, setJinaKey] = useState('');
  const [hasServerKey, setHasServerKey] = useState(false);
  const [langChoice, setLangChoice] = useState<LangChoice>('both');
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<PipelineStep[]>(DEFAULT_STEPS);

  const [indexName, setIndexName] = useState('');
  const [totalDocs, setTotalDocs] = useState(0);
  const [enCount, setEnCount] = useState(0);
  const [deCount, setDeCount] = useState(0);
  const [samples, setSamples] = useState<SampleArticle[]>([]);
  const [statusLoading, setStatusLoading] = useState(true);

  // Fetch initial status on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/ingest');
        if (!res.ok) return;
        const data: IngestStatusResponse = await res.json();
        if (cancelled) return;

        setHasServerKey(data.hasServerKey);
        setIndexName(data.indexName);
        setTotalDocs(data.totalDocs);
        setEnCount(data.enCount);
        setDeCount(data.deCount);
        setSamples(data.samples);
      } catch {
        // non-critical
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const updateStep = useCallback(
    (stepId: PipelineStepId, patch: Partial<PipelineStep>) => {
      setSteps(prev =>
        prev.map(s => (s.id === stepId ? { ...s, ...patch } : s)),
      );
    },
    [],
  );

  const handleStart = useCallback(async () => {
    if (isRunning) return;
    if (!jinaKey && !hasServerKey) return;

    setIsRunning(true);
    setSteps(DEFAULT_STEPS.map(s => ({ ...s, status: 'idle', message: undefined, detail: undefined })));

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jinaKey: jinaKey || undefined,
          languages: langChoice === 'both' ? ['en', 'de'] : [langChoice],
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (!json) continue;

          try {
            const event: IngestProgressEvent = JSON.parse(json);
            handleEvent(event);
          } catch {
            // skip malformed events
          }
        }
      }

      // Process any remaining buffer
      if (buffer.startsWith('data: ')) {
        try {
          const event: IngestProgressEvent = JSON.parse(buffer.slice(6).trim());
          handleEvent(event);
        } catch {
          // skip
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      updateStep('fetch', { status: 'error', message: msg });
    } finally {
      setIsRunning(false);
    }

    function handleEvent(event: IngestProgressEvent) {
      const { step, status, message, detail } = event;

      if (status === 'start') {
        updateStep(step, { status: 'running', message, detail });
      } else if (status === 'progress') {
        updateStep(step, { message, detail });
      } else if (status === 'done') {
        updateStep(step, { status: 'done', message, detail });

        // When complete step fires, update the data preview state
        if (step === 'complete' && detail) {
          const d = detail as {
            totalDocs?: number;
            enCount?: number;
            deCount?: number;
            samples?: SampleArticle[];
          };
          if (d.totalDocs !== undefined) setTotalDocs(d.totalDocs);
          if (d.enCount !== undefined) setEnCount(d.enCount);
          if (d.deCount !== undefined) setDeCount(d.deCount);
          if (d.samples) setSamples(d.samples);
        }
      } else if (status === 'error') {
        updateStep(step, { status: 'error', message });
      }
    }
  }, [isRunning, jinaKey, hasServerKey, langChoice, updateStep]);

  const hasExistingData = totalDocs > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-2">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Data Lab</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          See how <span className="text-teal-700 dark:text-teal-400 font-semibold">Jina Reader</span>, <span className="text-teal-700 dark:text-teal-400 font-semibold">Jina Embeddings</span>, and <span className="text-teal-700 dark:text-teal-400 font-semibold">Jina Reranker</span> power the full pipeline
        </p>
      </div>

      <DataSourceCard />

      <ApiKeyInput
        value={jinaKey}
        onChange={setJinaKey}
        hasServerKey={hasServerKey}
        langChoice={langChoice}
        onLangChange={setLangChoice}
        disabled={isRunning}
      />

      <PipelineVisualizer
        steps={steps}
        isRunning={isRunning}
        hasExistingData={hasExistingData}
        onStart={handleStart}
      />

      <DataPreview
        samples={samples}
        totalDocs={totalDocs}
        enCount={enCount}
        deCount={deCount}
        indexName={indexName}
        isLoading={statusLoading}
      />
    </div>
  );
}
