import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Bell, Heart, MessageCircle, Trophy, Mail } from 'lucide-react'
import type { Metadata } from 'next'
import MarkNotificationsRead from '@/components/notifications/MarkNotificationsRead'
import type { Notification } from '@/lib/supabase/types'

export const metadata: Metadata = {
  title: 'Notifications',
}

function NotificationIcon({ type }: { type: Notification['type'] }) {
  switch (type) {
    case 'like': return <Heart size={16} className="text-red-400" />
    case 'comment': return <MessageCircle size={16} className="text-blue-400" />
    case 'message': return <Mail size={16} className="text-green-400" />
    case 'competition_ended': return <Trophy size={16} className="text-yellow-400" />
    default: return <Bell size={16} />
  }
}

function NotificationMessage({ notification }: { notification: Notification }) {
  const payload = notification.payload as Record<string, string>
  switch (notification.type) {
    case 'like':
      return (
        <p className="text-sm">
          Someone liked your{' '}
          <Link href={`/post/${payload.post_id}`} className="font-medium hover:text-[hsl(var(--primary))] transition-colors">poem</Link>
        </p>
      )
    case 'comment':
      return (
        <p className="text-sm">
          Someone commented on your{' '}
          <Link href={`/post/${payload.post_id}`} className="font-medium hover:text-[hsl(var(--primary))] transition-colors">poem</Link>
        </p>
      )
    case 'message':
      return (
        <p className="text-sm">
          You have a new{' '}
          <Link href="/messages" className="font-medium hover:text-[hsl(var(--primary))] transition-colors">message</Link>
        </p>
      )
    case 'competition_ended':
      return (
        <p className="text-sm">
          A competition you entered has{' '}
          <Link href="/competitions" className="font-medium hover:text-[hsl(var(--primary))] transition-colors">ended</Link>
        </p>
      )
    default:
      return <p className="text-sm">New notification</p>
  }
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/notifications')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { data: notifData } = await sb
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const notifications = (notifData ?? []) as Notification[]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Lora, Georgia, serif' }}>
          Notifications
        </h1>
        {notifications.some((n) => !n.read_at) && (
          <MarkNotificationsRead userId={user.id} />
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={36} className="mx-auto text-[hsl(var(--muted-foreground))] mb-3 opacity-30" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                !notification.read_at
                  ? 'border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.04)]'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                <NotificationIcon type={notification.type} />
              </div>
              <div className="flex-1 min-w-0">
                <NotificationMessage notification={notification} />
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                  {formatDate(notification.created_at)}
                </p>
              </div>
              {!notification.read_at && (
                <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] mt-1.5 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
