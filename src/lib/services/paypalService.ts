import { createAdminClient } from '@/lib/supabase/admin';
import { enqueueEmail } from '@/lib/email/queue';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_ENV = process.env.PAYPAL_ENV || 'sandbox';
const PAYPAL_BASE_URL =
  PAYPAL_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

/**
 * Fetch OAuth access token from PayPal Orders API
 */
export async function getPayPalAccessToken(): Promise<string | null> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    return null;
  }

  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
      console.error('PayPal OAuth failed:', await res.text());
      return null;
    }

    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.error('Error fetching PayPal access token:', err);
    return null;
  }
}

/**
 * Read Artist Pro price from admin_settings in Supabase
 */
export async function getArtistProPrice(): Promise<number> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'admin_settings')
      .maybeSingle();

    if (data?.value?.artist_pro_price_eur) {
      return Number(data.value.artist_pro_price_eur);
    }
  } catch {}
  return 3.0; // Default 3 EUR
}

/**
 * Create a PayPal order on the server
 */
export async function createPayPalOrder(userId: string) {
  const token = await getPayPalAccessToken();
  const price = await getArtistProPrice();
  const priceStr = price.toFixed(2);

  // If credentials are not configured in local environment, provide a dev/sandbox order mock
  if (!token) {
    const mockOrderId = `MOCK-ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    return {
      id: mockOrderId,
      status: 'CREATED',
      amount: priceStr,
      currency: 'EUR',
      isMock: true,
    };
  }

  const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: `artist_pro_${userId}`,
          description: 'OpenStage Artist Pro (One-time purchase)',
          amount: {
            currency_code: 'EUR',
            value: priceStr,
          },
          custom_id: userId,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`PayPal Order creation failed: ${errText}`);
  }

  const orderData = await res.json();
  return {
    id: orderData.id,
    status: orderData.status,
    amount: priceStr,
    currency: 'EUR',
    isMock: false,
  };
}

/**
 * Capture a PayPal order and idempotently activate Artist Pro
 */
export async function capturePayPalOrder(orderId: string, userId: string) {
  const token = await getPayPalAccessToken();
  const price = await getArtistProPrice();

  let captureData: any = null;
  let paypalId = orderId;
  let payerEmail = '';
  let payerId = '';

  if (token && !orderId.startsWith('MOCK-ORDER-')) {
    const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`PayPal capture failed: ${errText}`);
    }

    captureData = await res.json();
    paypalId = captureData.id || orderId;
    payerEmail = captureData.payer?.email_address || '';
    payerId = captureData.payer?.payer_id || '';
  } else {
    // Mock / sandbox fallback
    captureData = {
      id: orderId,
      status: 'COMPLETED',
      payer: { email_address: 'artist@demo.openstage.it', payer_id: 'DEMO-PAYER' },
    };
    payerEmail = 'artist@demo.openstage.it';
    payerId = 'DEMO-PAYER';
  }

  // Idempotently activate Pro in Supabase
  const result = await activateArtistPro({
    userId,
    paypalId,
    amount: price,
    payerEmail,
    payerId,
    metadata: captureData,
  });

  return result;
}

/**
 * Idempotently activate Artist Pro in database, record payment, and notify
 */
export async function activateArtistPro({
  userId,
  paypalId,
  amount,
  payerEmail,
  payerId,
  metadata,
}: {
  userId: string;
  paypalId: string;
  amount: number;
  payerEmail?: string;
  payerId?: string;
  metadata?: any;
}) {
  const supabase = createAdminClient();

  // Check if payment was already recorded
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('*')
    .eq('paypal_id', paypalId)
    .maybeSingle();

  if (existingPayment && existingPayment.status === 'completed') {
    return { success: true, alreadyProcessed: true, payment: existingPayment };
  }

  // 1. Record payment
  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .upsert({
      user_id: userId,
      amount,
      currency: 'EUR',
      status: 'completed',
      paypal_id: paypalId,
      paypal_payer_id: payerId,
      paypal_payer_email: payerEmail,
      payment_method: 'paypal',
      metadata: metadata || {},
    }, { onConflict: 'paypal_id' })
    .select()
    .single();

  if (payErr) {
    console.error('Error inserting payment record:', payErr);
  }

  // 2. Activate Pro on artists table
  const { error: artErr } = await supabase
    .from('artists')
    .update({
      is_pro: true,
      pro_since: new Date().toISOString(),
      pro_granted_by: 'payment',
      featured_eligible: true,
    })
    .eq('profile_id', userId);

  if (artErr) {
    console.error('Error updating artist pro status:', artErr);
  }

  // 3. Get user profile for receipt email
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, preferred_language')
    .eq('id', userId)
    .maybeSingle();

  const userDisplayName = profile?.display_name || 'Artista OpenStage';
  const locale = (profile?.preferred_language as 'it' | 'en') || 'it';

  // Get user auth email
  let userEmail = payerEmail || '';
  try {
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    if (authUser?.user?.email) {
      userEmail = authUser.user.email;
    }
  } catch {}

  // 4. Send Confirmation & Receipt Email
  if (userEmail) {
    await enqueueEmail({
      userId,
      toEmail: userEmail,
      template: 'artist_pro_receipt',
      category: 'transactional',
      subject:
        locale === 'en'
          ? 'OpenStage Artist Pro - Payment Receipt & Confirmation'
          : 'OpenStage Artist Pro - Ricevuta di pagamento e conferma attivazione',
      data: {
        artistName: userDisplayName,
        amount: `€${amount.toFixed(2)}`,
        transactionId: paypalId,
        date: new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'it-IT', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      },
      locale,
      idempotencyKey: `receipt_${paypalId}`,
    });
  }

  // 5. Notify admin panel
  await supabase.from('admin_notifications').insert({
    type: 'pro_purchase',
    title: 'Nuovo acquisto Artist Pro',
    message: `L'artista ${userDisplayName} ha acquistato Artist Pro per €${amount.toFixed(2)} via PayPal.`,
    link: `/admin?tab=users`,
  });

  return { success: true, payment };
}

/**
 * Verify PayPal Webhook Signature
 */
export async function verifyPayPalWebhookSignature(
  headers: Record<string, string>,
  bodyText: string
): Promise<boolean> {
  const token = await getPayPalAccessToken();
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  if (!token || !webhookId) {
    // If webhook ID or token is missing in local dev, allow test verification
    return true;
  }

  try {
    const res = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: JSON.parse(bodyText),
      }),
    });

    if (!res.ok) return false;
    const data = await res.json();
    return data.verification_status === 'SUCCESS';
  } catch (err) {
    console.error('Error verifying PayPal webhook signature:', err);
    return false;
  }
}
