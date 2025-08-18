These examples should be used as guidance when configuring Sentry functionality within this project (Next.js App Router).

# Exception Catching

Use `Sentry.captureException(error)` to capture an exception and log the error in Sentry.
Use this in try/catch blocks or areas where exceptions are expected.

# Tracing Examples

Spans should be created for meaningful actions within the app like button clicks, API calls, and function calls.
Use `Sentry.startSpan` to create a span. Child spans can exist within a parent span.

## Custom Span in component actions

```tsx
import * as Sentry from '@sentry/nextjs'

function TestComponent() {
  const handleClick = () => {
    Sentry.startSpan({ op: 'ui.click', name: 'Test Button Click' }, span => {
      span.setAttribute('config', 'some config')
      span.setAttribute('metric', 'some metric')
      // business logic here
    })
  }

  return <button onClick={handleClick}>Test Sentry</button>
}
```

## Custom Span in API calls

```ts
import * as Sentry from '@sentry/nextjs'

export async function fetchUserData(userId: string) {
  return Sentry.startSpan({ op: 'http.client', name: `GET /api/users/${userId}` }, async () => {
    const res = await fetch(`/api/users/${userId}`)
    return res.json()
  })
}
```

# Logs

Import Sentry via `import * as Sentry from '@sentry/nextjs'`.
Enable logs via env: set `SENTRY_ENABLE_CONSOLE_LOGS=1` (already supported by this repo).
Console logs can be forwarded to Sentry using `Sentry.consoleLoggingIntegration` (enabled automatically when the env var is set).

## Baseline

Initialization lives in:

- `instrumentation.ts` (loader)
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

Do not re-initialize Sentry elsewhere. Use `import * as Sentry from '@sentry/nextjs'` where needed.
