'use client'

import { useState } from 'react'
import FollowButton from './FollowButton'
import FollowsModal from './FollowsModal'

interface ProfileFollowStatsProps {
  targetUserId: string
  isOwnProfile: boolean
  initialFollowersCount: number
  initialFollowingCount: number
  initialIsFollowing: boolean
}

export default function ProfileFollowStats({
  targetUserId,
  isOwnProfile,
  initialFollowersCount,
  initialFollowingCount,
  initialIsFollowing,
}: ProfileFollowStatsProps) {
  const [followersCount, setFollowersCount] = useState(initialFollowersCount)
  const [followingCount] = useState(initialFollowingCount)
  const [modalTab, setModalTab] = useState<'followers' | 'following' | null>(null)

  const handleFollowChange = (isFollowing: boolean) => {
    setFollowersCount((prev) => Math.max(0, prev + (isFollowing ? 1 : -1)))
  }

  return (
    <>
      <div className="flex items-center gap-4 text-sm mt-3 pt-3 border-t border-[hsl(var(--border))]">
        <button
          type="button"
          onClick={() => setModalTab('followers')}
          className="hover:underline cursor-pointer transition-colors"
        >
          <span className="font-bold text-[hsl(var(--foreground))] tabular-nums">{followersCount}</span>{' '}
          <span className="text-[hsl(var(--muted-foreground))]">followers</span>
        </button>
        <button
          type="button"
          onClick={() => setModalTab('following')}
          className="hover:underline cursor-pointer transition-colors"
        >
          <span className="font-bold text-[hsl(var(--foreground))] tabular-nums">{followingCount}</span>{' '}
          <span className="text-[hsl(var(--muted-foreground))]">following</span>
        </button>

        {!isOwnProfile && (
          <div className="ml-auto">
            <FollowButton
              targetUserId={targetUserId}
              initialIsFollowing={initialIsFollowing}
              onFollowChange={handleFollowChange}
            />
          </div>
        )}
      </div>

      {modalTab && (
        <FollowsModal
          userId={targetUserId}
          initialTab={modalTab}
          onClose={() => setModalTab(null)}
        />
      )}
    </>
  )
}
