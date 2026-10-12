import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DEMO_EVENTS } from '@/lib/data/demoEvents';
import { DEMO_ACCOUNTS } from '@/lib/data/demoAccounts';

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map((item) =>
    headers
      .map((header) => {
        let val = item[header];
        if (val === null || val === undefined) return '""';
        if (typeof val === 'object') val = JSON.stringify(val);
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join(',')
  );
  return [headers.join(','), ...rows].join('\r\n');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table') || 'events'; // 'users' | 'events' | 'tickets' | 'maillog' | 'settings'
    const format = searchParams.get('format') || 'csv'; // 'csv' | 'json'

    const supabase = createAdminClient();
    let data: any[] = [];

    if (table === 'users') {
      try {
        const { data: dbProfiles } = await supabase.from('profiles').select('*');
        if (dbProfiles && dbProfiles.length > 0) data = dbProfiles;
      } catch {}
      if (data.length === 0) {
        data = Object.values(DEMO_ACCOUNTS).map((u) => ({
          id: u.id,
          display_name: u.display_name,
          email: u.email,
          role: u.role,
          city: u.city,
          country: u.country,
          created_at: '2026-01-01T00:00:00Z',
        }));
      }
    } else if (table === 'events') {
      try {
        const { data: dbEvents } = await supabase.from('events').select('*');
        if (dbEvents && dbEvents.length > 0) data = dbEvents;
      } catch {}
      if (data.length === 0) {
        data = DEMO_EVENTS;
      }
    } else if (table === 'tickets') {
      try {
        const { data: dbTickets } = await supabase.from('contact_tickets').select('*');
        if (dbTickets && dbTickets.length > 0) data = dbTickets;
      } catch {}
      if (data.length === 0) {
        data = [
          {
            ticket_number: 'OS-102948',
            name: 'Marco Bellini',
            email: 'bellini.marco@gmail.com',
            user_type: 'artist',
            status: 'new',
            message: 'Richiesta informazioni radio rotation',
            created_at: new Date().toISOString(),
          },
        ];
      }
    } else if (table === 'maillog') {
      try {
        const { data: dbLogs } = await supabase.from('email_log').select('*');
        if (dbLogs && dbLogs.length > 0) data = dbLogs;
      } catch {}
      if (data.length === 0) {
        data = [
          {
            to_email: 'test@openstage.it',
            template: 'welcome',
            category: 'transactional',
            status: 'sent',
            created_at: new Date().toISOString(),
          },
        ];
      }
    } else if (table === 'settings') {
      try {
        const { data: dbSettings } = await supabase.from('settings').select('*');
        if (dbSettings && dbSettings.length > 0) data = dbSettings;
      } catch {}
      if (data.length === 0) {
        data = [{ key: 'platform', value: { status: 'healthy', version: '1.0.0' } }];
      }
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `openstage-${table}-${dateStr}.${format}`;

    if (format === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Default CSV
    const csvContent = convertToCSV(data);
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore esportazione dati' }, { status: 500 });
  }
}
