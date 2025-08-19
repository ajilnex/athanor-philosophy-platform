import { NextResponse } from 'next/server'

function parseFromDsn(dsn: string): { host: string; projectId: string; publicKey: string } | null {
  try {
    const u = new URL(dsn)
    const host = u.host
    const projectId = u.pathname.replace(/^\/+/, '').split('/')[0] || ''
    const publicKey = u.username || ''
    if (!host || !projectId || !publicKey) return null
    return { host, projectId, publicKey }
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
  if (!dsn) {
    return NextResponse.json({ error: 'SENTRY_DSN not configured' }, { status: 400 })
  }

  const parsed = parseFromDsn(dsn)
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid Sentry DSN' }, { status: 400 })
  }

  const { host, projectId, publicKey } = parsed
  const envelope = await req.text()

  // Include sentry_key in query and X-Sentry-Auth header for robustness
  const ingestUrl = `https://${host}/api/${projectId}/envelope/?sentry_key=${publicKey}&sentry_version=7`

  const res = await fetch(ingestUrl, {
    method: 'POST',
    body: envelope,
    headers: {
      'content-type': 'application/x-sentry-envelope',
      'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=relay-tunnel, sentry_key=${publicKey}`,
    },
  })

  const out = new NextResponse(null, { status: res.status })
  out.headers.set('x-sentry-proxy', '1')
  out.headers.set('x-upstream-status', String(res.status))
  return out
}

export const dynamic = 'force-dynamic'
