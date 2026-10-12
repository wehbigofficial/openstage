import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toggleFanFollow, getFanFollows } from '@/lib/services/fanService';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const follows = await getFanFollows(user.id);
  return NextResponse.json({ success: true, follows });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { target_id, target_type, target_name } = await req.json();
  if (!target_id || !target_type) {
    return NextResponse.json({ error: 'target_id and target_type are required' }, { status: 400 });
  }

  const isFollowing = await toggleFanFollow(
    user.id,
    target_id,
    target_type,
    target_name || 'Artist/Venue'
  );

  return NextResponse.json({ success: true, isFollowing });
}
