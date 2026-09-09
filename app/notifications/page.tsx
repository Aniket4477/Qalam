import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Bell, Heart, MessageCircle, Trophy, Mail } from 'lucide-react'
import type { Metadata } from 'next'
import MarkNotificationsRead from '@/components/notifications/MarkNotificationsRead'
import type { Notification, Profile } from '@/lib/supabase/types'

export const metadata: Metadata = {
  title: 'Notifications',
}

function NotificationIcon({
  type,
  size = 16,
}: {
  type: Notification['type']
  size?: number
}) {
  switch (type) {
    case 'like':
      return <Heart size={size} className="text-red-500 fill-red-500" />
    case 'comment':
      return <MessageCircle size={size} className="text-blue-500 fill-blue-500/20" />
    case 'message':
      return <Mail size={size} className="text-emerald-500 fill-emerald-500/20" />
    case 'competition_ended':
      return <Trophy size={size} className="text-amber-500 fill-amber-500/20" />
    default:
      return <Bell size={size} className="text-[hsl(var(--primary))]" />
  }
}

function NotificationMessage({
  notification,
  actor,
  post,
}: {
  notification: Notification
  actor?: Profile | null
  post?: { id: string; title: string | null } | null
}) {
  const payload = (notification.payload ?? {}) as Record<string, string>

  const actorNode = actor ? (
    <>
      <Link
        href={`/u/${actor.username}`}
        className="font-semibold text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:underline transition-colors"
      >
        {actor.display_name}
      </Link>
      <span className="text-xs text-[hsl(var(--muted-foreground))] font-normal ml-1">
        @{actor.username}
      </span>
    </>
  ) : (
    <span className="font-semibold text-[hsl(var(--foreground))]">Someone</span>
  )

  const postTitle = post?.title ? `"${post.title}"` : 'poem'
  const postNode = payload.post_id ? (
    <Link
      href={`/post/${payload.post_id}`}
      className="font-medium text-[hsl(var(--primary))] hover:underline transition-colors"
    >
      {postTitle}
    </Link>
  ) : (
    <span className="font-medium">poem</span>
  )

  switch (notification.type) {
    case 'like':
      return (
        <p className="text-sm leading-snug">
          {actorNode} liked your {postNode}
        </p>
      )
    case 'comment':
      return (
        <p className="text-sm leading-snug">
          {actorNode} commented on your {postNode}
        </p>
      )
    case 'message':
      return (
        <p className="text-sm leading-snug">
          {actorNode} sent you a{' '}
          <Link
            href={
              payload.conversation_id
                ? `/messages/${payload.conversation_id}`
                : '/messages'
            }
            className="font-medium text-[hsl(var(--primary))] hover:underline transition-colors"
          >
            message
          </Link>
        </p>
      )
    case 'competition_ended':
      return (
        <p className="text-sm leading-snug">
          A competition you entered has{' '}
          <Link
            href="/competitions"
            className="font-medium text-[hsl(var(--primary))] hover:underline transition-colors"
          >
            ended
          </Link>
        </p>
      )
    default:
      return <p className="text-sm leading-snug">New notification</p>
  }
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/notifications')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { data: notifData } = await sb
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const notifications = (notifData ?? []) as Notification[]

  // Collect IDs for enrichment
  const actorIdsSet = new Set<string>()
  const postIdsSet = new Set<string>()
  const commentIdsToCheck: string[] = []
  const postIdsToCheckLikes: string[] = []

  notifications.forEach((n) => {
    const p = (n.payload ?? {}) as Record<string, string>
    const actorId = p.from_user_id || p.sender_id || p.author_id
    if (actorId) {
      actorIdsSet.add(actorId)
    } else {
      if (n.type === 'comment' && p.comment_id) {
        commentIdsToCheck.push(p.comment_id)
      }
      if (n.type === 'like' && p.post_id) {
        postIdsToCheckLikes.push(p.post_id)
      }
    }
    if (p.post_id) {
      postIdsSet.add(p.post_id)
    }
  })

  // Fallback queries if older notifications lacked from_user_id in payload
  const fallbackCommentMap: Record<string, string> = {}
  if (commentIdsToCheck.length > 0) {
    const { data: comments } = await sb
      .from('comments')
      .select('id, author_id')
      .in('id', commentIdsToCheck)
    ;(comments ?? []).forEach((c: { id: string; author_id: string }) => {
      fallbackCommentMap[c.id] = c.author_id
      actorIdsSet.add(c.author_id)
    })
  }

  const fallbackLikeMap: Record<string, string> = {}
  if (postIdsToCheckLikes.length > 0) {
    const { data: likes } = await sb
      .from('likes')
      .select('post_id, user_id')
      .in('post_id', postIdsToCheckLikes)
      .neq('user_id', user.id)
    ;(likes ?? []).forEach((l: { post_id: string; user_id: string }) => {
      fallbackLikeMap[l.post_id] = l.user_id
      actorIdsSet.add(l.user_id)
    })
  }

  const actorIds = Array.from(actorIdsSet)
  const postIds = Array.from(postIdsSet)

  const [actorsRes, postsRes] = await Promise.all([
    actorIds.length > 0
      ? sb
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', actorIds)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? sb.from('posts').select('id, title').in('id', postIds)
      : Promise.resolve({ data: [] }),
  ])

  const actorsMap: Record<string, Profile> = {}
  ;(actorsRes.data ?? []).forEach((p: Profile) => {
    actorsMap[p.id] = p
  })

  const postsMap: Record<string, { id: string; title: string | null }> = {}
  ;(postsRes.data ?? []).forEach((p: { id: string; title: string | null }) => {
    postsMap[p.id] = p
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'Lora, Georgia, serif' }}
        >
          Notifications
        </h1>
        {notifications.some((n) => !n.read_at) && (
          <MarkNotificationsRead userId={user.id} />
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell
            size={36}
            className="mx-auto text-[hsl(var(--muted-foreground))] mb-3 opacity-30"
          />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            No notifications yet
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notification) => {
            const p = (notification.payload ?? {}) as Record<string, string>
            const actorId =
              p.from_user_id ||
              p.sender_id ||
              p.author_id ||
              (notification.type === 'comment' && p.comment_id
                ? fallbackCommentMap[p.comment_id]
                : null) ||
              (notification.type === 'like' && p.post_id
                ? fallbackLikeMap[p.post_id]
                : null)

            const actor = actorId ? actorsMap[actorId] : null
            const post = p.post_id ? postsMap[p.post_id] : null

            return (
              <div
                key={notification.id}
                className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all ${
                  !notification.read_at
                    ? 'border-[hsl(var(--primary)/0.35)] bg-[hsl(var(--primary)/0.04)] dark:bg-[hsl(var(--primary)/0.08)] shadow-xs'
                    : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]'
                }`}
              >
                {/* Actor Avatar with overlaid type icon */}
                <div className="relative shrink-0 mt-0.5">
                  {actor ? (
                    <Link href={`/u/${actor.username}`} className="block relative group">
                      {actor.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={actor.avatar_url}
                          alt={actor.display_name}
                          className="w-10 h-10 rounded-full object-cover border border-[hsl(var(--border))] group-hover:ring-2 group-hover:ring-[hsl(var(--primary)/0.4)] transition-all"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center text-xs font-semibold text-[hsl(var(--primary))] border border-[hsl(var(--border))] group-hover:ring-2 group-hover:ring-[hsl(var(--primary)/0.4)] transition-all">
                          {(actor.display_name || actor.username || 'U')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] flex items-center justify-center shadow-xs">
                        <NotificationIcon type={notification.type} size={11} />
                      </span>
                    </Link>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center border border-[hsl(var(--border))]">
                      <NotificationIcon type={notification.type} size={18} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <NotificationMessage
                    notification={notification}
                    actor={actor}
                    post={post}
                  />
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    {formatDate(notification.created_at)}
                  </p>
                </div>

                {/* Unread indicator */}
                {!notification.read_at && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--primary))] mt-2 shrink-0 shadow-xs animate-pulse" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
