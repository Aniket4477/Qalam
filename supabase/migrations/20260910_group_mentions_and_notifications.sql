-- Migration: Group Mentions and Notifications
-- Enables @mention notifications for circle/group chats and allows authenticated notification inserts

-- 1. Ensure authenticated users can insert notifications (e.g. from mentions, circle invites)
DROP POLICY IF EXISTS "notifications_authenticated_insert" ON public.notifications;
CREATE POLICY "notifications_authenticated_insert" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 2. Database trigger function to automatically process mentions and notify members
CREATE OR REPLACE FUNCTION public.notify_on_group_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group RECORD;
  v_member RECORD;
  v_mention TEXT;
  v_body TEXT;
  v_clean_handle TEXT;
  v_target_user_id UUID;
  v_mentioned_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  -- Skip system messages (e.g. theme changes, join events)
  IF NEW.body LIKE '[system]:%' THEN
    RETURN NEW;
  END IF;

  -- Fetch group details
  SELECT id, name INTO v_group FROM public.groups WHERE id = NEW.group_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  v_body := NEW.body;

  -- 2a. Handle @everyone or @all broadcast
  IF v_body ~* '(^|\s)@(everyone|all)($|\s|[[:punct:]])' THEN
    FOR v_member IN
      SELECT user_id FROM public.group_members
      WHERE group_id = NEW.group_id AND user_id != NEW.sender_id
    LOOP
      INSERT INTO public.notifications (user_id, type, payload)
      VALUES (
        v_member.user_id,
        'message',
        jsonb_build_object(
          'group_id', NEW.group_id,
          'group_name', v_group.name,
          'from_user_id', NEW.sender_id,
          'is_mention', true,
          'snippet', substring(v_body from 1 for 100)
        )
      );
      v_mentioned_ids := array_append(v_mentioned_ids, v_member.user_id);
    END LOOP;
  ELSE
    -- 2b. Handle individual @username mentions
    FOR v_mention IN
      SELECT (regexp_matches(v_body, '@([a-zA-Z0-9_.-]+)', 'g'))[1]
    LOOP
      v_clean_handle := lower(v_mention);

      -- Find matching group member by username
      SELECT gm.user_id INTO v_target_user_id
      FROM public.group_members gm
      JOIN public.profiles p ON p.id = gm.user_id
      WHERE gm.group_id = NEW.group_id
        AND lower(p.username) = v_clean_handle
        AND gm.user_id != NEW.sender_id
      LIMIT 1;

      -- If found and not already notified for this message
      IF v_target_user_id IS NOT NULL AND NOT (v_target_user_id = ANY(v_mentioned_ids)) THEN
        v_mentioned_ids := array_append(v_mentioned_ids, v_target_user_id);

        INSERT INTO public.notifications (user_id, type, payload)
        VALUES (
          v_target_user_id,
          'message',
          jsonb_build_object(
            'group_id', NEW.group_id,
            'group_name', v_group.name,
            'from_user_id', NEW.sender_id,
            'is_mention', true,
            'snippet', substring(v_body from 1 for 100)
          )
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Attach trigger to group_messages
DROP TRIGGER IF EXISTS on_group_message_created ON public.group_messages;
CREATE TRIGGER on_group_message_created
  AFTER INSERT ON public.group_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_group_message();

-- 4. FIX: Public & Signed-In Users Can Execute SECURITY DEFINER Function
-- Revoke direct RPC execution privileges on the trigger function
REVOKE EXECUTE ON FUNCTION public.notify_on_group_message() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_group_message() FROM anon, authenticated;

