'use client';

import { useState } from 'react';
import Link from 'next/link';
import { EventItem } from '@/lib/data/demoEvents';
import { EventCard } from '@/components/EventCard';
import { EventTable } from '@/components/EventTable';
import { Map2DSection } from '@/components/Map2DSection';
import {
  LayoutGrid,
  Table as TableIcon,
  Map as MapIcon,
  Sparkles,
  Compass,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Send,
} from 'lucide-react';

interface ShowcaseSectionProps {
  events: EventItem[];
  allUpcomingEvents: EventItem[]; // For empty state closest events fallback
  getDistance: (event: EventItem) => number | null;
  onSelectEvent: (event: EventItem) => void;
  onSaveEvent: (event: EventItem) => void;
  savedEventIds: string[];
  userCoords: { lat: number; lng: number } | null;
}

export function ShowcaseSection({
  events,
  allUpcomingEvents,
  getDistance,
  onSelectEvent,
  onSaveEvent,
  savedEventIds,
  userCoords,
}: ShowcaseSectionProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isMap2DVisible, setIsMap2DVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Extract up to 3 featured events on top
  const featuredEvents = events.filter((e) => e.is_featured).slice(0, 3);
  // The rest (or all) of the events for normal pagination
  const standardEvents = events;

  // Numbered Pagination
  const totalPages = Math.ceil(standardEvents.length / pageSize) || 1;
  const paginatedEvents = standardEvents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Smooth scroll to showcase
      document.getElementById('showcase-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isEmpty = events.length === 0;

  return (
    <div id="showcase-section" className="w-full pt-4 space-y-8">
      {/* Top Header Controls: Count, View Mode Switch, View Map Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Upcoming Shows</span>
            <span className="text-sm font-semibold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {events.length} {events.length === 1 ? 'event' : 'events'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Independent live music & secret performances worldwide
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* View Map Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMap2DVisible(!isMap2DVisible)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isMap2DVisible
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/20'
                : 'glass-panel text-slate-300 hover:text-white hover:border-cyan-400/40'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>{isMap2DVisible ? 'Hide map' : 'View map'}</span>
          </button>

          {/* View Switch: Cards / Table */}
          <div className="inline-flex rounded-xl glass-panel p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'table'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Table View (Cards on mobile)"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Featured Slots (Up to 3 on top) if on first page and not empty */}
      {!isEmpty && currentPage === 1 && featuredEvents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Featured Spotlight</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredEvents.map((event) => (
              <EventCard
                key={`featured-${event.id}`}
                event={event}
                distanceKm={getDistance(event)}
                onSelect={onSelectEvent}
                onSave={onSaveEvent}
                isSaved={savedEventIds.includes(event.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {isEmpty ? (
        <div className="space-y-8">
          <div className="rounded-3xl glass-panel p-8 sm:p-12 text-center border border-white/15 max-w-2xl mx-auto space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto">
              <Compass className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                No shows found nearby right now
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Know an artist or venue near you? Invite them, it is free.
              </p>
            </div>

            {/* Call To Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/events/new"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-violet-600/30 hover:opacity-95 transition-all"
              >
                List a gig in 60 seconds
              </Link>
              <Link
                href="/for-artists"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-white hover:border-cyan-400/40 text-xs sm:text-sm font-medium transition-all"
              >
                <UserPlus className="w-4 h-4 text-cyan-400" />
                <span>Invite an Artist or Venue</span>
              </Link>
            </div>
          </div>

          {/* Fallback: Closest upcoming events worldwide */}
          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>Upcoming Live Events Worldwide</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {allUpcomingEvents.slice(0, 6).map((event) => (
                <EventCard
                  key={`fallback-${event.id}`}
                  event={event}
                  distanceKm={getDistance(event)}
                  onSelect={onSelectEvent}
                  onSave={onSaveEvent}
                  isSaved={savedEventIds.includes(event.id)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Results Container (Cards or Table) */
        <div className="space-y-8">
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {paginatedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  distanceKm={getDistance(event)}
                  onSelect={onSelectEvent}
                  onSave={onSaveEvent}
                  isSaved={savedEventIds.includes(event.id)}
                />
              ))}
            </div>
          ) : (
            <EventTable
              events={paginatedEvents}
              getDistance={getDistance}
              onSelect={onSelectEvent}
              onSave={onSaveEvent}
              savedEventIds={savedEventIds}
            />
          )}

          {/* Numbered Pagination (12 per page) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-xl glass-panel text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                    currentPage === pageNum
                      ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-600/30'
                      : 'glass-panel text-slate-300 hover:text-white hover:border-cyan-400/40'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl glass-panel text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Navigable 2D Map under showcase (toggled via View Map button) */}
      {isMap2DVisible && (
        <div className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-cyan-400" />
              <span>Interactive 2D Event Map</span>
            </h3>
            <span className="text-xs text-slate-400">
              Pins automatically reflect your active filters
            </span>
          </div>

          <Map2DSection
            events={events}
            onSelectEvent={onSelectEvent}
            userCoords={userCoords}
          />
        </div>
      )}
    </div>
  );
}
