import { createAdminClient } from '@/lib/supabase/admin';
import { enqueueEmail } from '@/lib/email/queue';

export interface RadioTrackItem {
  id: string;
  artist_id: string;
  artist_name: string;
  title: string;
  audio_url: string;
  duration_seconds: number;
  file_size_bytes?: number;
  status: 'pending' | 'approved' | 'rejected' | 'taken_down';
  rights_confirmed: boolean;
  rejection_reason?: string | null;
  plays_count: number;
  likes_count: number;
  created_at: string;
}

// Fallback seed tracks in case database is freshly launched
const DEMO_APPROVED_TRACKS: RadioTrackItem[] = [
  {
    id: 'demo-track-1',
    artist_id: 'demo-artist-1',
    artist_name: 'Luna & The Waves',
    title: 'Neon Horizon',
    audio_url: 'https://cdn.freesound.org/previews/708/708453_5674468-lq.mp3',
    duration_seconds: 145,
    status: 'approved',
    rights_confirmed: true,
    plays_count: 142,
    likes_count: 28,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'demo-track-2',
    artist_id: 'demo-artist-2',
    artist_name: 'The Velvet Echoes',
    title: 'Midnight in Bologna',
    audio_url: 'https://cdn.freesound.org/previews/689/689721_11861866-lq.mp3',
    duration_seconds: 180,
    status: 'approved',
    rights_confirmed: true,
    plays_count: 98,
    likes_count: 19,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'demo-track-3',
    artist_id: 'demo-artist-3',
    artist_name: 'Claudio Pastore Trio',
    title: 'Navigli Groove',
    audio_url: 'https://cdn.freesound.org/previews/612/612610_11861866-lq.mp3',
    duration_seconds: 160,
    status: 'approved',
    rights_confirmed: true,
    plays_count: 115,
    likes_count: 24,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'demo-track-4',
    artist_id: 'demo-artist-4',
    artist_name: 'Elena Rossi & Band',
    title: 'Trastevere Sunset',
    audio_url: 'https://cdn.freesound.org/previews/556/556812_11861866-lq.mp3',
    duration_seconds: 195,
    status: 'approved',
    rights_confirmed: true,
    plays_count: 164,
    likes_count: 35,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'demo-track-5',
    artist_id: 'demo-artist-5',
    artist_name: 'Starlight Synth',
    title: 'Riviera Drive',
    audio_url: 'https://cdn.freesound.org/previews/586/586047_11861866-lq.mp3',
    duration_seconds: 150,
    status: 'approved',
    rights_confirmed: true,
    plays_count: 88,
    likes_count: 14,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

/**
 * Get min radio tracks required setting
 */
export async function getMinRadioTracksSetting(): Promise<number> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'admin_settings')
      .maybeSingle();

    if (data?.value?.min_radio_tracks !== undefined) {
      return Number(data.value.min_radio_tracks);
    }
  } catch {}
  return 5;
}

/**
 * Get all approved radio tracks
 */
export async function getApprovedTracks(): Promise<RadioTrackItem[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('radio_tracks')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as RadioTrackItem[];
    }
  } catch {}

  return DEMO_APPROVED_TRACKS;
}

/**
 * Compute the live 24/7 synchronized stream
 * All listeners hear the exact same track at the exact same moment.
 */
