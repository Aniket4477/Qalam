-- Migration: Add theme column to posts table
-- Allows poets to assign distinct atmospheric themes (e.g. classic, parchment, midnight, romance, nature, sunset, mystic, noir) to their posts.

ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'classic';

-- Backfill theme from any tags that might have 'theme:<name>'
UPDATE public.posts
SET theme = replace(tag, 'theme:', '')
FROM (
  SELECT id, unnest(tags) AS tag
  FROM public.posts
) sub
WHERE public.posts.id = sub.id
  AND sub.tag LIKE 'theme:%'
  AND (public.posts.theme IS NULL OR public.posts.theme = 'classic');

-- Index for theme lookups
CREATE INDEX IF NOT EXISTS idx_posts_theme ON public.posts(theme);
