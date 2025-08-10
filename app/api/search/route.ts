import { NextRequest, NextResponse } from 'next/server'
import { getAllBillets } from '@/lib/billets'

interface BilletResult {
  type: 'billet'
  slug: string
  title: string
  date: string
  tags: string[]
  excerpt: string
}

// Normalize text for search (remove accents, lowercase)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics/accents
    .trim()
}

// Extract meaningful excerpt from content
function extractExcerpt(content: string, maxLength = 200): string {
  // Remove HTML tags and markdown syntax
  const cleanContent = content
    .replace(/<[^>]*>/g, '') // Remove HTML
    .replace(/#{1,6}\s+/g, '') // Remove markdown headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
    .trim()

  if (cleanContent.length <= maxLength) {
    return cleanContent
  }

  // Find a good breaking point (sentence or word boundary)
  const truncated = cleanContent.substring(0, maxLength)
  const lastSentence = truncated.lastIndexOf('.')
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSentence > maxLength * 0.6) {
    return cleanContent.substring(0, lastSentence + 1)
  } else if (lastSpace > maxLength * 0.8) {
    return cleanContent.substring(0, lastSpace) + '…'
  } else {
    return truncated + '…'
  }
}

// Check if text matches query
function textMatches(text: string, normalizedQuery: string): boolean {
  const normalizedText = normalizeText(text)
  return normalizedText.includes(normalizedQuery)
}

// Calculate relevance score
function calculateScore(billet: any, normalizedQuery: string): number {
  let score = 0

  // Title match (highest weight)
  if (textMatches(billet.title, normalizedQuery)) {
    score += 10
  }

  // Excerpt match (medium weight)
  if (billet.excerpt && textMatches(billet.excerpt, normalizedQuery)) {
    score += 5
  }

  // Content match (lower weight)
  if (textMatches(billet.content, normalizedQuery)) {
    score += 2
  }

  // Tag match (medium-high weight)
  if (billet.tags) {
    for (const tag of billet.tags) {
      if (textMatches(tag, normalizedQuery)) {
        score += 7
      }
    }
  }

  return score
}

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q')

    // Validate query
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
    }

    if (query.trim().length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters long' }, { status: 400 })
    }

    const normalizedQuery = normalizeText(query.trim())

    // Get all billets
    const billets = await getAllBillets()

    // Filter and score results
    const searchResults: (BilletResult & { score: number })[] = []

    for (const billet of billets) {
      const score = calculateScore(billet, normalizedQuery)
      
      if (score > 0) {
        searchResults.push({
          type: 'billet',
          slug: billet.slug,
          title: billet.title,
          date: billet.date,
          tags: billet.tags || [],
          excerpt: billet.excerpt || extractExcerpt(billet.content),
          score
        })
      }
    }

    // Sort by relevance score (highest first) and limit results
    const sortedResults = searchResults
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
      .map(({ score, ...result }) => result) // Remove score from response

    return NextResponse.json({
      results: sortedResults,
      query: query.trim(),
      total: sortedResults.length
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}