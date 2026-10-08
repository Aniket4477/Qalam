'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Message, Profile } from '@/lib/supabase/types'
import {
  formatDate,
  formatChatDividerTime,
  shouldShowChatDivider,
  formatBubbleTime,
  formatGroupSystemMessage,
  parsePostShareMessage,
  parseChatMediaMessage,
  parseChatStickerMessage,
  type ChatMediaData,
  cn,
} from '@/lib/utils'
import { ArrowLeft, ArrowRight, Palette, ChevronDown } from 'lucide-react'
import { getChatTheme, getThemeDisplayName, CHAT_THEMES, type ChatThemeId } from '@/lib/chatThemes'
import type { ChatSticker } from '@/lib/chatStickers'
import ChatThemeModal from './ChatThemeModal'
import ChatInputBar, { type MentionSuggestion } from './ChatInputBar'
import MessageBodyWithMentions from './MessageBodyWithMentions'
import MessageStatusTicks, { type MessageDeliveryStatus } from './MessageStatusTicks'
import MediaLightboxModal from './MediaLightboxModal'

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
  const [sending, setSending] = useState(false)
  const [themeId, setThemeId] = useState<ChatThemeId>('classic')
  const [themeModalOpen, setThemeModalOpen] = useState(false)
  const [activeLightboxMedia, setActiveLightboxMedia] = useState<ChatMediaData | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const [unreadBelowCount, setUnreadBelowCount] = useState(0)
  const isScrolledUpRef = useRef(false)
  const isInitialMount = useRef(true)

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      })
    } else {
      bottomRef.current?.scrollIntoView({ behavior })
    }
    setShowScrollBottom(false)
    setUnreadBelowCount(0)
    isScrolledUpRef.current = false
  }

  const handleScroll = () => {
    const el = messagesContainerRef.current
    if (!el) return
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const isUp = distanceToBottom > 120
    setShowScrollBottom(isUp)
    isScrolledUpRef.current = isUp
    if (!isUp) {
      setUnreadBelowCount(0)
    }
  }

  useEffect(() => {
    if (messages.length > 0 && isInitialMount.current) {
      const timer = setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
          isInitialMount.current = false
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [messages.length])
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  // Load saved theme or sync from latest message in history
  useEffect(() => {
    let foundTheme: ChatThemeId | null = null
    for (let i = initialMessages.length - 1; i >= 0; i--) {
      if (initialMessages[i].body.startsWith('[system]:theme|')) {
        const parts = initialMessages[i].body.slice(9).split('|')
        const tId = parts[0] as ChatThemeId
        if (tId && CHAT_THEMES[tId]) {
          foundTheme = tId
          break
        }
      }
    }

    if (foundTheme) {
      setThemeId(foundTheme)
      try {
        localStorage.setItem(`qalam_chat_theme_${conversationId}`, foundTheme)
      } catch {}
    } else {
      try {
        const saved = localStorage.getItem(`qalam_chat_theme_${conversationId}`)
        if (saved && CHAT_THEMES[saved as ChatThemeId]) setThemeId(saved as ChatThemeId)
      } catch {}
    }
  }, [conversationId, initialMessages])

  const handleSelectTheme = async (newThemeId: ChatThemeId) => {
    if (newThemeId === themeId) return
    setThemeId(newThemeId)
    try {
      localStorage.setItem(`qalam_chat_theme_${conversationId}`, newThemeId)
    } catch {}

    const themeDisplayName = getThemeDisplayName(newThemeId)
    const body = `[system]:theme|${newThemeId}|${themeDisplayName}`

    try {
      const { data, error } = await sb
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: currentUserId, body })
        .select('*')
        .single()

      if (!error && data) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === data.id)) return prev
          return [...prev, data as Message]
        })
        setTimeout(() => scrollToBottom('smooth'), 50)
      }
    } catch (err) {
      console.error('Failed to post theme change message:', err)
    }
  }

  const currentTheme = getChatTheme(themeId)

  const mentionSuggestions: MentionSuggestion[] = useMemo(() => [
    {
      id: otherUser.id,
      username: otherUser.username,
      displayName: otherUser.display_name,
      avatarUrl: otherUser.avatar_url,
    },
  ], [otherUser])

  const knownUsers = useMemo(() => [
    {
      username: otherUser.username,
      displayName: otherUser.display_name,
    },
  ], [otherUser])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark incoming unread messages as read when opening conversation
  useEffect(() => {
    sb.from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', currentUserId)
      .is('read_at', null)
      .then(() => {})
  }, [conversationId, currentUserId, sb])

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

          if (!isScrolledUpRef.current) {
            setTimeout(() => scrollToBottom('smooth'), 60)
          } else if (newMsg.sender_id !== currentUserId) {
            setUnreadBelowCount((c) => c + 1)
          }

          // If incoming message from other user, mark as read immediately
          if (newMsg.sender_id !== currentUserId) {
            sb.from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMsg.id)
              .then(() => {})
          }

          // If this is a theme update, automatically switch the chat theme in realtime!
          if (newMsg.body.startsWith('[system]:theme|')) {
            const parts = newMsg.body.slice(9).split('|')
            const incomingThemeId = parts[0] as ChatThemeId
            if (incomingThemeId && CHAT_THEMES[incomingThemeId]) {
              setThemeId(incomingThemeId)
              try {
                localStorage.setItem(`qalam_chat_theme_${conversationId}`, incomingThemeId)
              } catch {}
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload: { new: Message }) => {
          const updated = payload.new
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, supabase, currentUserId, sb])

  const handleSendText = async (text: string) => {
    if (!text.trim() || sending) return
    setSending(true)

    const { data, error } = await sb
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: currentUserId, body: text.trim() })
      .select('*')
      .single()

    if (!error && data) {
      setMessages((prev) => {
        if (prev.find((m) => m.id === data.id)) return prev
        return [...prev, data as Message]
      })
      setTimeout(() => scrollToBottom('smooth'), 50)
    }
    setSending(false)
  }

  const handleSendMedia = async (mediaData: ChatMediaData) => {
    if (sending) return
    setSending(true)
    const body = `[media]:${JSON.stringify(mediaData)}`

    const { data, error } = await sb
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: currentUserId, body })
      .select('*')
      .single()

    if (!error && data) {
      setMessages((prev) => {
        if (prev.find((m) => m.id === data.id)) return prev
        return [...prev, data as Message]
      })
      setTimeout(() => scrollToBottom('smooth'), 50)
    }
    setSending(false)
  }

  const handleSendSticker = async (sticker: ChatSticker) => {
    if (sending) return
    setSending(true)
    const body = `[sticker]:${JSON.stringify({
      id: sticker.id,
      name: sticker.name,
      emoji: sticker.emoji,
      badgeText: sticker.badgeText,
      badgeSubtext: sticker.badgeSubtext,
      bgGradient: sticker.bgGradient,
      borderColor: sticker.borderColor,
      textColor: sticker.textColor,
    })}`

    const { data, error } = await sb
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: currentUserId, body })
      .select('*')
      .single()

    if (!error && data) {
      setMessages((prev) => {
        if (prev.find((m) => m.id === data.id)) return prev
        return [...prev, data as Message]
      })
      setTimeout(() => scrollToBottom('smooth'), 50)
    }
    setSending(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden" style={currentTheme.backgroundStyle}>
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

      {/* Messages Stream */}
      <div className="flex-1 relative min-h-0">
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-4 py-4 space-y-3 transition-colors duration-300"
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
          const systemInfo = formatGroupSystemMessage(
            msg.body,
            msg.sender_id,
            currentUserId,
            isOwn ? null : otherUser
          )

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

              {systemInfo.isSystem ? (
                <div className="flex justify-center my-2 px-4 text-center select-none">
                  <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed max-w-sm">
                    {systemInfo.text}
                  </p>
                </div>
              ) : (
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  {(() => {
                    const sticker = parseChatStickerMessage(msg.body)
                    if (sticker) {
                      return (
                        <div className="flex flex-col items-center select-none py-1 group/sticker">
                          <div
                            className={cn(
                              'relative flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 text-center hover:scale-105 shadow-md bg-gradient-to-b cursor-default',
                              sticker.bgGradient || 'from-zinc-900 via-zinc-900 to-black',
                              sticker.borderColor || 'border-zinc-700/50'
                            )}
                          >
                            <span className="text-3xl sm:text-4xl mb-1 filter drop-shadow-md">
                              {sticker.emoji}
                            </span>
                            {sticker.badgeText && (
                              <span
                                className={cn(
                                  'text-xs sm:text-sm font-bold leading-tight',
                                  sticker.textColor || 'text-amber-300'
                                )}
                                style={{ fontFamily: 'Lora, Georgia, serif' }}
                              >
                                {sticker.badgeText}
                              </span>
                            )}
                            {sticker.badgeSubtext && (
                              <span className="text-[10px] sm:text-[11px] text-zinc-400 font-medium leading-tight mt-0.5">
                                {sticker.badgeSubtext}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-center gap-1 mt-1 select-none">
                            <span
                              className={cn(
                                'text-[10px]',
                                isOwn ? currentTheme.timeOwnClass : currentTheme.timeOtherClass
                              )}
                            >
                              {formatBubbleTime(msg.created_at)}
                            </span>
                            {isOwn && (
                              <MessageStatusTicks status={msg.read_at ? 'read' : 'delivered'} />
                            )}
                          </div>
                        </div>
                      )
                    }

                    const media = parseChatMediaMessage(msg.body)
                    const sharedPost = parsePostShareMessage(msg.body)

                    return (
                      <div
                        className={cn(
                          'max-w-xs md:max-w-sm lg:max-w-md px-3.5 py-2.5 rounded-2xl text-sm transition-all duration-150',
                          isOwn ? currentTheme.bubbleOwnClass : currentTheme.bubbleOtherClass
                        )}
                      >
                        {media ? (
                          <div className="space-y-1.5">
                            <div
                              className="relative rounded-xl overflow-hidden cursor-pointer group/media bg-black/40 border border-white/10"
                              onClick={() => setActiveLightboxMedia(media)}
                            >
                              {media.type === 'video' ? (
                                <video
                                  src={media.url}
                                  className="max-h-72 w-full object-cover rounded-xl"
                                  controls
                                />
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={media.url}
                                  alt={media.caption || 'Shared photo'}
                                  className="max-h-72 w-full object-cover rounded-xl transition-transform duration-200 group-hover/media:scale-102"
                                  loading="lazy"
                                />
                              )}
                            </div>
                            {media.caption && (
                              <p className="whitespace-pre-wrap break-words leading-relaxed text-sm pt-0.5">
                                {media.caption}
                              </p>
                            )}
                          </div>
                        ) : sharedPost ? (
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
                          <MessageBodyWithMentions
                            body={msg.body}
                            knownUsers={knownUsers}
                          />
                        )}
                        <div className="flex items-center justify-end gap-1 mt-1 select-none">
                          <span
                            className={cn(
                              'text-[10px]',
                              isOwn ? currentTheme.timeOwnClass : currentTheme.timeOtherClass
                            )}
                          >
                            {formatBubbleTime(msg.created_at)}
                          </span>
                          {isOwn && (
                            <MessageStatusTicks status={msg.read_at ? 'read' : 'delivered'} />
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )
        })}
          <div ref={bottomRef} />
        </div>

        {/* Floating Scroll To Bottom Button */}
        {showScrollBottom && (
          <button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            className="absolute right-4 sm:right-6 bottom-4 z-20 w-10 h-10 rounded-full bg-zinc-800/95 hover:bg-zinc-700 text-zinc-100 hover:text-white shadow-xl backdrop-blur-md border border-white/15 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 animate-fade-in cursor-pointer"
            aria-label="Scroll to latest messages"
            title="Scroll to latest messages"
          >
            <ChevronDown size={20} className="stroke-[2.5]" />
            {unreadBelowCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {unreadBelowCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Instagram-inspired Pill Chat Input Bar */}
      <ChatInputBar
        placeholder={`Message ${otherUser.display_name}…`}
        sending={sending}
        onSendText={handleSendText}
        onSendMedia={handleSendMedia}
        onSendSticker={handleSendSticker}
        mentionSuggestions={mentionSuggestions}
      />

      {/* Media Lightbox Viewer Modal */}
      <MediaLightboxModal
        media={activeLightboxMedia}
        onClose={() => setActiveLightboxMedia(null)}
      />

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
