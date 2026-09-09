'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDate, cn } from '@/lib/utils'
import { MessageCircle } from 'lucide-react'
import type { Profile } from '@/lib/supabase/types'

interface Conversation {
  id: string
  user_one_id: string
  user_two_id: string
  created_at: string
  user_one: Profile
  user_two: Profile
}

interface LastMsg {
  body: string
  created_at: string
  sender_id: string
}

interface MessagesClientProps {
  currentUserId: string
  conversations: Conversation[]
  lastMsgMap: Record<string, LastMsg>
  unreadCountMap?: Record<string, number>
}

export default function MessagesClient({
  currentUserId,
  conversations,
  lastMsgMap,
  unreadCountMap = {},
}: MessagesClientProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const totalUnreadConversations = conversations.filter(
    (c) => (unreadCountMap[c.id] ?? 0) > 0
  ).length

  const filteredConversations = conversations.filter((c) => {
    if (filter === 'unread') {
      return (unreadCountMap[c.id] ?? 0) > 0
    }
    return true
  })

  if (conversations.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <MessageCircle
          size={40}
          className="mx-auto text-[hsl(var(--muted-foreground))] mb-4 opacity-30"
        />
        <h1
          className="text-xl font-semibold mb-2"
          style={{ fontFamily: 'Lora, Georgia, serif' }}
        >
          No messages yet
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Visit a poet&apos;s profile and click &quot;Message&quot; to start a conversation.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'Lora, Georgia, serif' }}
          >
            Messages
          </h1>
          {totalUnreadConversations > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-xs">
              {totalUnreadConversations} unread
            </span>
          )}
        </div>

        {totalUnreadConversations > 0 && (
          <div className="flex gap-1 p-1 bg-[hsl(var(--muted)/0.6)] rounded-lg text-xs font-medium">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-colors',
                filter === 'all'
                  ? 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-xs font-semibold'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              All ({conversations.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-colors',
                filter === 'unread'
                  ? 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-xs font-semibold'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              Unread ({totalUnreadConversations})
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {filteredConversations.length === 0 && filter === 'unread' ? (
          <div className="text-center py-12 border border-dashed border-[hsl(var(--border))] rounded-xl text-sm text-[hsl(var(--muted-foreground))]">
            No unread messages. You&apos;re all caught up!
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const otherUser =
              conv.user_one_id === currentUserId ? conv.user_two : conv.user_one
            const lastMsg = lastMsgMap[conv.id]
            const unreadCount = unreadCountMap[conv.id] ?? 0
            const hasUnread = unreadCount > 0

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className={cn(
                  'flex items-center gap-3.5 p-3.5 rounded-xl border transition-all relative group',
                  hasUnread
                    ? 'border-[hsl(var(--primary)/0.45)] bg-[hsl(var(--primary)/0.04)] dark:bg-[hsl(var(--primary)/0.09)] shadow-xs hover:border-[hsl(var(--primary)/0.7)]'
                    : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] hover:border-[hsl(var(--border))]'
                )}
              >
                {/* Left: Avatar with optional unread indicator */}
                <div className="relative shrink-0">
                  {otherUser?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={otherUser.avatar_url}
                      alt={otherUser.display_name}
                      className={cn(
                        'w-11 h-11 rounded-full object-cover border',
                        hasUnread
                          ? 'border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary)/0.2)]'
                          : 'border-[hsl(var(--border))]'
                      )}
                    />
                  ) : (
                    <div
                      className={cn(
                        'w-11 h-11 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 border',
                        hasUnread
                          ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary)/0.2)]'
                          : 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] border-[hsl(var(--border))]'
                      )}
                    >
                      {otherUser?.display_name?.slice(0, 2).toUpperCase() ?? '?'}
                    </div>
                  )}
                  {hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[hsl(var(--primary))] border-2 border-[hsl(var(--background))] shadow-xs animate-pulse" />
                  )}
                </div>

                {/* Center: Author and snippet */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p
                        className={cn(
                          'text-sm truncate',
                          hasUnread
                            ? 'font-bold text-[hsl(var(--foreground))]'
                            : 'font-medium text-[hsl(var(--foreground))]'
                        )}
                      >
                        {otherUser?.display_name}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate hidden sm:inline">
                        @{otherUser?.username}
                      </p>
                    </div>

                    {lastMsg && (
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {hasUnread && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] tabular-nums shadow-xs">
                            {unreadCount} new
                          </span>
                        )}
                        <span
                          className={cn(
                            'text-xs shrink-0',
                            hasUnread
                              ? 'text-[hsl(var(--primary))] font-semibold'
                              : 'text-[hsl(var(--muted-foreground))]'
                          )}
                        >
                          {formatDate(lastMsg.created_at)}
                        </span>
                      </div>
                    )}
                  </div>

                  <p
                    className={cn(
                      'text-xs truncate mt-1',
                      hasUnread
                        ? 'font-semibold text-[hsl(var(--foreground))]'
                        : 'text-[hsl(var(--muted-foreground))]'
                    )}
                  >
                    {lastMsg
                      ? `${lastMsg.sender_id === currentUserId ? 'You: ' : ''}${lastMsg.body}`
                      : 'Start a conversation'}
                  </p>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
