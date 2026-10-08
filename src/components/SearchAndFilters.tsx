'use client';

import { useState, useEffect, useRef } from 'react';
import { EventItem } from '@/lib/data/demoEvents';
import {
  Search,
  Navigation,
  Clock,
  MapPin,
  Music,
  Building,
  Calendar,
  SlidersHorizontal,
  X,
  Sparkles,
  ChevronDown,
  Tag,
  Radio,
} from 'lucide-react';

export interface FilterState {
  query: string;
  quickTime: 'tonight' | 'this_weekend' | 'this_week' | 'next_30_days' | null;
  city: string | null;
  radiusKm: number | null;
  startDate: string | null;
  endDate: string | null;
  genre: string | null;
  eventType: string | null;
  priceFilter: 'all' | 'free' | 'paid';
  emergingOnly: boolean;
  sortBy: 'soonest' | 'nearest' | 'popular' | 'newest';
}

interface SearchAndFiltersProps {
  events: EventItem[];
  filters: FilterState;
  onChangeFilters: (filters: FilterState) => void;
  onNearMeClick: () => void;
  userCoords: { lat: number; lng: number } | null;
  isLocating?: boolean;
}

interface SuggestionGroup {
  category: 'near_me' | 'recent' | 'city' | 'artist' | 'venue' | 'event' | 'genre';
  label: string;
  icon: any;
  items: Array<{
    id: string;
    text: string;
    subtext?: string;
    payload?: any;
  }>;
}

