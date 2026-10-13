import { NextRequest, NextResponse } from 'next/server';
import { toggleTrackLike } from '@/lib/services/radioService';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { trackId } = await req.json();
    if (!trackId) {
      return NextResponse.json({ error: 'Track ID richiesto' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const res = await toggleTrackLike({
      trackId,
      userId: user?.id || null,
      clientIp,
    });

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
