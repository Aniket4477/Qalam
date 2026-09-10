'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'
import { Loader2, Camera, Save, Crop } from 'lucide-react'
import ImageCropModal from '@/components/ui/ImageCropModal'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Image crop modal state
  const [cropModal, setCropModal] = useState<{
    isOpen: boolean
    imageSrc: string | null
    title: string
    aspectRatio: 'square' | 'cover'
    shape: 'round' | 'rect'
    target: 'avatar' | 'cover'
  }>({
    isOpen: false,
    imageSrc: null,
    title: 'Adjust Photo',
    aspectRatio: 'square',
    shape: 'round',
    target: 'avatar',
  })

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        const p = data as unknown as Profile
        setProfile(p)
        setDisplayName(p.display_name)
        setUsername(p.username)
        setBio(p.bio ?? '')
      }
      setLoading(false)
    }
    loadProfile()
  }, [router, supabase])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const src = URL.createObjectURL(file)
      setCropModal({
        isOpen: true,
        imageSrc: src,
        title: 'Adjust Profile Photo',
        aspectRatio: 'square',
        shape: 'round',
        target: 'avatar',
      })
      e.target.value = ''
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const src = URL.createObjectURL(file)
      setCropModal({
        isOpen: true,
        imageSrc: src,
        title: 'Adjust Cover Photo',
        aspectRatio: 'cover',
        shape: 'rect',
        target: 'cover',
      })
      e.target.value = ''
    }
  }

  const openAdjustPhoto = async (url: string, target: 'avatar' | 'cover') => {
    try {
      // Fetch as blob first to ensure clean canvas origin
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      setCropModal({
        isOpen: true,
        imageSrc: blobUrl,
        title: target === 'avatar' ? 'Adjust Profile Photo' : 'Adjust Cover Photo',
        aspectRatio: target === 'avatar' ? 'square' : 'cover',
        shape: target === 'avatar' ? 'round' : 'rect',
        target,
      })
    } catch {
      setCropModal({
        isOpen: true,
        imageSrc: url,
        title: target === 'avatar' ? 'Adjust Profile Photo' : 'Adjust Cover Photo',
        aspectRatio: target === 'avatar' ? 'square' : 'cover',
        shape: target === 'avatar' ? 'round' : 'rect',
        target,
      })
    }
  }

  const handleCropComplete = (croppedFile: File, previewUrl: string) => {
    if (cropModal.target === 'avatar') {
      setAvatarFile(croppedFile)
      setAvatarPreview(previewUrl)
    } else {
      setCoverFile(croppedFile)
      setCoverPreview(previewUrl)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setError(null)
    setSuccess(false)

    if (!displayName.trim()) {
      setError('Display name is required.')
      setSaving(false)
      return
    }
    if (!username.trim() || !/^[a-z0-9_]{3,30}$/.test(username)) {
      setError('Username must be 3–30 characters, lowercase letters, numbers, and underscores only.')
      setSaving(false)
      return
    }

    let avatarUrl = profile.avatar_url
    let coverUrl = profile.cover_url

    if (avatarFile) {
      try {
        const formData = new FormData()
        formData.append('file', avatarFile)
        formData.append('bucket', 'avatars')
        const res = await fetch('/api/profile/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Failed to upload avatar')
        }
        avatarUrl = data.url
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown upload error'
        setError('Failed to upload avatar: ' + msg)
        setSaving(false)
        return
      }
    }

    if (coverFile) {
      try {
        const formData = new FormData()
        formData.append('file', coverFile)
        formData.append('bucket', 'covers')
        const res = await fetch('/api/profile/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Failed to upload cover')
        }
        coverUrl = data.url
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown upload error'
        setError('Failed to upload cover: ' + msg)
        setSaving(false)
        return
      }
    }

    const updateData = {
      display_name: displayName.trim(),
      username: username.trim(),
      bio: bio.trim() || null,
      avatar_url: avatarUrl,
      cover_url: coverUrl,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from('profiles') as any)
      .update(updateData)
      .eq('id', profile.id)

    if (updateError) {
      setError((updateError as Error).message)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('profile-updated', {
            detail: { ...profile, ...updateData },
          })
        )
      }
      router.refresh()
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-[hsl(var(--muted-foreground))]" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="max-w-xl mx-auto px-4 py-10 animate-fade-in">
      <h1 className="text-2xl font-bold mb-8" style={{ fontFamily: 'Lora, Georgia, serif' }}>
        Settings
      </h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {(avatarPreview ?? profile.avatar_url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview ?? profile.avatar_url!}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-[hsl(var(--border))]"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center text-xl font-bold text-[hsl(var(--primary))] border-2 border-[hsl(var(--border))]">
                {displayName.slice(0, 2).toUpperCase() || '?'}
              </div>
            )}
            <label
              htmlFor="avatarInput"
              className="absolute bottom-0 right-0 w-7 h-7 bg-[hsl(var(--primary))] rounded-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity shadow"
              title="Upload new photo"
            >
              <Camera size={13} className="text-white" />
            </label>
            <input id="avatarInput" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Profile photo</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">JPG, PNG or WebP, max 5MB</p>
            {(avatarPreview ?? profile.avatar_url) && (
              <button
                type="button"
                onClick={() => openAdjustPhoto(avatarPreview ?? profile.avatar_url!, 'avatar')}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                <Crop size={12} />
                <span>Adjust / Crop</span>
              </button>
            )}
          </div>
        </div>

        {/* Cover */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Cover image</label>
            {(coverPreview ?? profile.cover_url) && (
              <button
                type="button"
                onClick={() => openAdjustPhoto(coverPreview ?? profile.cover_url!, 'cover')}
                className="inline-flex items-center gap-1 text-xs text-[hsl(var(--primary))] hover:underline"
              >
                <Crop size={12} />
                <span>Adjust crop</span>
              </button>
            )}
          </div>

          <div className="relative h-32 sm:h-36 rounded-xl overflow-hidden bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--primary)/0.2)] border border-[hsl(var(--border))]">
            {(coverPreview ?? profile.cover_url) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPreview ?? profile.cover_url!} alt="Cover" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-2.5">
              <label htmlFor="coverInput" className="cursor-pointer">
                <div className="bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-colors shadow">
                  <Camera size={13} /> Change cover
                </div>
              </label>
              {(coverPreview ?? profile.cover_url) && (
                <button
                  type="button"
                  onClick={() => openAdjustPhoto(coverPreview ?? profile.cover_url!, 'cover')}
                  className="bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-colors shadow"
                >
                  <Crop size={13} /> Adjust
                </button>
              )}
            </div>
            <input id="coverInput" type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </div>
        </div>

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium mb-1.5">Display name</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            maxLength={64}
            suppressHydrationWarning
            className="w-full px-3 py-2.5 bg-[hsl(var(--input)/0.5)] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          />
        </div>

        <div>
          <label htmlFor="usernameInput" className="block text-sm font-medium mb-1.5">Username</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[hsl(var(--muted-foreground))]">@</span>
            <input
              id="usernameInput"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required
              minLength={3}
              maxLength={30}
              pattern="^[a-z0-9_]+$"
              suppressHydrationWarning
              className="w-full pl-7 pr-3 py-2.5 bg-[hsl(var(--input)/0.5)] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            />
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Lowercase letters, numbers, and underscores. 3–30 characters.
          </p>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium mb-1.5">Bio</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={280}
            placeholder="A few words about yourself or your writing…"
            className="w-full px-3 py-2.5 bg-[hsl(var(--input)/0.5)] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] resize-none placeholder:text-[hsl(var(--muted-foreground))]"
          />
          <p className="text-xs text-[hsl(var(--muted-foreground))] text-right mt-0.5">{bio.length}/280</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 text-sm text-green-700 dark:text-green-300">
            Profile saved successfully ✓
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      {/* Image Crop & Adjustment Modal */}
      <ImageCropModal
        isOpen={cropModal.isOpen}
        imageSrc={cropModal.imageSrc}
        title={cropModal.title}
        aspectRatio={cropModal.aspectRatio}
        shape={cropModal.shape}
        onClose={() => setCropModal((prev) => ({ ...prev, isOpen: false }))}
        onCropComplete={handleCropComplete}
      />
    </div>
  )
}
