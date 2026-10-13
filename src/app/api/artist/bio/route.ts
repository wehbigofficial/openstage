import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
      coverUrl,
      bio,
      genre,
      socialLinks = {},
      galleryPhotos = [],
      videoEmbeds = [],
    } = body;

    const adminClient = createAdminClient();

    const updatePayload: any = {
      bio,
      social_links: socialLinks,
      gallery_photos: galleryPhotos,
      video_embeds: videoEmbeds,
    };

    if (coverUrl !== undefined) updatePayload.cover_url = coverUrl;
    if (genre !== undefined) updatePayload.genre = genre;

    const { data, error } = await adminClient
      .from('artists')
      .update(updatePayload)
      .eq('profile_id', artistId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, artist: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
