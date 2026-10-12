'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Mail, CheckCircle2, MessageSquare, User, HelpCircle, Loader2 } from 'lucide-react';
import { TurnstileWidget } from '@/components/TurnstileWidget';

export default function ContactPage() {
  const { t, locale } = useLanguage();
  const isIt = locale === 'it';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<'artist' | 'venue' | 'fan' | 'other'>('artist');
  const [message, setMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          user_type: userType,
          message,
          turnstileToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore durante l invio');
      }

      setSubmittedTicket(data.ticketNumber);
    } catch (err: any) {
      setError(err.message || 'Errore di connessione. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {isIt ? 'Contattaci' : 'Contact Us'}
            </h1>
            <p className="text-xs text-slate-400">
              {isIt ? 'Supporto per artisti, locali e appassionati di musica' : 'Support for artists, venues, and music lovers'}
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-6">
          {isIt
            ? 'Hai domande, segnalazioni o vuoi collaborare con noi? Compila il modulo: riceverai una conferma automatica via email e una risposta dal nostro team.'
            : 'Have questions, feedback or want to partner with us? Fill out the form: you will receive an automatic confirmation email and a response from our team.'}
        </p>

        {submittedTicket ? (
          <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-white">
                {isIt ? 'Messaggio inviato con successo!' : 'Message sent successfully!'}
              </h3>
              <p className="text-sm text-emerald-200">
                {isIt ? 'Numero Ticket:' : 'Ticket Number:'}{' '}
                <span className="font-mono font-bold text-white bg-black/40 px-2 py-1 rounded-md border border-emerald-500/40">
                  {submittedTicket}
                </span>
              </p>
              <p className="text-xs text-slate-300 max-w-md mx-auto pt-2 leading-relaxed">
                {isIt
                  ? 'Abbiamo inviato una conferma via email con i dettagli della richiesta. Riceverai la risposta direttamente al tuo indirizzo email. Nota: non è possibile rispondere direttamente alla notifica email; per inviare ulteriori informazioni, apri un nuovo ticket.'
                  : 'We have sent an automatic confirmation email with ticket details. You will receive our reply directly to your inbox. Note: direct replies by email are not supported; to send additional details, please open a new ticket.'}
              </p>
            </div>
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmittedTicket(null);
                  setMessage('');
                }}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
              >
                {isIt ? 'Invia un altro messaggio' : 'Send another message'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.common.name} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                  placeholder={isIt ? 'Il tuo nome' : 'Your name'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.common.email} *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                  placeholder="tua@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isIt ? 'Sei un...' : 'You are a...'} *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'artist', label: isIt ? 'Artista' : 'Artist' },
                  { id: 'venue', label: isIt ? 'Locale' : 'Venue' },
                  { id: 'fan', label: isIt ? 'Fan' : 'Fan' },
                  { id: 'other', label: isIt ? 'Altro' : 'Other' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setUserType(item.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                      userType === item.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isIt ? 'Messaggio' : 'Message'} *
              </label>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm leading-relaxed"
                placeholder={
                  isIt
                    ? 'Descrivi la tua richiesta in dettaglio...'
                    : 'Describe your question or request in detail...'
                }
              />
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-400 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                {isIt
                  ? 'Riceverai una conferma via email con il numero di ticket. Le risposte del team arriveranno via email. Ricorda che le risposte via email non sono supportate: per ulteriori informazioni sarà necessario aprire un nuovo ticket.'
                  : 'You will receive an email confirmation with your ticket reference. Replies will arrive in your inbox. Note: replies by email are not supported: open a new ticket for subsequent requests.'}
              </span>
            </div>

            <TurnstileWidget onSuccess={(token) => setTurnstileToken(token)} />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-pink-600 to-cyan-500 text-white font-bold text-sm hover:opacity-95 transition-all shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isIt ? 'Invio in corso...' : 'Sending...'}</span>
                </>
              ) : (
                <span>{isIt ? 'Invia Messaggio' : 'Send Message'}</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
