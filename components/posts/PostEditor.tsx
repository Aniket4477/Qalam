'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { PostType, PostStatus } from '@/lib/supabase/types'
import { POST_TYPE_LABELS, LANGUAGE_OPTIONS } from '@/lib/utils'
import { Loader2, Eye, EyeOff, X, Plus } from 'lucide-react'

const POST_TYPES: PostType[] = ['poem', 'shayari', 'ghazal', 'haiku', 'free_verse', 'other']

interface PostEditorProps {
  postId?: string
}

export default function PostEditor({ postId }: PostEditorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState<PostType>('poem')
  const [language, setLanguage] = useState('English')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [status, setStatus] = useState<PostStatus>('draft')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)

  // Support ?edit=<id> param
  const editId = postId ?? searchParams.get('edit') ?? undefined

  useEffect(() => {
    if (!editId) return
    const load = async () => {
      setLoading(true)
      const { data } = await sb.from('posts').select('*').eq('id', editId).single()
      if (data) {
        setTitle(data.title ?? '')
        setBody(data.body)
        setType(data.type)
        setLanguage(data.language)
        setTags(data.tags)
        setStatus(data.status)
      }
      setLoading(false)
    }
    load()
  }, [editId, sb])

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (tag && !tags.includes(tag) && tags.length < 8) {
      setTags((prev) => [...prev, tag])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleSave = async (targetStatus: PostStatus) => {
    if (!body.trim()) {
      setError('The poem body is required.')
      return
    }

    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const competitionId = searchParams.get('competition')

    const payload = {
      title: title.trim() || null,
      body,
      type,
      language,
      tags,
      status: targetStatus,
    }

    let id = editId
    if (editId) {
      const { error: updateError } = await sb.from('posts').update(payload).eq('id', editId)
      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }
    } else {
      const { data, error: insertError } = await sb
        .from('posts')
        .insert({ ...payload, author_id: user.id })
        .select('id')
        .single()
      if (insertError || !data) {
        setError(insertError?.message ?? 'Failed to save post.')
        setSaving(false)
        return
      }
      id = data.id

      // If writing for a competition, auto-enter
      if (competitionId && targetStatus === 'published') {
        await sb.from('competition_entries').insert({
          competition_id: competitionId,
          post_id: id,
        })
      }
    }

    setSaving(false)
    if (targetStatus === 'published') {
      router.push(`/post/${id}`)
    } else {
      router.push('/settings')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-[hsl(var(--muted-foreground))]" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'Lora, Georgia, serif' }}>
          {editId ? 'Edit' : 'Write'}
        </h1>
        <button
          onClick={() => setPreview(!preview)}
          className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
        >
          {preview ? <EyeOff size={16} /> : <Eye size={16} />}
          {preview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {preview ? (
        <div className="border border-[hsl(var(--border))] rounded-lg p-6 bg-[hsl(var(--card))]">
          {title && (
            <h2 className="text-2xl font-semibold mb-4" style={{ fontFamily: 'Lora, Georgia, serif' }}>
              {title}
            </h2>
          )}
          <div className="prose-poem">{body || <span className="text-[hsl(var(--muted-foreground))]">Nothing written yet…</span>}</div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-6">
              {tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full px-0 py-2 text-xl font-semibold bg-transparent border-b border-[hsl(var(--border))] focus:outline-none focus:border-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground)/0.5)] transition-colors"
            style={{ fontFamily: 'Lora, Georgia, serif' }}
          />

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Begin writing your poem, shayari, or ghazal here…&#10;&#10;Line breaks are preserved exactly as you type them."
            className="poetry-textarea w-full px-0 py-2 bg-transparent border-none focus:outline-none placeholder:text-[hsl(var(--muted-foreground)/0.4)] resize-none"
            rows={16}
            spellCheck
          />

          <div className="flex flex-wrap gap-3 pt-2 border-t border-[hsl(var(--border))]">
            <div className="flex-1 min-w-36">
              <label htmlFor="postType" className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Type</label>
              <select
                id="postType"
                value={type}
                onChange={(e) => setType(e.target.value as PostType)}
                className="w-full px-3 py-2 text-sm bg-[hsl(var(--input)/0.5)] border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              >
                {POST_TYPES.map((t) => (
                  <option key={t} value={t}>{POST_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-36">
              <label htmlFor="language" className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Language</label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[hsl(var(--input)/0.5)] border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              >
                {LANGUAGE_OPTIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Tags (up to 8)</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-[hsl(var(--destructive))] transition-colors">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
                }}
                placeholder="Add a tag, press Enter"
                maxLength={32}
                className="flex-1 px-3 py-1.5 text-sm bg-[hsl(var(--input)/0.5)] border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              />
              <button type="button" onClick={addTag} className="p-1.5 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-colors">
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[hsl(var(--border))]">
        <button
          onClick={() => handleSave('draft')}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 text-sm border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--accent))] transition-colors disabled:opacity-60"
        >
          {saving && status === 'draft' && <Loader2 size={14} className="animate-spin" />}
          Save draft
        </button>
        <button
          onClick={() => handleSave('published')}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          Publish
        </button>
        <button type="button" onClick={() => router.back()} className="ml-auto text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}
