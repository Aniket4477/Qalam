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
    bodyClass: 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
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
    titleClass: 'text-[#361f0d] dark:text-[#faebd7]',
    bodyClass: 'text-[#573e27] dark:text-[#e2cead]',
    badgeClass:
      'bg-[#eee1c7] dark:bg-[#3d2c18] text-[#553618] dark:text-[#f5e0c1] border border-[#d8bf92] dark:border-[#674b29]',
    tagClass:
      'text-[#684c30] dark:text-[#dec9a7] hover:text-[#361f0d] dark:hover:text-white bg-[#f1e6ce]/70 dark:bg-[#332414]/70 border-[#d8bf92]/80 dark:border-[#563f24]',
    footerBorderClass: 'border-[#e2cb9f] dark:border-[#46341e]',
    authorClass: 'text-[#361f0d] dark:text-[#faebd7]',
    mutedTextClass: 'text-[#795a39] dark:text-[#c4ad8a]',
    actionClass:
      'text-[#795a39] dark:text-[#c4ad8a] hover:text-[#361f0d] dark:hover:text-[#faebd7] hover:bg-[#ede0c4]/60 dark:hover:bg-[#3a2a17]/60',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    emoji: '🌙',
    subtitle: 'Starlight & deep indigo',
    swatchGradient: 'from-[#0f172a] via-[#1e1b4b] to-[#312e81]',
    cardClass: 'theme-midnight shadow-md',
    titleClass: 'text-indigo-100',
    bodyClass: 'text-slate-300 hover:text-slate-100',
    badgeClass: 'bg-indigo-950/90 text-indigo-300 border border-indigo-800/80',
    tagClass:
      'text-indigo-300/90 hover:text-white hover:bg-indigo-950/70 border-indigo-900/80',
    footerBorderClass: 'border-indigo-900/60',
    authorClass: 'text-slate-100',
    mutedTextClass: 'text-indigo-200/70',
    actionClass:
      'text-indigo-200/70 hover:text-white hover:bg-indigo-950/60',
  },
  romance: {
    id: 'romance',
    name: 'Romance',
    emoji: '💖',
    subtitle: 'Velvet rose & blush wine',
    swatchGradient: 'from-[#ffe4e6] to-[#f472b6] dark:from-[#3b1219] dark:to-[#831843]',
    cardClass: 'theme-romance shadow-xs',
    titleClass: 'text-rose-950 dark:text-rose-100',
    bodyClass: 'text-rose-800/90 dark:text-rose-200/90 hover:text-rose-950 dark:hover:text-rose-100',
    badgeClass:
      'bg-rose-100/90 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800/60',
    tagClass:
      'text-rose-700/80 dark:text-rose-300/80 hover:text-rose-900 dark:hover:text-rose-100 hover:bg-rose-100/60 border-rose-200 dark:border-rose-900/60',
    footerBorderClass: 'border-rose-200 dark:border-rose-900/60',
    authorClass: 'text-rose-950 dark:text-rose-100',
    mutedTextClass: 'text-rose-700/70 dark:text-rose-300/70',
    actionClass:
      'text-rose-700/70 dark:text-rose-300/70 hover:text-rose-950 dark:hover:text-rose-100 hover:bg-rose-200/40 dark:hover:bg-rose-900/40',
  },
  nature: {
    id: 'nature',
    name: 'Nature',
    emoji: '🌿',
    subtitle: 'Sage, pine & morning mist',
    swatchGradient: 'from-[#dcfce7] to-[#34d399] dark:from-[#062419] dark:to-[#065f46]',
    cardClass: 'theme-nature shadow-xs',
    titleClass: 'text-emerald-950 dark:text-emerald-100',
    bodyClass:
      'text-emerald-800/90 dark:text-emerald-200/90 hover:text-emerald-950 dark:hover:text-emerald-100',
    badgeClass:
      'bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800/60',
    tagClass:
      'text-emerald-700/80 dark:text-emerald-300/80 hover:text-emerald-900 dark:hover:text-emerald-100 hover:bg-emerald-100/60 border-emerald-200 dark:border-emerald-900/60',
    footerBorderClass: 'border-emerald-200 dark:border-emerald-800/60',
    authorClass: 'text-emerald-950 dark:text-emerald-100',
    mutedTextClass: 'text-emerald-700/70 dark:text-emerald-300/70',
    actionClass:
      'text-emerald-700/70 dark:text-emerald-300/70 hover:text-emerald-950 dark:hover:text-emerald-100 hover:bg-emerald-200/40 dark:hover:bg-emerald-900/40',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    emoji: '🌅',
    subtitle: 'Golden hour & saffron dusk',
    swatchGradient: 'from-[#fef3c7] via-[#fb923c] to-[#e11d48] dark:from-[#2e1606] dark:to-[#431407]',
    cardClass: 'theme-sunset shadow-xs',
    titleClass: 'text-amber-950 dark:text-amber-100',
    bodyClass:
      'text-amber-800/90 dark:text-amber-200/90 hover:text-amber-950 dark:hover:text-amber-100',
    badgeClass:
      'bg-amber-100/90 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/60',
    tagClass:
      'text-amber-800/80 dark:text-amber-300/80 hover:text-amber-950 dark:hover:text-amber-100 hover:bg-amber-100/60 border-amber-200 dark:border-amber-900/60',
    footerBorderClass: 'border-amber-200 dark:border-amber-800/60',
    authorClass: 'text-amber-950 dark:text-amber-100',
    mutedTextClass: 'text-amber-800/70 dark:text-amber-300/70',
    actionClass:
      'text-amber-800/70 dark:text-amber-300/70 hover:text-amber-950 dark:hover:text-amber-100 hover:bg-amber-200/40 dark:hover:bg-amber-900/40',
  },
  mystic: {
    id: 'mystic',
    name: 'Mystic',
    emoji: '🔮',
    subtitle: 'Amethyst & Sufi lavender',
    swatchGradient: 'from-[#f3e8ff] to-[#a855f7] dark:from-[#200e31] dark:to-[#581c87]',
    cardClass: 'theme-mystic shadow-xs',
    titleClass: 'text-purple-950 dark:text-purple-100',
    bodyClass:
      'text-purple-800/90 dark:text-purple-200/90 hover:text-purple-950 dark:hover:text-purple-100',
    badgeClass:
      'bg-purple-100/90 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300/80 dark:border-purple-800/60',
    tagClass:
      'text-purple-700/80 dark:text-purple-300/80 hover:text-purple-900 dark:hover:text-purple-100 hover:bg-purple-100/60 border-purple-200 dark:border-purple-900/60',
    footerBorderClass: 'border-purple-200 dark:border-purple-800/60',
    authorClass: 'text-purple-950 dark:text-purple-100',
    mutedTextClass: 'text-purple-700/70 dark:text-purple-300/70',
    actionClass:
      'text-purple-700/70 dark:text-purple-300/70 hover:text-purple-950 dark:hover:text-purple-100 hover:bg-purple-200/40 dark:hover:bg-purple-900/40',
  },
  noir: {
    id: 'noir',
    name: 'Noir',
    emoji: '🖤',
    subtitle: 'Dark velvet & modern chic',
    swatchGradient: 'from-[#27272a] to-[#09090b]',
    cardClass: 'theme-noir shadow-md',
    titleClass: 'text-zinc-50',
    bodyClass: 'text-zinc-300 hover:text-zinc-100',
    badgeClass: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
    tagClass: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border-zinc-700/70',
    footerBorderClass: 'border-zinc-800',
    authorClass: 'text-zinc-100',
    mutedTextClass: 'text-zinc-400',
    actionClass:
      'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60',
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
