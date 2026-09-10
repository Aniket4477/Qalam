'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useMemo, useCallback } from 'react'
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
  Menu,
  X,
  LogOut,
  Settings,
  User,
  Shield,
  Trophy,
} from 'lucide-react'
import { cn, isUserAdmin } from '@/lib/utils'

interface NavbarProps {
  initialProfile?: Profile | null
  initialUnreadMessages?: number
  initialUnreadNotifications?: number
}

export default function Navbar({
  initialProfile,
  initialUnreadMessages = 0,
  initialUnreadNotifications = 0,
}: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [profile, setProfile] = useState<Profile | null>(initialProfile ?? null)
  const [imgError, setImgError] = useState(false)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(initialUnreadNotifications)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(initialUnreadMessages)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const supabase = useMemo(() => createClient(), [])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  // Sync initial props from server layout
  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile)
    }
  }, [initialProfile])

  useEffect(() => {
    setUnreadMessagesCount(initialUnreadMessages)
  }, [initialUnreadMessages])

  useEffect(() => {
    setUnreadNotificationsCount(initialUnreadNotifications)
  }, [initialUnreadNotifications])

  // Reset img error if avatar_url changes
  useEffect(() => {
    setImgError(false)
  }, [profile?.avatar_url])

  useEffect(() => {
    setMounted(true)
  }, [])

  const getProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setProfile(null)
      setUnreadNotificationsCount(0)
      setUnreadMessagesCount(0)
      return
    }

    const { data } = await sb
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (data) {
      setProfile(data as Profile)
    }

    // Unread notifications count
    const { count: notifCount } = await sb
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null)
    setUnreadNotificationsCount(notifCount ?? 0)

    // Unread incoming messages count
    const { count: msgCount } = await sb
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .neq('sender_id', user.id)
      .is('read_at', null)
    setUnreadMessagesCount(msgCount ?? 0)
  }, [supabase, sb])

  // Initial fetch and auth listener
  useEffect(() => {
    // Skip initial fetch if server layout already supplied profile
    if (!initialProfile) {
      getProfile()
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      getProfile()
    })

    const handleProfileUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<Partial<Profile>>
      if (customEvent.detail) {
        setProfile((prev) => (prev ? { ...prev, ...customEvent.detail } : null))
      }
      getProfile()
    }
    window.addEventListener('profile-updated', handleProfileUpdated)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('profile-updated', handleProfileUpdated)
    }
  }, [getProfile, supabase, initialProfile])

  // Re-fetch only when entering or leaving messages/notifications where unread counts change
  useEffect(() => {
    if (pathname.startsWith('/messages') || pathname.startsWith('/notifications')) {
      getProfile()
    }
  }, [pathname, getProfile])

  // Realtime subscription for live profile, messages, and notification updates
  useEffect(() => {
    if (!profile?.id) return

    const profileChannel = supabase
      .channel(`profile-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`,
        },
        (payload: any) => {
          if (payload.new) {
            setProfile(payload.new as Profile)
          }
        }
      )
      .subscribe()

    const messagesChannel = supabase
      .channel(`messages-user-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          getProfile()
        }
      )
      .subscribe()

    const notifChannel = supabase
      .channel(`notifs-user-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          getProfile()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(profileChannel)
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(notifChannel)
    }
  }, [profile?.id, getProfile, supabase])

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

  const initials = (profile?.display_name || profile?.username || 'U')
    .slice(0, 2)
    .toUpperCase()

  const isAdmin = isUserAdmin(profile)

  return (
    <header className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.9)] backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-baseline gap-1.5 shrink-0 group select-none"
          aria-label="Qalam Home"
        >
          <span
            className="font-serif text-2xl md:text-[26px] font-bold text-[hsl(var(--foreground))] tracking-tight leading-none group-hover:text-[hsl(var(--primary))] transition-colors"
            style={{ fontFamily: 'Lora, Georgia, serif' }}
          >
            Qalam
          </span>
          <span
            className="text-sm md:text-base font-bold text-[hsl(var(--primary))] tracking-wide font-hindi leading-none transition-transform group-hover:scale-105"
            style={{ fontFamily: "'Yatra One', 'Rozha One', 'Amita', cursive, serif" }}
          >
            क़लम
          </span>
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
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs animate-fade-in">
                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                  </span>
                )}
              </Link>

              {/* Messages with unread badge */}
              <Link
                href="/messages"
                className="relative p-2 rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                aria-label="Messages"
              >
                <MessageCircle size={18} />
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs animate-fade-in">
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </span>
                )}
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
                  className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[hsl(var(--primary)/0.3)] transition-all"
                  aria-label="User menu"
                >
                  {profile.avatar_url && !imgError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="w-8 h-8 rounded-full object-cover border border-[hsl(var(--border))]"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.2)] flex items-center justify-center text-xs font-semibold text-[hsl(var(--primary))]">
                      {initials}
                    </div>
                  )}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[hsl(var(--popover))] border border-[hsl(var(--border))] rounded-lg shadow-lg py-1 z-50 animate-fade-in">
                    <div className="flex items-center gap-2.5 px-3 py-2 border-b border-[hsl(var(--border))]">
                      {profile.avatar_url && !imgError ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.avatar_url}
                          alt={profile.display_name}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                          onError={() => setImgError(true)}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[hsl(var(--primary)/0.2)] flex items-center justify-center text-xs font-semibold text-[hsl(var(--primary))] shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{profile.display_name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {isAdmin && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                              <Shield size={10} className="fill-amber-500/20" /> Admin
                            </span>
                          )}
                          <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">@{profile.username}</p>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/u/${profile.username}`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[hsl(var(--accent))] transition-colors"
                    >
                      <User size={15} /> Profile
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/competitions/new"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-medium transition-colors"
                      >
                        <Trophy size={15} /> Host Competition
                      </Link>
                    )}
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
                href="/notifications"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-3 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] rounded-md"
              >
                <div className="flex items-center gap-2">
                  <Bell size={16} />
                  <span>Notifications</span>
                </div>
                {unreadNotificationsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
                    {unreadNotificationsCount}
                  </span>
                )}
              </Link>
              <Link
                href="/messages"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-3 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] rounded-md"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle size={16} />
                  <span>Messages</span>
                </div>
                {unreadMessagesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
                    {unreadMessagesCount}
                  </span>
                )}
              </Link>
              <Link
                href={`/u/${profile.username}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] rounded-md"
              >
                {profile.avatar_url && !imgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="w-5 h-5 rounded-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <User size={15} />
                )}
                <span>Profile</span>
              </Link>
              {isAdmin && (
                <Link
                  href="/competitions/new"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-md"
                >
                  <Trophy size={15} />
                  <span>Host Competition (Admin)</span>
                </Link>
              )}
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
