import * as Sentry from '@sentry/nextjs'

// Initialize Sentry on the client. Keep defaults conservative; override via env.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  enabled:
    process.env.NODE_ENV === 'production' &&
    Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
  tunnel: '/api/sentry',
  // Enable session replay on errors only by default; can be tuned via env
  replaysOnErrorSampleRate: Number(process.env.SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE ?? 1.0),
  replaysSessionSampleRate: Number(process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE ?? 0.0),
  environment: process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || process.env.NODE_ENV,
  // Optional developer logging and console capture
  _experiments: {
    enableLogs: process.env.SENTRY_ENABLE_CONSOLE_LOGS === '1',
  },
  integrations: [
    ...(process.env.SENTRY_ENABLE_CONSOLE_LOGS === '1'
      ? [Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] })]
      : []),
  ],
})
