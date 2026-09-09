'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Group, GroupMember, GroupMessage, Profile } from '@/lib/supabase/types'
import {
  formatDate,
  formatChatDividerTime,
  shouldShowChatDivider,
  formatBubbleTime,
  formatGroupSystemMessage,
  parsePostShareMessage,
  cn,
} from '@/lib/utils'
import { Send, ArrowLeft, Loader2, Users, Info, ArrowRight, Palette } from 'lucide-react'
import GroupInfoModal from './GroupInfoModal'
import { getChatTheme, type ChatThemeId } from '@/lib/chatThemes'
import ChatThemeModal from './ChatThemeModal'

interface GroupMessageThreadProps {
  group: Group
  members: GroupMember[]
  currentUserId: string
  initialMessages: GroupMessage[]
}

export default function GroupMessageThread({
  group,
  members,
  currentUserId,
  initialMessages,
}: GroupMessageThreadProps) {
  const [currentGroup, setCurrentGroup] = useState<Group>(group)
  const [currentMembers, setCurrentMembers] = useState<GroupMember[]>(members)
  const [messages, setMessages] = useState<GroupMessage[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [themeId, setThemeId] = useState<ChatThemeId>('classic')
  const [themeModalOpen, setThemeModalOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`qalam_chat_theme_group_${group.id}`)
      if (saved) setThemeId(saved as ChatThemeId)
    } catch {}
  }, [group.id])

  const handleSelectTheme = (newThemeId: ChatThemeId) => {
    setThemeId(newThemeId)
    try {
      localStorage.setItem(`qalam_chat_theme_group_${group.id}`, newThemeId)
    } catch {}
  }

  const currentTheme = getChatTheme(themeId)

  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  // Member map by user_id for quick avatar/name resolution
  const memberMap = useRef<Record<string, Profile>>({})
  currentMembers.forEach((m) => {
    if (m.profiles) memberMap.current[m.user_id] = m.profiles
  })

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time listener for group messages
  useEffect(() => {
    const channel = supabase
      .channel(`group_messages:${group.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${group.id}`,
        },
        async (payload: { new: GroupMessage }) => {
          const newMsg = payload.new
          // Check if already in list
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev
            // Attach sender profile from cache or fallback
            const senderProfile = memberMap.current[newMsg.sender_id]
            return [...prev, { ...newMsg, profiles: senderProfile }]
          })

          // If sender not in cache, fetch profile asynchronously
          if (!memberMap.current[newMsg.sender_id]) {
            const { data } = await sb
              .from('profiles')
              .select('*')
              .eq('id', newMsg.sender_id)
              .single()

            if (data) {
              memberMap.current[newMsg.sender_id] = data as Profile
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === newMsg.id ? { ...m, profiles: data as Profile } : m
                )
              )
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [group.id, supabase, sb])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = newMessage.trim()
    if (!body || sending) return

    setSending(true)
    setNewMessage('')

    try {
      const { data, error } = await sb
        .from('group_messages')
        .insert({
          group_id: group.id,
          sender_id: currentUserId,
          body,
        })
        .select('*, profiles(*)')
        .single()

      if (error) throw error

      if (data) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === data.id)) return prev
          return [...prev, data as GroupMessage]
        })
      }
    } catch (err) {
      console.error('Failed to send group message:', err)
      setNewMessage(body)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.9)] backdrop-blur-md z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/messages"
            className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
            aria-label="Back to messages"
          >
            <ArrowLeft size={18} />
          </Link>

          <button
            onClick={() => setInfoOpen(true)}
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition-opacity"
          >
            {currentGroup.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentGroup.avatar_url}
                alt={currentGroup.name}
                className="w-9 h-9 rounded-xl object-cover shrink-0 border border-[hsl(var(--border))]"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.6)] text-[hsl(var(--primary-foreground))] flex items-center justify-center shrink-0 shadow-xs">
                <Users size={18} />
              </div>
            )}
            <div className="min-w-0">
              <h1
                className="font-bold text-sm sm:text-base leading-none text-[hsl(var(--foreground))] truncate"
                style={{ fontFamily: 'Lora, Georgia, serif' }}
              >
                {currentGroup.name}
              </h1>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 truncate">
                {currentMembers.length} member{currentMembers.length !== 1 ? 's' : ''} • Tap for group info
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setThemeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-all shadow-2xs"
            title="Change chat theme"
            aria-label="Change chat theme"
          >
            <Palette size={15} />
            <span className="text-xs font-medium hidden sm:inline">Theme</span>
            <span className="text-xs">{currentTheme.icon}</span>
          </button>

          <button
            onClick={() => setInfoOpen(true)}
            className="p-2 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
            title="Group Info"
            aria-label="Group details"
          >
            <Info size={17} />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3 transition-colors duration-300"
        style={currentTheme.backgroundStyle}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-[hsl(var(--muted-foreground))]">
            <div className="p-3 rounded-2xl bg-[hsl(var(--muted)/0.5)] mb-3">
              <Users size={28} className="opacity-40" />
            </div>
            <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
              Welcome to {group.name}!
            </p>
            <p className="text-xs max-w-xs mt-1">
              Send the first poem, shayari, or greeting to start the conversation with the group.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const prevMsg = idx > 0 ? messages[idx - 1] : undefined
            const showDivider = shouldShowChatDivider(msg.created_at, prevMsg?.created_at)
            const isSelf = msg.sender_id === currentUserId
            const sender = msg.profiles || memberMap.current[msg.sender_id]
            const systemInfo = formatGroupSystemMessage(
              msg.body,
              msg.sender_id,
              currentUserId,
              sender
            )

            return (
              <div key={msg.id} className="w-full flex flex-col">
                {/* Centered Timestamp Divider (e.g., Wed 10:40 PM) */}
                {showDivider && (
                  <div className="flex justify-center my-3.5 select-none">
                    <span
                      className={cn(
                        'text-[11px] font-medium tracking-wide px-3 py-1 rounded-full shadow-2xs backdrop-blur-xs transition-colors',
                        currentTheme.dividerClass
                      )}
                    >
                      {formatChatDividerTime(msg.created_at)}
                    </span>
                  </div>
                )}

                {/* System notification or standard message bubble */}
                {systemInfo.isSystem ? (
                  <div className="flex justify-center my-2 px-4 text-center select-none">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed max-w-sm">
                      {systemInfo.text}
                    </p>
                  </div>
                ) : (
                  <div
                    className={`flex gap-2.5 max-w-[85%] sm:max-w-[70%] ${
                      isSelf ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    {/* Sender avatar if message is from another member */}
                    {!isSelf && (
                      <Link
                        href={sender ? `/u/${sender.username}` : '#'}
                        className="shrink-0 self-end mb-1"
                        title={sender?.display_name}
                      >
                        {sender?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sender.avatar_url}
                            alt={sender.display_name}
                            className="w-7 h-7 rounded-full object-cover border border-[hsl(var(--border))]"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] flex items-center justify-center text-[10px] font-bold">
                            {sender?.display_name?.slice(0, 2).toUpperCase() || 'QA'}
                          </div>
                        )}
                      </Link>
                    )}

                    <div
                      className={`flex flex-col ${
                        isSelf ? 'items-end' : 'items-start'
                      }`}
                    >
                      {/* Sender identity on incoming message */}
                      {!isSelf && sender && (
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-xs font-semibold text-[hsl(var(--primary))]">
                            {sender.display_name}
                          </span>
                          <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">
                            @{sender.username}
                          </span>
                        </div>
                      )}

                      {/* Message bubble */}
                      {(() => {
                        const sharedPost = parsePostShareMessage(msg.body)

                        return (
                          <div
                            className={cn(
                              'rounded-2xl px-3.5 py-2.5 text-sm break-words transition-all duration-150',
                              isSelf
                                ? currentTheme.bubbleOwnClass
                                : currentTheme.bubbleOtherClass
                            )}
                          >
                            {sharedPost ? (
                              <div>
                                {sharedPost.note && (
                                  <p className="whitespace-pre-wrap break-words leading-relaxed mb-2">
                                    {sharedPost.note}
                                  </p>
                                )}
                                <Link
                                  href={`/post/${sharedPost.id}`}
                                  className={cn(
                                    'block p-3 rounded-xl border transition-all text-left shadow-2xs group/card',
                                    isSelf
                                      ? 'bg-black/30 border-white/20 text-white hover:border-white/40'
                                      : 'bg-black/20 border-white/10 text-white hover:border-white/30'
                                  )}
                                >
                                  <div className="flex items-center gap-2 mb-1.5">
                                    {sharedPost.author_avatar ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={sharedPost.author_avatar}
                                        alt={sharedPost.author_name}
                                        className="w-5 h-5 rounded-full object-cover border border-white/20"
                                      />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[9px] font-bold">
                                        {sharedPost.author_name.slice(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold leading-tight truncate text-white">
                                        {sharedPost.author_name}
                                      </p>
                                      {sharedPost.author_username && (
                                        <p className="text-[10px] text-white/70 font-mono leading-tight truncate">
                                          @{sharedPost.author_username}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {sharedPost.title && (
                                    <p
                                      className="font-bold text-xs mb-1 text-white truncate"
                                      style={{ fontFamily: 'Lora, Georgia, serif' }}
                                    >
                                      {sharedPost.title}
                                    </p>
                                  )}

                                  <p className="text-xs text-white/80 line-clamp-3 italic whitespace-pre-line leading-relaxed">
                                    &ldquo;{sharedPost.preview}&rdquo;
                                  </p>

                                  <div className="mt-2 pt-1.5 border-t border-white/15 flex items-center justify-between text-[11px] font-medium text-white group-hover/card:translate-x-0.5 transition-transform">
                                    <span>Read poem</span>
                                    <ArrowRight size={12} />
                                  </div>
                                </Link>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                            )}
                            <p
                              className={cn(
                                'text-[10px] mt-1 text-right select-none',
                                isSelf ? currentTheme.timeOwnClass : currentTheme.timeOtherClass
                              )}
                            >
                              {formatBubbleTime(msg.created_at)}
                            </p>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSend}
        className="flex gap-2 p-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--background)/0.9)] backdrop-blur-md"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`Share with ${group.name}...`}
          disabled={sending}
          className="flex-1 px-4 py-2.5 bg-[hsl(var(--input)/0.5)] border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] placeholder:text-[hsl(var(--muted-foreground))]"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className={cn(
            'px-4 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity shadow-xs flex items-center justify-center',
            currentTheme.sendButtonClass || 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
          )}
          aria-label="Send message"
        >
          {sending ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Send size={17} />
          )}
        </button>
      </form>

      {/* Circle Info Drawer / Modal */}
      {infoOpen && (
        <GroupInfoModal
          group={currentGroup}
          members={currentMembers}
          currentUserId={currentUserId}
          onClose={() => setInfoOpen(false)}
          onGroupUpdated={(updated) => setCurrentGroup(updated)}
          onMembersUpdated={(updated) => setCurrentMembers(updated)}
        />
      )}

      {/* Chat Theme Modal */}
      <ChatThemeModal
        isOpen={themeModalOpen}
        currentThemeId={themeId}
        onSelectTheme={handleSelectTheme}
        onClose={() => setThemeModalOpen(false)}
      />
    </div>
  )
}
