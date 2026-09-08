import { Suspense } from 'react'
import AuthForm from '@/components/auth/AuthForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Join Qalam',
  description: 'Create your Qalam account and start sharing poetry',
}

export default function SignupPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12">
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </div>
  )
}
