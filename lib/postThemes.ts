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
    titleClass: 'text-[hsl(var(--foreground))]',
    bodyClass: 'text-[hsl(var(--foreground))]',
    badgeClass:
      'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border border-[hsl(var(--border))]',
    tagClass:
      'bg-[hsl(var(--accent)/0.7)] text-[hsl(var(--accent-foreground))] hover:text-[hsl(var(--foreground))] border-[hsl(var(--border))]',
    footerBorderClass: 'border-[hsl(var(--border))]',
    authorClass: 'text-[hsl(var(--foreground))]',
    mutedTextClass: 'text-[hsl(var(--muted-foreground))]',
    actionClass:
      'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    emoji: '🌙',
    subtitle: 'Starlight & deep indigo',
    swatchGradient: 'from-[#0f172a] via-[#1e1b4b] to-[#312e81]',
    cardClass: 'theme-midnight shadow-md',
    titleClass: 'text-[hsl(var(--foreground))]',
    bodyClass: 'text-[hsl(var(--foreground))]',
    badgeClass:
      'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border border-[hsl(var(--border))]',
    tagClass:
      'bg-[hsl(var(--accent)/0.7)] text-[hsl(var(--accent-foreground))] hover:text-[hsl(var(--foreground))] border-[hsl(var(--border))]',
    footerBorderClass: 'border-[hsl(var(--border))]',
    authorClass: 'text-[hsl(var(--foreground))]',
    mutedTextClass: 'text-[hsl(var(--muted-foreground))]',
    actionClass:
      'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]',
  },
  romance: {
    id: 'romance',
    name: 'Romance',
    emoji: '💖',
    subtitle: 'Velvet rose & blush wine',
    swatchGradient: 'from-[#ffe4e6] to-[#f472b6] dark:from-[#3b1219] dark:to-[#831843]',
    cardClass: 'theme-romance shadow-xs',
    titleClass: 'text-[hsl(var(--foreground))]',
    bodyClass: 'text-[hsl(var(--foreground))]',
    badgeClass:
      'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border border-[hsl(var(--border))]',
    tagClass:
      'bg-[hsl(var(--accent)/0.7)] text-[hsl(var(--accent-foreground))] hover:text-[hsl(var(--foreground))] border-[hsl(var(--border))]',
    footerBorderClass: 'border-[hsl(var(--border))]',
    authorClass: 'text-[hsl(var(--foreground))]',
    mutedTextClass: 'text-[hsl(var(--muted-foreground))]',
    actionClass:
      'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]',
  },
  nature: {
    id: 'nature',
    name: 'Nature',
    emoji: '🌿',
    subtitle: 'Sage, pine & morning mist',
    swatchGradient: 'from-[#dcfce7] to-[#34d399] dark:from-[#062419] dark:to-[#065f46]',
    cardClass: 'theme-nature shadow-xs',
    titleClass: 'text-[hsl(var(--foreground))]',
    bodyClass: 'text-[hsl(var(--foreground))]',
    badgeClass:
      'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border border-[hsl(var(--border))]',
    tagClass:
      'bg-[hsl(var(--accent)/0.7)] text-[hsl(var(--accent-foreground))] hover:text-[hsl(var(--foreground))] border-[hsl(var(--border))]',
    footerBorderClass: 'border-[hsl(var(--border))]',
    authorClass: 'text-[hsl(var(--foreground))]',
    mutedTextClass: 'text-[hsl(var(--muted-foreground))]',
    actionClass:
      'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    emoji: '🌅',
    subtitle: 'Golden hour & saffron dusk',
    swatchGradient: 'from-[#fef3c7] via-[#fb923c] to-[#e11d48] dark:from-[#2e1606] dark:to-[#431407]',
    cardClass: 'theme-sunset shadow-xs',
    titleClass: 'text-[hsl(var(--foreground))]',
    bodyClass: 'text-[hsl(var(--foreground))]',
    badgeClass:
      'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border border-[hsl(var(--border))]',
    tagClass:
      'bg-[hsl(var(--accent)/0.7)] text-[hsl(var(--accent-foreground))] hover:text-[hsl(var(--foreground))] border-[hsl(var(--border))]',
    footerBorderClass: 'border-[hsl(var(--border))]',
    authorClass: 'text-[hsl(var(--foreground))]',
    mutedTextClass: 'text-[hsl(var(--muted-foreground))]',
    actionClass:
      'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]',
  },
  mystic: {
    id: 'mystic',
    name: 'Mystic',
    emoji: '🔮',
    subtitle: 'Amethyst & Sufi lavender',
    swatchGradient: 'from-[#f3e8ff] to-[#a855f7] dark:from-[#200e31] dark:to-[#581c87]',
    cardClass: 'theme-mystic shadow-xs',
    titleClass: 'text-[hsl(var(--foreground))]',
    bodyClass: 'text-[hsl(var(--foreground))]',
    badgeClass:
      'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border border-[hsl(var(--border))]',
    tagClass:
      'bg-[hsl(var(--accent)/0.7)] text-[hsl(var(--accent-foreground))] hover:text-[hsl(var(--foreground))] border-[hsl(var(--border))]',
    footerBorderClass: 'border-[hsl(var(--border))]',
    authorClass: 'text-[hsl(var(--foreground))]',
    mutedTextClass: 'text-[hsl(var(--muted-foreground))]',
    actionClass:
      'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]',
  },
  noir: {
    id: 'noir',
    name: 'Noir',
    emoji: '🖤',
    subtitle: 'Dark velvet & modern chic',
    swatchGradient: 'from-[#27272a] to-[#09090b]',
    cardClass: 'theme-noir shadow-md',
    titleClass: 'text-[hsl(var(--foreground))]',
    bodyClass: 'text-[hsl(var(--foreground))]',
    badgeClass:
      'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border border-[hsl(var(--border))]',
    tagClass:
      'bg-[hsl(var(--accent)/0.7)] text-[hsl(var(--accent-foreground))] hover:text-[hsl(var(--foreground))] border-[hsl(var(--border))]',
    footerBorderClass: 'border-[hsl(var(--border))]',
    authorClass: 'text-[hsl(var(--foreground))]',
    mutedTextClass: 'text-[hsl(var(--muted-foreground))]',
    actionClass:
      'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]',
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
