'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PostCard, { PostCardSkeleton } from '@/components/posts/PostCard'
import UserCard from '@/components/profile/UserCard'
import type { PostWithAuthor, PostType, Profile } from '@/lib/supabase/types'
import { POST_TYPE_LABELS, LANGUAGE_OPTIONS } from '@/lib/utils'
import { Search, SlidersHorizontal, X, Users, BookOpen, Sparkles, Loader2 } from 'lucide-react'

const POST_TYPES: PostType[] = ['poem', 'shayari', 'ghazal', 'haiku', 'free_verse', 'quote', 'other']

type TabType = 'all' | 'poets' | 'poems'

function ExploreContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialTab = (searchParams.get('tab') as TabType) || 'all'
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [typeFilter, setTypeFilter] = useState<PostType | ''>(
    (searchParams.get('type') as PostType) ?? ''
  )
  const [languageFilter, setLanguageFilter] = useState(searchParams.get('lang') ?? '')
  const [tagFilter, setTagFilter] = useState(searchParams.get('tag') ?? '')

  // Post results
  const [postResults, setPostResults] = useState<PostWithAuthor[]>([])
  // Poet results
  const [poetResults, setPoetResults] = useState<Profile[]>([])
  // Suggested poets when query is blank
  const [suggestedPoets, setSuggestedPoets] = useState<Profile[]>([])

  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [loadingPosts, setLoadingPosts] = useState(false)
  const [loadingPoets, setLoadingPoets] = useState(false)
  const [loadingSuggested, setLoadingSuggested] = useState(false)
  const [searched, setSearched] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  // Helper to fetch follow states for a list of profiles
  const checkFollowStates = useCallback(
    async (profiles: Profile[], userId: string | null) => {
      if (!userId || profiles.length === 0) return
      const targetIds = profiles.map((p) => p.id)
      try {
        const { data, error } = await sb
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId)
          .in('following_id', targetIds)

        if (!error && data) {
          const followingSet = new Set(data.map((f: { following_id: string }) => f.following_id))
          const map: Record<string, boolean> = {}
          targetIds.forEach((id) => {
            map[id] = followingSet.has(id)
          })
          setFollowingMap((prev) => ({ ...prev, ...map }))
        }
      } catch (err) {
        console.error('Error checking follow states:', err)
      }
    },
    [sb]
  )

  // Load current user and initial suggested poets
  useEffect(() => {
    let isMounted = true

    const loadSuggestedPoets = async () => {
      setLoadingSuggested(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        const uid = user?.id || null
        if (isMounted) setCurrentUserId(uid)

        const { data, error } = await sb
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(12)

        if (!error && data && isMounted) {
          const profiles = data as Profile[]
          setSuggestedPoets(profiles)
          if (uid) {
            checkFollowStates(profiles, uid)
          }
        }
      } catch (err) {
        console.error('Error loading suggested poets:', err)
      } finally {
        if (isMounted) setLoadingSuggested(false)
      }
    }

    loadSuggestedPoets()
    return () => {
      isMounted = false
    }
  }, [supabase, sb, checkFollowStates])

  // Re-verify follow states whenever currentUserId or suggestedPoets becomes available
  useEffect(() => {
    if (currentUserId && suggestedPoets.length > 0) {
      checkFollowStates(suggestedPoets, currentUserId)
    }
  }, [currentUserId, suggestedPoets, checkFollowStates])

  // Listen to global follow events so all explore cards stay synchronized
  useEffect(() => {
    const handleGlobalFollowChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ targetUserId: string; isFollowing: boolean }>
      if (customEvent.detail) {
        setFollowingMap((prev) => ({
          ...prev,
          [customEvent.detail.targetUserId]: customEvent.detail.isFollowing,
        }))
      }
    }

    window.addEventListener('user-follow-changed', handleGlobalFollowChange)
    return () => {
      window.removeEventListener('user-follow-changed', handleGlobalFollowChange)
    }
  }, [])

  // Search posts
  const searchPosts = useCallback(
    async (q: string, type: string, lang: string, tag: string) => {
      setLoadingPosts(true)

      let dbQuery = sb
        .from('posts')
        .select('*, profiles(*)')
        .eq('status', 'published')

      if (q.trim()) {
        const cleanQ = q.trim().replace(/^@/, '')
        dbQuery = dbQuery.or(
          `title.ilike.%${cleanQ}%,body.ilike.%${cleanQ}%,tags.cs.{${cleanQ.toLowerCase()}}`
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
      const posts = (data as PostWithAuthor[]) ?? []

      if (posts.length === 0) {
        setPostResults([])
        setLoadingPosts(false)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      const postIds = posts.map((p) => p.id)

      const [likesRes, userLikesRes, commentsRes] = await Promise.all([
        sb
          .from('likes')
          .select('post_id, created_at, profiles(id, username, display_name, avatar_url)')
          .in('post_id', postIds)
          .order('created_at', { ascending: false }),
        user
          ? sb.from('likes').select('post_id').in('post_id', postIds).eq('user_id', user.id)
          : Promise.resolve({ data: [] }),
        sb.from('comments').select('post_id').in('post_id', postIds),
      ])

      const likesMap: Record<string, number> = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const firstLikerMap: Record<string, any> = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(likesRes.data ?? []).forEach((l: { post_id: string; profiles?: any }) => {
        likesMap[l.post_id] = (likesMap[l.post_id] ?? 0) + 1
        if (!firstLikerMap[l.post_id] && l.profiles) {
          firstLikerMap[l.post_id] = l.profiles
        }
      })

      const userLikedSet = new Set(
        (userLikesRes.data ?? []).map((l: { post_id: string }) => l.post_id)
      )

      const commentsMap: Record<string, number> = {}
      ;(commentsRes.data ?? []).forEach((c: { post_id: string }) => {
        commentsMap[c.post_id] = (commentsMap[c.post_id] ?? 0) + 1
      })

      const enriched = posts.map((p) => ({
        ...p,
        likes_count: likesMap[p.id] ?? 0,
        first_liker: firstLikerMap[p.id] ?? null,
        comments_count: commentsMap[p.id] ?? 0,
        user_has_liked: userLikedSet.has(p.id),
      }))

      setPostResults(enriched)
      setLoadingPosts(false)
    },
    [supabase, sb]
  )

  // Search poets by username or display name
  const searchPoets = useCallback(
    async (q: string) => {
      const clean = q.trim().replace(/^@/, '')
      if (!clean) {
        setPoetResults([])
        return
      }

      setLoadingPoets(true)
      try {
        const { data, error } = await sb
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${clean}%,display_name.ilike.%${clean}%`)
          .order('created_at', { ascending: false })
          .limit(30)

        if (error) throw error
        const profiles = (data as Profile[]) ?? []
        setPoetResults(profiles)

        // Check follow states
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          checkFollowStates(profiles, user.id)
        }
      } catch (err) {
        console.error('Error searching poets:', err)
        setPoetResults([])
      } finally {
        setLoadingPoets(false)
      }
    },
    [supabase, sb, checkFollowStates]
  )

  // Combined search executor
  const doSearch = useCallback(
    (q: string, type: string, lang: string, tag: string) => {
      setSearched(true)
      searchPosts(q, type, lang, tag)
      searchPoets(q)
    },
    [searchPosts, searchPoets]
  )

  // Run search on mount if URL params are present
  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    const type = searchParams.get('type') ?? ''
    const lang = searchParams.get('lang') ?? ''
    const tag = searchParams.get('tag') ?? ''
    const tabParam = (searchParams.get('tab') as TabType) ?? 'all'

    setActiveTab(tabParam)

    if (q || type || lang || tag) {
      setQuery(q)
      setTypeFilter((type as PostType) || '')
      setLanguageFilter(lang)
      setTagFilter(tag)
      doSearch(q, type, lang, tag)
    }
  }, [searchParams, doSearch])

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (activeTab !== 'all') params.set('tab', activeTab)
    if (typeFilter) params.set('type', typeFilter)
    if (languageFilter) params.set('lang', languageFilter)
    if (tagFilter) params.set('tag', tagFilter)

    router.push(`/explore?${params.toString()}`, { scroll: false })
    doSearch(query, typeFilter, languageFilter, tagFilter)
  }

  // Switch tab and update URL
  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab)
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (newTab !== 'all') params.set('tab', newTab)
    if (typeFilter) params.set('type', typeFilter)
    if (languageFilter) params.set('lang', languageFilter)
    if (tagFilter) params.set('tag', tagFilter)
    router.push(`/explore?${params.toString()}`, { scroll: false })
  }

  // Clear all filters
  const clearFilters = () => {
    setQuery('')
    setTypeFilter('')
    setLanguageFilter('')
    setTagFilter('')
    router.push(activeTab === 'all' ? '/explore' : `/explore?tab=${activeTab}`)
    setPostResults([])
    setPoetResults([])
    setSearched(false)
  }

  const hasFilters = query || typeFilter || languageFilter || tagFilter
  const isPoetSearch = query.trim().startsWith('@')

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]"
            style={{ fontFamily: 'Lora, Georgia, serif' }}
          >
            Explore
          </h1>
          <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Discover poetry, shayari, and connect with fellow poets by username
          </p>
        </div>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeTab === 'poets'
                  ? 'Search poets by @username or name...'
                  : activeTab === 'poems'
                  ? 'Search poems, shayari, tags…'
                  : 'Search poems, shayari, or @username…'
              }
              className="w-full pl-10 pr-10 py-2.5 bg-[hsl(var(--input)/0.5)] border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] placeholder:text-[hsl(var(--muted-foreground))] transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] rounded-md"
                aria-label="Clear input"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {activeTab !== 'poets' && (
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl border transition-colors ${
                showFilters
                  ? 'bg-[hsl(var(--accent))] border-[hsl(var(--primary)/0.4)] text-[hsl(var(--primary))]'
                  : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))]'
              }`}
              title="Filter poems"
              aria-label="Filters"
            >
              <SlidersHorizontal size={18} />
            </button>
          )}

          <button
            type="submit"
            className="px-5 py-2.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
          >
            Search
          </button>
        </div>

        {/* Form and Language Filters (if toggled) */}
        {showFilters && activeTab !== 'poets' && (
          <div className="mt-3 flex flex-wrap gap-3 p-3.5 bg-[hsl(var(--muted)/0.5)] rounded-xl border border-[hsl(var(--border))] animate-fade-in">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as PostType | '')}
              className="px-3 py-1.5 text-sm bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            >
              <option value="">All literary forms</option>
              {POST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {POST_TYPE_LABELS[t]}
                </option>
              ))}
            </select>

            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="px-3 py-1.5 text-sm bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
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

      {/* Tabs: All | Poets | Poems */}
      <div className="flex items-center gap-1 sm:gap-2 mb-6 border-b border-[hsl(var(--border))] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'all'
              ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm'
              : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
          }`}
        >
          <Sparkles size={15} />
          <span>All</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('poets')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'poets'
              ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm'
              : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
          }`}
        >
          <Users size={15} />
          <span>Poets</span>
          {searched && poetResults.length > 0 && (
            <span className="text-xs px-1.5 py-0.2 bg-black/20 dark:bg-white/20 rounded-full tabular-nums">
              {poetResults.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('poems')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'poems'
              ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm'
              : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
          }`}
        >
          <BookOpen size={15} />
          <span>Poems</span>
          {searched && postResults.length > 0 && (
            <span className="text-xs px-1.5 py-0.2 bg-black/20 dark:bg-white/20 rounded-full tabular-nums">
              {postResults.length}
            </span>
          )}
        </button>
      </div>

      {/* Active filters pill badge list */}
      {hasFilters && (
        <div className="flex items-center flex-wrap gap-2 mb-5">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">Active:</span>
          {query && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-mono">
              &quot;{query}&quot;
            </span>
          )}
          {typeFilter && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
              {POST_TYPE_LABELS[typeFilter]}
            </span>
          )}
          {languageFilter && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
              {languageFilter}
            </span>
          )}
          {tagFilter && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
              #{tagFilter}
            </span>
          )}
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-red-500 ml-1 transition-colors"
          >
            <X size={12} /> Clear all
          </button>
        </div>
      )}

      {/* Helpful hint if query looks like a username while on Poems tab */}
      {isPoetSearch && activeTab === 'poems' && (
        <div className="mb-6 p-3 rounded-xl border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.05)] flex items-center justify-between gap-3 text-xs sm:text-sm animate-fade-in">
          <span>Looking for poet <strong>{query}</strong>?</span>
          <button
            onClick={() => handleTabChange('poets')}
            className="px-3 py-1 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium text-xs hover:opacity-90 transition-opacity"
          >
            Search in Poets ➔
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW: POETS TAB                                           */}
      {/* ========================================================= */}
      {activeTab === 'poets' && (
        <div className="space-y-4">
          {loadingPoets ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-[hsl(var(--primary))]" />
            </div>
          ) : searched ? (
            poetResults.length === 0 ? (
              <div className="text-center py-16 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6">
                <Users size={36} className="mx-auto text-[hsl(var(--muted-foreground))] opacity-30 mb-3" />
                <h3 className="text-base font-semibold mb-1">No poets found</h3>
                <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] max-w-sm mx-auto">
                  We couldn&apos;t find any users matching &quot;{query}&quot;. Try searching by their exact @username or display name.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium">
                  {poetResults.length} poet{poetResults.length !== 1 ? 's' : ''} found
                </p>
                <div className="grid gap-3">
                  {poetResults.map((profile) => (
                    <UserCard
                      key={profile.id}
                      profile={profile}
                      initialIsFollowing={followingMap[profile.id] ?? false}
                      currentUserId={currentUserId}
                      onFollowChange={(nextFollowing) => {
                        setFollowingMap((prev) => ({ ...prev, [profile.id]: nextFollowing }))
                      }}
                    />
                  ))}
                </div>
              </div>
            )
          ) : (
            /* Blank state: Discover Poets */
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  Discover Poets & Writers
                </h2>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Recent members</span>
              </div>

              {loadingSuggested ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-[hsl(var(--primary))]" />
                </div>
              ) : suggestedPoets.length === 0 ? (
                <p className="text-xs text-[hsl(var(--muted-foreground))] py-6 text-center">
                  No poets registered yet.
                </p>
              ) : (
                <div className="grid gap-3">
                  {suggestedPoets.map((profile) => (
                    <UserCard
                      key={profile.id}
                      profile={profile}
                      initialIsFollowing={followingMap[profile.id] ?? false}
                      currentUserId={currentUserId}
                      onFollowChange={(nextFollowing) => {
                        setFollowingMap((prev) => ({ ...prev, [profile.id]: nextFollowing }))
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW: POEMS TAB                                           */}
      {/* ========================================================= */}
      {activeTab === 'poems' && (
        <div>
          {loadingPosts ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          ) : searched ? (
            postResults.length === 0 ? (
              <div className="text-center py-16 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6">
                <BookOpen size={36} className="mx-auto text-[hsl(var(--muted-foreground))] opacity-30 mb-3" />
                <h3 className="text-base font-semibold mb-1">No poetry found</h3>
                <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
                  Try different keywords or clear your active filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium">
                  {postResults.length} result{postResults.length !== 1 ? 's' : ''} found
                </p>
                {postResults.map((post) => (
                  <PostCard key={post.id} post={post} currentUserId={currentUserId} />
                ))}
              </div>
            )
          ) : (
            /* Discovery Prompts */
            <div className="mt-4 space-y-6">
              <div>
                <h2 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-3">
                  Browse by literary form
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
                      className="px-3 py-1.5 text-xs sm:text-sm rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--accent))] hover:border-[hsl(var(--primary)/0.4)] transition-all"
                    >
                      {POST_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-3">
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
                      className="px-3 py-1.5 text-xs sm:text-sm rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--accent))] hover:border-[hsl(var(--primary)/0.4)] transition-all"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW: ALL TAB (COMBINED)                                  */}
      {/* ========================================================= */}
      {activeTab === 'all' && (
        <div className="space-y-8">
          {/* Loading state */}
          {loadingPosts || loadingPoets ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-[hsl(var(--primary))]" />
              </div>
              {[1, 2].map((i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          ) : searched ? (
            poetResults.length === 0 && postResults.length === 0 ? (
              <div className="text-center py-16 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6">
                <Search size={36} className="mx-auto text-[hsl(var(--muted-foreground))] opacity-30 mb-3" />
                <h3 className="text-base font-semibold mb-1">No matching results</h3>
                <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] max-w-sm mx-auto">
                  No poets or poems matched &quot;{query}&quot;. Try searching for an @username or different keywords.
                </p>
              </div>
            ) : (
              <>
                {/* 1. Matching Poets Section (if any found) */}
                {poetResults.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-[hsl(var(--primary))]" />
                        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                          Matching Poets ({poetResults.length})
                        </h2>
                      </div>
                      {poetResults.length > 3 && (
                        <button
                          onClick={() => handleTabChange('poets')}
                          className="text-xs font-medium text-[hsl(var(--primary))] hover:underline"
                        >
                          View all {poetResults.length} poets ➔
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3">
                      {poetResults.slice(0, 3).map((profile) => (
                        <UserCard
                          key={profile.id}
                          profile={profile}
                          initialIsFollowing={followingMap[profile.id] ?? false}
                          currentUserId={currentUserId}
                          onFollowChange={(nextFollowing) => {
                            setFollowingMap((prev) => ({ ...prev, [profile.id]: nextFollowing }))
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Matching Poems Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-[hsl(var(--primary))]" />
                    <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                      Matching Poetry ({postResults.length})
                    </h2>
                  </div>

                  {postResults.length === 0 ? (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] py-4">
                      No poems found matching &quot;{query}&quot;.
                    </p>
                  ) : (
                    postResults.map((post) => <PostCard key={post.id} post={post} currentUserId={currentUserId} />)
                  )}
                </div>
              </>
            )
          ) : (
            /* Blank state in ALL: Show both discover poets + literary forms */
            <div className="space-y-8">
              {/* Discover Poets snippet */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-[hsl(var(--primary))]" />
                    <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                      Discover Poets
                    </h2>
                  </div>
                  <button
                    onClick={() => handleTabChange('poets')}
                    className="text-xs text-[hsl(var(--primary))] hover:underline font-medium"
                  >
                    View all ➔
                  </button>
                </div>

                {loadingSuggested ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 size={18} className="animate-spin text-[hsl(var(--primary))]" />
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {suggestedPoets.slice(0, 3).map((profile) => (
                      <UserCard
                        key={profile.id}
                        profile={profile}
                        initialIsFollowing={followingMap[profile.id] ?? false}
                        currentUserId={currentUserId}
                        onFollowChange={(nextFollowing) => {
                          setFollowingMap((prev) => ({ ...prev, [profile.id]: nextFollowing }))
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Browse by Form & Language */}
              <div>
                <h2 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-3">
                  Browse by literary form
                </h2>
                <div className="flex flex-wrap gap-2">
                  {POST_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTypeFilter(t)
                        setShowFilters(true)
                        handleTabChange('poems')
                        doSearch('', t, '', '')
                      }}
                      className="px-3 py-1.5 text-xs sm:text-sm rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--accent))] hover:border-[hsl(var(--primary)/0.4)] transition-all"
                    >
                      {POST_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-3">
                  Browse by language
                </h2>
                <div className="flex flex-wrap gap-2">
                  {['Hindi', 'Urdu', 'Bengali', 'English', 'Punjabi'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguageFilter(lang)
                        setShowFilters(true)
                        handleTabChange('poems')
                        doSearch('', '', lang, '')
                      }}
                      className="px-3 py-1.5 text-xs sm:text-sm rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--accent))] hover:border-[hsl(var(--primary)/0.4)] transition-all"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
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
