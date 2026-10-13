import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // If no dev buffer is found, redirect to preview fallback sound
  return NextResponse.redirect('https://cdn.freesound.org/previews/708/708453_5674468-lq.mp3');
}
