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

/**
 * Format timestamp divider in chat stream (e.g., "Wed 10:40 PM", "Sun 8:00 AM")
 */
export function formatChatDividerTime(dateString: string): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''

  const now = new Date()
  const timeStr = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const diffMs = now.getTime() - date.getTime()
  const daysDiff = diffMs / (1000 * 60 * 60 * 24)

  if (daysDiff < 7) {
    const weekday = date.toLocaleDateString([], { weekday: 'short' })
    return `${weekday} ${timeStr}` // e.g. "Wed 10:40 PM", "Sun 8:00 AM"
  }

  const monthDay = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  const yearStr = date.getFullYear() !== now.getFullYear() ? ` ${date.getFullYear()}` : ''
  return `${monthDay}${yearStr}, ${timeStr}`
}

/**
 * Check if a timestamp divider should be displayed between two consecutive messages
 */
export function shouldShowChatDivider(currentDateStr: string, prevDateStr?: string): boolean {
  if (!prevDateStr) return true
  const curr = new Date(currentDateStr).getTime()
  const prev = new Date(prevDateStr).getTime()
  if (isNaN(curr) || isNaN(prev)) return false
  // Difference greater than 20 minutes (20 * 60 * 1000 = 1,200,000ms)
  return Math.abs(curr - prev) > 20 * 60 * 1000
}

/**
 * Format message bubble timestamp (e.g., "10:42 PM")
 */
export function formatBubbleTime(dateString: string): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format group system notifications (admin changes, photo/name updates, member join/leave)
 */
export function formatGroupSystemMessage(
  body: string,
  senderId: string,
  currentUserId: string,
  senderProfile?: { display_name?: string | null; username?: string | null } | null
): { isSystem: boolean; text: string } {
  const isSenderSelf = senderId === currentUserId
  const senderName = isSenderSelf
    ? 'You'
    : senderProfile?.display_name || (senderProfile?.username ? `@${senderProfile.username}` : 'A member')

  // 1. Structured system messages: [system]:<action>|<args>
  if (body.startsWith('[system]:')) {
    const content = body.slice(9)
    const [action, ...args] = content.split('|')

    switch (action) {
      case 'create': {
        const groupName = args[0] || 'the group'
        return {
          isSystem: true,
          text: isSenderSelf
            ? `You created the group "${groupName}"`
            : `${senderName} created the group "${groupName}"`,
        }
      }
      case 'name': {
        const newName = args[0] || ''
        return {
          isSystem: true,
          text: isSenderSelf
            ? `You changed the group name to "${newName}"`
            : `${senderName} changed the group name to "${newName}"`,
        }
      }
      case 'photo': {
        return {
          isSystem: true,
          text: isSenderSelf
            ? `You changed the group photo`
            : `${senderName} changed the group photo`,
        }
      }
      case 'name_and_photo': {
        const newName = args[0] || ''
        return {
          isSystem: true,
          text: isSenderSelf
            ? `You changed the group photo and name to "${newName}"`
            : `${senderName} changed the group photo and name to "${newName}"`,
        }
      }
      case 'desc': {
        return {
          isSystem: true,
          text: isSenderSelf
            ? `You updated the group description`
            : `${senderName} updated the group description`,
        }
      }
      case 'admin_promote': {
        const [targetId, targetName] = args
        const isTargetSelf = targetId === currentUserId
        return {
          isSystem: true,
          text: isSenderSelf
            ? `You made ${targetName} a group admin`
            : isTargetSelf
            ? `${senderName} made you an admin`
            : `${senderName} made ${targetName} an admin`,
        }
      }
      case 'admin_demote': {
        const [targetId, targetName] = args
        const isTargetSelf = targetId === currentUserId
        return {
          isSystem: true,
          text: isSenderSelf
            ? `You dismissed ${targetName} as admin`
            : isTargetSelf
            ? `${senderName} dismissed you as admin`
            : `${senderName} dismissed ${targetName} as admin`,
        }
      }
      case 'member_add': {
        const [targetId, targetName] = args
        const isTargetSelf = targetId === currentUserId
        return {
          isSystem: true,
          text: isSenderSelf
            ? `You added ${targetName} to the group`
            : isTargetSelf
            ? `${senderName} added you to the group`
            : `${senderName} added ${targetName} to the group`,
        }
      }
      case 'member_remove': {
        const [targetId, targetName] = args
        const isTargetSelf = targetId === currentUserId
        return {
          isSystem: true,
          text: isSenderSelf
            ? `You removed ${targetName} from the group`
            : isTargetSelf
            ? `${senderName} removed you from the group`
            : `${senderName} removed ${targetName} from the group`,
        }
      }
      case 'member_leave': {
        return {
          isSystem: true,
          text: isSenderSelf ? `You left the group` : `${senderName} left the group`,
        }
      }
      case 'theme': {
        const themeId = args[0] || ''
        const themeDisplayName =
          args[1] ||
          (themeId
            ? themeId.charAt(0).toUpperCase() + themeId.slice(1)
            : 'theme')
        return {
          isSystem: true,
          text: isSenderSelf
            ? `You changed the theme to ${themeDisplayName}`
            : `${senderName} changed the theme to ${themeDisplayName}`,
        }
      }
      default:
        return { isSystem: true, text: content }
    }
  }

  // 2. Backward compatibility fallback for legacy messages
  const trimmed = body.trim()
  if (trimmed.includes('changed the theme to ')) {
    const after = trimmed.split('changed the theme to ')[1] || ''
    return {
      isSystem: true,
      text: isSenderSelf
        ? `You changed the theme to ${after}`
        : `${senderName} changed the theme to ${after}`,
    }
  }
  if (trimmed.startsWith('Created the group') || trimmed.startsWith('Created the circle')) {
    return {
      isSystem: true,
      text: isSenderSelf
        ? `You ${trimmed.charAt(0).toLowerCase() + trimmed.slice(1)}`
        : `${senderName} ${trimmed.charAt(0).toLowerCase() + trimmed.slice(1)}`,
    }
  }
  if (trimmed.startsWith('updated the group info') || trimmed.startsWith('updated the circle info')) {
    return {
      isSystem: true,
      text: isSenderSelf ? `You ${trimmed}` : `${senderName} ${trimmed}`,
    }
  }
  if (
    trimmed.includes('made ') &&
    (trimmed.endsWith('a group admin') || trimmed.endsWith('a circle admin'))
  ) {
    return {
      isSystem: true,
      text: isSenderSelf ? `You ${trimmed}` : `${senderName} ${trimmed}`,
    }
  }
  if (trimmed.includes('dismissed ') && trimmed.endsWith('as admin')) {
    return {
      isSystem: true,
      text: isSenderSelf ? `You ${trimmed}` : `${senderName} ${trimmed}`,
    }
  }
  if (
    trimmed.includes('removed ') &&
    (trimmed.endsWith('from the group') || trimmed.endsWith('from the circle'))
  ) {
    return {
      isSystem: true,
      text: isSenderSelf ? `You ${trimmed}` : `${senderName} ${trimmed}`,
    }
  }
  if (
    trimmed.includes('added ') &&
    (trimmed.endsWith('to the group') || trimmed.endsWith('to the circle'))
  ) {
    return {
      isSystem: true,
      text: isSenderSelf ? `You ${trimmed}` : `${senderName} ${trimmed}`,
    }
  }
  if (trimmed === 'left the group' || trimmed === 'left the circle') {
    return {
      isSystem: true,
      text: isSenderSelf ? `You left the group` : `${senderName} left the group`,
    }
  }

  return { isSystem: false, text: body }
}

