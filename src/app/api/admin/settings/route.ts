import { NextRequest, NextResponse } from 'next/server';
import { getAdminSettings, saveAdminSettings } from '@/lib/services/adminService';

export async function GET(request: NextRequest) {
  try {
    const settings = await getAdminSettings();
    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore recupero impostazioni' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = await saveAdminSettings(body);
    return NextResponse.json({
      success: true,
      message: 'Impostazioni aggiornate con successo',
      settings: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore salvataggio impostazioni' }, { status: 500 });
  }
}
