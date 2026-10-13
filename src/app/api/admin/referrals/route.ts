import { NextRequest, NextResponse } from 'next/server';
import {
  getAllReferralsForAdmin,
  revokeReferralAbuse,
} from '@/lib/services/inviteService';

export async function GET() {
  try {
    const list = await getAllReferralsForAdmin();
    return NextResponse.json({ referrals: list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, referralId, reason = 'Abuso rilevato dai controlli interni' } = body;

    if (action === 'revoke') {
      if (!referralId) {
        return NextResponse.json({ error: 'Referral ID richiesto' }, { status: 400 });
      }
      const res = await revokeReferralAbuse(referralId, reason);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}