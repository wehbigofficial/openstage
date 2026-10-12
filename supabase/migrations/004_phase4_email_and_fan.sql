-- Migration: 004_phase4_email_and_fan.sql
-- Description: Phase 4 - Email queue, email logs, suppressions, fan saves, reminders, follows, and fan preferences

-- 1. Create custom enum or check types if needed
DO $$ BEGIN
  CREATE TYPE email_category AS ENUM ('transactional', 'reminder', 'digest', 'marketing', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE email_status AS ENUM ('queued', 'sending', 'sent', 'delivered', 'failed', 'bounced');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Enhance profiles table with language and fan preference settings
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'it' NOT NULL,
  ADD COLUMN IF NOT EXISTS favorite_genres TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS email_consent_digest BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS email_reminders_day_before BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS email_reminders_morning_of BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS email_marketing BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS is_suppressed BOOLEAN DEFAULT false NOT NULL;

-- 3. Email suppressions table (hard bounces, complaints, manual unsubscribes)
CREATE TABLE IF NOT EXISTS public.email_suppressions (
  email TEXT PRIMARY KEY,
  reason TEXT NOT NULL, -- 'bounce' | 'complaint' | 'unsubscribe'
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Email queue table
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  template TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('transactional', 'reminder', 'digest', 'marketing', 'admin')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'failed', 'bounced')),
  error_reason TEXT,
  attempts INT NOT NULL DEFAULT 0,
  resend_id TEXT,
  idempotency_key TEXT UNIQUE NOT NULL,
  batch_id TEXT,
  subject TEXT,
  template_data JSONB DEFAULT '{}'::jsonb NOT NULL,
  locale TEXT NOT NULL DEFAULT 'it',
  scheduled_for TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  sent_at TIMESTAMPTZ
);

-- Index for queue polling
CREATE INDEX IF NOT EXISTS idx_email_queue_status_sched ON public.email_queue (status, scheduled_for)
  WHERE status IN ('queued', 'failed');

-- 5. Email log table
CREATE TABLE IF NOT EXISTS public.email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  template TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('transactional', 'reminder', 'digest', 'marketing', 'admin')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'failed', 'bounced')),
  error_reason TEXT,
  attempts INT NOT NULL DEFAULT 0,
  resend_id TEXT,
  idempotency_key TEXT NOT NULL,
  batch_id TEXT,
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_log_user_cat ON public.email_log (user_id, category, sent_at);
CREATE INDEX IF NOT EXISTS idx_email_log_resend_id ON public.email_log (resend_id);

-- 6. Fan Saved Events table
CREATE TABLE IF NOT EXISTS public.fan_saved_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_fan_saved_user ON public.fan_saved_events (user_id);
CREATE INDEX IF NOT EXISTS idx_fan_saved_event ON public.fan_saved_events (event_id);

-- 7. Fan Event Reminders table
CREATE TABLE IF NOT EXISTS public.fan_event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  remind_day_before BOOLEAN DEFAULT true NOT NULL,
  remind_morning_of BOOLEAN DEFAULT true NOT NULL,
  day_before_sent_at TIMESTAMPTZ,
  morning_of_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_fan_reminders_user ON public.fan_event_reminders (user_id);
CREATE INDEX IF NOT EXISTS idx_fan_reminders_event ON public.fan_event_reminders (event_id);

-- 8. Fan Follows (Artists & Venues)
CREATE TABLE IF NOT EXISTS public.fan_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('artist', 'venue')),
  target_name TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_fan_follows_user ON public.fan_follows (user_id);
CREATE INDEX IF NOT EXISTS idx_fan_follows_target ON public.fan_follows (target_id);

-- 9. Enable RLS on all new tables
ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_saved_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_follows ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies
-- Fan saved events
CREATE POLICY "Users can view own saved events"
  ON public.fan_saved_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved events"
  ON public.fan_saved_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved events"
  ON public.fan_saved_events FOR DELETE
  USING (auth.uid() = user_id);

-- Fan event reminders
CREATE POLICY "Users can view own event reminders"
  ON public.fan_event_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update own event reminders"
  ON public.fan_event_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own event reminders"
  ON public.fan_event_reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own event reminders"
  ON public.fan_event_reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Fan follows
CREATE POLICY "Users can view own follows"
  ON public.fan_follows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can follow"
  ON public.fan_follows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow"
  ON public.fan_follows FOR DELETE
  USING (auth.uid() = user_id);

-- Email Queue & Logs (Strict service role only)
CREATE POLICY "Service role manages email queue"
  ON public.email_queue FOR ALL
  USING (false);

CREATE POLICY "Service role manages email logs"
  ON public.email_log FOR ALL
  USING (false);

CREATE POLICY "Public cannot read suppressions directly"
  ON public.email_suppressions FOR ALL
  USING (false);
