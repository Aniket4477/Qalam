'use client'

import { useEffect } from 'react'
import { X, Palette, Check } from 'lucide-react'
import { CHAT_THEMES, type ChatThemeId } from '@/lib/chatThemes'
import { cn } from '@/lib/utils'

interface ChatThemeModalProps {
  isOpen: boolean
  currentThemeId: ChatThemeId
  onSelectTheme: (themeId: ChatThemeId) => void
  onClose: () => void
}

export default function ChatThemeModal({
  isOpen,
  currentThemeId,
  onSelectTheme,
  onClose,
}: ChatThemeModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const themeList = Object.values(CHAT_THEMES)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
              <Palette size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
                Chat Theme
              </h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Personalize colors and mood for this chat
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] rounded-full hover:bg-[hsl(var(--accent))] transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Themes Grid */}
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {themeList.map((theme) => {
            const isSelected = currentThemeId === theme.id

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => onSelectTheme(theme.id)}
                className={cn(
                  'relative flex flex-col p-3 rounded-xl border text-left transition-all duration-200 group text-sm',
                  isSelected
                    ? 'border-2 shadow-md bg-[hsl(var(--accent)/0.3)]'
                    : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--foreground)/0.3)] hover:shadow-xs'
                )}
                style={{
                  borderColor: isSelected ? theme.accentColor : undefined,
                }}
              >
                {/* Theme Title & Tagline */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg leading-none shrink-0">{theme.icon}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-[hsl(var(--foreground))] truncate">
                        {theme.name}
                      </p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">
                        {theme.tagline}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: theme.accentColor }}
                    >
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Mini Live Preview Window */}
                <div
                  className="w-full h-18 rounded-lg p-2 flex flex-col justify-between overflow-hidden shadow-inner border border-white/5"
                  style={{
                    backgroundColor: theme.previewColors.bg,
                    ...theme.backgroundStyle,
                  }}
                >
                  {/* Mock incoming bubble */}
                  <div
                    className="self-start px-2 py-1 rounded-lg text-[9px] max-w-[80%] leading-tight text-white/90 shadow-2xs"
                    style={{ backgroundColor: theme.previewColors.otherBubble }}
                  >
                    Words that move…
                  </div>

                  {/* Mock outgoing bubble */}
                  <div
                    className="self-end px-2 py-1 rounded-lg text-[9px] max-w-[80%] leading-tight text-white shadow-2xs font-medium"
                    style={{ backgroundColor: theme.previewColors.ownBubble }}
                  >
                    Lines that linger.
                  </div>
                </div>

                {/* Description snippet */}
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-2 line-clamp-1">
                  {theme.description}
                </p>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[hsl(var(--border))] flex items-center justify-end bg-[hsl(var(--muted)/0.2)]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-medium rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
