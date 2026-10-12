'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Globe } from 'lucide-react';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5 text-xs">
      {!compact && <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5" />}
      <button
        type="button"
        onClick={() => setLocale('it')}
        className={`px-2 py-1 rounded-md font-semibold transition-all ${
          locale === 'it'
            ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-white'
        }`}
        title="Italiano"
      >
        IT
      </button>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`px-2 py-1 rounded-md font-semibold transition-all ${
          locale === 'en'
            ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-white'
        }`}
        title="English"
      >
        EN
      </button>
    </div>
  );
}
