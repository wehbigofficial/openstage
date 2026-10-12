import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const eventType = payload.type; // 'email.delivered' | 'email.bounced' | 'email.complained'
    const eventData = payload.data;

    if (!eventType || !eventData) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    const emailId = eventData.email_id;
    const recipient = Array.isArray(eventData.to) ? eventData.to[0] : eventData.to;
    const normalizedEmail = recipient ? recipient.trim().toLowerCase() : null;

    const supabase = createAdminClient();

    if (eventType === 'email.delivered') {
      if (emailId) {
        await supabase
          .from('email_log')
          .update({ status: 'delivered' })
          .eq('resend_id', emailId);

        await supabase
          .from('email_queue')
          .update({ status: 'delivered' })
          .eq('resend_id', emailId);
      }
    } else if (eventType === 'email.bounced' || eventType === 'email.complained') {
      const reason = eventType === 'email.bounced' ? 'bounce' : 'complaint';
      const detail = eventData.bounce_type || eventData.reason || 'Reported by Resend webhook';

      // 1. Update logs and queue
      if (emailId) {
        await supabase
          .from('email_log')
          .update({
            status: 'bounced',
            error_reason: `${reason}: ${detail}`,
          })
          .eq('resend_id', emailId);

        await supabase
          .from('email_queue')
          .update({
            status: 'bounced',
            error_reason: `${reason}: ${detail}`,
          })
          .eq('resend_id', emailId);
      }

      // 2. Add to suppressions table (never email this address again)
      if (normalizedEmail) {
        await supabase.from('email_suppressions').upsert({
          email: normalizedEmail,
          reason,
          details: detail,
          created_at: new Date().toISOString(),
        });

        // 3. Flag user profile as suppressed if account exists
        // Get user from auth or profiles by email
        const { data: users } = await supabase.auth.admin.listUsers();
        const matched = users?.users?.find(
          (u) => u.email?.toLowerCase() === normalizedEmail
        );

        if (matched) {
          await supabase
            .from('profiles')
            .update({ is_suppressed: true })
            .eq('id', matched.id);
        }
      }
    }

    return NextResponse.json({ success: true, event: eventType });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
