-- Migration: 001_phase1_init.sql
-- Description: Phase 1 tables (profiles, artists, venues, events, settings) with Row Level Security (RLS)

-- 1. Create custom types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('artist', 'venue', 'fan');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('draft', 'published', 'hidden', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  city TEXT,
  country TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create artists table
CREATE TABLE IF NOT EXISTS public.artists (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  genre TEXT,
  bio TEXT,
  is_pro BOOLEAN DEFAULT false NOT NULL
);

-- 4. Create venues table
CREATE TABLE IF NOT EXISTS public.venues (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_verified BOOLEAN DEFAULT false NOT NULL
);

-- 5. Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist_name TEXT,
  venue_name TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  approximate_location BOOLEAN DEFAULT false NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'UTC' NOT NULL,
  genre TEXT,
  event_type TEXT,
  image_url TEXT,
  description TEXT,
  ticket_url TEXT,
  price_text TEXT,
  is_free BOOLEAN DEFAULT false NOT NULL,
  lineup TEXT[],
  links JSONB DEFAULT '{}'::jsonb,
  status event_status DEFAULT 'draft' NOT NULL,
  is_featured BOOLEAN DEFAULT false NOT NULL,
  is_unclaimed BOOLEAN DEFAULT false NOT NULL,
  is_demo BOOLEAN DEFAULT false NOT NULL,
  series_id UUID,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Trigger to automatically handle newly confirmed user email and publish draft events
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    -- Publish events that were waiting for email verification
    UPDATE public.events
    SET status = 'published'
    WHERE owner_id = NEW.id AND status = 'draft';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_email_confirmed();

-- 8. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies

-- PROFILES
-- Anyone can view public profiles
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- ARTISTS
CREATE POLICY "Artists are viewable by everyone" 
  ON public.artists FOR SELECT 
  USING (true);

CREATE POLICY "Artists can insert own row" 
  ON public.artists FOR INSERT 
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Artists can update own row" 
  ON public.artists FOR UPDATE 
  USING (auth.uid() = profile_id);

-- VENUES
CREATE POLICY "Venues are viewable by everyone" 
  ON public.venues FOR SELECT 
  USING (true);

CREATE POLICY "Venues can insert own row" 
  ON public.venues FOR INSERT 
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Venues can update own row" 
  ON public.venues FOR UPDATE 
  USING (auth.uid() = profile_id);

-- EVENTS
-- Anyone can view published events
CREATE POLICY "Published events are viewable by everyone" 
  ON public.events FOR SELECT 
  USING (status = 'published' OR auth.uid() = owner_id);

-- Owners can insert events (email confirmation check enforced at publication or trigger level)
CREATE POLICY "Users can insert events" 
  ON public.events FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own events" 
  ON public.events FOR UPDATE 
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own events" 
  ON public.events FOR DELETE 
  USING (auth.uid() = owner_id);

-- SETTINGS
-- Everyone can read settings
CREATE POLICY "Settings are viewable by everyone" 
  ON public.settings FOR SELECT 
  USING (true);

-- Insert default settings
INSERT INTO public.settings (key, value)
VALUES 
  ('platform', '{"maintenance": false, "version": "1.0.0"}'::jsonb),
  ('events', '{"max_free_events": 100, "featured_price_cents": 0}'::jsonb)
ON CONFLICT (key) DO NOTHING;
