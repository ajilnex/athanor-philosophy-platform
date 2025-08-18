import { NextResponse } from 'next/server'

function parseProjectIdFromDsn(dsn: string): { host: string; projectId: string } | null {
  try {
    const url = new URL(dsn)
    const host = url.host
    const path = url.pathname.replace(/^\/+/, '')
    const projectId = path.split('/')[0]
    if (!projectId) return null
    return { host, projectId }
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
  if (!dsn) {
    return NextResponse.json({ error: 'SENTRY_DSN not configured' }, { status: 400 })
  }

  const parsed = parseProjectIdFromDsn(dsn)
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid Sentry DSN' }, { status: 400 })
  }

  const { host, projectId } = parsed

  const envelope = await req.text()
  const ingestUrl = `https://${host}/api/${projectId}/envelope/`

  const res = await fetch(ingestUrl, {
    method: 'POST',
    body: envelope,
    headers: {
      'content-type': req.headers.get('content-type') || 'application/x-sentry-envelope',
    },
    // No credentials; simple relay
  })

  return new NextResponse(null, { status: res.status })
}

export const dynamic = 'force-dynamic'
