-- Create friends table
CREATE TABLE IF NOT EXISTS public.friends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id_1, user_id_2)
);

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    try_on_id UUID NOT NULL REFERENCES public.try_on_results(id) ON DELETE CASCADE,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friends
CREATE POLICY "Users can view their own friendships"
    ON public.friends FOR SELECT
    USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can create friendships"
    ON public.friends FOR INSERT
    WITH CHECK (auth.uid() = user_id_1);

CREATE POLICY "Users can update their own friendships"
    ON public.friends FOR UPDATE
    USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can delete their own friendships"
    ON public.friends FOR DELETE
    USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- RLS Policies for posts
CREATE POLICY "Anyone can view posts"
    ON public.posts FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own posts"
    ON public.posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
    ON public.posts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
    ON public.posts FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for post_likes
CREATE POLICY "Anyone can view post likes"
    ON public.post_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can like posts"
    ON public.post_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
    ON public.post_likes FOR DELETE
    USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER handle_updated_at_friends
    BEFORE UPDATE ON public.friends
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_posts
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
