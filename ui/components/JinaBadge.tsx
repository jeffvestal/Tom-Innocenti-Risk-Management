'use client';

import { useState, useRef, useEffect } from 'react';
import { ExternalLink, Info } from 'lucide-react';

function JinaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 235 100" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle fill="#EB6161" cx="15.3" cy="84.5" r="15.3" />
      <path
        fill="#009191"
        d="M63.5 36.3c2 0 3.6 1.6 3.6 3.6l-.2 29.3c0 16.7-13.4 30.3-30.1 30.6h-.5V69.3 40c0-2 1.8-3.7 3.8-3.7h23.4zm47 0c2 0 3.6 1.6 3.6 3.6v41c0 2-1.6 3.6-3.6 3.6H87.1c-2 0-3.6-1.6-3.6-3.6V39.9c0-2 1.6-3.6 3.6-3.6h23.4zm36.8-.1h.5c15 .2 27.2 12.3 27.6 27.3v17.3c0 2-1.6 3.6-3.6 3.6H134c-2 0-3.6-1.6-3.6-3.6V39.8c0-2 1.6-3.6 3.6-3.6h13.3zM209.2 84c-12.6-.8-22.7-11.3-22.7-24.1 0-13.3 10.8-24.1 24.1-24.1 12.8 0 23.3 10 24.1 22.7v21.9c0 2-1.6 3.6-3.6 3.6h-21.9z"
      />
      <circle fill="#FBCB67" cx="98.749" cy="15.3" r="15.3" />
    </svg>
  );
}

const SERVICE_INFO = {
  reader: {
    label: 'Jina Reader',
    model: 'r.jina.ai',
    description: 'Converts any URL or PDF into clean, LLM-ready markdown.',
    docUrl: 'https://jina.ai/reader/',
  },
  embeddings: {
    label: 'Jina Embeddings',
    model: '.jina-embeddings-v5-text-small',
    description: 'Next-gen multilingual embeddings, built-in on Elastic Serverless.',
    docUrl: 'https://jina.ai/embeddings/',
  },
  reranker: {
    label: 'Jina Reranker',
    model: 'jina-reranker-v2-base-multilingual',
    description: 'Cross-encoder reranker with listwise attention for relevance tuning.',
    docUrl: 'https://jina.ai/reranker/',
  },
  vlm: {
    label: 'Jina VLM',
    model: 'jina-vlm',
    description: 'Vision Language Model for understanding diagrams and documents.',
    docUrl: 'https://jina.ai/reader#vlm',
  },
} as const;

type JinaService = keyof typeof SERVICE_INFO;

