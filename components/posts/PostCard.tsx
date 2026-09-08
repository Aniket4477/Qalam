import Link from 'next/link'
import type { PostWithAuthor } from '@/lib/supabase/types'
import { cn, formatDate, truncateBody, POST_TYPE_LABELS, isRTL } from '@/lib/utils'
import { Heart, MessageCircle, Share2, BookOpen } from 'lucide-react'

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
          <div className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
            <Heart
              size={15}
              className={cn(post.user_has_liked && 'fill-[hsl(var(--primary))] text-[hsl(var(--primary))]')}
            />
            <span className="text-xs">{post.likes_count ?? 0}</span>
          </div>
          <div className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
            <MessageCircle size={15} />
            <span className="text-xs">{post.comments_count ?? 0}</span>
          </div>
          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <BookOpen size={15} />
            <span className="text-xs">Read</span>
          </Link>
        </div>
      </div>
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
