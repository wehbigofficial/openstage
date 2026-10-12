import { NextRequest, NextResponse } from 'next/server';
import { processEmailQueue } from '@/lib/email/worker';

export async function GET(req: NextRequest) {
  try {
    // Optional secret check if CRON_SECRET is set
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }

    const result = await processEmailQueue({
      batchSize: 100,
      delayBetweenBatchesMs: 500, // 2 req/sec
      maxBatchesPerRun: 10,
    });

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Worker error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
