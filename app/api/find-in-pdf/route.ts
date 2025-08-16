import { NextRequest, NextResponse } from 'next/server'
import { findInPdf } from '@/lib/pdf.server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const q = searchParams.get('q')

    if (!url || !q) {
      return NextResponse.json({ error: 'Missing required parameters: url and q' }, { status: 400 })
    }

    // Recherche le terme dans le PDF
    const result = await findInPdf(url, q)

    if (result === null) {
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
    console.error('Error in find-in-pdf API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
