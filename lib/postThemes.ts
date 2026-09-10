export type PostThemeId =
  | 'classic'
  | 'parchment'
  | 'midnight'
  | 'romance'
  | 'nature'
  | 'sunset'
  | 'mystic'
  | 'noir'

export interface PostTheme {
  id: PostThemeId
  name: string
  emoji: string
  subtitle: string
  swatchGradient: string
  cardClass: string
  titleClass: string
  bodyClass: string
  badgeClass: string
  tagClass: string
  footerBorderClass: string
  authorClass: string
  mutedTextClass: string
  actionClass: string
}

export const POST_THEMES: Record<PostThemeId, PostTheme> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    emoji: '🖋️',
    subtitle: 'Timeless ink & paper',
    swatchGradient: 'from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900',
    cardClass:
      'theme-classic bg-[hsl(var(--card))] border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary)/0.4)]',
    titleClass: 'text-[hsl(var(--foreground))]',
    bodyClass: 'text-[hsl(var(--foreground))]',
    badgeClass: 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border border-transparent',
    tagClass:
      'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))] border-[hsl(var(--border))]',
    footerBorderClass: 'border-[hsl(var(--border))]',
    authorClass: 'text-[hsl(var(--foreground))]',
    mutedTextClass: 'text-[hsl(var(--muted-foreground))]',
    actionClass:
      'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]',
  },
  parchment: {
    id: 'parchment',
    name: 'Parchment',
    emoji: '📜',
    subtitle: 'Aged manuscript & sepia',
    swatchGradient: 'from-[#fcedd2] to-[#e4cb9d] dark:from-[#352614] dark:to-[#22180c]',
    cardClass: 'theme-parchment shadow-xs',
    titleClass: 'text-[#241508] dark:text-[#fcf2df]',
    bodyClass: 'text-[#331d0b] dark:text-[#f7ebd7]',
    badgeClass:
      'bg-[#ebd9b5] dark:bg-[#3d2b19] text-[#42250d] dark:text-[#f5e4c4] border border-[#d6be90] dark:border-[#574028]',
    tagClass:
      'bg-[#f0e3c8] dark:bg-[#332415] text-[#4f3117] dark:text-[#edd4b4] hover:text-[#241508] dark:hover:text-white border-[#d6be90]/70 dark:border-[#4d3721]',
    footerBorderClass: 'border-[#d6be90] dark:border-[#46341e]',
    authorClass: 'text-[#241508] dark:text-[#fcf2df]',
    mutedTextClass: 'text-[#5e3b1c] dark:text-[#d7b585]',
    actionClass:
      'text-[#5e3b1c] dark:text-[#d7b585] hover:text-[#241508] dark:hover:text-white hover:bg-[#ebd9b5]/70 dark:hover:bg-[#3d2b19]/70',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    emoji: '🌙',
    subtitle: 'Starlight & deep indigo',
    swatchGradient: 'from-[#0f172a] via-[#1e1b4b] to-[#312e81]',
    cardClass: 'theme-midnight shadow-md',
    titleClass: 'text-[#f8fafc]',
    bodyClass: 'text-[#e2e8f0]',
    badgeClass: 'bg-[#1e1b4b] text-[#c7d2fe] border border-indigo-700/60',
    tagClass:
      'bg-[#18163b] text-[#c7d2fe] hover:text-white border-indigo-800/80',
    footerBorderClass: 'border-indigo-900/80',
    authorClass: 'text-[#f8fafc]',
    mutedTextClass: 'text-[#bac7fe]',
    actionClass:
      'text-[#bac7fe] hover:text-white hover:bg-[#1e1b4b]/80',
  },
  romance: {
    id: 'romance',
    name: 'Romance',
    emoji: '💖',
    subtitle: 'Velvet rose & blush wine',
    swatchGradient: 'from-[#ffe4e6] to-[#f472b6] dark:from-[#3b1219] dark:to-[#831843]',
    cardClass: 'theme-romance shadow-xs',
    titleClass: 'text-[#26040d] dark:text-[#fff1f2]',
    bodyClass: 'text-[#3b0816] dark:text-[#ffe4e8]',
    badgeClass:
      'bg-[#fbcfe8] dark:bg-[#4c0519] text-[#7a1236] dark:text-[#fecdd3] border border-[#f472b6]/60 dark:border-[#9f1239]',
    tagClass:
      'bg-[#fce7f3] dark:bg-[#3b0b18] text-[#7a1236] dark:text-[#fecdd3] hover:text-[#26040d] dark:hover:text-white border-[#f472b6]/50 dark:border-[#881337]',
    footerBorderClass: 'border-[#f4a0b8]/60 dark:border-[#881337]/70',
    authorClass: 'text-[#26040d] dark:text-[#fff1f2]',
    mutedTextClass: 'text-[#7a1236] dark:text-[#f472b6]',
    actionClass:
      'text-[#7a1236] dark:text-[#f472b6] hover:text-[#26040d] dark:hover:text-white hover:bg-[#fbcfe8]/70 dark:hover:bg-[#4c0519]/70',
  },
  nature: {
    id: 'nature',
    name: 'Nature',
    emoji: '🌿',
    subtitle: 'Sage, pine & morning mist',
    swatchGradient: 'from-[#dcfce7] to-[#34d399] dark:from-[#062419] dark:to-[#065f46]',
    cardClass: 'theme-nature shadow-xs',
    titleClass: 'text-[#032612] dark:text-[#f0fdf4]',
    bodyClass: 'text-[#063b1d] dark:text-[#dcfce7]',
    badgeClass:
      'bg-[#bbf7d0] dark:bg-[#0b3324] text-[#064e3b] dark:text-[#86efac] border border-[#86efac] dark:border-[#134e38]',
    tagClass:
      'bg-[#dbf5e5] dark:bg-[#08291c] text-[#0f532d] dark:text-[#a7f3d0] hover:text-[#032612] dark:hover:text-white border-[#86efac]/70 dark:border-[#114532]',
    footerBorderClass: 'border-[#96dcb4] dark:border-[#134e38]',
    authorClass: 'text-[#032612] dark:text-[#f0fdf4]',
    mutedTextClass: 'text-[#145a32] dark:text-[#6ee7b7]',
    actionClass:
      'text-[#145a32] dark:text-[#6ee7b7] hover:text-[#032612] dark:hover:text-white hover:bg-[#bbf7d0]/70 dark:hover:bg-[#0b3324]/70',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    emoji: '🌅',
    subtitle: 'Golden hour & saffron dusk',
    swatchGradient: 'from-[#fef3c7] via-[#fb923c] to-[#e11d48] dark:from-[#2e1606] dark:to-[#431407]',
    cardClass: 'theme-sunset shadow-xs',
    titleClass: 'text-[#2c1102] dark:text-[#fef3c7]',
    bodyClass: 'text-[#3d1803] dark:text-[#fed7aa]',
    badgeClass:
      'bg-[#fde68a] dark:bg-[#431904] text-[#6c2e08] dark:text-[#fde68a] border border-[#fcd34d] dark:border-[#78350f]',
    tagClass:
      'bg-[#fef0c7] dark:bg-[#341403] text-[#713009] dark:text-[#fed7aa] hover:text-[#2c1102] dark:hover:text-white border-[#fcd34d]/70 dark:border-[#662c0a]',
    footerBorderClass: 'border-[#fcd34d] dark:border-[#662c0a]',
    authorClass: 'text-[#2c1102] dark:text-[#fef3c7]',
    mutedTextClass: 'text-[#6e2d09] dark:text-[#fbb24a]',
    actionClass:
      'text-[#6e2d09] dark:text-[#fbb24a] hover:text-[#2c1102] dark:hover:text-white hover:bg-[#fde68a]/70 dark:hover:bg-[#431904]/70',
  },
  mystic: {
    id: 'mystic',
    name: 'Mystic',
    emoji: '🔮',
    subtitle: 'Amethyst & Sufi lavender',
    swatchGradient: 'from-[#f3e8ff] to-[#a855f7] dark:from-[#200e31] dark:to-[#581c87]',
    cardClass: 'theme-mystic shadow-xs',
    titleClass: 'text-[#220336] dark:text-[#faf5ff]',
    bodyClass: 'text-[#32064e] dark:text-[#f3e8ff]',
    badgeClass:
      'bg-[#e9d5ff] dark:bg-[#350e50] text-[#4a127a] dark:text-[#e9d5ff] border border-[#c084fc] dark:border-[#6b21a8]',
    tagClass:
      'bg-[#f3e8ff] dark:bg-[#28093d] text-[#551a8b] dark:text-[#e9d5ff] hover:text-[#220336] dark:hover:text-white border-[#c084fc]/70 dark:border-[#581c87]',
    footerBorderClass: 'border-[#d3b1f8] dark:border-[#581c87]',
    authorClass: 'text-[#220336] dark:text-[#faf5ff]',
    mutedTextClass: 'text-[#551a8b] dark:text-[#d8b4fe]',
    actionClass:
      'text-[#551a8b] dark:text-[#d8b4fe] hover:text-[#220336] dark:hover:text-white hover:bg-[#e9d5ff]/70 dark:hover:bg-[#350e50]/70',
  },
  noir: {
    id: 'noir',
    name: 'Noir',
    emoji: '🖤',
    subtitle: 'Dark velvet & modern chic',
    swatchGradient: 'from-[#27272a] to-[#09090b]',
    cardClass: 'theme-noir shadow-md',
    titleClass: 'text-[#fafafa]',
    bodyClass: 'text-[#e4e4e7]',
    badgeClass: 'bg-[#27272a] text-[#f4f4f5] border border-zinc-700',
    tagClass: 'bg-[#1f1f23] text-[#d4d4d8] hover:text-white border-zinc-700',
    footerBorderClass: 'border-zinc-800',
    authorClass: 'text-[#fafafa]',
    mutedTextClass: 'text-[#d4d4d8]',
    actionClass:
      'text-[#d4d4d8] hover:text-white hover:bg-[#27272a]',
  },
}

export const POST_THEME_LIST: PostTheme[] = Object.values(POST_THEMES)

export function getPostTheme(themeId?: string | null): PostTheme {
  if (themeId && POST_THEMES[themeId as PostThemeId]) {
    return POST_THEMES[themeId as PostThemeId]
  }
  return POST_THEMES.classic
}

export function getThemeFromTags(tags?: string[]): PostThemeId | null {
  if (!tags || !Array.isArray(tags)) return null
  for (const tag of tags) {
    if (tag.startsWith('theme:')) {
      const parsed = tag.replace('theme:', '') as PostThemeId
      if (POST_THEMES[parsed]) return parsed
    }
  }
  return null
}

export function tagsWithTheme(tags: string[], themeId: PostThemeId): string[] {
  const filtered = tags.filter((t) => !t.startsWith('theme:'))
  if (themeId && themeId !== 'classic') {
    filtered.push(`theme:${themeId}`)
  }
  return filtered
}

export function cleanDisplayTags(tags?: string[]): string[] {
  if (!tags || !Array.isArray(tags)) return []
  return tags.filter((t) => !t.startsWith('theme:'))
}
