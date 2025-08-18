import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled:
    process.env.NODE_ENV === 'production' &&
    Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
  // Capture server performance traces
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
  tunnel: '/api/sentry',
  environment: process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || process.env.NODE_ENV,
  _experiments: {
    enableLogs: process.env.SENTRY_ENABLE_CONSOLE_LOGS === '1',
  },
  integrations: [
    ...(process.env.SENTRY_ENABLE_CONSOLE_LOGS === '1'
      ? [Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] })]
      : []),
  ],
  // Reduce noise on local/dev
  beforeSend(event) {
    if (process.env.NODE_ENV !== 'production') {
      return null
    }
    return event
  },
})
