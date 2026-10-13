import { NextResponse } from 'next/server';
import { getCurrentLiveRadio } from '@/lib/services/radioService';

export async function GET() {
  try {
    const radioData = await getCurrentLiveRadio();
    return NextResponse.json(radioData);
  } catch (err: any) {
    console.error('Error in radio current route:', err);
    return NextResponse.json(
      { isLive: false, error: err.message || 'Errore recupero radio' },
      { status: 500 }
    );
  }
}