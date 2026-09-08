'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  postId: string
  initialCount: number
  initialLiked: boolean
}

export default function LikeButton({
  postId,
  initialCount,
  initialLiked,
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

  const handleToggle = useCallback(async () => {
    if (!isAuthenticated) {
      window.location.href = '/login?redirectTo=' + encodeURIComponent(window.location.pathname)
      return
    }
    if (loading) return

    const newLiked = !liked
    setLiked(newLiked)
    setCount((c) => c + (newLiked ? 1 : -1))
    if (newLiked) {
      setPop(true)
      setTimeout(() => setPop(false), 400)
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
      setCount((c) => c + (newLiked ? -1 : 1))
    } finally {
      setLoading(false)
    }
  }, [liked, loading, isAuthenticated, postId, supabase, sb])

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-150',
        liked
          ? 'border-[hsl(var(--primary)/0.5)] bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))]'
          : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.3)] hover:text-[hsl(var(--primary))]',
        loading && 'opacity-60 cursor-not-allowed'
      )}
      aria-label={liked ? 'Unlike this post' : 'Like this post'}
    >
      <Heart
        size={16}
        className={cn(
          'transition-all duration-150',
          liked && 'fill-current',
          pop && 'animate-heart-pop'
        )}
      />
      <span className="text-sm font-medium tabular-nums">{count}</span>
    </button>
  )
}
