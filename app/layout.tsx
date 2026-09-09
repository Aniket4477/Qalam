import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from '@/components/ui/toaster'
import Navbar from '@/components/nav/Navbar'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/types'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Qalam — Poetry & Shayari',
    template: '%s | Qalam',
  },
  description:
    'A literary space to share poetry, shayari, ghazals, and short-form creative writing. Write. Read. Be moved.',
  keywords: ['poetry', 'shayari', 'ghazal', 'haiku', 'urdu poetry', 'hindi poetry', 'creative writing'],
  authors: [{ name: 'Qalam' }],
  openGraph: {
    type: 'website',
    siteName: 'Qalam',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let initialProfile: Profile | null = null
  let initialUnreadMessages = 0
  let initialUnreadNotifications = 0

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const [profRes, notifRes, msgRes] = await Promise.all([
        sb.from('profiles').select('*').eq('id', user.id).single(),
        sb.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).is('read_at', null),
        sb.from('messages').select('*', { count: 'exact', head: true }).neq('sender_id', user.id).is('read_at', null),
      ])
      if (profRes.data) initialProfile = profRes.data as Profile
      initialUnreadNotifications = notifRes.count ?? 0
      initialUnreadMessages = msgRes.count ?? 0
    }
  } catch {
    // Gracefully handle if cookies/session cannot be read
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar
              initialProfile={initialProfile}
              initialUnreadMessages={initialUnreadMessages}
              initialUnreadNotifications={initialUnreadNotifications}
            />
            <main className="flex-1">
              {children}
            </main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
