-- Performance optimization indexes for high-frequency queries
-- 1. Unread notifications: Partial index only indexing unread rows for instant badge queries
CREATE INDEX IF NOT EXISTS notifications_unread_idx 
  ON public.notifications(user_id) 
  WHERE read_at IS NULL;

-- 2. Unread messages: Partial index for instant message badge counts
CREATE INDEX IF NOT EXISTS messages_unread_idx 
  ON public.messages(conversation_id, sender_id) 
  WHERE read_at IS NULL;

-- 3. Follows composite index: Instant checks of whether user follows a list of authors
CREATE INDEX IF NOT EXISTS follows_follower_following_idx 
  ON public.follows(follower_id, following_id);

-- 4. Likes ordered index: Speeds up post card first-liker and likes modal lookups
CREATE INDEX IF NOT EXISTS likes_post_created_idx 
  ON public.likes(post_id, created_at DESC);

-- 5. Comments ordered index: Speeds up fetching comments in chronological order
CREATE INDEX IF NOT EXISTS comments_post_created_idx 
  ON public.comments(post_id, created_at ASC);
