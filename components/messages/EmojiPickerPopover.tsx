'use client'

import { useState, useEffect, useRef } from 'react'
import { Smile, Heart, Sparkles, Flower2, PenTool, ThumbsUp } from 'lucide-react'

interface EmojiPickerPopoverProps {
  isOpen: boolean
  onSelectEmoji: (emoji: string) => void
  onClose: () => void
}

interface EmojiCategory {
  id: string
  name: string
  icon: React.ReactNode
  emojis: string[]
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    name: 'Smileys',
    icon: <Smile size={15} />,
    emojis: [
      '😊', '🥰', '😌', '🥺', '🥹', '😍', '😘', '🤗',
      '😇', ' poetic ', '✨', '🤍', '🤎', '🖤', '💔', '❤️',
      '😄', '😁', '😂', '🤣', '😉', '😋', '😎', '🤩',
      '😏', '😔', '😢', '😭', '😤', '😳', '🤯', '🤫',
    ],
  },
  {
    id: 'poetry',
    name: 'Literature',
    icon: <PenTool size={15} />,
    emojis: [
      '✒️', '🖋️', '📖', '📜', '📝', '🕯️', '☕', '🎻',
      '🎭', '🎨', '🪶', '🥀', '🌹', '🕊️', '💌', '💭',
      '🍂', '🍁', '🌙', '⭐', '🌌', '🌧️', '⛈️', '🌊',
    ],
  },
  {
    id: 'hearts',
    name: 'Hearts',
    icon: <Heart size={15} />,
    emojis: [
      '❤️', '💖', '💗', '💓', '💞', '💕', '💘', '💝',
      '❤️‍🔥', '❤️‍🩹', '🧡', '💛', '💚', '💙', '💜', '🖤',
      '🤍', '🤎', '🫶', '💑', '👩‍❤️‍👨', '👩‍❤️‍👩', '👨‍❤️‍👨', '💋',
    ],
  },
  {
    id: 'nature',
    name: 'Nature',
    icon: <Flower2 size={15} />,
    emojis: [
      '🌸', '🌺', '🌷', '🪷', '🌹', '🌻', '🌼', '💐',
      '🍃', '🌿', '🌱', '🌾', '🍀', '🍁', '🍂', '🍄',
      '🌙', '🌛', '🌕', '🌟', '✨', '⚡', '⛅', '🌈',
    ],
  },
  {
    id: 'reactions',
    name: 'Gestures',
    icon: <ThumbsUp size={15} />,
    emojis: [
      '👏', '🙌', '🙏', '🤝', '👍', '👌', '✌️', '🤞',
      '🫰', '🤌', '👋', '🫡', '🎉', '🎊', '🔥', '💯',
    ],
  },
]

export default function EmojiPickerPopover({
  isOpen,
  onSelectEmoji,
  onClose,
}: EmojiPickerPopoverProps) {
  const [activeCat, setActiveCat] = useState('smileys')
  const popoverRef = useRef<HTMLDivElement>(null)

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
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

  const currentCategory = EMOJI_CATEGORIES.find((c) => c.id === activeCat) || EMOJI_CATEGORIES[0]

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-14 left-2 sm:left-4 z-50 w-72 sm:w-80 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
    >
      {/* Category Navigation */}
      <div className="flex items-center justify-between px-2 pt-2 pb-1 border-b border-[hsl(var(--border)/0.6)] bg-[hsl(var(--muted)/0.3)]">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none w-full">
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCat(cat.id)}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                activeCat === cat.id
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-xs'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
              }`}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Emoji Grid */}
      <div className="p-2.5 max-h-56 overflow-y-auto">
        <p className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] px-1 mb-1.5">
          {currentCategory.name}
        </p>
        <div className="grid grid-cols-8 gap-1">
          {currentCategory.emojis.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              type="button"
              onClick={() => onSelectEmoji(emoji.trim())}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-[hsl(var(--accent))] hover:scale-120 transition-all select-none"
            >
              {emoji.trim()}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
