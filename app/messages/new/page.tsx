import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewMessageSearch from '@/components/messages/NewMessageSearch'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Message — Qalam',
  description: 'Search a poet by username to start a conversation',
}

interface Props {
  searchParams: Promise<{ with?: string }>
}

/**
 * GET /messages/new?with=<userId>
 * If with is provided, creates or finds an existing conversation, then redirects to it.
 * If with is not provided, renders the poet search interface.
 */
export default async function NewMessagePage({ searchParams }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirectTo=/messages/new')

  const { with: targetUserId } = await searchParams

  if (!targetUserId) {
    return <NewMessageSearch currentUserId={user.id} />
  }

  if (targetUserId === user.id) redirect('/messages')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { data: existing } = await sb
    .from('conversations')
    .select('id')
    .or(
      `and(user_one_id.eq.${user.id},user_two_id.eq.${targetUserId}),and(user_one_id.eq.${targetUserId},user_two_id.eq.${user.id})`
    )
    .single()

  if (existing) {
    redirect(`/messages/${existing.id}`)
  }

  // Create new conversation
  const { data: created, error } = await sb
    .from('conversations')
    .insert({
      user_one_id: user.id,
      user_two_id: targetUserId,
    })
    .select('id')
    .single()

  if (error || !created) redirect('/messages')

  redirect(`/messages/${created.id}`)
}
