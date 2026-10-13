import { NextRequest, NextResponse } from 'next/server';
import { recordPlayCounted } from '@/lib/services/radioService';

export async function POST(req: NextRequest) {
  try {
    const { trackId } = await req.json();
    if (!trackId) {
      return NextResponse.json({ error: 'Track ID richiesto' }, { status: 400 });
    }

    const res = await recordPlayCounted(trackId);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
