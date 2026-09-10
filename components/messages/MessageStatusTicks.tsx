'use client'

import { cn } from '@/lib/utils'

export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read'

interface MessageStatusTicksProps {
  status: MessageDeliveryStatus
  className?: string
}

/**
 * WhatsApp-style message delivery and read receipt status ticks:
 * - 'sending' / 'sent': Single subtle tick (✓)
 * - 'delivered': Double subtle tick (✓✓)
 * - 'read': Double highlighted cyan-blue tick (✓✓)
 */
export default function MessageStatusTicks({
  status,
  className,
}: MessageStatusTicksProps) {
  if (status === 'sent' || status === 'sending') {
    return (
      <span
        title={status === 'sending' ? 'Sending…' : 'Sent'}
        aria-label={status === 'sending' ? 'Sending' : 'Sent'}
        className={cn('inline-flex items-center shrink-0 select-none text-current opacity-75', className)}
      >
        <svg
          viewBox="0 0 12 11"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3 h-2.5"
        >
          <path d="M1.5 5.5L4.5 8.5L10.5 2.5" />
        </svg>
      </span>
    )
  }

  const isRead = status === 'read'

  return (
    <span
      title={isRead ? 'Seen' : 'Delivered'}
      aria-label={isRead ? 'Seen' : 'Delivered'}
      className={cn(
        'inline-flex items-center shrink-0 select-none transition-colors duration-200',
        isRead
          ? 'text-[#53bdeb] drop-shadow-[0_0_2px_rgba(83,189,235,0.4)]'
          : 'text-current opacity-75',
        className
      )}
    >
      <svg
        viewBox="0 0 16 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-2.5"
      >
        <path d="M1 5.5L4 8.5L10.5 2" />
        <path d="M5.5 8.5L14.5 2" />
      </svg>
    </span>
  )
}
