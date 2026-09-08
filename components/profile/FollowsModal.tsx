'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'
import { X, Loader2, Users } from 'lucide-react'

interface FollowsModalProps {
  userId: string
  initialTab?: 'followers' | 'following'
  onClose: () => void
}

export default function FollowsModal({
  userId,
  initialTab = 'followers',
  onClose,
}: FollowsModalProps) {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab)
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  useEffect(() => {
    let isMounted = true
    const loadUsers = async () => {
      setLoading(true)
      try {
        if (activeTab === 'followers') {
          // Get profiles of users following this user
          const { data } = await sb
            .from('follows')
            .select('follower:profiles!follows_follower_id_fkey(*)')
            .eq('following_id', userId)

          if (isMounted) {
            const list = (data ?? []).map((row: { follower: Profile }) => row.follower).filter(Boolean)
            setUsers(list)
          }
        } else {
          // Get profiles of users this user is following
          const { data } = await sb
            .from('follows')
            .select('following:profiles!follows_following_id_fkey(*)')
            .eq('follower_id', userId)

          if (isMounted) {
            const list = (data ?? []).map((row: { following: Profile }) => row.following).filter(Boolean)
            setUsers(list)
          }
        }
      } catch {
        if (isMounted) setUsers([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadUsers()

    return () => {
      isMounted = false
    }
  }, [activeTab, userId, sb])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('followers')}
              className={`text-sm font-semibold pb-1 relative transition-colors ${
                activeTab === 'followers'
                  ? 'text-[hsl(var(--primary))] border-b-2 border-[hsl(var(--primary))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              Followers
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`text-sm font-semibold pb-1 relative transition-colors ${
                activeTab === 'following'
                  ? 'text-[hsl(var(--primary))] border-b-2 border-[hsl(var(--primary))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              Following
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] rounded-md hover:bg-[hsl(var(--accent))] transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-80 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[hsl(var(--primary))]" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
              <Users size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[hsl(var(--border)/0.5)]">
              {users.map((u) => (
                <Link
                  key={u.id}
                  href={`/u/${u.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2.5 px-2 hover:bg-[hsl(var(--accent))] rounded-lg transition-colors"
                >
                  {u.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.avatar_url}
                      alt={u.display_name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center text-sm font-bold text-[hsl(var(--primary))] shrink-0">
                      {u.display_name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-none truncate">{u.display_name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 truncate">@{u.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
