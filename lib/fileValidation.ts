/**
 * File validation utilities for secure file uploads
 */

import { fileTypeFromBuffer } from 'file-type'

// Maximum file sizes per bucket (in bytes)
export const MAX_FILE_SIZES = {
  avatars: 5 * 1024 * 1024, // 5MB
  covers: 10 * 1024 * 1024, // 10MB
  chat_media: 20 * 1024 * 1024, // 20MB
} as const

// Allowed MIME types per bucket
export const ALLOWED_MIME_TYPES = {
  avatars: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ],
  covers: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ],
  chat_media: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
  ],
} as const

// Map file extensions to MIME types
const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  webm: 'video/webm',
}

export type BucketName = keyof typeof MAX_FILE_SIZES

export interface FileValidationResult {
  valid: boolean
  error?: string
  detectedType?: string
  sanitizedFilename?: string
}

/**
 * Validates file size, type, and content
 */
export async function validateFile(
  file: File,
  bucket: BucketName
): Promise<FileValidationResult> {
  // 1. Validate bucket
  if (!MAX_FILE_SIZES[bucket]) {
    return { valid: false, error: 'Invalid bucket' }
  }

  // 2. Validate file size
  const maxSize = MAX_FILE_SIZES[bucket]
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    }
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' }
  }

  // 3. Validate MIME type (client-provided, not fully trusted)
  const allowedTypes = ALLOWED_MIME_TYPES[bucket]
  if (!allowedTypes.includes(file.type as any)) {
    return {
      valid: false,
      error: `File type ${file.type || 'unknown'} not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    }
  }

  // 4. Verify magic numbers (detect actual file type from content)
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const detectedType = await fileTypeFromBuffer(buffer)

    if (!detectedType) {
      return {
        valid: false,
        error: 'Could not determine file type from content',
      }
    }

    // Verify detected type matches allowed types
    if (!allowedTypes.includes(detectedType.mime as any)) {
      return {
        valid: false,
        error: `File content type ${detectedType.mime} does not match allowed types`,
      }
    }

    // 5. Sanitize filename
    const sanitizedFilename = sanitizeFilename(file.name)

    return {
      valid: true,
      detectedType: detectedType.mime,
      sanitizedFilename,
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to validate file content',
    }
  }
}

/**
 * Sanitizes filename to prevent directory traversal and injection attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const basename = filename.split(/[/\\]/).pop() || 'file'

  // Remove dangerous characters, keep only alphanumeric, dash, underscore, dot
  const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, '_')

  // Prevent multiple dots (potential extension confusion)
  const parts = sanitized.split('.')
  if (parts.length > 2) {
    const ext = parts.pop()
    const name = parts.join('_')
    return `${name}.${ext}`
  }

  return sanitized
}

/**
 * Generates a safe upload path with sanitization
 */
export function generateUploadPath(
  userId: string,
  filename: string,
  prefix: string = 'file'
): { path: string; error?: string } {
  // Validate userId format (should be UUID)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(userId)) {
    return { path: '', error: 'Invalid user ID format' }
  }

  // Extract and validate extension
  const ext = filename.split('.').pop()?.toLowerCase() || 'bin'
  const allowedExtensions = Object.keys(EXTENSION_TO_MIME)

  if (!allowedExtensions.includes(ext)) {
    return { path: '', error: 'Invalid file extension' }
  }

  // Generate unique filename with timestamp
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const safeFilename = `${prefix}_${timestamp}_${randomStr}.${ext}`

  return { path: `${userId}/${safeFilename}` }
}

/**
 * Validates that a custom upload path is safe
 */
export function validateUploadPath(
  path: string,
  userId: string
): { valid: boolean; error?: string } {
  // Must start with user's own directory or groups directory
  if (!path.startsWith(`${userId}/`) && !path.startsWith('groups/')) {
    return {
      valid: false,
      error: 'Upload path must be within your user directory or groups directory',
    }
  }

  // Prevent directory traversal
  if (path.includes('..') || path.includes('//')) {
    return {
      valid: false,
      error: 'Invalid path: directory traversal detected',
    }
  }

  // Validate path components
  const pathComponents = path.split('/')
  for (const component of pathComponents) {
    if (component === '' || component === '.' || component === '..') {
      return { valid: false, error: 'Invalid path component' }
    }
  }

  return { valid: true }
}
