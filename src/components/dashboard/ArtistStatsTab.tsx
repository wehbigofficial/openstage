'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ArtistDetailedStats } from '@/lib/services/artistStatsService';
import {
  BarChart3,
  Eye,
  Bookmark,
  Share2,
  Radio,
  UserCheck,
  MousePointerClick,
  Bell,
  Lock,
  Sparkles,
  MapPin,
  TrendingUp,
  Loader2,
} from 'lucide-react';

interface ArtistStatsTabProps {
  artistId: string;
}

export function ArtistStatsTab({ artistId }: ArtistStatsTabProps) {
  const { t, locale } = useLanguage();
  const isIt = locale === 'it';

  const [stats, setStats] = useState<ArtistDetailedStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch(`/api/artist/stats?artistId=${artistId}`);
        if (res.ok) {
          const json = await res.json();
          setStats(json);
        }
      } catch (err) {
        console.error('Error fetching artist stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
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

  const isPro = stats.isPro;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-pink-400" />
            <span>{t.stats.title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isPro
              ? 'Monitora le performance dei tuoi live, ascolti radio e provenienza del pubblico in tempo reale.'
              : 'Panoramica essenziale delle visualizzazioni, salvataggi e condivisioni dei tuoi concerti.'}
          </p>
        </div>

        {!isPro && (
          <Link
            href="/go-pro"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 text-black font-extrabold text-xs shadow-md hover:opacity-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t.stats.upgradeCta}</span>
          </Link>
        )}
      </div>

      {/* Free Metrics Cards (Always visible: Total Views, Saves, Shares) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Visualizzazioni Totali</span>
            <Eye className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-black text-white">{stats.totalViews}</p>
          <p className="text-[11px] text-slate-500">Tra tutti i tuoi concerti pubblicati</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t.stats.savesCount}</span>
            <Bookmark className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-3xl font-black text-white">{stats.totalSaves}</p>
          <p className="text-[11px] text-emerald-400 font-medium">Cresce per primo: fan interessati</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Condivisioni Locandina</span>
            <Share2 className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-3xl font-black text-white">{stats.totalShares}</p>
          <p className="text-[11px] text-slate-500">Download card grafiche e link copiati</p>
        </div>
      </div>

      {/* PRO Metrics (Radio plays, profile visits, ticket clicks, reminders) */}
      <div className="relative rounded-3xl p-6 sm:p-8 border border-white/10 glass-panel overflow-hidden">
        {!isPro && (
          <div className="absolute inset-0 z-20 backdrop-blur-md bg-black/70 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-lg font-extrabold text-white">{t.stats.blurredTeaser}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{t.stats.blurredTeaserDesc}</p>
            </div>
            <Link
              href="/go-pro"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-pink-500 to-violet-600 text-white font-extrabold text-xs shadow-xl shadow-amber-500/10 hover:opacity-95 transition-all"
            >
              {t.stats.upgradeCta} (€3 una tantum)
            </Link>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <span>Metriche Dettagliate di Conversione</span>
            </h3>
            {isPro && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PRO ATTIVO
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{t.stats.profileVisits}</span>
                <UserCheck className="w-4 h-4 text-pink-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.profileVisits}</p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{t.stats.radioPlays}</span>
                <Radio className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.radioPlays}</p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{t.stats.ticketClicks}</span>
                <MousePointerClick className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.ticketClicks}</p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{t.stats.remindersCount}</span>
                <Bell className="w-4 h-4 text-violet-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.remindersCount}</p>
            </div>
          </div>

          {/* Views over time timeline chart & Top Cities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* Timeline bar chart (14 days) */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">{t.stats.viewsOverTime} (Ultimi 14 giorni)</span>
                <span className="text-slate-400 font-mono text-[11px]">Aggiornato in tempo reale</span>
              </div>

              <div className="h-44 flex items-end gap-2 pt-6">
                {stats.viewsOverTime.map((d, i) => {
                  const maxViews = Math.max(...stats.viewsOverTime.map((v) => v.views), 1);
                  const heightPercent = Math.max(12, Math.round((d.views / maxViews) * 100));
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <div className="text-[9px] text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                        {d.views}
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-cyan-400 group-hover:from-pink-500 group-hover:to-cyan-300 transition-all"
                      />
                      <span className="text-[8px] text-slate-500 truncate max-w-full">
                        {d.date.substring(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Cities */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-pink-400" />
                  <span>{t.stats.topCities}</span>
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {stats.topCities.map((c, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-200 font-medium">{c.city}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{c.count} ({c.percentage}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        style={{ width: `${c.percentage}%` }}
                        className="h-full bg-gradient-to-r from-pink-500 to-violet-500 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
