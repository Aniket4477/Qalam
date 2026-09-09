'use client'

import { useEffect } from 'react'
import { X, Download } from 'lucide-react'
import type { ChatMediaData } from '@/lib/utils'

interface MediaLightboxModalProps {
  media: ChatMediaData | null
  onClose: () => void
}

export default function MediaLightboxModal({
  media,
  onClose,
}: MediaLightboxModalProps) {
  useEffect(() => {
    if (!media) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [media, onClose])

  if (!media) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      {/* Top Controls */}
      <div
        className="absolute top-4 right-4 flex items-center gap-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={media.url}
          target="_blank"
          rel="noopener noreferrer"
          download={media.name || 'qalam_media'}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-md"
          title="Download original"
          aria-label="Download original"
        >
          <Download size={18} />
        </a>
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-md"
          aria-label="Close viewer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div
        className="relative max-w-5xl max-h-[85vh] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {media.type === 'video' ? (
          <video
            src={media.url}
            controls
            autoPlay
            className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media.url}
            alt={media.caption || 'Chat photo'}
            className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl"
          />
        )}

        {media.caption && (
          <div className="mt-3 px-4 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-sm max-w-md text-center backdrop-blur-md">
            {media.caption}
          </div>
        )}
      </div>
    </div>
  )
}
