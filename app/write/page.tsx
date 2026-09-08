import { Suspense } from 'react'
import PostEditor from '@/components/posts/PostEditor'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Write',
  description: 'Write and share your poetry on Qalam',
}

export default function WritePage() {
  return (
    <Suspense>
      <PostEditor />
    </Suspense>
  )
}
