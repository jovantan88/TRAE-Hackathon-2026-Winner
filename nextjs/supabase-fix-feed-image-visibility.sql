-- ============================================
-- Fix community feed image visibility
-- Run this in Supabase SQL Editor
-- ============================================

-- Allow users to read try-on results that are shared in public posts.
DROP POLICY IF EXISTS "Users can view own try-on results" ON public.try_on_results;
DROP POLICY IF EXISTS "Users can view own or shared try-on results" ON public.try_on_results;

CREATE POLICY "Users can view own or shared try-on results"
  ON public.try_on_results FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.try_on_id = public.try_on_results.id
    )
  );
