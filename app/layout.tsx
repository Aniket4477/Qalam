import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from '@/components/ui/toaster'
import Navbar from '@/components/nav/Navbar'

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
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
