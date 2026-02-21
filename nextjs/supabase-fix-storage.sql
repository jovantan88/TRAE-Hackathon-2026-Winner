-- ============================================
-- FIX: Make storage buckets public so getPublicUrl() works
-- Run this in your Supabase SQL Editor
-- ============================================

-- Update all buckets to be public
UPDATE storage.buckets SET public = true WHERE id IN (
  'body-photos', 'model-images', 'wardrobe-originals', 'wardrobe-segmented', 'try-on-results'
);

-- Drop the old restrictive SELECT policies and replace with public read access
DO $$
DECLARE
  bucket_name TEXT;
BEGIN
  FOR bucket_name IN SELECT unnest(ARRAY['body-photos', 'model-images', 'wardrobe-originals', 'wardrobe-segmented', 'try-on-results'])
  LOOP
    -- Drop the old "Users can view own files" policy if it exists
    BEGIN
      EXECUTE format(
        'DROP POLICY IF EXISTS "Users can view own files in %s" ON storage.objects',
        bucket_name
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    -- Create public read policy
    BEGIN
      EXECUTE format(
        'CREATE POLICY "Anyone can view files in %s" ON storage.objects FOR SELECT USING (bucket_id = %L)',
        bucket_name, bucket_name
      );
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END $$;
