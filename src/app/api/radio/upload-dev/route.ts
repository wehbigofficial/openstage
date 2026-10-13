import { NextRequest, NextResponse } from 'next/server';

// Temporary in-memory or buffer cache for local dev fallback
const devAudioStorage = new Map<string, { buffer: Buffer; contentType: string }>();

export async function PUT(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get('key');
    if (!key) {
      return NextResponse.json({ error: 'Key required' }, { status: 400 });
    }

    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = req.headers.get('content-type') || 'audio/mpeg';

    devAudioStorage.set(key, { buffer, contentType });

    return NextResponse.json({ success: true, key });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
