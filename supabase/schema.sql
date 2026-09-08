-- ============================================
-- AI Virtual Wardrobe - Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  has_completed_onboarding BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- USER MODELS TABLE (AI-generated body models)
-- ============================================
CREATE TABLE public.user_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_photo_url TEXT NOT NULL,
  model_image_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_models_user_id ON public.user_models(user_id);

-- ============================================
-- WARDROBE ITEMS TABLE
-- ============================================
CREATE TYPE clothing_category AS ENUM (
  'tops', 'bottoms', 'dresses', 'outerwear',
  'shoes', 'accessories', 'activewear', 'other'
);

CREATE TABLE public.wardrobe_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category clothing_category NOT NULL DEFAULT 'other',
  original_image_url TEXT NOT NULL,
  segmented_image_url TEXT,
  color TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wardrobe_items_user_id ON public.wardrobe_items(user_id);
CREATE INDEX idx_wardrobe_items_category ON public.wardrobe_items(category);

-- ============================================
-- TRY-ON RESULTS TABLE
-- ============================================
CREATE TABLE public.try_on_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES public.user_models(id) ON DELETE CASCADE,
  result_image_url TEXT NOT NULL,
  prompt_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_try_on_results_user_id ON public.try_on_results(user_id);

-- Junction table: which wardrobe items were used in a try-on
CREATE TABLE public.try_on_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  try_on_id UUID NOT NULL REFERENCES public.try_on_results(id) ON DELETE CASCADE,
  wardrobe_item_id UUID NOT NULL REFERENCES public.wardrobe_items(id) ON DELETE CASCADE,
  UNIQUE(try_on_id, wardrobe_item_id)
);

-- ============================================
-- FAVORITES TABLE
-- ============================================
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  try_on_id UUID NOT NULL REFERENCES public.try_on_results(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, try_on_id)
);

CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.try_on_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.try_on_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- User Models
CREATE POLICY "Users can view own models"
  ON public.user_models FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own models"
  ON public.user_models FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own models"
  ON public.user_models FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own models"
  ON public.user_models FOR DELETE
  USING (auth.uid() = user_id);

-- Wardrobe Items
CREATE POLICY "Users can view own wardrobe"
  ON public.wardrobe_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wardrobe items"
  ON public.wardrobe_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wardrobe items"
  ON public.wardrobe_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wardrobe items"
  ON public.wardrobe_items FOR DELETE
  USING (auth.uid() = user_id);

-- Try-on Results
CREATE POLICY "Users can view own try-on results"
  ON public.try_on_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own try-on results"
  ON public.try_on_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own try-on results"
  ON public.try_on_results FOR DELETE
  USING (auth.uid() = user_id);

-- Try-on Items
CREATE POLICY "Users can view own try-on items"
  ON public.try_on_items FOR SELECT
  USING (
    try_on_id IN (
      SELECT id FROM public.try_on_results WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own try-on items"
  ON public.try_on_items FOR INSERT
  WITH CHECK (
    try_on_id IN (
      SELECT id FROM public.try_on_results WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own try-on items"
  ON public.try_on_items FOR DELETE
  USING (
    try_on_id IN (
      SELECT id FROM public.try_on_results WHERE user_id = auth.uid()
    )
  );

-- Favorites
CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('body-photos', 'body-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('model-images', 'model-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('wardrobe-originals', 'wardrobe-originals', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('wardrobe-segmented', 'wardrobe-segmented', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('try-on-results', 'try-on-results', true);

-- Storage policies for all buckets
-- Since buckets are public, anyone can read but only authenticated owners can write/delete
DO $$
DECLARE
  bucket_name TEXT;
BEGIN
  FOR bucket_name IN SELECT unnest(ARRAY['body-photos', 'model-images', 'wardrobe-originals', 'wardrobe-segmented', 'try-on-results'])
  LOOP
    EXECUTE format(
      'CREATE POLICY "Users can upload to %s" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)',
      bucket_name, bucket_name
    );
    EXECUTE format(
      'CREATE POLICY "Anyone can view files in %s" ON storage.objects FOR SELECT USING (bucket_id = %L)',
      bucket_name, bucket_name
    );
    EXECUTE format(
      'CREATE POLICY "Users can delete own files in %s" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)',
      bucket_name, bucket_name
    );
  END LOOP;
END $$;
