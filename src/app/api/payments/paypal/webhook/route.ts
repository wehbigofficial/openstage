import { NextRequest, NextResponse } from 'next/server';
import { verifyPayPalWebhookSignature, activateArtistPro } from '@/lib/services/paypalService';

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const headers: Record<string, string> = {
      'paypal-auth-algo': req.headers.get('paypal-auth-algo') || '',
      'paypal-cert-url': req.headers.get('paypal-cert-url') || '',
      'paypal-transmission-id': req.headers.get('paypal-transmission-id') || '',
      'paypal-transmission-sig': req.headers.get('paypal-transmission-sig') || '',
      'paypal-transmission-time': req.headers.get('paypal-transmission-time') || '',
    };

    const isValid = await verifyPayPalWebhookSignature(headers, bodyText);

    if (!isValid) {
      console.warn('Invalid PayPal webhook signature rejected');
      return NextResponse.json({ error: 'Firma webhook non valida' }, { status: 400 });
    }

    const event = JSON.parse(bodyText);
    const eventType = event.event_type;

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED' || eventType === 'CHECKOUT.ORDER.APPROVED') {
      const resource = event.resource;
      const paypalId = resource.id;
      const amount = parseFloat(resource.amount?.value || '3.00');
      const customId = resource.custom_id || resource.purchase_units?.[0]?.custom_id;
      const payerEmail = resource.payer?.email_address;
      const payerId = resource.payer?.payer_id;

      if (customId) {
        await activateArtistPro({
          userId: customId,
          paypalId,
          amount,
          payerEmail,
          payerId,
          metadata: resource,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Error handling PayPal webhook:', err);
    return NextResponse.json({ error: err.message || 'Errore webhook' }, { status: 500 });
  }
}
