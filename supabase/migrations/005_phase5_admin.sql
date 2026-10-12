-- Migration: 005_phase5_admin.sql
-- Description: Phase 5 Admin Panel tables, policies, settings, notifications, tickets and claim flows

-- 1. Contact Tickets table
CREATE TABLE IF NOT EXISTS public.contact_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('artist', 'venue', 'fan', 'other')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'answered', 'closed')),
  admin_reply TEXT,
  replied_at TIMESTAMPTZ,
  replied_by TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_tickets_status ON public.contact_tickets (status);
CREATE INDEX IF NOT EXISTS idx_contact_tickets_created_at ON public.contact_tickets (created_at DESC);

-- 2. Admin Notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN (
    'radio_review',
    'venue_verification',
    'event_report',
    'payment_failed',
    'mail_failed',
    'signup',
    'new_event',
    'pro_purchase',
    'claim_request'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON public.admin_notifications (is_read, created_at DESC);

-- 3. Admin MFA & Recovery Codes
CREATE TABLE IF NOT EXISTS public.admin_mfa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL UNIQUE,
  secret TEXT NOT NULL,
  qr_code TEXT,
  is_enrolled BOOLEAN DEFAULT false NOT NULL,
  recovery_codes TEXT[] DEFAULT '{}'::text[] NOT NULL,
  enrolled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Claim invitations for profiles and events created on behalf
CREATE TABLE IF NOT EXISTS public.claim_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('artist', 'venue', 'event')),
  target_id UUID NOT NULL,
  target_name TEXT NOT NULL,
  invite_email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  claimed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimant_name TEXT,
  claimant_email TEXT,
  claimant_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'requested', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_claim_invitations_token ON public.claim_invitations (token);
CREATE INDEX IF NOT EXISTS idx_claim_invitations_status ON public.claim_invitations (status);

-- 5. Alter existing tables for suspensions, unclaimed status, and report tracking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS is_unclaimed BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS is_unclaimed BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS is_unclaimed BOOLEAN DEFAULT false NOT NULL;

-- Make events.owner_id nullable to support unclaimed events created on behalf
ALTER TABLE public.events
  ALTER COLUMN owner_id DROP NOT NULL;

ALTER TABLE public.event_reports
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'reviewed', 'dismissed'));

-- 6. Trigger to automatically hide events with 3 or more open reports
CREATE OR REPLACE FUNCTION public.handle_event_report_auto_hide()
RETURNS TRIGGER AS $$
DECLARE
  open_count INT;
  event_title TEXT;
BEGIN
  -- Count open reports for this event
  SELECT COUNT(*) INTO open_count
  FROM public.event_reports
  WHERE event_id = NEW.event_id AND status = 'open';

  IF open_count >= 3 THEN
    -- Automatically hide event
    UPDATE public.events
    SET status = 'hidden'
    WHERE id = NEW.event_id;

    SELECT title INTO event_title FROM public.events WHERE id = NEW.event_id;

    -- Send alert notification to admin
    INSERT INTO public.admin_notifications (type, title, message, link)
    VALUES (
      'event_report',
      'Evento oscurato automaticamente per 3+ segnalazioni',
      'L''evento "' || COALESCE(event_title, 'ID ' || NEW.event_id::text) || '" ha raggiunto ' || open_count || ' segnalazioni ed è stato automaticamente oscurato.',
      '/admin?tab=events'
    );
  ELSE
    -- Record standard report notification
    INSERT INTO public.admin_notifications (type, title, message, link)
    VALUES (
      'event_report',
      'Nuova segnalazione evento',
      'Segnalazione per "' || NEW.reason || '" registrata.',
      '/admin?tab=events'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_event_report_auto_hide ON public.event_reports;
CREATE TRIGGER on_event_report_auto_hide
  AFTER INSERT OR UPDATE OF status ON public.event_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_event_report_auto_hide();

-- 7. Seed default admin settings in settings table
INSERT INTO public.settings (key, value)
VALUES (
  'admin_settings',
  jsonb_build_object(
    'artist_pro_price_eur', 3.00,
    'venue_pro_monthly_eur', 4.90,
    'venue_pro_annual_eur', 39.00,
    'trial_days', 14,
    'featured_slots', 3,
    'min_radio_tracks', 5,
    'antispam_max_events_per_day', 10,
    'antispam_max_reports_per_ip', 5,
    'antispam_auto_hide_report_threshold', 3
  )
)
ON CONFLICT (key) DO UPDATE SET
  value = public.settings.value || EXCLUDED.value;

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.contact_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_mfa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_invitations ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
-- Contact tickets: Anyone can insert, only service role can read/update
CREATE POLICY "Anyone can submit contact ticket"
  ON public.contact_tickets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role manages contact tickets"
  ON public.contact_tickets FOR ALL
  USING (false);

-- Admin notifications: Only service role can manage
CREATE POLICY "Service role manages admin notifications"
  ON public.admin_notifications FOR ALL
  USING (false);

-- Admin MFA: Only service role
CREATE POLICY "Service role manages admin MFA"
  ON public.admin_mfa FOR ALL
  USING (false);

-- Claim invitations: Anyone can read by token, create claim request; service role manages
CREATE POLICY "Public can view claim invitations by token"
  ON public.claim_invitations FOR SELECT
  USING (true);

CREATE POLICY "Public can update claim request"
  ON public.claim_invitations FOR UPDATE
  USING (true);

CREATE POLICY "Service role manages claim invitations"
  ON public.claim_invitations FOR ALL
  USING (false);