export function SearchAndFilters({
  events,
  filters,
  onChangeFilters,
  onNearMeClick,
  userCoords,
  isLocating = false,
}: SearchAndFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(filters.query || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<Array<{ name: string; lat: number; lng: number }>>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('openstage_recent_searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      }
    } catch {
      // Ignore storage error
    }
  }, []);

  const saveRecentSearch = (text: string) => {
    if (!text.trim()) return;
    try {
      const updated = [text, ...recentSearches.filter((s) => s.toLowerCase() !== text.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('openstage_recent_searches', JSON.stringify(updated));
    } catch {
      // Ignore storage error
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch geocoded city suggestions when typing
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setCitySuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      fetch(`/api/geocode?q=${encodeURIComponent(searchTerm.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.results)) {
            setCitySuggestions(data.results);
          }
        })
        .catch(() => {
          setCitySuggestions([]);
        });
    }, 280);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Extract distinct genres from dataset
  const availableGenres = Array.from(new Set(events.map((e) => e.genre).filter(Boolean)));
  const eventTypes = ['concert', 'club night', 'festival', 'party', 'open mic', 'other'];

  // Build live suggestion groups
  const queryLower = searchTerm.toLowerCase().trim();

  // Match items from events dataset
  const matchedArtists = Array.from(
    new Set(
      events
        .map((e) => e.artist_name)
        .filter((a) => a && (queryLower.length === 0 || a.toLowerCase().includes(queryLower)))
    )
  ).slice(0, 3);

  const matchedVenues = Array.from(
    new Set(
      events
        .map((e) => `${e.venue_name} (${e.city})`)
        .filter((v) => v && (queryLower.length === 0 || v.toLowerCase().includes(queryLower)))
    )
  ).slice(0, 3);

  const matchedEvents = events
    .filter((e) => queryLower.length > 0 && e.title.toLowerCase().includes(queryLower))
    .slice(0, 3);

  const matchedGenres = availableGenres
    .filter((g) => queryLower.length === 0 || g.toLowerCase().includes(queryLower))
    .slice(0, 3);

  const handleSelectRecent = (query: string) => {
    setSearchTerm(query);
    onChangeFilters({ ...filters, query });
    setIsDropdownOpen(false);
  };

  const handleSelectCity = (cityName: string) => {
    saveRecentSearch(cityName);
    setSearchTerm(cityName);
    onChangeFilters({
      ...filters,
      query: cityName,
      city: cityName,
      radiusKm: filters.radiusKm || 50,
    });
    setIsDropdownOpen(false);
  };

  const handleSelectArtist = (artistName: string) => {
    saveRecentSearch(artistName);
    setSearchTerm(artistName);
    onChangeFilters({ ...filters, query: artistName });
    setIsDropdownOpen(false);
  };

  const handleSelectGenre = (genre: string) => {
    saveRecentSearch(genre);
    onChangeFilters({ ...filters, genre: filters.genre === genre ? null : genre });
    setIsDropdownOpen(false);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    onChangeFilters({ ...filters, query: '', city: null });
  };

  const handleQuickTimeToggle = (type: FilterState['quickTime']) => {
    onChangeFilters({
      ...filters,
      quickTime: filters.quickTime === type ? null : type,
    });
  };

  return (
    <div className="w-full space-y-4">
      {/* Big Search Bar + Near Me Button */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          {/* Input container */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5 text-cyan-400" />
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                onChangeFilters({ ...filters, query: e.target.value });
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Search cities, artists, venues, genres, or secret gigs..."
              className="w-full pl-12 pr-10 py-4 rounded-2xl bg-[#0F0F1A]/90 border border-white/15 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-base backdrop-blur-xl shadow-xl transition-all"
            />

            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Near Me prominent Button */}
          <button
            type="button"
            onClick={onNearMeClick}
            disabled={isLocating}
            className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold text-sm transition-all shadow-lg shrink-0 ${
              userCoords
                ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300'
                : 'bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-95 text-white shadow-cyan-500/20 active:scale-95'
            }`}
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : userCoords ? 'Near Me (Active)' : 'Near Me'}</span>
          </button>

          {/* Toggle Filters Button */}
          <button
            type="button"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border text-sm font-semibold transition-all shadow-lg shrink-0 ${
              isFiltersOpen || filters.genre || filters.eventType || filters.priceFilter !== 'all' || filters.emergingOnly
                ? 'bg-violet-600/30 border-violet-400 text-violet-200'
                : 'glass-panel text-slate-300 hover:text-white hover:border-white/30'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Live Suggestions Dropdown (Grouped by Category + Recent) */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-[#0F0F1A]/95 border border-white/15 backdrop-blur-2xl shadow-2xl z-40 max-h-[420px] overflow-y-auto divide-y divide-white/5 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* 1. Near Me Suggestion (First suggestion rule) */}
            <div className="p-2">
              <button
                type="button"
                onClick={() => {
                  onNearMeClick();
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-cyan-500/10 text-cyan-300 transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    Near me
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                      Auto-detect
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Find shows happening closest to your current physical location
                  </div>
                </div>
              </button>
            </div>

            {/* 2. Recent Searches */}
            {recentSearches.length > 0 && queryLower.length === 0 && (
              <div className="p-3">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Recent Searches</span>
                </div>
                <div className="flex flex-wrap gap-1.5 px-2">
                  {recentSearches.map((rec) => (
                    <button
                      key={rec}
                      onClick={() => handleSelectRecent(rec)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10 transition-colors"
                    >
                      {rec}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Cities / Places (from Geocoding) */}
            {citySuggestions.length > 0 && (
              <div className="p-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Cities & Places</span>
                </div>
                {citySuggestions.map((city, idx) => (
                  <button
                    key={`${city.name}-${idx}`}
                    type="button"
                    onClick={() => handleSelectCity(city.name)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-200 hover:text-white transition-colors text-left text-sm"
                  >
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="truncate">{city.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 4. Artists */}
            {matchedArtists.length > 0 && (
              <div className="p-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-pink-400" />
                  <span>Artists</span>
                </div>
                {matchedArtists.map((artist) => (
                  <button
                    key={artist}
                    type="button"
                    onClick={() => handleSelectArtist(artist)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-200 hover:text-white transition-colors text-left text-sm"
                  >
                    <Music className="w-4 h-4 text-pink-400 shrink-0" />
                    <span className="truncate font-medium">{artist}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 5. Venues */}
            {matchedVenues.length > 0 && (
              <div className="p-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-400" />
                  <span>Venues</span>
                </div>
                {matchedVenues.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleSelectRecent(v)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-200 hover:text-white transition-colors text-left text-sm"
                  >
                    <Building className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">{v}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 6. Genres */}
            {matchedGenres.length > 0 && (
              <div className="p-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-violet-400" />
                  <span>Genres</span>
                </div>
                <div className="flex flex-wrap gap-1.5 px-3 py-1">
                  {matchedGenres.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleSelectGenre(g)}
                      className="px-2.5 py-1 rounded-full text-xs bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/40 transition-colors"
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Time Buttons (computed in event timezone) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs text-slate-400 shrink-0 font-medium hidden sm:inline">
          When:
        </span>

        <button
          type="button"
          onClick={() => handleQuickTimeToggle('tonight')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
            filters.quickTime === 'tonight'
              ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/25'
              : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-white/20'
          }`}
        >
          Tonight
        </button>

        <button
          type="button"
          onClick={() => handleQuickTimeToggle('this_weekend')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
            filters.quickTime === 'this_weekend'
              ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/25'
              : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-white/20'
          }`}
        >
          This weekend
        </button>

        <button
          type="button"
          onClick={() => handleQuickTimeToggle('this_week')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
            filters.quickTime === 'this_week'
              ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/25'
              : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-white/20'
          }`}
        >
          This week
        </button>

        <button
          type="button"
          onClick={() => handleQuickTimeToggle('next_30_days')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
            filters.quickTime === 'next_30_days'
              ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/25'
              : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-white/20'
          }`}
        >
          Next 30 days
        </button>

        {/* Clear active quick time */}
        {filters.quickTime && (
          <button
            type="button"
            onClick={() => onChangeFilters({ ...filters, quickTime: null })}
            className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
            title="Clear date filter"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Expanded Filters Drawer */}
      {isFiltersOpen && (
        <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/15 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <span>Filter Events</span>
            </h4>
            <button
              type="button"
              onClick={() =>
                onChangeFilters({
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
                })
              }
              className="text-xs text-slate-400 hover:text-cyan-300 transition-colors"
            >
              Reset all filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Radius (if city or near me is active) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Radius (km)
              </label>
              <select
                value={filters.radiusKm || ''}
                onChange={(e) =>
                  onChangeFilters({
                    ...filters,
                    radiusKm: e.target.value ? parseInt(e.target.value, 10) : null,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="" className="bg-[#0F0F1A]">Any distance</option>
                <option value="15" className="bg-[#0F0F1A]">15 km</option>
                <option value="30" className="bg-[#0F0F1A]">30 km</option>
                <option value="50" className="bg-[#0F0F1A]">50 km</option>
                <option value="100" className="bg-[#0F0F1A]">100 km</option>
                <option value="250" className="bg-[#0F0F1A]">250 km</option>
              </select>
            </div>

            {/* Genre */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Genre
              </label>
              <select
                value={filters.genre || ''}
                onChange={(e) =>
                  onChangeFilters({
                    ...filters,
                    genre: e.target.value || null,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="" className="bg-[#0F0F1A]">All genres</option>
                {availableGenres.map((g) => (
                  <option key={g} value={g} className="bg-[#0F0F1A]">
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Event Type
              </label>
              <select
                value={filters.eventType || ''}
                onChange={(e) =>
                  onChangeFilters({
                    ...filters,
                    eventType: e.target.value || null,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400 capitalize"
              >
                <option value="" className="bg-[#0F0F1A]">All event types</option>
                {eventTypes.map((t) => (
                  <option key={t} value={t} className="bg-[#0F0F1A] capitalize">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Free or Paid */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admission
              </label>
              <select
                value={filters.priceFilter}
                onChange={(e) =>
                  onChangeFilters({
                    ...filters,
                    priceFilter: e.target.value as FilterState['priceFilter'],
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="all" className="bg-[#0F0F1A]">Free & Paid</option>
                <option value="free" className="bg-[#0F0F1A]">Free only</option>
                <option value="paid" className="bg-[#0F0F1A]">Paid only</option>
              </select>
            </div>
          </div>

          {/* Secondary filter row: Date range + Emerging artists + Sort */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/10">
            {/* Custom Date Range */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Starting from date
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) =>
                  onChangeFilters({ ...filters, startDate: e.target.value || null })
                }
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Emerging Artists Toggle */}
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-cyan-500/30 transition-colors">
                <input
                  type="checkbox"
                  checked={filters.emergingOnly}
                  onChange={(e) =>
                    onChangeFilters({ ...filters, emergingOnly: e.target.checked })
                  }
                  className="rounded text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-200">
                  Emerging artists only
                </span>
              </label>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Sort by
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  onChangeFilters({
                    ...filters,
                    sortBy: e.target.value as FilterState['sortBy'],
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="soonest" className="bg-[#0F0F1A]">Soonest date</option>
                <option value="nearest" className="bg-[#0F0F1A]" disabled={!userCoords}>
                  Nearest distance {!userCoords ? '(tap Near me first)' : ''}
                </option>
                <option value="popular" className="bg-[#0F0F1A]">Popular / Featured</option>
                <option value="newest" className="bg-[#0F0F1A]">Recently posted</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
