'use client'

import { useState, useEffect } from 'react'
import { Trophy, Loader2, Award, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CompetitionVoteButtonProps {
  competitionId: string
  entryId: string
  authorId: string
  competitionStatus: string
  initialVotesCount: number
  initialUserVoted: boolean
  currentUserId?: string | null
  className?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onVoteChange?: (voted: boolean, count: number, voters?: any[]) => void
}

export default function CompetitionVoteButton({
  competitionId,
  entryId,
  authorId,
  competitionStatus,
  initialVotesCount,
  initialUserVoted,
  currentUserId,
  className,
  onVoteChange,
}: CompetitionVoteButtonProps) {
  const [hasVoted, setHasVoted] = useState(initialUserVoted)
  const [votesCount, setVotesCount] = useState(initialVotesCount)
  const [loading, setLoading] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    setHasVoted(initialUserVoted)
  }, [initialUserVoted])

  useEffect(() => {
    setVotesCount(initialVotesCount)
  }, [initialVotesCount])

  const isAuthor = Boolean(currentUserId && currentUserId === authorId)
  const isClosed = competitionStatus === 'closed'
  const isUpcoming = competitionStatus === 'upcoming'
  const isDisabled = isAuthor || isClosed || isUpcoming || loading

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!currentUserId) {
      window.location.href = `/login?redirectTo=${encodeURIComponent(window.location.pathname)}`
      return
    }

    if (isAuthor) {
      setErrorMessage('You cannot vote for your own entry.')
      setTimeout(() => setErrorMessage(null), 3000)
      return
    }

    if (isClosed) {
      setErrorMessage('Voting has closed for this competition.')
      setTimeout(() => setErrorMessage(null), 3000)
      return
    }

    if (loading) return

    // Optimistic UI update
    const previousVoted = hasVoted
    const previousCount = votesCount
    const newVoted = !hasVoted
    const newCount = newVoted ? previousCount + 1 : Math.max(0, previousCount - 1)

    setHasVoted(newVoted)
    setVotesCount(newCount)
    if (newVoted) {
      setAnimating(true)
      setTimeout(() => setAnimating(false), 700)
    }
    onVoteChange?.(newVoted, newCount)

    setLoading(true)
    try {
      const res = await fetch('/api/competitions/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId,
          entryId,
          action: 'toggle',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit vote')
      }

      setHasVoted(data.userHasVoted)
      setVotesCount(data.votesCount)
      onVoteChange?.(data.userHasVoted, data.votesCount, data.voters)
    } catch (err: unknown) {
      console.error('Failed to vote:', err)
      // Revert optimistic update
      setHasVoted(previousVoted)
      setVotesCount(previousCount)
      onVoteChange?.(previousVoted, previousCount)
      const msg = err instanceof Error ? err.message : 'Failed to update vote'
      setErrorMessage(msg)
      setTimeout(() => setErrorMessage(null), 4000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleVote}
        disabled={isDisabled && !isAuthor}
        title={
          isAuthor
            ? 'You cannot vote for your own entry'
            : isClosed
            ? 'Competition has closed'
            : isUpcoming
            ? 'Voting has not opened yet'
            : hasVoted
            ? 'Click to remove vote'
            : 'Vote for this entry'
        }
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all select-none',
          hasVoted
            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/35 hover:bg-amber-500/20 shadow-xs'
            : 'border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-amber-500/30 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/5',
          isAuthor && 'opacity-60 cursor-not-allowed',
          isClosed && 'opacity-70 cursor-default',
          animating && 'scale-105 transition-transform duration-200',
          className
        )}
      >
        {loading ? (
          <Loader2 size={13} className="animate-spin text-amber-500" />
        ) : hasVoted ? (
          <Trophy size={13} className="text-amber-500 fill-amber-500 shrink-0" />
        ) : (
          <Trophy size={13} className="shrink-0 text-[hsl(var(--muted-foreground))] group-hover:text-amber-500" />
        )}

        <span>{hasVoted ? 'Voted' : 'Vote'}</span>

        <span
          className={cn(
            'px-1.5 py-0.2 rounded-full text-[11px] font-semibold tabular-nums',
            hasVoted
              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
              : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'
          )}
        >
          {votesCount}
        </span>
      </button>

      {/* Floating tooltip/alert if clicked invalid action */}
      {errorMessage && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-30 px-2.5 py-1 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 text-[11px] rounded-md shadow-lg whitespace-nowrap animate-fade-in border border-amber-500/40">
          {errorMessage}
        </div>
      )}
    </div>
  )
}
