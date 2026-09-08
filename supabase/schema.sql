-- Qalam — Supabase SQL Schema
-- Run this in your Supabase SQL Editor after creating your project
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for username lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);

-- ============================================================
-- POSTS
-- ============================================================
CREATE TYPE post_type AS ENUM (
  'poem', 'shayari', 'ghazal', 'haiku', 'free_verse', 'other'
);

CREATE TYPE post_status AS ENUM ('draft', 'published');

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT NOT NULL,
  type post_type NOT NULL DEFAULT 'poem',
  language TEXT NOT NULL DEFAULT 'English',
  tags TEXT[] NOT NULL DEFAULT '{}',
  cover_url TEXT,
  status post_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for feed queries
CREATE INDEX IF NOT EXISTS posts_author_idx ON posts(author_id);
CREATE INDEX IF NOT EXISTS posts_status_created_idx ON posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_tags_idx ON posts USING GIN(tags);
-- Full-text search
CREATE INDEX IF NOT EXISTS posts_search_idx ON posts USING GIN(
  to_tsvector('english', coalesce(title, '') || ' ' || body)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- LIKES
-- ============================================================
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS likes_post_idx ON likes(post_id);
CREATE INDEX IF NOT EXISTS likes_user_idx ON likes(user_id);

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comments_post_idx ON comments(post_id, created_at);

-- ============================================================
-- COMPETITIONS
-- ============================================================
CREATE TYPE competition_status AS ENUM ('upcoming', 'open', 'voting', 'closed');

CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type post_type,
  starts_at TIMESTAMPTZ NOT NULL,
  submissions_close_at TIMESTAMPTZ NOT NULL,
  voting_closes_at TIMESTAMPTZ NOT NULL,
  status competition_status NOT NULL DEFAULT 'upcoming',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMPETITION ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS competition_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(competition_id, post_id)
);

CREATE INDEX IF NOT EXISTS entries_competition_idx ON competition_entries(competition_id);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_one_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_two_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure only one conversation per pair (canonical order)
  UNIQUE(
    LEAST(user_one_id::TEXT, user_two_id::TEXT),
    GREATEST(user_one_id::TEXT, user_two_id::TEXT)
  )
);

CREATE INDEX IF NOT EXISTS conversations_user_one_idx ON conversations(user_one_id);
CREATE INDEX IF NOT EXISTS conversations_user_two_idx ON conversations(user_two_id);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id, created_at);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TYPE notification_type AS ENUM (
  'like', 'comment', 'message', 'competition_ended'
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_owner_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_owner_update" ON profiles FOR UPDATE USING (id = auth.uid());

-- POSTS
CREATE POLICY "posts_published_public_read" ON posts
  FOR SELECT USING (status = 'published' OR author_id = auth.uid());
CREATE POLICY "posts_owner_insert" ON posts FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "posts_owner_update" ON posts FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "posts_owner_delete" ON posts FOR DELETE USING (author_id = auth.uid());

-- LIKES
CREATE POLICY "likes_public_read" ON likes FOR SELECT USING (true);
CREATE POLICY "likes_authenticated_insert" ON likes
  FOR INSERT WITH CHECK (user_id = auth.uid() AND auth.role() = 'authenticated');
CREATE POLICY "likes_owner_delete" ON likes FOR DELETE USING (user_id = auth.uid());

-- COMMENTS
CREATE POLICY "comments_public_read" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_authenticated_insert" ON comments
  FOR INSERT WITH CHECK (author_id = auth.uid() AND auth.role() = 'authenticated');
CREATE POLICY "comments_owner_delete" ON comments FOR DELETE USING (author_id = auth.uid());

-- COMPETITIONS
CREATE POLICY "competitions_public_read" ON competitions FOR SELECT USING (true);
CREATE POLICY "competitions_admin_insert" ON competitions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
CREATE POLICY "competitions_admin_update" ON competitions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- COMPETITION ENTRIES
CREATE POLICY "entries_public_read" ON competition_entries FOR SELECT USING (true);
CREATE POLICY "entries_authenticated_insert" ON competition_entries
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid())
  );
CREATE POLICY "entries_owner_delete" ON competition_entries
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid())
  );

-- CONVERSATIONS
CREATE POLICY "conversations_participant_read" ON conversations
  FOR SELECT USING (user_one_id = auth.uid() OR user_two_id = auth.uid());
CREATE POLICY "conversations_authenticated_insert" ON conversations
  FOR INSERT WITH CHECK (
    (user_one_id = auth.uid() OR user_two_id = auth.uid()) AND
    auth.role() = 'authenticated'
  );

-- MESSAGES
CREATE POLICY "messages_participant_read" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
    )
  );
CREATE POLICY "messages_sender_insert" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
    )
  );
CREATE POLICY "messages_participant_update" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
    )
  );

-- NOTIFICATIONS
CREATE POLICY "notifications_owner_read" ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_owner_update" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- FUNCTION: Auto-create profile on new user sign-up
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_username TEXT;
BEGIN
  -- Generate username from email prefix + random suffix if needed
  generated_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
  -- Sanitize to alphanumeric + underscores
  generated_username := REGEXP_REPLACE(generated_username, '[^a-z0-9_]', '_', 'g');
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = generated_username) LOOP
    generated_username := generated_username || '_' || FLOOR(RANDOM() * 1000)::TEXT;
  END LOOP;

  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    generated_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNCTION: Create notification on like
-- ============================================================
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
  post_author UUID;
BEGIN
  SELECT author_id INTO post_author FROM posts WHERE id = NEW.post_id;
  -- Don't notify if you liked your own post
  IF post_author != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, payload)
    VALUES (
      post_author,
      'like',
      jsonb_build_object('post_id', NEW.post_id, 'from_user_id', NEW.user_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_created
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- ============================================================
-- FUNCTION: Create notification on comment
-- ============================================================
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_author UUID;
BEGIN
  SELECT author_id INTO post_author FROM posts WHERE id = NEW.post_id;
  IF post_author != NEW.author_id THEN
    INSERT INTO notifications (user_id, type, payload)
    VALUES (
      post_author,
      'comment',
      jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'from_user_id', NEW.author_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_created
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- ============================================================
-- STORAGE BUCKETS & POLICIES (avatars, covers)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS policies for avatars
DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;
CREATE POLICY "avatars_public_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_auth_insert" ON storage.objects;
CREATE POLICY "avatars_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "avatars_auth_update" ON storage.objects;
CREATE POLICY "avatars_auth_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "avatars_auth_delete" ON storage.objects;
CREATE POLICY "avatars_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Storage RLS policies for covers
DROP POLICY IF EXISTS "covers_public_select" ON storage.objects;
CREATE POLICY "covers_public_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'covers');

DROP POLICY IF EXISTS "covers_auth_insert" ON storage.objects;
CREATE POLICY "covers_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "covers_auth_update" ON storage.objects;
CREATE POLICY "covers_auth_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'covers' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "covers_auth_delete" ON storage.objects;
CREATE POLICY "covers_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'covers' AND auth.role() = 'authenticated');

