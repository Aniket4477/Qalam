'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'
import { X, Trophy, Search, Loader2 } from 'lucide-react'
import FollowButton from '@/components/profile/FollowButton'
import { getInitials } from '@/lib/utils'

interface CompetitionVotersModalProps {
  entryId: string
  isOpen: boolean
  onClose: () => void
  initialVoters?: Profile[]
  initialCount?: number
}

export default function CompetitionVotersModal({
  entryId,
  isOpen,
  onClose,
  initialVoters = [],
  initialCount = 0,
}: CompetitionVotersModalProps) {
  const [voters, setVoters] = useState<Profile[]>(initialVoters)
  const [loading, setLoading] = useState(initialVoters.length === 0 && initialCount > 0)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())

  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  useEffect(() => {
    setMounted(true)
    supabase.auth.getUser().then(({ data }: any) => {
      if (data?.user) setCurrentUserId(data.user.id)
    })
  }, [supabase])

  // Fetch follow states for voters
  useEffect(() => {
    if (!currentUserId || voters.length === 0) return
    const idsToCheck = voters.map((v) => v.id).filter((id) => id !== currentUserId)
    if (idsToCheck.length === 0) return

    sb.from('follows')
      .select('following_id')
      .eq('follower_id', currentUserId)
      .in('following_id', idsToCheck)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: any) => {
        if (data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setFollowingIds(new Set(data.map((f: any) => f.following_id)))
        }
      })
  }, [currentUserId, voters, sb])

  // Sync initial voters if provided
  useEffect(() => {
    if (initialVoters.length > 0) {
      setVoters(initialVoters)
      setLoading(false)
    }
  }, [initialVoters])

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

  // Fetch full voter list from API if modal is open
  useEffect(() => {
    if (!isOpen || !entryId) return

    let isMounted = true
    const fetchVoters = async () => {
      try {
        const res = await fetch(`/api/competitions/vote?entryId=${encodeURIComponent(entryId)}`)
        if (!res.ok) throw new Error('Failed to fetch voters')
        const data = await res.json()
        if (isMounted && data.voters) {
          setVoters(data.voters)
        }
      } catch (err) {
        console.error('Error loading voters:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchVoters()

    return () => {
      isMounted = false
    }
  }, [isOpen, entryId])

  const filteredVoters = useMemo(() => {
    if (!searchQuery.trim()) return voters
    const q = searchQuery.toLowerCase().trim()
    return voters.filter(
      (v) =>
        (v.username && v.username.toLowerCase().includes(q)) ||
        (v.display_name && v.display_name.toLowerCase().includes(q))
    )
  }, [voters, searchQuery])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[hsl(var(--border))] bg-amber-500/5">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-amber-500 shrink-0" />
            <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
              Entry Voters{' '}
              {voters.length > 0 && (
                <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">
                  ({voters.length})
                </span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search input if more than 4 voters */}
        {voters.length > 4 && (
          <div className="px-4 py-2.5 border-b border-[hsl(var(--border))]">
            <div className="relative flex items-center">
              <Search
                size={15}
                className="absolute left-3 text-[hsl(var(--muted-foreground))] pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search voters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] rounded-lg text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        )}

        {/* Voter List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[hsl(var(--border)/0.5)] p-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-[hsl(var(--muted-foreground))] gap-2">
              <Loader2 size={24} className="animate-spin text-amber-500" />
              <span className="text-xs">Loading voters...</span>
            </div>
          ) : filteredVoters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[hsl(var(--muted-foreground))] gap-2">
              <Trophy size={28} className="opacity-25 text-amber-500" />
              <p className="text-xs">
                {searchQuery.trim() ? 'No matching voters found' : 'No votes on this entry yet'}
              </p>
            </div>
          ) : (
            filteredVoters.map((profile) => {
              const displayName = profile.display_name || profile.username
              const initials = getInitials(displayName || 'User')

              return (
                <div
                  key={profile.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-[hsl(var(--accent)/0.5)] transition-colors group"
                >
                  <Link
                    href={`/u/${profile.username}`}
                    onClick={onClose}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold text-xs flex items-center justify-center border border-amber-500/20 shrink-0">
                      {profile.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.avatar_url}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-[hsl(var(--foreground))] truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {displayName}
                        </span>
                      </div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                        @{profile.username}
                      </p>
                    </div>
                  </Link>

                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    {currentUserId === profile.id ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] font-medium">
                        You
                      </span>
                    ) : (
                      <FollowButton
                        targetUserId={profile.id}
                        initialIsFollowing={followingIds.has(profile.id)}
                        onFollowChange={(nextFollowing) => {
                          setFollowingIds((prev) => {
                            const copy = new Set(prev)
                            if (nextFollowing) copy.add(profile.id)
                            else copy.delete(profile.id)
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
    </div>,
    document.body
  )
}
