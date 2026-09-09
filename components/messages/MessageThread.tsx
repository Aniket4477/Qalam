'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Message, Profile } from '@/lib/supabase/types'
import {
  formatDate,
  formatChatDividerTime,
  shouldShowChatDivider,
  formatBubbleTime,
  parsePostShareMessage,
  cn,
} from '@/lib/utils'
import { Send, ArrowLeft, Loader2, ArrowRight, Palette } from 'lucide-react'
import { getChatTheme, type ChatThemeId } from '@/lib/chatThemes'
import ChatThemeModal from './ChatThemeModal'

interface MessageThreadProps {
  conversationId: string
  currentUserId: string
  otherUser: Profile
  initialMessages: Message[]
}

export default function MessageThread({
  conversationId,
  currentUserId,
  otherUser,
  initialMessages,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [themeId, setThemeId] = useState<ChatThemeId>('classic')
  const [themeModalOpen, setThemeModalOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`qalam_chat_theme_${conversationId}`)
      if (saved) setThemeId(saved as ChatThemeId)
    } catch {}
  }, [conversationId])

  const handleSelectTheme = (newThemeId: ChatThemeId) => {
    setThemeId(newThemeId)
    try {
      localStorage.setItem(`qalam_chat_theme_${conversationId}`, newThemeId)
    } catch {}
  }

  const currentTheme = getChatTheme(themeId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload: { new: Message }) => {
          const newMsg = payload.new
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, supabase])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = newMessage.trim()
    if (!body || sending) return

    setSending(true)
    setNewMessage('')

    const { data, error } = await sb
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: currentUserId, body })
      .select('*')
      .single()

    if (error) {
      setNewMessage(body)
    } else if (data) {
      setMessages((prev) => {
        if (prev.find((m) => m.id === data.id)) return prev
        return [...prev, data as Message]
      })
    }
    setSending(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.9)] backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/messages" className="p-1.5 rounded-md text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors shrink-0">
            <ArrowLeft size={18} />
          </Link>
          <Link href={`/u/${otherUser.username}`} className="flex items-center gap-2 min-w-0">
            {otherUser.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={otherUser.avatar_url} alt={otherUser.display_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center text-xs font-semibold text-[hsl(var(--primary))] shrink-0">
                {otherUser.display_name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium text-sm leading-none truncate">{otherUser.display_name}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 truncate">@{otherUser.username}</p>
            </div>
          </Link>
        </div>

        {/* Theme Picker Button */}
        <button
          type="button"
          onClick={() => setThemeModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-all shadow-2xs shrink-0"
          title="Change chat theme"
          aria-label="Change chat theme"
        >
          <Palette size={15} />
          <span className="text-xs font-medium hidden sm:inline">Theme</span>
          <span className="text-xs">{currentTheme.icon}</span>
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 transition-colors duration-300"
        style={currentTheme.backgroundStyle}
      >
        {messages.length === 0 && (
          <div className="text-center text-sm text-[hsl(var(--muted-foreground))] py-8">
            Start a conversation with {otherUser.display_name}
          </div>
        )}
        {messages.map((msg, idx) => {
          const prevMsg = idx > 0 ? messages[idx - 1] : undefined
          const showDivider = shouldShowChatDivider(msg.created_at, prevMsg?.created_at)
          const isOwn = msg.sender_id === currentUserId

          return (
            <div key={msg.id} className="w-full flex flex-col">
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
              <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                {(() => {
                  const sharedPost = parsePostShareMessage(msg.body)

                  return (
                    <div
                      className={cn(
                        'max-w-xs md:max-w-sm lg:max-w-md px-3.5 py-2.5 rounded-2xl text-sm transition-all duration-150',
                        isOwn ? currentTheme.bubbleOwnClass : currentTheme.bubbleOtherClass
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
                              isOwn
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
                        <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.body}</p>
                      )}
                      <p
                        className={cn(
                          'text-[10px] mt-1 text-right select-none',
                          isOwn ? currentTheme.timeOwnClass : currentTheme.timeOtherClass
                        )}
                      >
                        {formatBubbleTime(msg.created_at)}
                      </p>
                    </div>
                  )
                })()}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 px-4 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`Message ${otherUser.display_name}…`}
          rows={1}
          className="flex-1 px-3 py-2 text-sm bg-[hsl(var(--input)/0.5)] border border-[hsl(var(--border))] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] placeholder:text-[hsl(var(--muted-foreground))]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent) }
          }}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className={cn(
            'p-2.5 rounded-lg transition-opacity disabled:opacity-40',
            currentTheme.sendButtonClass || 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
          )}
          aria-label="Send message"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>

      {/* Chat Theme Selector Modal */}
      <ChatThemeModal
        isOpen={themeModalOpen}
        currentThemeId={themeId}
        onSelectTheme={handleSelectTheme}
        onClose={() => setThemeModalOpen(false)}
      />
    </div>
  )
}
