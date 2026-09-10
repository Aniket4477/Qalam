import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Competition } from '@/lib/supabase/types'
import { formatDate, formatDeadline, isUserAdmin } from '@/lib/utils'
import { Trophy, Plus, Clock, ChevronRight, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Competitions',
  description: 'Writing competitions and themed challenges on Qalam',
}

const STATUS_CONFIG = {
  upcoming: { label: 'Upcoming', className: 'badge-upcoming' },
  open: { label: 'Open', className: 'badge-open' },
  voting: { label: 'Voting', className: 'badge-voting' },
  closed: { label: 'Closed', className: 'badge-closed' },
}

export default async function CompetitionsPage() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: competitions }, { data: profile }] = await Promise.all([
    sb.from('competitions').select('*').order('starts_at', { ascending: false }),
    user
      ? sb.from('profiles').select('id, username, display_name, is_admin').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
  ])

  const isAdmin = isUserAdmin(profile)

  // Auto-sync admin status in database if user is admin but is_admin is not true yet
  if (user && isAdmin && !profile?.is_admin) {
    await sb.from('profiles').update({ is_admin: true }).eq('id', user.id)
  }

  const comps = (competitions ?? []) as Competition[]

  const grouped = {
    open: comps.filter((c) => c.status === 'open'),
    voting: comps.filter((c) => c.status === 'voting'),
    upcoming: comps.filter((c) => c.status === 'upcoming'),
    closed: comps.filter((c) => c.status === 'closed'),
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Lora, Georgia, serif' }}>
            Competitions
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Themed writing challenges for the Qalam community
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/competitions/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={15} /> Host Competition
          </Link>
        )}
      </div>

      {isAdmin && (
        <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Shield size={18} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Administrator Control Access</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">You have full administrator privileges to host, monitor, and conclude poetry competitions.</p>
            </div>
          </div>
          <Link
            href="/competitions/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs transition-colors shrink-0 self-start sm:self-auto shadow-xs"
          >
            <Plus size={14} /> New Challenge
          </Link>
        </div>
      )}

      {comps.length === 0 ? (
        <div className="text-center py-20">
          <Trophy size={40} className="mx-auto text-[hsl(var(--muted-foreground))] mb-4 opacity-30" />
          <p className="text-[hsl(var(--muted-foreground))] text-sm">No competitions yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([status, items]) => {
            if (items.length === 0) return null
            const { label } = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
            return (
              <section key={status}>
                <h2 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">
                  {label}
                </h2>
                <div className="space-y-3">
                  {items.map((comp) => <CompetitionCard key={comp.id} competition={comp} />)}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CompetitionCard({ competition: c }: { competition: Competition }) {
  const { label, className } = STATUS_CONFIG[c.status]

  return (
    <Link
      href={`/competitions/${c.id}`}
      className="flex items-center justify-between gap-4 p-4 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))] hover:border-[hsl(var(--primary)/0.3)] hover:shadow-sm transition-all group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>{label}</span>
        </div>
        <h3 className="font-semibold text-sm truncate group-hover:text-[hsl(var(--primary))] transition-colors" style={{ fontFamily: 'Lora, Georgia, serif' }}>
          {c.title}
        </h3>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 flex items-center gap-1">
          <Clock size={11} />
          {c.status === 'open' ? `Submissions ${formatDeadline(c.submissions_close_at)}`
            : c.status === 'voting' ? `Voting ${formatDeadline(c.voting_closes_at)}`
            : c.status === 'upcoming' ? `Opens ${formatDate(c.starts_at)}`
            : `Ended ${formatDate(c.voting_closes_at)}`}
        </p>
      </div>
      <ChevronRight size={16} className="text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors shrink-0" />
    </Link>
  )
}
