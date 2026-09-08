import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date for display — relative for recent dates, absolute otherwise
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Truncate a post body to a preview snippet (preserving partial lines)
 */
export function truncateBody(body: string, maxChars = 150): string {
  if (body.length <= maxChars) return body
  const truncated = body.slice(0, maxChars)
  const lastNewline = truncated.lastIndexOf('\n')
  if (lastNewline > maxChars * 0.6) {
    return truncated.slice(0, lastNewline) + '…'
  }
  return truncated + '…'
}

/**
 * Generate the first two lines of a post for OG descriptions
 */
export function getPreviewLines(body: string, maxLines = 2): string {
  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  return lines.slice(0, maxLines).join(' / ')
}

/**
 * Get initials for avatar fallback
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Post type display labels
 */
export const POST_TYPE_LABELS: Record<string, string> = {
  poem: 'Poem',
  shayari: 'Shayari',
  ghazal: 'Ghazal',
  haiku: 'Haiku',
  free_verse: 'Free Verse',
  other: 'Other',
}

/**
 * Language options
 */
export const LANGUAGE_OPTIONS = [
  'English',
  'Hindi',
  'Urdu',
  'Bengali',
  'Punjabi',
  'Marathi',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Gujarati',
  'Odia',
  'Other',
]

/**
 * RTL languages that need special text-direction handling
 */
export const RTL_LANGUAGES = new Set(['Urdu', 'Arabic', 'Persian'])

export function isRTL(language: string): boolean {
  return RTL_LANGUAGES.has(language)
}
