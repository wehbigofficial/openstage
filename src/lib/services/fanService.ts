import { createClient } from '@/lib/supabase/client';
import { getAllEvents, getFutureEvents } from './eventsService';
import { EventItem } from '@/lib/data/demoEvents';

export interface FanPreferences {
  city?: string;
  preferred_language?: 'it' | 'en';
  favorite_genres?: string[];
  email_consent_digest?: boolean;
  email_reminders_day_before?: boolean;
  email_reminders_morning_of?: boolean;
  email_marketing?: boolean;
}

export interface FanFollowItem {
  id: string;
  target_id: string;
  target_type: 'artist' | 'venue';
  target_name: string;
  created_at: string;
}

export interface FanReminderItem {
  id: string;
  event_id: string;
  remind_day_before: boolean;
  remind_morning_of: boolean;
  event?: EventItem;
}

/**
 * Fetch fan profile and notification preferences
 */
export async function getFanProfile(userId: string) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch {
    return null;
  }
}

/**
 * Update fan preferences (city, genres, email toggles)
 */
export async function updateFanPreferences(userId: string, prefs: FanPreferences) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .update(prefs)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all events saved by the fan
 */
export async function getFanSavedEvents(userId: string): Promise<EventItem[]> {
  try {
    const supabase = createClient();
    const { data: savedRows, error } = await supabase
      .from('fan_saved_events')
      .select('event_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !savedRows || savedRows.length === 0) {
      return [];
    }

    const allEvents = await getAllEvents();
    const savedIds = new Set(savedRows.map((r) => r.event_id));

    return allEvents.filter((e) => savedIds.has(e.id));
  } catch {
    return [];
  }
}

/**
 * Toggle save / unsave event for fan
 */
export async function toggleFanSaveEvent(userId: string, eventId: string): Promise<boolean> {
  const supabase = createClient();

  // Check if already saved
  const { data: existing } = await supabase
    .from('fan_saved_events')
    .select('id')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .maybeSingle();

  if (existing) {
    // Unsave
    await supabase.from('fan_saved_events').delete().eq('id', existing.id);
    return false;
  } else {
    // Save
    await supabase.from('fan_saved_events').insert({
      user_id: userId,
      event_id: eventId,
    });

    // Increment event saves count
    fetch('/api/events/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, stat_type: 'save' }),
    }).catch(() => {});

    return true;
  }
}

/**
 * Get active fan reminders with attached event info
 */
export async function getFanReminders(userId: string): Promise<FanReminderItem[]> {
  try {
    const supabase = createClient();
    const { data: rows, error } = await supabase
      .from('fan_event_reminders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !rows || rows.length === 0) {
      return [];
    }

    const allEvents = await getAllEvents();
    const eventMap = new Map(allEvents.map((e) => [e.id, e]));

    return rows.map((r: any) => ({
      id: r.id,
      event_id: r.event_id,
      remind_day_before: r.remind_day_before,
      remind_morning_of: r.remind_morning_of,
      event: eventMap.get(r.event_id),
    })).filter((r: any) => !!r.event);
  } catch {
    return [];
  }
}

/**
 * Toggle or update reminder for an event
 */
export async function toggleFanReminder(
  userId: string,
  eventId: string,
  options?: { remindDayBefore?: boolean; remindMorningOf?: boolean }
): Promise<{ active: boolean; reminder?: any }> {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from('fan_event_reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .maybeSingle();

  if (existing && !options) {
    // Remove reminder
    await supabase.from('fan_event_reminders').delete().eq('id', existing.id);
    return { active: false };
  } else if (existing && options) {
    // Update preferences for reminder
    const { data: updated } = await supabase
      .from('fan_event_reminders')
      .update({
        remind_day_before: options.remindDayBefore ?? existing.remind_day_before,
        remind_morning_of: options.remindMorningOf ?? existing.remind_morning_of,
      })
      .eq('id', existing.id)
      .select()
      .single();

    return { active: true, reminder: updated };
  } else {
    // Create new reminder
    const { data: inserted } = await supabase
      .from('fan_event_reminders')
      .insert({
        user_id: userId,
        event_id: eventId,
        remind_day_before: options?.remindDayBefore ?? true,
        remind_morning_of: options?.remindMorningOf ?? true,
      })
      .select()
      .single();

    return { active: true, reminder: inserted };
  }
}

/**
 * Get list of artists and venues followed by the fan
 */
export async function getFanFollows(userId: string): Promise<FanFollowItem[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('fan_follows')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * Toggle following an artist or venue
 */
export async function toggleFanFollow(
  userId: string,
  targetId: string,
  targetType: 'artist' | 'venue',
  targetName: string
): Promise<boolean> {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from('fan_follows')
    .select('id')
    .eq('user_id', userId)
    .eq('target_id', targetId)
    .maybeSingle();

  if (existing) {
    await supabase.from('fan_follows').delete().eq('id', existing.id);
    return false;
  } else {
    await supabase.from('fan_follows').insert({
      user_id: userId,
      target_id: targetId,
      target_type: targetType,
      target_name: targetName,
    });
    return true;
  }
}

/**
 * Get personalized "For you" recommendations for a fan
 * Matches city + favorite genres, plus followed acts' future shows
 */
export async function getFanRecommendations(
  userId: string,
  userCity?: string,
  userGenres?: string[]
): Promise<{ recommended: EventItem[]; nearCity: EventItem[]; byGenre: EventItem[] }> {
  const futureEvents = await getFutureEvents();

  const normCity = userCity?.trim().toLowerCase();
  const genresSet = new Set((userGenres || []).map((g) => g.toLowerCase()));

  const nearCity: EventItem[] = [];
  const byGenre: EventItem[] = [];
  const recommendedSet = new Set<string>();
  const recommended: EventItem[] = [];

  for (const evt of futureEvents) {
    const evtCity = (evt.city || '').toLowerCase();
    const evtGenre = (evt.genre || '').toLowerCase();

    const matchesCity = normCity ? evtCity.includes(normCity) || normCity.includes(evtCity) : false;
    const matchesGenre = genresSet.size > 0 ? genresSet.has(evtGenre) : false;

    if (matchesCity) {
      nearCity.push(evt);
    }
    if (matchesGenre) {
      byGenre.push(evt);
    }

    // High recommendation: matches both, or matches city, or matches genre
    if (matchesCity && matchesGenre) {
      if (!recommendedSet.has(evt.id)) {
        recommendedSet.add(evt.id);
        recommended.unshift(evt); // Prioritize top match
      }
    } else if (matchesCity || matchesGenre) {
      if (!recommendedSet.has(evt.id)) {
        recommendedSet.add(evt.id);
        recommended.push(evt);
      }
    }
  }

  // If not enough recommendations, fill with featured or soonest upcoming events
  if (recommended.length < 4) {
    for (const evt of futureEvents) {
      if (!recommendedSet.has(evt.id)) {
        recommendedSet.add(evt.id);
        recommended.push(evt);
        if (recommended.length >= 8) break;
      }
    }
  }

  return { recommended, nearCity, byGenre };
}