interface JinaBadgeProps {
  service: JinaService;
  showModel?: boolean;
  showLogo?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function JinaBadge({
  service,
  showModel = true,
  showLogo = true,
  size = 'sm',
  className = '',
}: JinaBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!showTooltip) return;
    const handleClick = (e: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setShowTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showTooltip]);

  const info = SERVICE_INFO[service];
  const isSmall = size === 'sm';

  return (
    <span className={`inline-flex items-center gap-1.5 relative ${className}`}>
      <span
        className={`inline-flex items-center gap-1.5 rounded-md font-medium
                     bg-teal-600/10 dark:bg-teal-500/10 border border-teal-600/25 dark:border-teal-500/25
                     hover:bg-teal-600/15 dark:hover:bg-teal-500/15 hover:border-teal-600/40 dark:hover:border-teal-500/40
                     transition-all duration-200
                     ${isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'}`}
      >
        {showLogo && (
          <JinaLogo className={isSmall ? 'w-8 h-3.5' : 'w-10 h-4'} />
        )}
        <span className="text-teal-700 dark:text-teal-300 font-semibold">{info.label}</span>
        {showModel && (
          <span className="text-teal-600/70 dark:text-teal-500/70 font-mono">{info.model}</span>
        )}
        <span
          ref={triggerRef}
          onClick={() => setShowTooltip(prev => !prev)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="cursor-pointer text-teal-600/50 dark:text-teal-500/50 hover:text-teal-700 dark:hover:text-teal-400 transition-colors"
        >
          <Info className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        </span>
      </span>

      {showTooltip && (
        <div
          ref={tooltipRef}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64
                     bg-slate-900 border border-teal-500/30 rounded-lg shadow-xl shadow-black/40
                     p-3 text-xs animate-fade-in"
        >
          <div className="flex items-center gap-2 mb-2">
            <JinaLogo className="w-12 h-5" />
            <span className="text-teal-300 font-semibold">{info.label}</span>
          </div>
          <p className="text-slate-300 leading-relaxed mb-2">{info.description}</p>
          <p className="text-slate-400 font-mono text-[10px] mb-2">model: {info.model}</p>
          <a
            href={info.docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-teal-300 hover:text-teal-200 transition-colors font-medium"
          >
            View Jina docs <ExternalLink className="w-3 h-3" />
          </a>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2 h-2 bg-slate-900 border-r border-b border-teal-500/30 rotate-45" />
          </div>
        </div>
      )}
    </span>
  );
}

export function JinaInline({
  service,
  className = '',
}: {
  service: JinaService;
  className?: string;
}) {
  const info = SERVICE_INFO[service];
  return (
    <a
      href={info.docUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-teal-700 dark:text-teal-400 hover:text-teal-600 dark:hover:text-teal-300
                   font-semibold transition-colors ${className}`}
    >
      <JinaLogo className="w-8 h-3.5 inline" />
      {info.label}
    </a>
  );
}

function ElasticLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 205 204" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M80.43 87.74l44.77 20.41 45.16-39.57c2.29-11.41.56-23.26-4.88-33.54-5.44-10.28-14.32-18.37-25.04-22.9-10.72-4.52-22.67-5.2-33.84-1.93-11.17 3.27-20.86 10.3-27.44 19.9l-7.52 39.01 8.74 18.63z" fill="#FEC514" />
      <path d="M34.1 135.15c-2.33 11.46-.62 23.38 4.84 33.72 5.46 10.34 14.34 18.48 25.12 23.02 10.78 4.54 22.8 5.21 34.02 1.89 11.22-3.32 20.94-10.42 27.51-20.1l7.45-38.84-10-19-44.89-20.5-43.04 39.81z" fill="#02BCB7" />
      <path d="M33.79 57.68l30.7 7.24 6.72-34.88c-4.17-3.16-9.26-4.88-14.49-4.91-5.24-.03-10.34 1.63-14.55 4.74-4.21 3.11-7.3 7.5-8.81 12.51-1.51 5.01-1.36 10.38.43 15.3z" fill="#F04E98" />
      <path d="M31.15 64.98c-6.63 2.19-12.42 6.38-16.58 11.99-4.16 5.61-6.47 12.38-6.63 19.36-.16 6.98 1.84 13.84 5.74 19.64 3.89 5.8 9.48 10.25 16.01 12.75l42.99-38.91-7.89-16.83-33.64-8z" fill="#1BA9F5" />
      <path d="M133.44 173.68c3.57 2.75 7.84 4.44 12.33 4.89 4.49.44 9.01-.39 13.05-2.38 4.04-2 7.44-5.09 9.81-8.92 2.37-3.84 3.62-8.26 3.6-12.77.01-2.87-.49-5.72-1.47-8.41l-30.65-7.17-6.68 34.76z" fill="#9ADC30" />
      <path d="M139.68 130.89l33.75 7.89c6.74-2.27 12.6-6.59 16.76-12.35 4.17-5.76 6.43-12.67 6.48-19.78-.01-6.85-2.1-13.54-5.99-19.18-3.9-5.64-9.42-9.96-15.83-12.38l-44.13 38.67 8.96 17.13z" fill="#0B64DD" />
    </svg>
  );
}

export { JinaLogo, ElasticLogo, SERVICE_INFO };
export type { JinaService };
