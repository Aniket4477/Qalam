import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/posts/PostCard'
import CompetitionEnterButton from '@/components/competitions/CompetitionEnterButton'
import AdminCompetitionControls from '@/components/competitions/AdminCompetitionControls'
import type { PostWithAuthor, Competition } from '@/lib/supabase/types'
import { formatDate, formatDeadline, POST_TYPE_LABELS, isUserAdmin } from '@/lib/utils'
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

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: compData }, { data: userProfile }] = await Promise.all([
    sb.from('competitions').select('*').eq('id', id).single(),
    user
      ? sb.from('profiles').select('id, username, display_name, is_admin').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
  ])
  const competition = compData as Competition | null
  if (!competition) notFound()

  const isAdmin = isUserAdmin(userProfile)

  // Auto-sync is_admin in DB if needed
  if (user && isAdmin && !userProfile?.is_admin) {
    await sb.from('profiles').update({ is_admin: true }).eq('id', user.id)
  }

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
  const entryIds = entries.map((e) => e.id)

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

  // Fetch votes for all entries in this competition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let votesData: any[] = []
  if (entryIds.length > 0) {
    try {
      const { data: vData, error: vError } = await sb
        .from('competition_votes')
        .select('id, entry_id, user_id, created_at, profiles(id, username, display_name, avatar_url)')
        .in('entry_id', entryIds)
      if (!vError && vData) {
        votesData = vData
      }
    } catch (err) {
      console.warn('Could not fetch competition votes:', err)
    }
  }

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

  // Group votes by entry_id
  const votesMap: Record<string, number> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const votersMap: Record<string, any[]> = {}
  const userVotedSet = new Set<string>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  votesData.forEach((v: any) => {
    votesMap[v.entry_id] = (votesMap[v.entry_id] ?? 0) + 1
    if (!votersMap[v.entry_id]) votersMap[v.entry_id] = []
    if (v.profiles) votersMap[v.entry_id].push(v.profiles)
    if (user && v.user_id === user.id) {
      userVotedSet.add(v.entry_id)
    }
  })

  const enrichedEntries = entries.map((entry) => ({
    ...entry,
    votes_count: votesMap[entry.id] ?? 0,
    user_has_voted: userVotedSet.has(entry.id),
    voters: votersMap[entry.id] ?? [],
    posts: entry.posts
      ? {
          ...entry.posts,
          likes_count: likesMap[entry.post_id] ?? 0,
          first_liker: firstLikerMap[entry.post_id] ?? null,
          comments_count: commentsMap[entry.post_id] ?? 0,
          user_has_liked: userLikedSet.has(entry.post_id),
        }
      : null,
  })).sort((a, b) => {
    if (competition.status === 'voting' || competition.status === 'closed') {
      return (b.votes_count ?? 0) - (a.votes_count ?? 0)
    }
    if ((b.votes_count ?? 0) !== (a.votes_count ?? 0)) {
      return (b.votes_count ?? 0) - (a.votes_count ?? 0)
    }
    return 0
  })

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

      {isAdmin && <AdminCompetitionControls competition={competition} />}

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
            <span>
              {new Date(competition.starts_at).getTime() > Date.now()
                ? `Opens ${formatDate(competition.starts_at)}`
                : `Started ${formatDate(competition.starts_at)}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
            <Clock size={14} className="shrink-0" />
            <span>
              {competition.status === 'open'
                ? `Submissions ${formatDeadline(competition.submissions_close_at)}`
                : competition.status === 'voting'
                ? `Voting ${formatDeadline(competition.voting_closes_at)}`
                : competition.status === 'upcoming'
                ? `Opens ${formatDate(competition.starts_at)}`
                : `Ended ${formatDate(competition.voting_closes_at)}`}
            </span>
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
        {competition.status === 'closed'
          ? '🏆 Final Results'
          : competition.status === 'voting'
          ? '🗳️ Entries — Vote for your favourite'
          : 'Entries & Voting'}
      </h2>

      {enrichedEntries.length === 0 ? (
        <div className="text-center py-12 text-[hsl(var(--muted-foreground))] text-sm">
          No entries yet. Be the first to enter!
        </div>
      ) : (
        <div className="space-y-6">
          {enrichedEntries.map((entry, idx) =>
            entry.posts ? (
              <div key={entry.id} className="relative">
                {/* Ranking medal and votes banner for top entries */}
                {idx < 3 && (competition.status === 'voting' || competition.status === 'closed' || entry.votes_count > 0) && (
                  <div className="flex items-center justify-between mb-2 px-1 text-xs">
                    <span className="font-semibold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <span className="text-base leading-none">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                      <span>{idx === 0 ? '1st Place' : idx === 1 ? '2nd Place' : '3rd Place'}</span>
                    </span>
                    <span className="font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {entry.votes_count} {entry.votes_count === 1 ? 'vote' : 'votes'}
                    </span>
                  </div>
                )}
                <PostCard
                  post={entry.posts as PostWithAuthor}
                  currentUserId={user?.id}
                  competitionVote={{
                    competitionId: id,
                    entryId: entry.id,
                    status: competition.status,
                    votesCount: entry.votes_count,
                    userHasVoted: entry.user_has_voted,
                    voters: entry.voters,
                  }}
                />
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  )
}
