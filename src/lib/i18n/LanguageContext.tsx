'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Locale, getDictionary, Dictionary } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/client';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'it',
  setLocale: async () => {},
  t: getDictionary('it'),
});

export function LanguageProvider({
  children,
  initialLocale = 'it',
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    // Read cookie or browser preference
    const match = document.cookie.match(/openstage_locale=([a-z]{2})/);
    if (match && (match[1] === 'it' || match[1] === 'en')) {
      setLocaleState(match[1] as Locale);
    } else {
      // Default to Italian for Italy launch; check navigator.language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('it')) {
        setLocaleState('it');
        document.cookie = 'openstage_locale=it; path=/; max-age=31536000; SameSite=Lax';
      } else if (browserLang.startsWith('en')) {
        setLocaleState('en');
        document.cookie = 'openstage_locale=en; path=/; max-age=31536000; SameSite=Lax';
      } else {
        setLocaleState('it');
        document.cookie = 'openstage_locale=it; path=/; max-age=31536000; SameSite=Lax';
      }
    }
  }, []);

  const handleSetLocale = async (newLocale: Locale) => {
    setLocaleState(newLocale);
    document.cookie = `openstage_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    try {
      // Update profile preferred_language if user is authenticated
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ preferred_language: newLocale })
          .eq('id', user.id);
      }
    } catch {}
  };

  const t = getDictionary(locale);

  return (
    <LanguageContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
