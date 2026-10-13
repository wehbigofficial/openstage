import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  approveRadioTrack,
  rejectRadioTrack,
  takedownRadioTrack,
} from '@/lib/services/radioService';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Fetch all tracks
    const { data: tracks, error: trackErr } = await supabase
      .from('radio_tracks')
      .select(`
        *,
        artist:profiles!artist_id (
          id,
          display_name,
          avatar_url,
          city
        )
      `)
      .order('created_at', { ascending: false });

    if (trackErr) throw trackErr;

    // Fetch reports
    const { data: reports, error: repErr } = await supabase
      .from('radio_reports')
      .select(`
        *,
        track:radio_tracks!track_id (
          id,
          title,
          artist_name,
          audio_url
        )
      `)
      .order('created_at', { ascending: false });

    if (repErr) throw repErr;

    const pending = (tracks || []).filter((t) => t.status === 'pending');
    const approved = (tracks || []).filter((t) => t.status === 'approved');
    const rejected = (tracks || []).filter((t) => t.status === 'rejected');
    const takenDown = (tracks || []).filter((t) => t.status === 'taken_down');

    return NextResponse.json({
      pending,
      approved,
      rejected,
      takenDown,
      reports: reports || [],
      counts: {
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
        reports: (reports || []).filter((r) => r.status === 'open').length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, trackId, reason = '' } = body;

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@openstage.it';

    if (!trackId || !action) {
      return NextResponse.json({ error: 'Action e Track ID richiesti' }, { status: 400 });
    }

    if (action === 'approve') {
      const res = await approveRadioTrack(trackId, adminEmail);
      return NextResponse.json({ success: true, track: res });
    } else if (action === 'reject') {
      if (!reason) {
        return NextResponse.json({ error: 'Motivo del rifiuto obbligatorio' }, { status: 400 });
      }
      const res = await rejectRadioTrack(trackId, reason, adminEmail);
      return NextResponse.json({ success: true, track: res });
    } else if (action === 'takedown') {
      const res = await takedownRadioTrack(trackId, adminEmail);
      return NextResponse.json({ success: true, track: res });
    }

    return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
