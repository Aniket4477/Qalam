'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
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
}

export default function MessagesClient({
  currentUserId,
  conversations,
  lastMsgMap,
}: MessagesClientProps) {
  if (conversations.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <MessageCircle size={40} className="mx-auto text-[hsl(var(--muted-foreground))] mb-4 opacity-30" />
        <h1 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Lora, Georgia, serif' }}>
          No messages yet
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Visit a poet&apos;s profile and click &quot;Message&quot; to start a conversation.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Lora, Georgia, serif' }}>
        Messages
      </h1>
      <div className="space-y-2">
        {conversations.map((conv) => {
          const otherUser =
            conv.user_one_id === currentUserId ? conv.user_two : conv.user_one
          const lastMsg = lastMsgMap[conv.id]

          return (
            <Link
              key={conv.id}
              href={`/messages/${conv.id}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-colors"
            >
              {otherUser?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={otherUser.avatar_url}
                  alt={otherUser.display_name}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center text-xs font-semibold text-[hsl(var(--primary))] shrink-0">
                  {otherUser?.display_name?.slice(0, 2).toUpperCase() ?? '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate">{otherUser?.display_name}</p>
                  {lastMsg && (
                    <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0 ml-2">
                      {formatDate(lastMsg.created_at)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] truncate mt-0.5">
                  {lastMsg
                    ? `${lastMsg.sender_id === currentUserId ? 'You: ' : ''}${lastMsg.body}`
                    : 'Start a conversation'}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
