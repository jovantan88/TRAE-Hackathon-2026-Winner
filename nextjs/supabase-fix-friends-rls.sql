-- Fix RLS for friends table
-- The previous policy only allowed inserting if auth.uid() = user_id_1
-- But we also need to allow inserting if auth.uid() = user_id_2 (though the UI sets user_id_1 to current user)
-- Let's make sure the policy is correct

DROP POLICY IF EXISTS "Users can create friendships" ON public.friends;

CREATE POLICY "Users can create friendships"
    ON public.friends FOR INSERT
    WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
