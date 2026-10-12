'use client';

import { EventItem } from '@/lib/data/demoEvents';
import { formatEventDateTime } from '@/lib/utils/eventTime';
import {
  Calendar,
  MapPin,
  Music,
  Ticket,
  Bookmark,
  Share2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

import React from 'react';

interface EventCardProps {
  event: EventItem;
  distanceKm?: number | null;
  onSelect: (event: EventItem) => void;
  onSave?: (event: EventItem) => void;
  isSaved?: boolean;
}

export const EventCard = React.memo(function EventCard({
  event,
  distanceKm,
  onSelect,
  onSave,
  isSaved = false,
}: EventCardProps) {
  const { dateStr, timeStr, timezoneLabel } = formatEventDateTime(
    event.starts_at,
    event.timezone
  );

  return (
    <div
      onClick={() => onSelect(event)}
      className="group relative flex flex-col rounded-2xl glass-panel glass-card-hover border border-white/10 overflow-hidden cursor-pointer"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F1A] via-transparent to-black/30" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <div className="flex flex-wrap items-center gap-1.5">
            {event.is_featured && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg shadow-amber-500/25">
                FEATURED
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-600/80 backdrop-blur-md text-white border border-violet-400/30">
              {event.genre}
            </span>
          </div>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 backdrop-blur-md text-cyan-300 border border-cyan-400/20">
            {event.event_type}
          </span>
        </div>

        {/* Price Tag Bottom Right of Image */}
        <div className="absolute bottom-3 right-3">
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-md shadow-md ${
              event.is_free
                ? 'bg-emerald-500/90 text-black'
                : 'bg-black/75 text-white border border-white/20'
            }`}
          >
            {event.price_text || (event.is_free ? 'Free' : 'Tickets')}
          </span>
        </div>

        {/* Distance Badge if available */}
        {typeof distanceKm === 'number' && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-950/80 backdrop-blur-md text-cyan-300 border border-cyan-500/40">
              {distanceKm} km away
            </span>
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Artist & Emerging Badge */}
          <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold mb-1">
            <Music className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{event.artist_name}</span>
            {event.is_emerging && (
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                Emerging
              </span>
            )}
          </div>

          {/* Event Title */}
          <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
            {event.title}
          </h3>
        </div>

        {/* Date & Location */}
        <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span className="font-medium">{dateStr} • {timeStr}</span>
            <span className="text-[10px] text-slate-400">({timezoneLabel})</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">
              {event.venue_name} • {event.city}
            </span>
            {event.approximate_location && (
              <span
                className="text-[10px] text-amber-300 shrink-0 flex items-center gap-0.5"
                title="Approximate area"
              >
                <AlertCircle className="w-3 h-3" /> Area
              </span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(event);
            }}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>View gig</span>
            <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
          </button>

          <div className="flex items-center gap-1">
            {event.ticket_url && (
              <a
                href={event.ticket_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-pink-500/20 text-pink-400 border border-white/10 hover:border-pink-500/30 transition-colors"
                title="Buy Tickets"
              >
                <Ticket className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onSave) onSave(event);
              }}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-violet-500/20 text-slate-400 hover:text-violet-300 border border-white/10 hover:border-violet-500/30 transition-colors"
              title="Save Event"
            >
              <Bookmark
                className={`w-3.5 h-3.5 ${
                  isSaved ? 'fill-violet-400 text-violet-400' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
