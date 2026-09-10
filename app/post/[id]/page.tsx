import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { cache } from 'react'
import { createClient, getCurrentUser } from '@/lib/supabase/server'
import { formatDate, POST_TYPE_LABELS, isRTL, getPreviewLines, cn } from '@/lib/utils'
import CommentList from '@/components/posts/CommentList'
import PostActions from '@/components/posts/PostActions'
import PostDetailEngagement from '@/components/posts/PostDetailEngagement'
import BackButton from '@/components/ui/BackButton'
import type { Post, Profile, Comment } from '@/lib/supabase/types'
import {
  getPostTheme,
  getThemeFromTags,
  cleanDisplayTags,
} from '@/lib/postThemes'

type PostWithProfile = Post & { profiles: Profile }

interface Props {
  params: Promise<{ id: string }>
}

const getPost = cache(async (id: string): Promise<PostWithProfile | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('posts')
    .select('*, profiles(*)')
    .eq('id', id)
    .single()
  return data as unknown as PostWithProfile | null
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const post = await getPost(id)

  if (!post || post.status !== 'published') return { title: 'Post not found' }

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
  const [user, post] = await Promise.all([
    getCurrentUser(),
    getPost(id),
  ])

  if (!post || (post.status === 'draft' && post.author_id !== user?.id)) {
    notFound()
  }

  const supabase = await createClient()

  const [likesResult, userLikeResult, commentsResult, firstLikerResult] = await Promise.all([
    supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', id),
    user
      ? supabase.from('likes').select('id').eq('post_id', id).eq('user_id', user.id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from('comments')
      .select('*, profiles(*)')
      .eq('post_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('likes')
      .select('user_id, profiles(*)')
      .eq('post_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const likesCount = likesResult.count ?? 0
  const userHasLiked = !!userLikeResult.data
  const comments = (commentsResult.data as unknown as (Comment & { profiles: Profile })[]) ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstLiker = (firstLikerResult?.data as any)?.profiles as Profile | null

  const profile = post.profiles
  const rtl = isRTL(post.language)

  const postTheme = getPostTheme(post.theme || getThemeFromTags(post.tags) || 'classic')
  const displayTags = cleanDisplayTags(post.tags)

  const postUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/post/${id}`
  const preview = getPreviewLines(post.body)

  return (
    <article className="max-w-2xl mx-auto px-4 py-10 animate-fade-in">
      <BackButton label="Back" />

      {post.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_url}
          alt={post.title ?? 'Cover image'}
          className="w-full h-56 object-cover rounded-lg mb-8"
        />
      )}

      {/* Themed Reading Card Container */}
      <div className={cn('rounded-2xl p-6 sm:p-8 my-6 border transition-all shadow-xs', postTheme.cardClass)}>
        <div className="flex items-center gap-2 mb-4">
          <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-medium', postTheme.badgeClass)}>
            {POST_TYPE_LABELS[post.type] ?? post.type}
          </span>
          {post.language !== 'English' && (
            <span className={cn('text-xs px-2.5 py-0.5 rounded-full border', postTheme.tagClass)}>
              {post.language}
            </span>
          )}
          {post.status === 'draft' && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
              Draft
            </span>
          )}
          {postTheme.id !== 'classic' && (
            <span className={cn('text-xs ml-auto flex items-center gap-1.5 font-medium', postTheme.mutedTextClass)}>
              <span>{postTheme.emoji}</span>
              <span>{postTheme.name} Theme</span>
            </span>
          )}
        </div>

        {post.title && (
          <h1
            className={cn('text-3xl md:text-4xl font-bold mb-6 leading-snug', postTheme.titleClass)}
            style={{ fontFamily: 'Lora, Georgia, serif' }}
            dir={rtl ? 'rtl' : 'ltr'}
          >
            {post.title}
          </h1>
        )}

        {profile && (
          <div className={cn('flex items-center gap-3 mb-8 pb-6 border-b', postTheme.footerBorderClass)}>
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
                className={cn('font-medium text-sm transition-colors hover:underline', postTheme.authorClass)}
              >
                {profile.display_name}
              </Link>
              <p className={cn('text-xs font-medium', postTheme.mutedTextClass)}>
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
          className={cn('prose-poem prose-poem-lg mb-8', postTheme.bodyClass)}
          dir={rtl ? 'rtl' : 'ltr'}
          lang={post.language.toLowerCase()}
        >
          {post.body}
        </div>

        {displayTags.length > 0 && (
          <div className={cn('flex flex-wrap gap-1.5 pt-4 border-t', postTheme.footerBorderClass)}>
            {displayTags.map((tag: string) => (
              <Link
                key={tag}
                href={`/explore?tag=${encodeURIComponent(tag)}`}
                className={cn('text-xs px-2.5 py-0.5 rounded-full border transition-colors', postTheme.tagClass)}
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      <PostDetailEngagement
        postId={post.id}
        initialLikesCount={likesCount}
        initialUserLiked={userHasLiked}
        initialFirstLiker={firstLiker}
        title={post.title ?? undefined}
        authorName={profile?.display_name ?? 'Unknown'}
        authorUsername={profile?.username ?? undefined}
        authorAvatar={profile?.avatar_url ?? undefined}
        preview={preview}
        postUrl={postUrl}
        currentUserId={user?.id}
      />

      <CommentList postId={post.id} initialComments={comments} />
    </article>
  )
}
