'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  Users,
  Calendar,
  Radio,
  Sparkles,
  TrendingUp,
  MapPin,
  Eye,
  Ticket,
  Bookmark,
  Share2,
  Euro,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';

export function AdminOverviewSection() {
  const { t, locale } = useLanguage();
  const isIt = locale === 'it';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        const res = await fetch('/api/admin/overview');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Error fetching overview data', err);
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
      </div>
    );
  }

  const { users, events, eventsPerCity, mostClicked, signupsChart, proPlaceholders, radioPlaceholders } = data;
  const maxSignups = Math.max(...(signupsChart || []).map((s: any) => s.count), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. TOP STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total & Active Events */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t.admin.events}
            </span>
            <div className="p-2 rounded-xl bg-violet-600/10 text-violet-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{events.active}</span>
            <span className="text-xs text-emerald-400 font-semibold">
              {t.admin.activeEvents}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {events.total} {t.admin.totalEvents.toLowerCase()}
          </p>
        </div>

        {/* Users Breakdown */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t.admin.usersByRole}
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{users.total}</span>
            <span className="text-xs text-slate-400">{isIt ? 'Totali' : 'Total'}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>
              <strong className="text-pink-400">{users.artists}</strong> {t.admin.artists}
            </span>
            <span>•</span>
            <span>
              <strong className="text-cyan-400">{users.venues}</strong> {t.admin.venues}
            </span>
            <span>•</span>
            <span>
              <strong className="text-violet-400">{users.fans}</strong> {t.admin.fans}
            </span>
          </div>
        </div>

        {/* Pro Conversions & Revenue (Placeholders) */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t.admin.proConversions}
            </span>
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
              <Euro className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              €{proPlaceholders.estimatedMrrEur.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">MRR</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              {proPlaceholders.artistProCount + proPlaceholders.venueProMonthlyCount + proPlaceholders.venueProAnnualCount} abbonati
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold uppercase">
              Placeholder
            </span>
          </div>
        </div>

        {/* Radio Plays & Applications (Placeholders) */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t.admin.radioPlays}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {radioPlaceholders.playsCount.toLocaleString()}
            </span>
            <span className="text-xs text-amber-400">{isIt ? 'Ascolti' : 'Plays'}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              {radioPlaceholders.applicationsSent} {t.admin.applicationsSent.toLowerCase()} (
              <strong className="text-emerald-400">{radioPlaceholders.applicationsAccepted}</strong> ok)
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
              Placeholder
            </span>
          </div>
        </div>
      </div>

      {/* 2. SIGN-UPS PER DAY CHART & EVENTS PER CITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sign-ups chart (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                {t.admin.signupsPerDay}
              </h3>
              <p className="text-xs text-slate-400">
                {isIt ? 'Ultime 2 settimane di attività sulla piattaforma' : 'Last 2 weeks of signups activity'}
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
              14 giorni
            </span>
          </div>

          <div className="h-44 pt-6 flex items-end justify-between gap-1 sm:gap-2">
            {signupsChart?.map((day: any) => {
              const heightPercent = Math.max((day.count / maxSignups) * 100, 8);
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.count}
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-violet-600 to-cyan-400 group-hover:from-violet-500 group-hover:to-cyan-300 transition-all shadow-md shadow-violet-600/20"
                  />
                  <span className="text-[10px] text-slate-500 font-mono tracking-tighter">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Events per City (1 col) */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-pink-400" />
              {t.admin.eventsPerCity}
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {eventsPerCity.length} {isIt ? 'città' : 'cities'}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {eventsPerCity.slice(0, 6).map((cityItem: any, idx: number) => {
              const totalEventsCount = events.total || 1;
              const percentage = Math.round((cityItem.count / totalEventsCount) * 100);
              return (
                <div key={cityItem.city} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{cityItem.city}</span>
                    <span className="font-mono text-slate-400">
                      {cityItem.count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. MOST CLICKED EVENTS TABLE */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {t.admin.mostClicked}
            </h3>
            <p className="text-xs text-slate-400">
              {isIt ? 'Classifica per interesse, click ai biglietti e salvataggi' : 'Ranked by views, ticket clicks, and saves'}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10 bg-white/5">
              <tr>
                <th className="py-3 px-4 font-semibold">{t.admin.events}</th>
                <th className="py-3 px-4 font-semibold text-center">{t.admin.views}</th>
                <th className="py-3 px-4 font-semibold text-center">{t.admin.ticketClicks}</th>
                <th className="py-3 px-4 font-semibold text-center">{t.admin.saves}</th>
                <th className="py-3 px-4 font-semibold text-center">{t.admin.shares}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mostClicked.map((evt: any, idx: number) => (
                <tr key={evt.id || idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-mono text-[10px] text-slate-400">
                        {idx + 1}
                      </span>
                      <span>{evt.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-cyan-300">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3 h-3 text-cyan-400" />
                      {evt.views}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-pink-300">
                    <span className="inline-flex items-center gap-1">
                      <Ticket className="w-3 h-3 text-pink-400" />
                      {evt.ticketClicks}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-amber-300">
                    <span className="inline-flex items-center gap-1">
                      <Bookmark className="w-3 h-3 text-amber-400" />
                      {evt.saves}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-violet-300">
                    <span className="inline-flex items-center gap-1">
                      <Share2 className="w-3 h-3 text-violet-400" />
                      {evt.shares}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