/**
 * Shared post structure inside chat messages
 */
export interface SharedPostData {
  id: string
  title?: string
  author_name: string
  author_username?: string
  author_avatar?: string
  preview: string
  note?: string
}

/**
 * Parse a shared post message payload
 */
export function parsePostShareMessage(body: string): SharedPostData | null {
  if (!body || !body.startsWith('[post]:')) return null
  try {
    const jsonStr = body.slice(7)
    return JSON.parse(jsonStr) as SharedPostData
  } catch {
    return null
  }
}

/**
 * Shared media (photo / video) structure inside chat messages
 */
export interface ChatMediaData {
  type: 'image' | 'video'
  url: string
  caption?: string
  name?: string
  size?: number
}

/**
 * Parse a chat media payload [media]:{...}
 */
export function parseChatMediaMessage(body: string): ChatMediaData | null {
  if (!body || !body.startsWith('[media]:')) return null
  try {
    const jsonStr = body.slice(8)
    return JSON.parse(jsonStr) as ChatMediaData
  } catch {
    return null
  }
}

/**
 * Chat sticker structure inside messages
 */
export interface ChatStickerData {
  id: string
  name: string
  emoji?: string
  badgeText?: string
  badgeSubtext?: string
  bgGradient?: string
  borderColor?: string
  textColor?: string
}

/**
 * Parse a chat sticker payload [sticker]:{...}
 */
export function parseChatStickerMessage(body: string): ChatStickerData | null {
  if (!body || !body.startsWith('[sticker]:')) return null
  try {
    const jsonStr = body.slice(10)
    return JSON.parse(jsonStr) as ChatStickerData
  } catch {
    return null
  }
}
