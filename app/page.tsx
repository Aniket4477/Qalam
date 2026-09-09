import { createClient } from '@/lib/supabase/server'
import PostCard, { PostCardSkeleton } from '@/components/posts/PostCard'
import HomeFeedTabs from '@/components/feed/HomeFeedTabs'
import type { PostWithAuthor } from '@/lib/supabase/types'
import Link from 'next/link'
import { PenLine, Feather } from 'lucide-react'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Qalam — Poetry & Shayari',
  description: 'A literary space to share poetry, shayari, ghazals, and short-form creative writing.',
}

interface FeedProps {
  searchParams: Promise<{ tab?: string }>
}

async function FeedContent({ tab }: { tab: string }) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  let query = sb.from('posts').select('*, profiles(*)').eq('status', 'published')

  if (tab === 'trending') {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    query = query.gte('created_at', sevenDaysAgo.toISOString())
  }

  query = query.order('created_at', { ascending: false }).limit(20)

  const { data: posts, error } = await query

  if (error) {
    return (
      <div className="text-center py-16 text-[hsl(var(--muted-foreground))]">
        <p>Failed to load posts. Please try refreshing.</p>
      </div>
    )
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-20">
        <Feather size={40} className="mx-auto text-[hsl(var(--muted-foreground))] mb-4 opacity-40" />
        <h3 className="text-lg font-medium mb-2" style={{ fontFamily: 'Lora, Georgia, serif' }}>
          {tab === 'trending' ? 'Nothing trending yet' : 'No poems yet'}
        </h3>
        <p className="text-[hsl(var(--muted-foreground))] text-sm mb-6">
          {tab === 'trending'
            ? 'Come back in a few days once writers get active!'
            : 'Be the first to share your words.'}
        </p>
        <Link
          href="/write"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <PenLine size={15} /> Write something
        </Link>
      </div>
    )
  }

  const { data: { user } } = await supabase.auth.getUser()

  const postIds = (posts as PostWithAuthor[]).map((p) => p.id)

  const [likesData, userLikesData, commentsData] = await Promise.all([
    sb
      .from('likes')
      .select('post_id, created_at, profiles(id, username, display_name, avatar_url)')
      .in('post_id', postIds)
      .order('created_at', { ascending: false }),
    user
      ? sb.from('likes').select('post_id').in('post_id', postIds).eq('user_id', user.id)
      : Promise.resolve({ data: [] }),
    sb.from('comments').select('post_id').in('post_id', postIds),
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

  let enrichedPosts = (posts as PostWithAuthor[]).map((p) => ({
    ...p,
    likes_count: likesMap[p.id] ?? 0,
    first_liker: firstLikerMap[p.id] ?? null,
    comments_count: commentsMap[p.id] ?? 0,
    user_has_liked: userLikedSet.has(p.id),
  }))

  if (tab === 'trending') {
    enrichedPosts = enrichedPosts.sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0))
  }

  return (
    <div className="space-y-4">
      {enrichedPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}

export default async function HomePage({ searchParams }: FeedProps) {
  const { tab = 'latest' } = await searchParams

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Lora, Georgia, serif' }}>
              Poetry Feed
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Words that move, lines that linger.
            </p>
          </div>

          <HomeFeedTabs activeTab={tab} />

          <Suspense
            fallback={
              <div className="space-y-4 mt-6">
                {[1, 2, 3].map((i) => <PostCardSkeleton key={i} />)}
              </div>
            }
          >
            <div className="mt-6">
              <FeedContent tab={tab} />
            </div>
          </Suspense>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <div className="border border-[hsl(var(--border))] rounded-lg p-5 bg-[hsl(var(--card))]">
              <h2 className="text-base font-semibold mb-2" style={{ fontFamily: 'Lora, Georgia, serif' }}>
                Share your words
              </h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
                Write a poem, shayari, or ghazal and share it with the Qalam community.
              </p>
              <Link
                href="/write"
                className="flex items-center justify-center gap-1.5 w-full py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <PenLine size={15} /> Start writing
              </Link>
            </div>

            <div className="border border-[hsl(var(--border))] rounded-lg p-4 bg-[hsl(var(--card))]">
              <h2 className="text-sm font-semibold mb-2">Explore more</h2>
              <div className="space-y-1">
                {['Shayari', 'Ghazal', 'Haiku', 'Urdu', 'Hindi'].map((item) => (
                  <Link
                    key={item}
                    href={`/explore?q=${item}`}
                    className="block text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors py-0.5"
                  >
                    #{item}
                  </Link>
                ))}
                <Link href="/explore" className="block text-xs text-[hsl(var(--primary))] font-medium mt-2">
                  Browse all →
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
