'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PostCard, { PostCardSkeleton } from '@/components/posts/PostCard'
import type { PostWithAuthor, PostType } from '@/lib/supabase/types'
import { POST_TYPE_LABELS, LANGUAGE_OPTIONS } from '@/lib/utils'
import { Search, SlidersHorizontal, X } from 'lucide-react'

const POST_TYPES: PostType[] = ['poem', 'shayari', 'ghazal', 'haiku', 'free_verse', 'other']

function ExploreContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [typeFilter, setTypeFilter] = useState<PostType | ''>(
    (searchParams.get('type') as PostType) ?? ''
  )
  const [languageFilter, setLanguageFilter] = useState(searchParams.get('lang') ?? '')
  const [tagFilter] = useState(searchParams.get('tag') ?? '')
  const [results, setResults] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const supabase = createClient()

  const doSearch = async (q: string, type: string, lang: string, tag: string) => {
    setLoading(true)
    setSearched(true)

    let dbQuery = supabase
      .from('posts')
      .select('*, profiles(*)')
      .eq('status', 'published')

    if (q.trim()) {
      // Full-text search across title and body
      dbQuery = dbQuery.or(
        `title.ilike.%${q}%,body.ilike.%${q}%,tags.cs.{${q.toLowerCase()}}`
      )
    }
    if (type) {
      dbQuery = dbQuery.eq('type', type)
    }
    if (lang) {
      dbQuery = dbQuery.eq('language', lang)
    }
    if (tag) {
      dbQuery = dbQuery.contains('tags', [tag.toLowerCase()])
    }

    dbQuery = dbQuery.order('created_at', { ascending: false }).limit(30)

    const { data } = await dbQuery
    setResults((data as PostWithAuthor[]) ?? [])
    setLoading(false)
  }

  // Run search on mount if params present
  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    const type = searchParams.get('type') ?? ''
    const lang = searchParams.get('lang') ?? ''
    const tag = searchParams.get('tag') ?? ''
    if (q || type || lang || tag) {
      setQuery(q)
      setTypeFilter(type as PostType | '')
      setLanguageFilter(lang)
      doSearch(q, type, lang, tag)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (typeFilter) params.set('type', typeFilter)
    if (languageFilter) params.set('lang', languageFilter)
    router.push(`/explore?${params.toString()}`, { scroll: false })
    doSearch(query, typeFilter, languageFilter, '')
  }

  const clearFilters = () => {
    setQuery('')
    setTypeFilter('')
    setLanguageFilter('')
    router.push('/explore')
    setResults([])
    setSearched(false)
  }

  const hasFilters = query || typeFilter || languageFilter || tagFilter

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1
        className="text-2xl font-bold mb-6"
        style={{ fontFamily: 'Lora, Georgia, serif' }}
      >
        Explore
      </h1>

      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search poems, shayari, authors, tags…"
              className="w-full pl-10 pr-4 py-2.5 bg-[hsl(var(--input)/0.5)] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] placeholder:text-[hsl(var(--muted-foreground))]"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-lg border transition-colors ${showFilters ? 'bg-[hsl(var(--accent))] border-[hsl(var(--primary)/0.3)]' : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]'}`}
            aria-label="Filters"
          >
            <SlidersHorizontal size={17} />
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Search
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-3 flex flex-wrap gap-3 p-3 bg-[hsl(var(--muted)/0.5)] rounded-lg border border-[hsl(var(--border))] animate-fade-in">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as PostType | '')}
              className="px-3 py-1.5 text-sm bg-[hsl(var(--input)/0.5)] border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            >
              <option value="">All types</option>
              {POST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {POST_TYPE_LABELS[t]}
                </option>
              ))}
            </select>

            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="px-3 py-1.5 text-sm bg-[hsl(var(--input)/0.5)] border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            >
              <option value="">All languages</option>
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        )}
      </form>

      {/* Active filters + clear */}
      {hasFilters && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">Filters:</span>
          {query && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
              "{query}"
            </span>
          )}
          {typeFilter && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
              {POST_TYPE_LABELS[typeFilter]}
            </span>
          )}
          {languageFilter && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
              {languageFilter}
            </span>
          )}
          {tagFilter && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
              #{tagFilter}
            </span>
          )}
          <button
            onClick={clearFilters}
            className="flex items-center gap-0.5 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] ml-1 transition-colors"
          >
            <X size={12} /> Clear
          </button>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : searched ? (
        results.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              No poems found. Try different keywords or filters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </p>
            {results.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )
      ) : (
        /* Discovery prompts */
        <div className="mt-6">
          <h2 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-3">
            Browse by form
          </h2>
          <div className="flex flex-wrap gap-2">
            {POST_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTypeFilter(t)
                  setShowFilters(true)
                  doSearch('', t, '', '')
                }}
                className="px-3 py-1.5 text-sm rounded-full border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] hover:border-[hsl(var(--primary)/0.3)] transition-colors"
              >
                {POST_TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          <h2 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-3 mt-5">
            Browse by language
          </h2>
          <div className="flex flex-wrap gap-2">
            {['Hindi', 'Urdu', 'Bengali', 'English', 'Punjabi'].map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setLanguageFilter(lang)
                  setShowFilters(true)
                  doSearch('', '', lang, '')
                }}
                className="px-3 py-1.5 text-sm rounded-full border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] hover:border-[hsl(var(--primary)/0.3)] transition-colors"
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreContent />
    </Suspense>
  )
}
