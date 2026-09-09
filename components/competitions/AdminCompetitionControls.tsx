'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Competition, CompetitionStatus } from '@/lib/supabase/types'
import { Shield, CheckCircle2, Trash2, ArrowRight, Loader2 } from 'lucide-react'

interface AdminCompetitionControlsProps {
  competition: Competition
}

const STATUS_ORDER: CompetitionStatus[] = ['upcoming', 'open', 'voting', 'closed']

const STATUS_LABELS: Record<CompetitionStatus, string> = {
  upcoming: 'Upcoming',
  open: 'Open for Submissions',
  voting: 'Voting Active',
  closed: 'Closed & Concluded',
}

export default function AdminCompetitionControls({ competition }: AdminCompetitionControlsProps) {
  const router = useRouter()
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const [currentStatus, setCurrentStatus] = useState<CompetitionStatus>(competition.status)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleStatusChange = async (nextStatus: CompetitionStatus) => {
    if (nextStatus === currentStatus || updating) return
    setUpdating(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const { error } = await sb
        .from('competitions')
        .update({ status: nextStatus })
        .eq('id', competition.id)

      if (error) throw error

      setCurrentStatus(nextStatus)
      setSuccessMsg(`Status updated to "${STATUS_LABELS[nextStatus]}"`)
      setTimeout(() => setSuccessMsg(null), 3500)
      router.refresh()
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to update competition status')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${competition.title}"? This cannot be undone.`
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      const { error } = await sb.from('competitions').delete().eq('id', competition.id)
      if (error) throw error
      router.push('/competitions')
      router.refresh()
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to delete competition')
      setDeleting(false)
    }
  }

  return (
    <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent backdrop-blur-xs shadow-xs animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500">
            <Shield size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Administrator Toolbar
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 font-semibold">
                Private
              </span>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Manage competition phase and community submissions
            </p>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          <span>Delete Challenge</span>
        </button>
      </div>

      {/* Phase Progression Stepper */}
      <div className="mt-3">
        <div className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] mb-2 flex items-center justify-between">
          <span>Set Competition Phase:</span>
          {updating && (
            <span className="inline-flex items-center gap-1 text-amber-500 text-xs">
              <Loader2 size={12} className="animate-spin" /> Saving...
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STATUS_ORDER.map((s) => {
            const isActive = currentStatus === s
            return (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={updating}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs font-semibold'
                    : 'bg-[hsl(var(--card))] border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-amber-500/50 hover:text-[hsl(var(--foreground))]'
                }`}
              >
                <span>{STATUS_LABELS[s]}</span>
                {isActive && <CheckCircle2 size={14} className="text-slate-950 shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>

      {successMsg && (
        <p className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
          ✓ {successMsg}
        </p>
      )}

      {errorMsg && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">
          ✕ {errorMsg}
        </p>
      )}
    </div>
  )
}
