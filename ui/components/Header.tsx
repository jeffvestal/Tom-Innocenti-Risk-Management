'use client';

import { useState } from 'react';
import { Scale, Shield } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle, type Language } from './LanguageToggle';
import { EuAiActModal } from './EuAiActModal';
import { TomModal } from './TomModal';

interface HeaderProps {
  onReset?: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function Header({ onReset, language, onLanguageChange }: HeaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [showTomModal, setShowTomModal] = useState(false);

  return (
    <>
      <header className="border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTomModal(true)}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20
                           hover:shadow-amber-500/40 hover:scale-105 transition-all duration-200"
              >
                <Scale className="w-5 h-5 text-slate-900" />
              </button>
              <button
                onClick={onReset}
                className="text-left hover:opacity-80 transition-opacity duration-200"
              >
                <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
                  Innocenti & Associates
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">
                  AI Compliance Intelligence
                </p>
              </button>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <LanguageToggle language={language} onChange={onLanguageChange} />
              
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400
                           transition-colors duration-200"
              >
                <Shield className="w-4 h-4" />
                <span className="text-xs font-medium">EU AI Act</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {showModal && <EuAiActModal onClose={() => setShowModal(false)} />}
      {showTomModal && <TomModal onClose={() => setShowTomModal(false)} />}
    </>
  );
}
