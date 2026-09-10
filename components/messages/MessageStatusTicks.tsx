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
 * - 'read': Double highlighted cyan-blue tick (✓✓) with authentic WhatsApp geometry
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
        className={cn('inline-flex items-center shrink-0 select-none text-current opacity-70', className)}
      >
        <svg
          viewBox="0 0 13 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3 h-2.5"
        >
          <path d="M1.5 6L5 9.5L12 2.5" />
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
          ? 'text-[#53bdeb] drop-shadow-[0_0_1.5px_rgba(83,189,235,0.5)]'
          : 'text-current opacity-70',
        className
      )}
    >
      <svg
        viewBox="0 0 18 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-2.5"
      >
        {/* First tick (left) */}
        <path d="M1.5 6L5 9.5L12 2.5" />
        {/* Second tick (right, parallel and cleanly spaced) */}
        <path d="M6 6L9.5 9.5L16.5 2.5" />
      </svg>
    </span>
  )
}
