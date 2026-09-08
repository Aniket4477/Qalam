'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, UserCheck, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FollowButtonProps {
  targetUserId: string
  initialIsFollowing: boolean
  onFollowChange?: (isFollowing: boolean) => void
}

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
  onFollowChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })
  }, [supabase])

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!currentUserId) {
      window.location.href = `/login?redirectTo=${encodeURIComponent(window.location.pathname)}`
      return
    }

    if (loading) return

    const nextState = !isFollowing
    setIsFollowing(nextState)
    onFollowChange?.(nextState)
    setLoading(true)

    try {
      if (nextState) {
        await sb.from('follows').insert({
          follower_id: currentUserId,
          following_id: targetUserId,
        })
      } else {
        await sb.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', targetUserId)
      }
    } catch {
      // Revert if error
      setIsFollowing(!nextState)
      onFollowChange?.(!nextState)
    } finally {
      setLoading(false)
    }
  }

  // Hide button on one's own profile
  if (currentUserId === targetUserId) return null

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
        isFollowing
          ? 'border border-[hsl(var(--border))] bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] hover:border-red-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
          : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90'
      )}
      aria-label={isFollowing ? 'Unfollow' : 'Follow'}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck size={14} />
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlus size={14} />
          <span>Follow</span>
        </>
      )}
    </button>
  )
}
