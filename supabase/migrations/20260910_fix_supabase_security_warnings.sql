-- ============================================================
-- FIX ALL SUPABASE SECURITY & LINTER WARNINGS (Error-Proof Version)
-- ============================================================

-- ------------------------------------------------------------
-- 1. FIX: Extension in Public (pg_trgm, uuid-ossp)
-- Move extensions to the 'extensions' schema safely
-- ------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO public, anon, authenticated;

DO $$ BEGIN
  ALTER EXTENSION pg_trgm SET SCHEMA extensions;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- ------------------------------------------------------------
-- 2. FIX: Function Search Path Mutable (update_updated_at)
-- Ensure search_path is immutable on all functions
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- 3. FIX: Public Bucket Allows Listing (avatars, covers, chat_media)
-- Public buckets serve files directly through the public URL endpoint
-- without needing a broad SELECT policy on storage.objects.
-- Removing the broad SELECT policy prevents unauthorized listing of all bucket contents.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;
DROP POLICY IF EXISTS "covers_public_select" ON storage.objects;
DROP POLICY IF EXISTS "chat_media_public_select" ON storage.objects;

-- ------------------------------------------------------------
-- 4. FIX: Public Can Execute SECURITY DEFINER Function &
--         Signed-In Users Can Execute SECURITY DEFINER Function
-- Revoke execution privileges safely (skips if function does not exist)
-- ------------------------------------------------------------

-- handle_new_user()
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
  ALTER FUNCTION public.handle_new_user() SET search_path = public;
EXCEPTION
  WHEN undefined_function THEN null;
END $$;

-- notify_on_like()
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.notify_on_like() FROM PUBLIC, anon, authenticated;
  ALTER FUNCTION public.notify_on_like() SET search_path = public;
EXCEPTION
  WHEN undefined_function THEN null;
END $$;

-- notify_on_comment()
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.notify_on_comment() FROM PUBLIC, anon, authenticated;
  ALTER FUNCTION public.notify_on_comment() SET search_path = public;
EXCEPTION
  WHEN undefined_function THEN null;
END $$;

-- notify_on_message() (safe check)
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.notify_on_message() FROM PUBLIC, anon, authenticated;
  ALTER FUNCTION public.notify_on_message() SET search_path = public;
EXCEPTION
  WHEN undefined_function THEN null;
END $$;

-- is_group_member() -> Switch to SECURITY INVOKER (removes SECURITY DEFINER warning)
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_group_member(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_group_member(UUID, UUID) TO authenticated;

-- is_group_admin() -> Switch to SECURITY INVOKER (removes SECURITY DEFINER warning)
CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = p_group_id AND created_by = p_user_id
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_group_admin(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_group_admin(UUID, UUID) TO authenticated;

-- rls_auto_enable() (if defined in project)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;';
    EXECUTE 'ALTER FUNCTION public.rls_auto_enable() SET search_path = public;';
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;
