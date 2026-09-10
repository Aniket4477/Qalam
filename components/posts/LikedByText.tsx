'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'
import PostLikesModal from './PostLikesModal'

interface LikedByTextProps {
  postId: string
  likesCount: number
  initialFirstLiker?: Profile | null
  userHasLiked?: boolean
  currentUserId?: string | null
  className?: string
}

export default function LikedByText({
  postId,
  likesCount,
  initialFirstLiker = null,
  userHasLiked = false,
  currentUserId: propCurrentUserId,
  className,
}: LikedByTextProps) {
  const [firstLiker, setFirstLiker] = useState<Profile | null>(initialFirstLiker)
  const [currentUserId, setCurrentUserId] = useState<string | null>(propCurrentUserId ?? null)
  const [modalOpen, setModalOpen] = useState(false)

  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  useEffect(() => {
    if (propCurrentUserId !== undefined) {
      setCurrentUserId(propCurrentUserId)
      return
    }
    // Only look up session if prop wasn't provided
    supabase.auth.getSession().then(({ data }: any) => {
      if (data?.session?.user) setCurrentUserId(data.session.user.id)
    })
  }, [propCurrentUserId, supabase])

  useEffect(() => {
    if (initialFirstLiker) {
      setFirstLiker(initialFirstLiker)
    }
  }, [initialFirstLiker])

  // If we have likes but no firstLiker known, fetch the top liker
  useEffect(() => {
    if (likesCount <= 0 || firstLiker) return

    let isMounted = true
    const fetchFirstLiker = async () => {
      try {
        const { data } = await sb
          .from('likes')
          .select('profiles(*)')
          .eq('post_id', postId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (isMounted && data?.profiles) {
          setFirstLiker(data.profiles as Profile)
        }
      } catch {
        // Silently ignore single row / empty errors
      }
    }

    fetchFirstLiker()

    return () => {
      isMounted = false
    }
  }, [postId, likesCount, firstLiker, sb])

  if (likesCount <= 0) return null

  // Determine who to highlight:
  // If current user liked it and is the only liker, show "you"
  // If another liker exists, show that user's username
  const isFirstLikerSelf = firstLiker && currentUserId && firstLiker.id === currentUserId
  const showYou = userHasLiked && (likesCount === 1 || !firstLiker || isFirstLikerSelf)

  const highlightedUsername = firstLiker?.username

  return (
    <>
      <div
        className={cn(
          'text-xs text-[hsl(var(--muted-foreground))] flex items-center flex-wrap gap-1 leading-normal select-none',
          className
        )}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            setModalOpen(true)
          }}
          className="hover:text-[hsl(var(--foreground))] transition-colors"
        >
          Liked by
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
            others
          </button>
        )}

        {likesCount > 1 && (
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
              others
            </button>
          </>
        )}
      </div>

      {modalOpen && (
        <PostLikesModal
          postId={postId}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
