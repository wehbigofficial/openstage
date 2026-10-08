'use client';

import { useEffect, useState } from 'react';
import { dict } from '@/lib/dictionary';
import { EventItem } from '@/lib/data/demoEvents';
import { getFutureEvents } from '@/lib/services/eventsService';
import { EventCard } from '@/components/EventCard';
import { EventPopupSheet } from '@/components/EventPopupSheet';
import { Compass, Music2 } from 'lucide-react';

export default function ExplorePage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    getFutureEvents()
      .then((data) => setEvents(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
          <Compass className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">{dict.nav.explore}</h1>
          <p className="text-sm text-slate-400">Discover all upcoming shows and gigs worldwide</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span>Loading gigs...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl glass-panel p-12 text-center border border-white/10">
          <Music2 className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            No published events found yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onSelect={setSelectedEvent}
            />
          ))}
        </div>
      )}

      <EventPopupSheet
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
