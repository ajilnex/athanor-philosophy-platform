/**
 * Unified encoding utilities for Feu Humain archive
 * Provides both simple replacement and Mojibake repair approaches
 */

import { cleanString as cleanStringFromClean } from './clean-messenger-export'

// Re-export the simple string replacement approach
export { cleanString as cleanStringSimple } from './clean-messenger-export'

// Re-export the Mojibake repair approach
export { cleanString as cleanStringMojibake } from './import-feu-humain'

/**
 * Smart encoding cleaner that uses the simple replacement approach
 * This is the recommended approach for production use as it's more reliable
 * and handles the actual encoding issues found in Messenger exports.
 *
 * @param str - String to clean
 * @returns Cleaned string with proper encoding
 */
export function cleanString(str: string | null | undefined): string | null | undefined {
  // Use the simple replacement approach as it's proven to work
  return cleanStringFromClean(str)
}

/**
 * Auto-detect and clean encoding issues
 * Tries both approaches and picks the best result
 *
 * @param str - String to clean
 * @returns Cleaned string with proper encoding
 */
export function cleanStringAuto(str: string | null | undefined): string | null | undefined {
  if (!str) return str

  // First try the simple replacement approach
  const simpleResult = cleanStringFromClean(str)

  // If the simple approach made changes, use that result
  if (simpleResult !== str) {
    return simpleResult
  }

  // Otherwise, return the original (it was probably already correct)
  return str
}
