import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const bucket = (formData.get('bucket') as string) || 'avatars'
    const customPath = formData.get('path') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (bucket !== 'avatars' && bucket !== 'covers') {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
    }

    // Determine upload destination path
    let uploadPath = customPath
    if (!uploadPath) {
      const ext = file.name.split('.').pop() || 'png'
      const prefix = bucket === 'covers' ? 'cover' : 'avatar'
      uploadPath = `${user.id}/${prefix}.${ext}`
    } else {
      // Security: user can only upload to their own directory or groups directory
      if (!uploadPath.startsWith(`${user.id}/`) && !uploadPath.startsWith('groups/')) {
        return NextResponse.json({ error: 'Forbidden upload path' }, { status: 403 })
      }
    }

    const adminSupabase = await createAdminClient()
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await adminSupabase.storage
      .from(bucket)
      .upload(uploadPath, buffer, {
        contentType: file.type || 'image/png',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = adminSupabase.storage.from(bucket).getPublicUrl(uploadPath)
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

    return NextResponse.json({ url: publicUrl, path: uploadPath })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