export async function getCurrentLiveRadio() {
  const minTracks = await getMinRadioTracksSetting();
  const approvedTracks = await getApprovedTracks();

  if (approvedTracks.length < minTracks) {
    return {
      isLive: false,
      minTracksRequired: minTracks,
      currentApprovedCount: approvedTracks.length,
      currentTrack: null,
      offsetSeconds: 0,
      serverTime: Date.now(),
    };
  }

  // Fair rotation: stable sort by artist_name then title
  const playlist = [...approvedTracks].sort((a, b) =>
    a.artist_name.localeCompare(b.artist_name) || a.title.localeCompare(b.title)
  );

  const totalCycleSeconds = playlist.reduce(
    (sum, t) => sum + (t.duration_seconds > 0 ? t.duration_seconds : 180),
    0
  );

  if (totalCycleSeconds <= 0) {
    return {
      isLive: false,
      minTracksRequired: minTracks,
      currentApprovedCount: approvedTracks.length,
      currentTrack: null,
      offsetSeconds: 0,
      serverTime: Date.now(),
    };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const cyclePosition = nowSeconds % totalCycleSeconds;

  let accumulated = 0;
  let currentTrack = playlist[0];
  let offsetSeconds = 0;
  let nextTrack = playlist[1 % playlist.length];

  for (let i = 0; i < playlist.length; i++) {
    const track = playlist[i];
    const duration = track.duration_seconds > 0 ? track.duration_seconds : 180;
    if (cyclePosition >= accumulated && cyclePosition < accumulated + duration) {
      currentTrack = track;
      offsetSeconds = cyclePosition - accumulated;
      nextTrack = playlist[(i + 1) % playlist.length];
      break;
    }
    accumulated += duration;
  }

  // Find next event for this artist if any
  let nextEvent: any = null;
  try {
    const supabase = createAdminClient();
    const { data: eventData } = await supabase
      .from('events')
      .select('id, title, starts_at, city, venue_name')
      .ilike('artist_name', currentTrack.artist_name)
      .eq('status', 'published')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (eventData) {
      nextEvent = eventData;
    }
  } catch {}

  return {
    isLive: true,
    minTracksRequired: minTracks,
    currentApprovedCount: approvedTracks.length,
    currentTrack,
    offsetSeconds,
    serverTime: Date.now(),
    nextTrack: {
      id: nextTrack.id,
      title: nextTrack.title,
      artist_name: nextTrack.artist_name,
    },
    nextEvent,
  };
}

/**
 * Record a play after 30 seconds of listening
 */
export async function recordPlayCounted(trackId: string) {
  try {
    const supabase = createAdminClient();

    // Increment track plays_count
    const { data: track } = await supabase
      .from('radio_tracks')
      .select('artist_id, plays_count')
      .eq('id', trackId)
      .maybeSingle();

    if (track) {
      await supabase
        .from('radio_tracks')
        .update({ plays_count: (track.plays_count || 0) + 1 })
        .eq('id', trackId);

      // Increment artist_stats
      if (track.artist_id) {
        const { data: stat } = await supabase
          .from('artist_stats')
          .select('radio_plays')
          .eq('artist_id', track.artist_id)
          .maybeSingle();

        if (stat) {
          await supabase
            .from('artist_stats')
            .update({ radio_plays: (stat.radio_plays || 0) + 1, updated_at: new Date().toISOString() })
            .eq('artist_id', track.artist_id);
        } else {
          await supabase.from('artist_stats').insert({
            artist_id: track.artist_id,
            radio_plays: 1,
          });
        }
      }
    }
    return { success: true };
  } catch (err) {
    console.error('Error recording radio play:', err);
    return { success: false };
  }
}

/**
 * Like / unlike a radio track
 */
export async function toggleTrackLike({
  trackId,
  userId,
  clientIp,
}: {
  trackId: string;
  userId?: string | null;
  clientIp?: string | null;
}) {
  try {
    const supabase = createAdminClient();

    let query = supabase.from('radio_likes').select('id').eq('track_id', trackId);
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (clientIp) {
      query = query.eq('client_ip', clientIp);
    }

    const { data: existing } = await query.maybeSingle();

    const { data: track } = await supabase
      .from('radio_tracks')
      .select('likes_count, artist_id')
      .eq('id', trackId)
      .single();

    const currentLikes = track?.likes_count || 0;

    if (existing) {
      // Unlike
      await supabase.from('radio_likes').delete().eq('id', existing.id);
      const newLikes = Math.max(0, currentLikes - 1);
      await supabase
        .from('radio_tracks')
        .update({ likes_count: newLikes })
        .eq('id', trackId);

      return { liked: false, likesCount: newLikes };
    } else {
      // Like
      await supabase.from('radio_likes').insert({
        track_id: trackId,
        user_id: userId || null,
        client_ip: clientIp || null,
      });
      const newLikes = currentLikes + 1;
      await supabase
        .from('radio_tracks')
        .update({ likes_count: newLikes })
        .eq('id', trackId);

      return { liked: true, likesCount: newLikes };
    }
  } catch (err) {
    console.error('Error toggling track like:', err);
    return { liked: false, likesCount: 0 };
  }
}

/**
 * Submit a track by an Artist Pro (max 3 tracks)
 */
export async function submitArtistTrack({
  artistId,
  artistName,
  title,
  audioUrl,
  durationSeconds = 180,
  fileSizeBytes,
  rightsConfirmed,
}: {
  artistId: string;
  artistName: string;
  title: string;
  audioUrl: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
  rightsConfirmed: boolean;
}) {
  if (!rightsConfirmed) {
    throw new Error('È necessario dichiarare di possedere i diritti della traccia.');
  }

  const supabase = createAdminClient();

  // Check if artist is Pro
  const { data: artist } = await supabase
    .from('artists')
    .select('is_pro')
    .eq('profile_id', artistId)
    .maybeSingle();

  if (!artist?.is_pro) {
    throw new Error('Solo gli artisti con account Pro possono caricare brani per la Radio.');
  }

  // Check how many tracks already exist
  const { count } = await supabase
    .from('radio_tracks')
    .select('*', { count: 'exact', head: true })
    .eq('artist_id', artistId)
    .neq('status', 'rejected');

  if (count && count >= 3) {
    throw new Error('Hai già raggiunto il limite massimo di 3 brani in rotazione o in revisione.');
  }

  // Insert pending track
  const { data: newTrack, error } = await supabase
    .from('radio_tracks')
    .insert({
      artist_id: artistId,
      artist_name: artistName,
      title,
      audio_url: audioUrl,
      duration_seconds: durationSeconds,
      file_size_bytes: fileSizeBytes,
      status: 'pending',
      rights_confirmed: true,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Send Admin Notification
  await supabase.from('admin_notifications').insert({
    type: 'radio_review',
    title: 'Nuovo brano in attesa di revisione Radio',
    message: `L'artista "${artistName}" ha caricato il brano "${title}" per la Radio.`,
    link: `/admin?tab=radio`,
  });

  // Send Admin alert email
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@openstage.it';
  await enqueueEmail({
    toEmail: adminEmail,
    template: 'admin_alert',
    category: 'admin',
    subject: `[OpenStage Admin] Nuovo brano radio da revisionare: "${title}"`,
    data: {
      alertType: 'radio_review',
      title: 'Nuovo brano per la Radio OpenStage',
      description: `L'artista ${artistName} ha caricato "${title}". Ascolta e approva dal pannello admin.`,
      link: 'https://openstage.live/admin?tab=radio',
    },
    locale: 'it',
    idempotencyKey: `radio_rev_${newTrack.id}`,
  });

  return newTrack;
}

/**
 * Approve a pending track
 */
export async function approveRadioTrack(trackId: string, adminEmail: string) {
  const supabase = createAdminClient();

  const { data: track, error } = await supabase
    .from('radio_tracks')
    .update({
      status: 'approved',
      reviewed_by: adminEmail,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq('id', trackId)
    .select('*, profiles:artist_id(preferred_language, display_name)')
    .single();

  if (error) throw error;

  // Send approval email to artist
  try {
    const { data: authUser } = await supabase.auth.admin.getUserById(track.artist_id);
    const artistEmail = authUser?.user?.email;
    if (artistEmail) {
      const locale = (track.profiles?.preferred_language as 'it' | 'en') || 'it';
      await enqueueEmail({
        userId: track.artist_id,
        toEmail: artistEmail,
        template: 'radio_track_approved',
        category: 'transactional',
        subject:
          locale === 'en'
            ? `Your track "${track.title}" is now live on OpenStage Radio!`
            : `Il tuo brano "${track.title}" è stato approvato su OpenStage Radio!`,
        data: {
          artistName: track.artist_name,
          trackTitle: track.title,
        },
        locale,
        idempotencyKey: `approved_${track.id}`,
      });
    }
  } catch (err) {
    console.error('Error notifying artist of track approval:', err);
  }

  return track;
}

/**
 * Reject a pending track with reason
 */
export async function rejectRadioTrack(
  trackId: string,
  reason: string,
  adminEmail: string
) {
  const supabase = createAdminClient();

  const { data: track, error } = await supabase
    .from('radio_tracks')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      reviewed_by: adminEmail,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', trackId)
    .select('*, profiles:artist_id(preferred_language, display_name)')
    .single();

  if (error) throw error;

  // Send rejection email to artist
  try {
    const { data: authUser } = await supabase.auth.admin.getUserById(track.artist_id);
    const artistEmail = authUser?.user?.email;
    if (artistEmail) {
      const locale = (track.profiles?.preferred_language as 'it' | 'en') || 'it';
      await enqueueEmail({
        userId: track.artist_id,
        toEmail: artistEmail,
        template: 'radio_track_rejected',
        category: 'transactional',
        subject:
          locale === 'en'
            ? `Update regarding your radio submission "${track.title}"`
            : `Aggiornamento sul tuo brano "${track.title}" per OpenStage Radio`,
        data: {
          artistName: track.artist_name,
          trackTitle: track.title,
          reason,
        },
        locale,
        idempotencyKey: `rejected_${track.id}`,
      });
    }
  } catch (err) {
    console.error('Error notifying artist of track rejection:', err);
  }

  return track;
}

/**
 * Takedown a track (by admin)
 */
export async function takedownRadioTrack(trackId: string, adminEmail: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('radio_tracks')
    .update({
      status: 'taken_down',
      reviewed_by: adminEmail,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', trackId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Report an audio track
 */
export async function reportRadioTrack({
  trackId,
  reason,
  details,
  reporterEmail,
  reporterIp,
}: {
  trackId: string;
  reason: string;
  details?: string;
  reporterEmail?: string;
  reporterIp?: string;
}) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('radio_reports')
    .insert({
      track_id: trackId,
      reason,
      details,
      reporter_email: reporterEmail,
      reporter_ip: reporterIp,
    })
    .select()
    .single();

  if (error) throw error;

  // Check how many open reports this track has
  const { count } = await supabase
    .from('radio_reports')
    .select('*', { count: 'exact', head: true })
    .eq('track_id', trackId)
    .eq('status', 'open');

  if (count && count >= 3) {
    // Auto-takedown track if 3+ reports
    await supabase
      .from('radio_tracks')
      .update({ status: 'taken_down' })
      .eq('id', trackId);

    await supabase.from('admin_notifications').insert({
      type: 'radio_review',
      title: 'Brano rimosso automaticamente per 3+ segnalazioni',
      message: `Il brano con ID ${trackId} ha superato 3 segnalazioni ed è stato rimosso dalla rotazione.`,
      link: '/admin?tab=radio',
    });
  } else {
    await supabase.from('admin_notifications').insert({
      type: 'radio_review',
      title: 'Nuova segnalazione brano radio',
      message: `Segnalazione ricevuta per il brano con ID ${trackId}: "${reason}".`,
      link: '/admin?tab=radio',
    });
  }

  return data;
}

/**
 * Get tracks for an artist
 */
export async function getArtistTracks(artistId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('radio_tracks')
    .select('*')
    .eq('artist_id', artistId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as RadioTrackItem[];
}

/**
 * Delete a track by the artist
 */
export async function deleteArtistTrack(trackId: string, artistId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('radio_tracks')
    .delete()
    .eq('id', trackId)
    .eq('artist_id', artistId);

  if (error) throw error;
  return { success: true };
}
