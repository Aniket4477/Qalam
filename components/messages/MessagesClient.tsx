'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDate, cn } from '@/lib/utils'
import { MessageCircle, SquarePen, Users, Plus } from 'lucide-react'
import type { Profile, GroupWithMeta } from '@/lib/supabase/types'
import CreateGroupModal from './CreateGroupModal'

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
  groups?: GroupWithMeta[]
  lastMsgMap: Record<string, LastMsg>
  unreadCountMap?: Record<string, number>
}

type FilterTab = 'all' | 'direct' | 'groups' | 'unread'

export default function MessagesClient({
  currentUserId,
  conversations,
  groups = [],
  lastMsgMap,
  unreadCountMap = {},
}: MessagesClientProps) {
  const [filter, setFilter] = useState<FilterTab>('all')
  const [createGroupOpen, setCreateGroupOpen] = useState(false)

  const totalUnreadConversations = conversations.filter(
    (c) => (unreadCountMap[c.id] ?? 0) > 0
  ).length

  const hasAnyChats = conversations.length > 0 || groups.length > 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <h1
            className="text-2xl font-bold text-[hsl(var(--foreground))]"
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

        {/* Action Buttons: New Group & New Chat */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setCreateGroupOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-xs sm:text-sm font-medium hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--primary))] transition-all shadow-xs"
          >
            <Users size={15} />
            <span>Create Group</span>
          </button>

          <Link
            href="/messages/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity shadow-xs"
          >
            <SquarePen size={15} />
            <span>New Chat</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      {hasAnyChats && (
        <div className="flex items-center gap-1.5 mb-5 p-1 bg-[hsl(var(--muted)/0.6)] rounded-xl text-xs font-medium w-fit overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg transition-colors',
              filter === 'all'
                ? 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-xs font-semibold'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            )}
          >
            All ({conversations.length + groups.length})
          </button>

          <button
            onClick={() => setFilter('direct')}
            className={cn(
              'px-3 py-1.5 rounded-lg transition-colors',
              filter === 'direct'
                ? 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-xs font-semibold'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            )}
          >
            Direct ({conversations.length})
          </button>

          <button
            onClick={() => setFilter('groups')}
            className={cn(
              'px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1',
              filter === 'groups'
                ? 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-xs font-semibold'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            )}
          >
            <Users size={12} />
            <span>Circles ({groups.length})</span>
          </button>

          {totalUnreadConversations > 0 && (
            <button
              onClick={() => setFilter('unread')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-colors',
                filter === 'unread'
                  ? 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-xs font-semibold'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              Unread ({totalUnreadConversations})
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {!hasAnyChats && (
        <div className="max-w-md mx-auto px-4 py-16 text-center border border-dashed border-[hsl(var(--border))] rounded-2xl bg-[hsl(var(--card))]">
          <MessageCircle
            size={44}
            className="mx-auto text-[hsl(var(--muted-foreground))] mb-4 opacity-30"
          />
          <h2
            className="text-lg font-semibold mb-1"
            style={{ fontFamily: 'Lora, Georgia, serif' }}
          >
            No messages yet
          </h2>
          <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] mb-6 max-w-xs mx-auto">
            Connect with fellow poets in 1-on-1 chats or create a poetry circle group.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => setCreateGroupOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-[hsl(var(--border))] rounded-xl text-xs sm:text-sm font-medium hover:bg-[hsl(var(--accent))] transition-colors"
            >
              <Users size={15} />
              <span>Create Circle</span>
            </button>
            <Link
              href="/messages/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-xl text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <SquarePen size={15} />
              <span>New Chat</span>
            </Link>
          </div>
        </div>
      )}

      {/* Chat List */}
      {hasAnyChats && (
        <div className="space-y-2.5">
          {/* 1. Groups (Poetry Circles) */}
          {(filter === 'all' || filter === 'groups') &&
            groups.map((group) => {
              const lastMsg = group.last_message
              return (
                <Link
                  key={group.id}
                  href={`/messages/group/${group.id}`}
                  className="flex items-center gap-3.5 p-3.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--accent))] hover:border-[hsl(var(--primary)/0.3)] transition-all relative group shadow-2xs"
                >
                  {/* Group Avatar */}
                  <div className="relative shrink-0">
                    {group.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={group.avatar_url}
                        alt={group.name}
                        className="w-11 h-11 rounded-2xl object-cover border border-[hsl(var(--border))] group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.6)] text-[hsl(var(--primary-foreground))] flex items-center justify-center shrink-0 shadow-xs border border-[hsl(var(--border))] group-hover:scale-105 transition-transform">
                        <Users size={20} />
                      </div>
                    )}
                  </div>

                  {/* Group Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-bold text-[hsl(var(--foreground))] truncate">
                          {group.name}
                        </p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] font-semibold shrink-0">
                          {group.members_count ?? 1} members
                        </span>
                      </div>

                      {lastMsg && (
                        <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0 ml-2">
                          {formatDate(lastMsg.created_at)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[hsl(var(--muted-foreground))] truncate mt-1">
                      {lastMsg ? (
                        <>
                          <span className="font-semibold text-[hsl(var(--foreground))]">
                            {lastMsg.sender_id === currentUserId
                              ? 'You'
                              : lastMsg.profiles?.display_name || 'Member'}
                            :{' '}
                          </span>
                          <span>{lastMsg.body}</span>
                        </>
                      ) : (
                        <span className="italic">
                          {group.description || 'Circle created. Tap to start chatting.'}
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              )
            })}

          {/* 2. Direct Conversations */}
          {(filter === 'all' || filter === 'direct' || filter === 'unread') &&
            conversations
              .filter((c) => {
                if (filter === 'unread') return (unreadCountMap[c.id] ?? 0) > 0
                return true
              })
              .map((conv) => {
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
                      'flex items-center gap-3.5 p-3.5 rounded-xl border transition-all relative group shadow-2xs',
                      hasUnread
                        ? 'border-[hsl(var(--primary)/0.45)] bg-[hsl(var(--primary)/0.04)] dark:bg-[hsl(var(--primary)/0.09)] hover:border-[hsl(var(--primary)/0.7)]'
                        : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--accent))] hover:border-[hsl(var(--border))]'
                    )}
                  >
                    {/* Avatar */}
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

                    {/* Author and message snippet */}
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
                          <p className="text-xs text-[hsl(var(--muted-foreground))] truncate hidden sm:inline font-mono">
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
              })}
        </div>
      )}

      {/* Create Group Modal */}
      {createGroupOpen && (
        <CreateGroupModal
          currentUserId={currentUserId}
          onClose={() => setCreateGroupOpen(false)}
        />
      )}
    </div>
  )
}
