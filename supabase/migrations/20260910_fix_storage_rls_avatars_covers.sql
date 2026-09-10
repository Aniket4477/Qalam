-- ============================================================
-- FIX STORAGE RLS POLICIES FOR AVATARS & COVERS
-- Resolves "new row violates row-level security policy"
-- ============================================================

-- 1. Ensure buckets exist and are marked public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing conflicting policies for avatars
DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;
DROP POLICY IF EXISTS "avatars_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_auth_delete" ON storage.objects;

-- 3. Create comprehensive policies for avatars
CREATE POLICY "avatars_public_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars');

-- 4. Drop existing conflicting policies for covers
DROP POLICY IF EXISTS "covers_public_select" ON storage.objects;
DROP POLICY IF EXISTS "covers_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "covers_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "covers_auth_delete" ON storage.objects;

-- 5. Create comprehensive policies for covers
CREATE POLICY "covers_public_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'covers');

CREATE POLICY "covers_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'covers');

CREATE POLICY "covers_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'covers')
  WITH CHECK (bucket_id = 'covers');

CREATE POLICY "covers_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'covers');
