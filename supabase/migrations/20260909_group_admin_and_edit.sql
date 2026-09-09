-- Qalam — Group Admin Permissions & Group Edit Migration
-- ============================================================

-- 1. Helper function to check if user is a group admin or creator
CREATE OR REPLACE FUNCTION is_group_admin(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
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

-- 2. Allow any group admin to update group details (name, description, avatar_url)
DROP POLICY IF EXISTS "groups_admin_update" ON public.groups;
CREATE POLICY "groups_admin_update" ON public.groups
  FOR UPDATE USING (is_group_admin(id, auth.uid()));

-- 3. Allow group admins to update member roles (promote/demote to admin)
DROP POLICY IF EXISTS "group_members_update" ON public.group_members;
CREATE POLICY "group_members_update" ON public.group_members
  FOR UPDATE USING (is_group_admin(group_id, auth.uid()));

-- 4. Allow group admins to remove members (or users to leave themselves)
DROP POLICY IF EXISTS "group_members_delete" ON public.group_members;
CREATE POLICY "group_members_delete" ON public.group_members
  FOR DELETE USING (
    user_id = auth.uid() OR
    is_group_admin(group_id, auth.uid())
  );

-- 5. Allow group admins and existing members to add new members
DROP POLICY IF EXISTS "group_members_insert" ON public.group_members;
CREATE POLICY "group_members_insert" ON public.group_members
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      user_id = auth.uid() OR
      is_group_admin(group_id, auth.uid()) OR
      is_group_member(group_id, auth.uid())
    )
  );
