'use client';

import { useEffect, useRef } from 'react';
import { X, ExternalLink, Scale, AlertTriangle, Search, ScanEye } from 'lucide-react';

interface EuAiActModalProps {
  onClose: () => void;
}

export function EuAiActModal({ onClose }: EuAiActModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto
                      bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl
                      animate-slide-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500
                     hover:text-slate-300 hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg
                            bg-amber-500/20 border border-amber-500/30">
              <Scale className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-100">
              The EU AI Act
            </h2>
          </div>

          <div className="space-y-5 text-sm leading-relaxed text-slate-300">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-slate-100 mb-1">What it is</h3>
                <p>
                  The EU AI Act is the world&apos;s first comprehensive legal framework
                  regulating artificial intelligence. It spans 180+ pages of dense
                  regulatory text covering risk classification, prohibited practices,
                  transparency obligations, and enforcement penalties up to 35 million
                  euros.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Search className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-slate-100 mb-1">Why keyword search fails</h3>
                <p>
                  Legal language uses indirect references, cross-article dependencies,
                  and domain-specific phrasing. A search for &quot;facial recognition&quot;
                  won&apos;t find articles that regulate it under &quot;remote biometric
                  identification systems.&quot; Compliance teams waste hours manually
                  cross-referencing articles to answer simple questions.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <ScanEye className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-slate-100 mb-1">What this demo solves</h3>
                <p>
                  <strong className="text-slate-100">Semantic search</strong> understands
                  meaning, not just keywords -- it finds &quot;remote biometric identification&quot;
                  when you ask about &quot;facial recognition.&quot;
                  {' '}<strong className="text-slate-100">Reranking</strong> adds a second
                  pass of intelligence, reordering results by true relevance using listwise
                  attention. The <strong className="text-slate-100">VLM Diagram Auditor</strong> lets
                  you point an AI at your own architecture diagram and automatically find
                  which regulations apply.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <a
              href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                         bg-amber-500/10 border border-amber-500/30 text-amber-300
                         hover:bg-amber-500/20 hover:border-amber-500/50
                         text-sm font-medium transition-all duration-200"
            >
              View the full EU AI Act on EUR-Lex
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
