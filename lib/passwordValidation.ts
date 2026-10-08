/**
 * Password validation utilities
 */

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validates password strength according to security requirements
 *
 * Requirements:
 * - Minimum 10 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = []

  // Minimum length
  if (password.length < 10) {
    errors.push('Password must be at least 10 characters long')
  }

  // Maximum length (reasonable limit to prevent DoS)
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters')
  }

  // Uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  // Lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  // Number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  // Special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Check if password contains common patterns that should be avoided
 */
export function checkCommonPasswords(password: string): boolean {
  const commonPasswords = [
    'password',
    'Password123!',
    'Qwerty123!',
    '123456',
    'admin',
    'letmein',
    'welcome',
  ]

  const lowerPassword = password.toLowerCase()
  return commonPasswords.some(common => lowerPassword.includes(common.toLowerCase()))
}

/**
 * Get password strength score (0-4)
 * 0 = Very Weak, 1 = Weak, 2 = Fair, 3 = Good, 4 = Strong
 */
export function getPasswordStrength(password: string): {
  score: number
  label: string
} {
  let score = 0

  // Length bonus
  if (password.length >= 10) score++
  if (password.length >= 12) score++
  if (password.length >= 16) score++

  // Character variety
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++

  // Penalty for common passwords
  if (checkCommonPasswords(password)) {
    score = Math.max(0, score - 2)
  }

  // Cap at 4
  score = Math.min(4, score)

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  return {
    score,
    label: labels[score],
  }
}
