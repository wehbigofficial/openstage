import { NextRequest, NextResponse } from 'next/server';
import { getArtistTracks, submitArtistTrack, deleteArtistTrack } from '@/lib/services/radioService';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const artistId = req.nextUrl.searchParams.get('artistId') || user?.id;

    if (!artistId) {
      return NextResponse.json({ error: 'Artist ID richiesto' }, { status: 400 });
    }

    const tracks = await getArtistTracks(artistId);
    return NextResponse.json({ tracks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const artistId = user?.id || body.artistId;

    if (!artistId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const {
      title,
      audioUrl,
      durationSeconds = 180,
      fileSizeBytes,
      rightsConfirmed,
    } = body;

    if (!title || !audioUrl) {
      return NextResponse.json({ error: 'Titolo e URL audio richiesti' }, { status: 400 });
    }

    if (!rightsConfirmed) {
      return NextResponse.json(
        { error: 'È necessario confermare la titolarità dei diritti di pubblicazione.' },
        { status: 400 }
      );
    }

    // Get artist display name
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from('profiles')
      .select('display_name')
      .eq('id', artistId)
      .maybeSingle();

    const artistName = profile?.display_name || body.artistName || 'Artista';

    const track = await submitArtistTrack({
      artistId,
      artistName,
      title,
      audioUrl,
      durationSeconds,
      fileSizeBytes,
      rightsConfirmed,
    });

    return NextResponse.json({ success: true, track });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { trackId, artistId: bodyArtistId } = await req.json();
    const artistId = user?.id || bodyArtistId;

    if (!artistId || !trackId) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
    }

    const res = await deleteArtistTrack(trackId, artistId);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
