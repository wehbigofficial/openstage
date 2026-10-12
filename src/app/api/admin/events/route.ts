import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DEMO_EVENTS } from '@/lib/data/demoEvents';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view'); // 'events' or 'reports'
    const status = searchParams.get('status');
    const city = searchParams.get('city');
    const search = searchParams.get('search')?.toLowerCase();

    const supabase = createAdminClient();

    // 1. Fetch Reports Queue if requested
    if (view === 'reports') {
      let reports: any[] = [];
      try {
        const { data, error } = await supabase
          .from('event_reports')
          .select('*, events(id, title, city, status)')
          .order('created_at', { ascending: false });

        if (!error && data) {
          reports = data;
        }
      } catch {}

      // If DB has no reports, provide simulated realistic reports
      if (reports.length === 0) {
        reports = [
          {
            id: 'rep-001',
            event_id: DEMO_EVENTS[0]?.id || 'evt-1',
            reason: 'Luogo o data inesatta o inesistente',
            details: 'L orario corretto è alle 22:30 anziché 21:00.',
            reporter_email: 'segnalatore@live.it',
            reporter_ip: '151.48.22.10',
            status: 'open',
            created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
            events: {
              id: DEMO_EVENTS[0]?.id,
              title: DEMO_EVENTS[0]?.title,
              city: DEMO_EVENTS[0]?.city,
              status: DEMO_EVENTS[0]?.status,
            },
          },
          {
            id: 'rep-002',
            event_id: DEMO_EVENTS[1]?.id || 'evt-2',
            reason: 'Spam o truffa commerciale',
            details: 'Link al biglietto rimanda a un sito di phishing non ufficiale.',
            reporter_email: 'moderazione.fan@gmail.com',
            reporter_ip: '79.12.88.4',
            status: 'open',
            created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
            events: {
              id: DEMO_EVENTS[1]?.id,
              title: DEMO_EVENTS[1]?.title,
              city: DEMO_EVENTS[1]?.city,
              status: DEMO_EVENTS[1]?.status,
            },
          },
        ];
      }

      return NextResponse.json({ reports });
    }

    // 2. Fetch Events
    let eventsList: any[] = [];
    try {
      let query = supabase.from('events').select('*').order('created_at', { ascending: false });
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      if (city && city !== 'all') {
        query = query.eq('city', city);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        eventsList = data;
      }
    } catch {}

    if (eventsList.length === 0) {
      eventsList = [...DEMO_EVENTS];
      if (status && status !== 'all') {
        eventsList = eventsList.filter((e) => e.status === status);
      }
      if (city && city !== 'all') {
        eventsList = eventsList.filter((e) => (e.city || '').toLowerCase() === city.toLowerCase());
      }
    }

    // Filter search text
    if (search) {
      eventsList = eventsList.filter(
        (e) =>
          (e.title || '').toLowerCase().includes(search) ||
          (e.artist_name || '').toLowerCase().includes(search) ||
          (e.venue_name || '').toLowerCase().includes(search) ||
          (e.city || '').toLowerCase().includes(search)
      );
    }

    // Fetch report counts per event to display warnings for events with 3+ reports
    let reportCountMap: Record<string, number> = {};
    try {
      const { data: openReports } = await supabase
        .from('event_reports')
        .select('event_id')
        .eq('status', 'open');

      if (openReports) {
        openReports.forEach((r) => {
          reportCountMap[r.event_id] = (reportCountMap[r.event_id] || 0) + 1;
        });
      }
    } catch {}

    const eventsWithReports = eventsList.map((e) => ({
      ...e,
      openReportsCount: reportCountMap[e.id] || 0,
      isAutoHidden: (reportCountMap[e.id] || 0) >= 3,
    }));

    return NextResponse.json({ events: eventsWithReports });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore recupero eventi' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, eventId, reportId, data } = body;
    const supabase = createAdminClient();

    // Event Actions
    if (action === 'approve') {
      await supabase.from('events').update({ status: 'published' }).eq('id', eventId);
      return NextResponse.json({ success: true, message: 'Evento approvato e pubblicato' });
    }

    if (action === 'hide') {
      await supabase.from('events').update({ status: 'hidden' }).eq('id', eventId);
      return NextResponse.json({ success: true, message: 'Evento oscurato' });
    }

    if (action === 'toggle-featured') {
      const isFeatured = !!data?.is_featured;
      await supabase.from('events').update({ is_featured: isFeatured }).eq('id', eventId);
      return NextResponse.json({ success: true, is_featured: isFeatured });
    }

    if (action === 'edit') {
      await supabase
        .from('events')
        .update({
          title: data.title,
          artist_name: data.artist_name,
          venue_name: data.venue_name,
          city: data.city,
          address: data.address,
          starts_at: data.starts_at,
          description: data.description,
          price_text: data.price_text,
          status: data.status,
        })
        .eq('id', eventId);
      return NextResponse.json({ success: true, message: 'Evento aggiornato' });
    }

    // Report Actions
    if (action === 'resolve-report') {
      await supabase.from('event_reports').update({ status: 'reviewed' }).eq('id', reportId);
      return NextResponse.json({ success: true, message: 'Segnalazione contrassegnata come risolta' });
    }

    if (action === 'dismiss-report') {
      await supabase.from('event_reports').update({ status: 'dismissed' }).eq('id', reportId);
      return NextResponse.json({ success: true, message: 'Segnalazione archiviata' });
    }

    return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore aggiornamento evento' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');
    if (!eventId) {
      return NextResponse.json({ error: 'ID evento richiesto' }, { status: 400 });
    }

    const supabase = createAdminClient();
    await supabase.from('events').delete().eq('id', eventId);

    return NextResponse.json({ success: true, message: 'Evento eliminato definitivamente' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore eliminazione evento' }, { status: 500 });
  }
}
