'use client'

import Link from 'next/link'
import { AtSign, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface KnownMentionUser {
  username: string
  displayName?: string
}

interface MessageBodyWithMentionsProps {
  body: string
  currentUsername?: string
  knownUsers?: KnownMentionUser[]
}

/**
 * Parses and renders chat message text with interactive @mentions,
 * @everyone badges, and personal mention highlights.
 */
export default function MessageBodyWithMentions({
  body,
  currentUsername,
  knownUsers = [],
}: MessageBodyWithMentionsProps) {
  // Matches @username or @everyone / @all
  // Valid username characters: letters, numbers, underscores, dots, hyphens
  const parts = body.split(/(@[a-zA-Z0-9_.-]+)/g)

  const normalizedCurrent = currentUsername?.toLowerCase().trim()

  return (
    <p className="whitespace-pre-wrap break-words leading-relaxed">
      {parts.map((part, idx) => {
        if (!part.startsWith('@')) {
          return <span key={idx}>{part}</span>
        }

        const raw = part.slice(1).toLowerCase()

        // 1. @everyone or @all broadcast badge
        if (raw === 'everyone' || raw === 'all') {
          return (
            <span
              key={idx}
              className="inline-flex items-center gap-1 font-bold text-amber-500 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-md text-xs mx-0.5 align-baseline select-none"
            >
              <Users size={12} className="shrink-0" />
              <span>{part}</span>
            </span>
          )
        }

        // 2. Member mention
        const isSelf = Boolean(normalizedCurrent && raw === normalizedCurrent)
        const matched = knownUsers.find((u) => u.username.toLowerCase() === raw)
        const displayHandle = matched ? matched.username : part.slice(1)

        return (
          <Link
            key={idx}
            href={`/u/${displayHandle}`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs mx-0.5 transition-all align-baseline font-medium cursor-pointer',
              isSelf
                ? 'bg-[hsl(var(--primary)/0.25)] text-[hsl(var(--primary))] font-bold border border-[hsl(var(--primary)/0.4)] ring-1 ring-[hsl(var(--primary)/0.3)] shadow-2xs hover:bg-[hsl(var(--primary)/0.35)]'
                : 'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.2)] hover:bg-[hsl(var(--primary)/0.22)]'
            )}
          >
            <AtSign size={11} className="shrink-0 opacity-80" />
            <span>{displayHandle}</span>
          </Link>
        )
      })}
    </p>
  )
}
