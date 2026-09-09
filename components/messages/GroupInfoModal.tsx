'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Group, GroupMember, Profile } from '@/lib/supabase/types'
import {
  X,
  Users,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Calendar,
  Loader2,
  Camera,
  Edit3,
  Check,
  UserPlus,
  UserMinus,
  Search,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface GroupInfoModalProps {
  group: Group
  members: GroupMember[]
  currentUserId: string
  onClose: () => void
  onGroupUpdated?: (updatedGroup: Group) => void
  onMembersUpdated?: (updatedMembers: GroupMember[]) => void
}

export default function GroupInfoModal({
  group,
  members: initialMembers,
  currentUserId,
  onClose,
  onGroupUpdated,
  onMembersUpdated,
}: GroupInfoModalProps) {
  const router = useRouter()
  const [members, setMembers] = useState<GroupMember[]>(initialMembers)
  const [currentGroup, setCurrentGroup] = useState<Group>(group)

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(group.name)
  const [editDescription, setEditDescription] = useState(group.description ?? '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(group.avatar_url)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Add Member state
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberQuery, setMemberQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null)

  // Action loaders
  const [roleLoadingId, setRoleLoadingId] = useState<string | null>(null)
  const [removeLoadingId, setRemoveLoadingId] = useState<string | null>(null)
  const [leaving, setLeaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  // Check if current user is an admin or creator
  const isAdmin =
    members.some((m) => m.user_id === currentUserId && m.role === 'admin') ||
    currentGroup.created_by === currentUserId

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  // Save Group Details (Name, Photo, Description)
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = editName.trim()
    if (!trimmedName) {
      setEditError('Group name cannot be empty')
      return
    }

    setSavingEdit(true)
    setEditError(null)

    try {
      let finalAvatarUrl = currentGroup.avatar_url

      // Upload new avatar if selected
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const path = `groups/${currentGroup.id}/avatar-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        finalAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`
      }

      // Update group in Supabase
      const { data: updatedData, error: updateError } = await sb
        .from('groups')
        .update({
          name: trimmedName,
          description: editDescription.trim() || null,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentGroup.id)
        .select('*')
        .single()

      if (updateError) throw updateError

      const updatedGroup = updatedData as Group
      setCurrentGroup(updatedGroup)
      onGroupUpdated?.(updatedGroup)
      setIsEditing(false)

      // Post update notification message
      if (trimmedName !== currentGroup.name && avatarFile) {
        await sb.from('group_messages').insert({
          group_id: currentGroup.id,
          sender_id: currentUserId,
          body: `[system]:name_and_photo|${trimmedName}`,
        })
      } else if (trimmedName !== currentGroup.name) {
        await sb.from('group_messages').insert({
          group_id: currentGroup.id,
          sender_id: currentUserId,
          body: `[system]:name|${trimmedName}`,
        })
      } else if (avatarFile) {
        await sb.from('group_messages').insert({
          group_id: currentGroup.id,
          sender_id: currentUserId,
          body: `[system]:photo`,
        })
      } else if (editDescription.trim() !== (currentGroup.description || '')) {
        await sb.from('group_messages').insert({
          group_id: currentGroup.id,
          sender_id: currentUserId,
          body: `[system]:desc`,
        })
      }
    } catch (err: unknown) {
      console.error('Error updating group:', err)
      setEditError(err instanceof Error ? err.message : 'Failed to update group')
    } finally {
      setSavingEdit(false)
    }
  }

  // Toggle Admin Role
  const handleToggleAdmin = async (targetMember: GroupMember) => {
    const newRole = targetMember.role === 'admin' ? 'member' : 'admin'
    setRoleLoadingId(targetMember.user_id)

    try {
      const { error } = await sb
        .from('group_members')
        .update({ role: newRole })
        .eq('group_id', currentGroup.id)
        .eq('user_id', targetMember.user_id)

      if (error) throw error

      const updatedList = members.map((m) =>
        m.user_id === targetMember.user_id ? { ...m, role: newRole as 'admin' | 'member' } : m
      )
      setMembers(updatedList)
      onMembersUpdated?.(updatedList)

      // Post message in group
      const targetName = targetMember.profiles?.display_name || 'Member'
      await sb.from('group_messages').insert({
        group_id: currentGroup.id,
        sender_id: currentUserId,
        body:
          newRole === 'admin'
            ? `[system]:admin_promote|${targetMember.user_id}|${targetName}`
            : `[system]:admin_demote|${targetMember.user_id}|${targetName}`,
      })
    } catch (err) {
      console.error('Error changing admin role:', err)
      alert('Could not update role. Please ensure you have admin permissions.')
    } finally {
      setRoleLoadingId(null)
    }
  }

  // Remove Member from Group
  const handleRemoveMember = async (targetMember: GroupMember) => {
    const targetName = targetMember.profiles?.display_name || 'Member'
    if (!confirm(`Remove ${targetName} from "${currentGroup.name}"?`)) return

    setRemoveLoadingId(targetMember.user_id)
    try {
      const { error } = await sb
        .from('group_members')
        .delete()
        .eq('group_id', currentGroup.id)
        .eq('user_id', targetMember.user_id)

      if (error) throw error

      const updatedList = members.filter((m) => m.user_id !== targetMember.user_id)
      setMembers(updatedList)
      onMembersUpdated?.(updatedList)

      await sb.from('group_messages').insert({
        group_id: currentGroup.id,
        sender_id: currentUserId,
        body: `[system]:member_remove|${targetMember.user_id}|${targetName}`,
      })
    } catch (err) {
      console.error('Error removing member:', err)
      alert('Could not remove member.')
    } finally {
      setRemoveLoadingId(null)
    }
  }

  // Search members to add
  const handleSearchPoets = async (val: string) => {
    setMemberQuery(val)
    const clean = val.trim().replace(/^@/, '')
    if (!clean) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const existingUserIds = members.map((m) => m.user_id)
      const { data } = await sb
        .from('profiles')
        .select('*')
        .not('id', 'in', `(${existingUserIds.join(',')})`)
        .or(`username.ilike.%${clean}%,display_name.ilike.%${clean}%`)
        .limit(8)

      setSearchResults((data as Profile[]) ?? [])
    } catch (err) {
      console.error('Error searching poets to add:', err)
    } finally {
      setSearching(false)
    }
  }

  // Add new member to group
  const handleAddMember = async (profile: Profile) => {
    setAddingMemberId(profile.id)
    try {
      const { data, error } = await sb
        .from('group_members')
        .insert({
          group_id: currentGroup.id,
          user_id: profile.id,
          role: 'member',
        })
        .select('*, profiles(*)')
        .single()

      if (error) throw error

      const newMemberRow: GroupMember = data ? (data as GroupMember) : {
        id: crypto.randomUUID(),
        group_id: currentGroup.id,
        user_id: profile.id,
        role: 'member',
        joined_at: new Date().toISOString(),
        profiles: profile,
      }

      const updatedList = [...members, newMemberRow]
      setMembers(updatedList)
      onMembersUpdated?.(updatedList)
      setSearchResults((prev) => prev.filter((p) => p.id !== profile.id))

      await sb.from('group_messages').insert({
        group_id: currentGroup.id,
        sender_id: currentUserId,
        body: `[system]:member_add|${profile.id}|${profile.display_name}`,
      })
    } catch (err) {
      console.error('Error adding member:', err)
      alert('Could not add member.')
    } finally {
      setAddingMemberId(null)
    }
  }

  // Leave Group
  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this Poetry Circle?')) return

    setLeaving(true)
    try {
      await sb
        .from('group_members')
        .delete()
        .eq('group_id', currentGroup.id)
        .eq('user_id', currentUserId)

      await sb.from('group_messages').insert({
        group_id: currentGroup.id,
        sender_id: currentUserId,
        body: `[system]:member_leave`,
      })

      onClose()
      router.push('/messages')
      router.refresh()
    } catch (err) {
      console.error('Error leaving group:', err)
      alert('Could not leave circle.')
    } finally {
      setLeaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Close */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            {isEditing ? 'Edit Circle Details' : 'Circle Info'}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* ========================================================= */}
        {/* EDIT DETAILS VIEW                                         */}
        {/* ========================================================= */}
        {isEditing ? (
          <form onSubmit={handleSaveDetails} className="p-6 space-y-4 overflow-y-auto">
            {editError && (
              <div className="p-3 rounded-xl text-xs bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
                {editError}
              </div>
            )}

            {/* Photo upload */}
            <div className="flex flex-col items-center justify-center gap-2 mb-2">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt={editName}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-[hsl(var(--primary)/0.4)] shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.6)] text-[hsl(var(--primary-foreground))] flex items-center justify-center shadow-md">
                    <Users size={32} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={22} className="text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-[hsl(var(--primary))] hover:underline font-medium"
              >
                Change Circle Photo
              </button>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase mb-1">
                Circle Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--input)/0.5)] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase mb-1">
                Description / Topic
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                placeholder="What is this poetry circle about?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--input)/0.5)] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[hsl(var(--border))]">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setEditName(currentGroup.name)
                  setEditDescription(currentGroup.description ?? '')
                  setAvatarPreview(currentGroup.avatar_url)
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="flex items-center gap-1.5 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {savingEdit ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={13} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* ========================================================= */
          /* MAIN INFO & MEMBERS VIEW                                  */
          /* ========================================================= */
          <div className="flex-1 overflow-y-auto">
            {/* Header Hero */}
            <div className="p-6 bg-gradient-to-b from-[hsl(var(--primary)/0.12)] to-transparent border-b border-[hsl(var(--border))] text-center">
              <div className="relative inline-block mb-3">
                {currentGroup.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentGroup.avatar_url}
                    alt={currentGroup.name}
                    className="w-18 h-18 rounded-2xl object-cover mx-auto shadow-md border-2 border-[hsl(var(--border))]"
                  />
                ) : (
                  <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.6)] text-[hsl(var(--primary-foreground))] flex items-center justify-center mx-auto shadow-md">
                    <Users size={32} />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-2">
                <h2
                  className="text-xl font-bold text-[hsl(var(--foreground))]"
                  style={{ fontFamily: 'Lora, Georgia, serif' }}
                >
                  {currentGroup.name}
                </h2>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))] transition-colors"
                    title="Edit circle details"
                  >
                    <Edit3 size={15} />
                  </button>
                )}
              </div>

              {currentGroup.description && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1.5 max-w-xs mx-auto italic">
                  &ldquo;{currentGroup.description}&rdquo;
                </p>
              )}

              <div className="flex items-center justify-center gap-1 text-[11px] text-[hsl(var(--muted-foreground))] mt-2.5">
                <Calendar size={12} />
                <span>Created {formatDate(currentGroup.created_at)}</span>
              </div>
            </div>

            {/* Members Section */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Members ({members.length})
                </span>

                {isAdmin && (
                  <button
                    onClick={() => setShowAddMember(!showAddMember)}
                    className="inline-flex items-center gap-1 text-xs text-[hsl(var(--primary))] font-medium hover:underline"
                  >
                    <UserPlus size={13} />
                    <span>{showAddMember ? 'Cancel' : 'Add Member'}</span>
                  </button>
                )}
              </div>

              {/* Add Member Search Input */}
              {showAddMember && (
                <div className="mb-4 p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)] animate-fade-in">
                  <div className="relative mb-2">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
                    />
                    <input
                      type="text"
                      value={memberQuery}
                      onChange={(e) => handleSearchPoets(e.target.value)}
                      placeholder="Search poets by @username..."
                      autoFocus
                      className="w-full pl-8 pr-4 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-xs focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
                    />
                    {searching && (
                      <Loader2
                        size={13}
                        className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[hsl(var(--primary))]"
                      />
                    )}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="divide-y divide-[hsl(var(--border)/0.5)] border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))] max-h-36 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-2 hover:bg-[hsl(var(--accent))]"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[hsl(var(--foreground))] truncate">
                              {user.display_name}
                            </p>
                            <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">
                              @{user.username}
                            </p>
                          </div>
                          <button
                            onClick={() => handleAddMember(user)}
                            disabled={addingMemberId === user.id}
                            className="px-2.5 py-1 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-[11px] font-medium hover:opacity-90 disabled:opacity-50"
                          >
                            {addingMemberId === user.id ? 'Adding...' : 'Add'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Members Roster */}
              <div className="divide-y divide-[hsl(var(--border)/0.5)]">
                {members.map((m) => {
                  const p = m.profiles
                  if (!p) return null
                  const isMemberSelf = p.id === currentUserId
                  const isMemberAdmin = m.role === 'admin' || p.id === currentGroup.created_by
                  const isCreator = p.id === currentGroup.created_by

                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between py-2.5 px-2 hover:bg-[hsl(var(--accent)/0.5)] rounded-xl transition-colors group"
                    >
                      {/* Profile Link */}
                      <Link
                        href={`/u/${p.username}`}
                        onClick={onClose}
                        className="flex items-center gap-2.5 min-w-0 flex-1"
                      >
                        {p.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.avatar_url}
                            alt={p.display_name}
                            className="w-9 h-9 rounded-full object-cover shrink-0 border border-[hsl(var(--border))]"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] flex items-center justify-center text-xs font-bold shrink-0">
                            {p.display_name?.slice(0, 2).toUpperCase() || 'QA'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-[hsl(var(--foreground))] truncate">
                              {p.display_name}
                            </span>
                            {isMemberSelf && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[hsl(var(--muted-foreground))] font-mono truncate">
                            @{p.username}
                          </span>
                        </div>
                      </Link>

                      {/* Role & Admin Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {/* Admin Badge */}
                        {isMemberAdmin && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.2)]">
                            <ShieldCheck size={11} /> {isCreator ? 'Owner' : 'Admin'}
                          </span>
                        )}

                        {/* Admin Action Menu for other members */}
                        {isAdmin && !isMemberSelf && (
                          <div className="flex items-center gap-1">
                            {/* Make Admin / Dismiss Admin */}
                            {!isCreator && (
                              <button
                                onClick={() => handleToggleAdmin(m)}
                                disabled={roleLoadingId === m.user_id}
                                className={`p-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                                  m.role === 'admin'
                                    ? 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                                    : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))]'
                                }`}
                                title={m.role === 'admin' ? 'Dismiss as admin' : 'Make admin'}
                              >
                                {roleLoadingId === m.user_id ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : m.role === 'admin' ? (
                                  <ShieldAlert size={13} />
                                ) : (
                                  <ShieldCheck size={13} />
                                )}
                              </button>
                            )}

                            {/* Remove Member */}
                            {!isCreator && (
                              <button
                                onClick={() => handleRemoveMember(m)}
                                disabled={removeLoadingId === m.user_id}
                                className="p-1.5 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                title="Remove from circle"
                              >
                                {removeLoadingId === m.user_id ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <UserMinus size={13} />
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.2)] flex items-center justify-between">
              <button
                onClick={handleLeaveGroup}
                disabled={leaving}
                className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
              >
                {leaving ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <LogOut size={13} />
                )}
                <span>Leave Circle</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl border border-[hsl(var(--border))] text-xs font-medium hover:bg-[hsl(var(--accent))] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
