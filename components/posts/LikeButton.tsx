'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  postId: string
  initialCount: number
  initialLiked: boolean
  variant?: 'default' | 'inline'
  onLikeChange?: (newLiked: boolean, newCount: number) => void
  className?: string
}

export default function LikeButton({
  postId,
  initialCount,
  initialLiked,
  variant = 'default',
  onLikeChange,
  className,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pop, setPop] = useState(false)
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user)
    })
  }, [supabase])

  useEffect(() => {
    setLiked(initialLiked)
  }, [initialLiked])

  useEffect(() => {
    setCount(initialCount)
  }, [initialCount])

  const handleToggle = useCallback(
    async (e?: React.MouseEvent) => {
      e?.stopPropagation()
      e?.preventDefault()
      if (!isAuthenticated) {
        window.location.href = '/login?redirectTo=' + encodeURIComponent(window.location.pathname)
        return
      }
      if (loading) return

      const newLiked = !liked
      const nextCount = count + (newLiked ? 1 : -1)
      setLiked(newLiked)
      setCount(nextCount)
      onLikeChange?.(newLiked, nextCount)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('post-like-updated', {
            detail: { postId, liked: newLiked, count: nextCount },
          })
        )
      }

      if (newLiked) {
        setPop(true)
        setTimeout(() => setPop(false), 650)
      }

      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        if (newLiked) {
          await sb.from('likes').insert({ post_id: postId, user_id: user.id })
        } else {
          await sb.from('likes').delete().eq('post_id', postId).eq('user_id', user.id)
        }
      } catch {
        setLiked(!newLiked)
        const rollbackCount = count
        setCount(rollbackCount)
        onLikeChange?.(!newLiked, rollbackCount)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('post-like-updated', {
              detail: { postId, liked: !newLiked, count: rollbackCount },
            })
          )
        }
      } finally {
        setLoading(false)
      }
    },
    [liked, count, loading, isAuthenticated, postId, supabase, sb, onLikeChange]
  )

  if (variant === 'inline') {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className={cn(
          'flex items-center gap-1 text-xs transition-colors py-0.5 px-1 rounded hover:bg-[hsl(var(--accent))] relative group',
          loading && 'opacity-60 cursor-not-allowed',
          className
        )}
        aria-label={liked ? 'Unlike this post' : 'Like this post'}
      >
        <div className="relative inline-flex items-center justify-center">
          {pop && (
            <>
              <span className="heart-burst-ring pointer-events-none" />
              <span className="heart-particles pointer-events-none">
                <span className="hp-dot hp-1" />
                <span className="hp-dot hp-2" />
                <span className="hp-dot hp-3" />
                <span className="hp-dot hp-4" />
                <span className="hp-dot hp-5" />
                <span className="hp-dot hp-6" />
              </span>
            </>
          )}
          <Heart
            size={15}
            className={cn(
              'transition-transform duration-150 relative z-10',
              liked
                ? 'liked-heart fill-[#e11d48] text-[#e11d48]'
                : 'text-current group-hover:text-rose-500 group-hover:scale-110',
              pop && 'animate-heart-pop'
            )}
          />
        </div>
        <span className="tabular-nums">{count}</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-150 relative group',
        liked
          ? 'border-rose-300 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/20'
          : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-rose-300 hover:text-rose-500',
        loading && 'opacity-60 cursor-not-allowed',
        className
      )}
      aria-label={liked ? 'Unlike this post' : 'Like this post'}
    >
      <div className="relative inline-flex items-center justify-center">
        {pop && (
          <>
            <span className="heart-burst-ring pointer-events-none" />
            <span className="heart-particles pointer-events-none">
              <span className="hp-dot hp-1" />
              <span className="hp-dot hp-2" />
              <span className="hp-dot hp-3" />
              <span className="hp-dot hp-4" />
              <span className="hp-dot hp-5" />
              <span className="hp-dot hp-6" />
            </span>
          </>
        )}
        <Heart
          size={16}
          className={cn(
            'transition-transform duration-150 relative z-10',
            liked
              ? 'liked-heart fill-[#e11d48] text-[#e11d48]'
              : 'text-current group-hover:text-rose-500 group-hover:scale-110',
            pop && 'animate-heart-pop'
          )}
        />
      </div>
      <span className={cn('text-sm font-medium tabular-nums', liked && 'text-[#e11d48]')}>{count}</span>
    </button>
  )
}
