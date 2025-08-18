// Next.js App Router instrumentation file for Sentry.
// Loaded by Next.js during server and client startup.

import * as Sentry from '@sentry/nextjs'

export async function register() {
  // Determine runtime and load the appropriate Sentry config.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  } else if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  } else {
    await import('./sentry.client.config')
  }
}

// Capture errors from nested React Server Components
// See: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#errors-from-nested-react-server-components
export function onRequestError(err: unknown) {
  // Fallback to standard exception capture to avoid type mismatch
  Sentry.captureException(err)
}
