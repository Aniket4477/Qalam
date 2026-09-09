'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Profile } from '@/lib/supabase/types'
import FollowButton from './FollowButton'
import { MessageSquare, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface UserCardProps {
  profile: Profile
  initialIsFollowing?: boolean
  currentUserId?: string | null
  showFollowButton?: boolean
  showBio?: boolean
}

export default function UserCard({
  profile,
  initialIsFollowing = false,
  currentUserId,
  showFollowButton = true,
  showBio = true,
}: UserCardProps) {
  const [imgError, setImgError] = useState(false)
  const isSelf = currentUserId === profile.id

  return (
    <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary)/0.4)] hover:shadow-md transition-all duration-200">
      {/* User Info (clickable link to profile) */}
      <Link
        href={`/u/${profile.username}`}
        className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0"
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          {profile.avatar_url && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              onError={() => setImgError(true)}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-full object-cover border border-[hsl(var(--border))] group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[hsl(var(--primary)/0.25)] to-[hsl(var(--accent))] flex items-center justify-center text-base sm:text-lg font-bold text-[hsl(var(--primary))] border border-[hsl(var(--border))] group-hover:scale-105 transition-transform duration-200">
              {profile.display_name?.slice(0, 2).toUpperCase() || 'QA'}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="text-base font-semibold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors truncate"
              style={{ fontFamily: 'Lora, Georgia, serif' }}
            >
              {profile.display_name}
            </h3>
            <span className="text-xs font-mono text-[hsl(var(--muted-foreground))] px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] border border-[hsl(var(--border)/0.5)]">
              @{profile.username}
            </span>
          </div>

          {showBio && profile.bio && (
            <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 mt-1 italic">
              &ldquo;{profile.bio}&rdquo;
            </p>
          )}

          <div className="flex items-center gap-3 mt-1.5 text-xs text-[hsl(var(--muted-foreground))]">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              Joined {formatDate(profile.created_at)}
            </span>
          </div>
        </div>
      </Link>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-[hsl(var(--border)/0.5)] w-full sm:w-auto justify-end">
        {/* Send message button if not self and logged in */}
        {currentUserId && !isSelf && (
          <Link
            href={`/messages/new?with=${profile.id}`}
            className="p-2 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
            title={`Message ${profile.display_name}`}
            aria-label={`Message ${profile.display_name}`}
          >
            <MessageSquare size={16} />
          </Link>
        )}

        {/* Follow button */}
        {showFollowButton && !isSelf && (
          <FollowButton
            targetUserId={profile.id}
            initialIsFollowing={initialIsFollowing}
          />
        )}

        {/* If self, show a subtle profile badge */}
        {isSelf && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] font-medium">
            You
          </span>
        )}
      </div>
    </div>
  )
}
