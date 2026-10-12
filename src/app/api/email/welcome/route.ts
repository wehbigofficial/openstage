import { NextRequest, NextResponse } from 'next/server';
import { enqueueEmail } from '@/lib/email/queue';

export async function POST(req: NextRequest) {
  try {
    const { userId, email, name, role, locale } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const lang = locale === 'en' ? 'en' : 'it';
    const subject =
      lang === 'en'
        ? 'Welcome to OpenStage! Discover live indie music'
        : 'Benvenuto su OpenStage! Scopri la musica dal vivo';

    const result = await enqueueEmail({
      userId: userId || null,
      toEmail: email,
      template: 'welcome',
      category: 'marketing',
      subject,
      data: { name, role, locale: lang },
      locale: lang,
      idempotencyKey: `welcome-${userId || email}-${Date.now().toString().slice(0, 7)}`,
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error enqueuing welcome' }, { status: 500 });
  }
}
