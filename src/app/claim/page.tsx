'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ShieldCheck, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function ClaimContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { locale } = useLanguage();
  const isIt = locale === 'it';

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [claimantName, setClaimantName] = useState('');
  const [claimantEmail, setClaimantEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadClaim() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/claim?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (data.invitation) {
          setInvitation(data.invitation);
          setClaimantEmail(data.invitation.invite_email || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadClaim();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          claimant_name: claimantName,
          claimant_email: claimantEmail,
          claimant_notes: notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore invio richiesta');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Errore di connessione');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">
            {isIt ? 'Token di rivendicazione mancante' : 'Missing claim token'}
          </h2>
          <p className="text-xs text-slate-400">
            {isIt
              ? 'Il link utilizzato non contiene un token valido. Controlla l email di invito ricevuta.'
              : 'The link does not contain a valid token. Please check your invitation email.'}
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
          >
            {isIt ? 'Torna alla Home' : 'Back to Home'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">
              {isIt ? 'Rivendica il tuo profilo' : 'Claim Your Profile'}
            </h1>
            <p className="text-xs text-slate-400">
              {isIt ? 'Verifica ufficiale identità OpenStage' : 'Official OpenStage identity verification'}
            </p>
          </div>
        </div>

        {invitation && (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
              {invitation.target_type === 'artist'
                ? isIt
                  ? 'Profilo Artista'
                  : 'Artist Profile'
                : invitation.target_type === 'venue'
                ? isIt
                  ? 'Scheda Locale'
                  : 'Venue Profile'
                : isIt
                ? 'Concerto'
                : 'Event'}
            </span>
            <p className="text-lg font-bold text-white">{invitation.target_name}</p>
          </div>
        )}

        {submitted ? (
          <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {isIt ? 'Richiesta inoltrata all amministratore' : 'Claim request sent to admin'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isIt
                ? 'La tua richiesta di rivendicazione è stata registrata. Per garantire l autenticità, le rivendicazioni sono approvate manualmente. Riceverai una notifica via email non appena l account sarà attivo.'
                : 'Your claim request has been queued. To preserve verified authenticity, all claims are approved manually by the admin. You will receive an email confirmation once reviewed.'}
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors"
              >
                <span>{isIt ? 'Torna all homepage' : 'Back to homepage'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isIt ? 'Tuo Nome e Cognome / Referente' : 'Your Full Name / Representative'} *
              </label>
              <input
                type="text"
                required
                value={claimantName}
                onChange={(e) => setClaimantName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                placeholder={isIt ? 'Nome referente' : 'Your name'}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isIt ? 'Tua Email' : 'Your Email'} *
              </label>
              <input
                type="email"
                required
                value={claimantEmail}
                onChange={(e) => setClaimantEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                placeholder="email@dominio.it"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isIt ? 'Note o prova di titolarità (opzionale)' : 'Notes or proof of ownership (optional)'}
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                placeholder={
                  isIt
                    ? 'Es. profilo Instagram ufficiale, link al sito web, ruolo nel gruppo/locale...'
                    : 'E.g. official Instagram page, website link, your role...'
                }
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold text-sm hover:opacity-95 transition-all shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isIt ? 'Invio in corso...' : 'Submitting...'}</span>
                </>
              ) : (
                <span>{isIt ? 'Invia Richiesta di Rivendicazione' : 'Submit Claim Request'}</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-slate-400">Caricamento...</div>}>
      <ClaimContent />
    </Suspense>
  );
}
