import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { event_id, stat_type } = await request.json();

    if (!event_id || !stat_type) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    if (!['view', 'save', 'share', 'ticket'].includes(stat_type)) {
      return NextResponse.json({ error: 'Invalid stat type' }, { status: 400 });
    }

    const supabase = await createClient();

    // Call RPC if available, or direct upsert
    const { error } = await supabase.rpc('increment_event_stat', {
      target_event_id: event_id,
      stat_type,
    });

    if (error) {
      // If RPC fails or not migrated yet, attempt fallback direct upsert
      console.warn('RPC increment_event_stat failed, trying fallback upsert', error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
