'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'

interface PostActionsProps {
  postId: string
}

export default function PostActions({ postId }: PostActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this post? This cannot be undone.')) return
    setDeleting(true)
    await supabase.from('posts').delete().eq('id', postId)
    router.push('/')
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
        aria-label="Post options"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-40 bg-[hsl(var(--popover))] border border-[hsl(var(--border))] rounded-lg shadow-lg py-1 z-50 animate-fade-in">
            <button
              onClick={() => {
                setOpen(false)
                router.push(`/write?edit=${postId}`)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[hsl(var(--accent))] transition-colors"
            >
              <Edit size={14} /> Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--destructive))] hover:bg-[hsl(var(--accent))] transition-colors"
            >
              <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
