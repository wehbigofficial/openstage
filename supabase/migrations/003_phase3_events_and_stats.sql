-- Migration: 003_phase3_events_and_stats.sql
-- Description: Phase 3 enhancements: event_stats, reports, venue linking, notifications flag

-- 1. Create event_stats table to track views, saves, shares, ticket clicks
CREATE TABLE IF NOT EXISTS public.event_stats (
  event_id UUID PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  views_count INTEGER DEFAULT 0 NOT NULL,
  saves_count INTEGER DEFAULT 0 NOT NULL,
  shares_count INTEGER DEFAULT 0 NOT NULL,
  ticket_clicks INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add venue_id reference & changed_flag to events table if not already present
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(profile_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS important_change_flag BOOLEAN DEFAULT false NOT NULL;

-- 3. Create event_reports table for discreet reporting
CREATE TABLE IF NOT EXISTS public.event_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  reporter_ip TEXT,
  reporter_email TEXT,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS
ALTER TABLE public.event_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reports ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Everyone can read stats
CREATE POLICY "Stats are viewable by everyone"
  ON public.event_stats FOR SELECT
  USING (true);

-- System or authenticated users can increment/update stats
CREATE POLICY "Anyone can update stats"
  ON public.event_stats FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update existing stats"
  ON public.event_stats FOR UPDATE
  USING (true);

-- Anyone can submit a report
CREATE POLICY "Anyone can report an event"
  ON public.event_reports FOR INSERT
  WITH CHECK (true);

-- Only admins/service role can view reports
CREATE POLICY "Service role can view reports"
  ON public.event_reports FOR SELECT
  USING (false); -- RLS prevents public reading of reports

-- Helper RPC function to atomically increment event view/save/share/ticket stats
CREATE OR REPLACE FUNCTION public.increment_event_stat(
  target_event_id UUID,
  stat_type TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.event_stats (event_id, views_count, saves_count, shares_count, ticket_clicks)
  VALUES (
    target_event_id,
    CASE WHEN stat_type = 'view' THEN 1 ELSE 0 END,
    CASE WHEN stat_type = 'save' THEN 1 ELSE 0 END,
    CASE WHEN stat_type = 'share' THEN 1 ELSE 0 END,
    CASE WHEN stat_type = 'ticket' THEN 1 ELSE 0 END
  )
  ON CONFLICT (event_id) DO UPDATE SET
    views_count = public.event_stats.views_count + CASE WHEN stat_type = 'view' THEN 1 ELSE 0 END,
    saves_count = public.event_stats.saves_count + CASE WHEN stat_type = 'save' THEN 1 ELSE 0 END,
    shares_count = public.event_stats.shares_count + CASE WHEN stat_type = 'share' THEN 1 ELSE 0 END,
    ticket_clicks = public.event_stats.ticket_clicks + CASE WHEN stat_type = 'ticket' THEN 1 ELSE 0 END,
    updated_at = timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
