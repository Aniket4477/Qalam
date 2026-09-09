'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { PostWithAuthor } from '@/lib/supabase/types'
import { cn, formatDate, truncateBody, POST_TYPE_LABELS, isRTL } from '@/lib/utils'
import { MessageCircle, BookOpen } from 'lucide-react'
import LikeButton from './LikeButton'
import CommentList from './CommentList'
import SendPostButton from './SendPostButton'
import LikedByText from './LikedByText'

interface PostCardProps {
  post: PostWithAuthor
  showAuthor?: boolean
  variant?: 'default' | 'compact'
}

export default function PostCard({
  post,
  showAuthor = true,
  variant = 'default',
}: PostCardProps) {
  const isRtl = isRTL(post.language)
  const [showComments, setShowComments] = useState(false)
  const [commentsCount, setCommentsCount] = useState(post.comments_count ?? 0)
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0)
  const [userLiked, setUserLiked] = useState(post.user_has_liked ?? false)

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
    <article className="post-card animate-fade-in">
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
          <Link href={`/u/${post.profiles.username}`} className="flex items-center gap-2 shrink-0">
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
              <p className="text-sm font-medium leading-none">{post.profiles.display_name}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">@{post.profiles.username}</p>
            </div>
          </Link>
        )}

        {/* Type badge + language */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {post.language !== 'English' && (
            <span className="text-xs px-2 py-0.5 rounded-full border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
              {post.language}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
            {POST_TYPE_LABELS[post.type] ?? post.type}
          </span>
        </div>
      </div>

      {/* Title */}
      {post.title && (
        <Link href={`/post/${post.id}`}>
          <h2
            className={cn(
              'mt-3 font-semibold text-lg hover:text-[hsl(var(--primary))] transition-colors',
              'font-serif leading-snug',
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
            'text-[hsl(var(--muted-foreground))] text-sm leading-relaxed hover:text-[hsl(var(--foreground))] transition-colors line-clamp-4 whitespace-pre-line',
            isRtl && 'text-right'
          )}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {truncateBody(post.body, variant === 'compact' ? 100 : 200)}
        </p>
      </Link>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && variant === 'default' && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {post.tags.slice(0, 4).map((tag) => (
            <Link
              key={tag}
              href={`/explore?tag=${encodeURIComponent(tag)}`}
              className="text-xs px-2 py-0.5 rounded-full text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))] transition-colors border border-[hsl(var(--border))]"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Footer: date + engagement */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[hsl(var(--border))]">
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
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
              'flex items-center gap-1 text-xs transition-colors py-0.5 px-1 rounded hover:bg-[hsl(var(--accent))]',
              showComments
                ? 'text-[hsl(var(--primary))] font-medium'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
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
            className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors py-0.5 px-1 rounded hover:bg-[hsl(var(--accent))]"
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
          className="mt-4 pt-4 border-t border-[hsl(var(--border))] animate-fade-in"
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
