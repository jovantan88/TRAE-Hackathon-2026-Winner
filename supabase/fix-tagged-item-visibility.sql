-- ============================================
-- Fix tagged clothing item visibility in feed
-- Run this in Supabase SQL Editor
-- ============================================

-- Allow users to read try_on_items that belong to shared posts.
DROP POLICY IF EXISTS "Users can view own try-on items" ON public.try_on_items;
DROP POLICY IF EXISTS "Users can view own or shared try-on items" ON public.try_on_items;

CREATE POLICY "Users can view own or shared try-on items"
  ON public.try_on_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.try_on_results tor
      WHERE tor.id = public.try_on_items.try_on_id
      AND tor.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.try_on_id = public.try_on_items.try_on_id
    )
  );

-- Allow users to read wardrobe items that are tagged in shared posts.
DROP POLICY IF EXISTS "Users can view own wardrobe" ON public.wardrobe_items;
DROP POLICY IF EXISTS "Users can view own or shared tagged wardrobe" ON public.wardrobe_items;

CREATE POLICY "Users can view own or shared tagged wardrobe"
  ON public.wardrobe_items FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.try_on_items ti
      JOIN public.posts p ON p.try_on_id = ti.try_on_id
      WHERE ti.wardrobe_item_id = public.wardrobe_items.id
    )
  );
