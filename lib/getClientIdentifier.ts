/**
 * Helper to extract client identifier from request for rate limiting
 */
import { NextRequest } from 'next/server'

export function getClientIdentifier(req: NextRequest): string {
  // Try to get real IP from headers (for proxied requests)
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = req.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a generic identifier
  // In production behind Vercel/proxy, x-forwarded-for should always be set
  return 'anonymous'
}
