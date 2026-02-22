'use client';

import {
  FileDown,
  SplitSquareVertical,
  Cpu,
  DatabaseZap,
  CheckCircle2,
  Loader2,
  Circle,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import type { PipelineStep, PipelineStepId } from '@/types';

const STEP_ICONS: Record<PipelineStepId, typeof FileDown> = {
  fetch: FileDown,
  parse: SplitSquareVertical,
  inference: Cpu,
  index: DatabaseZap,
  complete: CheckCircle2,
};

const STATUS_STYLES = {
  idle: 'border-slate-600/50 bg-slate-800/30 text-slate-500',
  running: 'border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-lg shadow-amber-500/5',
  done: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  error: 'border-red-500/40 bg-red-500/10 text-red-400',
} as const;

const CONNECTOR_STYLES = {
  idle: 'bg-slate-700/40',
  running: 'bg-amber-500/40 animate-pulse',
  done: 'bg-emerald-500/30',
  error: 'bg-red-500/30',
} as const;

interface PipelineVisualizerProps {
  steps: PipelineStep[];
  isRunning: boolean;
  hasExistingData: boolean;
  onStart: () => void;
}

function StatusIcon({ status }: { status: PipelineStep['status'] }) {
  switch (status) {
    case 'running':
      return <Loader2 className="w-4 h-4 animate-spin" />;
    case 'done':
      return <CheckCircle2 className="w-4 h-4" />;
    case 'error':
      return <AlertCircle className="w-4 h-4" />;
    default:
      return <Circle className="w-3.5 h-3.5" />;
  }
}

function connectorStatus(
  prevStatus: PipelineStep['status'],
): keyof typeof CONNECTOR_STYLES {
  if (prevStatus === 'done') return 'done';
  if (prevStatus === 'error') return 'error';
  return 'idle';
}

export function PipelineVisualizer({
  steps,
  isRunning,
  hasExistingData,
  onStart,
}: PipelineVisualizerProps) {
  const allDone = steps.every(s => s.status === 'done');

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-slate-200">
          Ingestion Pipeline
        </h3>
        <button
          onClick={onStart}
          disabled={isRunning}
          className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium
                      transition-all duration-200
                      ${isRunning
                        ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 hover:border-amber-500/50'
                      }`}
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : hasExistingData ? (
            <>
              <RotateCcw className="w-4 h-4" />
              Re-process Data
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Process Data
            </>
          )}
        </button>
      </div>

      {/* Horizontal pipeline */}
      <div className="flex items-start gap-0 overflow-x-auto pb-2">
        {steps.map((step, i) => {
          const Icon = STEP_ICONS[step.id];
          const isLast = i === steps.length - 1;

          return (
            <div key={step.id} className="flex items-start shrink-0" style={{ flex: '1 1 0' }}>
              {/* Step node */}
              <div className="flex flex-col items-center w-full min-w-[110px]">
                <div
                  className={`flex items-center justify-center w-11 h-11 rounded-xl border
                              transition-all duration-500 ${STATUS_STYLES[step.status]}`}
                >
                  {step.status === 'running' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                <div className="flex items-center gap-1 mt-2">
                  <StatusIcon status={step.status} />
                  <span className={`text-xs font-medium ${
                    step.status === 'idle' ? 'text-slate-500' :
                    step.status === 'running' ? 'text-amber-300' :
                    step.status === 'done' ? 'text-emerald-400' :
                    'text-red-400'
                  }`}>
                    {step.label}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 text-center mt-1 leading-tight px-1">
                  {step.description}
                </p>

                {step.message && step.status !== 'idle' && (
                  <p className={`text-[11px] text-center mt-1.5 px-2 leading-tight max-w-[160px]
                                 ${step.status === 'error' ? 'text-red-400' : 'text-slate-400'}`}>
                    {step.message}
                  </p>
                )}
              </div>

              {/* Connector */}
              {!isLast && (
                <div className="flex items-center pt-5 px-1 shrink-0">
                  <div
                    className={`w-6 h-0.5 rounded-full transition-all duration-500
                                ${CONNECTOR_STYLES[connectorStatus(step.status)]}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allDone && !isRunning && (
        <div className="mt-4 pt-4 border-t border-slate-700/40 text-center">
          <p className="text-sm text-emerald-400 font-medium">
            Pipeline complete — data is ready for search
          </p>
        </div>
      )}
    </div>
  );
}
