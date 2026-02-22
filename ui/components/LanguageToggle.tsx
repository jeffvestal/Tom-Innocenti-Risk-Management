'use client';

export type Language = 'en' | 'de';

interface LanguageToggleProps {
  language: Language;
  onChange: (lang: Language) => void;
}

export function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
      <button
        onClick={() => onChange('en')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
          ${language === 'en' 
            ? 'bg-slate-700 text-amber-400' 
            : 'text-slate-500 hover:text-slate-400'
          }`}
      >
        EN
      </button>
      <button
        onClick={() => onChange('de')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
          ${language === 'de' 
            ? 'bg-slate-700 text-amber-400' 
            : 'text-slate-500 hover:text-slate-400'
          }`}
      >
        DE
      </button>
    </div>
  );
}
