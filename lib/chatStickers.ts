export type StickerCategory = 'poetry' | 'love' | 'nature' | 'reactions'

export interface ChatSticker {
  id: string
  name: string
  category: StickerCategory
  emoji: string
  badgeText?: string
  badgeSubtext?: string
  bgGradient: string
  borderColor: string
  textColor: string
}

export interface StickerCategoryMeta {
  id: StickerCategory
  label: string
  icon: string
}

export const STICKER_CATEGORIES: StickerCategoryMeta[] = [
  { id: 'poetry', label: 'Shayari & Qalam', icon: '📜' },
  { id: 'love', label: 'Love & Ishq', icon: '💖' },
  { id: 'nature', label: 'Nature & Night', icon: '🌙' },
  { id: 'reactions', label: 'Reactions', icon: '✨' },
]

export const CHAT_STICKERS: ChatSticker[] = [
  // --- Poetry & Shayari Category ---
  {
    id: 'stk_ishq',
    name: 'Ishq',
    category: 'poetry',
    emoji: '✒️',
    badgeText: 'عشق • इश्क़',
    badgeSubtext: 'Pure Passion',
    bgGradient: 'from-amber-950/80 via-red-950/70 to-zinc-950',
    borderColor: 'border-amber-600/50',
    textColor: 'text-amber-300',
  },
  {
    id: 'stk_sukoon',
    name: 'Sukoon',
    category: 'poetry',
    emoji: '🕊️',
    badgeText: 'सुकून • سكون',
    badgeSubtext: 'Serenity of Soul',
    bgGradient: 'from-emerald-950/80 via-teal-950/70 to-zinc-950',
    borderColor: 'border-emerald-500/50',
    textColor: 'text-emerald-300',
  },
  {
    id: 'stk_alfaaz',
    name: 'Alfaaz',
    category: 'poetry',
    emoji: '📖',
    badgeText: 'अल्फ़ाज़ • الفاظ',
    badgeSubtext: 'Words from Heart',
    bgGradient: 'from-blue-950/80 via-indigo-950/70 to-zinc-950',
    borderColor: 'border-blue-500/50',
    textColor: 'text-blue-300',
  },
  {
    id: 'stk_qalam',
    name: 'Qalam',
    category: 'poetry',
    emoji: '🖋️',
    badgeText: 'क़लम • قلم',
    badgeSubtext: 'Voice of Writer',
    bgGradient: 'from-amber-900/80 via-orange-950/70 to-zinc-950',
    borderColor: 'border-amber-500/50',
    textColor: 'text-amber-400',
  },
  {
    id: 'stk_wah_wah',
    name: 'Wah Wah!',
    category: 'poetry',
    emoji: '👏',
    badgeText: 'वाह! वाह!',
    badgeSubtext: 'Sublime Verse!',
    bgGradient: 'from-yellow-950/80 via-amber-950/70 to-zinc-950',
    borderColor: 'border-yellow-500/50',
    textColor: 'text-yellow-300',
  },
  {
    id: 'stk_irshad',
    name: 'Irshad!',
    category: 'poetry',
    emoji: '🌹',
    badgeText: 'इरशाद!',
    badgeSubtext: 'Please Recite!',
    bgGradient: 'from-rose-950/80 via-pink-950/70 to-zinc-950',
    borderColor: 'border-rose-500/50',
    textColor: 'text-rose-300',
  },
  {
    id: 'stk_ghazal',
    name: 'Ghazal',
    category: 'poetry',
    emoji: '🎻',
    badgeText: 'ग़ज़ल • غزل',
    badgeSubtext: 'Melody of Poetry',
    bgGradient: 'from-purple-950/80 via-violet-950/70 to-zinc-950',
    borderColor: 'border-purple-500/50',
    textColor: 'text-purple-300',
  },
  {
    id: 'stk_rooh',
    name: 'Rooh',
    category: 'poetry',
    emoji: '✨',
    badgeText: 'रूह • روح',
    badgeSubtext: 'Deep in Spirit',
    bgGradient: 'from-cyan-950/80 via-slate-950/70 to-zinc-950',
    borderColor: 'border-cyan-500/50',
    textColor: 'text-cyan-300',
  },

  // --- Love & Romance Category ---
  {
    id: 'stk_love_rose',
    name: 'Velvet Rose',
    category: 'love',
    emoji: '🌹',
    badgeText: 'Gul-e-Gulzar',
    badgeSubtext: 'Forever Blooming',
    bgGradient: 'from-rose-950/80 via-red-950/70 to-zinc-950',
    borderColor: 'border-rose-500/50',
    textColor: 'text-rose-300',
  },
  {
    id: 'stk_love_fire',
    name: 'Heart on Fire',
    category: 'love',
    emoji: '❤️‍🔥',
    badgeText: 'Aatish-e-Dil',
    badgeSubtext: 'Burning Flame',
    bgGradient: 'from-orange-950/80 via-red-950/70 to-zinc-950',
    borderColor: 'border-red-500/50',
    textColor: 'text-orange-400',
  },
  {
    id: 'stk_love_letter',
    name: 'Love Letter',
    category: 'love',
    emoji: '💌',
    badgeText: 'Khat',
    badgeSubtext: 'Sealed with Affection',
    bgGradient: 'from-pink-950/80 via-rose-950/70 to-zinc-950',
    borderColor: 'border-pink-500/50',
    textColor: 'text-pink-300',
  },
  {
    id: 'stk_soulmates',
    name: 'Soulmates',
    category: 'love',
    emoji: '👩‍❤️‍👨',
    badgeText: 'Humsafar',
    badgeSubtext: 'Two Souls, One Tale',
    bgGradient: 'from-fuchsia-950/80 via-rose-950/70 to-zinc-950',
    borderColor: 'border-fuchsia-500/50',
    textColor: 'text-fuchsia-300',
  },
  {
    id: 'stk_love_sparkle',
    name: 'Starry Love',
    category: 'love',
    emoji: '💖',
    badgeText: 'Mohabbat',
    badgeSubtext: 'Gentle & True',
    bgGradient: 'from-pink-950/80 via-purple-950/70 to-zinc-950',
    borderColor: 'border-pink-400/50',
    textColor: 'text-pink-300',
  },
  {
    id: 'stk_love_cupid',
    name: 'Cupid Arrow',
    category: 'love',
    emoji: '💘',
    badgeText: 'Teer-e-Nazar',
    badgeSubtext: 'Struck by Grace',
    bgGradient: 'from-red-950/80 via-rose-950/70 to-zinc-950',
    borderColor: 'border-red-400/50',
    textColor: 'text-rose-300',
  },

  // --- Nature & Night Category ---
  {
    id: 'stk_moonlit',
    name: 'Moonlit Night',
    category: 'nature',
    emoji: '🌙',
    badgeText: 'Shab-e-Mahtab',
    badgeSubtext: 'Under Crescent Moon',
    bgGradient: 'from-indigo-950/80 via-slate-950/70 to-zinc-950',
    borderColor: 'border-indigo-500/50',
    textColor: 'text-indigo-300',
  },
  {
    id: 'stk_autumn_leaf',
    name: 'Autumn Wind',
    category: 'nature',
    emoji: '🍂',
    badgeText: 'Fasl-e-Khizaan',
    badgeSubtext: 'Golden Rustle',
    bgGradient: 'from-amber-950/80 via-orange-950/70 to-zinc-950',
    borderColor: 'border-amber-600/50',
    textColor: 'text-amber-400',
  },
  {
    id: 'stk_lotus',
    name: 'Mystic Lotus',
    category: 'nature',
    emoji: '🪷',
    badgeText: 'Kamal',
    badgeSubtext: 'Pure in Murky Waters',
    bgGradient: 'from-pink-950/80 via-emerald-950/70 to-zinc-950',
    borderColor: 'border-pink-500/50',
    textColor: 'text-pink-300',
  },
  {
    id: 'stk_rain',
    name: 'Petrichor',
    category: 'nature',
    emoji: '🌧️',
    badgeText: 'Barkha',
    badgeSubtext: 'Scent of Rain',
    bgGradient: 'from-cyan-950/80 via-blue-950/70 to-zinc-950',
    borderColor: 'border-cyan-500/50',
    textColor: 'text-cyan-300',
  },
  {
    id: 'stk_starlight',
    name: 'Nebula',
    category: 'nature',
    emoji: '🌌',
    badgeText: 'Kahkashaan',
    badgeSubtext: 'Infinite Galaxy',
    bgGradient: 'from-purple-950/80 via-indigo-950/70 to-zinc-950',
    borderColor: 'border-purple-400/50',
    textColor: 'text-purple-300',
  },

  // --- Reactions Category ---
  {
    id: 'stk_applause',
    name: 'Ovation',
    category: 'reactions',
    emoji: '🙌',
    badgeText: 'Lajawab!',
    badgeSubtext: 'Beyond Words',
    bgGradient: 'from-emerald-950/80 via-teal-950/70 to-zinc-950',
    borderColor: 'border-emerald-400/50',
    textColor: 'text-emerald-300',
  },
  {
    id: 'stk_deep_thought',
    name: 'In Thought',
    category: 'reactions',
    emoji: '🤔',
    badgeText: 'Fikr-o-Khyal',
    badgeSubtext: 'Pondering Depth',
    bgGradient: 'from-amber-950/80 via-stone-950/70 to-zinc-950',
    borderColor: 'border-amber-400/50',
    textColor: 'text-amber-300',
  },
  {
    id: 'stk_tears_joy',
    name: 'Moved to Tears',
    category: 'reactions',
    emoji: '🥹',
    badgeText: 'Chhoo Liya Dil',
    badgeSubtext: 'Touched my Soul',
    bgGradient: 'from-sky-950/80 via-blue-950/70 to-zinc-950',
    borderColor: 'border-sky-400/50',
    textColor: 'text-sky-300',
  },
  {
    id: 'stk_mind_blown',
    name: 'Speechless',
    category: 'reactions',
    emoji: '🤯',
    badgeText: 'Hairat!',
    badgeSubtext: 'Spellbound Beauty',
    bgGradient: 'from-violet-950/80 via-fuchsia-950/70 to-zinc-950',
    borderColor: 'border-violet-400/50',
    textColor: 'text-violet-300',
  },
]

export function getStickerById(id: string): ChatSticker | undefined {
  return CHAT_STICKERS.find((s) => s.id === id)
}
