'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'
import { X, Users, Search, Plus, Check, Loader2, Camera } from 'lucide-react'

interface CreateGroupModalProps {
  currentUserId: string
  onClose: () => void
}

export default function CreateGroupModal({
  currentUserId,
  onClose,
}: CreateGroupModalProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [memberSearch, setMemberSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [selectedMembers, setSelectedMembers] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Real-time search for poets by username or display name
  useEffect(() => {
    const clean = memberSearch.trim().replace(/^@/, '')
    if (!clean) {
      setSearchResults([])
      setSearching(false)
      return
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    setSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data } = await sb
          .from('profiles')
          .select('*')
          .neq('id', currentUserId)
          .or(`username.ilike.%${clean}%,display_name.ilike.%${clean}%`)
          .limit(10)

        setSearchResults((data as Profile[]) ?? [])
      } catch (err) {
        console.error('Error searching members:', err)
      } finally {
        setSearching(false)
      }
    }, 250)

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [memberSearch, currentUserId, sb])

  const toggleSelectMember = (profile: Profile) => {
    if (selectedMembers.some((m) => m.id === profile.id)) {
      setSelectedMembers((prev) => prev.filter((m) => m.id !== profile.id))
    } else {
      setSelectedMembers((prev) => [...prev, profile])
      setMemberSearch('')
      setSearchResults([])
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Please provide a group name')
      return
    }

    setCreating(true)
    setError(null)

    try {
      let finalAvatarUrl: string | null = null
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const path = `groups/${crypto.randomUUID()}/avatar-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true })

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
          finalAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`
        }
      }

      // 1. Create group
      const { data: newGroup, error: groupErr } = await sb
        .from('groups')
        .insert({
          name: trimmedName,
          description: description.trim() || null,
          avatar_url: finalAvatarUrl,
          created_by: currentUserId,
        })
        .select('*')
        .single()

      if (groupErr || !newGroup) throw groupErr || new Error('Failed to create group')

      // 2. Add creator as admin
      const memberInserts = [
        {
          group_id: newGroup.id,
          user_id: currentUserId,
          role: 'admin',
        },
        ...selectedMembers.map((m) => ({
          group_id: newGroup.id,
          user_id: m.id,
          role: 'member',
        })),
      ]

      const { error: membersErr } = await sb
        .from('group_members')
        .insert(memberInserts)

      if (membersErr) throw membersErr

      // 3. Add initial welcome message
      await sb.from('group_messages').insert({
        group_id: newGroup.id,
        sender_id: currentUserId,
        body: `[system]:create|${trimmedName}`,
      })

      onClose()
      router.push(`/messages/group/${newGroup.id}`)
      router.refresh()
    } catch (err: unknown) {
      console.error('Error creating group:', err)
      setError(err instanceof Error ? err.message : 'Failed to create group. Please check database tables.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
              <Users size={20} />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-[hsl(var(--foreground))]"
                style={{ fontFamily: 'Lora, Georgia, serif' }}
              >
                Create Poetry Group
              </h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Start a group chat for poetry, shayari, or literary discussions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl text-xs bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Optional Group Photo Picker */}
          <div className="flex flex-col items-center justify-center gap-1.5 pb-2 border-b border-[hsl(var(--border)/0.5)]">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[hsl(var(--primary)/0.4)] shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--muted))] border-2 border-dashed border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] flex flex-col items-center justify-center group-hover:border-[hsl(var(--primary)/0.5)] transition-colors">
                  <Camera size={20} className="mb-0.5 opacity-60" />
                  <span className="text-[10px]">Add Photo</span>
                </div>
              )}
              {avatarPreview && (
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={18} className="text-white" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setAvatarFile(file)
                  setAvatarPreview(URL.createObjectURL(file))
                }
              }}
              className="hidden"
            />
            {avatarPreview ? (
              <button
                type="button"
                onClick={() => {
                  setAvatarFile(null)
                  setAvatarPreview(null)
                }}
                className="text-[11px] text-red-500 hover:underline"
              >
                Remove Photo
              </button>
            ) : (
              <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Optional Group Photo
              </span>
            )}
          </div>

          {/* Group Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1.5">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Urdu Shayari Group, Ghazal Lovers"
              required
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--input)/0.5)] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1.5">
              Description / Topic (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--input)/0.5)] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            />
          </div>

          {/* Selected Members Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Members ({selectedMembers.length + 1})
              </label>
              <span className="text-xs text-[hsl(var(--muted-foreground))] italic">
                You (Admin) + {selectedMembers.length} added
              </span>
            </div>

            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2.5 p-2 bg-[hsl(var(--muted)/0.4)] rounded-xl border border-[hsl(var(--border))]">
                {selectedMembers.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-xs font-medium text-[hsl(var(--foreground))] shadow-xs"
                  >
                    <span>{m.display_name}</span>
                    <span className="text-[hsl(var(--muted-foreground))] font-mono text-[10px]">
                      @{m.username}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSelectMember(m)}
                      className="p-0.5 rounded-full hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Member Search input */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
              />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search poets to add by @username or name..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--input)/0.5)] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 size={15} className="animate-spin text-[hsl(var(--primary))]" />
                </div>
              )}
            </div>

            {/* Search Dropdown / Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 divide-y divide-[hsl(var(--border)/0.5)] border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--card))] overflow-hidden shadow-md max-h-48 overflow-y-auto">
                {searchResults.map((user) => {
                  const isSelected = selectedMembers.some((m) => m.id === user.id)
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleSelectMember(user)}
                      className="w-full flex items-center justify-between p-2.5 hover:bg-[hsl(var(--accent))] transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {user.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.avatar_url}
                            alt={user.display_name}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] flex items-center justify-center text-xs font-bold shrink-0">
                            {user.display_name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[hsl(var(--foreground))] truncate">
                            {user.display_name}
                          </p>
                          <p className="text-[11px] text-[hsl(var(--muted-foreground))] font-mono truncate">
                            @{user.username}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {isSelected ? (
                          <span className="p-1 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center">
                            <Check size={12} />
                          </span>
                        ) : (
                          <span className="p-1 rounded-full border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] flex items-center justify-center">
                            <Plus size={12} />
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[hsl(var(--border))]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="flex items-center gap-1.5 px-5 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
            >
              {creating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Creating Group...</span>
                </>
              ) : (
                <>
                  <Users size={14} />
                  <span>Create Group ({selectedMembers.length + 1})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
