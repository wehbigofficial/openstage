import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toggleFanReminder, getFanReminders } from '@/lib/services/fanService';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reminders = await getFanReminders(user.id);
  return NextResponse.json({ success: true, reminders });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { event_id, remind_day_before, remind_morning_of } = await req.json();
  if (!event_id) {
    return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
  }

  const options =
    typeof remind_day_before === 'boolean' || typeof remind_morning_of === 'boolean'
      ? { remindDayBefore: remind_day_before, remindMorningOf: remind_morning_of }
      : undefined;

  const result = await toggleFanReminder(user.id, event_id, options);
  return NextResponse.json({ success: true, ...result });
}
