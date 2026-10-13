import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/services/paypalService';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID richiesto' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userId = user?.id || body.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Utente non autenticato' }, { status: 401 });
    }

    const result = await capturePayPalOrder(orderId, userId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in capture-order route:', err);
    return NextResponse.json({ error: err.message || 'Errore durante la cattura del pagamento' }, { status: 500 });
  }
}
