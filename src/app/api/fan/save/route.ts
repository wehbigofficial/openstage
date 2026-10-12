import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toggleFanSaveEvent, getFanSavedEvents } from '@/lib/services/fanService';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const saved = await getFanSavedEvents(user.id);
  return NextResponse.json({ success: true, saved });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { event_id } = await req.json();
  if (!event_id) {
    return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
  }

  const isSaved = await toggleFanSaveEvent(user.id, event_id);
  return NextResponse.json({ success: true, isSaved });
}
