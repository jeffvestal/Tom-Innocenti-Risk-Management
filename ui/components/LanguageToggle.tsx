'use client';

export type Language = 'en' | 'de';

interface LanguageToggleProps {
  language: Language;
  onChange: (lang: Language) => void;
}

export function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-stone-200 dark:bg-slate-800 rounded-lg p-1">
      <button
        onClick={() => onChange('en')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
          ${language === 'en' 
            ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' 
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-400'
          }`}
      >
        EN
      </button>
      <button
        onClick={() => onChange('de')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
          ${language === 'de' 
            ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' 
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-400'
          }`}
      >
        DE
      </button>
    </div>
  );
}
