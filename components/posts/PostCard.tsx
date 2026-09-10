'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { PostWithAuthor } from '@/lib/supabase/types'
import { cn, formatDate, truncateBody, POST_TYPE_LABELS, isRTL, isUserAdmin } from '@/lib/utils'
import { MessageCircle, BookOpen, Shield, UserPlus, Loader2 } from 'lucide-react'
import LikeButton from './LikeButton'
import CommentList from './CommentList'
import SendPostButton from './SendPostButton'
import LikedByText from './LikedByText'
import {
  getPostTheme,
  getThemeFromTags,
  cleanDisplayTags,
} from '@/lib/postThemes'

interface PostCardProps {
  post: PostWithAuthor
  showAuthor?: boolean
  variant?: 'default' | 'compact'
  initialIsFollowing?: boolean
  currentUserId?: string | null
}

export default function PostCard({
  post,
  showAuthor = true,
  variant = 'default',
  initialIsFollowing,
  currentUserId,
}: PostCardProps) {
  const supabase = useMemo(() => createClient(), [])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const isRtl = isRTL(post.language)
  const [showComments, setShowComments] = useState(false)
  const [commentsCount, setCommentsCount] = useState(post.comments_count ?? 0)
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0)
  const [userLiked, setUserLiked] = useState(post.user_has_liked ?? false)

  const [isFollowing, setIsFollowing] = useState(initialIsFollowing ?? false)
  const [followLoading, setFollowLoading] = useState(false)
  const [currentUid, setCurrentUid] = useState<string | null>(currentUserId ?? null)

  // Sync initialIsFollowing prop if updated by parent
  useEffect(() => {
    if (initialIsFollowing !== undefined) {
      setIsFollowing(initialIsFollowing)
    }
  }, [initialIsFollowing])

  // Get current user ID if not explicitly provided
  useEffect(() => {
    if (currentUserId !== undefined) {
      setCurrentUid(currentUserId)
      return
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUid(user.id)
    })
  }, [currentUserId, supabase])

  // Verify follow state from DB if initialIsFollowing was not provided
  useEffect(() => {
    if (initialIsFollowing !== undefined) return
    if (!currentUid || !post.author_id || currentUid === post.author_id) return

    let isMounted = true
    const verifyFollow = async () => {
      try {
        const { data, error } = await sb
          .from('follows')
          .select('id')
          .eq('follower_id', currentUid)
          .eq('following_id', post.author_id)
          .maybeSingle()

        if (!error && isMounted) {
          setIsFollowing(!!data)
        }
      } catch {}
    }

    verifyFollow()
    return () => {
      isMounted = false
    }
  }, [currentUid, post.author_id, initialIsFollowing, sb])

  // Listen to global follow state events from elsewhere in the app
  useEffect(() => {
    const handleGlobalFollowChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ targetUserId: string; isFollowing: boolean }>
      if (customEvent.detail && customEvent.detail.targetUserId === post.author_id) {
        setIsFollowing(customEvent.detail.isFollowing)
      }
    }

    window.addEventListener('user-follow-changed', handleGlobalFollowChange)
    return () => {
      window.removeEventListener('user-follow-changed', handleGlobalFollowChange)
    }
  }, [post.author_id])

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!currentUid) {
      window.location.href = `/login?redirectTo=${encodeURIComponent(window.location.pathname)}`
      return
    }

    if (followLoading) return
    setFollowLoading(true)
    setIsFollowing(true) // Immediately update state so follow button vanishes ("shows nothing")

    try {
      const { error } = await sb.from('follows').insert({
        follower_id: currentUid,
        following_id: post.author_id,
      })

      if (error) {
        setIsFollowing(false)
      } else {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('user-follow-changed', {
              detail: { targetUserId: post.author_id, isFollowing: true },
            })
          )
        }
      }
    } catch {
      setIsFollowing(false)
    } finally {
      setFollowLoading(false)
    }
  }

  const isOwnPost = currentUid === post.author_id
  const showFollowOption = !isOwnPost && !isFollowing

  const postTheme = useMemo(() => {
    const themeId = post.theme || getThemeFromTags(post.tags) || 'classic'
    return getPostTheme(themeId)
  }, [post.theme, post.tags])

  const displayTags = useMemo(() => {
    return cleanDisplayTags(post.tags)
  }, [post.tags])

  useEffect(() => {
    setCommentsCount(post.comments_count ?? 0)
  }, [post.comments_count])

  useEffect(() => {
    setLikesCount(post.likes_count ?? 0)
  }, [post.likes_count])

  useEffect(() => {
    setUserLiked(post.user_has_liked ?? false)
  }, [post.user_has_liked])

  return (
    <article className={cn('post-card animate-fade-in transition-all', postTheme.cardClass)}>
      {/* Cover image */}
      {post.cover_url && variant === 'default' && (
        <Link href={`/post/${post.id}`} className="block -mx-6 -mt-6 mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.cover_url}
            alt={post.title ?? 'Post cover'}
            className="w-full h-40 object-cover rounded-t-lg"
          />
        </Link>
      )}

      <div className="flex items-start justify-between gap-4">
        {/* Author info */}
        {showAuthor && post.profiles && (
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href={`/u/${post.profiles.username}`} className="flex items-center gap-2 shrink-0 group">
              {post.profiles.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.profiles.avatar_url}
                  alt={post.profiles.display_name}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center text-xs font-semibold text-[hsl(var(--primary))]">
                  {post.profiles.display_name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <p className={cn('text-sm font-medium leading-none group-hover:underline', postTheme.authorClass)}>
                    {post.profiles.display_name}
                  </p>
                  {isUserAdmin(post.profiles) && (
                    <span title="Official Administrator" className="inline-flex items-center text-amber-500">
                      <Shield size={12} className="fill-amber-500/30" />
                    </span>
                  )}
                </div>
                <p className={cn('text-xs mt-0.5 opacity-80', postTheme.mutedTextClass)}>
                  @{post.profiles.username}
                </p>
              </div>
            </Link>

            {/* Follow option — shown ONLY if not following; if following, shows nothing */}
            {showFollowOption && (
              <button
                type="button"
                onClick={handleFollow}
                disabled={followLoading}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] hover:bg-[hsl(var(--primary)/0.16)] active:scale-95 transition-all cursor-pointer border border-[hsl(var(--primary)/0.25)] shadow-2xs shrink-0"
                title={`Follow ${post.profiles.display_name}`}
              >
                {followLoading ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <UserPlus size={10} />
                )}
                <span>Follow</span>
              </button>
            )}
          </div>
        )}

        {/* Type badge + language */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {post.language !== 'English' && (
            <span className={cn('text-xs px-2 py-0.5 rounded-full border', postTheme.tagClass)}>
              {post.language}
            </span>
          )}
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', postTheme.badgeClass)}>
            {POST_TYPE_LABELS[post.type] ?? post.type}
          </span>
        </div>
      </div>

      {/* Title */}
      {post.title && (
        <Link href={`/post/${post.id}`}>
          <h2
            className={cn(
              'mt-3 font-semibold text-lg hover:opacity-85 transition-colors',
              'font-serif leading-snug',
              postTheme.titleClass,
              isRtl && 'text-right'
            )}
            style={{ fontFamily: 'Lora, Georgia, serif' }}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {post.title}
          </h2>
        </Link>
      )}

      {/* Body preview */}
      <Link href={`/post/${post.id}`} className="block mt-2">
        <p
          className={cn(
            'text-sm leading-relaxed transition-colors line-clamp-4 whitespace-pre-line',
            postTheme.bodyClass,
            isRtl && 'text-right'
          )}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {truncateBody(post.body, variant === 'compact' ? 100 : 200)}
        </p>
      </Link>

      {/* Tags */}
      {displayTags.length > 0 && variant === 'default' && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {displayTags.slice(0, 4).map((tag) => (
            <Link
              key={tag}
              href={`/explore?tag=${encodeURIComponent(tag)}`}
              className={cn(
                'text-xs px-2 py-0.5 rounded-full border transition-colors',
                postTheme.tagClass
              )}
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Footer: date + engagement */}
      <div className={cn('flex items-center justify-between mt-4 pt-3 border-t', postTheme.footerBorderClass)}>
        <span className={cn('text-xs opacity-80', postTheme.mutedTextClass)}>
          {formatDate(post.created_at)}
        </span>

        <div className="flex items-center gap-3">
          <LikeButton
            postId={post.id}
            initialCount={likesCount}
            initialLiked={userLiked}
            variant="inline"
            onLikeChange={(liked, count) => {
              setUserLiked(liked)
              setLikesCount(count)
            }}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              setShowComments(!showComments)
            }}
            className={cn(
              'flex items-center gap-1 text-xs transition-colors py-0.5 px-1.5 rounded',
              showComments
                ? 'text-[hsl(var(--primary))] font-medium'
                : postTheme.actionClass
            )}
            aria-label="Toggle comments"
          >
            <MessageCircle size={15} />
            <span className="tabular-nums">{commentsCount}</span>
          </button>
          <SendPostButton
            postId={post.id}
            title={post.title ?? undefined}
            authorName={post.profiles?.display_name ?? 'Poet'}
            authorUsername={post.profiles?.username ?? undefined}
            authorAvatar={post.profiles?.avatar_url ?? undefined}
            preview={truncateBody(post.body, 120)}
            variant="icon"
          />
          <Link
            href={`/post/${post.id}`}
            className={cn(
              'flex items-center gap-1 text-xs transition-colors py-0.5 px-1.5 rounded',
              postTheme.actionClass
            )}
          >
            <BookOpen size={15} />
            <span>Read</span>
          </Link>
        </div>
      </div>

      {/* Liked by social proof */}
      {likesCount > 0 && (
        <div className="mt-2.5 pt-0.5">
          <LikedByText
            postId={post.id}
            likesCount={likesCount}
            initialFirstLiker={post.first_liker}
            userHasLiked={userLiked}
          />
        </div>
      )}

      {/* Expandable comments section */}
      {showComments && (
        <div
          className={cn('mt-4 pt-4 border-t animate-fade-in', postTheme.footerBorderClass)}
          onClick={(e) => e.stopPropagation()}
        >
          <CommentList
            postId={post.id}
            onCommentAdded={() => setCommentsCount((c) => c + 1)}
            onCommentDeleted={() => setCommentsCount((c) => Math.max(0, c - 1))}
          />
        </div>
      )}
    </article>
  )
}

/* ----------------------------------------------------------------
   Skeleton loading card
   ---------------------------------------------------------------- */
export function PostCardSkeleton() {
  return (
    <div className="post-card">
      <div className="flex items-center gap-2">
        <div className="skeleton w-9 h-9 rounded-full" />
        <div>
          <div className="skeleton h-3 w-28 mb-1" />
          <div className="skeleton h-2.5 w-20" />
        </div>
      </div>
      <div className="skeleton h-5 w-3/4 mt-4" />
      <div className="skeleton h-3 w-full mt-3" />
      <div className="skeleton h-3 w-5/6 mt-2" />
      <div className="skeleton h-3 w-4/6 mt-2" />
      <div className="flex gap-2 mt-4 pt-3 border-t border-[hsl(var(--border))]">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-3 w-12 ml-auto" />
        <div className="skeleton h-3 w-12" />
      </div>
    </div>
  )
}
