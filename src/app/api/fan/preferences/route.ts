import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFanProfile, updateFanPreferences } from '@/lib/services/fanService';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await getFanProfile(user.id);
  return NextResponse.json({ success: true, profile });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const allowedFields = [
    'city',
    'preferred_language',
    'favorite_genres',
    'email_consent_digest',
    'email_reminders_day_before',
    'email_reminders_morning_of',
    'email_marketing',
  ];

  const updateData: Record<string, any> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  const updated = await updateFanPreferences(user.id, updateData);
  return NextResponse.json({ success: true, profile: updated });
}
