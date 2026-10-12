import { createAdminClient } from '@/lib/supabase/admin';
import { resend, SENDER_EMAIL } from './client';
import { renderEmailTemplate } from './renderer';
import { isEmailSuppressed } from './queue';

export interface WorkerOptions {
  batchSize?: number; // Up to 100 per batch request
  delayBetweenBatchesMs?: number; // Default 500ms (2 requests per second)
  maxBatchesPerRun?: number;
}

export interface WorkerRunResult {
  processedCount: number;
  sentCount: number;
  failedCount: number;
  batchesCount: number;
  errors: string[];
}

/**
 * Classify email sending errors into clear standardized reasons
 */
export function classifyError(error: any): string {
  const msg = (error?.message || error?.name || String(error)).toLowerCase();

  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many requests')) {
    return 'rate limit';
  }
  if (msg.includes('invalid') && (msg.includes('email') || msg.includes('address') || msg.includes('recipient'))) {
    return 'invalid address';
  }
  if (msg.includes('domain') && (msg.includes('verify') || msg.includes('unverified') || msg.includes('not verified'))) {
    return 'domain not verified';
  }
  if (msg.includes('bounce') || msg.includes('rejected') || msg.includes('mailbox')) {
    return 'bounce';
  }
  return error?.message ? `other: ${error.message}` : 'other';
}

/**
 * Helper delay
 */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Process the email queue in controlled rate-limited batches
 */
