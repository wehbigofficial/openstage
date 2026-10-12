'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { CheckCircle2, Mail, Settings, ShieldCheck } from 'lucide-react';

function UnsubscribeContent() {
  const { t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const queryEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(queryEmail);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (queryEmail) {
      setEmail(queryEmail);
    }
  }, [queryEmail]);

  const handleUnsubscribe = async (all = false) => {
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage(locale === 'it' ? 'Inserisci un indirizzo email valido' : 'Please enter a valid email address');
      return;
    }

    try {
      setStatus('loading');
      const res = await fetch('/api/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, all: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatus('success');
      setMessage(
        locale === 'it'
          ? 'Il tuo indirizzo email è stato rimosso con successo dalle comunicazioni non essenziali.'
          : 'Your email has been successfully removed from non-essential communications.'
      );
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || (locale === 'it' ? 'Si è verificato un errore.' : 'An error occurred.'));
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-white/10 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-violet-600/20 text-cyan-400 mx-auto flex items-center justify-center">
          <Mail className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            {locale === 'it' ? 'Gestisci iscrizione email' : 'Manage Email Subscription'}
          </h1>
          <p className="text-sm text-slate-400">
            {locale === 'it'
              ? 'Scegli se disiscriverti da tutte le comunicazioni o personalizzare le tue preferenze.'
              : 'Choose to unsubscribe from all optional communications or customize your preferences.'}
          </p>
        </div>

        {status === 'success' ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-3">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
            <p className="font-semibold text-white">{message}</p>
            <p className="text-xs text-emerald-300/80">
              {locale === 'it'
                ? 'Riceverai solo le email transazionali essenziali (come conferme di registrazione).'
                : 'You will only receive essential transactional emails (like account confirmations).'}
            </p>
            <div className="pt-2">
              <Link
                href="/explore"
                className="inline-block px-5 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs"
              >
                {t.home.exploreEvents}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@esempio.com"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            {status === 'error' && (
              <p className="text-xs text-rose-400">{message}</p>
            )}

            <button
              onClick={() => handleUnsubscribe(true)}
              disabled={status === 'loading'}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/25 transition-all disabled:opacity-50"
            >
              {status === 'loading'
                ? t.common.loading
                : locale === 'it'
                ? 'Disiscrivimi da tutte le email'
                : 'Unsubscribe from all emails'}
            </button>

            <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-slate-400">
              <span>{locale === 'it' ? 'Hai un account?' : 'Have an account?'}</span>
              <Link href="/settings" className="text-cyan-400 hover:underline font-semibold flex items-center gap-1">
                <Settings className="w-3.5 h-3.5" />
                <span>{locale === 'it' ? 'Personalizza nel profilo' : 'Customize in settings'}</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-slate-400">Loading...</div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}
