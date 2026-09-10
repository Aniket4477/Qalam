-- ============================================================
-- STORAGE BUCKET & POLICIES FOR CHAT MEDIA (Photos, Videos, Audio)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_media', 'chat_media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS policies for chat_media
-- Public bucket serves files directly via CDN URL; drop broad SELECT policy on storage.objects
DROP POLICY IF EXISTS "chat_media_public_select" ON storage.objects;

DROP POLICY IF EXISTS "chat_media_auth_insert" ON storage.objects;
CREATE POLICY "chat_media_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat_media' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "chat_media_auth_update" ON storage.objects;
CREATE POLICY "chat_media_auth_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'chat_media' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "chat_media_auth_delete" ON storage.objects;
CREATE POLICY "chat_media_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'chat_media' AND auth.role() = 'authenticated');
