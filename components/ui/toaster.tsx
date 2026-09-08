// Minimal Toaster component — wraps toast notification display
// This is a simplified version; for production, use sonner or react-hot-toast
'use client'

import { useEffect, useState } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

// Simple global toast store
const listeners: ((toast: Toast) => void)[] = []

export function toast(message: string, type: Toast['type'] = 'info') {
  const t: Toast = { id: Date.now().toString(), message, type }
  listeners.forEach((l) => l(t))
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (t: Toast) => {
      setToasts((prev) => [...prev, t])
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id))
      }, 3500)
    }
    listeners.push(listener)
    return () => {
      const idx = listeners.indexOf(listener)
      if (idx !== -1) listeners.splice(idx, 1)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-slide-in ${
            t.type === 'error'
              ? 'bg-red-500 text-white'
              : t.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))]'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
