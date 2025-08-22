import { NextRequest, NextResponse } from 'next/server'
import { findInPdf } from '@/lib/pdf.server'
import { rateLimit } from '@/lib/rate-limit'

// Rate limiting: 10 requêtes par minute par IP
const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500, // Max 500 unique IPs per interval
})

export async function GET(request: NextRequest) {
  // 1. Rate Limiting
  const clientIp = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown'
  try {
    await limiter.check(clientIp, 10) // 10 requests per minute
  } catch {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const q = searchParams.get('q')

    if (!url || !q) {
      return NextResponse.json({ error: 'Missing required parameters: url and q' }, { status: 400 })
    }

    // 2. Log the request for audit purposes
    console.log(`[AUDIT] PDF search request from ${clientIp} for URL: ${url}`)

    // 3. Call the now-secure server-side function
    const result = await findInPdf(url, q)

    if (result === null) {
      // The error is already logged inside pdf.server.ts, return a generic error
      return NextResponse.json({ error: 'Error processing PDF' }, { status: 500 })
    }

    if (!result.found) {
      return NextResponse.json({
        found: false,
        message: 'Search term not found in PDF',
      })
    }

    return NextResponse.json({
      found: true,
      pageNumber: result.pageNumber,
      snippet: result.snippet,
      context: result.context,
    })
  } catch (error) {
    // 4. Generic error handling to avoid leaking implementation details
    console.error('[API_ERROR] Unhandled error in find-in-pdf API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
