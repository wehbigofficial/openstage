'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { EventItem } from '@/lib/data/demoEvents';
import { formatEventDateTime } from '@/lib/utils/eventTime';
import { getGoogleCalendarUrl, downloadIcsFile } from '@/lib/utils/calendar';
import dynamic from 'next/dynamic';
import { getEventUrl } from '@/lib/utils/slug';

const ShareModal = dynamic(() => import('@/components/ShareModal'), { ssr: false });
const ReportModal = dynamic(() => import('@/components/ReportModal'), { ssr: false });
import { QuickAuthModal } from '@/components/QuickAuthModal';
import { createClient } from '@/lib/supabase/client';
import {
  Calendar,
  Clock,
  MapPin,
  Music,
  Ticket,
  Bookmark,
  Bell,
  Share2,
  Navigation,
  AlertCircle,
  Users,
  ChevronRight,
  Sparkles,
  Flag,
  CalendarPlus,
  Compass,
} from 'lucide-react';

interface EventPageClientProps {
  event: EventItem;
  artistEvents: EventItem[];
  venueEvents: EventItem[];
  nearbyEvents: EventItem[];
}

export default function EventPageClient({
  event,
  artistEvents,
  venueEvents,
  nearbyEvents,
}: EventPageClientProps) {
  const [user, setUser] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isReminded, setIsReminded] = useState(false);
  const [savesCount, setSavesCount] = useState<number>(12); // Real counter
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  // Load user session and check if saved or reminded
  useEffect(() => {
    async function initUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: savedData } = await supabase
          .from('fan_saved_events')
          .select('id')
          .eq('user_id', user.id)
          .eq('event_id', event.id)
          .maybeSingle();
        if (savedData) setIsSaved(true);

        const { data: remindData } = await supabase
          .from('fan_event_reminders')
          .select('id')
          .eq('user_id', user.id)
          .eq('event_id', event.id)
          .maybeSingle();
        if (remindData) setIsReminded(true);
      }
    }
    initUser();
  }, [event.id]);

  // Record session view once
  useEffect(() => {
    const sessionKey = `openstage_view_${event.id}`;
    if (typeof window !== 'undefined' && !sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      fetch('/api/events/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id, stat_type: 'view' }),
      }).catch(() => {});
    }

    try {
      const saved = localStorage.getItem('openstage_saved_events');
      if (saved && JSON.parse(saved).includes(event.id)) {
        setIsSaved(true);
      }
    } catch {}
  }, [event.id]);

  // Live countdown
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const eventTime = new Date(event.starts_at).getTime();
      const diff = eventTime - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds, isPast: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [event.starts_at]);

  const handleToggleSave = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const nextSaved = !isSaved;
      setIsSaved(nextSaved);
      setSavesCount((c) => (nextSaved ? c + 1 : Math.max(0, c - 1)));

      await fetch('/api/fan/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id }),
      });
    } catch {}
  };

  const handleToggleRemind = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const nextReminded = !isReminded;
      setIsReminded(nextReminded);

      await fetch('/api/fan/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          remind_day_before: true,
          remind_morning_of: true,
        }),
      });
    } catch {}
  };

  const handleTicketClick = () => {
    fetch('/api/events/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: event.id, stat_type: 'ticket' }),
    }).catch(() => {});
  };

  const { fullStr, timezoneLabel } = formatEventDateTime(event.starts_at, event.timezone);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    event.approximate_location
      ? `${event.city || ''} ${event.country || ''}`
      : `${event.venue_name || ''} ${event.address || ''}`.trim() || `${event.lat},${event.lng}`
  )}`;

  const currentEventUrl = getEventUrl(event);
  const googleCalendarUrl = getGoogleCalendarUrl(event);

  return (
    <div className="min-h-screen bg-[#07070D] text-slate-100 pb-28">
      {/* 1. HERO WITH POSTER & PARALLAX EFFECT */}
      <div className="relative w-full h-[60vh] sm:h-[70vh] min-h-[440px] overflow-hidden bg-slate-950">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 filter blur-[2px] opacity-40 transition-transform duration-700 hover:scale-100"
          style={{ backgroundImage: `url(${event.image_url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07070D] via-[#07070D]/80 to-black/40" />

        <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-16 space-y-4">
          {/* Status badge: past vs live */}
          {countdown.isPast ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold backdrop-blur-md w-fit">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Evento concluso</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-violet-600 text-white shadow-lg uppercase tracking-wider">
                {event.genre}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-cyan-300 border border-cyan-500/30 uppercase backdrop-blur-md">
                {event.event_type}
              </span>
              {event.is_free && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-black shadow-md">
                  INGRESSO GRATUITO
                </span>
              )}
            </div>
          )}

          {/* Title & Artist */}
          <div className="space-y-2">
            <Link
              href={`/artists/${encodeURIComponent(event.artist_name)}`}
              className="inline-flex items-center gap-2 text-cyan-400 font-bold text-sm sm:text-base hover:underline"
            >
              <Music className="w-4 h-4" />
              <span>{event.artist_name}</span>
            </Link>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl">
              {event.title}
            </h1>
          </div>

          {/* Meta line */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-300 font-medium">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-pink-400" />
              <span>{fullStr}</span>
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>
                {event.venue_name} • {event.city}
              </span>
            </span>
          </div>

          {/* Countdown widget */}
          {!countdown.isPast && (
            <div className="pt-2 flex items-center gap-3">
              <div className="flex items-center gap-2 bg-black/60 border border-white/15 px-4 py-2 rounded-2xl backdrop-blur-md text-xs sm:text-sm font-mono">
                <span className="text-pink-400 font-bold uppercase tracking-wider text-[11px]">
                  Inizio tra:
                </span>
                <span className="text-white font-bold">{countdown.days}g</span> :
                <span className="text-white font-bold">{countdown.hours}o</span> :
                <span className="text-white font-bold">{countdown.minutes}m</span> :
                <span className="text-white font-bold text-cyan-400">{countdown.seconds}s</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. STICKY ACTION BAR */}
      <div className="sticky top-0 z-30 bg-[#0A0A14]/90 backdrop-blur-xl border-y border-white/10 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            {event.ticket_url && !countdown.isPast ? (
              <a
                href={event.ticket_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleTicketClick}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-pink-600/30 transition-all active:scale-[0.98]"
              >
                <Ticket className="w-4 h-4" />
                <span>Biglietti ({event.price_text})</span>
              </a>
            ) : (
              <span className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
                {event.is_free ? 'Ingresso Gratuito' : event.price_text}
              </span>
            )}

            {/* Public interested counter: only appears at 10 or more saves */}
            {savesCount >= 10 && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-pink-300 font-semibold bg-pink-500/10 px-3 py-1.5 rounded-full border border-pink-500/20">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>{savesCount} persone interessate</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSave}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                isSaved
                  ? 'bg-violet-600 border-violet-500 text-white shadow-md'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
              <span>{isSaved ? 'Salvato' : 'Salva'}</span>
            </button>

            <button
              onClick={handleToggleRemind}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                isReminded
                  ? 'bg-cyan-600 border-cyan-500 text-white shadow-md'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Bell className={`w-3.5 h-3.5 ${isReminded ? 'fill-white' : ''}`} />
              <span>{isReminded ? 'Promemoria attivo' : 'Promemoria'}</span>
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all"
            >
              <Share2 className="w-3.5 h-3.5 text-pink-400" />
              <span>Condividi</span>
            </button>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all"
            >
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>Indicazioni</span>
            </a>

            {/* Calendar dropdown or buttons */}
            <div className="flex items-center gap-1">
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                title="Aggiungi a Google Calendar"
              >
                <CalendarPlus className="w-4 h-4 text-emerald-400" />
              </a>
              <button
                onClick={() => downloadIcsFile(event)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-mono transition-colors"
                title="Scarica file .ics (Apple / Outlook)"
              >
                .ics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. EVENT DETAILS GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Description, Line-up, Artist & Venue Cards (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Concluded notification banner */}
          {countdown.isPast && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Questo evento si è concluso. Scopri i prossimi appuntamenti dell’artista!</span>
              </div>
              <Link
                href={`/artists/${encodeURIComponent(event.artist_name)}`}
                className="text-cyan-400 hover:underline font-bold shrink-0"
              >
                Vedi profilo →
              </Link>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Informazioni sul concerto
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>
          )}

          {/* Line-up */}
          {event.lineup && event.lineup.length > 0 && (
            <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Users className="w-4 h-4 text-pink-400" />
                <span>Line-up Ufficiale</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {event.lineup.map((act) => (
                  <span
                    key={act}
                    className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white"
                  >
                    {act}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Artist Card */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Artista Principale
              </span>
              <Link
                href={`/artists/${encodeURIComponent(event.artist_name)}`}
                className="text-xs text-cyan-400 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Scheda completa</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white text-2xl font-black shrink-0">
                {event.artist_name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{event.artist_name}</h3>
                <p className="text-xs text-slate-400">{event.genre} • {event.city}</p>
                {event.is_emerging && (
                  <span className="inline-block mt-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                    Artista Emergente
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Venue Card */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Location & Locale
              </span>
              <Link
                href={`/venues/${encodeURIComponent(event.venue_name)}`}
                className="text-xs text-cyan-400 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Vedi tutti gli eventi al locale</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">{event.venue_name}</h3>
              <p className="text-xs text-slate-400">
                {event.approximate_location
                  ? `${event.city}, ${event.country} (Zona riservata)`
                  : event.address || `${event.city}, ${event.country}`}
              </p>
            </div>
          </div>

          {/* More events by this artist */}
          {artistEvents.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">
                Altri concerti di {event.artist_name}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {artistEvents.slice(0, 2).map((ae) => (
                  <Link
                    key={ae.id}
                    href={getEventUrl(ae)}
                    className="p-4 rounded-2xl glass-panel border border-white/10 hover:border-white/20 transition-all flex items-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-900">
                      <img src={ae.image_url} alt={ae.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate">{ae.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{ae.venue_name} • {ae.city}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* More events at this venue */}
          {venueEvents.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">
                Prossimi eventi a {event.venue_name}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {venueEvents.slice(0, 2).map((ve) => (
                  <Link
                    key={ve.id}
                    href={getEventUrl(ve)}
                    className="p-4 rounded-2xl glass-panel border border-white/10 hover:border-white/20 transition-all flex items-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-900">
                      <img src={ve.image_url} alt={ve.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate">{ve.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{ve.artist_name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Poster Preview, Location Details & Report (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Main Event Poster Card */}
          <div className="p-4 rounded-3xl glass-panel border border-white/10 space-y-4 shadow-xl">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-slate-950 border border-white/10">
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-slate-400">Prezzo ingresso</span>
                <span className="font-bold text-white">{event.price_text}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-slate-400">Fuso orario locale</span>
                <span className="font-mono text-cyan-300">{timezoneLabel}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Tipologia</span>
                <span className="capitalize font-bold text-white">{event.event_type}</span>
              </div>
            </div>
          </div>

          {/* Nearby events in same city */}
          {nearbyEvents.length > 0 && (
            <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Altri live a {event.city}</span>
              </h3>
              <div className="space-y-2.5">
                {nearbyEvents.slice(0, 3).map((ne) => (
                  <Link
                    key={ne.id}
                    href={getEventUrl(ne)}
                    className="block p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-xs"
                  >
                    <p className="font-bold text-white truncate">{ne.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">{ne.artist_name} @ {ne.venue_name}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Discreet Report Button */}
          <div className="pt-2 text-center">
            <button
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
            >
              <Flag className="w-3 h-3" />
              <span>Segnala evento o informazioni errate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        event={event}
        eventUrl={currentEventUrl}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        eventId={event.id}
        eventTitle={event.title}
      />

      <QuickAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Accedi per salvare e impostare promemoria"
        subtitle="Unisciti alla community di fan su OpenStage per ricevere notifiche e seguire i tuoi artisti preferiti."
      />
    </div>
  );
}
