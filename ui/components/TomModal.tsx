'use client';

import { useEffect, useRef } from 'react';
import { X, Scale } from 'lucide-react';
import Image from 'next/image';

interface TomModalProps {
  onClose: () => void;
}

export function TomModal({ onClose }: TomModalProps) {
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
      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto
                      bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl
                      animate-slide-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500
                     hover:text-slate-300 hover:bg-slate-800 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 flex flex-col items-center text-center space-y-5">
          <div className="relative w-44 h-44 rounded-full overflow-hidden
                          border-2 border-amber-500/40 shadow-lg shadow-amber-500/10">
            <Image
              src="/tom-innocenti.png"
              alt="Tom Innocenti"
              fill
              className="object-cover object-top"
              sizes="176px"
              priority
            />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-slate-100">
              Tom Innocenti
            </h2>
            <div className="flex items-center justify-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <p className="text-sm font-medium text-amber-400">
                Managing Partner
              </p>
            </div>
          </div>

          <div className="relative px-6 py-4">
            <span className="absolute top-0 left-0 text-5xl leading-none text-amber-500/30
                             font-serif select-none">&ldquo;</span>
            <p className="text-lg italic text-slate-300 leading-relaxed pt-4">
              If you don&apos;t sue, shame on you.
            </p>
            <span className="absolute bottom-0 right-0 text-5xl leading-none text-amber-500/30
                             font-serif select-none">&rdquo;</span>
          </div>
        </div>
      </div>
    </div>
  );
}
