import { NextRequest, NextResponse } from 'next/server';
import { reportRadioTrack } from '@/lib/services/radioService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trackId, reason, details, reporterEmail } = body;

    if (!trackId || !reason) {
      return NextResponse.json({ error: 'Track ID e motivo sono richiesti' }, { status: 400 });
    }

    const reporterIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const report = await reportRadioTrack({
      trackId,
      reason,
      details,
      reporterEmail,
      reporterIp,
    });

    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
