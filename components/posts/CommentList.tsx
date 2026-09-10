'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Comment, Profile } from '@/lib/supabase/types'
import { formatDate } from '@/lib/utils'
import { Send, Trash2, MessageCircle } from 'lucide-react'
import Link from 'next/link'

interface CommentListProps {
  postId: string
  initialComments?: (Comment & { profiles: Profile })[]
  onCommentAdded?: () => void
  onCommentDeleted?: () => void
}

export default function CommentList({
  postId,
  initialComments = [],
  onCommentAdded,
  onCommentDeleted,
}: CommentListProps) {
  const [comments, setComments] = useState<(Comment & { profiles: Profile })[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: any) => {
      if (data?.user) setCurrentUser({ id: data.user.id })
    })

    // Fetch comments if none passed initially
    if (initialComments.length === 0) {
      sb.from('comments')
        .select('*, profiles(*)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .then(({ data }: { data: (Comment & { profiles: Profile })[] | null }) => {
          if (data) setComments(data)
        })
    }

    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        async (payload: { new: Comment }) => {
          const newRow = payload.new
          const { data: profile } = await sb.from('profiles').select('*').eq('id', newRow.author_id).single()
          if (profile) {
            setComments((prev) => {
              if (prev.find((c) => c.id === newRow.id)) return prev
              return [...prev, { ...newRow, profiles: profile as Profile }]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId, supabase, sb, initialComments.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = newComment.trim()
    if (!body) return
    if (!currentUser) {
      window.location.href = '/login?redirectTo=' + encodeURIComponent(window.location.pathname)
      return
    }

    setSubmitting(true)
    setError(null)
    setNewComment('')

    const { data, error: insertError } = await sb
      .from('comments')
      .insert({ post_id: postId, author_id: currentUser.id, body })
      .select('*, profiles(*)')
      .single()

    if (insertError) {
      setError('Failed to post comment. Please try again.')
      setNewComment(body)
    } else if (data) {
      setComments((prev) => {
        if (prev.find((c) => c.id === data.id)) return prev
        return [...prev, data as Comment & { profiles: Profile }]
      })
      onCommentAdded?.()
    }
    setSubmitting(false)
  }

  const handleDelete = async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    await sb.from('comments').delete().eq('id', commentId)
    onCommentDeleted?.()
  }

  return (
    <section className="mt-8">
      <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
        <MessageCircle size={18} />
        {comments.length === 0 ? 'No comments yet' : `${comments.length} Comment${comments.length !== 1 ? 's' : ''}`}
      </h3>

      <div className="space-y-4 mb-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 animate-fade-in">
            <Link href={`/u/${comment.profiles.username}`} className="shrink-0">
              {comment.profiles.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={comment.profiles.avatar_url}
                  alt={comment.profiles.display_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center text-xs font-semibold text-[hsl(var(--primary))]">
                  {comment.profiles.display_name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </Link>
            <div className="flex-1 bg-[hsl(var(--muted)/0.5)] rounded-lg px-3 py-2">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/u/${comment.profiles.username}`}
                    className="text-sm font-medium hover:text-[hsl(var(--primary))] transition-colors"
                  >
                    {comment.profiles.display_name}
                  </Link>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                {currentUser?.id === comment.author_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors p-1 rounded"
                    aria-label="Delete comment"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-6">
            Be the first to leave a comment ✦
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={currentUser ? 'Leave a comment…' : 'Sign in to comment'}
            disabled={!currentUser || submitting}
            rows={2}
            className="w-full px-3 py-2 text-sm bg-[hsl(var(--input)/0.5)] border border-[hsl(var(--border))] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] placeholder:text-[hsl(var(--muted-foreground))] disabled:opacity-50 transition-colors"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit(e as unknown as React.FormEvent)
              }
            }}
          />
          {error && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={!currentUser || submitting || !newComment.trim()}
          className="self-start px-3 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Post comment"
        >
          <Send size={16} />
        </button>
      </form>
    </section>
  )
}
