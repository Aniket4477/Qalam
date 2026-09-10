-- ============================================================
-- COMPETITION VOTES TABLE & POLICIES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.competition_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES public.competition_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(competition_id, entry_id, user_id)
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS competition_votes_entry_idx ON public.competition_votes(entry_id);
CREATE INDEX IF NOT EXISTS competition_votes_comp_idx ON public.competition_votes(competition_id);
CREATE INDEX IF NOT EXISTS competition_votes_user_idx ON public.competition_votes(user_id);

-- Enable Row Level Security
ALTER TABLE public.competition_votes ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can view votes
DROP POLICY IF EXISTS "competition_votes_select_policy" ON public.competition_votes;
CREATE POLICY "competition_votes_select_policy" ON public.competition_votes
  FOR SELECT USING (true);

-- 2. Authenticated users can vote (as themselves)
DROP POLICY IF EXISTS "competition_votes_insert_policy" ON public.competition_votes;
CREATE POLICY "competition_votes_insert_policy" ON public.competition_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Users can delete their own votes (unvote)
DROP POLICY IF EXISTS "competition_votes_delete_policy" ON public.competition_votes;
CREATE POLICY "competition_votes_delete_policy" ON public.competition_votes
  FOR DELETE USING (auth.uid() = user_id);
