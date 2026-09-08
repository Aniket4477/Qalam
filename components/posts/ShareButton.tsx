'use client'

import { Share2, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface ShareButtonProps {
  title: string
  author: string
  preview: string
  url?: string
}

export default function ShareButton({ title, author, preview, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '')

  const shareText = title
    ? `"${title}" by ${author}\n\n${preview}\n\nRead on Qalam: ${shareUrl}`
    : `By ${author}:\n\n${preview}\n\nRead on Qalam: ${shareUrl}`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title ? `"${title}" by ${author}` : `Poem by ${author}`,
          text: shareText,
          url: shareUrl,
        })
      } catch (e) {
        // User cancelled — not an error
        if ((e as Error).name !== 'AbortError') {
          fallbackCopy()
        }
      }
    } else {
      fallbackCopy()
    }
  }

  const fallbackCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard not available
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--foreground)/0.3)] transition-all duration-150"
      aria-label="Share this post"
    >
      {copied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
      <span className="text-sm">{copied ? 'Copied!' : 'Share'}</span>
    </button>
  )
}
