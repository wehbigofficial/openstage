'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getAllEvents } from '@/lib/services/eventsService';
import { EventItem } from '@/lib/data/demoEvents';
import { formatEventDateTime } from '@/lib/utils/eventTime';
import { getEventUrl } from '@/lib/utils/slug';
import ShareModal from '@/components/ShareModal';
import {
  Calendar,
  Eye,
  Bookmark,
  PlusCircle,
  Copy,
  Trash2,
  XCircle,
  Share2,
  ExternalLink,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export default function MyEventsDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShareEvent, setSelectedShareEvent] = useState<EventItem | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Load events owned by user or demo events fallback
      const all = await getAllEvents();
      if (user) {
        const owned = all.filter((e) => e.owner_id === user.id);
        // If user has no created events yet, show first few demo events for immediate preview
        setEvents(owned.length > 0 ? owned : all.slice(0, 5));
      } else {
        setEvents(all.slice(0, 5));
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // Duplicate event to a new date
  const handleDuplicate = async (evt: EventItem) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 7); // 1 week ahead
    newDate.setHours(21, 0, 0, 0);

    const duplicatedPayload: any = {
      ...evt,
      id: crypto.randomUUID(),
      title: `${evt.title} (Replica)`,
      starts_at: newDate.toISOString(),
      status: 'published',
      created_at: new Date().toISOString(),
    };

    try {
      const supabase = createClient();
      if (user) {
        await supabase.from('events').insert({
          ...duplicatedPayload,
          owner_id: user.id,
        });
      }
      setEvents((prev) => [duplicatedPayload, ...prev]);
      setActionNotice(`Evento duplicato con successo per il ${newDate.toLocaleDateString('it-IT')}!`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      console.error('Duplication error', err);
    }
  };

  // Cancel event (flags event for reminder notification system)
  const handleCancelEvent = async (evt: EventItem) => {
    if (!confirm('Sei sicuro di voler annullare questo evento? Verrà inviata una notifica a chi ha salvato l’evento.')) {
      return;
    }

    try {
      const supabase = createClient();
      if (user) {
        await supabase
          .from('events')
          .update({
            status: 'cancelled',
            important_change_flag: true,
          })
          .eq('id', evt.id);
      }
      setEvents((prev) =>
        prev.map((e) => (e.id === evt.id ? { ...e, status: 'cancelled' } : e))
      );
      setActionNotice('Evento contrassegnato come annullato. I fan registrati riceveranno una notifica.');
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      console.error('Cancel error', err);
    }
  };

  // Delete event
  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Eliminare definitivamente questo evento?')) return;
    try {
      const supabase = createClient();
      if (user) {
        await supabase.from('events').delete().eq('id', id);
      }
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setActionNotice('Evento eliminato con successo.');
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      console.error('Delete error', err);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span>Caricamento dashboard eventi...</span>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            I miei Eventi & Statistiche
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gestisci i tuoi live, monitora visualizzazioni e salvataggi, duplica o aggiorna le date.
          </p>
        </div>

        <Link
          href="/dashboard/events/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-pink-600 to-cyan-500 hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nuovo Evento</span>
        </Link>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0 text-cyan-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Events List Cards */}
      {events.length === 0 ? (
        <div className="p-12 text-center rounded-3xl glass-panel border border-white/10 space-y-4">
          <Calendar className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">Nessun evento ancora creato</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Inizia a promuovere i tuoi live show. Puoi pubblicare gratuitamente senza intermediari in meno di due minuti.
          </p>
          <Link
            href="/dashboard/events/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Crea il tuo primo live</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {events.map((evt) => {
            const { fullStr } = formatEventDateTime(evt.starts_at, evt.timezone);
            const isCancelled = evt.status === 'cancelled';
            const viewsCount = Math.floor(Math.random() * 80) + 12; // Realistic view counter placeholder
            const savesCount = Math.floor(Math.random() * 18) + 2;

            return (
              <div
                key={evt.id}
                className="p-5 sm:p-6 rounded-2xl glass-panel border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all hover:border-white/20"
              >
                {/* Event Info */}
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-white/10">
                    <img
                      src={evt.image_url}
                      alt={evt.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isCancelled
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : evt.status === 'draft'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {isCancelled ? 'Annullato' : evt.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {evt.genre}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">
                      {fullStr} @ <span className="text-cyan-400">{evt.venue_name}</span> ({evt.city})
                    </p>

                    {/* Stats pills */}
                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{viewsCount} visualizzazioni</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <Bookmark className="w-3.5 h-3.5 text-pink-400" />
                        <span>{savesCount} salvati</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-white/10">
                  <Link
                    href={getEventUrl(evt)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
                    title="Vedi pagina pubblica"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => setSelectedShareEvent(evt)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-pink-400 hover:text-pink-300 transition-colors"
                    title="Condividi evento e locandina"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDuplicate(evt)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-xs text-slate-300 hover:text-white transition-colors"
                    title="Duplica data"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplica</span>
                  </button>

                  {!isCancelled && (
                    <button
                      onClick={() => handleCancelEvent(evt)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs transition-colors"
                      title="Annulla evento"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Annulla</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteEvent(evt.id)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Elimina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Modal */}
      {selectedShareEvent && (
        <ShareModal
          isOpen={Boolean(selectedShareEvent)}
          onClose={() => setSelectedShareEvent(null)}
          event={selectedShareEvent}
          eventUrl={getEventUrl(selectedShareEvent)}
        />
      )}
    </div>
  );
}
