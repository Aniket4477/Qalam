import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MessageThread from '@/components/messages/MessageThread'
import type { Profile, Message } from '@/lib/supabase/types'

interface ConversationRow {
  id: string
  user_one_id: string
  user_two_id: string
  created_at: string
  user_one: Profile
  user_two: Profile
}

interface Props {
  params: Promise<{ conversationId: string }>
}

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/messages')

  const { data: convData } = await sb
    .from('conversations')
    .select('*, user_one:profiles!conversations_user_one_id_fkey(*), user_two:profiles!conversations_user_two_id_fkey(*)')
    .eq('id', conversationId)
    .single()

  const conversation = convData as ConversationRow | null
  if (!conversation) notFound()

  if (conversation.user_one_id !== user.id && conversation.user_two_id !== user.id) {
    notFound()
  }

  const { data: messages } = await sb
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  await sb
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .is('read_at', null)

  const otherUser =
    conversation.user_one_id === user.id ? conversation.user_two : conversation.user_one

  return (
    <MessageThread
      conversationId={conversationId}
      currentUserId={user.id}
      otherUser={otherUser}
      initialMessages={(messages ?? []) as Message[]}
    />
  )
}
