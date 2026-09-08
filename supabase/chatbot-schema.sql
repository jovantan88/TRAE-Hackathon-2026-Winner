-- ============================================
-- CHATBOT TABLES
-- ============================================

-- Chat conversations table
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_conversations_user_id ON public.chat_conversations(user_id);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);

-- Travel searches / saved destinations
CREATE TABLE public.travel_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  search_date DATE NOT NULL,
  weather_data JSONB,
  research_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_travel_searches_user_id ON public.travel_searches(user_id);
CREATE INDEX idx_travel_searches_location ON public.travel_searches(location);

-- Favorite outfits for travel
CREATE TABLE public.travel_outfits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  travel_search_id UUID REFERENCES public.travel_searches(id) ON DELETE SET NULL,
  location TEXT NOT NULL,
  occasion TEXT,
  weather_summary JSONB,
  outfit_items JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_travel_outfits_user_id ON public.travel_outfits(user_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_outfits ENABLE ROW LEVEL SECURITY;

-- Chat Conversations
CREATE POLICY "Users can view own chat conversations"
  ON public.chat_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat conversations"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat conversations"
  ON public.chat_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat conversations"
  ON public.chat_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Chat Messages
CREATE POLICY "Users can view own chat messages"
  ON public.chat_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own chat messages"
  ON public.chat_messages FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
    )
  );

-- Travel Searches
CREATE POLICY "Users can view own travel searches"
  ON public.travel_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own travel searches"
  ON public.travel_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own travel searches"
  ON public.travel_searches FOR DELETE
  USING (auth.uid() = user_id);

-- Travel Outfits
CREATE POLICY "Users can view own travel outfits"
  ON public.travel_outfits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own travel outfits"
  ON public.travel_outfits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own travel outfits"
  ON public.travel_outfits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own travel outfits"
  ON public.travel_outfits FOR DELETE
  USING (auth.uid() = user_id);
