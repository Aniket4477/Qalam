import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GroupMessageThread from '@/components/messages/GroupMessageThread'
import type { Group, GroupMember, GroupMessage } from '@/lib/supabase/types'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ groupId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { groupId } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { data: group } = await sb
    .from('groups')
    .select('name, description')
    .eq('id', groupId)
    .single()

  return {
    title: group ? `${group.name} — Poetry Circle` : 'Group Chat — Qalam',
    description: group?.description ?? 'Group discussion on Qalam',
  }
}

export default async function GroupPage({ params }: Props) {
  const { groupId } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/messages')

  // Fetch group details
  const { data: groupData } = await sb
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  const group = groupData as Group | null
  if (!group) notFound()

  // Fetch group members with profiles
  const { data: membersData } = await sb
    .from('group_members')
    .select('*, profiles(*)')
    .eq('group_id', groupId)

  const members = (membersData ?? []) as GroupMember[]

  // Check if current user is member
  const isMember = members.some((m) => m.user_id === user.id)
  if (!isMember) notFound()

  // Fetch initial messages with sender profile
  const { data: messagesData } = await sb
    .from('group_messages')
    .select('*, profiles(*)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })

  const initialMessages = (messagesData ?? []) as GroupMessage[]

  return (
    <GroupMessageThread
      group={group}
      members={members}
      currentUserId={user.id}
      initialMessages={initialMessages}
    />
  )
}
