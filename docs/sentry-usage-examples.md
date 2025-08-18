# Sentry Usage Examples (Athanor)

Use these snippets as a quick reference when adding observability.

## Capture an exception

```ts
import * as Sentry from '@sentry/nextjs'

try {
  riskyThing()
} catch (err) {
  Sentry.captureException(err)
}
```

## UI click span

```tsx
import * as Sentry from '@sentry/nextjs'

export function ButtonObserved() {
  return (
    <button
      onClick={() =>
        Sentry.startSpan({ op: 'ui.click', name: 'Observed Button' }, () => doSomething())
      }
    >
      Run
    </button>
  )
}
```

## Fetch with tracing

```ts
import * as Sentry from '@sentry/nextjs'

export async function fetchJson(url: string, init?: RequestInit) {
  return Sentry.startSpan({ op: 'http.client', name: `GET ${url}` }, async () => {
    const res = await fetch(url, init)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  })
}
```

## Enable console logs forwarding (optional)

Set `SENTRY_ENABLE_CONSOLE_LOGS=1` in env to forward `console.log/warn/error` to Sentry and enable internal logs.
