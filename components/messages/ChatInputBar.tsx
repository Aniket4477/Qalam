'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import {
  Smile,
  Image as ImageIcon,
  Sticker as StickerIcon,
  Send,
  Loader2,
  AtSign,
  Users,
} from 'lucide-react'
import EmojiPickerPopover from './EmojiPickerPopover'
import ChatStickersDrawer from './ChatStickersDrawer'
import MediaUploadPreviewModal from './MediaUploadPreviewModal'
import type { ChatSticker } from '@/lib/chatStickers'
import type { ChatMediaData } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface MentionSuggestion {
  id: string
  username: string
  displayName: string
  avatarUrl?: string | null
  badge?: string | null
  isSpecial?: boolean
}

interface ChatInputBarProps {
  placeholder?: string
  sending?: boolean
  onSendText: (text: string) => Promise<void>
  onSendMedia: (mediaData: ChatMediaData) => Promise<void>
  onSendSticker: (sticker: ChatSticker) => Promise<void>
  mentionSuggestions?: MentionSuggestion[]
}

export default function ChatInputBar({
  placeholder = 'Message...',
  sending = false,
  onSendText,
  onSendMedia,
  onSendSticker,
  mentionSuggestions = [],
}: ChatInputBarProps) {
  const [text, setText] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [stickersOpen, setStickersOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)

  // Mentions state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1)
  const [selectedMentionIdx, setSelectedMentionIdx] = useState<number>(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mentionListRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Filter mention suggestions based on current query
  const filteredMentions = useMemo(() => {
    if (mentionQuery === null || mentionSuggestions.length === 0) return []
    const q = mentionQuery.toLowerCase().trim()
    if (!q) return mentionSuggestions

    return mentionSuggestions.filter((item) => {
      if (item.isSpecial) {
        return 'everyone'.includes(q) || 'all'.includes(q)
      }
      const matchUsername = item.username.toLowerCase().includes(q)
      const matchDisplayName = item.displayName.toLowerCase().includes(q)
      return matchUsername || matchDisplayName
    })
  }, [mentionQuery, mentionSuggestions])

  // Reset selected mention index when list updates
  useEffect(() => {
    setSelectedMentionIdx(0)
  }, [filteredMentions.length])

  // Scroll active mention suggestion into view
  useEffect(() => {
    if (selectedMentionIdx >= 0 && itemRefs.current[selectedMentionIdx]) {
      itemRefs.current[selectedMentionIdx]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    }
  }, [selectedMentionIdx])

  const checkMentionTrigger = (currentText: string, cursorPos: number) => {
    if (!mentionSuggestions || mentionSuggestions.length === 0) {
      setMentionQuery(null)
      return
    }

    const textBeforeCursor = currentText.slice(0, cursorPos)
    // Matches '@' preceded by start of string or whitespace, followed by valid username characters
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_.-]*)$/)

    if (match) {
      const query = match[1] // string after '@'
      const matchStart = match.index ?? 0
      const atIndex = textBeforeCursor.startsWith('@', matchStart)
        ? matchStart
        : matchStart + 1

      setMentionQuery(query)
      setMentionStartIndex(atIndex)
      setSelectedMentionIdx(0)
    } else {
      setMentionQuery(null)
      setMentionStartIndex(-1)
    }
  }

  const handleSelectMention = (item: MentionSuggestion) => {
    const el = textareaRef.current
    const currentCursor = el?.selectionStart ?? text.length
    const start = mentionStartIndex >= 0 ? mentionStartIndex : currentCursor

    const before = text.slice(0, start)
    const after = text.slice(currentCursor)
    const insertText = `@${item.username} `
    const updated = before + insertText + after

    setText(updated)
    setMentionQuery(null)
    setMentionStartIndex(-1)

    setTimeout(() => {
      if (el) {
        el.focus()
        const newPos = before.length + insertText.length
        el.setSelectionRange(newPos, newPos)
      }
    }, 0)
  }

  const handleInsertAtSymbol = () => {
    const el = textareaRef.current
    if (!el) {
      const updated = text + '@'
      setText(updated)
      checkMentionTrigger(updated, updated.length)
      return
    }

    const start = el.selectionStart || 0
    const end = el.selectionEnd || 0
    const updated = text.slice(0, start) + '@' + text.slice(end)
    setText(updated)

    setTimeout(() => {
      el.focus()
      const newPos = start + 1
      el.setSelectionRange(newPos, newPos)
      checkMentionTrigger(updated, newPos)
    }, 0)
  }

  const handleSelectEmoji = (emoji: string) => {
    const el = textareaRef.current
    if (!el) {
      setText((prev) => prev + emoji)
      return
    }
    const start = el.selectionStart || 0
    const end = el.selectionEnd || 0
    const updated = text.slice(0, start) + emoji + text.slice(end)
    setText(updated)
    setTimeout(() => {
      el.focus()
      const newPos = start + emoji.length
      el.setSelectionRange(newPos, newPos)
    }, 0)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setText('')
    setMentionQuery(null)
    setMentionStartIndex(-1)
    await onSendText(trimmed)
    textareaRef.current?.focus()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setSelectedFile(file)
    setPreviewModalOpen(true)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/') || item.type.startsWith('video/')) {
        const file = item.getAsFile()
        if (file) {
          e.preventDefault()
          setSelectedFile(file)
          setPreviewModalOpen(true)
          return
        }
      }
    }
  }

  const hasContent = text.trim().length > 0
  const isMentionPopupVisible = mentionQuery !== null && filteredMentions.length > 0

  return (
    <div className="relative p-3 sm:px-4 sm:py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
      {/* Hidden File Input for photos and videos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Floating Mention Autocomplete Popover */}
      {isMentionPopupVisible && (
        <div
          ref={mentionListRef}
          className="absolute bottom-full left-3 right-3 sm:left-4 sm:right-auto sm:w-84 mb-2.5 max-h-64 overflow-y-auto bg-[hsl(var(--card)/0.97)] backdrop-blur-md border border-[hsl(var(--border))] rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 divide-y divide-[hsl(var(--border)/0.3)] scrollbar-thin"
        >
          {/* Header */}
          <div className="px-3.5 py-2 bg-[hsl(var(--muted)/0.4)] flex items-center justify-between text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10 border-b border-[hsl(var(--border)/0.4)]">
            <span className="flex items-center gap-1.5 text-[hsl(var(--primary))] font-bold">
              <AtSign size={13} />
              Mention Member
            </span>
            <span className="text-[10px] font-normal normal-case opacity-70">
              ↑↓ navigate • ↵ select
            </span>
          </div>

          {/* Members list */}
          <div className="p-1.5 space-y-0.5">
            {filteredMentions.map((item, idx) => {
              const isSelected = idx === selectedMentionIdx
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[idx] = el
                  }}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSelectMention(item)
                  }}
                  onMouseEnter={() => setSelectedMentionIdx(idx)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--foreground))] ring-1 ring-[hsl(var(--primary)/0.3)]'
                      : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/0.6)]'
                  )}
                >
                  {item.isSpecial ? (
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30 font-bold">
                      <Users size={15} />
                    </div>
                  ) : item.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.avatarUrl}
                      alt={item.displayName}
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-[hsl(var(--border))]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] flex items-center justify-center text-xs font-bold shrink-0 border border-[hsl(var(--border))]">
                      {item.displayName.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold truncate leading-tight">
                        {item.displayName}
                      </span>
                      {item.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] leading-none shrink-0 uppercase">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[hsl(var(--muted-foreground))] font-mono leading-tight truncate block">
                      @{item.username}
                    </span>
                  </div>

                  {isSelected && (
                    <span className="text-[10px] text-[hsl(var(--primary))] font-mono opacity-75 shrink-0 hidden sm:inline">
                      ↵ select
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Emoji Popover */}
      <EmojiPickerPopover
        isOpen={emojiOpen}
        onSelectEmoji={handleSelectEmoji}
        onClose={() => setEmojiOpen(false)}
      />

      {/* Stickers Drawer */}
      <ChatStickersDrawer
        isOpen={stickersOpen}
        onSelectSticker={onSendSticker}
        onClose={() => setStickersOpen(false)}
      />

      {/* Media Upload & Caption Preview Modal */}
      {previewModalOpen && selectedFile && (
        <MediaUploadPreviewModal
          file={selectedFile}
          onSendMedia={onSendMedia}
          onClose={() => {
            setPreviewModalOpen(false)
            setSelectedFile(null)
          }}
        />
      )}

      {/* Main Pill Input Container */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-4xl mx-auto">
        <div className="flex-1 flex items-center min-h-[44px] px-3.5 py-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.75)] hover:border-[hsl(var(--primary)/0.4)] focus-within:border-[hsl(var(--primary))] focus-within:ring-2 focus-within:ring-[hsl(var(--primary)/0.2)] transition-all shadow-xs backdrop-blur-xs">
          {/* Smiley / Emoji Button on Left */}
          <button
            type="button"
            onClick={() => {
              setEmojiOpen(!emojiOpen)
              setStickersOpen(false)
            }}
            className={cn(
              'p-1.5 -ml-1 rounded-full transition-colors shrink-0',
              emojiOpen
                ? 'text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
            )}
            title="Choose emoji"
            aria-label="Choose emoji"
          >
            <Smile size={19} />
          </button>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              checkMentionTrigger(e.target.value, e.target.selectionStart)
            }}
            onClick={(e) => {
              checkMentionTrigger(text, e.currentTarget.selectionStart)
            }}
            onKeyUp={(e) => {
              if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                checkMentionTrigger(text, e.currentTarget.selectionStart)
              }
            }}
            onPaste={handlePaste}
            placeholder={placeholder}
            rows={1}
            disabled={sending}
            className="flex-1 px-2.5 py-1 text-sm bg-transparent border-0 resize-none focus:outline-none focus:ring-0 placeholder:text-[hsl(var(--muted-foreground))] leading-normal max-h-28 overflow-y-auto"
            style={{ minHeight: '24px' }}
            onKeyDown={(e) => {
              // Handle mention keyboard navigation
              if (isMentionPopupVisible) {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setSelectedMentionIdx((prev) => (prev + 1) % filteredMentions.length)
                  return
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setSelectedMentionIdx(
                    (prev) => (prev - 1 + filteredMentions.length) % filteredMentions.length
                  )
                  return
                }
                if (e.key === 'Enter' || e.key === 'Tab') {
                  e.preventDefault()
                  if (filteredMentions[selectedMentionIdx]) {
                    handleSelectMention(filteredMentions[selectedMentionIdx])
                  }
                  return
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  setMentionQuery(null)
                  return
                }
              }

              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />

          {/* Action Buttons on Right Inside Pill */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {/* Quick Mention Button (@) */}
            {mentionSuggestions.length > 0 && (
              <button
                type="button"
                onClick={handleInsertAtSymbol}
                className={cn(
                  'p-1.5 rounded-full transition-colors',
                  isMentionPopupVisible
                    ? 'text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)]'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
                )}
                title="Mention group member (@)"
                aria-label="Mention group member"
              >
                <AtSign size={18} />
              </button>
            )}

            {/* Gallery / Photos & Videos Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-full text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              title="Send photo or video"
              aria-label="Send photo or video"
            >
              <ImageIcon size={19} />
            </button>

            {/* Sticker Button */}
            <button
              type="button"
              onClick={() => {
                setStickersOpen(!stickersOpen)
                setEmojiOpen(false)
              }}
              className={cn(
                'p-1.5 rounded-full transition-colors',
                stickersOpen
                  ? 'text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
              )}
              title="Send sticker or poetry badge"
              aria-label="Send sticker"
            >
              <StickerIcon size={19} />
            </button>
          </div>
        </div>

        {/* Dynamic Send Button */}
        {hasContent && (
          <button
            type="submit"
            disabled={sending}
            className="w-10 h-10 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-md shrink-0 animate-scale-in cursor-pointer"
            title="Send message"
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} className="ml-0.5" />
            )}
          </button>
        )}
      </form>
    </div>
  )
}
