'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Post } from '@/lib/supabase/types'
import { PenLine, BookOpen, Loader2, X } from 'lucide-react'

interface CompetitionEnterButtonProps {
  competitionId: string
  userId: string
}

export default function CompetitionEnterButton({ competitionId, userId }: CompetitionEnterButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const [showModal, setShowModal] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPosts = async () => {
    setLoading(true)
    const { data } = await sb.from('posts').select('*').eq('author_id', userId).eq('status', 'published').order('created_at', { ascending: false })
    setPosts((data ?? []) as Post[])
    setLoading(false)
  }

  const handleEnter = async () => {
    if (!selectedPostId) return
    setSubmitting(true)
    setError(null)

    const { error: insertError } = await sb.from('competition_entries').insert({
      competition_id: competitionId,
      post_id: selectedPostId,
    })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
    } else {
      setShowModal(false)
      router.refresh()
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => { setShowModal(true); loadPosts() }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <BookOpen size={15} /> Enter with existing post
        </button>
        <button
          onClick={() => router.push(`/write?competition=${competitionId}`)}
          className="flex items-center gap-1.5 px-4 py-2 border border-[hsl(var(--border))] rounded-lg text-sm font-medium hover:bg-[hsl(var(--accent))] transition-colors"
        >
          <PenLine size={15} /> Write new entry
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[hsl(var(--popover))] border border-[hsl(var(--border))] rounded-xl shadow-xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
              <h3 className="font-semibold">Select a post to enter</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-[hsl(var(--accent))] transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-[hsl(var(--muted-foreground))]" />
                </div>
              ) : posts.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-6">
                  No published posts found. Write a new entry instead.
                </p>
              ) : (
                <div className="space-y-2">
                  {posts.map((post) => (
                    <label
                      key={post.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPostId === post.id
                          ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)]'
                          : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="post"
                        value={post.id}
                        checked={selectedPostId === post.id}
                        onChange={() => setSelectedPostId(post.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" style={{ fontFamily: 'Lora, Georgia, serif' }}>
                          {post.title ?? '(Untitled)'}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 line-clamp-2">
                          {post.body.slice(0, 80)}…
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-[hsl(var(--destructive))] px-4 pb-2">{error}</p>}

            <div className="flex justify-end gap-2 p-4 border-t border-[hsl(var(--border))]">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--accent))] transition-colors">
                Cancel
              </button>
              <button
                onClick={handleEnter}
                disabled={!selectedPostId || submitting}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Enter competition
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
