'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'
import { Search, MessageSquare, ArrowLeft, Loader2, Users } from 'lucide-react'

interface NewMessageSearchProps {
  currentUserId: string
}

export default function NewMessageSearch({ currentUserId }: NewMessageSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [recentUsers, setRecentUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [startingWith, setStartingWith] = useState<string | null>(null)

  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  // Load initial suggested poets
  useEffect(() => {
    const loadRecent = async () => {
      const { data } = await sb
        .from('profiles')
        .select('*')
        .neq('id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (data) setRecentUsers(data as Profile[])
    }
    loadRecent()
  }, [currentUserId, sb])

  // Search when query changes
  useEffect(() => {
    const clean = query.trim().replace(/^@/, '')
    if (!clean) {
      setResults([])
      setLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const { data } = await sb
          .from('profiles')
          .select('*')
          .neq('id', currentUserId)
          .or(`username.ilike.%${clean}%,display_name.ilike.%${clean}%`)
          .limit(20)

        setResults((data as Profile[]) ?? [])
      } catch (err) {
        console.error('Error searching users for message:', err)
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query, currentUserId, sb])

  const handleSelectUser = (targetId: string) => {
    setStartingWith(targetId)
    router.push(`/messages/new?with=${targetId}`)
  }

  const displayedUsers = query.trim() ? results : recentUsers

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Back button & title */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/messages"
          className="p-2 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
          aria-label="Back to messages"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1
            className="text-2xl font-bold text-[hsl(var(--foreground))]"
            style={{ fontFamily: 'Lora, Georgia, serif' }}
          >
            New Message
          </h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Search a poet by @username or display name to chat
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <Search
          size={17}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by @username or name..."
          autoFocus
          className="w-full pl-10 pr-4 py-2.5 bg-[hsl(var(--input)/0.5)] border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] placeholder:text-[hsl(var(--muted-foreground))]"
        />
      </div>

      {/* User list */}
      <div>
        <h2 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">
          {query.trim() ? 'Search Results' : 'Suggested Poets'}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-[hsl(var(--primary))]" />
          </div>
        ) : displayedUsers.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[hsl(var(--border))] rounded-xl">
            <Users size={32} className="mx-auto text-[hsl(var(--muted-foreground))] opacity-40 mb-2" />
            <p className="text-sm font-medium text-[hsl(var(--foreground))]">No poets found</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              Double-check the username or try another search.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border)/0.5)] border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--card))] overflow-hidden shadow-xs">
            {displayedUsers.map((u) => {
              const isSelected = startingWith === u.id
              return (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u.id)}
                  disabled={isSelected}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[hsl(var(--accent))] transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {u.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={u.avatar_url}
                        alt={u.display_name}
                        className="w-11 h-11 rounded-full object-cover shrink-0 border border-[hsl(var(--border))]"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center text-sm font-bold text-[hsl(var(--primary))] shrink-0 border border-[hsl(var(--border))]">
                        {u.display_name?.slice(0, 2).toUpperCase() || 'QA'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors truncate">
                        {u.display_name}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono truncate">
                        @{u.username}
                      </p>
                      {u.bio && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate max-w-xs mt-0.5 italic">
                          {u.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 ml-3">
                    {isSelected ? (
                      <Loader2 size={16} className="animate-spin text-[hsl(var(--primary))]" />
                    ) : (
                      <div className="p-2 rounded-lg bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] group-hover:bg-[hsl(var(--primary))] group-hover:text-[hsl(var(--primary-foreground))] transition-all">
                        <MessageSquare size={16} />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
