'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { PostType, CompetitionStatus } from '@/lib/supabase/types'
import { POST_TYPE_LABELS, isUserAdmin } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const POST_TYPES: (PostType | null)[] = [null, 'poem', 'shayari', 'ghazal', 'haiku', 'free_verse', 'quote', 'other']

export default function NewCompetitionPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<PostType | null>(null)
  const [startsAt, setStartsAt] = useState('')
  const [submissionsCloseAt, setSubmissionsCloseAt] = useState('')
  const [votingClosesAt, setVotingClosesAt] = useState('')

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any).from('profiles').select('id, username, display_name, is_admin').eq('id', user.id).single()
      const admin = isUserAdmin(profile)
      if (!admin) { router.push('/competitions'); return }

      // Auto-sync is_admin in profiles table if not set yet
      if (!profile?.is_admin) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('profiles').update({ is_admin: true }).eq('id', user.id)
      }

      setIsAdmin(true)
      setLoading(false)
    }
    check()
  }, [router, supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Ensure is_admin is true in DB so RLS policy passes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('profiles').update({ is_admin: true }).eq('id', user.id)

    const now = new Date()
    const starts = new Date(startsAt)
    let status: CompetitionStatus = 'upcoming'
    if (now >= starts) status = 'open'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any).from('competitions').insert({
      title,
      description,
      type: type ?? undefined as unknown as PostType,
      starts_at: startsAt,
      submissions_close_at: submissionsCloseAt,
      voting_closes_at: votingClosesAt,
      status,
      created_by: user.id,
    })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
    } else {
      router.push('/competitions')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-[hsl(var(--muted-foreground))]" />
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="max-w-xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Lora, Georgia, serif' }}>
        New Competition
      </h1>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1.5">Title</label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Monsoon Musings"
            className="w-full px-3 py-2.5 bg-[hsl(var(--input)/0.5)] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1.5">Theme / Prompt</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="Describe the theme, any constraints, and what makes a great entry…"
            className="w-full px-3 py-2.5 bg-[hsl(var(--input)/0.5)] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] resize-none"
          />
        </div>

        <div>
          <label htmlFor="compType" className="block text-sm font-medium mb-1.5">
            Restrict to form (optional)
          </label>
          <select
            id="compType"
            value={type ?? ''}
            onChange={(e) => setType((e.target.value || null) as PostType | null)}
            className="w-full px-3 py-2.5 bg-[hsl(var(--input)/0.5)] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          >
            <option value="">Any form</option>
            {POST_TYPES.filter(Boolean).map((t) => (
              <option key={t!} value={t!}>{POST_TYPE_LABELS[t!]}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="startsAt" className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Opens</label>
            <input
              id="startsAt"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[hsl(var(--input)/0.5)] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            />
          </div>
          <div>
            <label htmlFor="submissionsClose" className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Submissions close</label>
            <input
              id="submissionsClose"
              type="datetime-local"
              value={submissionsCloseAt}
              onChange={(e) => setSubmissionsCloseAt(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[hsl(var(--input)/0.5)] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            />
          </div>
          <div>
            <label htmlFor="votingClose" className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Voting closes</label>
            <input
              id="votingClose"
              type="datetime-local"
              value={votingClosesAt}
              onChange={(e) => setVotingClosesAt(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[hsl(var(--input)/0.5)] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Create competition
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 border border-[hsl(var(--border))] rounded-lg text-sm hover:bg-[hsl(var(--accent))] transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
