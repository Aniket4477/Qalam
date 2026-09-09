import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/posts/PostCard'
import ProfileFollowStats from '@/components/profile/ProfileFollowStats'
import type { PostWithAuthor, Profile } from '@/lib/supabase/types'
import { formatDate, isUserAdmin } from '@/lib/utils'
import {
  Calendar,
  Award,
  Heart,
  BookOpen,
  MessageSquarePlus,
  Shield,
  ShieldCheck,
  Trophy,
  Users,
  Compass,
  Sparkles,
} from 'lucide-react'

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).from('profiles').select('display_name, bio').eq('username', username).single()
  if (!data) return { title: 'User not found' }
  return {
    title: `${data.display_name} (@${username})`,
    description: data.bio ?? `Read poetry by ${data.display_name} on Qalam`,
  }
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { data: profileData } = await sb.from('profiles').select('*').eq('username', username).single()
  const profile = profileData as Profile | null
  if (!profile) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwnProfile = user?.id === profile.id

  let postsQuery = sb
    .from('posts')
    .select('*, profiles(*)')
    .eq('author_id', profile.id)
    .order('created_at', { ascending: false })

  if (!isOwnProfile) {
    postsQuery = postsQuery.eq('status', 'published')
  }

  const { data: postsData } = await postsQuery
  const posts = (postsData ?? []) as PostWithAuthor[]

  const postIds = posts.map((p) => p.id)
  const publishedPostIds = posts.filter((p) => p.status === 'published').map((p) => p.id)

  const [
    likesResult,
    userLikesResult,
    commentsResult,
    competitionsEnteredResult,
    followersResult,
    followingResult,
    userFollowResult,
  ] = await Promise.all([
    postIds.length > 0
      ? sb
          .from('likes')
          .select('post_id, created_at, profiles(id, username, display_name, avatar_url)')
          .in('post_id', postIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    user && postIds.length > 0
      ? sb.from('likes').select('post_id').in('post_id', postIds).eq('user_id', user.id)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? sb.from('comments').select('post_id').in('post_id', postIds)
      : Promise.resolve({ data: [] }),
    sb.from('competition_entries')
      .select('*', { count: 'exact', head: true })
      .in('post_id', publishedPostIds.length > 0 ? publishedPostIds : ['__none__']),
    sb.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
    sb.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
    user && !isOwnProfile
      ? sb.from('follows').select('id').eq('follower_id', user.id).eq('following_id', profile.id).single()
      : Promise.resolve({ data: null }),
  ])

  const publishedSet = new Set(publishedPostIds)
  const totalLikes = (likesResult.data ?? []).filter((l: { post_id: string }) => publishedSet.has(l.post_id)).length
  const competitionsEntered = competitionsEnteredResult?.count ?? 0

  const followersCount = followersResult?.count ?? 0
  const followingCount = followingResult?.count ?? 0
  const isFollowing = !!userFollowResult?.data

  const likesMap: Record<string, number> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstLikerMap: Record<string, any> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(likesResult.data ?? []).forEach((l: { post_id: string; profiles?: any }) => {
    likesMap[l.post_id] = (likesMap[l.post_id] ?? 0) + 1
    if (!firstLikerMap[l.post_id] && l.profiles) {
      firstLikerMap[l.post_id] = l.profiles
    }
  })

  const userLikedSet = new Set(
    (userLikesResult.data ?? []).map((l: { post_id: string }) => l.post_id)
  )

  const commentsMap: Record<string, number> = {}
  ;(commentsResult.data ?? []).forEach((c: { post_id: string }) => {
    commentsMap[c.post_id] = (commentsMap[c.post_id] ?? 0) + 1
  })

  const enrichedPosts: PostWithAuthor[] = posts.map((post) => ({
    ...post,
    likes_count: likesMap[post.id] ?? 0,
    first_liker: firstLikerMap[post.id] ?? null,
    comments_count: commentsMap[post.id] ?? 0,
    user_has_liked: userLikedSet.has(post.id),
  }))

  const isAdmin = isUserAdmin(profile)

  // Auto-sync admin status in database if user is admin but is_admin column is not true yet
  if (isOwnProfile && isAdmin && !profile.is_admin) {
    await sb.from('profiles').update({ is_admin: true }).eq('id', profile.id)
  }

  // Fetch admin command center platform stats if viewing own admin profile
  let adminStats = { totalPoets: 0, totalPosts: 0, totalCompetitions: 0, totalCircles: 0 }
  if (isOwnProfile && isAdmin) {
    const [poetsRes, postsRes, compsRes, circlesRes] = await Promise.all([
      sb.from('profiles').select('*', { count: 'exact', head: true }),
      sb.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      sb.from('competitions').select('*', { count: 'exact', head: true }),
      sb.from('chat_groups').select('*', { count: 'exact', head: true }),
    ])
    adminStats = {
      totalPoets: poetsRes?.count ?? 0,
      totalPosts: postsRes?.count ?? 0,
      totalCompetitions: compsRes?.count ?? 0,
      totalCircles: circlesRes?.count ?? 0,
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="h-40 md:h-52 rounded-xl mb-0 overflow-hidden bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--primary)/0.2)]">
        {profile.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="relative px-2 pb-6 border-b border-[hsl(var(--border))]">
        <div className="-mt-12 mb-3 flex items-end justify-between">
          <div className="relative">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-24 h-24 rounded-full object-cover border-4 border-[hsl(var(--background))]"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[hsl(var(--primary)/0.2)] border-4 border-[hsl(var(--background))] flex items-center justify-center text-2xl font-bold text-[hsl(var(--primary))]">
                {profile.display_name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {isOwnProfile ? (
              <Link href="/settings" className="px-4 py-1.5 text-sm border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--accent))] transition-colors">
                Edit profile
              </Link>
            ) : user ? (
              <Link
                href={`/messages/new?with=${profile.id}`}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
              >
                <MessageSquarePlus size={15} /> Message
              </Link>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 mb-1">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Lora, Georgia, serif' }}>
            {profile.display_name}
          </h1>
          {isAdmin && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500/15 via-yellow-500/20 to-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-2xs"
              title="Official Qalam Platform Administrator"
            >
              <Shield size={12} className="fill-amber-500/20 text-amber-500" />
              <span>Administrator</span>
            </span>
          )}
        </div>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">@{profile.username}</p>

        {profile.bio && (
          <p className="text-sm leading-relaxed max-w-lg mb-3">{profile.bio}</p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-[hsl(var(--muted-foreground))]">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            <span>Joined {formatDate(profile.created_at)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen size={14} />
            <span>{publishedPostIds.length} poems</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart size={14} />
            <span>{totalLikes} likes received</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award size={14} />
            <span>{competitionsEntered ?? 0} competitions entered</span>
          </div>
        </div>

        <ProfileFollowStats
          targetUserId={profile.id}
          isOwnProfile={isOwnProfile}
          initialFollowersCount={followersCount}
          initialFollowingCount={followingCount}
          initialIsFollowing={isFollowing}
        />

        {/* Exclusive Administration Command Center — Visible ONLY to Administrator */}
        {isOwnProfile && isAdmin && (
          <div className="mt-6 p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-transparent to-[hsl(var(--card))] shadow-xs backdrop-blur-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-xs shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base text-[hsl(var(--foreground))]">
                      Administration Command Center
                    </h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      Private
                    </span>
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Exclusive controls & platform overview visible only to your administrator account
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/competitions/new"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold text-xs hover:brightness-110 active:scale-95 transition-all shadow-sm shadow-amber-500/20"
                >
                  <Trophy size={14} />
                  <span>Host Competition</span>
                </Link>
                <Link
                  href="/competitions"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] text-xs font-medium transition-colors"
                >
                  <Sparkles size={14} className="text-amber-500" />
                  <span>Manage</span>
                </Link>
              </div>
            </div>

            {/* Platform Analytics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="p-3 rounded-xl bg-[hsl(var(--card)/0.6)] border border-[hsl(var(--border)/0.8)] flex flex-col">
                <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                  <Users size={12} className="text-amber-500" /> Total Poets
                </span>
                <span className="text-lg font-bold text-[hsl(var(--foreground))] mt-1">
                  {adminStats.totalPoets}
                </span>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Registered members</span>
              </div>

              <div className="p-3 rounded-xl bg-[hsl(var(--card)/0.6)] border border-[hsl(var(--border)/0.8)] flex flex-col">
                <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                  <BookOpen size={12} className="text-amber-500" /> Total Works
                </span>
                <span className="text-lg font-bold text-[hsl(var(--foreground))] mt-1">
                  {adminStats.totalPosts}
                </span>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Published poems</span>
              </div>

              <div className="p-3 rounded-xl bg-[hsl(var(--card)/0.6)] border border-[hsl(var(--border)/0.8)] flex flex-col">
                <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                  <Trophy size={12} className="text-amber-500" /> Challenges
                </span>
                <span className="text-lg font-bold text-[hsl(var(--foreground))] mt-1">
                  {adminStats.totalCompetitions}
                </span>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Competitions created</span>
              </div>

              <div className="p-3 rounded-xl bg-[hsl(var(--card)/0.6)] border border-[hsl(var(--border)/0.8)] flex flex-col">
                <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                  <Compass size={12} className="text-amber-500" /> Circles
                </span>
                <span className="text-lg font-bold text-[hsl(var(--foreground))] mt-1">
                  {adminStats.totalCircles}
                </span>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Community circles</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Lora, Georgia, serif' }}>
          {isOwnProfile ? 'Your writings' : `${profile.display_name}'s writings`}
        </h2>

        {enrichedPosts.length === 0 ? (
          <div className="text-center py-16 text-[hsl(var(--muted-foreground))]">
            <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {isOwnProfile ? "You haven't published anything yet." : `${profile.display_name} hasn't published anything yet.`}
            </p>
            {isOwnProfile && (
              <Link href="/write" className="inline-block mt-3 text-[hsl(var(--primary))] text-sm font-medium hover:underline">
                Start writing →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {enrichedPosts.map((post) => (
              <PostCard key={post.id} post={post} showAuthor={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
