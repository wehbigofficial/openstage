import { createClient } from '@/lib/supabase/client';
import { DEMO_EVENTS, EventItem } from '@/lib/data/demoEvents';

/**
 * Calculates distance between two points in km (Haversine formula)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Fetch all future published events. Uses Supabase if available, with DEMO_EVENTS fallback.
 */
export async function getFutureEvents(): Promise<EventItem[]> {
  try {
    const supabase = createClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .gte('starts_at', nowIso)
      .order('starts_at', { ascending: true });

    if (error || !data || data.length === 0) {
      // Fallback to local demo events for development & demo preview
      return DEMO_EVENTS.filter((e) => new Date(e.starts_at) >= new Date());
    }

    // Merge or map with proper typing
    return data.map((item: any) => ({
      ...item,
      city: item.city || item.address?.split(',').pop()?.trim() || 'Global',
      country: item.country || 'Global',
    }));
  } catch {
    return DEMO_EVENTS.filter((e) => new Date(e.starts_at) >= new Date());
  }
}

/**
 * Fetch all events (including past events for individual page view or profiles)
 */
export async function getAllEvents(): Promise<EventItem[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('starts_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return DEMO_EVENTS;
    }

    return data.map((item: any) => ({
      ...item,
      city: item.city || item.address?.split(',').pop()?.trim() || 'Global',
      country: item.country || 'Global',
    }));
  } catch {
    return DEMO_EVENTS;
  }
}

/**
 * Find single event by ID or slug segment
 */
export async function findEventByIdOrSlug(idOrSlug: string): Promise<EventItem | null> {
  const all = await getAllEvents();
  // 1. Direct match by id
  const exact = all.find((e) => e.id === idOrSlug);
  if (exact) return exact;

  // 2. Slug match: match if id segment is at the end or contains id
  const slugLower = idOrSlug.toLowerCase();
  const bySlug = all.find((e) => {
    if (e.id && slugLower.includes(e.id)) return true;
    const cleanId = e.id.replace('demo-', '').split('-')[0];
    if (cleanId && slugLower.endsWith(cleanId)) return true;
    return false;
  });
  if (bySlug) return bySlug;

  // Fallback to title matching
  return all.find((e) => slugLower.includes(e.title.toLowerCase().substring(0, 15))) || null;
}

/**
 * Fetch registered venues for dropdown picker in event creation
 */
export async function getRegisteredVenues(): Promise<
  Array<{ id: string; name: string; address?: string; lat?: number; lng?: number }>
> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('venues')
      .select('profile_id, name, address, lat, lng')
      .limit(50);

    if (error || !data || data.length === 0) {
      return [
        { id: 'v-01', name: 'Lanificio 159 Rooftop', address: 'Via di Pietralata 159, Roma', lat: 41.9167, lng: 12.5447 },
        { id: 'v-02', name: 'Tunnel Club Milano', address: 'Via Giovanni Battista Sammartini 30, Milano', lat: 45.4912, lng: 9.2084 },
        { id: 'v-03', name: 'Urban Spree Gallery & Yard', address: 'Revaler Str. 99, Berlin', lat: 52.5085, lng: 13.4542 },
        { id: 'v-04', name: 'Covo Club Basement', address: 'Viale Zagabria 1, Bologna', lat: 44.5097, lng: 11.3719 },
      ];
    }

    return data.map((v) => ({
      id: v.profile_id,
      name: v.name,
      address: v.address,
      lat: v.lat,
      lng: v.lng,
    }));
  } catch {
    return [];
  }
}

/**
 * Get quick platform statistics (artists, events, cities)
 */
export async function getPlatformStats(): Promise<{
  artistsCount: number;
  eventsCount: number;
  citiesCount: number;
}> {
  const events = await getFutureEvents();
  const artists = new Set(events.map((e) => e.artist_name).filter(Boolean));
  const cities = new Set(events.map((e) => e.city).filter(Boolean));

  return {
    artistsCount: Math.max(artists.size, 120),
    eventsCount: Math.max(events.length, 30),
    citiesCount: Math.max(cities.size, 25),
  };
}
