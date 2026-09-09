import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/posts/PostCard'
import CompetitionEnterButton from '@/components/competitions/CompetitionEnterButton'
import type { PostWithAuthor, Competition } from '@/lib/supabase/types'
import { formatDate, POST_TYPE_LABELS } from '@/lib/utils'
import { Trophy, Calendar, Clock, Users } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).from('competitions').select('title, description').eq('id', id).single()
  if (!data) return { title: 'Competition not found' }
  return { title: data.title, description: data.description }
}

export default async function CompetitionDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { data: compData } = await sb.from('competitions').select('*').eq('id', id).single()
  const competition = compData as Competition | null
  if (!competition) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: entriesData } = await sb
    .from('competition_entries')
    .select('*, posts(*, profiles(*))')
    .eq('competition_id', id)
    .order('submitted_at', { ascending: false })

  const entries = (entriesData ?? []) as Array<{
    id: string
    post_id: string
    posts: PostWithAuthor | null
  }>

  const entryPostIds = entries.map((e) => e.post_id)

  const [likesData, userLikesData, commentsData] = await Promise.all([
    entryPostIds.length > 0
      ? sb
          .from('likes')
          .select('post_id, created_at, profiles(id, username, display_name, avatar_url)')
          .in('post_id', entryPostIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    user && entryPostIds.length > 0
      ? sb.from('likes').select('post_id').in('post_id', entryPostIds).eq('user_id', user.id)
      : Promise.resolve({ data: [] }),
    entryPostIds.length > 0
      ? sb.from('comments').select('post_id').in('post_id', entryPostIds)
      : Promise.resolve({ data: [] }),
  ])

  const likesMap: Record<string, number> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstLikerMap: Record<string, any> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(likesData.data ?? []).forEach((l: { post_id: string; profiles?: any }) => {
    likesMap[l.post_id] = (likesMap[l.post_id] ?? 0) + 1
    if (!firstLikerMap[l.post_id] && l.profiles) {
      firstLikerMap[l.post_id] = l.profiles
    }
  })
  const userLikedSet = new Set((userLikesData.data ?? []).map((l: { post_id: string }) => l.post_id))
  const commentsMap: Record<string, number> = {}
  ;(commentsData.data ?? []).forEach((c: { post_id: string }) => {
    commentsMap[c.post_id] = (commentsMap[c.post_id] ?? 0) + 1
  })

  const enrichedEntries = entries.map((entry) => ({
    ...entry,
    posts: entry.posts
      ? {
          ...entry.posts,
          likes_count: likesMap[entry.post_id] ?? 0,
          first_liker: firstLikerMap[entry.post_id] ?? null,
          comments_count: commentsMap[entry.post_id] ?? 0,
          user_has_liked: userLikedSet.has(entry.post_id),
        }
      : null,
  })).sort((a, b) =>
    competition.status === 'voting' || competition.status === 'closed'
      ? (b.posts?.likes_count ?? 0) - (a.posts?.likes_count ?? 0)
      : 0
  )

  // Check if user has already entered
  let userHasEntered = false
  if (user && entryPostIds.length > 0) {
    const { data: userPosts } = await sb.from('posts').select('id').eq('author_id', user.id)
    const userPostIds = (userPosts ?? []).map((p: { id: string }) => p.id)
    userHasEntered = entries.some((e) => userPostIds.includes(e.post_id))
  }

  const STATUS_CONFIG = {
    upcoming: { label: 'Upcoming', className: 'badge-upcoming' },
    open: { label: 'Open for submissions', className: 'badge-open' },
    voting: { label: 'Voting open', className: 'badge-voting' },
    closed: { label: 'Closed', className: 'badge-closed' },
  }
  const { label: statusLabel, className: statusClass } = STATUS_CONFIG[competition.status]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <Link href="/competitions" className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors mb-6 inline-block">
        ← Competitions
      </Link>

      <div className="border border-[hsl(var(--border))] rounded-xl p-6 bg-[hsl(var(--card))] mb-8">
        <div className="flex items-start justify-between gap-4 mb-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusClass}`}>{statusLabel}</span>
          {competition.type && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
              {POST_TYPE_LABELS[competition.type] ?? competition.type} only
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Lora, Georgia, serif' }}>
          <Trophy className="inline mr-2 text-[hsl(var(--primary))] mb-1" size={22} />
          {competition.title}
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed mb-4">{competition.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
            <Calendar size={14} className="shrink-0" />
            <span>Opens {formatDate(competition.starts_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
            <Clock size={14} className="shrink-0" />
            <span>Submit by {formatDate(competition.submissions_close_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
            <Users size={14} className="shrink-0" />
            <span>{enrichedEntries.length} entr{enrichedEntries.length !== 1 ? 'ies' : 'y'}</span>
          </div>
        </div>

        {competition.status === 'open' && user && !userHasEntered && (
          <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
            <CompetitionEnterButton competitionId={id} userId={user.id} />
          </div>
        )}
        {competition.status === 'open' && !user && (
          <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
            <Link href="/login" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              Sign in to enter
            </Link>
          </div>
        )}
        {userHasEntered && competition.status === 'open' && (
          <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">✓ You&apos;ve entered this competition</p>
          </div>
        )}
      </div>

      <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Lora, Georgia, serif' }}>
        {competition.status === 'closed' ? '🏆 Final Results'
          : competition.status === 'voting' ? '🗳️ Entries — Vote for your favourite'
          : 'Entries'}
      </h2>

      {enrichedEntries.length === 0 ? (
        <div className="text-center py-12 text-[hsl(var(--muted-foreground))] text-sm">
          No entries yet. Be the first to enter!
        </div>
      ) : (
        <div className="space-y-4">
          {enrichedEntries.map((entry, idx) =>
            entry.posts ? (
              <div key={entry.id} className="relative">
                {(competition.status === 'voting' || competition.status === 'closed') && idx < 3 && (
                  <div className="absolute -left-6 top-4 text-lg">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </div>
                )}
                <PostCard post={entry.posts as PostWithAuthor} />
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  )
}
