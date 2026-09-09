'use client'

import { useState, useEffect, useRef } from 'react'
import {
  CHAT_STICKERS,
  STICKER_CATEGORIES,
  type StickerCategory,
  type ChatSticker,
} from '@/lib/chatStickers'
import { Sticker, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatStickersDrawerProps {
  isOpen: boolean
  onSelectSticker: (sticker: ChatSticker) => void
  onClose: () => void
}

export default function ChatStickersDrawer({
  isOpen,
  onSelectSticker,
  onClose,
}: ChatStickersDrawerProps) {
  const [activeCategory, setActiveCategory] = useState<StickerCategory>('poetry')
  const drawerRef = useRef<HTMLDivElement>(null)

  // Handle click outside and escape
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const filteredStickers = CHAT_STICKERS.filter((s) => s.category === activeCategory)

  return (
    <div
      ref={drawerRef}
      className="absolute bottom-14 right-2 sm:right-4 z-50 w-80 sm:w-96 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[380px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.25)]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] flex items-center justify-center">
            <Sticker size={14} />
          </div>
          <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
            Stickers & Reactions
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
          aria-label="Close stickers"
        >
          <X size={14} />
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[hsl(var(--border)/0.6)] overflow-x-auto scrollbar-none bg-[hsl(var(--muted)/0.1)]">
        {STICKER_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all select-none',
              activeCategory === cat.id
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-xs'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
            )}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Stickers Grid */}
      <div className="p-3 overflow-y-auto flex-1 grid grid-cols-2 gap-2.5">
        {filteredStickers.map((sticker) => (
          <button
            key={sticker.id}
            type="button"
            onClick={() => {
              onSelectSticker(sticker)
              onClose()
            }}
            className={cn(
              'group relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 text-center hover:scale-103 active:scale-97 hover:shadow-lg bg-gradient-to-b',
              sticker.bgGradient,
              sticker.borderColor
            )}
          >
            {/* Top Emoji Icon */}
            <span className="text-3xl mb-1.5 transform group-hover:scale-115 transition-transform duration-200 select-none">
              {sticker.emoji}
            </span>

            {/* Badge Title */}
            {sticker.badgeText && (
              <span
                className={cn(
                  'text-xs font-bold leading-tight select-none',
                  sticker.textColor
                )}
                style={{ fontFamily: 'Lora, Georgia, serif' }}
              >
                {sticker.badgeText}
              </span>
            )}

            {/* Subtext */}
            {sticker.badgeSubtext && (
              <span className="text-[10px] text-zinc-400 font-medium leading-tight mt-0.5 select-none">
                {sticker.badgeSubtext}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
