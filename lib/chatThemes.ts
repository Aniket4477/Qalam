export type ChatThemeId = 'classic' | 'nature' | 'love' | 'night' | 'sunset' | 'ocean'

export interface ChatThemeConfig {
  id: ChatThemeId
  name: string
  icon: string
  tagline: string
  description: string
  backgroundStyle: React.CSSProperties
  bubbleOwnClass: string
  bubbleOtherClass: string
  timeOwnClass: string
  timeOtherClass: string
  dividerClass: string
  accentColor: string
  sendButtonClass?: string
  previewColors: {
    bg: string
    ownBubble: string
    otherBubble: string
  }
}

export const CHAT_THEMES: Record<ChatThemeId, ChatThemeConfig> = {
  classic: {
    id: 'classic',
    name: 'Classic Qalam',
    icon: '📜',
    tagline: 'Timeless & Elegant',
    description: 'Classic dark parchment with warm amber accents.',
    backgroundStyle: {
      backgroundColor: 'transparent',
    },
    bubbleOwnClass:
      'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-br-xs shadow-xs',
    bubbleOtherClass:
      'bg-[hsl(var(--muted)/0.7)] text-[hsl(var(--foreground))] border border-[hsl(var(--border)/0.5)] rounded-bl-xs shadow-xs',
    timeOwnClass: 'text-[hsl(var(--primary-foreground)/0.75)]',
    timeOtherClass: 'text-[hsl(var(--muted-foreground))]',
    dividerClass:
      'text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border)/0.4)]',
    accentColor: 'hsl(var(--primary))',
    sendButtonClass: 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]',
    previewColors: {
      bg: '#14171f',
      ownBubble: '#c27803',
      otherBubble: '#242a38',
    },
  },

  nature: {
    id: 'nature',
    name: 'Nature Forest',
    icon: '🌿',
    tagline: 'Calm & Organic',
    description: 'Serene emerald woods, leafy moss, and soothing botanical greens.',
    backgroundStyle: {
      background: 'radial-gradient(ellipse at 50% 0%, #0e2b19 0%, #071a0e 55%, #030e07 100%)',
    },
    bubbleOwnClass:
      'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-md shadow-emerald-950/50 rounded-br-xs',
    bubbleOtherClass:
      'bg-[#0f291c]/95 text-emerald-100 border border-emerald-800/40 shadow-xs rounded-bl-xs',
    timeOwnClass: 'text-emerald-100/80',
    timeOtherClass: 'text-emerald-400/70',
    dividerClass:
      'text-emerald-300/90 bg-[#072013]/90 border border-emerald-700/40 shadow-xs',
    accentColor: '#10b981',
    sendButtonClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-900/40',
    previewColors: {
      bg: '#071a0e',
      ownBubble: '#059669',
      otherBubble: '#0f291c',
    },
  },

  love: {
    id: 'love',
    name: 'Love & Romance',
    icon: '💖',
    tagline: 'Warm & Romantic',
    description: 'Blushing roses, sunset crimson, and intimate candlelight ambience.',
    backgroundStyle: {
      background: 'radial-gradient(ellipse at 50% 0%, #360f22 0%, #200814 55%, #10030a 100%)',
    },
    bubbleOwnClass:
      'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 text-white shadow-md shadow-rose-950/50 rounded-br-xs',
    bubbleOtherClass:
      'bg-[#341122]/95 text-rose-100 border border-rose-800/40 shadow-xs rounded-bl-xs',
    timeOwnClass: 'text-rose-100/80',
    timeOtherClass: 'text-rose-400/70',
    dividerClass:
      'text-rose-300/90 bg-[#280a1a]/90 border border-rose-700/40 shadow-xs',
    accentColor: '#f43f5e',
    sendButtonClass: 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-rose-900/40',
    previewColors: {
      bg: '#200814',
      ownBubble: '#e11d48',
      otherBubble: '#341122',
    },
  },

  night: {
    id: 'night',
    name: 'Midnight Nebula',
    icon: '🌌',
    tagline: 'Cosmic & Dreamy',
    description: 'Starry starlight, velvet indigo, and mystical violet glows.',
    backgroundStyle: {
      background: 'radial-gradient(ellipse at 50% 0%, #161440 0%, #0d0b28 55%, #050414 100%)',
    },
    bubbleOwnClass:
      'bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 text-white shadow-md shadow-indigo-950/50 rounded-br-xs',
    bubbleOtherClass:
      'bg-[#191740]/95 text-indigo-100 border border-indigo-800/40 shadow-xs rounded-bl-xs',
    timeOwnClass: 'text-indigo-100/80',
    timeOtherClass: 'text-indigo-400/70',
    dividerClass:
      'text-indigo-300/90 bg-[#100e30]/90 border border-indigo-700/40 shadow-xs',
    accentColor: '#6366f1',
    sendButtonClass: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-900/40',
    previewColors: {
      bg: '#0d0b28',
      ownBubble: '#4f46e5',
      otherBubble: '#191740',
    },
  },

  sunset: {
    id: 'sunset',
    name: 'Twilight Dusk',
    icon: '🌅',
    tagline: 'Warm & Nostalgic',
    description: 'Golden hour amber, fiery coral, and lingering dusk tones.',
    backgroundStyle: {
      background: 'radial-gradient(ellipse at 50% 0%, #3a1b0d 0%, #241006 55%, #100602 100%)',
    },
    bubbleOwnClass:
      'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white shadow-md shadow-amber-950/50 rounded-br-xs',
    bubbleOtherClass:
      'bg-[#33170a]/95 text-amber-100 border border-amber-800/40 shadow-xs rounded-bl-xs',
    timeOwnClass: 'text-amber-100/80',
    timeOtherClass: 'text-amber-400/70',
    dividerClass:
      'text-amber-300/90 bg-[#281106]/90 border border-amber-700/40 shadow-xs',
    accentColor: '#f59e0b',
    sendButtonClass: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-amber-900/40',
    previewColors: {
      bg: '#241006',
      ownBubble: '#ea580c',
      otherBubble: '#33170a',
    },
  },

  ocean: {
    id: 'ocean',
    name: 'Ocean Abyss',
    icon: '🌊',
    tagline: 'Deep & Serene',
    description: 'Mystic deep-sea abyss with luminous cyan and aquatic azure.',
    backgroundStyle: {
      background: 'radial-gradient(ellipse at 50% 0%, #0a2736 0%, #051822 55%, #020c12 100%)',
    },
    bubbleOwnClass:
      'bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 text-white shadow-md shadow-cyan-950/50 rounded-br-xs',
    bubbleOtherClass:
      'bg-[#0b2533]/95 text-cyan-100 border border-cyan-800/40 shadow-xs rounded-bl-xs',
    timeOwnClass: 'text-cyan-100/80',
    timeOtherClass: 'text-cyan-400/70',
    dividerClass:
      'text-cyan-300/90 bg-[#061e2b]/90 border border-cyan-700/40 shadow-xs',
    accentColor: '#06b6d4',
    sendButtonClass: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-cyan-900/40',
    previewColors: {
      bg: '#051822',
      ownBubble: '#0891b2',
      otherBubble: '#0b2533',
    },
  },
}

export const DEFAULT_CHAT_THEME: ChatThemeId = 'classic'

export function getChatTheme(id?: string | null): ChatThemeConfig {
  if (id && id in CHAT_THEMES) {
    return CHAT_THEMES[id as ChatThemeId]
  }
  return CHAT_THEMES[DEFAULT_CHAT_THEME]
}
