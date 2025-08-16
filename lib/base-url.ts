// lib/base-url.ts
// Helper to safely build absolute URLs during build and runtime

export function getBaseUrl(): string {
  // Prefer explicit public site URL if set
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)

  // Never return empty/undefined during build - fallback to localhost
  return envUrl || 'http://localhost:3000'
}

// When you need to build an absolute URL safely
export function toAbsolute(path: string = '/'): string {
  const base = getBaseUrl()

  // Handle empty or relative paths safely
  if (!path || path === '') {
    path = '/'
  }

  // If path is already absolute, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  // Ensure path starts with /
  if (!path.startsWith('/')) {
    path = '/' + path
  }

  try {
    // Build absolute URL safely
    return new URL(path, base).toString()
  } catch (error) {
    console.warn('Failed to build absolute URL:', { path, base, error })
    // Fallback: just concatenate safely
    return base.replace(/\/$/, '') + path
  }
}
