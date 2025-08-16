import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import * as path from 'path'
import matter from 'gray-matter'

export const dynamic = 'force-dynamic'

interface SnippetResponse {
  [id: string]: {
    snippet: string
    hasMatch: boolean
    title: string
    type: 'billet' | 'publication'
  }
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractSnippet(
  text: string,
  searchTerm: string,
  contextLength: number = 200
): { snippet: string; hasMatch: boolean } {
  if (!searchTerm.trim()) {
    return {
      snippet: text.substring(0, contextLength) + '...',
      hasMatch: false,
    }
  }

  // Normalize text and search term
  const normalizedText = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  const normalizedTerm = searchTerm
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  // Find first occurrence
  const index = normalizedText.indexOf(normalizedTerm)

  if (index === -1) {
    return {
      snippet: text.substring(0, contextLength) + '...',
      hasMatch: false,
    }
  }

  // Calculate context window
  const halfContext = Math.floor(contextLength / 2)
  const start = Math.max(0, index - halfContext)
  const end = Math.min(text.length, index + normalizedTerm.length + halfContext)

  // Extract snippet from original text (preserves case and accents)
  let snippet = text.substring(start, end)

  // Add ellipsis if truncated
  if (start > 0) snippet = '...' + snippet
  if (end < text.length) snippet = snippet + '...'

  // Highlight all occurrences of search term (case insensitive)
  const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi')
  snippet = snippet.replace(regex, '<strong class="bg-yellow-200 px-1 rounded">$1</strong>')

  return { snippet, hasMatch: true }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const idsParam = searchParams.get('ids')

    if (!query || !idsParam) {
      return NextResponse.json({ error: 'Missing query or ids parameter' }, { status: 400 })
    }

    const ids = idsParam.split(',').filter(id => id.trim())
    if (ids.length === 0) {
      return NextResponse.json({} as SnippetResponse)
    }

    console.log(`🔍 Generating snippets for query: "${query}" with ${ids.length} documents`)

    const response: SnippetResponse = {}

    // Process each document ID
    for (const id of ids) {
      try {
        if (id.startsWith('billet-')) {
          // Handle billet with real file content
          const slug = id.replace('billet-', '')
          const filePath = path.join(process.cwd(), 'content', 'billets', `${slug}.mdx`)

          try {
            const fileContent = await fs.readFile(filePath, 'utf8')
            const { data, content } = matter(fileContent)

            const fullText = `${data.title || ''} ${content}`
            const { snippet, hasMatch } = extractSnippet(fullText, query, 300)

            response[id] = {
              snippet,
              hasMatch,
              title: data.title || slug,
              type: 'billet',
            }
          } catch (error) {
            console.warn(`⚠️  Could not read billet: ${slug}`)
            response[id] = {
              snippet: 'Contenu non disponible',
              hasMatch: false,
              title: slug,
              type: 'billet',
            }
          }
        } else if (id.startsWith('publication-')) {
          // For now, use mock data for publications until we fix PDF processing
          const publicationId = id.replace('publication-', '')
          const mockText = `Contenu de la publication ${publicationId}. Le terme ${query} apparaît dans ce document PDF.`
          const { snippet, hasMatch } = extractSnippet(mockText, query, 400)

          response[id] = {
            snippet,
            hasMatch,
            title: `Publication ${publicationId}`,
            type: 'publication',
          }
        }
      } catch (error) {
        console.warn(`⚠️  Error processing document ${id}:`, error)
        response[id] = {
          snippet: 'Erreur lors du traitement',
          hasMatch: false,
          title: 'Document',
          type: id.startsWith('billet-') ? 'billet' : 'publication',
        }
      }
    }

    console.log(`✅ Generated ${Object.keys(response).length} snippets`)
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Snippets API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
