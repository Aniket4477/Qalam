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
} from '@/lib/utils'
import { Send, ArrowLeft, Loader2 } from 'lucide-react'

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
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

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
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.9)] backdrop-blur-md">
        <Link href="/messages" className="p-1.5 rounded-md text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <Link href={`/u/${otherUser.username}`} className="flex items-center gap-2">
          {otherUser.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={otherUser.avatar_url} alt={otherUser.display_name} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center text-xs font-semibold text-[hsl(var(--primary))]">
              {otherUser.display_name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-sm leading-none">{otherUser.display_name}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">@{otherUser.username}</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
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
                  <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] tracking-wide">
                    {formatChatDividerTime(msg.created_at)}
                  </span>
                </div>
              )}
              <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div
                  className={`max-w-xs md:max-w-sm lg:max-w-md px-3.5 py-2 rounded-2xl text-sm shadow-xs ${
                    isOwn
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-br-xs'
                      : 'bg-[hsl(var(--muted)/0.7)] text-[hsl(var(--foreground))] border border-[hsl(var(--border)/0.5)] rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.body}</p>
                  <p
                    className={`text-[10px] mt-1 text-right select-none ${
                      isOwn
                        ? 'text-[hsl(var(--primary-foreground)/0.75)]'
                        : 'text-[hsl(var(--muted-foreground))]'
                    }`}
                  >
                    {formatBubbleTime(msg.created_at)}
                  </p>
                </div>
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
          className="p-2.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
          aria-label="Send message"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  )
}
