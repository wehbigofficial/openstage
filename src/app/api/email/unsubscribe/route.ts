import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { email, category, all } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = createAdminClient();

    if (all) {
      // Add to suppression list
      await supabase.from('email_suppressions').upsert({
        email: normalizedEmail,
        reason: 'unsubscribe',
        details: 'User unsubscribed from all emails',
        created_at: new Date().toISOString(),
      });

      // Update profile if exists
      const { data: users } = await supabase.auth.admin.listUsers();
      const matched = users?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);
      if (matched) {
        await supabase
          .from('profiles')
          .update({
            email_consent_digest: false,
            email_marketing: false,
            email_reminders_day_before: false,
            email_reminders_morning_of: false,
            is_suppressed: true,
          })
          .eq('id', matched.id);
      }

      return NextResponse.json({
        success: true,
        message: 'You have been unsubscribed from all optional emails.',
      });
    }

    // Specific category toggle
    const { data: users } = await supabase.auth.admin.listUsers();
    const matched = users?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);

    if (matched) {
      const updates: Record<string, boolean> = {};
      if (category === 'digest') updates.email_consent_digest = false;
      if (category === 'marketing') updates.email_marketing = false;
      if (category === 'reminder') {
        updates.email_reminders_day_before = false;
        updates.email_reminders_morning_of = false;
      }

      await supabase.from('profiles').update(updates).eq('id', matched.id);
    }

    return NextResponse.json({
      success: true,
      message: `Unsubscribed from ${category || 'specified'} notifications.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Unsubscribe failed' },
      { status: 500 }
    );
  }
}
