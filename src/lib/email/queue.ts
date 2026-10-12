import { createAdminClient } from '@/lib/supabase/admin';
import { EmailTemplateName } from './renderer';

export type EmailCategory = 'transactional' | 'reminder' | 'digest' | 'marketing' | 'admin';

export interface EnqueueEmailParams {
  userId?: string | null;
  toEmail: string;
  template: EmailTemplateName | string;
  category: EmailCategory;
  subject: string;
  data?: Record<string, any>;
  locale?: 'it' | 'en';
  idempotencyKey?: string;
  batchId?: string | null;
  scheduledFor?: string | Date;
}

export interface EnqueueResult {
  success: boolean;
  queueId?: string;
  status: 'queued' | 'suppressed' | 'frequency_capped' | 'preference_opted_out' | 'already_processed' | 'error';
  reason?: string;
}

/**
 * Check if an email address is suppressed (hard bounce, spam complaint, or unsubscribe)
 */
export async function isEmailSuppressed(email: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('email_suppressions')
      .select('email')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    return !!data;
  } catch {
    return false;
  }
}

/**
 * Frequency cap: max 1 marketing or digest email per user per week.
 */
export async function checkFrequencyCap(
  userId: string | null | undefined,
  toEmail: string,
  category: EmailCategory
): Promise<boolean> {
  if (category !== 'marketing' && category !== 'digest') {
    return true; // Not capped
  }

  try {
    const supabase = createAdminClient();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('email_log')
      .select('id')
      .in('category', ['marketing', 'digest'])
      .in('status', ['sent', 'delivered'])
      .gte('sent_at', sevenDaysAgo);

    if (userId) {
      query = query.or(`user_id.eq.${userId},to_email.eq.${toEmail.toLowerCase()}`);
    } else {
      query = query.eq('to_email', toEmail.toLowerCase());
    }

    const { data, error } = await query;
    if (error) return true;

    // If already sent 1 or more in last 7 days, frequency cap reached
    return !(data && data.length > 0);
  } catch {
    return true;
  }
}

/**
 * Check user notification preference from profiles
 */
export async function checkUserPreference(
  userId: string,
  category: EmailCategory,
  templateData?: Record<string, any>
): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('email_consent_digest, email_reminders_day_before, email_reminders_morning_of, email_marketing, is_suppressed')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) return true;

    if (profile.is_suppressed) return false;

    if (category === 'digest' && !profile.email_consent_digest) {
      return false;
    }

    if (category === 'marketing' && !profile.email_marketing) {
      return false;
    }

    if (category === 'reminder') {
      const timing = templateData?.timing;
      if (timing === 'day_before' && !profile.email_reminders_day_before) {
        return false;
      }
      if (timing === 'morning_of' && !profile.email_reminders_morning_of) {
        return false;
      }
    }

    return true;
  } catch {
    return true;
  }
}

/**
 * Enqueue an email into email_queue
 */
export async function enqueueEmail(params: EnqueueEmailParams): Promise<EnqueueResult> {
  const normalizedEmail = params.toEmail.trim().toLowerCase();

  // Basic email validation
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, status: 'error', reason: 'Invalid email address' };
  }

  // 1. Check suppression list (bounces, complaints, manual unsubscribes)
  const suppressed = await isEmailSuppressed(normalizedEmail);
  if (suppressed) {
    return {
      success: false,
      status: 'suppressed',
      reason: 'Recipient email is suppressed due to bounce, complaint, or unsubscribe.',
    };
  }

  // 2. Check user preference if user ID is available
  if (params.userId && params.category !== 'transactional') {
    const allowed = await checkUserPreference(params.userId, params.category, params.data);
    if (!allowed) {
      return {
        success: false,
        status: 'preference_opted_out',
        reason: 'User has opted out of this email notification category.',
      };
    }
  }

  // 3. Frequency cap for marketing and digest
  if (params.category === 'marketing' || params.category === 'digest') {
    const capPassed = await checkFrequencyCap(params.userId, normalizedEmail, params.category);
    if (!capPassed) {
      return {
        success: false,
        status: 'frequency_capped',
        reason: 'Frequency cap reached: maximum 1 digest or marketing email per week.',
      };
    }
  }

  // 4. Generate idempotency key if not provided
  const idempotencyKey =
    params.idempotencyKey ||
    `${params.template}-${normalizedEmail}-${params.category}-${params.scheduledFor ? new Date(params.scheduledFor).toISOString().split('T')[0] : Date.now()}`;

  const scheduledFor = params.scheduledFor
    ? new Date(params.scheduledFor).toISOString()
    : new Date().toISOString();

  try {
    const supabase = createAdminClient();

    // Check if already queued or processed with this idempotency key
    const { data: existing } = await supabase
      .from('email_queue')
      .select('id, status')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existing) {
      return {
        success: true,
        queueId: existing.id,
        status: 'already_processed',
        reason: 'Email with this idempotency key already exists in queue.',
      };
    }

    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        user_id: params.userId || null,
        to_email: normalizedEmail,
        template: params.template,
        category: params.category,
        status: 'queued',
        attempts: 0,
        idempotency_key: idempotencyKey,
        batch_id: params.batchId || null,
        subject: params.subject,
        template_data: params.data || {},
        locale: params.locale || 'it',
        scheduled_for: scheduledFor,
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique violation on idempotency_key
        return {
          success: true,
          status: 'already_processed',
          reason: 'Duplicate idempotency key handled.',
        };
      }
      return { success: false, status: 'error', reason: error.message };
    }

    return { success: true, queueId: data.id, status: 'queued' };
  } catch (err: any) {
    return { success: false, status: 'error', reason: err?.message || 'Database error' };
  }
}
