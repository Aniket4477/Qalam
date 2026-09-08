'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'
import {
  Moon,
  Sun,
  PenLine,
  Search,
  Bell,
  MessageCircle,
  Trophy,
  Menu,
  X,
  LogOut,
  Settings,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const getProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await sb
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) setProfile(data as Profile)

      // unread notifications
      const { count } = await sb
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null)
      setUnreadCount(count ?? 0)
    }
    getProfile()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      getProfile()
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setUserMenuOpen(false)
    router.push('/login')
    router.refresh()
  }

  const navLinks = [
    { href: '/', label: 'Feed' },
    { href: '/explore', label: 'Explore' },
    { href: '/competitions', label: 'Competitions' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.9)] backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="font-serif text-xl font-semibold text-[hsl(var(--primary))] shrink-0"
          style={{ fontFamily: 'Lora, Georgia, serif' }}
        >
          قلم <span className="text-[hsl(var(--foreground))]">Qalam</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'nav-item',
                pathname === link.href && 'text-[hsl(var(--foreground))]'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <Link
            href="/explore"
            className="hidden sm:flex p-2 rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
            aria-label="Search"
          >
            <Search size={18} />
          </Link>

          {/* Dark mode toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}

          {profile ? (
            <>
              {/* Notifications */}
              <Link
                href="/notifications"
                className="relative p-2 rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[hsl(var(--primary))] rounded-full" />
                )}
              </Link>

              {/* Messages */}
              <Link
                href="/messages"
                className="p-2 rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                aria-label="Messages"
              >
                <MessageCircle size={18} />
              </Link>

              {/* Write */}
              <Link
                href="/write"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <PenLine size={15} />
                Write
              </Link>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-md hover:bg-[hsl(var(--accent))] transition-colors"
                  aria-label="User menu"
                >
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.2)] flex items-center justify-center text-xs font-semibold text-[hsl(var(--primary))]">
                      {profile.display_name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[hsl(var(--popover))] border border-[hsl(var(--border))] rounded-lg shadow-lg py-1 z-50 animate-fade-in">
                    <div className="px-3 py-2 border-b border-[hsl(var(--border))]">
                      <p className="font-medium text-sm truncate">{profile.display_name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">@{profile.username}</p>
                    </div>
                    <Link
                      href={`/u/${profile.username}`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[hsl(var(--accent))] transition-colors"
                    >
                      <User size={15} /> Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[hsl(var(--accent))] transition-colors"
                    >
                      <Settings size={15} /> Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--destructive))] hover:bg-[hsl(var(--accent))] transition-colors"
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-3 py-1.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Join
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 flex flex-col gap-1 animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              {link.label}
            </Link>
          ))}
          {profile ? (
            <>
              <Link
                href="/write"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[hsl(var(--primary))]"
              >
                <PenLine size={15} /> Write
              </Link>
              <Link
                href={`/u/${profile.username}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] rounded-md"
              >
                <User size={15} /> Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] rounded-md"
              >
                <Settings size={15} /> Settings
              </Link>
              <button
                onClick={() => {
                  setMobileOpen(false)
                  handleSignOut()
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[hsl(var(--destructive))] hover:bg-[hsl(var(--accent))] rounded-md text-left w-full"
              >
                <LogOut size={15} /> Sign out
              </button>
            </>
          ) : (
            <div className="pt-2 mt-1 border-t border-[hsl(var(--border))] flex flex-col gap-1">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
              >
                Join
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Backdrop for user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </header>
  )
}
