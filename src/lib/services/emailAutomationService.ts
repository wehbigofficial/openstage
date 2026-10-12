import { createAdminClient } from '@/lib/supabase/admin';
import { enqueueEmail } from '@/lib/email/queue';
import { formatEventDateTime } from '@/lib/utils/eventTime';
import { getAllEvents } from './eventsService';

/**
 * 1. Event reminders dispatcher:
 * - Day before reminder: events starting in 24-48 hours
 * - Morning of reminder: events starting today within next 14 hours
 */
export async function dispatchDailyReminders(): Promise<{
  dayBeforeSent: number;
  morningOfSent: number;
}> {
  const supabase = createAdminClient();
  const now = new Date();

  const tomorrowStart = new Date(now.getTime() + 20 * 60 * 60 * 1000).toISOString();
  const tomorrowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

  const todayStart = now.toISOString();
  const todayEnd = new Date(now.getTime() + 14 * 60 * 60 * 1000).toISOString();

  let dayBeforeCount = 0;
  let morningOfCount = 0;

  // 1A. Fetch Day Before reminders
  const { data: dayBeforeRows } = await supabase
    .from('fan_event_reminders')
    .select(`
      id,
      user_id,
      event_id,
      remind_day_before,
      day_before_sent_at,
      profiles!user_id(display_name, preferred_language),
      events!event_id(id, title, artist_name, venue_name, address, starts_at, timezone)
    `)
    .eq('remind_day_before', true)
    .is('day_before_sent_at', null);

  if (dayBeforeRows && dayBeforeRows.length > 0) {
    for (const row of dayBeforeRows as any[]) {
      const evt = row.events;
      if (!evt || !evt.starts_at) continue;

      const evtTime = new Date(evt.starts_at).getTime();
      const inRange =
        evtTime >= new Date(tomorrowStart).getTime() &&
        evtTime <= new Date(tomorrowEnd).getTime();

      if (inRange) {
        const { data: userAuth } = await supabase.auth.admin.getUserById(row.user_id);
        const toEmail = userAuth?.user?.email;
        if (!toEmail) continue;

        const lang = row.profiles?.preferred_language === 'en' ? 'en' : 'it';
        const { fullStr } = formatEventDateTime(evt.starts_at, evt.timezone);

        await enqueueEmail({
          userId: row.user_id,
          toEmail,
          template: 'event_reminder',
          category: 'reminder',
          subject:
            lang === 'en'
              ? `Reminder: ${evt.artist_name || evt.title} live tomorrow!`
              : `Promemoria: Domani sera c'è ${evt.artist_name || evt.title} dal vivo!`,
          data: {
            timing: 'day_before',
            eventTitle: evt.title,
            artistName: evt.artist_name || 'Artista',
            venueName: evt.venue_name || 'OpenStage Venue',
            address: evt.address || '',
            eventDate: fullStr,
            eventUrl: `https://openstage.it/events/${evt.id}`,
            locale: lang,
          },
          locale: lang,
          idempotencyKey: `remind-daybefore-${row.id}-${evt.id}`,
        });

        await supabase
          .from('fan_event_reminders')
          .update({ day_before_sent_at: new Date().toISOString() })
          .eq('id', row.id);

        dayBeforeCount += 1;
      }
    }
  }

  // 1B. Fetch Morning Of reminders
  const { data: morningRows } = await supabase
    .from('fan_event_reminders')
    .select(`
      id,
      user_id,
      event_id,
      remind_morning_of,
      morning_of_sent_at,
      profiles!user_id(display_name, preferred_language),
      events!event_id(id, title, artist_name, venue_name, address, starts_at, timezone)
    `)
    .eq('remind_morning_of', true)
    .is('morning_of_sent_at', null);

  if (morningRows && morningRows.length > 0) {
    for (const row of morningRows as any[]) {
      const evt = row.events;
      if (!evt || !evt.starts_at) continue;

      const evtTime = new Date(evt.starts_at).getTime();
      const inRange =
        evtTime >= new Date(todayStart).getTime() &&
        evtTime <= new Date(todayEnd).getTime();

      if (inRange) {
        const { data: userAuth } = await supabase.auth.admin.getUserById(row.user_id);
        const toEmail = userAuth?.user?.email;
        if (!toEmail) continue;

        const lang = row.profiles?.preferred_language === 'en' ? 'en' : 'it';
        const { fullStr } = formatEventDateTime(evt.starts_at, evt.timezone);

        await enqueueEmail({
          userId: row.user_id,
          toEmail,
          template: 'event_reminder',
          category: 'reminder',
          subject:
            lang === 'en'
              ? `Tonight: ${evt.artist_name || evt.title} goes live!`
              : `Stasera: ${evt.artist_name || evt.title} dal vivo!`,
          data: {
            timing: 'morning_of',
            eventTitle: evt.title,
            artistName: evt.artist_name || 'Artista',
            venueName: evt.venue_name || 'OpenStage Venue',
            address: evt.address || '',
            eventDate: fullStr,
            eventUrl: `https://openstage.it/events/${evt.id}`,
            locale: lang,
          },
          locale: lang,
          idempotencyKey: `remind-morningof-${row.id}-${evt.id}`,
        });

        await supabase
          .from('fan_event_reminders')
          .update({ morning_of_sent_at: new Date().toISOString() })
          .eq('id', row.id);

        morningOfCount += 1;
      }
    }
  }

  return { dayBeforeSent: dayBeforeCount, morningOfSent: morningOfCount };
}

