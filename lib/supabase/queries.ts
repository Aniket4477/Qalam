/**
 * Typed query helpers for Supabase.
 * 
 * Since we use hand-written types (not generated), we cast the client
 * at the table boundary to avoid TypeScript inference returning `never`.
 * 
 * Usage:
 *   const supabase = createClient()
 *   const { data } = await table<Profile>(supabase, 'profiles').select('*')...
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profile, Post, Like, Comment, Competition, CompetitionEntry, Conversation, Message, Notification } from './types'

type TableMap = {
  profiles: Profile
  posts: Post
  likes: Like
  comments: Comment
  competitions: Competition
  competition_entries: CompetitionEntry
  conversations: Conversation
  messages: Message
  notifications: Notification
}

/**
 * Returns a typed query builder for a specific table.
 * Casts through `unknown` to avoid the `never` inference issue.
 */
export function table<T extends keyof TableMap>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  tableName: T
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(tableName) as ReturnType<SupabaseClient['from']>
}