export async function processEmailQueue(
  options: WorkerOptions = {}
): Promise<WorkerRunResult> {
  const batchSize = Math.min(options.batchSize || 100, 100);
  const delayMs = options.delayBetweenBatchesMs ?? 500; // 2 requests per second
  const maxBatches = options.maxBatchesPerRun || 5;

  const result: WorkerRunResult = {
    processedCount: 0,
    sentCount: 0,
    failedCount: 0,
    batchesCount: 0,
    errors: [],
  };

  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  for (let batchNum = 0; batchNum < maxBatches; batchNum++) {
    // 1. Fetch next queued or retriable emails
    const { data: queueItems, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .in('status', ['queued', 'failed'])
      .lt('attempts', 3)
      .lte('scheduled_for', nowIso)
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (fetchError) {
      result.errors.push(`Queue fetch error: ${fetchError.message}`);
      break;
    }

    if (!queueItems || queueItems.length === 0) {
      break; // Queue is empty
    }

    result.batchesCount += 1;
    const itemIds = queueItems.map((item) => item.id);

    // 2. Mark selected items as 'sending'
    await supabase
      .from('email_queue')
      .update({ status: 'sending' })
      .in('id', itemIds);

    // 3. Prepare payload and render templates
    const validEmails: {
      item: any;
      payload: {
        from: string;
        to: string;
        subject: string;
        html: string;
        text?: string;
        headers?: Record<string, string>;
      };
    }[] = [];

    for (const item of queueItems) {
      result.processedCount += 1;

      // Check suppression again just before dispatch
      const suppressed = await isEmailSuppressed(item.to_email);
      if (suppressed) {
        await supabase
          .from('email_queue')
          .update({
            status: 'failed',
            error_reason: 'bounce: email is suppressed',
            attempts: item.attempts + 1,
          })
          .eq('id', item.id);
        result.failedCount += 1;
        continue;
      }

      try {
        const { html, text } = await renderEmailTemplate(
          item.template,
          item.template_data,
          item.locale || 'it'
        );

        validEmails.push({
          item,
          payload: {
            from: SENDER_EMAIL,
            to: item.to_email,
            subject: item.subject || 'OpenStage Notification',
            html,
            text,
            headers: {
              'X-Entity-Ref-ID': item.idempotency_key,
              ...(item.batch_id ? { 'X-Batch-ID': item.batch_id } : {}),
            },
          },
        });
      } catch (renderErr: any) {
        const errReason = `other: template render failed - ${renderErr?.message}`;
        await supabase
          .from('email_queue')
          .update({
            status: 'failed',
            error_reason: errReason,
            attempts: item.attempts + 1,
          })
          .eq('id', item.id);
        result.failedCount += 1;
        result.errors.push(errReason);
      }
    }

    if (validEmails.length === 0) {
      continue;
    }

    // 4. Send via Resend batch API
    try {
      // Check if Resend API key is set
      const isConfiguredKey =
        process.env.RESEND_API_KEY &&
        process.env.RESEND_API_KEY.startsWith('re_') &&
        process.env.RESEND_API_KEY !== 're_placeholder_development_key';

      let batchResponses: any[] = [];

      if (isConfiguredKey) {
        const resendPayload = validEmails.map((v) => v.payload);
        const { data, error } = await resend.batch.send(resendPayload);

        if (error) {
          throw error;
        }

        batchResponses = data?.data || [];
      } else {
        // Development / Test simulation mode
        batchResponses = validEmails.map((_, idx) => ({
          id: `sim_resend_${Date.now()}_${idx}`,
        }));
      }

      const sentTime = new Date().toISOString();

      // 5. Update items to 'sent' and write to email_log
      for (let i = 0; i < validEmails.length; i++) {
        const { item } = validEmails[i];
        const resendId = batchResponses[i]?.id || null;

        // Update queue item
        await supabase
          .from('email_queue')
          .update({
            status: 'sent',
            sent_at: sentTime,
            resend_id: resendId,
            attempts: item.attempts + 1,
            error_reason: null,
          })
          .eq('id', item.id);

        // Write to log table
        await supabase.from('email_log').insert({
          queue_id: item.id,
          user_id: item.user_id,
          to_email: item.to_email,
          template: item.template,
          category: item.category,
          status: 'sent',
          attempts: item.attempts + 1,
          resend_id: resendId,
          idempotency_key: item.idempotency_key,
          batch_id: item.batch_id,
          subject: item.subject,
          created_at: item.created_at,
          sent_at: sentTime,
        });

        result.sentCount += 1;
      }
    } catch (sendErr: any) {
      const classified = classifyError(sendErr);
      result.errors.push(`Batch send failed: ${classified}`);

      // Handle failure with exponential backoff
      for (const { item } of validEmails) {
        result.failedCount += 1;
        const newAttempts = item.attempts + 1;

        if (newAttempts >= 3) {
          // Permanently failed
          await supabase
            .from('email_queue')
            .update({
              status: 'failed',
              attempts: newAttempts,
              error_reason: classified,
            })
            .eq('id', item.id);

          await supabase.from('email_log').insert({
            queue_id: item.id,
            user_id: item.user_id,
            to_email: item.to_email,
            template: item.template,
            category: item.category,
            status: 'failed',
            attempts: newAttempts,
            error_reason: classified,
            idempotency_key: item.idempotency_key,
            batch_id: item.batch_id,
            subject: item.subject,
            created_at: item.created_at,
            sent_at: null,
          });
        } else {
          // Exponential backoff: attempt 1 = +5min, attempt 2 = +20min
          const backoffMinutes = Math.pow(2, newAttempts) * 5;
          const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();

          await supabase
            .from('email_queue')
            .update({
              status: 'queued',
              attempts: newAttempts,
              error_reason: classified,
              scheduled_for: nextRetry,
            })
            .eq('id', item.id);
        }
      }
    }

    // Rate limiting: sleep between batch requests (default 500ms = 2 req/sec)
    if (batchNum < maxBatches - 1) {
      await wait(delayMs);
    }
  }

  return result;
}

/**
 * Retrying failed emails for admin panel without creating duplicates
 * Preserves the idempotency_key.
 */
export async function retryFailedEmails(options?: {
  ids?: string[];
  category?: string;
}): Promise<{ retriedCount: number; message: string }> {
  try {
    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    let query = supabase
      .from('email_queue')
      .update({
        status: 'queued',
        attempts: 0,
        error_reason: null,
        scheduled_for: nowIso,
      })
      .eq('status', 'failed');

    if (options?.ids && options.ids.length > 0) {
      query = query.in('id', options.ids);
    }

    if (options?.category) {
      query = query.eq('category', options.category);
    }

    const { data, error } = await query.select('id');

    if (error) {
      throw error;
    }

    const count = data?.length || 0;
    return {
      retriedCount: count,
      message: `Successfully re-queued ${count} failed email(s) for delivery.`,
    };
  } catch (err: any) {
    return {
      retriedCount: 0,
      message: `Retry error: ${err?.message || 'Database error'}`,
    };
  }
}
