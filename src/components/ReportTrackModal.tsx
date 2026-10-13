'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { AlertCircle, X, Check, Loader2 } from 'lucide-react';

interface ReportTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  trackTitle: string;
  artistName: string;
}

export function ReportTrackModal({
  isOpen,
  onClose,
  trackId,
  trackTitle,
  artistName,
}: ReportTrackModalProps) {
  const { t, locale } = useLanguage();
  const isIt = locale === 'it';

  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError(isIt ? 'Seleziona o specifica un motivo' : 'Please select or provide a reason');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch('/api/radio/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId,
          reason,
          details,
          reporterEmail,
        }),
      });

      if (!res.ok) {
        throw new Error('Errore durante l\'invio della segnalazione');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Errore invio segnalazione');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 bg-[#0A0A14] text-white shadow-2xl space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            <span>{t.radio.reportModalTitle}</span>
          </div>
          <h3 className="text-xl font-bold text-white">
            "{trackTitle}"
          </h3>
          <p className="text-xs text-slate-400">
            {isIt ? 'Artista:' : 'Artist:'} <span className="text-cyan-400">{artistName}</span>
          </p>
        </div>

        {success ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-center space-y-2">
            <Check className="w-8 h-8 mx-auto text-emerald-400" />
            <p className="text-sm font-bold">{t.radio.reportSuccess}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                {isIt ? 'Motivo della segnalazione *' : 'Reason for report *'}
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="" disabled className="bg-[#0A0A14] text-slate-400">
                  {isIt ? '-- Seleziona un motivo --' : '-- Select a reason --'}
                </option>
                <option value="Violazione copyright o diritti" className="bg-[#0A0A14]">
                  {isIt ? 'Violazione copyright o diritti d\'autore' : 'Copyright or rights infringement'}
                </option>
                <option value="Contenuto offensivo o inappropriato" className="bg-[#0A0A14]">
                  {isIt ? 'Contenuto offensivo, violento o discriminatorio' : 'Offensive or inappropriate content'}
                </option>
                <option value="File audio corrotto o silenzioso" className="bg-[#0A0A14]">
                  {isIt ? 'File audio corrotto, distorto o silenzioso' : 'Corrupted, distorted, or silent audio'}
                </option>
                <option value="Spam o promozione non musicale" className="bg-[#0A0A14]">
                  {isIt ? 'Spam o traccia promozionale non musicale' : 'Spam or non-musical advertising'}
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                {isIt ? 'Dettagli aggiuntivi (facoltativo)' : 'Additional details (optional)'}
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={t.radio.reportReasonPlaceholder}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                {isIt ? 'La tua email (per eventuali riscontri)' : 'Your email (optional)'}
              </label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="nome@email.it"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{t.radio.reportSubmit}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
