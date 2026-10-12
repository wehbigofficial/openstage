'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { EventItem } from '@/lib/data/demoEvents';
import { getFutureEvents, getPlatformStats, calculateDistanceKm } from '@/lib/services/eventsService';
import { SearchAndFilters, FilterState } from '@/components/SearchAndFilters';
import { ShowcaseSection } from '@/components/ShowcaseSection';
import { BentoGridSection } from '@/components/BentoGridSection';
import { EventPopupSheet } from '@/components/EventPopupSheet';
import { QuickAuthModal } from '@/components/QuickAuthModal';
import { matchesQuickTimeFilter } from '@/lib/utils/eventTime';
import { Sparkles, Radio } from 'lucide-react';

// Dynamic import for WebGL MapLibre components to prevent SSR canvas issues
const GlobeHero = dynamic(
  () => import('@/components/GlobeHero').then((mod) => mod.GlobeHero),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] sm:h-[620px] rounded-3xl glass-panel border border-white/10 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Initializing 3D Live Globe...</span>
      </div>
    ),
  }
);

export default function HomePage() {
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ artistsCount: 120, eventsCount: 30, citiesCount: 25 });
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);
  const [quickAuthOpen, setQuickAuthOpen] = useState(false);
  const [globeReady, setGlobeReady] = useState(false);

  // User precise geolocation (only asked when user taps "Near me")
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    query: '',
    quickTime: null,
    city: null,
    radiusKm: null,
    startDate: null,
    endDate: null,
    genre: null,
    eventType: null,
    priceFilter: 'all',
    emergingOnly: false,
    sortBy: 'soonest',
  });

  // Load events and stats
  useEffect(() => {
    async function loadData() {
      try {
        const [eventsData, statsData] = await Promise.all([
          getFutureEvents(),
          getPlatformStats(),
        ]);
        setAllEvents(eventsData);
        setStats(statsData);
      } catch (err) {
        console.error('Error loading events:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Load saved events from localStorage
    try {
      const saved = localStorage.getItem('openstage_saved_events');
      if (saved) {
        setSavedEventIds(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Defer heavy MapLibre WebGL globe execution until browser is idle or user interacts
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let idleTimer: NodeJS.Timeout;

    const triggerGlobe = () => {
      setGlobeReady(true);
      removeListeners();
    };

    const removeListeners = () => {
      window.removeEventListener('scroll', triggerGlobe);
      window.removeEventListener('touchstart', triggerGlobe);
      window.removeEventListener('mousemove', triggerGlobe);
      window.removeEventListener('click', triggerGlobe);
      if (idleTimer) clearTimeout(idleTimer);
    };

    window.addEventListener('scroll', triggerGlobe, { once: true, passive: true });
    window.addEventListener('touchstart', triggerGlobe, { once: true, passive: true });
    window.addEventListener('mousemove', triggerGlobe, { once: true, passive: true });
    window.addEventListener('click', triggerGlobe, { once: true, passive: true });

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        idleTimer = setTimeout(triggerGlobe, 3000);
      }, { timeout: 6000 });
    } else {
      idleTimer = setTimeout(triggerGlobe, 3500);
    }

    return removeListeners;
  }, []);

  // Near me button click handler: ask browser for precise geolocation
  const handleNearMeClick = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserCoords(coords);
        setIsLocating(false);

        // Update filters to sort by nearest and enable radius
        setFilters((prev) => ({
          ...prev,
          radiusKm: prev.radiusKm || 100,
          sortBy: 'nearest',
        }));
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err);
        setIsLocating(false);
        alert('Could not retrieve your precise location. Check your browser permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Distance calculator helper
  const getDistance = useCallback((event: EventItem): number | null => {
    if (!userCoords) return null;
    return calculateDistanceKm(userCoords.lat, userCoords.lng, event.lat, event.lng);
  }, [userCoords]);

  // Toggle save event
  const handleSaveEvent = useCallback((event: EventItem) => {
    setSavedEventIds((prev) => {
      const exists = prev.includes(event.id);
      const updated = exists ? prev.filter((id) => id !== event.id) : [...prev, event.id];
      try {
        localStorage.setItem('openstage_saved_events', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  const handleSelectEvent = useCallback((event: EventItem) => {
    setSelectedEvent(event);
  }, []);

  const handleClosePopup = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  // Filter & Sort logic
  const filteredEvents = useMemo(() => {
    let result = [...allEvents];

    // 1. Text Search (title, artist, venue, city, genre)
    if (filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.artist_name.toLowerCase().includes(q) ||
          e.venue_name.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q) ||
          e.genre.toLowerCase().includes(q)
      );
    }

    // 2. Quick Time Filter (tonight, this_weekend, this_week, next_30_days in event timezone)
    if (filters.quickTime) {
      result = result.filter((e) =>
        matchesQuickTimeFilter(e.starts_at, e.timezone, filters.quickTime!)
      );
    }

    // 3. City & Radius filter
    if (filters.city) {
      const cityLower = filters.city.toLowerCase().trim();
      result = result.filter((e) => e.city.toLowerCase().includes(cityLower));
    }

    if (filters.radiusKm && userCoords) {
      result = result.filter((e) => {
        const d = calculateDistanceKm(userCoords.lat, userCoords.lng, e.lat, e.lng);
        return d <= filters.radiusKm!;
      });
    }

    // 4. Custom date range
    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      result = result.filter((e) => new Date(e.starts_at).getTime() >= start);
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime();
      result = result.filter((e) => new Date(e.starts_at).getTime() <= end);
    }

    // 5. Genre filter
    if (filters.genre) {
      result = result.filter(
        (e) => e.genre.toLowerCase() === filters.genre!.toLowerCase()
      );
    }

    // 6. Event Type filter
    if (filters.eventType) {
      result = result.filter((e) => e.event_type === filters.eventType);
    }

    // 7. Price filter (free or paid)
    if (filters.priceFilter === 'free') {
      result = result.filter((e) => e.is_free);
    } else if (filters.priceFilter === 'paid') {
      result = result.filter((e) => !e.is_free);
    }

    // 8. Emerging artists filter
    if (filters.emergingOnly) {
      result = result.filter((e) => e.is_emerging);
    }

    // 9. Sorting
    result.sort((a, b) => {
      if (filters.sortBy === 'nearest' && userCoords) {
        const distA = calculateDistanceKm(userCoords.lat, userCoords.lng, a.lat, a.lng);
        const distB = calculateDistanceKm(userCoords.lat, userCoords.lng, b.lat, b.lng);
        return distA - distB;
      }

      if (filters.sortBy === 'popular') {
        // Featured events first, then soonest
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
      }

      if (filters.sortBy === 'newest') {
        const createdA = new Date(a.created_at || a.starts_at).getTime();
        const createdB = new Date(b.created_at || b.starts_at).getTime();
        return createdB - createdA;
      }

      // Default: soonest date first
      return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
    });

    return result;
  }, [allEvents, filters, userCoords]);

  return (
    <div className="relative isolate px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 sm:space-y-16 pt-6 sm:pt-10">
      {/* Background glow effects */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 pointer-events-none">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#8B5CF6] to-[#22D3EE] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      {/* Hero Headline */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-xs text-cyan-400 border border-cyan-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Independent Live Music Discovery</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Discover Live Music.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400">
            Independent & Worldwide.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
          Explore upcoming gigs, secret shows, and independent live performances worldwide on an interactive 3D globe.
        </p>
      </div>

      {/* 1. HERO GLOBE 3D */}
      <section className="w-full">
        {globeReady ? (
          <GlobeHero
            events={filteredEvents}
            onSelectEvent={handleSelectEvent}
            selectedEventId={selectedEvent?.id}
            onNearMeClick={handleNearMeClick}
            userCoords={userCoords}
          />
        ) : (
          <div
            onClick={() => setGlobeReady(true)}
            className="w-full h-[500px] sm:h-[620px] rounded-3xl glass-panel border border-white/10 flex flex-col items-center justify-center text-slate-400 gap-3 cursor-pointer group hover:border-cyan-500/30 transition-all"
            title="Tocca per caricare il globo 3D"
          >
            <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-slate-300">Initializing 3D Live Globe...</span>
            <span className="text-xs text-slate-500 group-hover:text-cyan-400 transition-colors">Tocca per attivare subito</span>
          </div>
        )}
      </section>

      {/* 2. SEARCH AND FILTERS (directly under globe) */}
      <section className="w-full">
        <SearchAndFilters
          events={allEvents}
          filters={filters}
          onChangeFilters={setFilters}
          onNearMeClick={handleNearMeClick}
          userCoords={userCoords}
          isLocating={isLocating}
        />
      </section>

      {/* 3. SHOWCASE RESULTS & 2D MAP TOGGLE & EMPTY STATES */}
      <section className="w-full">
        <ShowcaseSection
          events={filteredEvents}
          allUpcomingEvents={allEvents}
          getDistance={getDistance}
          onSelectEvent={handleSelectEvent}
          onSaveEvent={handleSaveEvent}
          savedEventIds={savedEventIds}
          userCoords={userCoords}
        />
      </section>

      {/* 4. BELOW THE SHOWCASE: Scroll-reveal Bento Grid */}
      <BentoGridSection stats={stats} />

      {/* Modal / Bottom Sheet for pin or card click */}
      <EventPopupSheet
        event={selectedEvent}
        onClose={handleClosePopup}
        onSave={handleSaveEvent}
        isSaved={selectedEvent ? savedEventIds.includes(selectedEvent.id) : false}
      />

      {/* Quick Auth Modal */}
      <QuickAuthModal
        isOpen={quickAuthOpen}
        onClose={() => setQuickAuthOpen(false)}
      />
    </div>
  );
}
