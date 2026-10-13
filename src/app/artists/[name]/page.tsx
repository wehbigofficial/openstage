import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDictionary } from '@/lib/dictionary';
import { getEventUrl } from '@/lib/utils/slug';
import ArtistBioClient from './ArtistBioClient';

export const instant = false;

interface ArtistBioPageProps {
  params: Promise<{
    name: string;
  }>;
  searchParams: Promise<{
    locale?: 'it' | 'en';
  }>;
}

async function getArtistData(name: string) {
  const supabase = createAdminClient();
  const decodedName = decodeURIComponent(name);

  const { data: artist, error } = await supabase
    .from('artists')
    .select(`
      *,
      profiles:profile_id (
        id,
        display_name,
        avatar_url,
        city,
        country,
        preferred_language,
        created_at
      )
    `)
    .ilike('profiles.display_name', decodedName)
    .maybeSingle();

  if (error || !artist) return null;

  // Get events
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('owner_id', artist.profile_id)
    .eq('status', 'published')
    .order('starts_at', { ascending: true });

  // Get radio tracks
  const { data: radioTracks } = await supabase
    .from('radio_tracks')
    .select('*')
    .eq('artist_id', artist.profile_id)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  // Get stats
  const { data: stats } = await supabase
    .from('artist_stats')
    .select('*')
    .eq('artist_id', artist.profile_id)
    .maybeSingle();

  return { artist, profiles: artist.profiles, events: events || [], radioTracks: radioTracks || [], stats };
}

export async function generateMetadata({ params, searchParams }: ArtistBioPageProps): Promise<Metadata> {
  const { name } = await params;
  const { locale = 'it' } = await searchParams;
  const dict = getDictionary(locale);

  const artistData = await getArtistData(name);
  if (!artistData) {
    return {
      title: `${decodeURIComponent(name)} | OpenStage`,
    };
  }

  const { artist, profiles } = artistData;
  const displayName = profiles?.display_name || decodeURIComponent(name);
  const city = profiles?.city || '';
  const genre = artist.genre || '';

  return {
    title: `${displayName} | OpenStage`,
    description: `${displayName}${genre ? ` - ${genre}` : ''}${city ? ` da ${city}` : ''}. Bio ufficiale, concerti, brani in radio e galleria.`,
    openGraph: {
      title: `${displayName} | OpenStage`,
      description: `Scopri la bio ufficiale, i concerti in programma e la musica di ${displayName}.`,
      type: 'profile',
      images: artist.cover_url ? [{ url: artist.cover_url }] : (profiles?.avatar_url ? [{ url: profiles.avatar_url }] : []),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} | OpenStage`,
      description: `Bio ufficiale, concerti e musica di ${displayName}.`,
      images: artist.cover_url ? [artist.cover_url] : (profiles?.avatar_url ? [profiles.avatar_url] : []),
    },
  };
}

export default async function ArtistBioPage({ params, searchParams }: ArtistBioPageProps) {
  const { name } = await params;
  const { locale = 'it' } = await searchParams;
  const dict = getDictionary(locale);

  const artistData = await getArtistData(name);

  if (!artistData) {
    notFound();
  }

  return <ArtistBioClient dict={dict} locale={locale} artistData={artistData} />;
}