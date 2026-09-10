'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import SendPostModal from './SendPostModal'
import { cn } from '@/lib/utils'

interface SendPostButtonProps {
  postId: string
  title?: string | null
  authorName: string
  authorUsername?: string | null
  authorAvatar?: string | null
  preview: string
  variant?: 'button' | 'icon'
  className?: string
}

export default function SendPostButton({
  postId,
  title,
  authorName,
  authorUsername,
  authorAvatar,
  preview,
  variant = 'button',
  className,
}: SendPostButtonProps) {
  const [open, setOpen] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setOpen(true)
  }

  return (
    <>
      {variant === 'button' ? (
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary)/0.4)] hover:bg-[hsl(var(--accent))] transition-all duration-150 shadow-2xs',
            className
          )}
          aria-label="Send in chat"
          title="Send in chat"
        >
          <Send size={15} className="text-[hsl(var(--primary))]" />
          <span className="text-sm font-medium">Send</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            'flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors py-0.5 px-1 rounded hover:bg-[hsl(var(--accent))]',
            className
          )}
          aria-label="Send in chat"
          title="Send to friend or group"
        >
          <Send size={15} />
          <span>Send</span>
        </button>
      )}

      {open && (
        <SendPostModal
          post={{
            id: postId,
            title: title || undefined,
            author_name: authorName,
            author_username: authorUsername || undefined,
            author_avatar: authorAvatar || undefined,
            preview,
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
