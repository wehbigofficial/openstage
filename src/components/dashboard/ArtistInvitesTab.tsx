'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Sparkles,
  Users,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Send,
  Loader2,
} from 'lucide-react';

interface ArtistInvitesTabProps {
  artistId: string;
}

export function ArtistInvitesTab({ artistId }: ArtistInvitesTabProps) {
  const { t, locale } = useLanguage();
  const isIt = locale === 'it';

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadInvites() {
      try {
        const res = await fetch(`/api/invites?artistId=${artistId}`);
        if (res.ok) {
          const json = await res.json();
          setStats(json);
        }
      } catch (err) {
        console.error('Error loading invite stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInvites();
  }, [artistId]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
        <span className="text-xs">{t.common.loading}</span>
      </div>
    );
  }

  if (!stats) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://openstage.live';
  const fullInviteUrl = `${origin}/invite/${stats.inviteCode}`;
  const shareText = `Pubblica i tuoi concerti dal vivo gratis e trasmetti i tuoi brani su OpenStage Radio! Iscriviti tramite il mio invito: ${fullInviteUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullInviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(fullInviteUrl)}&text=${encodeURIComponent(
    'Unisciti a OpenStage per artisti e musicisti indipendenti!'
  )}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  const qualifiedCount = stats.qualifiedCount || 0;
  const isRewarded = stats.isRewarded || qualifiedCount >= 3;
  const progressPercent = Math.min(100, Math.round((qualifiedCount / 3) * 100));

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Gift className="w-6 h-6 text-pink-400" />
            <span>{t.invites.title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            {t.invites.subtitle}
          </p>
        </div>

        {isRewarded && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs shadow-md">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>PRO Sbloccato Gratis</span>
          </div>
        )}
      </div>

      {/* Reward Progress Box */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 bg-gradient-to-r from-violet-950/40 via-cyan-950/30 to-black space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{t.invites.progressTitle}</span>
              <span className="text-cyan-400 font-mono font-bold">{qualifiedCount} / 3</span>
            </h3>
            <p className="text-xs text-slate-400">
              {isIt
                ? 'Un artista si qualifica quando verifica la sua email e pubblica almeno 1 evento dal vivo non segnalato.'
                : 'An artist qualifies once they confirm their email and publish at least 1 non-flagged live gig.'}
            </p>
          </div>

          <span className="text-xs font-mono font-extrabold text-slate-300">
            {progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-3 rounded-full bg-white/10 overflow-hidden p-0.5">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-pink-500 to-cyan-400 transition-all duration-500"
          />
        </div>

        {isRewarded && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{t.invites.rewardUnlocked}</span>
          </div>
        )}
      </div>

      {/* Personal Link & Share Buttons */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {t.invites.yourLink}
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              readOnly
              value={fullInviteUrl}
              className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 font-mono text-xs text-cyan-300 focus:outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98]"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? t.invites.copiedToast : t.invites.copyButton}</span>
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="space-y-3 pt-2">
          <p className="text-xs font-semibold text-slate-400">
            Condividi direttamente sui social:
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-colors"
            >
              <span>{t.invites.shareWhatsapp}</span>
            </a>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-bold transition-colors"
            >
              <span>{t.invites.shareTelegram}</span>
            </a>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-colors"
            >
              <span>{t.invites.shareX}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Referrals Activity List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          <span>Artisti Invitati ({stats.totalInvited})</span>
        </h3>

        {stats.totalInvited === 0 ? (
          <div className="p-8 rounded-2xl glass-panel border border-white/10 text-center text-slate-400 text-xs">
            {t.invites.emptyInvites}
          </div>
        ) : (
          <div className="divide-y divide-white/5 rounded-2xl glass-panel border border-white/10 overflow-hidden">
            {stats.referrals.map((r: any) => (
              <div key={r.id} className="p-4 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-white">Artista Invitato #{r.invited_id.substring(0, 6)}</p>
                  <p className="text-[11px] text-slate-400">
                    Registrato il {new Date(r.created_at).toLocaleDateString('it-IT')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.is_email_verified ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' : 'bg-white/5 text-slate-500'
                    }`}
                  >
                    {r.is_email_verified ? 'Email Verificata' : 'In attesa verifica'}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.has_published_event ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20' : 'bg-white/5 text-slate-500'
                    }`}
                  >
                    {r.has_published_event ? '1° Concerto Pubblicato' : 'Nessun evento ancora'}
                  </span>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                      r.is_qualified && !r.is_revoked
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {r.is_revoked ? 'Revocato' : r.is_qualified ? 'QUALIFICATO ✓' : 'In corso'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
