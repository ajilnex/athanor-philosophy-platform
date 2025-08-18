// Next.js App Router instrumentation file for Sentry.
// Loaded by Next.js during server and client startup.

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
