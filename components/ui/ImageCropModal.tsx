'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw, RotateCcw, Check, Move } from 'lucide-react'

export interface ImageCropModalProps {
  isOpen: boolean
  imageSrc: string | null
  title?: string
  aspectRatio?: 'square' | 'cover'
  shape?: 'round' | 'rect'
  onClose: () => void
  onCropComplete: (croppedFile: File, previewUrl: string) => void
}

export default function ImageCropModal({
  isOpen,
  imageSrc,
  title = 'Adjust Photo',
  aspectRatio = 'square',
  shape = 'round',
  onClose,
  onCropComplete,
}: ImageCropModalProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })

  const imgRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Crop box dimensions in pixels
  // square (avatar): 280 x 280
  // cover (banner): 480 x 160 (3:1 ratio)
  const cropBox = aspectRatio === 'square'
    ? { width: 280, height: 280 }
    : { width: 480, height: 160 }

  // Reset adjustments when imageSrc changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setRotation(0)
      setPan({ x: 0, y: 0 })
      setImageLoaded(false)
    }
  }, [isOpen, imageSrc])

  // Prevent scrolling background when modal is open
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

  // Handle image load to get intrinsic dimensions
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
    setImageLoaded(true)
  }

  // Calculate base scale so image always covers the crop box
  const getBaseScale = useCallback(() => {
    if (!naturalSize.width || !naturalSize.height) return 1
    const isRotated90 = rotation === 90 || rotation === 270
    const effW = isRotated90 ? naturalSize.height : naturalSize.width
    const effH = isRotated90 ? naturalSize.width : naturalSize.height
    return Math.max(cropBox.width / effW, cropBox.height / effH)
  }, [naturalSize, rotation, cropBox])

  // Clamp pan so image never exposes empty borders
  const clampPan = useCallback(
    (newX: number, newY: number, currentZoom = zoom, currentRotation = rotation) => {
      if (!naturalSize.width || !naturalSize.height) return { x: 0, y: 0 }

      const isRotated90 = currentRotation === 90 || currentRotation === 270
      const effW = isRotated90 ? naturalSize.height : naturalSize.width
      const effH = isRotated90 ? naturalSize.width : naturalSize.height

      const baseScale = Math.max(cropBox.width / effW, cropBox.height / effH)
      const renderW = effW * baseScale * currentZoom
      const renderH = effH * baseScale * currentZoom

      const maxX = Math.max(0, (renderW - cropBox.width) / 2)
      const maxY = Math.max(0, (renderH - cropBox.height) / 2)

      return {
        x: Math.min(maxX, Math.max(-maxX, newX)),
        y: Math.min(maxY, Math.max(-maxY, newY)),
      }
    },
    [naturalSize, zoom, rotation, cropBox]
  )

  // Mouse / Touch Dragging Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const rawX = e.clientX - dragStart.x
    const rawY = e.clientY - dragStart.y
    const clamped = clampPan(rawX, rawY)
    setPan(clamped)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      setIsDragging(true)
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return
    const touch = e.touches[0]
    const rawX = touch.clientX - dragStart.x
    const rawY = touch.clientY - dragStart.y
    const clamped = clampPan(rawX, rawY)
    setPan(clamped)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY * -0.0015
    const newZoom = Math.min(3, Math.max(1, zoom + delta))
    setZoom(newZoom)
    setPan((prev) => clampPan(prev.x, prev.y, newZoom, rotation))
  }

  const handleZoomSlider = (newZoom: number) => {
    setZoom(newZoom)
    setPan((prev) => clampPan(prev.x, prev.y, newZoom, rotation))
  }

  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360
    setRotation(nextRot)
    setPan((prev) => clampPan(prev.x, prev.y, zoom, nextRot))
  }

  const handleReset = () => {
    setZoom(1)
    setRotation(0)
    setPan({ x: 0, y: 0 })
  }

  // Generate cropped image using Canvas
  const handleApply = () => {
    if (!imgRef.current || !naturalSize.width || !naturalSize.height) return

    const canvas = document.createElement('canvas')
    const outWidth = aspectRatio === 'square' ? 600 : 1200
    const outHeight = aspectRatio === 'square' ? 600 : 400
    canvas.width = outWidth
    canvas.height = outHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Fill background with black/transparent
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, outWidth, outHeight)

    const k = outWidth / cropBox.width
    const baseScale = getBaseScale()

    // Transform canvas to match the user's viewport pan/rotate/zoom
    ctx.save()
    ctx.translate(outWidth / 2 + pan.x * k, outHeight / 2 + pan.y * k)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(k * baseScale * zoom, k * baseScale * zoom)
    ctx.drawImage(
      imgRef.current,
      -naturalSize.width / 2,
      -naturalSize.height / 2,
      naturalSize.width,
      naturalSize.height
    )
    ctx.restore()

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const fileName = aspectRatio === 'square' ? 'avatar_cropped.jpg' : 'cover_cropped.jpg'
        const file = new File([blob], fileName, { type: 'image/jpeg' })
        const previewUrl = URL.createObjectURL(blob)
        onCropComplete(file, previewUrl)
        onClose()
      },
      'image/jpeg',
      0.92
    )
  }

  if (!isOpen || !imageSrc) return null

  const baseScale = getBaseScale()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <Move size={17} className="text-[hsl(var(--primary))]" />
            <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
              {title}
            </h2>
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

        {/* Viewport Area */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full h-[320px] bg-neutral-950 flex items-center justify-center overflow-hidden select-none cursor-grab active:cursor-grabbing"
        >
          {/* Hidden natural image for reference */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Source"
            onLoad={handleImageLoad}
            className="hidden"
            crossOrigin="anonymous"
          />

          {/* Draggable/Scalable/Rotated Canvas/Image in Viewport */}
          {imageLoaded && (
            <div
              style={{
                width: cropBox.width,
                height: cropBox.height,
                position: 'absolute',
                pointerEvents: 'none',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: naturalSize.width,
                  height: naturalSize.height,
                  maxWidth: 'none',
                  transformOrigin: 'center center',
                  transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${baseScale * zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.08s ease-out',
                }}
              />
            </div>
          )}

          {/* Dark Overlay Mask with Cut-Out */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* The Cut-Out Window */}
            <div
              style={{
                width: cropBox.width,
                height: cropBox.height,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.72)',
              }}
              className={`relative pointer-events-none ${
                shape === 'round' ? 'rounded-full' : 'rounded-lg'
              } border-2 border-white/85`}
            >
              {/* Rule of thirds grid lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-25">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-white" />
                <div className="border-r border-white" />
                <div />
              </div>
            </div>
          </div>

          {/* Subtle drag prompt on bottom */}
          <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none">
            <span className="text-[11px] font-medium text-white/70 bg-black/50 px-2.5 py-0.5 rounded-full backdrop-blur-sm shadow">
              Drag to reposition · Scroll or slider to zoom
            </span>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="p-4 space-y-3.5 bg-[hsl(var(--card))] border-t border-[hsl(var(--border))]">
          {/* Zoom controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleZoomSlider(Math.max(1, zoom - 0.2))}
              className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              title="Zoom out"
            >
              <ZoomOut size={16} />
            </button>

            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => handleZoomSlider(parseFloat(e.target.value))}
              className="flex-1 accent-[hsl(var(--primary))] cursor-pointer h-1.5 rounded-lg bg-[hsl(var(--muted))]"
            />

            <button
              type="button"
              onClick={() => handleZoomSlider(Math.min(3, zoom + 0.2))}
              className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              title="Zoom in"
            >
              <ZoomIn size={16} />
            </button>

            <span className="text-xs font-mono text-[hsl(var(--muted-foreground))] w-11 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Extra tool buttons (Rotate, Reset) */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                <RotateCw size={13} />
                <span>Rotate</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity shadow-sm"
              >
                <Check size={14} />
                <span>Apply</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
