'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'
import { X, Heart, Search, Loader2, Users } from 'lucide-react'
import FollowButton from '@/components/profile/FollowButton'

interface LikerItem {
  id: string
  user_id: string
  created_at: string
  profiles: Profile
}

interface PostLikesModalProps {
  postId: string
  isOpen: boolean
  onClose: () => void
}

export default function PostLikesModal({
  postId,
  isOpen,
  onClose,
}: PostLikesModalProps) {
  const [likers, setLikers] = useState<LikerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())

  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Load likers and follow relationships
  useEffect(() => {
    if (!isOpen || !postId) return

    let isMounted = true
    const loadLikes = async () => {
      setLoading(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (isMounted) setCurrentUserId(user?.id ?? null)

        const { data, error } = await sb
          .from('likes')
          .select('id, user_id, created_at, profiles(*)')
          .eq('post_id', postId)
          .order('created_at', { ascending: false })

        if (error) throw error

        const rawList = (data ?? []).filter((item: LikerItem) => !!item.profiles) as LikerItem[]
        if (!isMounted) return
        setLikers(rawList)

        // If user logged in, check which likers are followed
        if (user && rawList.length > 0) {
          const userIds = rawList.map((item) => item.user_id).filter((id) => id !== user.id)
          if (userIds.length > 0) {
            const { data: followsData } = await sb
              .from('follows')
              .select('following_id')
              .eq('follower_id', user.id)
              .in('following_id', userIds)

            if (isMounted && followsData) {
              const followSet = new Set<string>(
                followsData.map((f: { following_id: string }) => f.following_id)
              )
              setFollowingIds(followSet)
            }
          }
        }
      } catch (err) {
        console.error('Failed to load likers:', err)
        if (isMounted) setLikers([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadLikes()

    return () => {
      isMounted = false
    }
  }, [isOpen, postId, supabase, sb])

  const filteredLikers = useMemo(() => {
    if (!searchQuery.trim()) return likers
    const q = searchQuery.toLowerCase()
    return likers.filter(
      (item) =>
        item.profiles.username.toLowerCase().includes(q) ||
        item.profiles.display_name.toLowerCase().includes(q)
    )
  }, [likers, searchQuery])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <Heart size={18} className="fill-red-500 text-red-500" />
            <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
              Likes {likers.length > 0 && <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">({likers.length})</span>}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] rounded-full hover:bg-[hsl(var(--accent))] transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search likers */}
        {likers.length > 3 && (
          <div className="px-4 py-2 border-b border-[hsl(var(--border)/0.6)] bg-[hsl(var(--muted)/0.3)]">
            <div className="relative flex items-center">
              <Search
                size={15}
                className="absolute left-3 text-[hsl(var(--muted-foreground))] pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search likers..."
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:border-[hsl(var(--primary))]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* List of likers */}
        <div className="overflow-y-auto flex-1 p-3 space-y-1 divide-y divide-[hsl(var(--border)/0.3)]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 size={24} className="animate-spin text-[hsl(var(--primary))]" />
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Loading likes...</p>
            </div>
          ) : filteredLikers.length === 0 ? (
            <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
              <Users size={32} className="mx-auto mb-2 opacity-35" />
              <p className="text-sm font-medium">
                {searchQuery ? `No likers found for "${searchQuery}"` : 'No likes yet'}
              </p>
            </div>
          ) : (
            filteredLikers.map((item) => {
              const u = item.profiles
              const isSelf = currentUserId === u.id
              const isFollowing = followingIds.has(u.id)

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-2 px-2 hover:bg-[hsl(var(--accent)/0.5)] rounded-xl transition-colors group"
                >
                  {/* User info link */}
                  <Link
                    href={`/u/${u.username}`}
                    onClick={onClose}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    {u.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={u.avatar_url}
                        alt={u.display_name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-[hsl(var(--border))]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--primary)/0.25)] to-[hsl(var(--accent))] flex items-center justify-center text-xs font-bold text-[hsl(var(--primary))] shrink-0 border border-[hsl(var(--border))]">
                        {u.display_name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors truncate">
                        {u.display_name}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                        @{u.username}
                      </p>
                    </div>
                  </Link>

                  {/* Actions: Follow button or You badge */}
                  <div className="shrink-0">
                    {isSelf ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] font-medium">
                        You
                      </span>
                    ) : (
                      <FollowButton
                        targetUserId={u.id}
                        initialIsFollowing={isFollowing}
                        onFollowChange={(nextFollowing) => {
                          setFollowingIds((prev) => {
                            const copy = new Set(prev)
                            if (nextFollowing) copy.add(u.id)
                            else copy.delete(u.id)
                            return copy
                          })
                        }}
                      />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
