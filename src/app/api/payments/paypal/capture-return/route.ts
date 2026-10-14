import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/services/paypalService';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const orderId = searchParams.get('token') || searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.redirect(new URL('/go-pro?payment=error&reason=no_order_id', req.url));
    }

    // Try to get user from session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Also try to get userId from sessionStorage (not available server-side, but we can try query param)
    const userId = user?.id || searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.redirect(new URL('/auth/signin?redirect=/go-pro', req.url));
    }

    const result = await capturePayPalOrder(orderId, userId);
    
    // capturePayPalOrder throws on error, so if we get here, it succeeded
    return NextResponse.redirect(new URL('/go-pro?payment=success', req.url));
  } catch (err: any) {
    console.error('PayPal capture return error:', err);
    return NextResponse.redirect(new URL(`/go-pro?payment=error&reason=${encodeURIComponent(err.message)}`, req.url));
  }
}