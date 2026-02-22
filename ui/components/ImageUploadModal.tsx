'use client';

import { useEffect, useRef } from 'react';
import { X, ImagePlus, FileImage } from 'lucide-react';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFile: (file: File) => void;
}

const EXAMPLE_IMAGE_PATH = '/example-architecture.png';
const EXAMPLE_IMAGE_NAME = 'example-architecture.png';

export function ImageUploadModal({ isOpen, onClose, onFile }: ImageUploadModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFile(file);
      onClose();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadExample = async () => {
    try {
      const resp = await fetch(EXAMPLE_IMAGE_PATH);
      const blob = await resp.blob();
      const file = new File([blob], EXAMPLE_IMAGE_NAME, { type: blob.type || 'image/png' });
      onFile(file);
      onClose();
    } catch {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-md
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

        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">
            Upload Architecture Diagram
          </h2>
          <p className="text-sm text-slate-400">
            Upload your own diagram or use the included example.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Upload your own */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-3 p-5 rounded-xl
                         bg-slate-800 border border-slate-700
                         hover:border-amber-500/50 hover:bg-slate-800/80
                         transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-700/50 border border-slate-600
                              flex items-center justify-center
                              group-hover:bg-amber-500/10 group-hover:border-amber-500/30
                              transition-all duration-200">
                <ImagePlus className="w-6 h-6 text-slate-400 group-hover:text-amber-400 transition-colors" />
              </div>
              <div className="text-center">
                <span className="block text-sm font-medium text-slate-200 group-hover:text-amber-300 transition-colors">
                  Upload File
                </span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  Choose from device
                </span>
              </div>
            </button>

            {/* Load example */}
            <button
              onClick={handleLoadExample}
              data-testid="load-example-btn"
              className="flex flex-col items-center gap-3 p-5 rounded-xl
                         bg-slate-800 border border-slate-700
                         hover:border-amber-500/50 hover:bg-slate-800/80
                         transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-600
                              group-hover:border-amber-500/30
                              transition-all duration-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={EXAMPLE_IMAGE_PATH}
                  alt="Example architecture diagram"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                <span className="block text-sm font-medium text-slate-200 group-hover:text-amber-300 transition-colors">
                  Example Diagram
                </span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  AWS ML architecture
                </span>
              </div>
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload architecture diagram"
        />
      </div>
    </div>
  );
}
