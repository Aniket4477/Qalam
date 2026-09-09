'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Group, GroupMember } from '@/lib/supabase/types'
import { X, Users, ShieldCheck, LogOut, Calendar, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface GroupInfoModalProps {
  group: Group
  members: GroupMember[]
  currentUserId: string
  onClose: () => void
}

export default function GroupInfoModal({
  group,
  members,
  currentUserId,
  onClose,
}: GroupInfoModalProps) {
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const isCreator = group.created_by === currentUserId

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this Poetry Circle?')) return

    setLeaving(true)
    try {
      // Delete member entry
      await sb
        .from('group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('user_id', currentUserId)

      // Post notification message in group
      await sb.from('group_messages').insert({
        group_id: group.id,
        sender_id: currentUserId,
        body: 'left the circle',
      })

      onClose()
      router.push('/messages')
      router.refresh()
    } catch (err) {
      console.error('Error leaving group:', err)
      alert('Could not leave group. Please try again.')
    } finally {
      setLeaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-b from-[hsl(var(--primary)/0.12)] to-transparent border-b border-[hsl(var(--border))] text-center">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.6)] text-[hsl(var(--primary-foreground))] flex items-center justify-center mx-auto mb-3 shadow-md">
            <Users size={28} />
          </div>

          <h2
            className="text-xl font-bold text-[hsl(var(--foreground))]"
            style={{ fontFamily: 'Lora, Georgia, serif' }}
          >
            {group.name}
          </h2>

          {group.description && (
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1.5 max-w-xs mx-auto italic">
              &ldquo;{group.description}&rdquo;
            </p>
          )}

          <div className="flex items-center justify-center gap-1 text-[11px] text-[hsl(var(--muted-foreground))] mt-2">
            <Calendar size={12} />
            <span>Created {formatDate(group.created_at)}</span>
          </div>
        </div>

        {/* Member List */}
        <div className="p-4 max-h-72 overflow-y-auto">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Circle Members ({members.length})
            </span>
          </div>

          <div className="divide-y divide-[hsl(var(--border)/0.5)]">
            {members.map((m) => {
              const p = m.profiles
              if (!p) return null
              const isMemberSelf = p.id === currentUserId
              const isGroupAdmin = m.role === 'admin' || p.id === group.created_by

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between py-2.5 px-2 hover:bg-[hsl(var(--accent))] rounded-xl transition-colors"
                >
                  <Link
                    href={`/u/${p.username}`}
                    onClick={onClose}
                    className="flex items-center gap-2.5 min-w-0 flex-1"
                  >
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.avatar_url}
                        alt={p.display_name}
                        className="w-9 h-9 rounded-full object-cover shrink-0 border border-[hsl(var(--border))]"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] flex items-center justify-center text-xs font-bold shrink-0">
                        {p.display_name?.slice(0, 2).toUpperCase() || 'QA'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[hsl(var(--foreground))] truncate">
                          {p.display_name}
                        </span>
                        {isMemberSelf && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[hsl(var(--muted-foreground))] font-mono truncate">
                        @{p.username}
                      </span>
                    </div>
                  </Link>

                  <div className="shrink-0 ml-2">
                    {isGroupAdmin && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                        <ShieldCheck size={11} /> Admin
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.2)] flex items-center justify-between">
          <button
            onClick={handleLeaveGroup}
            disabled={leaving}
            className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
          >
            {leaving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <LogOut size={13} />
            )}
            <span>Leave Circle</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-[hsl(var(--border))] text-xs font-medium hover:bg-[hsl(var(--accent))] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
