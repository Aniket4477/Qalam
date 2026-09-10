-- Migration: Group Messages Read Receipts (Seen Ticks)
-- Adds read_by column to group_messages to track members who have viewed the message

ALTER TABLE public.group_messages
  ADD COLUMN IF NOT EXISTS read_by UUID[] DEFAULT '{}';

-- Function to mark group messages as read by a member
CREATE OR REPLACE FUNCTION public.mark_group_messages_read(p_group_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.group_messages
  SET read_by = array_append(read_by, p_user_id)
  WHERE group_id = p_group_id
    AND sender_id != p_user_id
    AND NOT (p_user_id = ANY(read_by));
END;
$$;

-- Security hardening: revoke execute from public & anon, allow authenticated members
REVOKE EXECUTE ON FUNCTION public.mark_group_messages_read(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_group_messages_read(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.mark_group_messages_read(UUID, UUID) TO authenticated;
