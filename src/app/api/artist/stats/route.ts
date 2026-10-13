import { NextRequest, NextResponse } from 'next/server';
import { getArtistStats } from '@/lib/services/artistStatsService';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const artistId = req.nextUrl.searchParams.get('artistId') || user?.id;

    if (!artistId) {
      return NextResponse.json({ error: 'Artist ID richiesto' }, { status: 400 });
    }

    const stats = await getArtistStats(artistId);
    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}