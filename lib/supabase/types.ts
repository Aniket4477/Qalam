// Qalam — Supabase database types
// Hand-written types matching the SQL schema in supabase/migrations/

export type PostType = 
  | 'poem'
  | 'shayari'
  | 'ghazal'
  | 'haiku'
  | 'free_verse'
  | 'other'

export type PostStatus = 'draft' | 'published'

export type CompetitionStatus = 
  | 'upcoming'
  | 'open'
  | 'voting'
  | 'closed'

export type NotificationType =
  | 'like'
  | 'comment'
  | 'message'
  | 'competition_ended'

export interface Profile {
  id: string
  username: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  cover_url: string | null
  is_admin: boolean
  created_at: string
}

export interface Post {
  id: string
  author_id: string
  title: string | null
  body: string
  type: PostType
  language: string
  tags: string[]
  theme?: string | null
  cover_url: string | null
  status: PostStatus
  created_at: string
  updated_at: string
}

export interface PostWithAuthor extends Post {
  profiles: Profile
  likes_count?: number
  comments_count?: number
  user_has_liked?: boolean
  first_liker?: Profile | null
}

export interface Like {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  body: string
  created_at: string
  profiles?: Profile
}

export interface Competition {
  id: string
  title: string
  description: string
  type: PostType | null
  starts_at: string
  submissions_close_at: string
  voting_closes_at: string
  status: CompetitionStatus
  created_by: string
  created_at: string
}

export interface CompetitionEntry {
  id: string
  competition_id: string
  post_id: string
  submitted_at: string
  posts?: PostWithAuthor
}

export interface Conversation {
  id: string
  user_one_id: string
  user_two_id: string
  created_at: string
  other_user?: Profile
  last_message?: Message
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  read_at: string | null
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  payload: Record<string, unknown>
  read_at: string | null
  created_at: string
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface Group {
  id: string
  name: string
  description: string | null
  avatar_url: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  profiles?: Profile
}

export interface GroupMessage {
  id: string
  group_id: string
  sender_id: string
  body: string
  created_at: string
  profiles?: Profile
}

export interface GroupWithMeta extends Group {
  members_count?: number
  members?: GroupMember[]
  last_message?: GroupMessage
  creator?: Profile
}

// Database helper type for Supabase query builder
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      posts: {
        Row: Post
        Insert: Omit<Post, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Post, 'id' | 'author_id' | 'created_at'>>
      }
      likes: {
        Row: Like
        Insert: Omit<Like, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: never
      }
      comments: {
        Row: Comment
        Insert: Omit<Comment, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Pick<Comment, 'body'>>
      }
      competitions: {
        Row: Competition
        Insert: Omit<Competition, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Competition, 'id' | 'created_by'>>
      }
      competition_entries: {
        Row: CompetitionEntry
        Insert: Omit<CompetitionEntry, 'id' | 'submitted_at'> & { id?: string; submitted_at?: string }
        Update: never
      }
      conversations: {
        Row: Conversation
        Insert: Omit<Conversation, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: never
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at' | 'read_at'> & { id?: string; created_at?: string; read_at?: string | null }
        Update: Partial<Pick<Message, 'read_at'>>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at' | 'read_at'> & { id?: string; created_at?: string; read_at?: string | null }
        Update: Partial<Pick<Notification, 'read_at'>>
      }
      follows: {
        Row: Follow
        Insert: Omit<Follow, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: never
      }
    }
  }
}
