-- ============================================================
-- FIX ALL SUPABASE SECURITY & LINTER WARNINGS
-- ============================================================

-- ------------------------------------------------------------
-- 1. FIX: Extension in Public (public.pg_trgm, public.uuid-ossp)
-- Move extensions to the 'extensions' schema
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
-- 2. FIX: Function Search Path Mutable (public.update_updated_at)
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
-- 3. FIX: Public Bucket Allows Listing (storage.avatars, storage.chat_media, storage.covers)
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
-- Revoke execution privileges from PUBLIC/anon/authenticated on trigger functions
-- ------------------------------------------------------------

-- handle_new_user() (triggered on auth.users insert, must not be directly callable)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- notify_on_like() (triggered on likes insert)
REVOKE EXECUTE ON FUNCTION public.notify_on_like() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.notify_on_like() SET search_path = public;

-- notify_on_comment() (triggered on comments insert)
REVOKE EXECUTE ON FUNCTION public.notify_on_comment() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.notify_on_comment() SET search_path = public;

-- notify_on_message() (triggered on messages insert)
REVOKE EXECUTE ON FUNCTION public.notify_on_message() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.notify_on_message() SET search_path = public;

-- is_group_member() & is_group_admin() (RLS helpers; restrict from PUBLIC and anon)
REVOKE EXECUTE ON FUNCTION public.is_group_member(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_group_member(UUID, UUID) TO authenticated;
ALTER FUNCTION public.is_group_member(UUID, UUID) SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.is_group_admin(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_group_admin(UUID, UUID) TO authenticated;
ALTER FUNCTION public.is_group_admin(UUID, UUID) SET search_path = public;

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
END $$;
