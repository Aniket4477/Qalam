-- Qalam — Supabase SQL Schema
-- Run this in your Supabase SQL Editor after creating your project
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search

-- ============================================================
-- ENUM TYPES (Idempotent)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE post_type AS ENUM (
    'poem', 'shayari', 'ghazal', 'haiku', 'free_verse', 'quote', 'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE post_status AS ENUM ('draft', 'published');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE competition_status AS ENUM ('upcoming', 'open', 'voting', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'like', 'comment', 'message', 'competition_ended'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

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
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_updated_at ON posts;
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
-- COMPETITION VOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS competition_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES competition_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(competition_id, entry_id, user_id)
);

CREATE INDEX IF NOT EXISTS competition_votes_entry_idx ON competition_votes(entry_id);
CREATE INDEX IF NOT EXISTS competition_votes_comp_idx ON competition_votes(competition_id);
CREATE INDEX IF NOT EXISTS competition_votes_user_idx ON competition_votes(user_id);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_one_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_two_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure only one conversation per pair (canonical order via unique index)
CREATE UNIQUE INDEX IF NOT EXISTS conversations_user_pair_idx ON conversations (
  (LEAST(user_one_id, user_two_id)),
  (GREATEST(user_one_id, user_two_id))
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

-- PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_owner_insert" ON profiles;
CREATE POLICY "profiles_owner_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_owner_update" ON profiles;
CREATE POLICY "profiles_owner_update" ON profiles FOR UPDATE USING (id = auth.uid());

-- POSTS POLICIES
DROP POLICY IF EXISTS "posts_published_public_read" ON posts;
CREATE POLICY "posts_published_public_read" ON posts
  FOR SELECT USING (status = 'published' OR author_id = auth.uid());

DROP POLICY IF EXISTS "posts_owner_insert" ON posts;
CREATE POLICY "posts_owner_insert" ON posts FOR INSERT WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "posts_owner_update" ON posts;
CREATE POLICY "posts_owner_update" ON posts FOR UPDATE USING (author_id = auth.uid());

DROP POLICY IF EXISTS "posts_owner_delete" ON posts;
CREATE POLICY "posts_owner_delete" ON posts FOR DELETE USING (author_id = auth.uid());

-- LIKES POLICIES
DROP POLICY IF EXISTS "likes_public_read" ON likes;
CREATE POLICY "likes_public_read" ON likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "likes_authenticated_insert" ON likes;
CREATE POLICY "likes_authenticated_insert" ON likes
  FOR INSERT WITH CHECK (user_id = auth.uid() AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "likes_owner_delete" ON likes;
CREATE POLICY "likes_owner_delete" ON likes FOR DELETE USING (user_id = auth.uid());

-- COMMENTS POLICIES
DROP POLICY IF EXISTS "comments_public_read" ON comments;
CREATE POLICY "comments_public_read" ON comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "comments_authenticated_insert" ON comments;
CREATE POLICY "comments_authenticated_insert" ON comments
  FOR INSERT WITH CHECK (author_id = auth.uid() AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "comments_owner_delete" ON comments;
CREATE POLICY "comments_owner_delete" ON comments FOR DELETE USING (author_id = auth.uid());

-- COMPETITIONS POLICIES
DROP POLICY IF EXISTS "competitions_public_read" ON competitions;
CREATE POLICY "competitions_public_read" ON competitions FOR SELECT USING (true);

DROP POLICY IF EXISTS "competitions_admin_insert" ON competitions;
CREATE POLICY "competitions_admin_insert" ON competitions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

DROP POLICY IF EXISTS "competitions_admin_update" ON competitions;
CREATE POLICY "competitions_admin_update" ON competitions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- COMPETITION ENTRIES POLICIES
DROP POLICY IF EXISTS "entries_public_read" ON competition_entries;
CREATE POLICY "entries_public_read" ON competition_entries FOR SELECT USING (true);

DROP POLICY IF EXISTS "entries_authenticated_insert" ON competition_entries;
CREATE POLICY "entries_authenticated_insert" ON competition_entries
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid())
  );

DROP POLICY IF EXISTS "entries_owner_delete" ON competition_entries;
CREATE POLICY "entries_owner_delete" ON competition_entries
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid())
  );

