'use client';

import { EventItem } from '@/lib/data/demoEvents';
import { formatEventDateTime } from '@/lib/utils/eventTime';
import { EventCard } from '@/components/EventCard';
import {
  Calendar,
  MapPin,
  Music,
  Ticket,
  Bookmark,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

interface EventTableProps {
  events: EventItem[];
  userCoords?: { lat: number; lng: number } | null;
  getDistance?: (event: EventItem) => number | null;
  onSelect: (event: EventItem) => void;
  onSave?: (event: EventItem) => void;
  savedEventIds?: string[];
}

export function EventTable({
  events,
  getDistance,
  onSelect,
  onSave,
  savedEventIds = [],
}: EventTableProps) {
  return (
    <div>
      {/* Mobile view: turns into cards */}
      <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            distanceKm={getDistance ? getDistance(event) : null}
            onSelect={onSelect}
            onSave={onSave}
            isSaved={savedEventIds.includes(event.id)}
          />
        ))}
      </div>

      {/* Desktop view: structured table */}
      <div className="hidden md:block rounded-2xl glass-panel border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Event & Artist</th>
                <th className="py-3.5 px-4">Date & Local Time</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Genre</th>
                <th className="py-3.5 px-4">Admission</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {events.map((event) => {
                const { fullStr, timezoneLabel } = formatEventDateTime(
                  event.starts_at,
                  event.timezone
                );
                const distance = getDistance ? getDistance(event) : null;
                const isSaved = savedEventIds.includes(event.id);

                return (
                  <tr
                    key={event.id}
                    onClick={() => onSelect(event)}
                    className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    {/* Event & Artist */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10 shadow-sm"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors truncate max-w-xs flex items-center gap-2">
                            <span>{event.title}</span>
                            {event.is_featured && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400 text-black shrink-0">
                                FEATURED
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-cyan-400 font-medium flex items-center gap-1 truncate">
                            <Music className="w-3 h-3 shrink-0" />
                            <span>{event.artist_name}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-200">
                        <Calendar className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                        <span>{fullStr}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 pl-5">
                        {timezoneLabel} timezone
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-medium text-slate-200 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate max-w-[180px]">
                          {event.venue_name}, {event.city}
                        </span>
                        {event.approximate_location && (
                          <span
                            className="text-[10px] text-amber-300 ml-1"
                            title="Approximate area"
                          >
                            (Area)
                          </span>
                        )}
                      </div>
                      {typeof distance === 'number' && (
                        <div className="text-[10px] text-cyan-400/80 pl-4">
                          {distance} km away
                        </div>
                      )}
                    </td>

                    {/* Genre */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-900/30 text-violet-300 border border-violet-500/30">
                        {event.genre}
                      </span>
                    </td>

                    {/* Admission */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          event.is_free
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'text-slate-200'
                        }`}
                      >
                        {event.price_text || (event.is_free ? 'Free' : 'Tickets')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div
                        className="inline-flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {event.ticket_url && (
                          <a
                            href={event.ticket_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
                          >
                            <Ticket className="w-3 h-3" />
                            <span>Tickets</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => onSave && onSave(event)}
                          className={`p-1.5 rounded-lg border text-xs transition-colors ${
                            isSaved
                              ? 'bg-violet-900/40 border-violet-500 text-violet-300'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                          }`}
                          title="Save"
                        >
                          <Bookmark
                            className={`w-3.5 h-3.5 ${
                              isSaved ? 'fill-violet-400 text-violet-400' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
