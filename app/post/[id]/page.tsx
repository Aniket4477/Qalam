import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatDate, POST_TYPE_LABELS, isRTL, getPreviewLines } from '@/lib/utils'
import LikeButton from '@/components/posts/LikeButton'
import CommentList from '@/components/posts/CommentList'
import ShareButton from '@/components/posts/ShareButton'
import PostActions from '@/components/posts/PostActions'
import type { Post, Profile, Comment } from '@/lib/supabase/types'

type PostWithProfile = Post & { profiles: Profile }

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('posts')
    .select('title, body, profiles(display_name)')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  const post = data as unknown as { title: string | null; body: string; profiles: { display_name: string } | null }

  if (!post) return { title: 'Post not found' }

  const author = post.profiles?.display_name ?? 'Unknown'
  const preview = getPreviewLines(post.body)
  const title = post.title ? `"${post.title}" by ${author}` : `A poem by ${author}`

  return {
    title,
    description: preview,
    openGraph: { title, description: preview, type: 'article' },
    twitter: { card: 'summary', title, description: preview },
  }
}

export default async function PostPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('posts')
    .select('*, profiles(*)')
    .eq('id', id)
    .single()

  const post = data as unknown as PostWithProfile | null

  if (!post || (post.status === 'draft' && post.author_id !== user?.id)) {
    notFound()
  }

  const [likesResult, userLikeResult, commentsResult] = await Promise.all([
    supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', id),
    user
      ? supabase.from('likes').select('id').eq('post_id', id).eq('user_id', user.id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from('comments')
      .select('*, profiles(*)')
      .eq('post_id', id)
      .order('created_at', { ascending: true }),
  ])

  const likesCount = likesResult.count ?? 0
  const userHasLiked = !!userLikeResult.data
  const comments = (commentsResult.data as unknown as (Comment & { profiles: Profile })[]) ?? []

  const profile = post.profiles
  const rtl = isRTL(post.language)

  const postUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/post/${id}`
  const preview = getPreviewLines(post.body)

  return (
    <article className="max-w-2xl mx-auto px-4 py-10 animate-fade-in">
      <Link
        href="/"
        className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors mb-8 inline-block"
      >
        ← Back to feed
      </Link>

      {post.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_url}
          alt={post.title ?? 'Cover image'}
          className="w-full h-56 object-cover rounded-lg mb-8"
        />
      )}

      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
          {POST_TYPE_LABELS[post.type] ?? post.type}
        </span>
        {post.language !== 'English' && (
          <span className="text-xs px-2 py-0.5 rounded-full border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
            {post.language}
          </span>
        )}
        {post.status === 'draft' && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
            Draft
          </span>
        )}
      </div>

      {post.title && (
        <h1
          className="text-3xl md:text-4xl font-bold mb-6 leading-snug"
          style={{ fontFamily: 'Lora, Georgia, serif' }}
          dir={rtl ? 'rtl' : 'ltr'}
        >
          {post.title}
        </h1>
      )}

      {profile && (
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-[hsl(var(--border))]">
          <Link href={`/u/${profile.username}`}>
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center text-sm font-semibold text-[hsl(var(--primary))]">
                {profile.display_name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </Link>
          <div>
            <Link
              href={`/u/${profile.username}`}
              className="font-medium text-sm hover:text-[hsl(var(--primary))] transition-colors"
            >
              {profile.display_name}
            </Link>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {formatDate(post.created_at)}
              {post.updated_at !== post.created_at && ' · edited'}
            </p>
          </div>

          {user?.id === post.author_id && (
            <div className="ml-auto">
              <PostActions postId={post.id} />
            </div>
          )}
        </div>
      )}

      <div
        className="prose-poem prose-poem-lg mb-10"
        dir={rtl ? 'rtl' : 'ltr'}
        lang={post.language.toLowerCase()}
      >
        {post.body}
      </div>

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-8">
          {post.tags.map((tag: string) => (
            <Link
              key={tag}
              href={`/explore?tag=${encodeURIComponent(tag)}`}
              className="text-xs px-2 py-0.5 rounded-full border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:border-[hsl(var(--primary)/0.3)] transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 py-4 border-t border-b border-[hsl(var(--border))] mb-8">
        <LikeButton
          postId={post.id}
          initialCount={likesCount}
          initialLiked={userHasLiked}
        />
        <ShareButton
          title={post.title ?? ''}
          author={profile?.display_name ?? 'Unknown'}
          preview={preview}
          url={postUrl}
        />
      </div>

      <CommentList postId={post.id} initialComments={comments} />
    </article>
  )
}
