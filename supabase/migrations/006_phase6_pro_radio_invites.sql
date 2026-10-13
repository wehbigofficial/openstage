-- Migration: 006_phase6_pro_radio_invites.sql
-- Description: Phase 6 - Artist Pro, Payments, Bio Page enhancements, Radio & Tracks review, Invites & Referrals, Detailed Artist Stats

-- 1. Create Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR' NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  paypal_id TEXT UNIQUE,
  paypal_payer_id TEXT,
  paypal_payer_email TEXT,
  payment_method TEXT DEFAULT 'paypal' NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_paypal_id ON public.payments(paypal_id);

-- 2. Enhance artists table
ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery_photos TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS video_embeds JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS pro_since TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pro_granted_by TEXT DEFAULT 'payment',
  ADD COLUMN IF NOT EXISTS featured_eligible BOOLEAN DEFAULT false NOT NULL;

-- 3. Create Radio Tracks table
CREATE TABLE IF NOT EXISTS public.radio_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  artist_name TEXT NOT NULL,
  title TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 180 NOT NULL,
  file_size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'taken_down')),
  rights_confirmed BOOLEAN DEFAULT false NOT NULL,
  rejection_reason TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  plays_count INTEGER DEFAULT 0 NOT NULL,
  likes_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_radio_tracks_status ON public.radio_tracks(status);
CREATE INDEX IF NOT EXISTS idx_radio_tracks_artist ON public.radio_tracks(artist_id);

-- 4. Create Radio Reports table
CREATE TABLE IF NOT EXISTS public.radio_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.radio_tracks(id) ON DELETE CASCADE,
  reporter_ip TEXT,
  reporter_email TEXT,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_radio_reports_track ON public.radio_reports(track_id);
CREATE INDEX IF NOT EXISTS idx_radio_reports_status ON public.radio_reports(status);

-- 5. Create Radio Likes table
CREATE TABLE IF NOT EXISTS public.radio_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.radio_tracks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_radio_likes_track ON public.radio_likes(track_id);

-- 6. Create Artist Referrals table
CREATE TABLE IF NOT EXISTS public.artist_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  invite_code TEXT NOT NULL,
  is_email_verified BOOLEAN DEFAULT false NOT NULL,
  has_published_event BOOLEAN DEFAULT false NOT NULL,
  is_qualified BOOLEAN DEFAULT false NOT NULL,
  is_revoked BOOLEAN DEFAULT false NOT NULL,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  qualified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_artist_referrals_referrer ON public.artist_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_artist_referrals_code ON public.artist_referrals(invite_code);

-- 7. Create Artist Stats table
CREATE TABLE IF NOT EXISTS public.artist_stats (
  artist_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_visits INTEGER DEFAULT 0 NOT NULL,
  radio_plays INTEGER DEFAULT 0 NOT NULL,
  likes_count INTEGER DEFAULT 0 NOT NULL,
  saves_count INTEGER DEFAULT 0 NOT NULL,
  reminders_count INTEGER DEFAULT 0 NOT NULL,
  ticket_clicks INTEGER DEFAULT 0 NOT NULL,
  top_cities JSONB DEFAULT '{}'::jsonb,
  views_history JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_stats ENABLE ROW LEVEL SECURITY;

-- 9. Policies

-- PAYMENTS
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages all payments"
  ON public.payments FOR ALL
  USING (false);

-- RADIO TRACKS
CREATE POLICY "Approved radio tracks are viewable by everyone"
  ON public.radio_tracks FOR SELECT
  USING (status = 'approved' OR auth.uid() = artist_id);

CREATE POLICY "Artists can insert own radio tracks"
  ON public.radio_tracks FOR INSERT
  WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Artists can update own radio tracks"
  ON public.radio_tracks FOR UPDATE
  USING (auth.uid() = artist_id);

CREATE POLICY "Artists can delete own radio tracks"
  ON public.radio_tracks FOR DELETE
  USING (auth.uid() = artist_id);

-- RADIO REPORTS
CREATE POLICY "Anyone can report a radio track"
  ON public.radio_reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role manages radio reports"
  ON public.radio_reports FOR ALL
  USING (false);

-- RADIO LIKES
CREATE POLICY "Anyone can like radio tracks"
  ON public.radio_likes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view radio likes count"
  ON public.radio_likes FOR SELECT
  USING (true);

-- ARTIST REFERRALS
CREATE POLICY "Artists can view own referrals"
  ON public.artist_referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Service role manages referrals"
  ON public.artist_referrals FOR ALL
  USING (false);

-- ARTIST STATS
CREATE POLICY "Public can read artist stats"
  ON public.artist_stats FOR SELECT
  USING (true);

CREATE POLICY "Service role manages artist stats"
  ON public.artist_stats FOR ALL
  USING (false);
