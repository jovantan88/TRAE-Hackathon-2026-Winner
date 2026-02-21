-- ============================================
-- Fix friend search by email/full_name
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable trigram extension for faster ILIKE searches.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Helpful indexes for friend search UI.
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm
  ON public.profiles USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_email_trgm
  ON public.profiles USING gin (email gin_trgm_ops);

-- Allow authenticated users to discover profiles for social features.
-- Keep this limited to SELECT; updates are still owner-only.
DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view basic profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
