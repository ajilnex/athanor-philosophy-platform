// Next.js App Router instrumentation file.
// Loaded by Next.js during server and client startup.

export async function register() {
  // No instrumentation needed after Sentry removal
}

// Handle errors from nested React Server Components
export function onRequestError(err: unknown) {
  // Log error to console (Sentry removed)
  console.error('Request error:', err)
}
