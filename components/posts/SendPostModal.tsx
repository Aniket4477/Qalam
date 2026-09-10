'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Group } from '@/lib/supabase/types'
import {
  X,
  Search,
  Users,
  Send,
  Check,
  Loader2,
  Lock,
  MessageSquareShare,
  MessageSquareQuote,
} from 'lucide-react'

interface SendPostModalProps {
  post: {
    id: string
    title?: string | null
    author_name: string
    author_username?: string
    author_avatar?: string | null
    preview: string
  }
  currentUserId?: string | null
  onClose: () => void
}

interface ChatTarget {
  id: string
  type: 'group' | 'conversation' | 'user'
  title: string
  subtitle?: string
  avatar_url?: string | null
  rawUserId?: string
  rawGroupId?: string
  rawConvId?: string
}

export default function SendPostModal({ post, currentUserId: propUserId, onClose }: SendPostModalProps) {
  const [mounted, setMounted] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(propUserId ?? null)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [notLoggedIn, setNotLoggedIn] = useState(propUserId === null && propUserId !== undefined)

  // Loaded targets
  const [groups, setGroups] = useState<Group[]>([])
  const [recentConversations, setRecentConversations] = useState<
    { id: string; otherUser: Profile }[]
  >([])

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchedProfiles, setSearchedProfiles] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)

  // Message / Note
  const [note, setNote] = useState('')

  // Sent tracking: key -> boolean
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({})
  const [sendingKey, setSendingKey] = useState<string | null>(null)

  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Load user and their chats
  useEffect(() => {
    let active = true

    async function loadData() {
      try {
        let activeUid = propUserId
        if (activeUid === undefined) {
          const {
            data: { user },
          } = await supabase.auth.getUser()
          activeUid = user?.id || null
        }

        if (!activeUid) {
          if (active) {
            setNotLoggedIn(true)
            setLoadingInitial(false)
          }
          return
        }

        if (active) setCurrentUserId(activeUid)

        // 1. Fetch groups user is a member of
        const { data: memberRows } = await sb
          .from('group_members')
          .select('group_id, groups(*)')
          .eq('user_id', activeUid)

        const userGroups = ((memberRows ?? []) as { groups: Group }[])
          .map((m) => m.groups)
          .filter(Boolean)

        // 2. Fetch direct conversations
        const { data: convRows } = await sb
          .from('conversations')
          .select(
            'id, user_one_id, user_two_id, user_one:profiles!user_one_id(*), user_two:profiles!user_two_id(*)'
          )
          .or(`user_one_id.eq.${activeUid},user_two_id.eq.${activeUid}`)
          .order('created_at', { ascending: false })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const convs = (convRows ?? []).map((c: any) => {
          const otherUser = c.user_one_id === activeUid ? c.user_two : c.user_one
          return {
            id: c.id,
            otherUser: otherUser as Profile,
          }
        })

        if (active) {
          setGroups(userGroups)
          setRecentConversations(convs)
        }
      } catch (err) {
        console.error('Failed to load chats to send post:', err)
      } finally {
        if (active) setLoadingInitial(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [supabase, sb])

  // Search poets if query isn't empty
  useEffect(() => {
    const clean = searchQuery.trim().replace(/^@/, '')
    if (!clean || notLoggedIn) {
      setSearchedProfiles([])
      return
    }

    let active = true
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await sb
          .from('profiles')
          .select('*')
          .neq('id', currentUserId || '')
          .or(`username.ilike.%${clean}%,display_name.ilike.%${clean}%`)
          .limit(6)

        if (active) {
          setSearchedProfiles((data as Profile[]) || [])
        }
      } catch (err) {
        console.error('Error searching poets:', err)
      } finally {
        if (active) setSearching(false)
      }
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [searchQuery, currentUserId, notLoggedIn, sb])

  // Unified list of targets to display
  const targets = useMemo<ChatTarget[]>(() => {
    const list: ChatTarget[] = []
    const cleanQuery = searchQuery.trim().toLowerCase()

    // 1. Groups
    groups.forEach((g) => {
      if (!cleanQuery || g.name.toLowerCase().includes(cleanQuery)) {
        list.push({
          id: `group-${g.id}`,
          type: 'group',
          title: g.name,
          subtitle: 'Poetry Group',
          avatar_url: g.avatar_url,
          rawGroupId: g.id,
        })
      }
    })

    // 2. Recent Direct Conversations
    recentConversations.forEach((c) => {
      if (!c.otherUser) return
      const matches =
        !cleanQuery ||
        c.otherUser.display_name.toLowerCase().includes(cleanQuery) ||
        c.otherUser.username.toLowerCase().includes(cleanQuery)

      if (matches) {
        list.push({
          id: `conv-${c.id}`,
          type: 'conversation',
          title: c.otherUser.display_name,
          subtitle: `@${c.otherUser.username}`,
          avatar_url: c.otherUser.avatar_url,
          rawConvId: c.id,
          rawUserId: c.otherUser.id,
        })
      }
    })

    // 3. Search Results for users not already in recent direct conversations
    if (cleanQuery && searchedProfiles.length > 0) {
      const existingUserIds = new Set(
        recentConversations.map((c) => c.otherUser?.id)
      )

      searchedProfiles.forEach((p) => {
        if (!existingUserIds.has(p.id)) {
          list.push({
            id: `user-${p.id}`,
            type: 'user',
            title: p.display_name,
            subtitle: `@${p.username}`,
            avatar_url: p.avatar_url,
            rawUserId: p.id,
          })
        }
      })
    }

    return list
  }, [groups, recentConversations, searchedProfiles, searchQuery])

  // Send action
  const handleSendToTarget = async (target: ChatTarget) => {
    if (!currentUserId || sendingKey) return

    setSendingKey(target.id)

    const payload = JSON.stringify({
      id: post.id,
      title: post.title || undefined,
      author_name: post.author_name,
      author_username: post.author_username,
      author_avatar: post.author_avatar || undefined,
      preview: post.preview,
      note: note.trim() || undefined,
    })

    const body = `[post]:${payload}`

    try {
      if (target.type === 'group' && target.rawGroupId) {
        const { error } = await sb.from('group_messages').insert({
          group_id: target.rawGroupId,
          sender_id: currentUserId,
          body,
        })
        if (error) throw error
      } else if (target.type === 'conversation' && target.rawConvId) {
        const { error } = await sb.from('messages').insert({
          conversation_id: target.rawConvId,
          sender_id: currentUserId,
          body,
        })
        if (error) throw error
      } else if (target.type === 'user' && target.rawUserId) {
        // Find existing conversation or create new
        const targetUserId = target.rawUserId
        let convId: string

        const { data: existing } = await sb
          .from('conversations')
          .select('id')
          .or(
            `and(user_one_id.eq.${currentUserId},user_two_id.eq.${targetUserId}),and(user_one_id.eq.${targetUserId},user_two_id.eq.${currentUserId})`
          )
          .maybeSingle()

        if (existing?.id) {
          convId = existing.id
        } else {
          const { data: newConv, error: createConvErr } = await sb
            .from('conversations')
            .insert({
              user_one_id: currentUserId,
              user_two_id: targetUserId,
            })
            .select('id')
            .single()

          if (createConvErr) throw createConvErr
          convId = newConv.id
        }

        const { error: msgErr } = await sb.from('messages').insert({
          conversation_id: convId,
          sender_id: currentUserId,
          body,
        })

        if (msgErr) throw msgErr
      }

      // Mark as sent
      setSentMap((prev) => ({ ...prev, [target.id]: true }))
    } catch (err) {
      console.error('Failed to send post:', err)
      alert('Could not send post. Please try again.')
    } finally {
      setSendingKey(null)
    }
  }

  if (!mounted) return null

  const sentCount = Object.values(sentMap).filter(Boolean).length

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[85vh] sm:max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.25)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] flex items-center justify-center">
              <MessageSquareShare size={17} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Send in Chat
              </h3>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Share this poem with friends or groups
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Not Logged In State */}
        {notLoggedIn ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mx-auto mb-3 text-[hsl(var(--muted-foreground))]">
              <Lock size={22} />
            </div>
            <h4 className="text-sm font-semibold mb-1">Sign in to share</h4>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-5 max-w-xs mx-auto">
              You must be logged in to send this poem directly to your friends or groups.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-[hsl(var(--primary))] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Post Preview Snippet */}
            <div className="p-3 mx-4 mt-3 rounded-xl bg-[hsl(var(--muted)/0.35)] border border-[hsl(var(--border))] flex items-start gap-3 shadow-2xs">
              {post.author_avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.author_avatar}
                  alt={post.author_name}
                  className="w-9 h-9 rounded-full object-cover shrink-0 border border-[hsl(var(--border))]"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] flex items-center justify-center shrink-0 text-xs font-bold">
                  {post.author_name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
                    Poem by
                  </span>
                  <span className="text-xs font-semibold text-[hsl(var(--foreground))] truncate">
                    {post.author_name}
                  </span>
                </div>
                {post.title && (
                  <p
                    className="text-xs font-bold text-[hsl(var(--foreground))] truncate mt-0.5"
                    style={{ fontFamily: 'Lora, Georgia, serif' }}
                  >
                    {post.title}
                  </p>
                )}
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] line-clamp-2 italic mt-0.5 leading-relaxed">
                  &ldquo;{post.preview}&rdquo;
                </p>
              </div>
            </div>

            {/* Optional message note */}
            <div className="px-4 mt-2.5">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a message... (optional)"
                className="w-full px-3.5 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.25)] text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1.5 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all"
              />
            </div>

            {/* Search Input */}
            <div className="px-4 mt-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search friends or groups..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.25)] text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1.5 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  >
                    <X size={13} />
                  </button>
                ) : searching ? (
                  <Loader2
                    size={12}
                    className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[hsl(var(--primary))]"
                  />
                ) : null}
              </div>
            </div>

            {/* List label */}
            <div className="px-4 pt-2.5 pb-1 flex items-center justify-between text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              <span>{searchQuery ? 'Search Results' : 'Recent Chats & Friends'}</span>
              {!loadingInitial && (
                <span className="text-[10px] font-normal normal-case opacity-75">
                  {targets.length} {targets.length === 1 ? 'chat' : 'chats'}
                </span>
              )}
            </div>

            {/* Recipients List */}
            <div className="flex-1 overflow-y-auto px-4 py-1 space-y-1 min-h-[160px]">
              {loadingInitial ? (
                <div className="flex flex-col items-center justify-center py-10 text-[hsl(var(--muted-foreground))] gap-2">
                  <Loader2 size={20} className="animate-spin text-[hsl(var(--primary))]" />
                  <span className="text-xs">Loading chats...</span>
                </div>
              ) : targets.length === 0 ? (
                <div className="text-center py-10 text-[hsl(var(--muted-foreground))]">
                  <p className="text-xs">No matching friends or groups found.</p>
                </div>
              ) : (
                targets.map((target) => {
                  const isSent = sentMap[target.id]
                  const isSending = sendingKey === target.id

                  return (
                    <div
                      key={target.id}
                      className="flex items-center justify-between p-2 hover:bg-[hsl(var(--accent)/0.45)] rounded-xl transition-colors gap-3"
                    >
                      {/* Avatar & Name */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {target.type === 'group' ? (
                          target.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={target.avatar_url}
                              alt={target.title}
                              className="w-10 h-10 rounded-xl object-cover border border-[hsl(var(--border))] shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.6)] text-white flex items-center justify-center shrink-0 shadow-2xs">
                              <Users size={18} />
                            </div>
                          )
                        ) : target.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={target.avatar_url}
                            alt={target.title}
                            className="w-10 h-10 rounded-full object-cover border border-[hsl(var(--border))] shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] flex items-center justify-center text-xs font-semibold shrink-0">
                            {target.title.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[hsl(var(--foreground))] truncate leading-tight">
                            {target.title}
                          </p>
                          {target.subtitle && (
                            <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate mt-0.5 leading-tight font-medium">
                              {target.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Send Button */}
                      <button
                        onClick={() => handleSendToTarget(target)}
                        disabled={isSent || isSending}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 shadow-2xs ${
                          isSent
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold'
                            : 'bg-[hsl(var(--primary))] text-white hover:opacity-95 active:scale-95 disabled:opacity-50'
                        }`}
                      >
                        {isSending ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : isSent ? (
                          <>
                            <Check size={13} className="text-emerald-500 stroke-[2.5]" />
                            <span>Sent</span>
                          </>
                        ) : (
                          <>
                            <Send size={12} className="text-white" />
                            <span>Send</span>
                          </>
                        )}
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.2)] flex items-center justify-between">
              <div>
                {sentCount > 0 ? (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check size={13} /> Sent to {sentCount} {sentCount === 1 ? 'chat' : 'chats'}
                  </span>
                ) : (
                  <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                    Select who to send this poem to
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))] text-xs font-medium text-[hsl(var(--foreground))] transition-colors shadow-2xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