/**
 * 2. Weekly digest dispatcher:
 * - Shares a single batch_id across mass send
 * - Only for consented fans (email_consent_digest = true)
 * - Frequency capped: max 1 per week
 */
export async function dispatchWeeklyDigest(): Promise<{ sentCount: number; batchId: string }> {
  const supabase = createAdminClient();
  const batchId = `digest-batch-${new Date().toISOString().split('T')[0]}`;

  // Fetch consented fans
  const { data: consentedFans } = await supabase
    .from('profiles')
    .select('id, display_name, city, preferred_language')
    .eq('email_consent_digest', true)
    .eq('is_suppressed', false);

  if (!consentedFans || consentedFans.length === 0) {
    return { sentCount: 0, batchId };
  }

  const allEvents = await getAllEvents();
  const futureEvents = allEvents.filter((e) => new Date(e.starts_at) >= new Date());
  let count = 0;

  for (const fan of consentedFans) {
    const { data: userAuth } = await supabase.auth.admin.getUserById(fan.id);
    const toEmail = userAuth?.user?.email;
    if (!toEmail) continue;

    // Followed acts for this fan
    const { data: follows } = await supabase
      .from('fan_follows')
      .select('target_id, target_name')
      .eq('user_id', fan.id);

    const followedNames = new Set((follows || []).map((f) => f.target_name.toLowerCase()));

    const fanCity = (fan.city || 'Milano').toLowerCase();

    const followedEvents = futureEvents
      .filter((e) => followedNames.has((e.artist_name || '').toLowerCase()) || followedNames.has((e.venue_name || '').toLowerCase()))
      .slice(0, 4)
      .map((e) => ({
        id: e.id,
        title: e.title,
        artistName: e.artist_name || '',
        venueName: e.venue_name || '',
        city: e.city || '',
        dateStr: formatEventDateTime(e.starts_at, e.timezone).dateStr,
        genre: e.genre || '',
        url: `https://openstage.it/events/${e.id}`,
      }));

    const cityEvents = futureEvents
      .filter((e) => (e.city || '').toLowerCase().includes(fanCity))
      .slice(0, 4)
      .map((e) => ({
        id: e.id,
        title: e.title,
        artistName: e.artist_name || '',
        venueName: e.venue_name || '',
        city: e.city || '',
        dateStr: formatEventDateTime(e.starts_at, e.timezone).dateStr,
        genre: e.genre || '',
        url: `https://openstage.it/events/${e.id}`,
      }));

    if (followedEvents.length === 0 && cityEvents.length === 0) {
      continue;
    }

    const lang = fan.preferred_language === 'en' ? 'en' : 'it';
    const cityCapitalized = fan.city ? fan.city.charAt(0).toUpperCase() + fan.city.slice(1) : 'tua città';

    const result = await enqueueEmail({
      userId: fan.id,
      toEmail,
      template: 'weekly_digest',
      category: 'digest',
      subject:
        lang === 'en'
          ? `Your weekly gig guide for ${cityCapitalized}`
          : `I nuovi concerti per te questa settimana a ${cityCapitalized}`,
      data: {
        fanName: fan.display_name,
        city: cityCapitalized,
        followedEvents,
        cityEvents,
        digestUrl: 'https://openstage.it/dashboard',
        locale: lang,
      },
      locale: lang,
      batchId,
      idempotencyKey: `digest-${fan.id}-${new Date().toISOString().split('T')[0]}`,
    });

    if (result.success && result.status === 'queued') {
      count += 1;
    }
  }

  return { sentCount: count, batchId };
}

