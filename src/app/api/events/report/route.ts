import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createAdminNotification } from '@/lib/services/adminService';

export async function POST(request: NextRequest) {
  try {
    const { event_id, reason, details, email, ip } = await request.json();

    if (!event_id || !reason) {
      return NextResponse.json({ error: 'event_id e reason sono obbligatori' }, { status: 400 });
    }

    const clientIp = ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
    const supabase = createAdminClient();

    // 1. Insert report
    const { error: insertError } = await supabase.from('event_reports').insert({
      event_id,
      reporter_ip: clientIp,
      reporter_email: email || null,
      reason,
      details: details || null,
      status: 'open',
    });

    if (insertError) {
      console.warn('Report insert error in DB', insertError);
    }

    // 2. Count total open reports for this event
    const { data: openReports } = await supabase
      .from('event_reports')
      .select('id')
      .eq('event_id', event_id)
      .eq('status', 'open');

    const openCount = openReports?.length || 1;

    // 3. Fetch event title for notification
    const { data: eventData } = await supabase
      .from('events')
      .select('title, status')
      .eq('id', event_id)
      .maybeSingle();

    const eventTitle = eventData?.title || 'Concerto';

    // 4. Auto-hide rule: an event with 3 or more open reports is hidden automatically and goes to review
    let autoHidden = false;
    if (openCount >= 3) {
      autoHidden = true;
      await supabase
        .from('events')
        .update({ status: 'hidden' })
        .eq('id', event_id);

      // Create Admin Alert (sends email alert to admin as specified in section 6)
      await createAdminNotification({
        type: 'event_report',
        title: `Evento oscurato automaticamente: ${eventTitle} (3+ segnalazioni)`,
        message: `L'evento "${eventTitle}" ha raggiunto ${openCount} segnalazioni aperte (motivo: ${reason}). È stato oscurato automaticamente e richiede revisione.`,
        link: '/admin?tab=events',
      });
    } else {
      // Create standard admin notification with email alert
      await createAdminNotification({
        type: 'event_report',
        title: `Nuova segnalazione per evento: ${eventTitle}`,
        message: `Segnalato per: "${reason}". Dettagli: ${details || 'Nessuno'}. Totale segnalazioni aperte: ${openCount}.`,
        link: '/admin?tab=events',
      });
    }

    return NextResponse.json({
      success: true,
      openReportsCount: openCount,
      autoHidden,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore elaborazione segnalazione' }, { status: 500 });
  }
}
