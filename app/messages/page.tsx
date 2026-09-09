import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MessagesClient from '@/components/messages/MessagesClient'
import type { Metadata } from 'next'
import type { Profile } from '@/lib/supabase/types'

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Your direct messages on Qalam',
}

interface ConversationRow {
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
  conversation_id: string
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/messages')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { data: conversations } = await sb
    .from('conversations')
    .select('*, user_one:profiles!conversations_user_one_id_fkey(*), user_two:profiles!conversations_user_two_id_fkey(*)')
    .or(`user_one_id.eq.${user.id},user_two_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const convIds = ((conversations ?? []) as ConversationRow[]).map((c) => c.id)
  const { data: messagesData } = convIds.length > 0
    ? await sb
        .from('messages')
        .select('id, conversation_id, body, created_at, sender_id, read_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const lastMsgMap: Record<string, LastMsg> = {}
  const unreadCountMap: Record<string, number> = {}

  interface MessageItem extends LastMsg {
    read_at: string | null
  }

  ;((messagesData ?? []) as MessageItem[]).forEach((msg) => {
    if (!lastMsgMap[msg.conversation_id]) {
      lastMsgMap[msg.conversation_id] = msg
    }
    if (msg.sender_id !== user.id && !msg.read_at) {
      unreadCountMap[msg.conversation_id] = (unreadCountMap[msg.conversation_id] ?? 0) + 1
    }
  })

  return (
    <MessagesClient
      currentUserId={user.id}
      conversations={(conversations ?? []) as ConversationRow[]}
      lastMsgMap={lastMsgMap}
      unreadCountMap={unreadCountMap}
    />
  )
}