/**
 * 3. Inactivity reminder dispatcher:
 * - 3 days after sign-up for artists/venues with 0 published events
 */
export async function dispatchFirstEventReminders(): Promise<{ sentCount: number }> {
  const supabase = createAdminClient();
  const threeDaysAgoStart = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
  const threeDaysAgoEnd = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  // Find creators created 3-4 days ago
  const { data: creators } = await supabase
    .from('profiles')
    .select('id, display_name, role, preferred_language, created_at')
    .in('role', ['artist', 'venue'])
    .gte('created_at', threeDaysAgoStart)
    .lte('created_at', threeDaysAgoEnd);

  if (!creators || creators.length === 0) {
    return { sentCount: 0 };
  }

  let count = 0;

  for (const creator of creators) {
    // Check if they published any events
    const { count: eventsCount } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', creator.id);

    if (eventsCount && eventsCount > 0) {
      continue; // Already has events
    }

    const { data: userAuth } = await supabase.auth.admin.getUserById(creator.id);
    const toEmail = userAuth?.user?.email;
    if (!toEmail) continue;

    const lang = creator.preferred_language === 'en' ? 'en' : 'it';

    const result = await enqueueEmail({
      userId: creator.id,
      toEmail,
      template: 'reminder_first_event',
      category: 'marketing',
      subject:
        lang === 'en'
          ? 'Publish your first event on OpenStage!'
          : 'Il palco ti aspetta: pubblica il tuo primo concerto su OpenStage!',
      data: {
        name: creator.display_name,
        createUrl: 'https://openstage.it/events/new',
        locale: lang,
      },
      locale: lang,
      idempotencyKey: `first-event-reminder-${creator.id}`,
    });

    if (result.success && result.status === 'queued') {
      count += 1;
    }
  }

  return { sentCount: count };
}

/**
 * 4. Notify reminder holders when an event changes or is cancelled
 */
export async function notifyEventChangedOrCancelled(
  eventId: string,
  changeType: 'cancelled' | 'rescheduled' | 'venue_changed' | 'updated',
  changeDescription: string
): Promise<{ notifiedCount: number; batchId: string }> {
  const supabase = createAdminClient();
  const batchId = `event-change-${eventId}-${Date.now()}`;

  // Get event details
  const { data: evt } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (!evt) return { notifiedCount: 0, batchId };

  // Find all fans holding reminders or saved status
  const [{ data: reminderRows }, { data: savedRows }] = await Promise.all([
    supabase.from('fan_event_reminders').select('user_id').eq('event_id', eventId),
    supabase.from('fan_saved_events').select('user_id').eq('event_id', eventId),
  ]);

  const fanUserIds = Array.from(
    new Set([
      ...(reminderRows || []).map((r) => r.user_id),
      ...(savedRows || []).map((s) => s.user_id),
    ])
  );

  let notified = 0;

  for (const userId of fanUserIds) {
    const { data: userAuth } = await supabase.auth.admin.getUserById(userId);
    const toEmail = userAuth?.user?.email;
    if (!toEmail) continue;

    const { data: fanProfile } = await supabase
      .from('profiles')
      .select('preferred_language')
      .eq('id', userId)
      .maybeSingle();

    const lang = fanProfile?.preferred_language === 'en' ? 'en' : 'it';

    const subject =
      changeType === 'cancelled'
        ? lang === 'en'
          ? `Event cancelled: ${evt.title}`
          : `Concerto annullato: ${evt.title}`
        : lang === 'en'
        ? `Important update: ${evt.title}`
        : `Aggiornamento importante: ${evt.title}`;

    await enqueueEmail({
      userId,
      toEmail,
      template: 'event_changed_or_cancelled',
      category: 'reminder',
      subject,
      data: {
        eventTitle: evt.title,
        artistName: evt.artist_name || 'Artista',
        changeType,
        changeDescription,
        eventUrl: `https://openstage.it/events/${evt.id}`,
        locale: lang,
      },
      locale: lang,
      batchId,
      idempotencyKey: `change-${eventId}-${userId}-${Date.now().toString().slice(0, 8)}`,
    });

    notified += 1;
  }

  return { notifiedCount: notified, batchId };
}
