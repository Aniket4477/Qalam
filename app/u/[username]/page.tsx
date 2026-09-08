import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/posts/PostCard'
import ProfileFollowStats from '@/components/profile/ProfileFollowStats'
import type { PostWithAuthor, Profile } from '@/lib/supabase/types'
import { formatDate } from '@/lib/utils'
import { Calendar, Award, Heart, BookOpen, MessageSquarePlus } from 'lucide-react'

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
      ? sb.from('likes').select('post_id').in('post_id', postIds)
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
  ;(likesResult.data ?? []).forEach((l: { post_id: string }) => {
    likesMap[l.post_id] = (likesMap[l.post_id] ?? 0) + 1
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
    comments_count: commentsMap[post.id] ?? 0,
    user_has_liked: userLikedSet.has(post.id),
  }))

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

        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Lora, Georgia, serif' }}>
          {profile.display_name}
        </h1>
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
