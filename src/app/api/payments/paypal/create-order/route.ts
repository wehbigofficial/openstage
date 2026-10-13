import { NextRequest, NextResponse } from 'next/server';
import { createPayPalOrder } from '@/lib/services/paypalService';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userId = user?.id;
    if (!userId) {
      // In dev or demo testing, read userId from body if present
      const body = await req.json().catch(() => ({}));
      userId = body.userId;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Utente non autenticato' }, { status: 401 });
    }

    const order = await createPayPalOrder(userId);
    return NextResponse.json(order);
  } catch (err: any) {
    console.error('Error in create-order route:', err);
    return NextResponse.json({ error: err.message || 'Errore creazione ordine PayPal' }, { status: 500 });
  }
}
