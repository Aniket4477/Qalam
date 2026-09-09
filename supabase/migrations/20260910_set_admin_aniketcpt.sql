-- ============================================================
-- MAKE @aniketcpt ADMINISTRATOR
-- ============================================================

-- 1. Ensure the is_admin column exists on profiles
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- 2. Set is_admin = TRUE for username 'aniketcpt' (case-insensitive)
UPDATE public.profiles
SET is_admin = TRUE
WHERE LOWER(username) = 'aniketcpt';

-- 3. In case the username was formatted differently, also match display_name if needed
UPDATE public.profiles
SET is_admin = TRUE
WHERE LOWER(display_name) = 'aniketdrafts';

-- 4. Verify admin RLS policy on competitions
DROP POLICY IF EXISTS "competitions_admin_insert" ON public.competitions;
CREATE POLICY "competitions_admin_insert" ON public.competitions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

DROP POLICY IF EXISTS "competitions_admin_update" ON public.competitions;
CREATE POLICY "competitions_admin_update" ON public.competitions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

DROP POLICY IF EXISTS "competitions_admin_delete" ON public.competitions;
CREATE POLICY "competitions_admin_delete" ON public.competitions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
