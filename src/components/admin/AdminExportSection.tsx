'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  Users,
  Calendar,
  MessageSquare,
  Mail,
  Settings,
  Database,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export function AdminExportSection() {
  const { t, locale } = useLanguage();
  const isIt = locale === 'it';

  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (table: string, format: 'csv' | 'json') => {
    const key = `${table}-${format}`;
    setDownloading(key);
    try {
      const url = `/api/admin/export?table=${table}&format=${format}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Errore download');

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `openstage-${table}-${dateStr}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      alert(err.message || 'Errore durante l esportazione');
    } finally {
      setDownloading(null);
    }
  };

  const tables = [
    {
      id: 'events',
      title: t.admin.exportEvents,
      desc: isIt
        ? 'Tutti gli eventi, concerti, date, orari, coordinate geografiche e stato di moderazione.'
        : 'All shows, gigs, dates, times, coordinates and moderation statuses.',
      icon: <Calendar className="w-6 h-6 text-violet-400" />,
      color: 'violet',
    },
    {
      id: 'users',
      title: t.admin.exportUsers,
      desc: isIt
        ? 'Anagrafica completa profili artisti, locali e fan con preferenze e date di iscrizione.'
        : 'Complete directory of artist, venue, and fan profiles with preferences.',
      icon: <Users className="w-6 h-6 text-pink-400" />,
      color: 'pink',
    },
    {
      id: 'tickets',
      title: t.admin.exportTickets,
      desc: isIt
        ? 'Storico completo richieste di supporto, messaggi dal form contatti e risposte inviate.'
        : 'Full history of support tickets, public contact messages and answers.',
      icon: <MessageSquare className="w-6 h-6 text-cyan-400" />,
      color: 'cyan',
    },
    {
      id: 'maillog',
      title: t.admin.exportMailLogs,
      desc: isIt
        ? 'Registro analitico invii email Resend con codice errore, tentativi e batch ID.'
        : 'Analytical logs of email dispatches with error classifications and batch IDs.',
      icon: <Mail className="w-6 h-6 text-amber-400" />,
      color: 'amber',
    },
    {
      id: 'settings',
      title: t.admin.exportSettings,
      desc: isIt
        ? 'Configurazione generale della piattaforma, prezzi Pro, soglie spam e statistiche.'
        : 'Platform settings, Pro subscription prices, and anti-spam limits.',
      icon: <Settings className="w-6 h-6 text-emerald-400" />,
      color: 'emerald',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{t.admin.exportTitle}</h3>
            <p className="text-xs text-slate-400">{t.admin.exportDesc}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {tables.map((tItem) => {
          const isDownloadingCsv = downloading === `${tItem.id}-csv`;
          const isDownloadingJson = downloading === `${tItem.id}-json`;

          return (
            <div
              key={tItem.id}
              className="glass-panel p-6 rounded-3xl border border-white/10 space-y-5 hover:border-white/20 transition-all shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    {tItem.icon}
                  </div>
                  <h4 className="text-base font-bold text-white">{tItem.title}</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{tItem.desc}</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={!!downloading}
                  onClick={() => handleDownload(tItem.id, 'csv')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all hover:border-cyan-400/50 disabled:opacity-50"
                >
                  {isDownloadingCsv ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span>Scarica CSV</span>
                </button>

                <button
                  type="button"
                  disabled={!!downloading}
                  onClick={() => handleDownload(tItem.id, 'json')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all hover:border-violet-400/50 disabled:opacity-50"
                >
                  {isDownloadingJson ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileCode className="w-3.5 h-3.5 text-violet-400" />
                  )}
                  <span>Scarica JSON</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
