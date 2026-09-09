'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface HomeFeedTabsProps {
  activeTab: string
}

export default function HomeFeedTabs({ activeTab }: HomeFeedTabsProps) {
  const tabs = [
    { id: 'latest', label: 'Latest' },
    { id: 'following', label: 'Following' },
    { id: 'trending', label: 'Trending 🔥' },
  ]

  return (
    <div className="flex gap-1 border-b border-[hsl(var(--border))]">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.id === 'latest' ? '/' : `/?tab=${tab.id}`}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === tab.id
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
