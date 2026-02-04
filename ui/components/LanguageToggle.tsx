'use client';

import { useState } from 'react';

type Language = 'en' | 'de';

export function LanguageToggle() {
  const [language, setLanguage] = useState<Language>('en');

  return (
    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
          ${language === 'en' 
            ? 'bg-slate-700 text-amber-400' 
            : 'text-slate-500 hover:text-slate-400'
          }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('de')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
          ${language === 'de' 
            ? 'bg-slate-700 text-amber-400' 
            : 'text-slate-500 hover:text-slate-400'
          }`}
        title="Coming soon - German language support"
      >
        DE
      </button>
    </div>
  );
}
