import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  validateFile,
  generateUploadPath,
  validateUploadPath,
  type BucketName,
} from '@/lib/fileValidation'
import { rateLimit } from '@/lib/rateLimit'
import { getClientIdentifier } from '@/lib/getClientIdentifier'

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(req)
    const rateLimitResult = await rateLimit(identifier, 'upload')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many upload requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      )
    }

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

    // Validate bucket
    if (bucket !== 'avatars' && bucket !== 'covers' && bucket !== 'chat_media') {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
    }

    // Validate file (size, type, magic numbers)
    const validation = await validateFile(file, bucket as BucketName)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Determine upload destination path
    let uploadPath: string
    if (customPath) {
      // Validate custom path for security
      const pathValidation = validateUploadPath(customPath, user.id)
      if (!pathValidation.valid) {
        return NextResponse.json({ error: pathValidation.error }, { status: 403 })
      }
      uploadPath = customPath
    } else {
      // Generate safe upload path
      const prefix = bucket === 'covers' ? 'cover' : 'avatar'
      const pathResult = generateUploadPath(
        user.id,
        validation.sanitizedFilename || file.name,
        prefix
      )
      if (pathResult.error) {
        return NextResponse.json({ error: pathResult.error }, { status: 400 })
      }
      uploadPath = pathResult.path
    }

    const adminSupabase = await createAdminClient()
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await adminSupabase.storage
      .from(bucket)
      .upload(uploadPath, buffer, {
        contentType: validation.detectedType || 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', { bucket, path: uploadPath, error: uploadError.message })
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const { data: urlData } = adminSupabase.storage.from(bucket).getPublicUrl(uploadPath)
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

    return NextResponse.json({ url: publicUrl, path: uploadPath })
  } catch (err: unknown) {
    console.error('Profile upload error:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
