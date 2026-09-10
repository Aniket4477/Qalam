'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Profile } from '@/lib/supabase/types'
import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import CompetitionVotersModal from './CompetitionVotersModal'

interface CompetitionVotedByTextProps {
  competitionId: string
  entryId: string
  votesCount: number
  initialVoters?: Profile[]
  userHasVoted?: boolean
  currentUserId?: string | null
  className?: string
}

export default function CompetitionVotedByText({
  competitionId,
  entryId,
  votesCount,
  initialVoters = [],
  userHasVoted = false,
  currentUserId,
  className,
}: CompetitionVotedByTextProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [voters, setVoters] = useState<Profile[]>(initialVoters)

  useEffect(() => {
    if (initialVoters && initialVoters.length > 0) {
      setVoters(initialVoters)
    }
  }, [initialVoters])

  // Top voter display
  const firstVoter = voters[0] ?? null
  const isFirstVoterSelf = Boolean(
    firstVoter && currentUserId && firstVoter.id === currentUserId
  )
  const showYou = userHasVoted && (votesCount === 1 || !firstVoter || isFirstVoterSelf)
  const highlightedUsername = firstVoter?.username

  if (votesCount <= 0) {
    return (
      <>
        <div
          className={cn(
            'text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1.5 leading-normal select-none',
            className
          )}
        >
          <Trophy size={12} className="text-amber-500/60 shrink-0" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              setModalOpen(true)
            }}
            className="hover:text-[hsl(var(--foreground))] hover:underline cursor-pointer transition-colors"
          >
            0 votes so far
          </button>
        </div>

        {modalOpen && (
          <CompetitionVotersModal
            entryId={entryId}
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            initialVoters={voters}
            initialCount={votesCount}
          />
        )}
      </>
    )
  }

  return (
    <>
      <div
        className={cn(
          'text-xs text-[hsl(var(--muted-foreground))] flex items-center flex-wrap gap-1 leading-normal select-none',
          className
        )}
      >
        <Trophy size={12} className="text-amber-500 shrink-0" />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            setModalOpen(true)
          }}
          className="hover:text-[hsl(var(--foreground))] transition-colors"
        >
          Voted by
        </button>

        {showYou ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              setModalOpen(true)
            }}
            className="font-semibold text-[hsl(var(--foreground))] hover:underline"
          >
            you
          </button>
        ) : highlightedUsername ? (
          <Link
            href={`/u/${highlightedUsername}`}
            onClick={(e) => e.stopPropagation()}
            className="font-semibold text-[hsl(var(--foreground))] hover:underline"
          >
            {highlightedUsername}
          </Link>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              setModalOpen(true)
            }}
            className="font-semibold text-[hsl(var(--foreground))] hover:underline"
          >
            voters
          </button>
        )}

        {votesCount > 1 && (
          <>
            <span>and</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setModalOpen(true)
              }}
              className="font-semibold text-[hsl(var(--foreground))] hover:underline cursor-pointer"
            >
              {votesCount - 1} other{votesCount - 1 !== 1 ? 's' : ''}
            </button>
          </>
        )}
      </div>

      {modalOpen && (
        <CompetitionVotersModal
          entryId={entryId}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          initialVoters={voters}
          initialCount={votesCount}
        />
      )}
    </>
  )
}
