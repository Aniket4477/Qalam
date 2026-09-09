'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Send, Loader2, Image as ImageIcon, Video as VideoIcon } from 'lucide-react'
import type { ChatMediaData } from '@/lib/utils'

interface MediaUploadPreviewModalProps {
  file: File | null
  onSendMedia: (mediaData: ChatMediaData) => Promise<void>
  onClose: () => void
}

export default function MediaUploadPreviewModal({
  file,
  onSendMedia,
  onClose,
}: MediaUploadPreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isVideo = file?.type.startsWith('video/') ?? false

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  if (!file || !previewUrl) return null

  const handleUploadAndSend = async () => {
    if (!file || uploading) return
    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg')
      const filePath = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`

      // Attempt upload to chat_media first, fallback to covers or avatars if bucket not provisioned
      let uploadBucket = 'chat_media'
      let uploadResult = await supabase.storage.from(uploadBucket).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

      if (uploadResult.error) {
        // Fallback to covers bucket
        uploadBucket = 'covers'
        uploadResult = await supabase.storage.from(uploadBucket).upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })
      }

      if (uploadResult.error) {
        // Fallback to avatars bucket
        uploadBucket = 'avatars'
        uploadResult = await supabase.storage.from(uploadBucket).upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })
      }

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message || 'Failed to upload media')
      }

      const { data: urlData } = supabase.storage.from(uploadBucket).getPublicUrl(filePath)
      if (!urlData?.publicUrl) {
        throw new Error('Could not retrieve public URL for uploaded media')
      }

      await onSendMedia({
        type: isVideo ? 'video' : 'image',
        url: urlData.publicUrl,
        caption: caption.trim() || undefined,
        name: file.name,
        size: file.size,
      })

      onClose()
    } catch (err: unknown) {
      console.error('Error uploading media:', err)
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
              {isVideo ? <VideoIcon size={16} /> : <ImageIcon size={16} />}
            </div>
            <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
              Send {isVideo ? 'Video' : 'Photo'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Media Preview Container */}
        <div className="relative flex-1 bg-black/40 flex items-center justify-center min-h-[260px] max-h-[460px] overflow-hidden p-2">
          {isVideo ? (
            <video
              src={previewUrl}
              controls
              className="max-h-[420px] max-w-full rounded-xl object-contain shadow-lg"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Upload preview"
              className="max-h-[420px] max-w-full rounded-xl object-contain shadow-lg"
            />
          )}
        </div>

        {/* Caption & Controls */}
        <div className="p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] space-y-3">
          {error && (
            <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption... (optional)"
              disabled={uploading}
              className="flex-1 px-3.5 py-2.5 rounded-xl text-sm bg-[hsl(var(--input)/0.5)] border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] placeholder:text-[hsl(var(--muted-foreground))]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleUploadAndSend()
                }
              }}
            />
            <button
              type="button"
              onClick={handleUploadAndSend}
              disabled={uploading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 active:scale-95 transition-all shrink-0 disabled:opacity-50 shadow-md"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
