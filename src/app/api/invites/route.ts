import { NextRequest, NextResponse } from 'next/server';
import {
  getArtistReferralStats,
  recordArtistReferral,
} from '@/lib/services/inviteService';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const artistId = req.nextUrl.searchParams.get('artistId') || user?.id;

    if (!artistId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const stats = await getArtistReferralStats(artistId);
    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { inviteCode, invitedUserId } = await req.json();

    if (!inviteCode || !invitedUserId) {
      return NextResponse.json({ error: 'Dati incompleti' }, { status: 400 });
    }

    const referral = await recordArtistReferral({ inviteCode, invitedUserId });
    return NextResponse.json({ success: true, referral });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}