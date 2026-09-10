-- Migration: Group Messages Read Receipts (Seen Ticks)
-- Adds read_by column to group_messages and provides safe RLS policy and read function

-- 1. Add read_by column to track members who opened the message
ALTER TABLE public.group_messages
  ADD COLUMN IF NOT EXISTS read_by UUID[] DEFAULT '{}';

-- 2. Allow group members to update messages (for read receipts / reactions)
DROP POLICY IF EXISTS "group_messages_update_read" ON public.group_messages;
CREATE POLICY "group_messages_update_read" ON public.group_messages
  FOR UPDATE USING (is_group_member(group_id, auth.uid()))
  WITH CHECK (is_group_member(group_id, auth.uid()));

-- 3. Standard function (WITHOUT SECURITY DEFINER) to avoid linter warnings
CREATE OR REPLACE FUNCTION public.mark_group_messages_read(p_group_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Validate caller is authorized and is a member of the circle
  IF auth.uid() = p_user_id AND is_group_member(p_group_id, auth.uid()) THEN
    UPDATE public.group_messages
    SET read_by = array_append(read_by, p_user_id)
    WHERE group_id = p_group_id
      AND sender_id != p_user_id
      AND NOT (p_user_id = ANY(read_by));
  END IF;
END;
$$;

-- 4. Permissions
REVOKE EXECUTE ON FUNCTION public.mark_group_messages_read(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_group_messages_read(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.mark_group_messages_read(UUID, UUID) TO authenticated;
