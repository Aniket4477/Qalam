'use client'

import { useState, useRef } from 'react'
import {
  Smile,
  Image as ImageIcon,
  Sticker as StickerIcon,
  Send,
  Loader2,
  Mic,
} from 'lucide-react'
import EmojiPickerPopover from './EmojiPickerPopover'
import ChatStickersDrawer from './ChatStickersDrawer'
import MediaUploadPreviewModal from './MediaUploadPreviewModal'
import type { ChatSticker } from '@/lib/chatStickers'
import type { ChatMediaData } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ChatInputBarProps {
  placeholder?: string
  sending?: boolean
  onSendText: (text: string) => Promise<void>
  onSendMedia: (mediaData: ChatMediaData) => Promise<void>
  onSendSticker: (sticker: ChatSticker) => Promise<void>
}

export default function ChatInputBar({
  placeholder = 'Message...',
  sending = false,
  onSendText,
  onSendMedia,
  onSendSticker,
}: ChatInputBarProps) {
  const [text, setText] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [stickersOpen, setStickersOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    await onSendText(trimmed)
    textareaRef.current?.focus()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset file input value so selecting the same file again triggers onChange
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
            onChange={(e) => setText(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder}
            rows={1}
            disabled={sending}
            className="flex-1 px-2.5 py-1 text-sm bg-transparent border-0 resize-none focus:outline-none focus:ring-0 placeholder:text-[hsl(var(--muted-foreground))] leading-normal max-h-28 overflow-y-auto"
            style={{ minHeight: '24px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />

          {/* Action Buttons on Right Inside Pill */}
          <div className="flex items-center gap-1 shrink-0">
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
            className="w-10 h-10 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-md shrink-0 animate-scale-in"
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
