'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
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
  parseChatMediaMessage,
  parseChatStickerMessage,
  type ChatMediaData,
  cn,
} from '@/lib/utils'
import { ArrowLeft, Users, Info, ArrowRight, Palette, AtSign, ChevronDown } from 'lucide-react'
import GroupInfoModal from './GroupInfoModal'
import { getChatTheme, getThemeDisplayName, CHAT_THEMES, type ChatThemeId } from '@/lib/chatThemes'
import type { ChatSticker } from '@/lib/chatStickers'
import ChatThemeModal from './ChatThemeModal'
import ChatInputBar, { type MentionSuggestion } from './ChatInputBar'
import MessageBodyWithMentions from './MessageBodyWithMentions'
import MessageStatusTicks, { type MessageDeliveryStatus } from './MessageStatusTicks'
import MediaLightboxModal from './MediaLightboxModal'

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
  const [sending, setSending] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
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
        localStorage.setItem(`qalam_chat_theme_group_${group.id}`, foundTheme)
      } catch {}
    } else {
      try {
        const saved = localStorage.getItem(`qalam_chat_theme_group_${group.id}`)
        if (saved && CHAT_THEMES[saved as ChatThemeId]) setThemeId(saved as ChatThemeId)
      } catch {}
    }
  }, [group.id, initialMessages])

  const handleSelectTheme = async (newThemeId: ChatThemeId) => {
    if (newThemeId === themeId) return
    setThemeId(newThemeId)
    try {
      localStorage.setItem(`qalam_chat_theme_group_${group.id}`, newThemeId)
    } catch {}

    const themeDisplayName = getThemeDisplayName(newThemeId)
    const body = `[system]:theme|${newThemeId}|${themeDisplayName}`

    try {
      const { data, error } = await sb
        .from('group_messages')
        .insert({
          group_id: group.id,
          sender_id: currentUserId,
          body,
        })
        .select('*')
        .single()

      if (!error && data) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === data.id)) return prev
          const senderProfile = memberMap.current[currentUserId]
          return [...prev, { ...data, profiles: senderProfile }]
        })
      }
    } catch (err) {
      console.error('Failed to post theme change message:', err)
    }
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

  // Current user's username for detecting mention highlights
  const currentUsername = useMemo(() => {
    const myProfile = currentMembers.find((m) => m.user_id === currentUserId)?.profiles
    return myProfile?.username || memberMap.current[currentUserId]?.username
  }, [currentMembers, currentUserId])

  // Known users in group for mention lookup
  const knownUsers = useMemo(() => {
    return currentMembers
      .filter((m) => m.profiles?.username)
      .map((m) => ({
        username: m.profiles!.username,
        displayName: m.profiles!.display_name,
      }))
  }, [currentMembers])

  // Mention suggestions for autocomplete dropdown in input bar
  const mentionSuggestions: MentionSuggestion[] = useMemo(() => {
    const list: MentionSuggestion[] = []

    if (currentMembers.length > 1) {
      list.push({
        id: 'everyone',
        username: 'everyone',
        displayName: 'Everyone in circle',
        badge: 'Notify all',
        isSpecial: true,
      })
    }

    currentMembers.forEach((m) => {
      // Exclude oneself so you only mention other circle members
      if (m.user_id !== currentUserId && m.profiles?.username) {
        list.push({
          id: m.user_id,
          username: m.profiles.username,
          displayName: m.profiles.display_name || m.profiles.username,
          avatarUrl: m.profiles.avatar_url,
          badge: m.role === 'admin' ? 'Admin' : undefined,
        })
      }
    })

    return list
  }, [currentMembers, currentUserId])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark group messages as read when opening circle chat
  useEffect(() => {
    sb.rpc('mark_group_messages_read', {
      p_group_id: group.id,
      p_user_id: currentUserId,
    }).then(() => {}).catch(() => {})
  }, [group.id, currentUserId, sb])

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

          if (!isScrolledUpRef.current) {
            setTimeout(() => scrollToBottom('smooth'), 60)
          } else if (newMsg.sender_id !== currentUserId) {
            setUnreadBelowCount((c) => c + 1)
          }

          // Mark incoming message as read since user is actively viewing
          if (newMsg.sender_id !== currentUserId) {
            sb.rpc('mark_group_messages_read', {
              p_group_id: group.id,
              p_user_id: currentUserId,
            }).then(() => {}).catch(() => {})
          }

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

          // If this is a theme update, automatically switch the chat theme in realtime!
          if (newMsg.body.startsWith('[system]:theme|')) {
            const parts = newMsg.body.slice(9).split('|')
            const incomingThemeId = parts[0] as ChatThemeId
            if (incomingThemeId && CHAT_THEMES[incomingThemeId]) {
              setThemeId(incomingThemeId)
              try {
                localStorage.setItem(`qalam_chat_theme_group_${group.id}`, incomingThemeId)
              } catch {}
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${group.id}`,
        },
        (payload: { new: GroupMessage }) => {
          const updated = payload.new
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updated.id
                ? { ...m, ...updated, profiles: m.profiles || memberMap.current[updated.sender_id] }
                : m
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [group.id, supabase, currentUserId, sb])

  const handleSendText = async (text: string) => {
    if (!text.trim() || sending) return
    setSending(true)

    try {
      const { data, error } = await sb
        .from('group_messages')
        .insert({
          group_id: group.id,
          sender_id: currentUserId,
          body: text.trim(),
        })
        .select('*, profiles(*)')
        .single()

      if (error) throw error

      if (data) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === data.id)) return prev
          return [...prev, data as GroupMessage]
        })
        setTimeout(() => scrollToBottom('smooth'), 50)
      }

      // Check for mentions and trigger notifications for mentioned members
      try {
        const mentionMatches = text.match(/@([a-zA-Z0-9_.-]+)/g)
        if (mentionMatches && mentionMatches.length > 0) {
          const mentionedUserIds = new Set<string>()

          for (const match of mentionMatches) {
            const handle = match.slice(1).toLowerCase()
            if (handle === 'everyone' || handle === 'all') {
              currentMembers.forEach((m) => {
                if (m.user_id !== currentUserId) mentionedUserIds.add(m.user_id)
              })
            } else {
              const target = currentMembers.find(
                (m) => m.profiles?.username?.toLowerCase() === handle
              )
              if (target && target.user_id !== currentUserId) {
                mentionedUserIds.add(target.user_id)
              }
            }
          }

          if (mentionedUserIds.size > 0) {
            const notifs = Array.from(mentionedUserIds).map((userId) => ({
              user_id: userId,
              type: 'message',
              payload: {
                group_id: group.id,
                group_name: group.name,
                from_user_id: currentUserId,
                is_mention: true,
                snippet: text.trim().slice(0, 100),
              },
            }))

            await sb.from('notifications').insert(notifs)
          }
        }
      } catch (notifErr) {
        console.warn('Mention notification trigger notice:', notifErr)
      }
    } catch (err) {
      console.error('Failed to send group message:', err)
    } finally {
      setSending(false)
    }
  }

  const handleSendMedia = async (mediaData: ChatMediaData) => {
    if (sending) return
    setSending(true)
    const body = `[media]:${JSON.stringify(mediaData)}`

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
        setTimeout(() => scrollToBottom('smooth'), 50)
      }
    } catch (err) {
      console.error('Failed to send group media:', err)
    } finally {
      setSending(false)
    }
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
        setTimeout(() => scrollToBottom('smooth'), 50)
      }
    } catch (err) {
      console.error('Failed to send group sticker:', err)
    } finally {
      setSending(false)
    }
  }

  const getGroupTickStatus = (msg: GroupMessage): MessageDeliveryStatus => {
    const readBy = (msg as any).read_by as string[] | undefined
    if (Array.isArray(readBy) && readBy.some((id) => id !== currentUserId)) {
      return 'read'
    }
    return 'delivered'
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden" style={currentTheme.backgroundStyle}>
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
      <div className="flex-1 relative min-h-0">
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto p-4 space-y-3 transition-colors duration-300"
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

                      {/* Message bubble or sticker */}
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
                                    isSelf ? currentTheme.timeOwnClass : currentTheme.timeOtherClass
                                  )}
                                >
                                  {formatBubbleTime(msg.created_at)}
                                </span>
                                {isSelf && (
                                  <MessageStatusTicks status={getGroupTickStatus(msg)} />
                                )}
                              </div>
                            </div>
                          )
                        }

                        const media = parseChatMediaMessage(msg.body)
                        const sharedPost = parsePostShareMessage(msg.body)

                        const isUserMentioned =
                          !isSelf &&
                          Boolean(
                            (currentUsername &&
                              msg.body
                                .toLowerCase()
                                .includes(`@${currentUsername.toLowerCase()}`)) ||
                              msg.body.toLowerCase().includes('@everyone') ||
                              msg.body.toLowerCase().includes('@all')
                          )

                        return (
                          <div
                            className={cn(
                              'rounded-2xl px-3.5 py-2.5 text-sm break-words transition-all duration-150 relative',
                              isSelf
                                ? currentTheme.bubbleOwnClass
                                : currentTheme.bubbleOtherClass,
                              isUserMentioned && 'ring-2 ring-amber-400/70 shadow-md'
                            )}
                          >
                            {isUserMentioned && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-300 dark:text-amber-400 mb-1.5 select-none tracking-wide uppercase">
                                <AtSign size={11} className="shrink-0" />
                                <span>You were mentioned</span>
                              </div>
                            )}
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
                              <MessageBodyWithMentions
                                body={msg.body}
                                currentUsername={currentUsername}
                                knownUsers={knownUsers}
                              />
                            )}
                            <div className="flex items-center justify-end gap-1 mt-1 select-none">
                              <span
                                className={cn(
                                  'text-[10px]',
                                  isSelf ? currentTheme.timeOwnClass : currentTheme.timeOtherClass
                                )}
                              >
                                {formatBubbleTime(msg.created_at)}
                              </span>
                              {isSelf && (
                                <MessageStatusTicks status={getGroupTickStatus(msg)} />
                              )}
                            </div>
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

      {/* Pill Chat Input Bar with Mentions */}
      <ChatInputBar
        placeholder={`Share with ${group.name}…`}
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
