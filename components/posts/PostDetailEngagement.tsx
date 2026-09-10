'use client'

import { useState, useEffect } from 'react'
import type { Profile } from '@/lib/supabase/types'
import LikeButton from './LikeButton'
import SendPostButton from './SendPostButton'
import ShareButton from './ShareButton'
import LikedByText from './LikedByText'

interface PostDetailEngagementProps {
  postId: string
  initialLikesCount: number
  initialUserLiked: boolean
  initialFirstLiker?: Profile | null
  title?: string
  authorName: string
  authorUsername?: string
  authorAvatar?: string
  preview: string
  postUrl: string
  currentUserId?: string | null
}

export default function PostDetailEngagement({
  postId,
  initialLikesCount,
  initialUserLiked,
  initialFirstLiker = null,
  title,
  authorName,
  authorUsername,
  authorAvatar,
  preview,
  postUrl,
  currentUserId,
}: PostDetailEngagementProps) {
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [userLiked, setUserLiked] = useState(initialUserLiked)

  useEffect(() => {
    setLikesCount(initialLikesCount)
  }, [initialLikesCount])

  useEffect(() => {
    setUserLiked(initialUserLiked)
  }, [initialUserLiked])

  return (
    <div className="py-4 border-t border-b border-[hsl(var(--border))] mb-8">
      <div className="flex items-center gap-3 flex-wrap">
        <LikeButton
          postId={postId}
          initialCount={likesCount}
          initialLiked={userLiked}
          currentUserId={currentUserId}
          isAuthenticated={!!currentUserId}
          onLikeChange={(liked, count) => {
            setUserLiked(liked)
            setLikesCount(count)
          }}
        />
        <SendPostButton
          postId={postId}
          title={title}
          authorName={authorName}
          authorUsername={authorUsername}
          authorAvatar={authorAvatar}
          preview={preview}
          variant="button"
          currentUserId={currentUserId}
        />
        <ShareButton
          title={title ?? ''}
          author={authorName}
          preview={preview}
          url={postUrl}
        />
      </div>

      {likesCount > 0 && (
        <div className="mt-3 pt-3 border-t border-[hsl(var(--border)/0.5)]">
          <LikedByText
            postId={postId}
            likesCount={likesCount}
            initialFirstLiker={initialFirstLiker}
            userHasLiked={userLiked}
            currentUserId={currentUserId}
            className="text-sm"
          />
        </div>
      )}
    </div>
  )
}
