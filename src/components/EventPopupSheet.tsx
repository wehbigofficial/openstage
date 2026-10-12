'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { EventItem } from '@/lib/data/demoEvents';
import { formatEventDateTime } from '@/lib/utils/eventTime';
import { getEventUrl } from '@/lib/utils/slug';
import { QuickAuthModal } from '@/components/QuickAuthModal';
import { createClient } from '@/lib/supabase/client';
import {
  X,
  Calendar,
  MapPin,
  Music,
  ExternalLink,
  Ticket,
  Bookmark,
  Bell,
  Share2,
  Check,
  AlertCircle,
} from 'lucide-react';

interface EventPopupSheetProps {
  event: EventItem | null;
  onClose: () => void;
  onSave?: (event: EventItem) => void;
  isSaved?: boolean;
}

export const EventPopupSheet = React.memo(function EventPopupSheet({
  event,
  onClose,
  onSave,
  isSaved = false,
}: EventPopupSheetProps) {
  const [copied, setCopied] = useState(false);
  const [savedLocal, setSavedLocal] = useState(isSaved);
  const [remindedLocal, setRemindedLocal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const userRef = useRef<any>(null);

  if (!event) return null;

  const { fullStr, timezoneLabel } = formatEventDateTime(
    event.starts_at,
    event.timezone
  );

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${event.venue_name || ''} ${event.address || ''}`.trim() || `${event.lat},${event.lng}`
  )}`;

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}${getEventUrl(event)}` : '';
    const shareData = {
      title: `${event.title} - ${event.artist_name}`,
      text: `Check out ${event.artist_name} live at ${event.venue_name} on OpenStage!`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const getOrFetchUser = async () => {
    if (userRef.current) return userRef.current;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userRef.current = user;
      return user;
    } catch {
      return null;
    }
  };

  const handleToggleSave = async () => {
    const u = await getOrFetchUser();
    if (!u) {
      setShowAuthModal(true);
      return;
    }
    const nextSaved = !savedLocal;
    setSavedLocal(nextSaved);
    if (onSave) {
      onSave(event);
    }
    try {
      await fetch('/api/fan/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id }),
      });
    } catch {}
  };

  const handleToggleRemind = async () => {
    const u = await getOrFetchUser();
    if (!u) {
      setShowAuthModal(true);
      return;
    }
    const nextReminded = !remindedLocal;
    setRemindedLocal(nextReminded);
    try {
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet / Dialog Card */}
      <div className="relative w-full max-w-lg bg-[#0F0F1A] border border-white/15 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Mobile drag bar */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/60 text-slate-300 hover:text-white hover:bg-black/80 transition-colors border border-white/10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Poster Image */}
        <div className="relative h-48 sm:h-52 w-full overflow-hidden shrink-0 bg-slate-900">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F1A] via-[#0F0F1A]/40 to-transparent" />

          {/* Badges on poster */}
          <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-600/90 text-white backdrop-blur-md shadow-sm border border-violet-400/30">
              {event.genre}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 text-cyan-300 border border-cyan-500/30 backdrop-blur-md">
              {event.event_type.toUpperCase()}
            </span>
            {event.is_featured && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/90 text-black shadow-lg shadow-amber-500/20">
                FEATURED
              </span>
            )}
            {event.is_free && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/90 text-black">
                FREE ENTRY
              </span>
            )}
          </div>
        </div>

        {/* Content body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              {event.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 text-cyan-400 font-medium text-sm">
              <Music className="w-4 h-4 shrink-0" />
              <span>{event.artist_name}</span>
              {event.is_emerging && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                  Emerging Artist
                </span>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-start gap-2.5 text-slate-300 text-sm">
              <Calendar className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">{fullStr}</p>
                <p className="text-xs text-slate-400">
                  Local venue time ({timezoneLabel})
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-slate-300 text-sm pt-1 border-t border-white/5">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-200">
                  {event.venue_name} • {event.city}, {event.country}
                </p>
                <p className="text-xs text-slate-400">{event.address}</p>
                {event.approximate_location && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-300">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Approximate area circle shown. Exact address shared with attendees.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
              {event.description}
            </p>
          )}

          {/* Required Action Buttons */}
          <div className="space-y-2.5 pt-2">
            {/* Primary row: Event Page & Tickets */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href={getEventUrl(event)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold text-xs sm:text-sm hover:opacity-95 shadow-md shadow-violet-600/20 transition-all text-center"
              >
                <span>Event Page</span>
              </Link>

              {event.ticket_url ? (
                <a
                  href={event.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-pink-600/20 text-center"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Tickets ({event.price_text})</span>
                </a>
              ) : (
                <div className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs sm:text-sm font-medium">
                  <span>{event.price_text || 'Free Entry'}</span>
                </div>
              )}
            </div>

            {/* Secondary row: Open in Google Maps, Save, Remind, Share */}
            <div className="grid grid-cols-4 gap-2">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-white text-xs transition-colors"
                title="Open in Google Maps"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                <span className="truncate">Maps</span>
              </a>

              <button
                onClick={handleToggleSave}
                className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl border text-xs transition-colors ${
                  savedLocal
                    ? 'bg-violet-900/40 border-violet-500 text-violet-300'
                    : 'bg-white/5 border-white/10 hover:border-violet-400/40 text-slate-300 hover:text-white'
                }`}
              >
                <Bookmark
                  className={`w-3.5 h-3.5 ${
                    savedLocal ? 'fill-violet-400 text-violet-400' : 'text-violet-400'
                  }`}
                />
                <span className="truncate">{savedLocal ? 'Saved' : 'Save'}</span>
              </button>

              <button
                onClick={handleToggleRemind}
                className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl border text-xs transition-colors ${
                  remindedLocal
                    ? 'bg-cyan-900/40 border-cyan-500 text-cyan-300'
                    : 'bg-white/5 border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-white'
                }`}
                title="Promemoria"
              >
                <Bell
                  className={`w-3.5 h-3.5 ${
                    remindedLocal ? 'fill-cyan-400 text-cyan-400' : 'text-cyan-400'
                  }`}
                />
                <span className="truncate">{remindedLocal ? 'Attivo' : 'Memo'}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-pink-400/40 text-slate-300 hover:text-white text-xs transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-[11px]">OK</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-pink-400" />
                    <span className="truncate">Share</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <QuickAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Accedi per salvare e impostare promemoria"
        subtitle="Unisciti a OpenStage per salvare eventi, impostare promemoria e seguire i tuoi artisti preferiti."
      />
    </div>
  );
});