-- CONVERSATIONS POLICIES
DROP POLICY IF EXISTS "conversations_participant_read" ON conversations;
CREATE POLICY "conversations_participant_read" ON conversations
  FOR SELECT USING (user_one_id = auth.uid() OR user_two_id = auth.uid());

DROP POLICY IF EXISTS "conversations_authenticated_insert" ON conversations;
CREATE POLICY "conversations_authenticated_insert" ON conversations
  FOR INSERT WITH CHECK (
    (user_one_id = auth.uid() OR user_two_id = auth.uid()) AND
    auth.role() = 'authenticated'
  );

-- MESSAGES POLICIES
DROP POLICY IF EXISTS "messages_participant_read" ON messages;
CREATE POLICY "messages_participant_read" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_sender_insert" ON messages;
CREATE POLICY "messages_sender_insert" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_participant_update" ON messages;
CREATE POLICY "messages_participant_update" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
    )
  );

-- NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "notifications_owner_read" ON notifications;
CREATE POLICY "notifications_owner_read" ON notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_owner_update" ON notifications;
CREATE POLICY "notifications_owner_update" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- FUNCTION: Auto-create profile on new user sign-up
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated_username TEXT;
  user_display_name TEXT;
  user_avatar TEXT;
BEGIN
  -- Determine display name
  user_display_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    SPLIT_PART(NEW.email, '@', 1),
    'User'
  );

  -- Determine avatar if provided (e.g. by Google OAuth)
  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );

  -- Generate username from email or display name
  generated_username := LOWER(
    COALESCE(
      NULLIF(SPLIT_PART(NEW.email, '@', 1), ''),
      REGEXP_REPLACE(user_display_name, '[^a-zA-Z0-9_]', '', 'g'),
      'user'
    )
  );

  -- Sanitize to alphanumeric + underscores
  generated_username := REGEXP_REPLACE(generated_username, '[^a-z0-9_]', '_', 'g');

  IF generated_username IS NULL OR generated_username = '' THEN
    generated_username := 'user_' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 8);
  END IF;

  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = generated_username) LOOP
    generated_username := generated_username || '_' || FLOOR(RANDOM() * 1000)::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    generated_username,
    user_display_name,
    user_avatar
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FUNCTION: Create notification on like
-- ============================================================
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author UUID;
BEGIN
  SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.post_id;
  -- Don't notify if you liked your own post
  IF post_author != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES (
      post_author,
      'like',
      jsonb_build_object('post_id', NEW.post_id, 'from_user_id', NEW.user_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_like_created ON likes;
CREATE TRIGGER on_like_created
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- ============================================================
-- FUNCTION: Create notification on comment
-- ============================================================
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author UUID;
BEGIN
  SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.post_id;
  IF post_author != NEW.author_id THEN
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES (
      post_author,
      'comment',
      jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'from_user_id', NEW.author_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_created ON comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- ============================================================
-- FUNCTION: Create notification on message
-- ============================================================
CREATE OR REPLACE FUNCTION notify_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv RECORD;
  recipient UUID;
BEGIN
  SELECT user_one_id, user_two_id INTO conv FROM public.conversations WHERE id = NEW.conversation_id;
  IF conv.user_one_id = NEW.sender_id THEN
    recipient := conv.user_two_id;
  ELSE
    recipient := conv.user_one_id;
  END IF;

  IF recipient IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES (
      recipient,
      'message',
      jsonb_build_object('conversation_id', NEW.conversation_id, 'from_user_id', NEW.sender_id, 'message_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_created ON messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_on_message();

-- ============================================================
-- STORAGE BUCKETS & POLICIES (avatars, covers)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS policies for avatars (public bucket serves via CDN URL; drop broad listing SELECT)
DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;

DROP POLICY IF EXISTS "avatars_auth_insert" ON storage.objects;
CREATE POLICY "avatars_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "avatars_auth_update" ON storage.objects;
CREATE POLICY "avatars_auth_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "avatars_auth_delete" ON storage.objects;
CREATE POLICY "avatars_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Storage RLS policies for covers (public bucket serves via CDN URL; drop broad listing SELECT)
DROP POLICY IF EXISTS "covers_public_select" ON storage.objects;

DROP POLICY IF EXISTS "covers_auth_insert" ON storage.objects;
CREATE POLICY "covers_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "covers_auth_update" ON storage.objects;
CREATE POLICY "covers_auth_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'covers' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "covers_auth_delete" ON storage.objects;
CREATE POLICY "covers_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'covers' AND auth.role() = 'authenticated');

-- ============================================================
-- FOLLOWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS follows_follower_idx ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON public.follows(following_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_public_read" ON public.follows;
CREATE POLICY "follows_public_read" ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "follows_auth_insert" ON public.follows;
CREATE POLICY "follows_auth_insert" ON public.follows
  FOR INSERT WITH CHECK (follower_id = auth.uid() AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "follows_owner_delete" ON public.follows;
CREATE POLICY "follows_owner_delete" ON public.follows
  FOR DELETE USING (follower_id = auth.uid());

-- ============================================================
-- GROUPS & GROUP MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS groups_created_by_idx ON public.groups(created_by);
CREATE INDEX IF NOT EXISTS groups_created_at_idx ON public.groups(created_at DESC);

CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS group_members_group_idx ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS group_members_user_idx ON public.group_members(user_id);

CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS group_messages_group_idx ON public.group_messages(group_id, created_at ASC);
CREATE INDEX IF NOT EXISTS group_messages_sender_idx ON public.group_messages(sender_id);

CREATE OR REPLACE FUNCTION is_group_member(p_group_id UUID, p_user_id UUID)
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

CREATE OR REPLACE FUNCTION is_group_admin(p_group_id UUID, p_user_id UUID)
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

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "groups_member_read" ON public.groups;
CREATE POLICY "groups_member_read" ON public.groups
  FOR SELECT USING (created_by = auth.uid() OR is_group_member(id, auth.uid()));

DROP POLICY IF EXISTS "groups_authenticated_insert" ON public.groups;
CREATE POLICY "groups_authenticated_insert" ON public.groups
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid());

DROP POLICY IF EXISTS "groups_admin_update" ON public.groups;
CREATE POLICY "groups_admin_update" ON public.groups
  FOR UPDATE USING (is_group_admin(id, auth.uid()));

DROP POLICY IF EXISTS "groups_admin_delete" ON public.groups;
CREATE POLICY "groups_admin_delete" ON public.groups
  FOR DELETE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "group_members_read" ON public.group_members;
CREATE POLICY "group_members_read" ON public.group_members
  FOR SELECT USING (user_id = auth.uid() OR is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "group_members_insert" ON public.group_members;
CREATE POLICY "group_members_insert" ON public.group_members
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      user_id = auth.uid() OR
      is_group_admin(group_id, auth.uid()) OR
      is_group_member(group_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "group_members_update" ON public.group_members;
CREATE POLICY "group_members_update" ON public.group_members
  FOR UPDATE USING (is_group_admin(group_id, auth.uid()));

DROP POLICY IF EXISTS "group_members_delete" ON public.group_members;
CREATE POLICY "group_members_delete" ON public.group_members
  FOR DELETE USING (
    user_id = auth.uid() OR
    is_group_admin(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "group_messages_read" ON public.group_messages;
CREATE POLICY "group_messages_read" ON public.group_messages
  FOR SELECT USING (is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "group_messages_insert" ON public.group_messages;
CREATE POLICY "group_messages_insert" ON public.group_messages
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    sender_id = auth.uid() AND
    is_group_member(group_id, auth.uid())
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

