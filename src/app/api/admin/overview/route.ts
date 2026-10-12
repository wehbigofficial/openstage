import { NextRequest, NextResponse } from 'next/server';
import { getAdminOverviewData } from '@/lib/services/adminService';

export async function GET(request: NextRequest) {
  try {
    const data = await getAdminOverviewData();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore caricamento statistiche' }, { status: 500 });
  }
}
