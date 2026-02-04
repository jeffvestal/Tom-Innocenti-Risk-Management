'use client';

import { Scale, Shield } from 'lucide-react';
import { LanguageToggle } from './LanguageToggle';

export function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
              <Scale className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-100 tracking-tight">
                Innocenti & Associates
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                AI Compliance Intelligence
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-6">
            <LanguageToggle />
            
            <div className="flex items-center gap-2 text-slate-500">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-medium">EU AI Act</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
