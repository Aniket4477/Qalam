-- Qalam — Group Conversations & Poetry Circles Migration
-- ============================================================

-- 1. GROUPS TABLE
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS groups_created_by_idx ON groups(created_by);
CREATE INDEX IF NOT EXISTS groups_created_at_idx ON groups(created_at DESC);

-- 2. GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin' | 'member'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS group_members_group_idx ON group_members(group_id);
CREATE INDEX IF NOT EXISTS group_members_user_idx ON group_members(user_id);

-- 3. GROUP MESSAGES TABLE
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS group_messages_group_idx ON group_messages(group_id, created_at ASC);
CREATE INDEX IF NOT EXISTS group_messages_sender_idx ON group_messages(sender_id);

-- 4. HELPER FUNCTION TO AVOID RLS RECURSION
CREATE OR REPLACE FUNCTION is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- GROUPS POLICIES
DROP POLICY IF EXISTS "groups_member_read" ON groups;
CREATE POLICY "groups_member_read" ON groups
  FOR SELECT USING (created_by = auth.uid() OR is_group_member(id, auth.uid()));

DROP POLICY IF EXISTS "groups_authenticated_insert" ON groups;
CREATE POLICY "groups_authenticated_insert" ON groups
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid());

DROP POLICY IF EXISTS "groups_admin_update" ON groups;
CREATE POLICY "groups_admin_update" ON groups
  FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "groups_admin_delete" ON groups;
CREATE POLICY "groups_admin_delete" ON groups
  FOR DELETE USING (created_by = auth.uid());

-- GROUP MEMBERS POLICIES
DROP POLICY IF EXISTS "group_members_read" ON group_members;
CREATE POLICY "group_members_read" ON group_members
  FOR SELECT USING (user_id = auth.uid() OR is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "group_members_insert" ON group_members;
CREATE POLICY "group_members_insert" ON group_members
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      user_id = auth.uid() OR
      is_group_member(group_id, auth.uid()) OR
      EXISTS (SELECT 1 FROM groups WHERE id = group_id AND created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "group_members_delete" ON group_members;
CREATE POLICY "group_members_delete" ON group_members
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM groups WHERE id = group_id AND created_by = auth.uid())
  );

-- GROUP MESSAGES POLICIES
DROP POLICY IF EXISTS "group_messages_read" ON group_messages;
CREATE POLICY "group_messages_read" ON group_messages
  FOR SELECT USING (is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "group_messages_insert" ON group_messages;
CREATE POLICY "group_messages_insert" ON group_messages
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    sender_id = auth.uid() AND
    is_group_member(group_id, auth.uid())
  );

-- 6. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
