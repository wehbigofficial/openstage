import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyEventChangedOrCancelled } from '@/lib/services/emailAutomationService';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, changeType, description } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    const result = await notifyEventChangedOrCancelled(
      eventId,
      changeType || 'updated',
      description || 'Aggiornamento sui dettagli del concerto.'
    );

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Error sending notifications' },
      { status: 500 }
    );
  }
}
